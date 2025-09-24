# AI商品検索・比較アプリ

## 概要

このプロジェクトは、AIアシスタントとの対話を通じて商品を検索・比較できるモバイルファーストのWebアプリケーションです。ユーザーはAIによるパーソナライズされた商品推薦を受けたり、商品タイプ診断を通じて最適な商品を見つけたり、マッチアップ形式で商品を比較したりすることができます。

## 技術スタック

### フロントエンド
-   **フレームワーク:** React (TypeScript)
-   **ビルドツール:** Vite
-   **スタイリング:** Sass
-   **ルーティング:** React Router DOM
-   **API通信:** Axios
-   **テスト:** Vitest, React Testing Library
-   **アイコン:** Font Awesome
-   **カルーセルUI:** Embla Carousel
-   **スワイプ操作:** React Swipeable
-   **APIモック:** MSW
-   **E2Eテスト:** Cypress

### バックエンド
-   **フレームワーク:** FastAPI (Python)
-   **AI/ML:** Google Cloud Vertex AI SDK (Gemini), Google Generative AI SDK
-   **データモデル:** Pydantic
-   **設定管理:** Pydantic-settings
-   **ASGIサーバー:** Uvicorn
-   **HTTPクライアント:** httpx
-   **テスト:** Pytest

### インフラストラクチャ
-   **コンテナ:** Docker, Docker Compose
-   **開発環境:** VS Code Dev Containers
-   **デプロイ:** Google Cloud Run
-   **CI/CD:** GitHub Actions, Google Cloud Build

## 開発環境セットアップ

### オプション1: Devcontainer (推奨)

このプロジェクトは、VS CodeのDev Containers機能を利用した開発を推奨しています。コンテナ内に完全に再現された開発環境が自動で構築されるため、ローカル環境を汚さずに、依存関係の問題なく開発を始めることができます。

**前提条件:**
-   [Visual Studio Code](https://code.visualstudio.com/)
-   [Docker Desktop](https://www.docker.com/products/docker-desktop/)
-   VS Codeの [Dev Containers 拡張機能](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

**セットアップ手順:**

1.  **プロジェクトをクローンします。**
    ```bash
    git clone <your-repository-url>
    cd google-hackathon-ai3
    ```

2.  **VS Codeでプロジェクトを開きます。**
    VS Codeが`.devcontainer`ディレクトリを検知し、画面右下に「Reopen in Container」という通知を表示します。このボタンをクリックしてください。
    *(通知が表示されない場合は、`F1`キーを押してコマンドパレットを開き、`Dev Containers: Reopen in Container`を選択します)*

3.  **Dev Containerのビルドを待ちます。**
    初回はコンテナイメージのダウンロードとビルドに数分かかります。ビルドが完了すると、VS Codeがコンテナ内の環境に接続された状態でリロードされます。
    このプロセスで、`devcontainer.json`の`postCreateCommand`に基づき、`npm install`の実行と、`frontend/.env`のテンプレートファイル作成が自動的に行われます。

4.  **ローカル開発用の認証情報を設定します。**
    Devcontainer内で **実際のVertex AI** を使用するには、認証情報の設定が必要です。（モックサーバーを使用する場合は不要です）

    a. **サービスアカウントキーの配置:**
       -   GCPコンソールから、**「Vertex AI ユーザー」**ロールを持つサービスアカウントの**JSONキー**をダウンロードします。
       -   ダウンロードしたキーファイルを、プロジェクトの`backend/.devcontainer`ディレクトリ直下に配置します。
       -   ファイル名を`local-gcp-creds.json`に変更します。（このファイルは`.gitignore`によりGitの追跡対象外です）

    b. **環境変数の設定:**
       -   `docker-compose.yml` を開き、`backend`サービスの`environment`セクションを編集します。
       -   `ENVIRONMENT`を`development`から`local_vertex`に変更し、ご自身の`GCP_PROJECT_ID`を設定します。

5.  **アプリケーションを起動します。**
    VS Code内のターミナル（`Ctrl+@`で開きます）は、すでにコンテナ内部に接続されています。以下のコマンドを実行してください。
    ```bash
    docker-compose up --build
    ```

6.  **アプリケーションにアクセスします。**
    -   フロントエンド: `http://localhost:5173`
    -   バックエンド (API Docs): `http://localhost:8000/docs`

### オプション2: ローカル環境での手動セットアップ

Devcontainerを使用しない場合は、プロジェクトルートにあるスクリプトを実行することで、セットアップを簡略化できます。

**前提条件:**
-   **Python 3.11**
-   **Node.js** (18.x LTS or later)
-   **Google Cloud SDK** (`gcloud` CLI) (Vertex AI利用時)

**セットアップ手順:**

1.  **セットアップスクリプトの実行:**
    お使いのOSに合わせて、プロジェクトのルートディレクトリで以下のいずれかのスクリプトを実行してください。
    -   **Windows:**
        ```cmd
        .\setup-local.bat
        ```
    -   **macOS / Linux:**
        ```bash
        bash setup-local.sh
        ```
    これにより、依存関係のインストールと設定ファイルの準備が自動で行われます。

2.  **アプリケーションの起動:**
    スクリプト完了後、以下の手順で各サーバーを起動します。

    ---    
    #### **ターミナル 1: バックエンドサーバーの起動**

    1.  `backend`ディレクトリに移動し、仮想環境を有効化します。
        -   **Windows:** `cd backend` -> `.\venv\Scripts\activate`
        -   **macOS / Linux:** `cd backend` -> `source venv/bin/activate`

    2.  サーバーを起動します。
        ```bash
        uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
        ```
        サーバーは自動的に `backend/.env` ファイルを読み込み、開発モード(モック)で起動します。
        
    > **Note:** 実際のVertex AIに接続したい場合は、`backend/.env` ファイルを編集し、`ENVIRONMENT`を`production`に変更した上で、ご自身の`GCP_PROJECT_ID`を設定してください。その際、`gcloud auth application-default login`での認証が必要になります。

    ---    
    #### **ターミナル 2: フロントエンドサーバーの起動**

    1.  `frontend`ディレクトリに移動します。
        ```bash
        cd frontend
        ```

    2.  開発サーバーを起動します。
        ```bash
        npm run dev
        ```

## テスト実行方法

### バックエンドテスト
```bash
# backendディレクトリで仮想環境を有効化してから実行
pytest
```

### フロントエンドテスト
```bash
# frontendディレクトリで実行
npm test
```

## デプロイ手順

このアプリケーションは、GitHub ActionsとGoogle Cloud Runを使用して自動デプロイされます。
詳細は `.github/workflows/ci-cd.yml` を参照してください。

**必要なGitHubシークレット:**
-   `GCP_PROJECT_ID`
-   `GCP_SA_KEY`
-   `API_URL`
-   `FRONTEND_URL`
-   `BACKEND_URL`
-   `BASIC_AUTH_USERNAME`
-   `BASIC_AUTH_PASSWORD`
