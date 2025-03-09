"""
Resource planning module.

This module provides functionality for estimating resource requirements
for export projects, including costs, timelines, and team needs.
"""

import logging
from datetime import datetime, timedelta
import json
import math

from export_intelligence.analysis.timeline import TIMELINE_TEMPLATES

# Configure logging
logger = logging.getLogger(__name__)

# Base cost factors by timeline type (in USD)
BASE_COSTS = {
    'accelerated': 60000,   # Higher cost due to expedited processes
    'standard': 45000,      # Balanced cost
    'conservative': 55000   # Higher due to more thorough planning
}

# Resource distribution by category
RESOURCE_DISTRIBUTION = {
    'product_adaptation': 0.30,    # 30% of budget
    'certification': 0.25,         # 25% of budget
    'logistics': 0.20,             # 20% of budget
    'marketing': 0.15,             # 15% of budget
    'other': 0.10                  # 10% of budget
}

# Team roles and commitments by timeline type
TEAM_REQUIREMENTS = {
    'accelerated': [
        {'role': 'Project Manager', 'commitment': 'Full-time'},
        {'role': 'Regulatory Specialist', 'commitment': 'Full-time'},
        {'role': 'Product Development Lead', 'commitment': 'Full-time'},
        {'role': 'Logistics Coordinator', 'commitment': 'Full-time'},
        {'role': 'Marketing Specialist', 'commitment': 'Part-time'}
    ],
    'standard': [
        {'role': 'Project Manager', 'commitment': 'Full-time'},
        {'role': 'Regulatory Specialist', 'commitment': 'Part-time'},
        {'role': 'Product Development Lead', 'commitment': 'Part-time'},
        {'role': 'Logistics Coordinator', 'commitment': 'Part-time'},
        {'role': 'Marketing Specialist', 'commitment': 'Part-time'}
    ],
    'conservative': [
        {'role': 'Project Manager', 'commitment': 'Full-time'},
        {'role': 'Regulatory Specialist', 'commitment': 'Part-time'},
        {'role': 'Product Development Lead', 'commitment': 'Part-time'},
        {'role': 'Logistics Coordinator', 'commitment': 'Part-time'},
        {'role': 'Marketing Specialist', 'commitment': 'Part-time'},
        {'role': 'Market Research Analyst', 'commitment': 'Part-time'},
        {'role': 'Legal Counsel', 'commitment': 'As needed'}
    ]
}

