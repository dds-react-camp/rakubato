import random
import os
import json
import re
import asyncio
import uuid
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta, timezone

import vertexai
from vertexai.generative_models import GenerativeModel, Tool, FunctionDeclaration, Part
from vertexai.preview.vision_models import ImageGenerationModel

from google.cloud import storage
from google.oauth2 import service_account
from google.auth import default, impersonated_credentials
from googleapiclient.discovery import build
from google import genai
from google.genai import types as genai_types
from urllib.parse import urlparse

from app.schemas.product import Product
from app.core.config import settings

# Define the function declarations
navigate_func = FunctionDeclaration(
    name="navigate",
    description="ユーザーをアプリケーションの新しい画面に遷移させます。",
    parameters={
        "type": "object",
        "properties": {
            "path": {
                "type": "string",
                "description": "遷移先のパス。例: /comparison, /products/p123"
            }
        },
        "required": ["path"]
    },
)

youtube_search_func = FunctionDeclaration(
    name="search_youtube_videos",
    description="YouTubeで動画を検索します。",
    parameters={
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "YouTubeで検索するキーワード。日本語で指定します。"
            }
        },
        "required": ["query"]
    }
)

class AnalyzeNeedsService:
    def __init__(self, project_id: str, location: str):
        self.project_id = project_id
        self.location = location

        # Explicitly create credentials from the service account file if provided
        self.credentials = None
        if settings.GOOGLE_APPLICATION_CREDENTIALS:
            try:
                self.credentials = service_account.Credentials.from_service_account_file(
                    settings.GOOGLE_APPLICATION_CREDENTIALS
                )
            except Exception as e:
                print(f"ERROR: Failed to create credentials from file specified in GOOGLE_APPLICATION_CREDENTIALS: {e}")

        vertexai.init(project=self.project_id, location=self.location, credentials=self.credentials)
        
        # Initialize clients with credentials
        self.storage_client = storage.Client(credentials=self.credentials)
        if settings.YOUTUBE_API_KEY:
            self.youtube = build("youtube", "v3", developerKey=settings.YOUTUBE_API_KEY)
        else:
            self.youtube = None

        # Initialize the client for Google AI (for Veo)
        try:
            self.genai_client = genai.Client(
                project=self.project_id, 
                location=self.location, 
                vertexai=True
            )
        except Exception as e:
            print(f"ERROR: Failed to initialize genai.Client: {e}")
            self.genai_client = None

        # Combine tools
        combined_tool = Tool(function_declarations=[navigate_func, youtube_search_func])

        # Let the model know about the tools it can use
        self.model = GenerativeModel(
            "gemini-2.5-flash", 
            tools=[combined_tool]
        )

    def _search_youtube(self, query: str) -> List[Dict[str, Any]]:
        """Performs a YouTube search and returns video details."""
        if not self.youtube:
            return [{"error": "YouTube API key is not configured."}]
        try:
            search_response = self.youtube.search().list(
                q=query,
                part="snippet",
                type="video",
                maxResults=5,
                regionCode="JP",
                relevanceLanguage="ja"
            ).execute()

            videos = []
            for item in search_response.get("items", []):
                videos.append({
                    "title": item["snippet"]["title"],
                    "videoId": item["id"]["videoId"],
                    "channelTitle": item["snippet"]["channelTitle"],
                })
            return videos
        except Exception as e:
            print(f"Error searching YouTube: {e}")
            return []

    async def generate_chat_response(
        self, 
        message: str, 
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Generates a chat response using the Vertex AI Gemini API."""
        try:
            prompt = f'''
                # 命令書

                あなたは、ユーザーの購入活動を支援する優秀なショッピングアドバイザーです。
                ユーザーが入力した検討中の商品について、YouTubeのレビュー動画を多角的に調査・分析し、ユーザーが自身のニーズに合った最適な商品を選べるようにサポートしてください。

                実行ステップ:


                1.  **キーワードの受け取り**: ユーザーから商品名やカテゴリを受け取ります。
                2.  **YouTubeでの動画検索**: `search_youtube_videos` ツールを使って、関連性の高いレビュー動画を検索します。検索クエリは具体的に、例えば「[商品名] レビュー」のようにします。
                3.  **レビュー動画の分析**: (これは概念的なステップです。実際に動画を視聴するわけではありません) 検索結果の動画タイトルやスニペットから、その動画が肯定的な意見か、否定的な意見か、あるいは中立的な比較レビューなのかを判断します。
                4.  **情報の統合と要約**: 複数のレビュー動画から得られた情報を統合し、各商品の長所と短所を客観的にまとめて、カテゴライズします。
                5.  **最終的な提案**: 分析結果に基づいて、求める商品タイプを提案します。
                ---

                {{以下はインプットとアウトプットの例であり、実際の回答に含める必要はありません。}}

                ### 具体的なユーザー入力例

                ユーザー入力例:
                「ソニーのヘッドホン、WH-1000XM5を買おうか悩んでいます。」

                ### 具体的なアウトプットの例

                AIの思考プロセス例（非表示）:
                *   YouTubeで「WH-1000XM5 レビュー」を検索。
                *   複数の動画を分析。「ノイズキャンセリングは最強クラス」「音質も良いが、もっと音楽鑑賞に特化したモデルもある」「価格が高い」「BoseやSennheiserが競合としてよく挙
                げられる」「装着感や携帯性も重要な比較ポイント」といった情報を得る。
                *   これらの情報から、「ノイズキャンセリング性能」「音質」「コストパフォーマンス」「携帯性」といった選び方の軸を抽出する。


                AIの最終的なアウトプット例（ユーザーへの提示内容）:
                「承知いたしました。ソニーのWH-1000XM5ですね。様々なレビューを拝見したところ、素晴らしい製品ですが、購入された方がどのような点を重視するかによって、さらに満足度の
                高い選択肢がありそうです。

                もしよろしければ、あなたがヘッドホンに最も求める「方向性」は以下のどれに近いか教えていただけますか？」


                A. 静寂性を最優先するタイプ: とにかく周囲の騒音を消すことを最優先し、業界最高レベルのノイズキャンセリング性能を求める。


                B. 音質を最優先するタイプ:
                ノイズキャンセリング性能も重要だが、それ以上に音楽への深い没入感や、アーティストの息遣いまで感じられるような繊細な音の表現力を重視する。


                C. バランスと携帯性を重視するタイプ: 高い性能は維持しつつ、日常的に長時間利用しても疲れにくい軽さや、カバンにすっきり収まるコンパクトさも同じくらい大切にする。

                D. コストパフォーマンスを重視するタイプ: 最新・最高の機能にはこだわらず、十分な性能を持ちながらも、価格とのバランスが取れた賢い選択をしたい。
                ---
                では、始めましょう。私が最初にお願いしたい商品はこちらです：
                {message}
                '''
            
            chat = self.model.start_chat()
            response = await chat.send_message_async(prompt)
            
            res_text = ""
            res_nav = None

            for part in response.candidates[0].content.parts:
                if part.function_call:
                    if part.function_call.name == "navigate":
                        res_nav = part.function_call.args.get("path")
                    elif part.function_call.name == "search_youtube_videos":
                        query = part.function_call.args.get("query")
                        search_results = self._search_youtube(query)
                        
                        # Send search results back to the model
                        response = await chat.send_message_async(
                            Part.from_function_response(
                                name="search_youtube_videos",
                                response={
                                    "content": {"videos": search_results},
                                }
                            )
                        )
                        # Process the new response after providing tool output
                        for new_part in response.candidates[0].content.parts:
                            if hasattr(new_part, 'text') and new_part.text:
                                res_text += new_part.text

                elif hasattr(part, 'text') and part.text:
                    res_text += part.text
            
            if res_nav and not res_text:
                res_text = f"{res_nav} に移動します。"

            return {"message": res_text, "navigateTo": res_nav}

        except Exception as e:
            print(f"Error calling Vertex AI: {e}")
            return {"message": "AIとの接続中にエラーが発生しました。", "navigateTo": None}

    async def _analyze_user_needs(self, product_category: str) -> dict:
        """ユーザーの潜在的なニーズを分析し、ユーザータイプを提示する"""
        print(f"[分析エージェント] カテゴリ「{product_category}」の潜在ニーズを分析中...")
        try:
            # Use a model without function calling for this specific task
            model = GenerativeModel("gemini-2.5-flash")
            prompt = f'''あなたは、顧客の潜在的なニーズを分析し、具体的な商品を例示するプロのマーケティングアナリストです。

顧客が「{product_category}」の購入を検討しています。

顧客が自身の好みを理解できるように、選択の軸となる「ユーザータイプ」を4〜5つ提示してください。
各タイプには、その特徴を表すタグと、そのタイプを代表する具体的な商品名を1〜3個例示してください。

結果は、必ず以下のJSONスキーマに従った単一のJSONオブジェクトとして出力してください。

【出力JSONスキーマ】
{{
  "user_archetypes": [
    {{
      "id": "ランダムなユニークID文字列",  # UUIDのようなランダムな文字列
      "name": "携帯性重視タイプ", 
      "description": "カフェや出張先など、どこへでも持ち運びたい。軽さと薄さを最優先するあなたへ。", 
      "characteristics": ["軽量", "薄型", "長時間バッテリー"],
      "sampleProducts": ["HP Pavilion Aero 13-bg", "MacBook Air"]
    }}
  ]
}}'''

            response = await model.generate_content_async([prompt])
            
            if not response or not response.text:
                raise ValueError("AIモデルから空の応答が返されました。")

            response_text = response.text.strip()
            # Find the start and end of the JSON object
            start_index = response_text.find('{')
            end_index = response_text.rfind('}')
            
            if start_index != -1 and end_index != -1:
                json_string = response_text[start_index:end_index+1]
            else:
                json_string = response_text

            try:
                json_response = json.loads(json_string)
            except json.JSONDecodeError as e:
                raise ValueError(f"AIモデルの応答をJSONとして解析できませんでした。生の応答: {response_text}") from e

            print(f"[分析エージェント] 分析が完了しました。")
            return json_response

        except Exception as e:
            raise ValueError(f"分析中に予期せぬ問題が発生しました: {e}")

    async def _generate_image_prompts_async(self, product_description: str) -> dict:
        """Generates optimized prompts for image generation."""
        def get_policy_text():
            """Mock tool to get policy text."""
            return """商標、個人特定、センシティブな表現は避けてください。"""

        get_policy_text_tool = FunctionDeclaration(
            name="get_policy_text",
            description="画像生成で遵守すべきルールを取得します。",
            parameters={
                "type": "object",
                "properties": {}
            }
        )

        model = GenerativeModel(
            "gemini-2.0-flash-lite-001",
            tools=[Tool([get_policy_text_tool])]
        )

        chat = model.start_chat()

        prompt = f'''あなたの主目的：入力テキストから「コマースサイトの商品紹介」に使える、
高度にデフォルメされた概念イラストを生成するための
「ポジティブ（生成したい要素）」と「ネガティブ（除外したい要素）」の
2つの最適化されたプロンプトを出力してください。

必須手順（順に実行すること）:
1) 最初に get_policy_text ツールを呼び出して policy_text を取得し、画像生成で遵守すべきルール（商標、個人特定、センシティブ表現など）を把握する。
2) 入力テキストを読み、そこから表現すべき「概念としての商品主題（primary subject）」を抽出または概念化する。主題は必ず以下を満たすこと:
   - 入力テキストの特徴（例: スタイリッシュ、シンプルな操作、直感的なUX、年齢層への訴求など）を視覚的に強調して表現できること。漫画風のエフェクトやシンボルを活用してもよい。
   - 特定ブランドや実在の個人を連想させない（非特定化）こと
   - コマース向けに魅力的でクリックされやすい表現（かわいい3D、やわらかい雰囲気）であること
3) 主題を基に、ポジティブプロンプトを作成する。必ず以下を含める:
   - デフォルメ度合いは「かわいい3Dアニメ」スタイルで、やわらかい質感と明るい色使いを基本とすること
   - 主な視覚要素（商品概念の象徴的なモチーフ、シンプル化されたスイッチ表現、笑顔の非特定人物など）
   - 色調とコントラスト（やわらかいパステルカラーを基調とし、コマースで目を引く配色）、余白（テキスト領域を想定）
   - 出力先が商品紹介であることを意識した解像度・ディテール指示（高解像度、滑らかな曲線）
4) policy_text に基づくネガティブプロンプトをつくり、禁止要素や望ましくない表現（特定ブランドロゴ、著名人物、過度な裸体・暴力、個人特定につながる顔の詳細など）と生成アーティファクト（ぼやけ、ウォーターマーク、低解像度）を明示的に排除する。
5) 最終出力は以下のJSONスキーマに厳密に従って返すこと（JSON 以外の説明を付けない）:

{{
  "subject": "<抽出した概念的な主題（短文）>",
  "positive_prompt": "<Imagen 用に最適化された日本語/英語のプロンプト（商品のスタイル、色、構図、質感などを詳細に記述）>",
  "negative_prompt": "<除外したい要素の列挙（policy に基づく禁止要素・生成アーティファクト等）>",
  "composition": "<商品の見せ方：中央配置か左寄せか、余白、アスペクト比の指定>",
  "style": "<かわいい3Dアニメスタイル（固定）と、トーン（ポップ/落ち着いた等）>",
  "policy_checks": "<policy_text に基づき特に注意した点の簡潔な箇条書き>",
  "rationale": "<選択した主題・スタイル・除外理由（1～2文）>"
}}

出力ルール（厳守）:
- subject は入力に忠実で簡潔に（概念を示す短いフレーズ）。
- positive_prompt は「一目で特徴が分かる」ことを最優先に、デフォルメの度合い・視覚的記号（簡略化されたスイッチ、笑顔の非特定人物、アイコン的な歯ブラシ形状など）・配色・照明・アスペクト比・余白指示を盛り込む。
- negative_prompt は policy_text に基づき特定ブランドや個人が連想される要素、現実的すぎる写実表現（特定化を招く）やNSFW・暴力表現・ウォーターマーク・署名などを必ず除外する。英語以外のテキストは入れない。
- composition はコマースのレイアウト（商品画像の向き、傾き、配置を考慮）を明示する。
- style はデフォルメ方式と感情的トーン（例: フレンドリーで安心感のあるポップ）を明示する。
- policy_checks には get_policy_text から抜き出した重要ルールと、それに対してどのように対応したかを短く記載する。
- 返答は余計な説明を含めず、上記JSON のみを返すこと。

例（参考、実際の返答では JSON のみを出力）:
{{
  "subject": "丸みをおびたかわいいフォルムのスマートフォンに表示された、シンプルな操作のアプリ（概念）",
  "positive_prompt": "A cute, friendly 3D character with big eyes, in a soft, pastel-colored world. The character is smiling and pointing to a simple, intuitive app interface on a smartphone screen. The style is clean, with soft lighting and a shallow depth of field. 3D rendered, high-resolution, vibrant, and cheerful.",
  "negative_prompt": "no brand logos, no identifiable faces, no photorealism, no complex details, no dark colors, no text overlays, no watermark, low-res, blurry, gore, nsfw",
  "composition": "スマートフォンを中央に配置し、視線がスマートフォンの画面に向かうように構図を調整。背景はシンプルで、アプリが際立つようにする。",
  "style": "3D animation / soft and friendly tone",
  "policy_checks": "ブランド・人物特定を避ける（policy_text 準拠）",
  "rationale": "親しみやすい3Dアニメ風のデフォルメとシンプルな構成で、アプリの使いやすさと楽しさを視覚的に伝えることを目的とした。"
}}

入力テキスト: {product_description}
'''
        response = await chat.send_message_async(prompt)

        part = response.candidates[0].content.parts[0]

        if part.function_call:
            function_call = part.function_call
            if function_call.name == "get_policy_text":
                policy_text = get_policy_text()
                response = await chat.send_message_async(
                    Part.from_function_response(
                        name="get_policy_text",
                        response={
                            "content": policy_text,
                        }
                    ),
                )
                try:
                    response_text = response.text.strip()
                    match = re.search(r"```json\s*(\{.*\})\s*```", response_text, re.DOTALL)
                    if match:
                        response_text = match.group(1)
                    return json.loads(response_text)
                except (json.JSONDecodeError, AttributeError):
                    return {"error": "Failed to get valid JSON response from prompt generation agent after tool call."}
        
        try:
            response_text = response.text.strip()
            match = re.search(r"```json\s*(\{.*\})\s*```", response_text, re.DOTALL)
            if match:
                response_text = match.group(1)
            return json.loads(response_text)
        except (json.JSONDecodeError, AttributeError):
            return {"error": "Failed to get valid JSON response from prompt generation agent."}

    async def _generate_image_async(self, archetype: dict, session_id: str) -> Optional[str]:
        """イメージ生成エージェント: 各タイプを象徴する商品を、単色のイラスト調で生成し、GCSに保存する"""
        archetype_id = archetype.get("id", "unknown")
        print(f"[画像生成エージェント] タイプID: {archetype_id} の画像生成を開始...")
        try:
            product_description = archetype.get('description', 'a generic product')
            prompt_generation_result = await self._generate_image_prompts_async(product_description)

            if "error" in prompt_generation_result:
                print(f"[画像生成エージェント] プロンプト生成に失敗しました: {prompt_generation_result['error']}")
                return None

            image_prompt = prompt_generation_result.get("positive_prompt")
            if not image_prompt:
                print(f"[画像生成エージェント] ポジティブプロンプトが生成されませんでした。")
                return None

            model = ImageGenerationModel.from_pretrained("imagen-4.0-fast-generate-001")
            
            response = None
            max_retries = 3
            retry_delay = 2  # seconds
            for attempt in range(max_retries):
                try:
                    response = await asyncio.to_thread(
                        model.generate_images,
                        prompt=image_prompt,
                        number_of_images=1
                    )
                    if response and response.images:
                        break  # Success
                    else:
                        # This case handles when generate_images returns a response with no images, but doesn't throw an exception.
                        print(f"[画像生成エージェント] 画像が生成されませんでした。リトライします... ({attempt + 1}/{max_retries})")
                        await asyncio.sleep(retry_delay)
                        retry_delay *= 2

                except Exception as e:
                    if "429" in str(e) and attempt < max_retries - 1:
                        print(f"[画像生成エージェント] 429リソース枯渇エラー。{retry_delay}秒後にリトライします... ({attempt + 1}/{max_retries})")
                        await asyncio.sleep(retry_delay)
                        retry_delay *= 2  # Exponential backoff
                    else:
                        # For other errors or last retry, print and return None
                        print(f"[画像生成エージェント] タイプID: {archetype_id} の画像生成中に回復不能なエラー: {e}")
                        return None # Exit and return None
            
            if not response or not response.images:
                print(f"[画像生成エージェント] タイプID: {archetype_id} の画像生成に失敗しました。モデルから画像が返されませんでした。")
                return None

            image_bytes = response.images[0]._image_bytes
            
            bucket = self.storage_client.bucket(settings.GCS_BUCKET_NAME)
            blob_name = f"archetype_images/{session_id}/{archetype_id}.png"
            blob = bucket.blob(blob_name)
            
            await asyncio.to_thread(blob.upload_from_string, image_bytes, content_type='image/png')
            print(f"[画像生成エージェント] タイプID: {archetype_id} の画像をGCSにアップロードしました: gs://{settings.GCS_BUCKET_NAME}/{blob_name}")

            # Generate a signed URL to provide temporary access to the private object
            expiration_time = datetime.now() + timedelta(hours=1) 
            
            signing_creds = self.credentials

            if not signing_creds:
                if not settings.GCP_IAM_SERVICE_ACCOUNT_EMAIL:
                    raise ValueError("GCP_IAM_SERVICE_ACCOUNT_EMAIL is not set. It's required for signing URLs in this environment.")
                
                # Get default credentials from the environment
                default_creds, _ = default()
                # Create impersonated credentials
                signing_creds = impersonated_credentials.Credentials(
                    source_credentials=default_creds,
                    target_principal=settings.GCP_IAM_SERVICE_ACCOUNT_EMAIL,
                    target_scopes=["https://www.googleapis.com/auth/iam"], # Scope for signing
                )

            signed_url = await asyncio.to_thread(
                blob.generate_signed_url,
                expiration=expiration_time,
                credentials=signing_creds,
                version="v4"
            )
            
            print(f"[画像生成エージェント] タイプID: {archetype_id} の署名付きURLを生成しました。")
            return signed_url

        except Exception as e:
            print(f"[画像生成エージェント] タイプID: {archetype_id} の画像生成またはアップロード中にエラー: {e}")
            return None

    async def analyze_needs_and_generate_images(self, product_category: str) -> Dict[str, Any]:
        """Orchestrates needs analysis and image generation."""
        session_id = str(uuid.uuid4())
        print(f"[メイン] セッションID: {session_id}")

        try:
            analysis_result = await self._analyze_user_needs(product_category)
            
            archetypes = analysis_result.get("user_archetypes", [])
            if not archetypes:
                print("分析の結果、ユーザータイプが見つかりませんでした。")
                return analysis_result

            print("\n[メイン] 各タイプのイメージ画像を並列で生成し、GCSにアップロードします...")
            # To avoid 429 Resource Exhausted errors, limit concurrent requests to the image generation API.
            sem = asyncio.Semaphore(3)

            async def generate_with_semaphore(archetype, session_id):
                async with sem:
                    return await self._generate_image_async(archetype, session_id)

            image_tasks = [generate_with_semaphore(archetype, session_id) for archetype in archetypes]
            signed_urls = await asyncio.gather(*image_tasks)

            for i, archetype in enumerate(archetypes):
                archetype["imageUrl"] = signed_urls[i]

            print("\n========================================")
            print(f"🏆「{product_category}」の分析結果 🏆")
            print("========================================")
            print(json.dumps(analysis_result, indent=2, ensure_ascii=False))
            return analysis_result

        except Exception as e:
            print(f"\n[メイン] エラーが発生しました: {e}")
            raise e

    async def _get_video_view_counts_async(self, video_ids: list[str]) -> dict[str, int]:
        """YouTube Data APIを使って、複数の動画の再生数を一括で取得する"""
        if not self.youtube:
            print("[警告] YouTubeクライアントが初期化されていません。再生数は0になります。")
            return {video_id: 0 for video_id in video_ids}

        try:
            def fetch_views():
                request = self.youtube.videos().list(part="statistics", id=",".join(video_ids[:50]))
                response = request.execute()
                return {item['id']: int(item['statistics']['viewCount']) for item in response.get('items', [])}
            
            view_counts = await asyncio.to_thread(fetch_views)
            print(f"[YouTube] 再生数を一括取得しました: {view_counts}")
            return view_counts
        except Exception as e:
            print(f"[警告] YouTube APIからの再生数取得に失敗しました: {e}")
            return {video_id: 0 for video_id in video_ids}

    async def _extract_product_info_from_video_async(self, youtube_link: str, limited_tags: List[str], keyword: str) -> tuple[str, dict]:
        """ワーカーエージェント: 動画から詳細な商品情報を抽出し、JSON形式で生成する"""
        print(f"[ワーカー] {youtube_link} の商品分析を開始..." )
        try:
            model = GenerativeModel("gemini-2.0-flash")
            
            video_part_dict = {
                "file_data": {
                    "file_uri": youtube_link,
                    "mime_type": "video/youtube",
                },
            }

            video_metadata = {}
            if settings.VIDEO_ANALYSIS_START_OFFSET:
                video_metadata["start_offset"] = settings.VIDEO_ANALYSIS_START_OFFSET
            if settings.VIDEO_ANALYSIS_END_OFFSET:
                video_metadata["end_offset"] = settings.VIDEO_ANALYSIS_END_OFFSET
            
            if video_metadata:
                video_part_dict["video_metadata"] = video_metadata

            youtube_video = Part.from_dict(video_part_dict)

            # specificationsのスキーマを動的に生成
            specifications_schema_parts = []
            for tag in limited_tags:
                specifications_schema_parts.append(f'          "{tag}": "1から5の5段階評価（整数）"')
            specifications_schema = "{\n" + ",\n".join(specifications_schema_parts) + "\n        }"

            prompt = f"""あなたは、動画レビューから紹介されている商品の詳細情報を正確に抽出する専門家です。

以下の動画を分析し、「{keyword}」に関連する商品のみを抽出し、下記のJSONスキーマに従って情報を抽出してください。
「{keyword}」と関連のない商品は無視してください。

重要な指示:
- `name`フィールドには、必ず具体的な製品・商品名を指定してください（例: "MacBook Air M2", "ソニー WH-1000XM5"）。
- スペック情報を含むような一般的な説明（例: "高性能ノートパソコン (Intel Core Ultra 7 255H)"）は、`name`フィールドに含めないでください。
- `specs`フィールドには、動画で言及されている製品の具体的なスペック情報をキーと値のペアで抽出してください。重要な項目（例: 本体のサイズ・重量、ディスプレイ、カメラ性能、バッテリー駆動時間など）をできるだけ含めてください。

情報が見つからない項目については、`null`を返してください。
特に、`specifications`オブジェクトの各項目は、1（全く不満）から5（大変満足）の5段階の整数で評価してください。
**JSONの構文、特にオブジェクトの各キーの後には必ずコロン(:)を記述し、その後に値を続けるルールを厳守してください。**

【出力JSONスキーマ】
{{
  "products": [
    {{
      "name": "具体的な製品名（例: MacBook Air M2）",
      "price": 12345, // 数値。不明な場合はnull
      "description": "商品の簡潔な説明",
      "specs": {{
        "本体重量": "150g",
        "ディスプレイ": "6.1インチ Super Retina XDR",
        "防水防塵": "IP68等級"
      }},
      "specifications": {specifications_schema},
      "category": "商品のカテゴリ（例: smartphone, laptop）",
      "tags": ["特徴を表すタグ1", "タグ2"]
    }}
  ]
}}
"""
            contents = [youtube_video, prompt]
            response = await model.generate_content_async(contents)
            
            if not response or not response.text:
                raise ValueError("AIモデルから空の応答が返されました。セーフティ設定によるブロックの可能性があります。")

            response_text = response.text.strip()
            json_string = response_text

            # Extract JSON from markdown block if present
            match = re.search(r"```json\s*(\{.*\})\s*```", response_text, re.DOTALL)
            if match:
                json_string = match.group(1)
            
            try:
                json_summary = json.loads(json_string)
            except json.JSONDecodeError:
                print(f"[ワーカー] ERROR: JSONの解析に失敗しました。モデルの生レスポンス: '''{response_text}'''")
                raise ValueError("モデルが有効なJSONを返しませんでした。")

            print(f"[ワーカー] {youtube_link} の商品分析が完了しました。")
            return youtube_link, json_summary

        except Exception as e:
            error_message = f"処理中に予期せぬ問題が発生しました: {e}"
            print(f"[ワーカー] {youtube_link} の処理中にエラー: {e}")
            return youtube_link, {"error": error_message}

    async def _generate_final_recommendation_async(self, all_products: list) -> dict:
        """総括エージェント: 全ワーカーの結果を分析し、おすすめ商品のリストをJSONで返す"""
        print("[総括エージェント] 全ワーカーの分析結果を評価し、おすすめ商品をランク付け中...")
        try:
            if not all_products:
                return {"error": "有効な分析結果がなかったため、おすすめ商品を決定できませんでした。"}

            results_json_string = json.dumps(all_products, indent=2, ensure_ascii=False)
            model = GenerativeModel("gemini-2.5-flash-lite")
            prompt = f'''あなたは複数の商品情報リストを評価し、購入検討者に最適なおすすめを提案するチーフアナリストです。

以下のJSONデータは、複数の動画から抽出された商品情報のリストです。各商品には、情報ソースとなった動画のURLリスト(`source_urls`)と、各動画の再生数リスト(`source_review_counts`)が含まれています。

{results_json_string}

上記の情報全体を比較検討し、スペック、価格、特徴、そして動画の再生数を人気度の指標として考慮し、「おすすめできる商品」を**最大10個まで**選んでください。
選んだ各商品について、以下の処理を行ってください。
1. `id`: 元の商品に含まれる`id`をそのまま維持してください。
2. `rating`: あなたの総合的な評価を1〜5の5段階評価（数値）で採点してください。
3. `reviewCount`: `source_review_counts` の**合計値**をこのフィールドに設定してください。
4. `source_urls`: `source_urls` のリストをそのまま含めてください。
5. `recommendation_reason`: なぜその商品がおすすめなのかを説明する文章を追加してください。
6. `specs`: 元の商品に含まれる`specs`オブジェクトをそのまま維持してください。

結果を、以下の最終JSONフォーマットで出力してください。

【最終出力JSONフォーマット】
{{
  "recommended_products": [
    {{
      "rank": 1,
      "recommendation_reason": "なぜこの商品がおすすめなのか、具体的な理由。",
      "id": "product-a-xxxx",
      "name": "商品A",
      "price": 79800,
      "description": "商品の説明",
      "specs": {{ "本体重量": "150g", "ディスプレイ": "6.1インチ" }},
      "specifications": {{ "key": "value" }},
      "rating": 5,
      "reviewCount": 12345,
      "category": "smartphone",
      "tags": ["tag1", "tag2"],
      "source_urls": ["https://www.youtube.com/watch?v=..."]
    }}
  ]
}}
'''

            response = await model.generate_content_async([prompt])
            
            if not response or not response.text:
                raise ValueError("総括AIモデルから空の応答が返されました。セーフティ設定によるブロックの可能性があります。")

            response_text = response.text.strip()
            match = re.search(r"```json\s*(\{.*\})\s*```", response_text, re.DOTALL)
            if match:
                response_text = match.group(1)
            
            final_json = json.loads(response_text)
            print("[総括エージェント] 最終推薦リストの作成が完了しました。")
            return final_json
        except Exception as e:
            error_message = f"最終推薦文の作成中にエラーが発生しました: {e}"
            print(f"[総括エージェント] エラー: {e}")
            return {"error": error_message}

    async def summarize_videos_and_recommend(self, youtube_urls: list[str], limited_tags: List[str], keyword: str) -> dict:
        """Orchestrates YouTube video summarization and recommendation."""
        video_ids = [url.split("v=")[-1].split("&")[0] for url in youtube_urls]
        view_counts_map = await self._get_video_view_counts_async(video_ids)

        print(f"[マネージャー] {len(youtube_urls)}件のURLの並列処理を開始します。")
        tasks = [self._extract_product_info_from_video_async(url, limited_tags, keyword) for url in youtube_urls]
        results = await asyncio.gather(*tasks)

        print("\n--- 各ワーカーの分析結果 ---")
        all_products_map = {}
        for url, summary_json in results:
            video_id = url.split("v=")[-1].split("&")[0]
            view_count = view_counts_map.get(video_id, 0)

            print(f"\n--- {url} (再生数: {view_count}) ---")
            print(json.dumps(summary_json, indent=2, ensure_ascii=False))
            
            if summary_json and "error" not in summary_json and "products" in summary_json:
                for product in summary_json["products"]:
                    product_name = product.get("name")
                    if not product_name:
                        continue

                    # Merge info if the same product is found in multiple videos
                    if product_name not in all_products_map:
                        # Sanitize product name to create a stable ID
                        sanitized_name = re.sub(r'[^a-zA-Z0-9]+', '-', product_name).lower().strip('-')
                        product["id"] = f"product-{sanitized_name}-{str(uuid.uuid4())[:8]}"
                        product["source_urls"] = [url]
                        product["source_review_counts"] = [view_count]
                        all_products_map[product_name] = product
                    else:
                        all_products_map[product_name]["source_urls"].append(url)
                        all_products_map[product_name]["source_review_counts"].append(view_count)
        
        all_products_list = list(all_products_map.values())

        if all_products_list:
            final_recommendation = await self._generate_final_recommendation_async(all_products_list)
            print("\n========================================")
            print("🏆 総括エージェントによる最終推薦リスト 🏆")
            print("========================================")
            print(json.dumps(final_recommendation, indent=2, ensure_ascii=False))
            return final_recommendation
        else:
            print("\n分析できる商品情報がなかったため、最終推薦は行いませんでした。")
            return {"recommended_products": []} # Return empty list if no products found

    async def search_youtube_reviews_and_summarize(self, keyword: str, tags: List[str]) -> dict:
        """Searches YouTube for review videos based on keyword and tags, then summarizes them."""
        if not self.youtube:
            return {"error": "YouTube APIクライアントが初期化されていません。YouTube検索を実行できません。"}

        # AIエージェント: ユーザーが商品選びに重視しているポイントを抽出
        try:
            model = GenerativeModel("gemini-2.5-flash-lite")
            
            # 1. keywordからYouTube検索に有効なワードを抽出
            keyword_extraction_prompt = f'''以下の文章から、YouTube検索に最も適した短いキーワード（2〜3語程度）を抽出してください。
            例1: "最新のノイズキャンセリング機能付きワイヤレスイヤホン" -> "ワイヤレスイヤホン ノイズキャンセリング"
            例2: "一人暮らし向けの小型冷蔵庫" -> "小型冷蔵庫 一人暮らし"
            例3: "ソニーのヘッドホン、WH-1000XM5を買おうか悩んでいます。" -> "ソニー WH-1000XM5"

            文章: "{keyword}"
            '''
            keyword_response = await model.generate_content_async([keyword_extraction_prompt])
            if not keyword_response or not keyword_response.text:
                raise ValueError("AIモデルからキーワード抽出の空の応答が返されました。")
            
            extracted_keyword = keyword_response.text.strip()
            print(f"[AIエージェント] 抽出された検索キーワード: {extracted_keyword}")

            # 2. ユーザーが商品選びに重視しているポイントをタグから選択
            tag_selection_prompt = f'''以下のタグの中から、ユーザーが商品選びに最も重視していると思われるポイントを2つだけ選んで、カンマ区切りで出力してください。
            例: "デザイン性,価格"

            タグ: {', '.join(tags)}
            '''
            tag_response = await model.generate_content_async([tag_selection_prompt])
            if not tag_response or not tag_response.text:
                raise ValueError("AIモデルからタグ選択の空の応答が返されました。")
            
            selected_tags_str = tag_response.text.strip()
            selected_tags = [tag.strip() for tag in selected_tags_str.split(',') if tag.strip()]
            
            if not selected_tags:
                limited_tags = random.sample(tags, 2) if len(tags) > 2 else tags
            else:
                limited_tags = selected_tags[:2] # 上位2つを使用
            
            print(f"[AIエージェント] ユーザーが重視するポイント: {', '.join(limited_tags)}")

        except Exception as e:
            print(f"[AIエージェント] キーワード抽出または重視ポイントの抽出中にエラーが発生しました: {e}")
            extracted_keyword = keyword # エラー時は元のキーワードを使用
            limited_tags = random.sample(tags, 2) if len(tags) > 2 else tags

        search_query = f"{extracted_keyword} {' '.join(limited_tags)} レビュー" # e.g., "ワイヤレスイヤホン ノイズキャンセリング デザイン性 価格 レビュー"
        print(f"[YouTube検索] 検索クエリ: {search_query}")

        try:
            search_response = await asyncio.to_thread(
                self.youtube.search().list,
                q=search_query,
                part="id,snippet",
                type="video",
                maxResults=3, # Max 3 videos
                regionCode="JP",
                relevanceLanguage="ja"
            )
            response_data = search_response.execute()

            youtube_urls = []
            for item in response_data.get("items", []):
                video_id = item["id"]["videoId"]
                youtube_urls.append(f"https://www.youtube.com/watch?v={video_id}")
            
            if not youtube_urls:
                print("[YouTube検索] 関連するYouTubeレビュー動画が見つかりませんでした。")
                return {"error": "関連するYouTubeレビュー動画が見つかりませんでした。"}

            print(f"[YouTube検索] {len(youtube_urls)}件の動画が見つかりました。要約処理を開始します。")
            return await self.summarize_videos_and_recommend(youtube_urls, limited_tags, keyword)

        except Exception as e:
            print(f"[YouTube検索] YouTube検索中にエラーが発生しました: {e}")
            return {"error": f"YouTube検索中にエラーが発生しました: {e}"}

    _VEO_PROMPT_TEMPLATE = """[PRODUCT A]:< {product_a_summary} >
[PRODUCT B]:< {product_b_summary} >

**Core Concept:** A dynamic, 8-second, seamless loop of a 3D animated battle. This video is intended as a background element for a mobile app that compares two products, provided as text inputs [PRODUCT A] and [PRODUCT B].

**Style & Mood:**
*   **Visual Style:** Vibrant, high-quality 3D animation. The aesthetic is inspired by the cheerful and dynamic style of popular Japanese battle games, but must be a **unique and original creation**. The look should be cute, pop, and playful.
*   **Color Palette:** The overall scene uses a bright, pastel-based color palette. Turquoise (#00C6C2) and gold (#FFD700) are used as key accent colors, creating a dynamic and appealing color scheme reminiscent of a modern trading card game.
*   **Atmosphere:** Fun, energetic, and friendly competition. The action is cartoonish and joyful, completely avoiding any realistic or intense violence.

**Sound Design:**
*   Add cheerful, upbeat electronic background music that loops seamlessly with the video.
*   Include playful and lighthearted sound effects for the actions (e.g., 'swoosh', 'zap', 'poof').
*   Incorporate cute giggling or cheering sounds from the characters occasionally, especially during expressive moments.

**Scene Description:**
*   **Setting:** A minimalist and brightly lit circular battle arena. The stage's theme should be creatively and subtly inspired by the general category of the two products being compared (e.g., a cyber-themed stage for electronics, a giant kitchen-themed stage for food items).
*   **Characters:**
    *   **Character A:** An anthropomorphic mascot representation of **[PRODUCT A]**. The character's design is the product itself, brought to life with cute arms and legs.
    *   **Character B:** An anthropomorphic mascot representation of **[PRODUCT B]**. Similarly, its design is the product itself with arms and legs.
    *   **Facial Expressions:** Both characters have large, innocent, and expressive eyes and a friendly smile. The style should be universally appealing and cute, **without directly copying any existing famous characters.**
*   **Action (8-Second Loop):**
    *   The two mascot characters engage in a continuous, dance-like battle.
    *   **"Merit" Attacks:** Their attacks are cartoonish, non-violent, and playfully inspired by the strengths and benefits of their respective products.
    *   **"Demerit" Reactions:** When a character is "hit" by an opponent's attack, it reacts in a comical and exaggerated way, such as being briefly knocked off-balance or spinning with dizzy stars.
    *   The action is fluid with nimble dodges and fun effects like sparkles and colorful puffs of smoke.
    *   The 8-second sequence must start and end in a similar, neutral confrontational pose to ensure a perfect, seamless loop.

**Constraints:**
*   **Originality and IP:** The generated characters, stage, and effects must be **original designs**. They must not resemble or infringe upon the intellectual property of any existing brands, franchises, or specific characters. The style should be *inspired by* the genre, not a direct copy.
*   **No Text:** Absolutely no text, letters, or numbers are to be rendered in the video.
*   **Seamless Loop:** The final output must be a perfectly seamless 8-second loop.
*   **High Frame Rate:** Render at a high frame rate for ultra-smooth motion.
*   **Positive Expressions:** The characters' facial expressions should always be positive and cute, avoiding any signs of genuine pain or distress.
""" 

    def _create_veo_prompt_for_battle(self, product_a_summary: str, product_b_summary: str) -> str:
        """
        Generates an optimized Veo3 prompt based on two product summaries.
        """
        print("[VEOエージェント] 動画生成用のプロンプトを作成中...")
        prompt = self._VEO_PROMPT_TEMPLATE.format(
            product_a_summary=product_a_summary,
            product_b_summary=product_b_summary
        )
        print("[VEOエージェント] 動画生成用のプロンプトの作成が完了しました。")
        return prompt.strip()

    async def _generate_video_async(self, prompt: str, session_id: str) -> dict:
        """Generates a video using Veo, polls for completion, and returns a signed URL."""
        print(f"[動画生成エージェント] セッションID: {session_id} の動画生成を開始...")
        # --- Diagnostic Logging ---
        model_name_to_use = settings.VEO_MODEL_NAME
        print(f"[動画生成エージェント] 使用する設定値:")
        print(f"  - Project: {self.project_id}")
        print(f"  - Location: {self.location}")
        print(f"  - Model Name: {model_name_to_use}")
        # -------------------------
        if not self.genai_client:
            print("[動画生成エージェント] ERROR: genai.Clientが初期化されていません。動画生成を中止します。")
            return {"status": "error", "message": "genai.Clientが初期化されていません。"}

        try:
            # 1. Define the dynamic GCS output path for Veo
            current_date_str = datetime.now(timezone(timedelta(hours=+9))).strftime("%Y-%m-%d")
            gcs_blob_folder = f"{current_date_str}/{session_id}"
            output_gcs_folder_uri = f'gs://{settings.GCS_BUCKET_NAME}/{gcs_blob_folder}'
            print(f'[{session_id}] Veo出力先: {output_gcs_folder_uri}')

            # 2. Start the video generation operation
            veo_operation = await asyncio.to_thread(
                self.genai_client.models.generate_videos,
                model=getattr(settings, 'VEO_MODEL_NAME', "veo-3.0-fast-generate-001"),
                prompt=prompt,
                config=genai_types.GenerateVideosConfig(
                    person_generation='dont_allow',
                    aspect_ratio='16:9',
                    output_gcs_uri=output_gcs_folder_uri,
                ),
            )
            print(f'[{session_id}] Veo operation 開始: {veo_operation.name}')

            # 3. Poll the operation for completion
            while not veo_operation.done:
                await asyncio.sleep(5) # Poll every 5 seconds
                veo_operation = await asyncio.to_thread(
                    self.genai_client.operations.get, veo_operation
                )
                print(f"[{session_id}] ポーリング中...完了ステータス: {veo_operation.done}")

            print(f'[{session_id}] Veo操作完了。ステータス: {veo_operation.done}')

            # 4. Process the result
            if veo_operation.error:
                error_message_detail = getattr(veo_operation.error, 'message', str(veo_operation.error))
                raise Exception(f"Veo動画生成が失敗しました: {error_message_detail}")

            if not (veo_operation.response and veo_operation.response.generated_videos):
                raise Exception("Veoレスポンスに動画が含まれていません。")

            # 5. Get GCS URI from response and generate a signed URL
            generated_video_info = veo_operation.response.generated_videos[0]
            veo_provided_gcs_uri = generated_video_info.video.uri
            print(f'[{session_id}] 動画オブジェクトを受信。Veo GCS URI: {veo_provided_gcs_uri}')

            parsed_uri = urlparse(veo_provided_gcs_uri)
            blob_name = parsed_uri.path.lstrip('/')
            
            signed_url = await self._generate_signed_url_async(blob_name, settings.GCS_BUCKET_NAME)

            if not signed_url:
                raise Exception("署名付きURLの生成に失敗しました。")

            return {
                "status": "success",
                "message": "動画の生成と署名付きURLの取得に成功しました。",
                "gcs_signed_url": signed_url,
            }

        except Exception as e:
            print(f"[動画生成エージェント] 動画生成中にエラー: {e}")
            return {"status": "error", "message": str(e), "gcs_signed_url": None}

    async def _generate_signed_url_async(self, blob_name: str, bucket_name: str) -> Optional[str]:
        """Generates a signed URL for a GCS blob, using impersonation if needed."""
        try:
            blob = self.storage_client.bucket(bucket_name).blob(blob_name)
            
            # Determine credentials for signing
            signing_creds = self.credentials

            # If no file-based credentials are provided, use impersonation
            if not signing_creds:
                signer_email = settings.GCP_IAM_SERVICE_ACCOUNT_EMAIL
                if not signer_email:
                    raise ValueError(
                        "GCP_IAM_SERVICE_ACCOUNT_EMAIL environment variable is not set. "
                        "It is required for signing URLs in a Cloud Run environment."
                    )
                
                print(f"署名にサービスアカウント'{signer_email}'の権限借用を使用します。")
                # Get default credentials from the environment (the runtime service account)
                default_creds, _ = default()
                # Create impersonated credentials
                signing_creds = impersonated_credentials.Credentials(
                    source_credentials=default_creds,
                    target_principal=signer_email,
                    target_scopes=["https://www.googleapis.com/auth/iam"], # Scope for signing
                )

            signed_url = await asyncio.to_thread(
                blob.generate_signed_url,
                version="v4",
                expiration=timedelta(hours=1),
                method="GET",
                credentials=signing_creds,
            )
            print(f"GCS URI gs://{bucket_name}/{blob_name} の署名付きURLを生成しました。")
            return signed_url
        except Exception as e:
            print(f"署名付きURLの生成中にエラー: {e}")
            return None

    async def generate_product_battle(self, product_name_1: str, product_name_2: str) -> dict:
        """Generates a mock product battle description."""
        print(f"[対決エージェント] 「{product_name_1}」vs「{product_name_2}」の対決シナリオを生成中...")
        battle_id = f"battle-{uuid.uuid4()}"
        try:
            model = GenerativeModel("gemini-2.5-flash")
            prompt = f'''あなたは、2つの製品の擬人化キャラクターとして、互いの長所をアピールし合う対決形式のプレゼンテーションを行う脚本家です。

製品1: 「{product_name_1}」
製品2: 「{product_name_2}」

以下のルールに従って、両製品が互いに3つのポイントで強みを主張し合う、魅力的な説明文を生成してください。

# ルール
- 各製品の説明文は3つの独立した文章（文字列）の配列にしてください。
- 各文章は、相手を意識しつつも、自身の具体的な特徴やメリットを力強くアピールするものにしてください。
- ユーモアや少しの挑発を含んでも構いませんが、内容は技術的な事実に即してください。
- 出力は必ず以下のJSON形式に従ってください。

# 出力JSONスキーマ
{{
  "product1_description": [
    "製品1の強み1をアピールする説明文。",
    "製品1の強み2をアピールする説明文。",
    "製品1の強み3をアピールする説明文。"
  ],
  "product2_description": [
    "製品2の強み1をアピールする説明文。",
    "製品2の強み2をアピールする説明文。",
    "製品2の強み3をアピールする説明文。"
  ]
}}
'''

            response = await model.generate_content_async([prompt])
            
            if not response or not response.text:
                raise ValueError("AIモデルから空の応答が返されました。")

            response_text = response.text.strip()
            json_string = response_text

            match = re.search(r"```json\s*(\{.*\})\s*```", response_text, re.DOTALL)
            if match:
                json_string = match.group(1)

            try:
                ai_response = json.loads(json_string)
            except json.JSONDecodeError as e:
                print(f"[対決エージェント] ERROR: JSONの解析に失敗しました。モデルの生レスポンス: '''{response_text}'''")
                raise ValueError(f"モデルが有効なJSONを返しませんでした: {e}")

            # --- AI Agent 2: Video Prompt Generation ---
            product1_full_description = " ".join(ai_response.get("product1_description", []))
            product2_full_description = " ".join(ai_response.get("product2_description", []))
            
            video_prompt = self._create_veo_prompt_for_battle(
                product_a_summary=f"{product_name_1}: {product1_full_description}",
                product_b_summary=f"{product_name_2}: {product2_full_description}"
            )

            # --- AI Agent 3: Video Generation ---
            video_generation_result = await self._generate_video_async(
                prompt=video_prompt,
                session_id=battle_id
            )

            video_url = video_generation_result.get("gcs_signed_url")
            # Use placeholder if generation fails
            if video_generation_result.get("status") != "success" or not video_url:
                video_url = "https://storage.googleapis.com/public-dds-react-camp-machu/battle_movies/Fighting_Game_Product_Battle_Video.mp4"

            # Add static data and the new video prompt to the response
            final_response = {
                "id": battle_id,
                "product1_id": "dummy-prod-1",
                "product1_name": product_name_1,
                "product1_description": ai_response.get("product1_description", []),
                "product2_id": "dummy-prod-2",
                "product2_name": product_name_2,
                "product2_description": ai_response.get("product2_description", []),
                "video_prompt": video_prompt,
                "video_url": video_url,
            }
            print(f"[対決エージェント] 対決シナリオと動画の生成が完了しました。")
            return final_response

        except Exception as e:
            print(f"[対決エージェント] 対決シナリオの生成中にエラー: {e}")
            raise ValueError(f"対決シナリオの生成中にエラーが発生しました: {e}")

    async def recommend_products(
        self, 
        user_preferences: Dict,
        product_catalog: List[Product]
    ) -> List[Product]:
        """Recommends products based on user preferences."""
        # This is a stub implementation.
        # Actual implementation will use a recommendation algorithm.
        print(f"Recommending products based on: {user_preferences}")
        return product_catalog[:2] # Return first two products as a mock recommendation

class MockAnalyzeNeedsService: 
    """Mock version of AnalyzeNeedsService for development and testing."""

    async def generate_chat_response(
        self, 
        message: str, 
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Generates a mock chat response."""
        print(f"Mock chat response for message: {message}")
        if "比較" in message:
            return {
                "message": "承知いたしました。比較ページに移動します。",
                "navigateTo": "/comparison"
            }
        return {
            "message": f"これは「{message}」に対するモック応答です。",
            "navigateTo": None
        }

    async def analyze_needs_and_generate_images(self, product_category: str) -> Dict[str, Any]:
        """Generates mock user archetypes with placeholder images."""
        print(f"Mock analysis for product category: {product_category}")
        await asyncio.sleep(1)  # Simulate network delay
        return {
            "user_archetypes": [
                {
                    "id": str(uuid.uuid4()),
                    "name": "デザイン重視タイプ",
                    "description": "見た目の美しさと、空間に調和するデザインを最優先。",
                    "characteristics": ["美しいデザイン", "高級感", "インテリア性"],
                    "sampleProducts": ["バルミューダ ザ・トースター", "ダイソン Supersonic Ionic"],
                    "imageUrl": "https://storage.googleapis.com/public-dds-react-camp-machu/archetype_images/sample/design.png"
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "機能性・多機能タイプ",
                    "description": "一台で何役もこなす、最新技術と多機能性を求める。",
                    "characteristics": ["多機能", "最新技術", "高性能"],
                    "sampleProducts": ["パナソニック ビストロ", "ルンバ j7+"],
                    "imageUrl": "https://storage.googleapis.com/public-dds-react-camp-machu/archetype_images/sample/multi-function.png"
                }
            ]
        }

def get_analyze_needs_service() -> AnalyzeNeedsService | MockAnalyzeNeedsService:
    """
    Factory function to get the appropriate AnalyzeNeedsService instance
    based on the environment settings.
    """
    if settings.ENVIRONMENT == "development":
        print("Using MockAnalyzeNeedsService for development environment.")
        return MockAnalyzeNeedsService()
    
    # In a production environment, you would initialize the real service
    # with credentials and other necessary configurations.
    print("Using real AnalyzeNeedsService.")
    return AnalyzeNeedsService(
        project_id=settings.GCP_PROJECT_ID,
        location=settings.VERTEX_AI_MODEL_REGION
    )
