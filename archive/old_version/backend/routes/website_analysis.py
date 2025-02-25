"""API routes for website analysis."""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict

from ..services.website_analyzer import WebsiteAnalyzer
from ..models.website_analysis import WebsiteAnalysis
from ..database import get_db

router = APIRouter()
analyzer = WebsiteAnalyzer(mock_mode=True)  # Set to False for production

@router.post("/analyze")
async def analyze_website(url: str, db: Session = Depends(get_db)) -> Dict:
    """Analyze a website and store results."""
    try:
        # Check if we have recent analysis
        existing = db.query(WebsiteAnalysis).filter(
            WebsiteAnalysis.url == url
        ).first()
        
        if existing:
            return existing.to_dict()
        
        # Perform new analysis
        result = await analyzer.analyze_website(url)
        if not result:
            raise HTTPException(
                status_code=422,
                detail="Could not analyze website. Please check the URL and try again."
            )
        
        # Store analysis
        analysis = WebsiteAnalysis.from_analysis_result(url, result)
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        
        return analysis.to_dict()
        
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred during analysis: {str(e)}"
        )

@router.get("/analysis/{url}")
async def get_analysis(url: str, db: Session = Depends(get_db)) -> Dict:
    """Get stored analysis for a URL."""
    analysis = db.query(WebsiteAnalysis).filter(
        WebsiteAnalysis.url == url
    ).first()
    
    if not analysis:
        raise HTTPException(
            status_code=404,
            detail="No analysis found for this URL"
        )
        
    return analysis.to_dict() 