def estimate_resource_requirements(industry, markets, timeline_option='standard',
                                  regulatory_documents=None, company_size='medium'):
    """
    Estimate resource requirements for an export project.
    
    Args:
        industry: Industry name
        markets: List of target markets
        timeline_option: Selected timeline option (standard, accelerated, conservative)
        regulatory_documents: Optional list of regulatory documents
        company_size: Company size (small, medium, large)
        
    Returns:
        Dictionary with resource estimates
    """
    try:
        # Get base costs for the selected timeline
        base_cost = BASE_COSTS.get(timeline_option, BASE_COSTS['standard'])
        
        # Adjust cost based on number of markets
        market_factor = 1.0 + ((len(markets) - 1) * 0.15)  # 15% increase per additional market
        
        # Adjust cost based on company size
        company_size_factor = {
            'small': 0.8,    # Smaller companies have lower costs
            'medium': 1.0,   # Medium companies are the baseline
            'large': 1.2     # Larger companies have higher costs
        }.get(company_size, 1.0)
        
        # Adjust cost based on industry specifics
        industry_factor = {
            'Food Products': 1.2,        # Higher due to food safety requirements
            'Beverages': 1.15,           # Similar to food but slightly lower
            'Textiles': 0.9,             # Lower regulatory burden
            'Electronics': 1.1,          # Moderate regulatory requirements
            'Pharmaceuticals': 1.5       # High regulatory burden
        }.get(industry, 1.0)
        
        # Calculate final cost estimates
        adjusted_cost = base_cost * market_factor * company_size_factor * industry_factor
        
        # Apply variability for min/max range (±20%)
        min_cost = math.floor(adjusted_cost * 0.8)
        max_cost = math.ceil(adjusted_cost * 1.2)
        
        # Calculate cost breakdown by category
        cost_breakdown = {}
        for category, percentage in RESOURCE_DISTRIBUTION.items():
            cost_breakdown[category] = round(adjusted_cost * percentage)
        
        # Adjust for regulatory documents if provided
        if regulatory_documents:
            # Sum the cost of required documents
            doc_cost = sum(doc.get('estimatedCost', 0) for doc in regulatory_documents)
            
            # Add regulatory costs to certification category
            cost_breakdown['certification'] += doc_cost
            adjusted_cost += doc_cost
            min_cost += doc_cost
            max_cost += doc_cost
        
        # Get timeline information
        timeline = TIMELINE_TEMPLATES.get(timeline_option, TIMELINE_TEMPLATES['standard'])
        total_weeks = timeline['total_weeks']
        
        # Adjust timeline if regulatory documents require more time
        if regulatory_documents:
            # Find the maximum time required for critical documents
            critical_docs = [doc for doc in regulatory_documents if doc.get('importance') == 'critical']
            if critical_docs:
                max_doc_weeks = max(doc.get('estimatedTimeInWeeks', 0) for doc in critical_docs)
                # If regulatory process is longer than standard certification time, adjust timeline
                cert_milestone = next((m for m in timeline['milestones'] if 'Certification' in m['label']), None)
                if cert_milestone:
                    cert_weeks = int(cert_milestone['duration'].split('-')[1].split()[0])
                    if max_doc_weeks > cert_weeks:
                        total_weeks += (max_doc_weeks - cert_weeks)
        
        # Calculate dates
        start_date = datetime.now()
        end_date = start_date + timedelta(weeks=total_weeks)
        
        # Get team requirements for the selected timeline
        team_reqs = TEAM_REQUIREMENTS.get(timeline_option, TEAM_REQUIREMENTS['standard'])
        
        # Adjust team requirements based on markets and industry
        if len(markets) > 2:
            # Add market-specific roles for multiple markets
            team_reqs.append({
                'role': 'International Market Specialist',
                'commitment': 'Part-time'
            })
            
        if industry == 'Food Products':
            # Add food-specific role
            team_reqs.append({
                'role': 'Food Safety Specialist',
                'commitment': 'Part-time'
            })
        
        # Construct the final resource estimate
        return {
            'cost_estimate': {
                'currency': 'USD',
                'min': min_cost,
                'max': max_cost,
                'average': adjusted_cost,
                'breakdown': cost_breakdown
            },
            'timeline_estimate': {
                'timeline_option': timeline_option,
                'total_weeks': total_weeks,
                'start_date': start_date.strftime('%Y-%m-%d'),
                'estimated_completion_date': end_date.strftime('%Y-%m-%d')
            },
            'team_requirements': team_reqs,
            'metadata': {
                'industry': industry,
                'markets': markets,
                'company_size': company_size,
                'generated_at': datetime.now().isoformat()
            }
        }
    except Exception as e:
        logger.error(f"Error estimating resource requirements: {str(e)}")
        # Return a default estimate
        return {
            'cost_estimate': {
                'currency': 'USD',
                'min': 35000,
                'max': 65000,
                'average': 50000,
                'breakdown': {
                    'product_adaptation': 15000,
                    'certification': 12500,
                    'logistics': 10000,
                    'marketing': 7500,
                    'other': 5000
                }
            },
            'timeline_estimate': {
                'timeline_option': timeline_option,
                'total_weeks': 32,
                'start_date': datetime.now().strftime('%Y-%m-%d'),
                'estimated_completion_date': (datetime.now() + timedelta(weeks=32)).strftime('%Y-%m-%d')
            },
            'team_requirements': TEAM_REQUIREMENTS['standard']
        }

def estimate_roi(industry, markets, timeline_option='standard', projected_sales=None):
    """
    Estimate return on investment for an export project.
    
    Args:
        industry: Industry name
        markets: List of target markets
        timeline_option: Selected timeline option
        projected_sales: Dictionary with projected sales by year
        
    Returns:
        Dictionary with ROI estimates
    """
    try:
        # Get cost estimates
        resource_estimate = estimate_resource_requirements(
            industry, markets, timeline_option
        )
        
        # Get the average cost
        export_cost = resource_estimate['cost_estimate']['average']
        
        # If no projected sales provided, use industry averages
        if not projected_sales:
            # Default sales projections as percentage of investment
            projected_sales = {
                'year_1': export_cost * 0.7,    # 70% of investment
                'year_2': export_cost * 1.5,    # 150% of investment
                'year_3': export_cost * 2.2     # 220% of investment
            }
            
            # Adjust based on industry
            industry_factors = {
                'Food Products': 1.1,         # Good growth potential
                'Beverages': 1.15,            # Strong growth potential
                'Textiles': 0.9,              # Moderate growth potential
                'Electronics': 1.2,           # High growth potential
                'Pharmaceuticals': 1.3        # Very high growth potential
            }
            
            factor = industry_factors.get(industry, 1.0)
            for year in projected_sales:
                projected_sales[year] *= factor
                
            # Adjust based on number of markets
            market_factor = 1.0 + ((len(markets) - 1) * 0.2)  # 20% increase per additional market
            for year in projected_sales:
                projected_sales[year] *= market_factor
        
        # Calculate ROI
        total_sales = sum(projected_sales.values())
        profit_margin = 0.2  # Assume 20% profit margin
        total_profit = total_sales * profit_margin
        roi = (total_profit - export_cost) / export_cost * 100
        
        # Calculate payback period (years)
        annual_profit = total_profit / len(projected_sales)
        payback_period = export_cost / annual_profit
        
        return {
            'roi_percentage': round(roi, 1),
            'payback_period_years': round(payback_period, 1),
            'total_projected_sales': round(total_sales, 2),
            'total_projected_profit': round(total_profit, 2),
            'investment_cost': round(export_cost, 2),
            'yearly_projections': {
                year: round(value, 2) for year, value in projected_sales.items()
            }
        }
    except Exception as e:
        logger.error(f"Error estimating ROI: {str(e)}")
        # Return a default estimate
        return {
            'roi_percentage': 50.0,
            'payback_period_years': 2.0,
            'total_projected_sales': 150000,
            'total_projected_profit': 30000,
            'investment_cost': 50000,
            'yearly_projections': {
                'year_1': 30000,
                'year_2': 50000,
                'year_3': 70000
            }
        }

