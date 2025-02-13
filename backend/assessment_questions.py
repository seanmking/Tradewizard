"""
Defines the assessment questions and their structure.
Each question has:
- id: unique identifier
- text: what to ask the user
- extract_key: what type of information to extract
- store_as: where to store the answer in context
- question_type: category of question for consistent handling
"""
from typing import Dict, Any, Optional

# Question type categories for consistent handling
QUESTION_TYPES = {
    'IDENTIFICATION': ['name', 'business_details'],
    'NUMERIC': ['current_volume', 'scale_capacity', 'largest_order'],
    'TIMELINE': ['business_age', 'order_capacity', 'timeline'],
    'DESCRIPTIVE': ['main_product', 'product_adaptation', 'market_research', 'challenges'],
    'CHECKLIST': ['business_registration', 'export_permits', 'product_documentation', 'quality_compliance'],
    'BOOLEAN': ['manufacturing', 'export_restrictions', 'international_interest'],
    'RESOURCE': ['team_dedication', 'resources'],
    'LOCATION': ['target_countries'],
    'INFORMATIONAL': ['technical_intro', 'final_summary']
}

def get_question_type(question_id: str) -> str:
    """Determine the type of question based on its ID"""
    for qtype, ids in QUESTION_TYPES.items():
        if question_id in ids:
            return qtype
    return 'DESCRIPTIVE'  # Default to descriptive if no specific type found

