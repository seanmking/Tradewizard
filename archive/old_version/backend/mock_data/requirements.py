"""Mock data for export requirements and market information."""

EXPORT_REQUIREMENTS = {
    "common": {
        "documentation": [
            "Certificate of Registration",
            "Tax Clearance Certificate",
            "Company Profile",
            "Product Specifications"
        ],
        "certifications": [
            "ISO 9001 (Quality Management)",
            "HACCP (Food Safety)",
            "FSSC 22000 (Food Safety)"
        ],
        "timeline": "3-6 months",
        "estimated_costs": {
            "certifications": "R50,000 - R150,000",
            "documentation": "R5,000 - R15,000"
        }
    },
    "markets": {
        "UAE": {
            "requirements": [
                "Halal Certification",
                "Emirates Quality Mark",
                "Arabic Language Labels"
            ],
            "timeline": "4-8 months",
            "costs": {
                "certification": "R75,000 - R200,000",
                "labeling": "R15,000 - R30,000"
            }
        },
        "UK": {
            "requirements": [
                "UK Food Safety Certification",
                "BRCGS Certification",
                "UK Importer of Record"
            ],
            "timeline": "6-12 months",
            "costs": {
                "certification": "R100,000 - R250,000",
                "registration": "R25,000 - R50,000"
            }
        }
    }
}

# Common requirements for all markets
COMMON_REQUIREMENTS = {
    "documentation": [
        {
            "name": "Certificate of Origin",
            "description": "Document certifying the country of manufacture",
            "timeline": "1-2 weeks",
            "cost_estimate": "R500 - R1,000 per certificate"
        },
        {
            "name": "Commercial Invoice",
            "description": "Detailed invoice for customs purposes",
            "timeline": "N/A",
            "cost_estimate": "Internal cost"
        },
        {
            "name": "Packing List",
            "description": "Detailed list of shipment contents",
            "timeline": "N/A",
            "cost_estimate": "Internal cost"
        }
    ],
    "certifications": [
        {
            "name": "HACCP",
            "description": "Hazard Analysis Critical Control Point certification",
            "timeline": "3-4 months",
            "cost_estimate": "R50,000 - R75,000"
        },
        {
            "name": "ISO 22000",
            "description": "Food safety management certification",
            "timeline": "6-8 months",
            "cost_estimate": "R100,000 - R150,000"
        }
    ]
} 