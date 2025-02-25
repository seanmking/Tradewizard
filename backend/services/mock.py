"""Mock implementations of business verification services."""
from typing import Dict, Any
import asyncio
from .interfaces import (
    BusinessVerificationService,
    TaxComplianceService,
    ContactValidationService,
    ValidationResult,
)

MOCK_COMPANY_DATA = {
    "2018/123456/07": {
        "verified": True,
        "companyName": "Global Fresh SA Pty LTD",
        "registrationDate": "2018-03-15",
        "status": "Active",
        "entityType": "PTY LTD",
        "directors": [
            {
                "name": "Sean King",
                "id": "7001015009087",
                "role": "Director",
                "appointmentDate": "2018-03-15"
            }
        ],
        "registeredAddress": "15 Industrial Avenue, Stellenbosch, Western Cape, 7600"
    }
}

MOCK_TAX_DATA = {
    "9012345678": {
        "compliant": True,
        "taxClearanceValid": True,
        "vatRegistered": True,
        "lastFilingDate": "2024-01-15"
    }
}

class MockBusinessVerificationService(BusinessVerificationService):
    async def verify_company(self, registration_number: str) -> ValidationResult:
        await asyncio.sleep(1)  # Simulate API delay
        
        if registration_number in MOCK_COMPANY_DATA:
            return ValidationResult(
                is_valid=True,
                details=MOCK_COMPANY_DATA[registration_number],
                errors=None
            )
        return ValidationResult(
            is_valid=False,
            details={},
            errors=[{"code": "COMPANY_NOT_FOUND", "message": "Company not found"}]
        )

class MockTaxComplianceService(TaxComplianceService):
    async def check_compliance(self, tax_number: str) -> ValidationResult:
        await asyncio.sleep(1)  # Simulate API delay
        
        if tax_number in MOCK_TAX_DATA:
            return ValidationResult(
                is_valid=True,
                details=MOCK_TAX_DATA[tax_number],
                errors=None
            )
        return ValidationResult(
            is_valid=False,
            details={},
            errors=[{"code": "TAX_NUMBER_INVALID", "message": "Invalid tax number"}]
        )

class MockContactValidationService(ContactValidationService):
    async def validate_contact(self, contact_info: Dict[str, str]) -> ValidationResult:
        await asyncio.sleep(0.5)  # Simulate API delay
        
        email = contact_info.get("email", "")
        phone = contact_info.get("phone", "")
        
        errors = []
        if not email or "@" not in email:
            errors.append({"code": "INVALID_EMAIL", "message": "Invalid email format"})
        if not phone or len(phone) < 10:
            errors.append({"code": "INVALID_PHONE", "message": "Invalid phone number"})
            
        return ValidationResult(
            is_valid=len(errors) == 0,
            details=contact_info,
            errors=errors if errors else None
        ) 