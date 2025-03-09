"""
Export timeline analysis module.

This module provides functionality for generating export timeline options
and estimating project durations.
"""

import logging
from datetime import datetime, timedelta
import json

# Configure logging
logger = logging.getLogger(__name__)

# Standard timeline templates
TIMELINE_TEMPLATES = {
    'standard': {
        'id': 'standard',
        'title': 'Standard Timeline',
        'description': 'Balanced approach with moderate resource investment',
        'timeframe': '6-8 months',
        'total_weeks': 32,  # 8 months
        'milestones': [
            {'label': 'Market Research & Strategy', 'duration': '4-6 weeks'},
            {'label': 'Product Adaptation', 'duration': '8-10 weeks'},
            {'label': 'Certification & Documentation', 'duration': '6-8 weeks'},
            {'label': 'Logistics Setup', 'duration': '4 weeks'},
            {'label': 'Go Live & First Shipment', 'duration': '2 weeks'}
        ]
    },
    'accelerated': {
        'id': 'accelerated',
        'title': 'Accelerated Entry',
        'description': 'Fast market entry with increased resource investment',
        'timeframe': '3-4 months',
        'total_weeks': 16,  # 4 months
        'milestones': [
            {'label': 'Market Research & Strategy', 'duration': '2-3 weeks'},
            {'label': 'Product Adaptation', 'duration': '4-5 weeks'},
            {'label': 'Certification & Documentation', 'duration': '3-4 weeks'},
            {'label': 'Logistics Setup', 'duration': '2 weeks'},
            {'label': 'Go Live & First Shipment', 'duration': '1 week'}
        ]
    },
    'conservative': {
        'id': 'conservative',
        'title': 'Conservative Approach',
        'description': 'Thorough planning with minimized risk',
        'timeframe': '10-12 months',
        'total_weeks': 48,  # 12 months
        'milestones': [
            {'label': 'Market Research & Strategy', 'duration': '8-10 weeks'},
            {'label': 'Product Adaptation', 'duration': '12-14 weeks'},
            {'label': 'Certification & Documentation', 'duration': '10-12 weeks'},
            {'label': 'Logistics Setup', 'duration': '6-8 weeks'},
            {'label': 'Go Live & First Shipment', 'duration': '4 weeks'}
        ]
    }
}

def generate_timeline_options(industry, markets):
    """
    Generate export timeline options for the given industry and markets.
    
    Args:
        industry: Industry name
        markets: List of target markets
        
    Returns:
        List of timeline options
    """
    try:
        # Start with standard options
        options = list(TIMELINE_TEMPLATES.values())
        
        # Adjust options based on industry
        if industry == 'Food Products':
            # Food products often require additional certifications
            for option in options:
                # Add a food-specific milestone
                food_milestone = {'label': 'Food Safety Certification', 'duration': '4-6 weeks'}
                option['milestones'].insert(2, food_milestone)
                
                # Update timeframes
                if option['id'] == 'standard':
                    option['timeframe'] = '7-9 months'
                    option['total_weeks'] = 36
                elif option['id'] == 'accelerated':
                    option['timeframe'] = '4-5 months'
                    option['total_weeks'] = 20
                elif option['id'] == 'conservative':
                    option['timeframe'] = '12-14 months'
                    option['total_weeks'] = 56
        
        # Adjust options based on markets
        if 'United Arab Emirates' in markets:
            # UAE often requires Halal certification
            for option in options:
                # Add UAE-specific milestone
                uae_milestone = {'label': 'Halal Certification', 'duration': '6-8 weeks'}
                
                # Check if we already have a Food Safety Certification milestone
                has_food_cert = any('Food Safety' in m['label'] for m in option['milestones'])
                
                if has_food_cert:
                    # Insert after food safety certification
                    food_index = next(i for i, m in enumerate(option['milestones']) if 'Food Safety' in m['label'])
                    option['milestones'].insert(food_index + 1, uae_milestone)
                else:
                    # Insert at certification phase
                    cert_index = next(i for i, m in enumerate(option['milestones']) if 'Certification' in m['label'])
                    option['milestones'].insert(cert_index, uae_milestone)
                
                # Update timeframes
                if option['id'] == 'standard':
                    option['timeframe'] = '8-10 months'
                    option['total_weeks'] = 40
                elif option['id'] == 'accelerated':
                    option['timeframe'] = '5-6 months'
                    option['total_weeks'] = 24
                elif option['id'] == 'conservative':
                    option['timeframe'] = '13-15 months'
                    option['total_weeks'] = 60
        
        # Add an image placeholder for each option
        for option in options:
            option['image'] = f"/images/timeline_{option['id']}.svg"
        
        return options
    except Exception as e:
        logger.error(f"Error generating timeline options: {str(e)}")
        # Return default options if there's an error
        return list(TIMELINE_TEMPLATES.values())

