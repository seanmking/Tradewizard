from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional, Any

from services.sidekick import SideKickService

router = APIRouter(prefix="/sidekick", tags=["sidekick"])
sidekick_service = SideKickService()

class InitialInputRequest(BaseModel):
    company_name: str
    business_type: str

class VerifiedDataRequest(BaseModel):
    dashboard: Dict[str, Any]

@router.post("/process-initial-input")
async def process_initial_input(request: InitialInputRequest):
    """
    Process the initial input and return a dashboard with extracted information.
    """
    try:
        dashboard = sidekick_service.process_initial_input(
            company_name=request.company_name,
            business_type=request.business_type
        )
        return {"dashboard": dashboard}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-export-plan")
async def generate_export_plan(request: VerifiedDataRequest):
    """
    Generate an export plan based on verified data.
    """
    try:
        export_plan = sidekick_service.generate_export_plan(
            verified_data=request.dashboard
        )
        return {"plan": export_plan}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 