"""Database models for website analysis results."""
from datetime import datetime
from typing import Dict, List, Optional
from sqlalchemy import JSON, Column, DateTime, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class WebsiteAnalysis(Base):
    """Model for storing website analysis results."""
    __tablename__ = 'website_analyses'

    id = Column(Integer, primary_key=True)
    url = Column(String, nullable=False)
    company_name = Column(String)
    analysis_date = Column(DateTime, default=datetime.utcnow)
    
    # Structured data
    company_structure = Column(JSON)
    product_portfolio = Column(JSON)
    market_penetration = Column(JSON)
    supply_chain = Column(JSON)
    digital_readiness = Column(JSON)
    
    # Confidence scores
    company_structure_confidence = Column(Float)
    product_portfolio_confidence = Column(Float)
    market_penetration_confidence = Column(Float)
    supply_chain_confidence = Column(Float)
    digital_readiness_confidence = Column(Float)
    
    # Raw data
    raw_text = Column(String)
    
    def to_dict(self) -> Dict:
        """Convert model to dictionary."""
        return {
            'id': self.id,
            'url': self.url,
            'company_name': self.company_name,
            'analysis_date': self.analysis_date.isoformat(),
            'company_structure': self.company_structure,
            'product_portfolio': self.product_portfolio,
            'market_penetration': self.market_penetration,
            'supply_chain': self.supply_chain,
            'digital_readiness': self.digital_readiness,
            'confidence_scores': {
                'company_structure': self.company_structure_confidence,
                'product_portfolio': self.product_portfolio_confidence,
                'market_penetration': self.market_penetration_confidence,
                'supply_chain': self.supply_chain_confidence,
                'digital_readiness': self.digital_readiness_confidence
            }
        }

    @classmethod
    def from_analysis_result(cls, url: str, result: Dict) -> 'WebsiteAnalysis':
        """Create model instance from analysis result."""
        return cls(
            url=url,
            company_name=result['company_structure'].get('name'),
            company_structure=result['company_structure'],
            product_portfolio=result['product_portfolio'],
            market_penetration=result['market_penetration'],
            supply_chain=result['supply_chain'],
            digital_readiness=result['digital_readiness'],
            company_structure_confidence=result['confidence_scores']['company_structure'],
            product_portfolio_confidence=result['confidence_scores']['product_portfolio'],
            market_penetration_confidence=result['confidence_scores']['market_penetration'],
            supply_chain_confidence=result['confidence_scores']['supply_chain'],
            digital_readiness_confidence=result['confidence_scores']['digital_readiness'],
            raw_text=result.get('raw_text')
        ) 