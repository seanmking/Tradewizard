"""
Handles extraction of information from user responses and manages conversation flow.
Uses regex patterns and LLM to process responses and generate natural conversation.
"""
import re
from typing import Optional, Any, Dict, List
import requests
from assessment_questions import get_question, format_question, get_question_type

OLLAMA_API_URL = "http://localhost:11434/api/generate"

def validate_response_completeness(extracted_info: Any, question_type: str) -> bool:
    """
    Validate if the extracted information meets the requirements for the question type
    """
    if not extracted_info:
        return False
        
    if question_type == 'NUMERIC':
        return isinstance(extracted_info, (int, float)) and extracted_info > 0
    elif question_type == 'BOOLEAN':
        # More flexible boolean validation - accept any response for export restrictions
        if isinstance(extracted_info, dict) and 'has_restrictions' in extracted_info:
            return True  # Accept any response about restrictions
        return extracted_info in ['yes', 'no', 'in-house', 'outsourced', 'unclear']
    elif question_type == 'CHECKLIST':
        return all(k in extracted_info for k in ['has_item', 'status', 'details'])
    elif question_type == 'DESCRIPTIVE':
        return len(str(extracted_info).strip()) > 10  # Minimum meaningful response
    elif question_type == 'IDENTIFICATION' and isinstance(extracted_info, dict):
        # For business details, require at least the business name
        # Website is optional if explicitly stated none/no website
        if 'business_name' not in extracted_info or not extracted_info['business_name']:
            return False
        if 'website' not in extracted_info:
            return False  # Need explicit confirmation about website
        return True
    
    return True  # Default to true for other types

def check_llm_health() -> tuple[bool, str]:
    """
    Check if the LLM service is running and responding correctly.
    Returns:
        tuple: (is_healthy: bool, message: str)
    """
    try:
        # Simple test prompt
        response = requests.post(
            OLLAMA_API_URL,
            json={
                "model": "mistral",
                "prompt": "Say 'ok' if you can read this.",
                "system": "You are a test service. Be brief.",
                "stream": False
            },
            timeout=5
        )
        
        if response.status_code != 200:
            return False, f"LLM service returned status code {response.status_code}"
            
        response_text = response.json().get('response', '').lower()
        if 'ok' not in response_text:
            return False, "LLM service response was unexpected"
            
        return True, "LLM service is healthy"
        
    except requests.exceptions.ConnectionError:
        return False, "Cannot connect to LLM service. Is Ollama running?"
    except requests.exceptions.Timeout:
        return False, "LLM service timed out"
    except Exception as e:
        return False, f"Error checking LLM health: {str(e)}"