QUESTIONS = [
    # Initial Connection Stage
    {
        'id': 'name',
        'text': "Hi there! I'm Sarah, your export readiness consultant. I'm here to help evaluate your business's export potential. To get started, could you please tell me your name?",
        'extract_key': 'name',
        'store_as': ['first_name', 'full_name'],
        'question_type': 'IDENTIFICATION'
    },
    {
        'id': 'business_details',
        'text': "Great to meet you {first_name}! What's the name of your business, and could you share your website url where we can learn more about what you do?",
        'extract_key': 'business_details',
        'store_as': 'business_info',
        'question_type': 'IDENTIFICATION'
    },
    {
        'id': 'business_age',
        'text': "How long has {business_name} been operating?",
        'extract_key': 'business_age',
        'store_as': 'business_age',
        'question_type': 'TIMELINE'
    },
    
    # Product Production Stage
    {
        'id': 'main_product',
        'text': "Fantastic, now please tell me about the main product you want to export - what exactly is it?",
        'extract_key': 'product_info',
        'store_as': 'main_product',
        'question_type': 'DESCRIPTIVE'
    },
    {
        'id': 'current_volume',
        'text': "What's your current monthly unit production volume for this product?",
        'extract_key': 'volume',
        'store_as': 'production_volume',
        'question_type': 'NUMERIC'
    },
    {
        'id': 'scale_capacity',
        'text': "Could you scale up production if you received large international orders? What is your maximum unit production capacity per month for your main product?",
        'extract_key': 'capacity',
        'store_as': 'max_capacity',
        'question_type': 'NUMERIC'
    },
    {
        'id': 'manufacturing',
        'text': "Do you manufacture this product yourself or do you outsource production?",
        'extract_key': 'manufacturing_type',
        'store_as': 'manufacturing_method',
        'question_type': 'BOOLEAN'
    },
    {
        'id': 'export_restrictions',
        'text': "Are any of your product's ingredients or components subject to export restrictions or require special permits for your target markets?",
        'extract_key': 'restrictions',
        'store_as': 'export_restrictions',
        'question_type': 'BOOLEAN'
    },
    
    # Business Operations Stage
    {
        'id': 'largest_order',
        'text': "What unit quantity does your largest customer purchase from you monthly?",
        'extract_key': 'order_size',
        'store_as': 'largest_order_size',
        'question_type': 'NUMERIC'
    },
    {
        'id': 'order_capacity',
        'text': "If you received an international order today that's 3 times your typical volume to your largest customer, how long would it take you to have the goods ready for distribution, while not impacting your existing business?",
        'extract_key': 'timeline',
        'store_as': 'order_fulfillment_time',
        'question_type': 'TIMELINE'
    },
    {
        'id': 'product_adaptation',
        'text': "Have you had to adapt your product for different customers? Tell me about that experience.",
        'extract_key': 'adaptation_info',
        'store_as': 'product_adaptability',
        'question_type': 'DESCRIPTIVE'
    },
    {
        'id': 'special_handling',
        'text': "Do your products require special handling requirements (eg. Temperature control)? If so what are the special handling requirements?",
        'extract_key': 'handling_reqs',
        'store_as': 'handling_requirements',
        'question_type': 'DESCRIPTIVE'
    },
    
    # Market Understanding Stage
    {
        'id': 'target_countries',
        'text': "Which specific countries are you looking to export to first, and why?",
        'extract_key': 'countries',
        'store_as': 'target_markets',
        'question_type': 'LOCATION'
    },
    {
        'id': 'market_research',
        'text': "Have you researched the market opportunities in these markets for your main product?",
        'extract_key': 'research_info',
        'store_as': 'market_research',
        'question_type': 'DESCRIPTIVE'
    },
    {
        'id': 'international_interest',
        'text': "Have you received any international inquiries or interest already?",
        'extract_key': 'interest_info',
        'store_as': 'international_interest',
        'question_type': 'BOOLEAN'
    },
    {
        'id': 'competitors',
        'text': "Who do you see as your main competitors in these markets?",
        'extract_key': 'competitor_info',
        'store_as': 'competitors',
        'question_type': 'DESCRIPTIVE'
    },
    
    # Practical Readiness Stage
    {
        'id': 'team_dedication',
        'text': "Do you have team members who can dedicate time to developing export markets?",
        'extract_key': 'team_info',
        'store_as': 'team_dedication',
        'question_type': 'RESOURCE'
    },
    {
        'id': 'timeline',
        'text': "What's your timeline for starting exports?",
        'extract_key': 'timeline_info',
        'store_as': 'export_timeline',
        'question_type': 'TIMELINE'
    },
    {
        'id': 'resources',
        'text': "What financial resources have you set aside for market development?",
        'extract_key': 'resource_info',
        'store_as': 'financial_resources',
        'question_type': 'RESOURCE'
    },
    {
        'id': 'challenges',
        'text': "What do you see as your biggest challenge in going global?",
        'extract_key': 'challenge_info',
        'store_as': 'main_challenges',
        'question_type': 'DESCRIPTIVE'
    },
    
    # Technical Requirements Stage
    {
        'id': 'technical_intro',
        'text': "Now let's review your technical requirements. I'll help you track these important items:",
        'extract_key': 'none',
        'store_as': 'none',
        'question_type': 'INFORMATIONAL'
    },
    # Business Registration
    {
        'id': 'business_registration',
        'text': "First, let's check your business registration and core documents. Do you have: 1) CIPC Registration, 2) Tax Clearance Certificate, 3) Business Bank Account?",
        'extract_key': 'checklist_response',
        'store_as': 'business_registration_status',
        'question_type': 'CHECKLIST'
    },
    # Export Registration
    {
        'id': 'export_permits',
        'text': "For export registration, do you have: 1) SARS Exporter Number, 2) SARS Customs Code, 3) ITAC Registration?",
        'extract_key': 'checklist_response',
        'store_as': 'export_registration_status',
        'question_type': 'CHECKLIST'
    },
    # Product Documentation
    {
        'id': 'product_documentation',
        'text': "Regarding product documentation, do you have: 1) Technical Specifications, 2) Safety Documentation, 3) Quality Certifications?",
        'extract_key': 'checklist_response',
        'store_as': 'product_documentation_status',
        'question_type': 'CHECKLIST'
    },
    # Quality Compliance
    {
        'id': 'quality_compliance',
        'text': "For quality and compliance, do you have: 1) Quality Management System, 2) Product Testing Process?",
        'extract_key': 'checklist_response',
        'store_as': 'quality_compliance_status',
        'question_type': 'CHECKLIST'
    },
    # Market-Specific Requirements
    {
        'id': 'market_requirements',
        'text': "Based on your target markets ({target_markets}), do you have the required certifications and registrations?",
        'extract_key': 'checklist_response',
        'store_as': 'market_requirements_status',
        'question_type': 'CHECKLIST'
    },
    # Financial Setup
    {
        'id': 'financial_readiness',
        'text': "Finally, for financial setup, do you have: 1) Export Finance, 2) Credit Insurance, 3) Forex Account?",
        'extract_key': 'checklist_response',
        'store_as': 'financial_readiness_status',
        'question_type': 'CHECKLIST'
    },
    
    # Final Summary
    {
        'id': 'final_summary',
        'text': "Thank you for completing the assessment. I'll now analyze your responses and provide a comprehensive evaluation of your export readiness, along with specific recommendations for your next steps.",
        'extract_key': 'none',
        'store_as': 'none',
        'question_type': 'INFORMATIONAL'
    }
]

def get_question(index: int) -> Optional[Dict[str, Any]]:
    """Get question at specified index"""
    if 0 <= index < len(QUESTIONS):
        return QUESTIONS[index]
    return None

