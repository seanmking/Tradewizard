from typing import List, Dict, Optional
from datetime import datetime

class AssessmentService:
    def __init__(self):
        """Initialize the assessment service with AI-driven conversational questions"""
        self.questions = [
            {
                'id': 'introduction',
                'text': "Hi there! I'm Sarah, your export readiness consultant. To help your business explore international opportunities, could you please tell me your name, your role, and the full name of the business you're representing?",
                'extract': ['first_name', 'last_name', 'role', 'business_name', 'business_entity_type']
                # The LLM will attempt to extract business_entity_type if included, otherwise left blank for verification form
            },
            {
                'id': 'website',
                'text': "Thanks, {first_name}! Could you share your business website URL? This will help me understand your products and current markets.",
                'extract': ['website_url']
            },
            {
                'id': 'export_motivation',
                'text': "Great! And what's motivating you to explore export opportunities for {business_name}? Understanding your vision will help me guide you through the process.",
                'extract': ['export_motivation', 'export_goals']
            },
            {
                'id': 'business_verification_intro',
                'text': "Thanks for sharing that. I've gathered some information about {business_name} from your website. To proceed with your export readiness assessment, we'll need to verify a few business details. This helps us provide the most accurate guidance for your specific situation.",
                'extract': []  # Transition message, no extraction needed
            }
        ]

        # Verification fields for the business verification form
        self.verification_fields = [
            # Business Identity
            {
                'id': 'legal_business_name',
                'label': 'Full Legal Business Name',
                'type': 'text',
                'prefill': 'business_name',  # Pre-filled from initial questions
                'required': True
            },
            {
                'id': 'entity_type',
                'label': 'Business Entity Type',
                'type': 'dropdown',
                'options': ['Pty Ltd', 'CC', 'Sole Proprietor', 'Partnership', 'Other'],
                'prefill': 'business_entity_type',  # Pre-filled if detected
                'required': True
            },
            {
                'id': 'registration_number',
                'label': 'Business Registration Number',
                'type': 'text',
                'required': True
            },
            {
                'id': 'tax_number',
                'label': 'Tax/VAT Number',
                'type': 'text',
                'required': True
            },
            {
                'id': 'year_established',
                'label': 'Year Established',
                'type': 'number',
                'prefill': 'website_extract.year_founded',  # Pre-filled from website analysis
                'required': True
            },
            {
                'id': 'physical_address',
                'label': 'Physical Address',
                'type': 'textarea',
                'prefill': 'website_extract.location',  # Pre-filled from website analysis
                'required': True
            },
            # Industry Information
            {
                'id': 'industry_subsector',
                'label': 'Industry Subsector',
                'type': 'dropdown',
                'dependent_on': 'industry_sector',  # Dynamic options based on sector
                'prefill': 'website_extract.subsector',  # Suggested from website analysis
                'required': True
            },
            # Contact Information
            {
                'id': 'business_email',
                'label': 'Business Email',
                'type': 'email',
                'prefill': 'website_extract.contact_email',  # Pre-filled from website if available
                'required': True
            },
            {
                'id': 'business_phone',
                'label': 'Business Phone',
                'type': 'tel',
                'prefill': 'website_extract.contact_phone',  # Pre-filled from website if available
                'required': True
            },
            # Export Information (LLM-enhanced)
            {
                'id': 'target_markets',
                'label': 'Target Export Markets',
                'type': 'multi_select',
                'options': 'countries_list',  # Dynamic list of countries
                'prefill': 'llm_extract.target_markets',  # Suggested from motivation + website
                'required': True
            },
            {
                'id': 'export_products',
                'label': 'Products/Services for Export',
                'type': 'multi_select',
                'options': 'website_extract.products',  # Dynamic based on website products
                'prefill': 'website_extract.main_products',  # Pre-suggested main products
                'required': True
            },
            {
                'id': 'export_vision',
                'label': 'Export Vision',
                'type': 'textarea',
                'prefill': 'llm_extract.enhanced_vision',  # LLM-generated from motivation + website
                'required': True,
                'editable': True  # User can modify the suggested vision
            }
        ]

        # Industry sectors from the archive
        self.industry_sectors = {
            'FOOD_PRODUCTS': {
                'label': 'Food Products',
                'subcategories': {
                    'PROCESSED_FOODS': 'Processed Foods',
                    'FRESH_PRODUCE': 'Fresh Produce'
                }
            },
            'BEVERAGES': {
                'label': 'Beverages',
                'subcategories': {
                    'ALCOHOLIC': 'Alcoholic Beverages',
                    'NON_ALCOHOLIC': 'Non-alcoholic Beverages'
                }
            },
            'READY_TO_WEAR': {
                'label': 'Ready-to-Wear',
                'subcategories': {
                    'APPAREL': 'Apparel',
                    'JEWELLERY': 'Jewellery'
                }
            },
            'HOME_GOODS': {
                'label': 'Home Goods',
                'subcategories': {
                    'LEATHER_GOODS': 'Leather Goods',
                    'GIFTING': 'Gifting',
                    'DECOR': 'Decor'
                }
            },
            'NON_PRESCRIPTION_HEALTH': {
                'label': 'Non-Prescription Health',
                'subcategories': {
                    'BEAUTY': 'Beauty Products',
                    'OTC_HEALTH': 'Over-the-counter Health',
                    'WELLNESS': 'Wellness Products',
                    'VITAMINS': 'Vitamin Products'
                }
            }
        }

    def get_questions(self) -> List[Dict]:
        """Return the list of conversational assessment questions"""
        return self.questions

    def get_verification_fields(self) -> List[Dict]:
        """Return the verification form fields"""
        return self.verification_fields

    def get_industry_sectors(self) -> Dict:
        """Return the available industry sectors and their subsectors"""
        return self.industry_sectors

    def extract_website_information(self, website_url: str) -> Dict:
        """
        Extract information from the business website using Perplexity
        For now, uses mock data
        """
        # TODO: Implement Perplexity-based website information extraction
        # This will run while the chat is ongoing
        pass

    def extract_information(self, response: str, extract_fields: List[str]) -> Dict:
        """
        Extract specific information from user responses using AI
        This method will be implemented with LLM integration for intelligent data extraction
        """
        # TODO: Implement AI-powered information extraction
        # This will use LLM to parse free-form text and extract structured data
        # Special handling for business_entity_type extraction from business name
        pass

    def enhance_export_vision(self, motivation: str, website_data: Dict) -> str:
        """
        Enhance the export vision using LLM by combining motivation and website insights
        """
        # TODO: Implement LLM-based vision enhancement
        pass

    def validate_business_details(self, registration_number: str, tax_number: str) -> Dict:
        """
        Validate business registration and tax information
        For now, uses mock data
        """
        # TODO: Implement actual validation API calls
        pass

    def process_response(self, question_id: str, response: str) -> Dict:
        """
        Process a user's response to a specific question
        Returns extracted information and any follow-up actions needed
        """
        # Find the question and its extraction fields
        question = next((q for q in self.questions if q['id'] == question_id), None)
        if not question:
            return {'error': 'Question not found'}

        # Extract information from the response
        extracted_data = self.extract_information(response, question.get('extract', []))
        
        # If this is the website question, trigger website analysis
        if question_id == 'website':
            website_data = self.extract_website_information(extracted_data.get('website_url'))
            extracted_data['website_extract'] = website_data

        # If this is the export motivation question, enhance the vision
        if question_id == 'export_motivation' and 'website_extract' in extracted_data:
            enhanced_vision = self.enhance_export_vision(
                extracted_data.get('export_motivation', ''),
                extracted_data.get('website_extract', {})
            )
            extracted_data['llm_extract'] = {'enhanced_vision': enhanced_vision}
        
        return {
            'extracted_data': extracted_data,
            'next_question': self.determine_next_question(question_id, extracted_data)
        }

    def determine_next_question(self, current_question_id: str, extracted_data: Dict) -> Optional[str]:
        """
        Determine the next question based on current response
        This allows for dynamic conversation flow based on user responses
        """
        # Question flow:
        # introduction -> website -> export_motivation -> business_verification_intro -> verification_form
        question_flow = {
            'introduction': 'website',
            'website': 'export_motivation',
            'export_motivation': 'business_verification_intro',
            'business_verification_intro': None  # End of questions, show verification form
        }
        return question_flow.get(current_question_id)

    def save_assessment(self, user_id: str, responses: Dict) -> Dict:
        """
        Save the assessment responses and extracted information for a user
        Returns the saved assessment data
        """
        # TODO: Implement save logic with database integration
        pass 