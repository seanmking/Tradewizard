"""Assessment questions and formatting utilities."""

QUESTIONS = [
    {
        'id': 'business_details',
        'text': 'Could you please tell me your name, your role, and the name of your business?',
        'extract': ['first_name', 'last_name', 'role', 'business_name']
    },
    {
        'id': 'business_type',
        'text': 'What type of business entity are you (e.g., Pty Ltd, CC, Sole Proprietor)?',
        'extract': ['business_type']
    },
    {
        'id': 'industry_sector',
        'text': 'Which industry sector does your business operate in?',
        'extract': ['industry']
    }
]

def format_question(question, context):
    """Format a question with context if available."""
    if not context:
        return question['text']
        
    try:
        return question['text'].format(**context)
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