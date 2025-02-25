"""Service interfaces for business verification system."""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class ValidationResult:
    is_valid: bool
    details: Dict[str, Any]
    errors: Optional[list] = None

class BusinessVerificationService(ABC):
    @abstractmethod
    async def verify_company(self, registration_number: str) -> ValidationResult:
        """Verify company details with CIPC."""
        pass

class TaxComplianceService(ABC):
    @abstractmethod
    async def check_compliance(self, tax_number: str) -> ValidationResult:
        """Check SARS tax compliance status."""
        pass

class ContactValidationService(ABC):
    @abstractmethod
    async def validate_contact(self, contact_info: Dict[str, str]) -> ValidationResult:
        """Validate contact information."""
        pass

class ServiceFactory:
    @staticmethod
    def get_service(service_type: str, mode: str = "mock"):
        """Get service implementation based on type and mode."""
        # This will be implemented when we add the concrete implementations
        pass 