"""Question definitions for the assessment system."""

QUESTIONS = [
    # Initial Connection Stage
    {
        'id': 'user_details',
        'text': "Hi there! I'm Sarah, your export readiness consultant. I'm here to help evaluate your business's export potential. To get started, could you please tell me your name, your role, and the name of your business?",
        'extract': ['first_name', 'last_name', 'full_name', 'role', 'business_name']
    },
    {
        'id': 'website',
        'text': "Great to meet you {first_name}! Could you share your website url where we can learn more about what you do?",
        'extract': ['website_url']
    },
    {
        'id': 'business_age',
        'text': "How long has {business_name} been operating?",
        'extract': ['business_age']
    },
    
    # Product Production Stage
    {
        'id': 'main_product',
        'text': "Fantastic, now please tell me about the main product you want to export - what exactly is it?",
        'extract': ['product_info']
    },
    {
        'id': 'current_volume',
        'text': "What's your current monthly unit production volume for this product?",
        'extract': ['volume']
    },
    {
        'id': 'scale_capacity',
        'text': "Could you scale up production if you received large international orders? What is your maximum unit production capacity per month for your main product?",
        'extract': ['capacity']
    },
    {
        'id': 'manufacturing',
        'text': "Do you manufacture this product yourself or do you outsource production?",
        'extract': ['manufacturing_type']
    },
    {
        'id': 'export_restrictions',
        'text': "Are any of your product's ingredients or components subject to export restrictions or require special permits for your target markets?",
        'extract': ['restrictions']
    },
    
    # Business Operations Stage
    {
        'id': 'largest_order',
        'text': "What unit quantity does your largest customer purchase from you monthly?",
        'extract': ['order_size']
    },
    {
        'id': 'order_capacity',
        'text': "If you received an international order today that's 3 times your typical volume to your largest customer, how long would it take you to have the goods ready for distribution, while not impacting your existing business?",
        'extract': ['timeline']
    },
    {
        'id': 'product_adaptation',
        'text': "Have you had to adapt your product for different customers? Tell me about that experience.",
        'extract': ['adaptation_info']
    },
    {
        'id': 'special_handling',
        'text': "Do your products require special handling requirements (eg. Temperature control)? If so what are the special handling requirements?",
        'extract': ['handling_reqs']
    },
    
    # Market Understanding Stage
    {
        'id': 'target_countries',
        'text': "Which specific countries are you looking to export to first?",
        'extract': ['target_countries']
    },
    {
        'id': 'market_research',
        'text': "Have you researched the market opportunities in these markets for your main product?",
        'extract': ['research_info']
    },
    {
        'id': 'international_interest',
        'text': "Have you received any international inquiries or interest already?",
        'extract': ['interest_info']
    },
    {
        'id': 'competitors',
        'text': "Who do you see as your main competitors in these markets?",
        'extract': ['competitor_info']
    },
    
    # Practical Readiness Stage
    {
        'id': 'team_dedication',
        'text': "Do you have team members who can dedicate time to developing export markets?",
        'extract': ['team_info']
    },
    {
        'id': 'timeline',
        'text': "What's your timeline for starting exports?",
        'extract': ['timeline_info']
    },
    {
        'id': 'resources',
        'text': "What financial resources have you set aside for market development?",
        'extract': ['resource_info']
    },
    {
        'id': 'challenges',
        'text': "What do you see as your biggest challenge in going global?",
        'extract': ['challenge_info']
    },
    
    # Technical Requirements Stage
    {
        'id': 'technical_intro',
        'text': "Now let's review your technical requirements. I'll help you track these important items:",
        'extract': []
    },
    {
        'id': 'business_registration',
        'text': "First, let's check your business registration and core documents. Do you have: 1) CIPC Registration, 2) Tax Clearance Certificate, 3) Business Bank Account?",
        'extract': ['registration_status', 'missing_items']
    },
    {
        'id': 'export_permits',
        'text': "For export registration, do you have: 1) SARS Exporter Number, 2) SARS Customs Code, 3) ITAC Registration?",
        'extract': ['permit_status', 'missing_permits']
    },
    {
        'id': 'product_documentation',
        'text': "Regarding product documentation, do you have: 1) Technical Specifications, 2) Safety Documentation, 3) Quality Certifications?",
        'extract': ['documentation_status', 'missing_docs']
    },
    {
        'id': 'quality_compliance',
        'text': "For quality and compliance, do you have: 1) Quality Management System, 2) Product Testing Process?",
        'extract': ['compliance_status', 'missing_compliance']
    },
    {
        'id': 'market_requirements',
        'text': "Based on your target markets ({target_markets}), do you have the required certifications and registrations?",
        'extract': ['market_cert_status', 'missing_certs']
    },
    {
        'id': 'financial_readiness',
        'text': "Finally, for financial setup, do you have: 1) Export Finance, 2) Credit Insurance, 3) Forex Account?",
        'extract': ['financial_status', 'missing_financial']
    },
    
    # Final Summary
    {
        'id': 'final_summary',
        'text': "Thank you for completing the assessment. I'll now analyze your responses and provide a comprehensive evaluation of your export readiness, along with specific recommendations for your next steps.",
        'extract': []
    }
]

# Technical requirements checklist structure
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

def format_question(question: dict, context: dict) -> str:
    """Format a question with context variables."""
    try:
        return question['text'].format(**context)
    except KeyError:
        return question['text']

def get_checklist_category(category: str) -> dict:
    """Get a specific checklist category and its items."""
    return CHECKLIST_CATEGORIES.get(category, {}) 