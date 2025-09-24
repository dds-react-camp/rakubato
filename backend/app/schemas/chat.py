from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import datetime
from .product import Product

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = Field(None, alias="conversationId")
    user_context: Optional[Dict[str, Any]] = Field(None, alias="userContext")

class ChatResponse(BaseModel):
    message: str
    conversation_id: str = Field(..., alias="conversationId")
    suggestions: Optional[List[str]] = None
    products: Optional[List[Product]] = None
    timestamp: datetime
    navigate_to: Optional[str] = Field(None, alias="navigateTo")