def estimate_funding_options(cost_estimate, company_size='medium', industry='general'):
    """
    Estimate funding options based on cost estimate.
    
    Args:
        cost_estimate: Cost estimate dictionary
        company_size: Company size (small, medium, large)
        industry: Industry name
        
    Returns:
        List of funding options
    """
    try:
        total_cost = cost_estimate['average']
        
        # Base funding options
        funding_options = [
            {
                'name': 'Self-Funding',
                'description': 'Using company resources to fund export activities',
                'pros': ['No debt obligations', 'Complete control over process', 'No external approval needed'],
                'cons': ['Limited by available capital', 'Higher financial risk to the company'],
                'suitability_score': 3  # Medium suitability
            },
            {
                'name': 'Bank Loan',
                'description': 'Traditional bank financing for export activities',
                'pros': ['Potentially lower interest rates', 'No equity dilution', 'Established process'],
                'cons': ['May require collateral', 'Approval process can be lengthy', 'Debt obligation'],
                'suitability_score': 4  # High suitability
            },
            {
                'name': 'Export Credit Agency',
                'description': 'Government-backed financing specifically for exports',
                'pros': ['Specialized in export financing', 'May offer better terms than commercial banks', 'Additional support services'],
                'cons': ['Application process can be complex', 'May have country restrictions'],
                'suitability_score': 5  # Very high suitability
            },
            {
                'name': 'Grant Programs',
                'description': 'Government grants for export market development',
                'pros': ['Non-repayable funding', 'Additional support services', 'Network opportunities'],
                'cons': ['Competitive application process', 'Limited funding amounts', 'Specific requirements'],
                'suitability_score': 3  # Medium suitability
            }
        ]
        
        # Adjust suitability scores based on company size
        if company_size == 'small':
            # Small companies might benefit more from grants and export agencies
            for option in funding_options:
                if option['name'] == 'Grant Programs':
                    option['suitability_score'] += 1
                elif option['name'] == 'Export Credit Agency':
                    option['suitability_score'] += 1
                elif option['name'] == 'Self-Funding':
                    option['suitability_score'] -= 1
        elif company_size == 'large':
            # Large companies might benefit more from self-funding
            for option in funding_options:
                if option['name'] == 'Self-Funding':
                    option['suitability_score'] += 1
                elif option['name'] == 'Grant Programs':
                    option['suitability_score'] -= 1
        
        # Adjust based on industry
        food_industries = ['Food Products', 'Beverages']
        if industry in food_industries:
            # Add industry-specific option
            funding_options.append({
                'name': 'Food Industry Export Program',
                'description': 'Specialized funding for food exporters',
                'pros': ['Industry-specific support', 'Networking with other food exporters', 'Technical assistance'],
                'cons': ['Competitive application', 'Industry-specific requirements'],
                'suitability_score': 4  # High suitability
            })
        
        # Sort by suitability score (descending)
        funding_options.sort(key=lambda x: x['suitability_score'], reverse=True)
        
        return funding_options
    except Exception as e:
        logger.error(f"Error estimating funding options: {str(e)}")
        return [
            {
                'name': 'Self-Funding',
                'description': 'Using company resources to fund export activities',
                'pros': ['No debt obligations', 'Complete control over process'],
                'cons': ['Limited by available capital', 'Higher financial risk'],
                'suitability_score': 3
            },
            {
                'name': 'Bank Loan',
                'description': 'Traditional bank financing for export activities',
                'pros': ['Potentially lower interest rates', 'No equity dilution'],
                'cons': ['May require collateral', 'Approval process can be lengthy'],
                'suitability_score': 4
            }
        ] 