def get_llm_response(message: str, current_index: int, context: dict) -> dict:
    """
    Process user response and manage conversation flow.
    
    Args:
        message: User's message
        current_index: Current question index
        context: Current conversation context
        
    Returns:
        Dict containing:
        - response: AI's response to user
        - complete: Whether the current question is answered
        - context_updates: Any updates to the conversation context
    """
    try:
        current_q = get_question(current_index)
        if not current_q:
            return {
                'response': "Thank you for completing the assessment! I'll analyze your responses and provide recommendations.",
                'complete': True,
                'context_updates': {}
            }

        # Extract information from user's response
        extracted_info = extract_info(message, current_q['extract_key'])
        
        # Create temporary context for next question formatting
        temp_context = {**context}
        if extracted_info and current_q['store_as'] != 'none':
            if isinstance(extracted_info, dict) and current_q['id'] == 'business_details':
                temp_context.update({
                    'business_name': extracted_info.get('business_name', ''),
                    'website': extracted_info.get('website', '')
                })
            elif current_q['id'] == 'name':
                full_name = extracted_info.strip()
                first_name = full_name.split()[0]
                temp_context.update({
                    'first_name': first_name,
                    'full_name': full_name
                })
            else:
                if isinstance(current_q['store_as'], list):
                    for key in current_q['store_as']:
                        temp_context[key] = extracted_info
                else:
                    temp_context[current_q['store_as']] = extracted_info

        next_q = get_question(current_index + 1)
        
        # Prepare system prompt with full context
        system_prompt = f"""You are Sarah, an export consultant chatting with a business owner. Be natural and friendly, like you're having a coffee with them.

CONTEXT:
- Current Question: {format_question(current_q, context)}
- Next Question: {format_question(next_q, temp_context) if next_q else "Final response"}
- User Response: {message}

GUIDELINES:
- Chat naturally, like you would in person
- Keep it short and sweet
- If you need info, just ask for it simply
- Move the conversation along naturally

Remember: You're a real person having a real conversation. No corporate speak, no repetition, no unnecessary formality.

TONE:
- Professional but warm
- Treat the user as a competent business owner
- No unnecessary elaboration or repetition
- Direct questions, clear transitions

Your responses should be concise while maintaining professionalism and clarity."""

        # If we couldn't extract needed information or it's incomplete
        if current_q['extract_key'] != 'none' and (
            not extracted_info or 
            not validate_response_completeness(extracted_info, get_question_type(current_q['id']))
        ):
            response = requests.post(
                OLLAMA_API_URL,
                json={
                    "model": "mistral",
                    "prompt": message,
                    "system": system_prompt,
                    "stream": False
                },
                timeout=10
            )
            
            return {
                'response': response.json()['response'],
                'complete': False,
                'context_updates': {}
            }

        # If we have the information, proceed with natural conversation
        context_updates = {}
        if current_q['store_as'] != 'none':
            if isinstance(extracted_info, dict) and current_q['id'] == 'business_details':
                context_updates = {
                    'business_name': extracted_info.get('business_name', ''),
                    'website': extracted_info.get('website', '')
                }
            elif current_q['id'] == 'name':
                full_name = extracted_info.strip()
                first_name = full_name.split()[0]
                context_updates = {
                    'first_name': first_name,
                    'full_name': full_name
                }
            else:
                if isinstance(current_q['store_as'], list):
                    for key in current_q['store_as']:
                        context_updates[key] = extracted_info
                else:
                    context_updates[current_q['store_as']] = extracted_info

        # Generate natural conversational response
        response = requests.post(
            OLLAMA_API_URL,
            json={
                "model": "mistral",
                "prompt": message,
                "system": system_prompt,
                "stream": False
            },
            timeout=10
        )
        
        return {
            'response': response.json()['response'],
            'complete': True,
            'context_updates': context_updates
        }
            
    except Exception as e:
        print(f"Error in get_llm_response: {str(e)}")
        print(f"Current question: {current_q['id']}")
        print(f"Question type: {get_question_type(current_q['id'])}")
        
        # Simple fallback response without duplicating the question
        if current_q['id'] == 'name':
            response = f"Hi {extracted_info}! "
        else:
            response = ""  # No acknowledgment needed
        
        # Only add the next question if we haven't already
        next_question_text = format_question(next_q, temp_context) if next_q else ""
        if next_q and not response.lower().endswith(next_question_text.lower()):
            response += next_question_text
        
        return {
            'response': response,
            'complete': True,
            'context_updates': context_updates
        }

def generate_clarification(question: Dict[str, Any], message: str) -> str:
    """Generate a clarifying question when we couldn't extract needed information"""
    
    if question['extract_key'] == 'checklist_response':
        return f"I need a clear yes or no for each item. {question['text']}"
    
    # For numeric responses
    if question['extract_key'] in ['volume', 'capacity', 'order_size']:
        return f"Could you please provide a specific number? {question['text']}"
    
    # For timeline responses
    if 'timeline' in question['extract_key']:
        return f"Could you specify a timeframe? {question['text']}"
    
    # Default clarification
    return f"I didn't quite get that. Could you please answer: {question['text']}"

