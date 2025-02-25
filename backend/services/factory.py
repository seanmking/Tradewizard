"""Service factory for creating verification service instances."""
from typing import Union, Type
from .interfaces import (
    BusinessVerificationService,
    TaxComplianceService,
    ContactValidationService
)
from .mock import (
    MockBusinessVerificationService,
    MockTaxComplianceService,
    MockContactValidationService
)
from .__init__ import ServiceMode

class ServiceFactory:
    _mock_services = {
        "business": MockBusinessVerificationService,
        "tax": MockTaxComplianceService,
        "contact": MockContactValidationService
    }
    
    _real_services = {
        # To be implemented later
        "business": None,
        "tax": None,
        "contact": None
    }
    
    @classmethod
    def get_service(
        cls,
        service_type: str,
        mode: Union[str, ServiceMode] = ServiceMode.MOCK
    ) -> Union[BusinessVerificationService, TaxComplianceService, ContactValidationService]:
        """
        Get a service implementation based on type and mode.
        
        Args:
            service_type: Type of service ('business', 'tax', or 'contact')
            mode: Service mode ('mock' or 'real')
            
        Returns:
            An instance of the requested service
        
        Raises:
            ValueError: If service type is invalid or real implementation is not available
        """
        if isinstance(mode, str):
            mode = ServiceMode(mode.lower())
            
        if service_type not in cls._mock_services:
            raise ValueError(f"Invalid service type: {service_type}")
            
        if mode == ServiceMode.MOCK:
            return cls._mock_services[service_type]()
        
        if cls._real_services[service_type] is None:
            raise ValueError(f"Real implementation for {service_type} service not available")
            
        return cls._real_services[service_type]() 