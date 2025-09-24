from app.main import app # appをインポート
from app.services.analyze_needs import MockAnalyzeNeedsService, get_analyze_needs_service # get_vertex_ai_serviceもインポート
import pytest

@pytest.fixture(autouse=True)
def override_get_analyze_needs_service(monkeypatch):
    # MockAnalyzeNeedsServiceのgenerate_chat_responseメソッドをモックする
    async def mock_generate_chat_response(self, message, context=None):
        if "こんにちは" in message:
            return {"message": "こんにちは！商品選びのお手伝いをさせていただきます。", "navigateTo": None}
        return {"message": "モック応答", "navigateTo": None}

    monkeypatch.setattr(MockAnalyzeNeedsService, "generate_chat_response", mock_generate_chat_response)

    # get_analyze_needs_serviceをオーバーライドして、常にMockAnalyzeNeedsServiceのインスタンスを返すようにする
    app.dependency_overrides[get_analyze_needs_service] = lambda: MockAnalyzeNeedsService()

    yield # テスト実行
    app.dependency_overrides = {} # テスト後にオーバーライドをクリア

def test_post_chat_message(client):
    response = client.post(
        "/api/v1/chat/message",
        json={
            "message": "こんにちは",
            "conversationId": "test_conv_123"
        }
    )
    assert response.status_code == 200
    assert "こんにちは！商品選びのお手伝いをさせていただきます。" in response.json()["message"]
    assert response.json()["conversationId"] == "test_conv_123"

def test_post_chat_message_new_conversation(client):
    response = client.post(
        "/api/v1/chat/message",
        json={
            "message": "新しい会話"
        }
    )
    assert response.status_code == 200
    assert "モック応答" in response.json()["message"]
    assert response.json()["conversationId"] == "new_conversation"