def estimate_project_duration(timeline_option, regulatory_documents=None):
    """
    Estimate the project duration based on the selected timeline and regulatory requirements.
    
    Args:
        timeline_option: Selected timeline option ID
        regulatory_documents: Optional list of regulatory documents
        
    Returns:
        Dictionary with duration estimates
    """
    try:
        # Get the base timeline
        timeline = TIMELINE_TEMPLATES.get(timeline_option, TIMELINE_TEMPLATES['standard'])
        
        # Start with the base duration
        total_weeks = timeline['total_weeks']
        
        # Adjust for regulatory documents if provided
        if regulatory_documents:
            # Get critical documents
            critical_docs = [doc for doc in regulatory_documents if doc.get('importance') == 'critical']
            
            # Find the longest timeline for critical documents
            if critical_docs:
                max_doc_weeks = max(doc.get('estimatedTimeInWeeks', 0) for doc in critical_docs)
                
                # Find the certification milestone
                for milestone in timeline['milestones']:
                    if 'Certification' in milestone['label']:
                        # Extract the upper bound of the duration range
                        duration_parts = milestone['duration'].split('-')
                        if len(duration_parts) > 1:
                            cert_weeks = int(duration_parts[1].split()[0])
                            
                            # If regulatory documents take longer, adjust the timeline
                            if max_doc_weeks > cert_weeks:
                                # Add the difference to the total
                                total_weeks += (max_doc_weeks - cert_weeks)
        
        # Calculate estimated dates
        start_date = datetime.now()
        end_date = start_date + timedelta(weeks=total_weeks)
        
        return {
            'timeline_option': timeline_option,
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d'),
            'total_weeks': total_weeks,
            'milestones': _calculate_milestone_dates(timeline['milestones'], start_date)
        }
    except Exception as e:
        logger.error(f"Error estimating project duration: {str(e)}")
        # Return a simplified estimate
        return {
            'timeline_option': timeline_option,
            'start_date': datetime.now().strftime('%Y-%m-%d'),
            'end_date': (datetime.now() + timedelta(weeks=32)).strftime('%Y-%m-%d'),
            'total_weeks': 32,
            'milestones': []
        }

def _calculate_milestone_dates(milestones, start_date):
    """
    Calculate the start and end dates for each milestone.
    
    Args:
        milestones: List of milestone dictionaries
        start_date: Project start date
        
    Returns:
        List of milestones with start and end dates
    """
    result = []
    current_date = start_date
    
    for milestone in milestones:
        # Extract the upper bound of the duration range
        duration_parts = milestone['duration'].split('-')
        if len(duration_parts) > 1:
            weeks = int(duration_parts[1].split()[0])
        else:
            # If no range, just extract the number
            weeks = int(duration_parts[0].split()[0])
        
        # Calculate end date
        end_date = current_date + timedelta(weeks=weeks)
        
        result.append({
            'label': milestone['label'],
            'duration': milestone['duration'],
            'start_date': current_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d')
        })
        
        # Set start date for next milestone
        current_date = end_date
    
    return result

def adjust_timeline_for_product_complexity(timeline_option, product_complexity):
    """
    Adjust timeline based on product complexity.
    
    Args:
        timeline_option: Selected timeline option ID
        product_complexity: Complexity level (1-5, where 5 is most complex)
        
    Returns:
        Adjusted timeline option
    """
    try:
        # Get the base timeline
        timeline = TIMELINE_TEMPLATES.get(timeline_option, TIMELINE_TEMPLATES['standard']).copy()
        
        # Skip adjustment if complexity is medium (3)
        if product_complexity == 3:
            return timeline
        
        # Calculate adjustment factor
        adjustment_factor = (product_complexity - 3) * 0.2  # 20% per level of complexity
        
        # Adjust each milestone
        for milestone in timeline['milestones']:
            # Extract the duration range
            duration_parts = milestone['duration'].split('-')
            
            if len(duration_parts) > 1:
                min_weeks = int(duration_parts[0].split()[0])
                max_weeks = int(duration_parts[1].split()[0])
                
                # Adjust based on complexity
                if product_complexity > 3:  # More complex
                    new_min = int(min_weeks * (1 + adjustment_factor))
                    new_max = int(max_weeks * (1 + adjustment_factor))
                else:  # Less complex
                    new_min = max(1, int(min_weeks * (1 + adjustment_factor)))
                    new_max = max(2, int(max_weeks * (1 + adjustment_factor)))
                
                milestone['duration'] = f"{new_min}-{new_max} weeks"
            else:
                # Handle single value durations
                weeks = int(duration_parts[0].split()[0])
                new_weeks = max(1, int(weeks * (1 + adjustment_factor)))
                milestone['duration'] = f"{new_weeks} weeks"
        
        # Adjust overall timeframe
        timeframe_parts = timeline['timeframe'].split('-')
        if len(timeframe_parts) > 1:
            min_months = int(timeframe_parts[0])
            max_months = int(timeframe_parts[1].split()[0])
            
            new_min = int(min_months * (1 + adjustment_factor))
            new_max = int(max_months * (1 + adjustment_factor))
            
            timeline['timeframe'] = f"{new_min}-{new_max} months"
        
        # Adjust total weeks
        timeline['total_weeks'] = int(timeline['total_weeks'] * (1 + adjustment_factor))
        
        return timeline
    except Exception as e:
        logger.error(f"Error adjusting timeline for product complexity: {str(e)}")
        # Return the original timeline
        return TIMELINE_TEMPLATES.get(timeline_option, TIMELINE_TEMPLATES['standard']) 