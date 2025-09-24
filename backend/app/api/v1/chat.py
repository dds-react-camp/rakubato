from fastapi import APIRouter, Depends
from datetime import datetime
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.analyze_needs import get_analyze_needs_service, MockAnalyzeNeedsService, AnalyzeNeedsService

router = APIRouter()

@router.post("/", response_model=ChatResponse)
async def handle_chat(
    request: ChatRequest,
    ai_service: MockAnalyzeNeedsService | AnalyzeNeedsService = Depends(get_analyze_needs_service)
):
    """Post a chat message and get a response from the AI."""
    
    ai_response = await ai_service.generate_chat_response(
        message=request.message,
        context=request.user_context
    )
    
    if isinstance(ai_response, str):
        ai_response = {"message": ai_response, "navigateTo": None}

    return ChatResponse(
        message=ai_response["message"],
        conversationId=request.conversation_id or "new_conversation",
        timestamp=datetime.now(),
        navigate_to=ai_response.get("navigateTo"),
    )
