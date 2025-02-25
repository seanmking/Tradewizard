"""Tests for business verification services."""
import pytest
import asyncio
from ..services.factory import ServiceFactory
from ..services.interfaces import ValidationResult

@pytest.mark.asyncio
async def test_mock_business_verification():
    service = ServiceFactory.get_service("business", "mock")
    
    # Test valid company
    result = await service.verify_company("2018/123456/07")
    assert isinstance(result, ValidationResult)
    assert result.is_valid
    assert result.details["companyName"] == "Global Fresh SA Pty LTD"
    
    # Test invalid company
    result = await service.verify_company("invalid_number")
    assert not result.is_valid
    assert result.errors[0]["code"] == "COMPANY_NOT_FOUND"

@pytest.mark.asyncio
async def test_mock_tax_compliance():
    service = ServiceFactory.get_service("tax", "mock")
    
    # Test valid tax number
    result = await service.check_compliance("9012345678")
    assert result.is_valid
    assert result.details["compliant"]
    assert result.details["vatRegistered"]
    
    # Test invalid tax number
    result = await service.check_compliance("invalid_tax")
    assert not result.is_valid
    assert result.errors[0]["code"] == "TAX_NUMBER_INVALID"

@pytest.mark.asyncio
async def test_mock_contact_validation():
    service = ServiceFactory.get_service("contact", "mock")
    
    # Test valid contact info
    valid_contact = {
        "email": "test@example.com",
        "phone": "0123456789"
    }
    result = await service.validate_contact(valid_contact)
    assert result.is_valid
    assert not result.errors
    
    # Test invalid contact info
    invalid_contact = {
        "email": "invalid-email",
        "phone": "123"
    }
    result = await service.validate_contact(invalid_contact)
    assert not result.is_valid
    assert len(result.errors) == 2  # Both email and phone are invalid

def test_service_factory_invalid_type():
    with pytest.raises(ValueError):
        ServiceFactory.get_service("invalid_type", "mock")

def test_service_factory_real_mode():
    with pytest.raises(ValueError):
        ServiceFactory.get_service("business", "real") 