from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

class ChatResponse(BaseModel):
    message: ChatMessage

@router.post("/send", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    """
    Send a message to the chat system and get a response.
    """
    try:
        # In a real implementation, this would process the message with an LLM
        # For now, just return a simple response
        return {
            "message": ChatMessage(
                role="assistant",
                content="I'm the TradeWizard assistant. I can help you with international trade questions."
            )
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 