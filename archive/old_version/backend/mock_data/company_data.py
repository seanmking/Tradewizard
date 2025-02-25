"""Mock data for company validation and assessment."""

# Company registration and profile data
COMPANY_DATA = {
    "global_fresh": {
        "companyName": "Global Fresh SA Pty Ltd",
        "registrationNumber": "2018/123456/07",
        "status": "Active",
        "directors": ["John Smith", "Sarah Johnson"],
        "industry": "Agriculture & Food Processing",
        "exportReadiness": {
            "experience": "Some Export Experience",
            "targetMarkets": {
                "primary": ["UAE", "UK", "Singapore"],
                "secondary": ["Saudi Arabia", "Qatar"]
            },
            "certifications": ["HACCP", "ISO 22000"],
            "challenges": ["Market Access", "Logistics"]
        }
    }
}

# Tax compliance data
TAX_DATA = {
    "global_fresh": {
        "taxNumber": "9876543210",
        "compliant": True,
        "lastVerified": "2024-02-15",
        "vatRegistered": True
    }
}

# Contact and digital presence data
CONTACT_DATA = {
    "global_fresh": {
        "email": "info@globalfresh.co.za",
        "phone": "+27 11 123 4567",
        "website": "www.globalfresh.co.za",
        "address": {
            "street": "123 Business Park Drive",
            "city": "Johannesburg",
            "province": "Gauteng",
            "postal_code": "2196"
        }
    }
} 