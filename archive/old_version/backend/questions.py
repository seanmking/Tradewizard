"""Assessment questions and formatting utilities with improved conversation flow."""

QUESTIONS = [
    {
        'id': 'personal_introduction',
        'text': "Hi there! I'm Sarah, your export readiness consultant. I'm excited to help you explore international opportunities for your business. Could you please tell me your name, your role, and the name of your business?",
        'extract': ['first_name', 'last_name', 'role', 'business_name']
    },
    {
        'id': 'website_info',
        'text': "Thanks, {first_name}! It's great to meet you. Could you share your business website URL? This will help me understand more about {business_name} while we chat.",
        'extract': ['business_website']
    },
    {
        'id': 'export_aspirations',
        'text': "Excellent! While I review your website information, I'd love to hear what sparked your interest in exploring international markets. What are your main export goals for {business_name}? Please give as much detail as possible so I can assist craft the best possible export path for your business.",
        'extract': ['export_goals', 'target_markets']
    },
    {
        'id': 'business_verification_intro',
        'text': "Thanks for sharing that. I've gathered some information about {business_name} from your website. To proceed with your export readiness assessment, we'll need to verify a few business details. This helps us provide the most accurate guidance for your specific situation.",
        'extract': []  # Transition message, no extraction needed
    }
    # Additional verification questions will follow after website data is processed
]

def format_question(question, context):
    """Format a question with context if available."""
    if not context:
        return question['text']
        
    try:
        # Filter out empty values from context
        clean_context = {k: v for k, v in context.items() if v}
        if not clean_context:
            return question['text']
        return question['text'].format(**clean_context)
    except KeyError:
        return question['text']

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

def get_checklist_category(category: str) -> dict:
    """Get a specific checklist category and its items."""
    return CHECKLIST_CATEGORIES.get(category, {}) 