"""
Parser for handling personal introduction information.
"""

import re

class PersonalInfoParser:
    def __init__(self):
        # Entity type patterns
        self.entity_patterns = {
            'PTY LTD': r'\b(PTY\.?\s*LTD\.?|PROPRIETARY\s+LIMITED)\b',
            'LTD': r'\b(LTD\.?|LIMITED)\b',
            'CC': r'\b(CC|CLOSE\s+CORPORATION)\b',
            'INC': r'\b(INC\.?|INCORPORATED)\b'
        }
    
    def parse_introduction(self, input_text):
        """
        Parse personal introduction text into structured data.
        Expected format: "Name, Role, Company Name"
        """
        if not input_text:
            return None
            
        try:
            # Split parts and clean whitespace
            parts = [p.strip() for p in input_text.split(',')]
            
            # Extract name (minimum requirement)
            if not parts or not parts[0]:
                return None
                
            result = {
                'first_name': parts[0].split()[0],
                'full_name': parts[0],
                'role': parts[1] if len(parts) > 1 else '',
                'business_info': self._parse_business_info(parts[-1] if len(parts) > 2 else '')
            }
            
            return result
        except Exception as e:
            return None
    
    def _parse_business_info(self, business_text):
        """
        Parse business name and entity type from text.
        """
        if not business_text:
            return {'name': '', 'entity_type': '', 'full_name': ''}
            
        business_text = business_text.strip()
        entity_type = ''
        business_name = business_text
        
        # Find entity type
        for etype, pattern in self.entity_patterns.items():
            if re.search(pattern, business_text.upper()):
                entity_type = etype
                # Remove entity type from business name
                business_name = re.sub(pattern, '', business_text, flags=re.IGNORECASE).strip()
                break
        
        return {
            'name': business_name,
            'entity_type': entity_type,
            'full_name': business_text
        } 