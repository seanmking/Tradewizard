from typing import Dict, Any, List, Optional
import json
from pathlib import Path

# Load mock data
MOCK_DATA_PATH = Path(__file__).parent.parent.parent / 'frontend' / 'src' / 'services' / 'mockData.ts'
MOCK_WEBSITE_PATH = Path(__file__).parent.parent.parent / 'frontend' / 'src' / 'services' / 'mockWebsiteContent.ts'

def extract_mock_data(file_path: Path) -> Dict[str, Any]:
    """Extract mock data from TypeScript file."""
    content = file_path.read_text()
    # Find the content between first { and last }
    start = content.find('{')
    end = content.rfind('}')
    if start == -1 or end == -1:
        raise ValueError(f"Could not find JSON object in {file_path}")
    
    json_str = content[start:end+1]
    # Remove TypeScript type annotations and 'export const'
    json_str = json_str.split('=')[0].strip()
    return json.loads(json_str)

class AssessmentService:
    def __init__(self):
        """Initialize assessment service with mock data."""
        self.mock_company_data = self._load_mock_data('mockData.ts', 'MOCK_COMPANY_DATA')
        self.mock_tax_data = self._load_mock_data('mockData.ts', 'MOCK_TAX_DATA')
        self.mock_contact_data = self._load_mock_data('mockData.ts', 'MOCK_CONTACT_DATA')
        self.mock_website_content = self._load_mock_data('mockWebsiteContent.ts', 'MOCK_WEBSITE_CONTENT')
        
        self.current_step = 0
        self.business_info: Dict[str, Any] = {}
        self.validation_errors: List[str] = []

    def _load_mock_data(self, filename: str, export_name: str) -> Dict[str, Any]:
        """Load specific mock data export from TypeScript file."""
        mock_file = Path(__file__).parent.parent.parent / 'frontend' / 'src' / 'services' / filename
        content = mock_file.read_text()
        
        # Find the specific export
        start_marker = f"export const {export_name}"
        start_idx = content.find(start_marker)
        if start_idx == -1:
            raise ValueError(f"Could not find {export_name} in {filename}")
            
        # Extract the JSON object
        content = content[start_idx:]
        start_brace = content.find('{')
        count = 1
        end_idx = start_brace + 1
        
        while count > 0 and end_idx < len(content):
            if content[end_idx] == '{':
                count += 1
            elif content[end_idx] == '}':
                count -= 1
            end_idx += 1
            
        json_str = content[start_brace:end_idx]
        return json.loads(json_str)

    def start_session(self) -> Dict[str, Any]:
        """Start a new assessment session with initial question."""
        self.current_step = 0
        self.business_info = {}
        self.validation_errors = []
        
        return {
            'message': "Hi there! I'm Sarah, your export readiness consultant. I'm excited to help you explore international opportunities for your business. Could you please tell me your name, your role, and the name of your business?",
            'requires_action': True,
            'action_type': 'input',
            'validation_type': 'personal_introduction'
        }

    def validate_field(self, field: str, value: str) -> Dict[str, Any]:
        """Validate user input based on field type."""
        if field == 'personal_introduction':
            return self._validate_introduction(value)
        elif field == 'business_name':
            return self._validate_business(value)
        elif field == 'website_info':
            return self._validate_website(value)
        elif field == 'export_aspirations':
            return self._validate_export_goals(value)
        
        return {
            'is_valid': False,
            'message': 'Unknown field type',
            'errors': ['Invalid field type for validation']
        }

    def _validate_introduction(self, value: str) -> Dict[str, Any]:
        """Validate personal introduction and extract information."""
        # Store the introduction for later use
        self.business_info['introduction'] = value
        
        return {
            'is_valid': True,
            'message': "Great to meet you! Could you share your business website URL? This will help me understand more about your company while we chat.",
            'next_validation': 'website_info'
        }

    def _validate_business(self, name: str) -> Dict[str, Any]:
        """Validate business name against mock data."""
        # Look for the business in mock data
        company = next(
            (data for data in self.mock_company_data.values() 
             if data['companyName'].lower() == name.lower()),
            None
        )
        
        if company:
            self.business_info['company'] = company
            return {
                'is_valid': True,
                'message': f"I've found {company['companyName']} in our records. I see you're a {company['entityType']} company established in {company['registrationDate'][:4]}. Let's proceed with your export readiness assessment.",
                'next_validation': 'export_aspirations'
            }
        
        return {
            'is_valid': False,
            'message': f"I couldn't find {name} in our records. Could you please verify the company name and try again?",
            'errors': ['Company not found in records']
        }

    def _validate_website(self, url: str) -> Dict[str, Any]:
        """Validate website URL and extract company information."""
        # For POC, we'll check if it matches our mock website
        if 'globalfreshsa' in url.lower():
            self.business_info['website'] = self.mock_website_content['globalfreshsa']
            company_name = "Global Fresh SA"
            return self._validate_business(company_name)
        
        return {
            'is_valid': False,
            'message': "I couldn't find your company website in our records. Could you please verify the URL or provide your company name directly?",
            'next_validation': 'business_name'
        }

    def _validate_export_goals(self, goals: str) -> Dict[str, Any]:
        """Process export goals and provide initial assessment."""
        self.business_info['export_goals'] = goals
        
        # Get company info
        company = self.business_info.get('company', {})
        
        # Check export readiness from mock data
        export_readiness = company.get('exportReadiness', {})
        target_markets = export_readiness.get('targetMarkets', {})
        
        response = {
            'is_valid': True,
            'message': f"Thank you for sharing your export goals. Based on your company profile, I can see that:"
        }
        
        # Build detailed response
        details = []
        if export_readiness.get('experience'):
            details.append(f"- You have {export_readiness['experience']}")
        if target_markets.get('primary'):
            details.append(f"- Your primary target markets are: {', '.join(target_markets['primary'])}")
        if export_readiness.get('exportCapacity'):
            details.append(f"- Your current export capacity is {export_readiness['exportCapacity']}")
        
        if details:
            response['message'] += "\n\n" + "\n".join(details)
            response['message'] += "\n\nWould you like me to provide a detailed assessment of your export readiness for these markets?"
        else:
            response['message'] += "\n\nWould you like me to assess your export readiness for your target markets?"
        
        return response

    def next_step(self) -> Dict[str, Any]:
        """Advance to next assessment step."""
        self.current_step += 1
        
        # Get current company info
        company = self.business_info.get('company', {})
        
        if self.current_step == 1:
            return self._generate_initial_assessment(company)
        elif self.current_step == 2:
            return self._generate_detailed_checklist(company)
        
        return {
            'success': True,
            'message': "Let's continue with your assessment. What specific aspect would you like to explore further?",
            'current_step': self.current_step
        }

    def _generate_initial_assessment(self, company: Dict[str, Any]) -> Dict[str, Any]:
        """Generate initial assessment based on company data."""
        certifications = company.get('businessProfile', {}).get('certifications', [])
        pending_certs = company.get('businessProfile', {}).get('pendingCertifications', [])
        
        message = "Based on my initial assessment, here's where you stand:\n\n"
        
        # Add certification status
        if certifications:
            message += "Current Certifications:\n"
            for cert in certifications:
                if isinstance(cert, dict):
                    message += f"- {cert['name']} (obtained {cert.get('obtained', 'N/A')})\n"
                else:
                    message += f"- {cert}\n"
        
        if pending_certs:
            message += "\nPending Certifications:\n"
            for cert in pending_certs:
                message += f"- {cert['name']} (expected {cert.get('expected', 'N/A')})\n"
        
        return {
            'success': True,
            'message': message + "\n\nWould you like me to provide a detailed checklist of requirements for your target markets?",
            'current_step': self.current_step
        }

    def _generate_detailed_checklist(self, company: Dict[str, Any]) -> Dict[str, Any]:
        """Generate detailed export requirements checklist."""
        export_readiness = company.get('exportReadiness', {})
        target_markets = export_readiness.get('targetMarkets', {}).get('primary', [])
        
        message = "Here's a detailed checklist for your target markets:\n\n"
        
        for market in target_markets:
            message += f"{market} Requirements:\n"
            if market == "UAE":
                message += "1. Halal Certification (Required)\n"
                message += "2. Arabic Labeling (Required)\n"
                message += "3. UAE Product Registration\n"
            elif market == "UK":
                message += "1. UKCA Marking (Required)\n"
                message += "2. UK Food Safety Registration\n"
                message += "3. Product Labeling Compliance\n"
            message += "\n"
        
        return {
            'success': True,
            'message': message + "\nWould you like me to focus on any specific requirement?",
            'current_step': self.current_step
        } 