def extract_info(message: str, extract_key: str) -> Any:
    """
    Extract specific information from user message based on the type needed.
    Returns None if no information could be extracted.
    """
    message = message.strip().lower()
    
    # Basic response validation - empty or too short
    if not message or len(message) < 2:
        return None
        
    # Handle different types of information extraction
    if extract_key == 'name':
        name_patterns = [
            r"(?i)my name is\s+([^.,\n]+)",
            r"(?i)i(?:'|')?m\s+([^.,\n]+)",
            r"(?i)this is\s+([^.,\n]+)",
            r"(?i)call me\s+([^.,\n]+)"
        ]
        for pattern in name_patterns:
            match = re.search(pattern, message)
            if match:
                return match.group(1).strip()
        # If short response without patterns, treat as name
        if len(message.split()) <= 4 and not re.search(r'[!@#$%^&*(),.?":{}|<>]', message):
            return message.strip()
        return None
        
    elif extract_key == 'business_details':
        # Extract business name and website
        website_pattern = r'(?:https?://)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,})'
        website_match = re.search(website_pattern, message)
        
        # Check for explicit "no website" statements
        no_website = re.search(r'(?:no|don\'t have|doesn\'t have|not yet|no\s+website)', message) is not None
        
        # Try to find business name
        name_pattern = r'(?i)(?:called|named|is|\'s|business\s+(?:name\s+)?is)\s+([^,.]+?)(?:\s+(?:and|,|\.|at|http)|\s*$)'
        name_match = re.search(name_pattern, message)
        
        if name_match:
            business_name = name_match.group(1).strip()
        else:
            # Fallback: take first capitalized phrase or any text before website/punctuation
            caps_pattern = r'([A-Z][a-zA-Z\s]+?)(?:\s+(?:and|,|\.|at|http)|\s*$)'
            caps_match = re.search(caps_pattern, message)
            if caps_match:
                business_name = caps_match.group(1).strip()
            else:
                # Last resort: take first chunk of text
                business_name = message.split(',')[0].split('.')[0].strip()

        result = {
            'business_name': business_name if business_name else None,
            'website': website_match.group(0) if website_match else None if no_website else ''
        }
        
        return result if (business_name or website_match or no_website) else None
        
    elif extract_key == 'business_age':
        # Look for time periods
        age_pattern = r'(?i)(\d+)\s*(?:year|month|week)s?'
        match = re.search(age_pattern, message)
        return match.group(0) if match else message.strip()
        
    elif extract_key in ['product_info', 'adaptation_info', 'handling_reqs', 
                        'research_info', 'interest_info', 'competitor_info', 
                        'team_info', 'challenge_info']:
        # For descriptive responses, return the cleaned text
        return message.strip()
        
    elif extract_key in ['volume', 'capacity', 'order_size']:
        # Extract numeric values with units
        volume_pattern = r'(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:units?|pcs?|pieces?|items?)?'
        match = re.search(volume_pattern, message)
        return int(match.group(1).replace(',', '')) if match else None
        
    elif extract_key == 'manufacturing_type':
        # Determine if in-house or outsourced
        if re.search(r'(?i)outsource|third.?party|external', message):
            return 'outsourced'
        elif re.search(r'(?i)ourselves|in.?house|own|internal', message):
            return 'in-house'
        return 'unclear'
        
    elif extract_key == 'restrictions':
        # Look for yes/no and details
        if re.search(r'(?i)no restrictions|not restricted|no permits?', message):
            return {'has_restrictions': False, 'details': ''}
        elif re.search(r'(?i)yes|restricted|permits? required', message):
            return {'has_restrictions': True, 'details': message.strip()}
        return {'has_restrictions': 'unclear', 'details': message.strip()}
        
    elif extract_key == 'timeline':
        # Extract time periods
        time_pattern = r'(?i)(\d+)\s*(?:day|week|month|year)s?'
        match = re.search(time_pattern, message)
        return match.group(0) if match else message.strip()
        
    elif extract_key == 'countries':
        # Extract country names and reasons
        # This is a simplified version - could be expanded with a full country list
        country_pattern = r'(?i)((?:united\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)'
        countries = re.findall(country_pattern, message)
        return {
            'countries': countries,
            'explanation': message.strip()
        }
        
    elif extract_key == 'resource_info':
        # Look for monetary values
        money_pattern = r'\$?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:k|m|thousand|million)?'
        match = re.search(money_pattern, message)
        if match:
            amount = float(match.group(1).replace(',', ''))
            unit = match.group(2).lower() if len(match.groups()) > 1 else ''
            multiplier = {
                'k': 1000,
                'thousand': 1000,
                'm': 1000000,
                'million': 1000000
            }.get(unit, 1)
            return amount * multiplier
        return message.strip()
        
    elif extract_key == 'checklist_response':
        # Look for yes/no responses and additional details
        response = {
            'has_item': False,
            'status': 'incomplete',
            'details': ''
        }
        
        # Check for positive responses
        if re.search(r'(?i)yes|have|got|done|complete|ready|available|arranged|in\s+place', message):
            response['has_item'] = True
            response['status'] = 'complete'
            # Extract any additional details after yes
            details_match = re.search(r'(?i)yes[,.]?\s*(.*)', message)
            if details_match and details_match.group(1):
                response['details'] = details_match.group(1).strip()
        
        # Check for "in progress" responses
        elif re.search(r'(?i)progress|working|pending|processing|applying|waiting', message):
            response['has_item'] = True
            response['status'] = 'in_progress'
            response['details'] = message.strip()
        
        # Check for negative responses
        elif re.search(r'(?i)no|don\'t|dont|not|haven\'t|havent', message):
            response['has_item'] = False
            response['status'] = 'incomplete'
            # Extract any additional details after no
            details_match = re.search(r'(?i)no[,.]?\s*(.*)', message)
            if details_match and details_match.group(1):
                response['details'] = details_match.group(1).strip()
        
        return response
    
    return None 