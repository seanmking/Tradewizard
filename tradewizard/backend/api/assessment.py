from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional, Any

from services.assessment_flow import AssessmentFlowService
from services.trade_assessment_service import TradeAssessmentService

router = APIRouter(prefix="/assessment", tags=["assessment"])
assessment_flow_service = AssessmentFlowService()
trade_assessment_service = TradeAssessmentService()

class AssessmentRequest(BaseModel):
    step_id: str
    response: str
    user_data: Optional[Dict[str, Any]] = None

class InitialAssessmentResponse(BaseModel):
    next_step: Dict[str, Any]
    user_data: Dict[str, Any]
    dashboard_updates: Optional[Dict[str, Any]] = None

class SarahRequest(BaseModel):
    chat_id: str
    message: str

class SarahResponse(BaseModel):
    response: str
    next_step: Optional[str] = None
    type: Optional[str] = None
    market_options: Optional[List[Dict[str, Any]]] = None
    extracted_info: Dict[str, Any]
    show_account_creation: Optional[bool] = None

@router.get("/initial-question")
async def get_initial_question():
    """
    Get the initial question to start the assessment flow.
    """
    try:
        initial_question = assessment_flow_service.get_initial_question()
        return initial_question
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process-response", response_model=InitialAssessmentResponse)
async def process_response(request: AssessmentRequest):
    """
    Process a user response in the assessment flow.
    """
    try:
        result = assessment_flow_service.initial_assessment_flow_handler(
            step_id=request.step_id,
            response=request.response,
            user_data=request.user_data
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/start-sarah-flow")
async def start_sarah_flow():
    """
    Start the Sarah-guided initial assessment flow.
    """
    try:
        # Create a new chat session and return the initial question
        chat_id = trade_assessment_service.create_chat_session("user")
        
        # Get the Sarah intro step
        intro_step = trade_assessment_service.assessment_flow['sarah_intro']
        intro_text = intro_step['question']['text']
        
        return {
            "chat_id": chat_id,
            "response": intro_text,
            "next_step": "sarah_intro"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sarah-process-response", response_model=SarahResponse)
async def sarah_process_response(request: SarahRequest):
    """
    Process a user response in the Sarah-guided assessment flow.
    """
    try:
        result = trade_assessment_service.initial_assessment_flow(
            chat_id=request.chat_id,
            message=request.message
        )
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-website")
async def analyze_website(request: Dict[str, str]):
    """
    Analyze a website URL to extract business intelligence.
    """
    try:
        if "url" not in request:
            raise HTTPException(status_code=400, detail="URL is required")
        
        analysis = assessment_flow_service.process_website_analysis(request["url"])
        return {"analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/get-market-options")
async def get_market_options(request: Dict[str, List[str]]):
    """
    Get personalized market options based on product categories.
    """
    try:
        if "product_categories" not in request:
            raise HTTPException(status_code=400, detail="Product categories are required")
        
        market_options = assessment_flow_service.get_market_options(request["product_categories"])
        return {"market_options": market_options}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/get-market-intelligence")
async def get_market_intelligence(request: Dict[str, Any]):
    """
    Get market intelligence for a specific market.
    """
    try:
        if "market_name" not in request or "product_categories" not in request:
            raise HTTPException(status_code=400, detail="Market name and product categories are required")
        
        intelligence = assessment_flow_service.get_market_intelligence(
            request["market_name"],
            request["product_categories"]
        )
        return {"intelligence": intelligence}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 