def format_question(question: Dict[str, Any], context: Dict[str, Any]) -> str:
    """Format question text with context variables"""
    try:
        return question['text'].format(**context)
    except KeyError as e:
        print(f"Missing context variable: {str(e)}")
        return question['text']

def get_checklist_category(category: str) -> Optional[Dict[str, Any]]:
    """Get a specific checklist category and its items"""
    return CHECKLIST_CATEGORIES.get(category)

# Technical requirements checklist structure - Moved to end to match question flow
CHECKLIST_CATEGORIES = {
    'business_registration': {
        'title': 'Business Registration and Core Documents',
        'items': {
            'cipc_registration': {'priority': 'High', 'required': True, 'description': 'CIPC Registration'},
            'tax_clearance': {'priority': 'High', 'required': True, 'description': 'Tax Clearance Certificate'},
            'vat_registration': {'priority': 'High', 'required': False, 'description': 'VAT Registration'},
            'bbbee_certificate': {'priority': 'Medium', 'required': False, 'description': 'B-BBEE Certificate'},
            'director_ids': {'priority': 'High', 'required': True, 'description': "Directors' ID Documents"},
            'bank_account': {'priority': 'High', 'required': True, 'description': 'Business Bank Account'},
            'financial_statements': {'priority': 'High', 'required': True, 'description': 'Financial Statements'}
        }
    },
    'export_registration': {
        'title': 'Export Registration and Permits',
        'items': {
            'sars_exporter': {'priority': 'High', 'required': True, 'description': 'SARS Exporter Number'},
            'sars_customs': {'priority': 'High', 'required': True, 'description': 'SARS Customs Code'},
            'itac_registration': {'priority': 'High', 'required': True, 'description': 'ITAC Registration'},
            'export_permit': {'priority': 'High', 'required': True, 'description': 'Export Permit'}
        }
    },
    'product_documentation': {
        'title': 'Product Documentation',
        'items': {
            'tech_specs': {'priority': 'High', 'required': True, 'description': 'Technical Specifications'},
            'ingredient_lists': {'priority': 'High', 'required': False, 'description': 'Ingredient Lists'},
            'safety_docs': {'priority': 'High', 'required': True, 'description': 'Safety Documentation'},
            'testing_results': {'priority': 'High', 'required': True, 'description': 'Product Testing Results'},
            'quality_certs': {'priority': 'High', 'required': True, 'description': 'Quality Certifications'}
        }
    },
    'quality_compliance': {
        'title': 'Quality and Compliance',
        'items': {
            'haccp': {'priority': 'High', 'required': False, 'description': 'HACCP (Food)'},
            'iso_cert': {'priority': 'Medium', 'required': False, 'description': 'ISO Certification'},
            'quality_system': {'priority': 'High', 'required': True, 'description': 'Quality Management System'},
            'testing_process': {'priority': 'High', 'required': True, 'description': 'Product Testing Process'},
            'batch_tracking': {'priority': 'Medium', 'required': False, 'description': 'Batch Tracking System'}
        }
    },
    'uk_requirements': {
        'title': 'United Kingdom Requirements',
        'items': {
            'ce_ukca': {'priority': 'High', 'required': True, 'description': 'CE/UKCA Marking'},
            'health_certs': {'priority': 'High', 'required': False, 'description': 'Health Certificates'},
            'uk_registration': {'priority': 'High', 'required': True, 'description': 'Product Registration'},
            'uk_labeling': {'priority': 'High', 'required': True, 'description': 'Labeling Compliance'}
        }
    },
    'uae_requirements': {
        'title': 'United Arab Emirates Requirements',
        'items': {
            'halal_cert': {'priority': 'High', 'required': False, 'description': 'Halal Certification'},
            'uae_registration': {'priority': 'High', 'required': True, 'description': 'UAE Product Registration'},
            'arabic_labeling': {'priority': 'High', 'required': True, 'description': 'Arabic Labeling'},
            'import_permit': {'priority': 'High', 'required': True, 'description': 'Import Permit'}
        }
    },
    'financial_setup': {
        'title': 'Financial Setup',
        'items': {
            'export_finance': {'priority': 'High', 'required': True, 'description': 'Export Finance'},
            'credit_insurance': {'priority': 'High', 'required': True, 'description': 'Credit Insurance'},
            'forex_account': {'priority': 'High', 'required': True, 'description': 'Forex Account'},
            'payment_terms': {'priority': 'Medium', 'required': True, 'description': 'Payment Terms'}
        }
    }
} 