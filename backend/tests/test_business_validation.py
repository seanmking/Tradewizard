"""Tests for business validation functionality."""

import pytest
from unittest.mock import Mock, patch
from datetime import datetime
from backend.app.services.llm_service import LLMService, BusinessInfo, BusinessValidationError, ServiceError
from backend.app import app
from backend.app.services.assessment_flow import AssessmentContext
from typing import Dict, Optional

@pytest.fixture
def llm_service():
    """Create a test instance of LLMService."""
    return LLMService()

@pytest.fixture
def business_info():
    """Create a test instance of BusinessInfo."""
    return BusinessInfo()

@pytest.fixture
def client():
    """Create a test client."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@pytest.fixture
def mock_llm_service():
    """Mock LLM service responses."""
    mock = Mock(spec=LLMService)
    
    def process_validation(field: str, value: str, business_info: Optional[BusinessInfo] = None) -> Dict:
        if field == 'company_name':
            if len(value) < 2:
                result = {
                    'is_valid': False,
                    'suggestions': ['Company name must be at least 2 characters long', 'Contains invalid characters'],
                    'confidence': 0.85
                }
            else:
                result = {
                    'is_valid': True,
                    'suggestions': ['Valid company name'],
                    'confidence': 0.95
                }
        elif field == 'registration_number':
            parts = value.split('/')
            if len(parts) != 3 or not all(p.isdigit() for p in parts):
                result = {
                    'is_valid': False,
                    'suggestions': ['Registration number must be in format YYYY/XXXXXX/XX', 'All parts must be numeric'],
                    'confidence': 0.85
                }
            else:
                result = {
                    'is_valid': True,
                    'suggestions': ['Valid registration number'],
                    'confidence': 0.95
                }
        elif field == 'tax_number':
            if not value.isdigit() or len(value) != 10:
                result = {
                    'is_valid': False,
                    'suggestions': ['Tax number must be exactly 10 digits', 'Must contain only numbers'],
                    'confidence': 0.85
                }
            else:
                result = {
                    'is_valid': True,
                    'suggestions': ['Valid tax number'],
                    'confidence': 0.95
                }
        else:
            result = {
                'is_valid': False,
                'suggestions': ['Invalid field name'],
                'confidence': 0.0
            }
        
        # Update business_info if provided
        if business_info is not None and result['is_valid']:
            if not hasattr(business_info, 'validation_status'):
                business_info.validation_status = {}
            business_info.validation_status[field] = True
            if hasattr(business_info, 'validation_errors'):
                business_info.validation_errors.pop(field, None)
        elif business_info is not None and not result['is_valid']:
            if not hasattr(business_info, 'validation_errors'):
                business_info.validation_errors = {}
            business_info.validation_errors[field] = result['suggestions']
        
        return result
    
    mock.process_business_validation.side_effect = process_validation
    return mock

@pytest.fixture
def mock_api_response():
    return {
        'is_valid': True,
        'confidence': 0.85,
        'suggestions': []
    }

def test_business_validation_prompt_company_name(llm_service, business_info):
    """Test business validation prompt generation for company name."""
    prompt = llm_service.build_business_validation_prompt(
        'company_name',
        'Test Corp',
        business_info
    )
    
    assert 'Test Corp' in prompt
    assert 'company name' in prompt.lower()
    assert 'Name format and length' in prompt
    assert 'Industry-specific conventions' in prompt

def test_business_validation_prompt_registration_number(llm_service, business_info):
    """Test business validation prompt generation for registration number."""
    prompt = llm_service.build_business_validation_prompt(
        'registration_number',
        '2023/123456/07',
        business_info
    )
    
    assert '2023/123456/07' in prompt
    assert 'registration number format' in prompt.lower()
    assert 'Length' in prompt
    assert 'Format' in prompt

def test_business_validation_prompt_tax_number(llm_service, business_info):
    """Test business validation prompt generation for tax number."""
    prompt = llm_service.build_business_validation_prompt(
        'tax_number',
        '1234567890',
        business_info
    )
    
    assert '1234567890' in prompt
    assert 'tax number format' in prompt.lower()
    assert 'Number length' in prompt
    assert 'Format' in prompt

def test_validation_response_parsing_valid(llm_service):
    """Test parsing of valid validation responses."""
    response = """{
        'is_valid': True,
        'suggestions': ['Looks good'],
        'confidence': 0.9
    }"""
    
    result = llm_service.parse_validation_response(response)
    assert result['is_valid'] is True
    assert len(result['suggestions']) > 0
    assert result['confidence'] == 0.9

def test_validation_response_parsing_invalid(llm_service):
    """Test parsing of invalid validation responses."""
    response = """{
        'is_valid': False,
        'suggestions': ['Invalid format', 'Please check requirements'],
        'confidence': 0.8
    }"""
    
    result = llm_service.parse_validation_response(response)
    assert result['is_valid'] is False
    assert len(result['suggestions']) == 2
    assert result['confidence'] == 0.8

def test_validation_response_parsing_error(llm_service):
    """Test parsing of malformed validation responses."""
    response = "Invalid JSON"
    
    result = llm_service.parse_validation_response(response)
    assert result['is_valid'] is False
    assert 'Error parsing validation response' in result['suggestions']
    assert result['confidence'] == 0.0

@patch('requests.post')
def test_process_business_validation_success(mock_post, llm_service, business_info):
    """Test successful business validation processing."""
    mock_response = Mock()
    mock_response.json.return_value = {
        'response': """{
            'is_valid': True,
            'suggestions': ['Valid company name'],
            'confidence': 0.95
        }"""
    }
    mock_post.return_value = mock_response
    
    result = llm_service.process_business_validation(
        'company_name',
        'Test Company Ltd',
        business_info
    )
    
    assert result['is_valid'] is True
    assert len(result['suggestions']) > 0
    assert result['confidence'] == 0.95
    assert business_info.validation_status['company_name'] is True

def test_process_business_validation_failure(llm_service, business_info):
    """Test failed business validation with mock API response"""
    with patch('requests.post') as mock_post:
        # Mock API response with specific confidence
        mock_response = Mock()
        mock_response.ok = True
        mock_response.json.return_value = {
            'is_valid': False,
            'confidence': 0.85,
            'suggestions': ['Name too short']
        }
        mock_post.return_value = mock_response

        result = llm_service.process_business_validation(
            'company_name',
            'A',
            business_info
        )

        # Should use API response confidence
        assert result['is_valid'] is False
        assert result['confidence'] == 0.85
        assert len(result['suggestions']) == 1

def test_business_validation_system_prompt(llm_service):
    """Test business validation system prompt generation."""
    prompt = llm_service.get_business_validation_system_prompt()
    
    assert 'business validation assistant' in prompt.lower()
    assert 'South African' in prompt
    assert 'JSON' in prompt
    assert all(key in prompt.lower() for key in ['is_valid', 'suggestions', 'confidence'])

def test_business_info_creation():
    """Test creation of BusinessInfo instance."""
    info = BusinessInfo()
    assert info.company_name is None
    assert info.validation_status == {}
    assert info.validation_errors == {}

def test_business_info_validation():
    """Test business info validation rules."""
    info = BusinessInfo()
    
    # Test company name validation
    info.update_field('company_name', 'AB')  # Minimum length
    assert info.validation_status['company_name'] is True
    
    info.update_field('company_name', 'A')  # Too short
    assert info.validation_status['company_name'] is False

def test_registration_number_validation():
    """Test registration number validation."""
    info = BusinessInfo()
    
    # Valid registration number
    info.update_field('registration_number', '2023/123456/07')
    assert info.validation_status['registration_number'] is True
    
    # Invalid registration number
    info.update_field('registration_number', '123')
    assert info.validation_status['registration_number'] is False

def test_tax_number_validation():
    """Test tax number validation."""
    info = BusinessInfo()
    
    # Valid tax number
    info.update_field('tax_number', '1234567890')
    assert info.validation_status['tax_number'] is True
    
    # Invalid tax number
    info.update_field('tax_number', '123')
    assert info.validation_status['tax_number'] is False

def test_contact_details_validation():
    """Test contact details validation."""
    info = BusinessInfo()
    
    # Valid contact details
    info.update_field('contact_details', {'email': 'test@example.com'})
    assert info.validation_status['contact_details'] is True
    
    # Invalid contact details
    info.update_field('contact_details', {})
    assert info.validation_status['contact_details'] is False

def test_assessment_context_business_info():
    """Test AssessmentContext business info integration."""
    context = AssessmentContext(
        current_question_index=0,
        extracted_info={},
        conversation_history=[]
    )
    
    # Test business info update
    assert context.update_business_info('company_name', 'Test Corp') is True
    assert context.business_info.company_name == 'Test Corp'
    
    # Test validation status retrieval
    status = context.get_validation_status()
    assert 'company_name' in status
    assert status['company_name'] is True
    
    # Test invalid field update
    assert context.update_business_info('invalid_field', 'value') is False

def test_complete_business_validation():
    """Test complete business validation flow."""
    context = AssessmentContext(
        current_question_index=0,
        extracted_info={},
        conversation_history=[]
    )
    
    # Update all required fields
    updates = {
        'company_name': 'Test Corporation',
        'registration_number': '123456',
        'tax_number': '12345678',
        'contact_details': {'email': 'contact@testcorp.com'}
    }
    
    for field, value in updates.items():
        assert context.update_business_info(field, value) is True
    
    # Check overall validation status
    status = context.get_validation_status()
    assert all(status.values())

def test_validate_business_missing_session(client):
    """Test validation without session ID."""
    response = client.post('/api/validate/business', json={
        'field': 'company_name',
        'value': 'Test Corp'
    })
    assert response.status_code == 400
    assert b'No session ID provided' in response.data

def test_validate_business_invalid_session(client):
    """Test validation with invalid session ID."""
    response = client.post('/api/validate/business', 
        json={
            'field': 'company_name',
            'value': 'Test Corp'
        },
        headers={'X-Session-ID': 'invalid_session'}
    )
    assert response.status_code == 400
    assert b'Invalid session' in response.data

def test_validate_business_missing_data(client):
    """Test validation with missing data."""
    response = client.post('/api/validate/business',
        json={},
        headers={'X-Session-ID': 'test_session'}
    )
    assert response.status_code == 400
    assert b'Missing field or value' in response.data

def test_validate_business_success(client, mock_llm_service):
    """Test successful business validation."""
    # Mock successful validation response
    mock_llm_service.process_business_validation.return_value = {
        'is_valid': True,
        'suggestions': ['Valid company name'],
        'confidence': 0.95
    }
    
    # Create a session
    client.post('/api/start', headers={'X-Session-ID': 'test_session'})
    
    # Test validation
    response = client.post('/api/validate/business',
        json={
            'field': 'company_name',
            'value': 'Test Corp Ltd'
        },
        headers={'X-Session-ID': 'test_session'}
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert data['is_valid'] is True
    assert len(data['suggestions']) > 0
    assert data['confidence'] == 0.95

def test_validate_business_invalid(client, mock_llm_service):
    """Test invalid business validation with mock service"""
    mock_llm_service.process_business_validation.return_value = {
        'is_valid': False,
        'confidence': 0.85,
        'suggestions': ['Company name too short']
    }

    response = client.post('/api/validate/business',
        json={
            'field': 'company_name',
            'value': 'A'
        },
        headers={'X-Session-ID': 'test_session'}
    )

    data = response.get_json()
    assert response.status_code == 200
    assert data['is_valid'] is False
    assert data['confidence'] == 0.85

def test_validate_business_error(client, mock_llm_service):
    """Test validation service error handling"""
    mock_llm_service.process_business_validation.side_effect = ServiceError('API Error')

    response = client.post('/api/validate/business',
        json={
            'field': 'company_name',
            'value': 'Test Corp'
        },
        headers={'X-Session-ID': 'test_session'}
    )

    assert response.status_code == 500
    data = response.get_json()
    assert 'error' in data
    assert data['is_valid'] is False
    assert data['confidence'] == 0.0

def test_validate_business_multiple_fields(client, mock_llm_service):
    """Test validation of multiple business fields"""
    responses = [
        {
            'is_valid': True,
            'confidence': 0.9,
            'suggestions': []
        },
        {
            'is_valid': True,
            'confidence': 0.9,
            'suggestions': []
        }
    ]
    mock_llm_service.process_business_validation.side_effect = responses

    # Test company name
    response1 = client.post('/api/validate/business',
        json={
            'field': 'company_name',
            'value': 'Test Corp Ltd'
        },
        headers={'X-Session-ID': 'test_session'}
    )

    data1 = response1.get_json()
    assert response1.status_code == 200
    assert data1['confidence'] == 0.9

    # Test registration number
    response2 = client.post('/api/validate/business',
        json={
            'field': 'registration_number',
            'value': '2023/123456/07'
        },
        headers={'X-Session-ID': 'test_session'}
    )

    data2 = response2.get_json()
    assert response2.status_code == 200
    assert data2['confidence'] == 0.9

class TestBusinessValidation:
    """Test suite for business validation functionality."""

    def test_company_name_validation(self, llm_service, business_info):
        """Test company name validation rules."""
        valid_cases = [
            "Fresh Earth Foods (Pty) Ltd",
            "ABC Trading CC",
            "123 Logistics Limited",
            "Tech Solutions SA"
        ]
        
        invalid_cases = [
            "",  # Empty
            "A",  # Too short
            "!" * 101,  # Too long
            "Invalid@Company#Name",  # Invalid characters
        ]
        
        for name in valid_cases:
            result = llm_service.process_business_validation('company_name', name, business_info)
            assert result['is_valid'], f"Company name '{name}' should be valid"
            assert result['confidence'] > 0.7, f"Should have high confidence for '{name}'"
            
        for name in invalid_cases:
            result = llm_service.process_business_validation('company_name', name, business_info)
            assert not result['is_valid'], f"Company name '{name}' should be invalid"

    def test_registration_number_validation(self, llm_service, business_info):
        """Test registration number format validation."""
        valid_cases = [
            "2023/123456/07",
            "2020/987654/21",
            "1999/654321/23"
        ]
        
        invalid_cases = [
            "",  # Empty
            "123456",  # Wrong format
            "2023/12/07",  # Incomplete
            "ABCD/123456/07",  # Invalid year
            "2023/ABCDEF/07",  # Non-numeric
        ]
        
        for reg_num in valid_cases:
            result = llm_service.process_business_validation('registration_number', reg_num, business_info)
            assert result['is_valid'], f"Registration number '{reg_num}' should be valid"
            assert result['confidence'] > 0.8, f"Should have high confidence for '{reg_num}'"
            
        for reg_num in invalid_cases:
            result = llm_service.process_business_validation('registration_number', reg_num, business_info)
            assert not result['is_valid'], f"Registration number '{reg_num}' should be invalid"

    def test_tax_number_validation(self, llm_service, business_info):
        """Test tax number validation rules."""
        valid_cases = [
            "1234567890",  # Standard 10-digit
            "9876543210",  # Standard 10-digit
        ]
        
        invalid_cases = [
            "",  # Empty
            "123",  # Too short
            "12345678901",  # Too long
            "ABCD567890",  # Non-numeric
        ]
        
        for tax_num in valid_cases:
            result = llm_service.process_business_validation('tax_number', tax_num, business_info)
            assert result['is_valid'], f"Tax number '{tax_num}' should be valid"
            assert result['confidence'] > 0.8, f"Should have high confidence for '{tax_num}'"
            
        for tax_num in invalid_cases:
            result = llm_service.process_business_validation('tax_number', tax_num, business_info)
            assert not result['is_valid'], f"Tax number '{tax_num}' should be invalid"

    def test_validation_persistence(self, business_info):
        """Test that validation results are properly persisted."""
        business_info.update_field('company_name', 'Test Corp')
        assert business_info.company_name == 'Test Corp'
        assert business_info.validation_status.get('company_name') is True

        business_info.update_field('registration_number', '2023/123456/07')
        assert business_info.registration_number == '2023/123456/07'
        assert business_info.validation_status.get('registration_number') is True

    def test_validation_error_handling(self, llm_service, business_info):
        """Test handling of validation errors"""
        with patch('requests.post') as mock_post:
            mock_post.side_effect = ServiceError("API Error")

            with pytest.raises(ServiceError):
                llm_service.process_business_validation(
                    'company_name',
                    'Test Corp',
                    business_info
                )

    @pytest.mark.asyncio
    async def test_concurrent_validations(self, llm_service, business_info):
        """Test handling multiple concurrent validations."""
        import asyncio
        
        async def validate_field(field, value):
            return llm_service.process_business_validation(field, value, business_info)
        
        tasks = [
            validate_field('company_name', 'Test Corp'),
            validate_field('registration_number', '2023/123456/07'),
            validate_field('tax_number', '1234567890')
        ]
        
        results = await asyncio.gather(*tasks)
        assert all(r['is_valid'] for r in results), "All concurrent validations should succeed"

    def test_validation_confidence_levels(self, llm_service, business_info):
        """Test different confidence levels"""
        test_cases = [
            {
                'field': 'company_name',
                'value': 'Very Clear Company Ltd',
                'mock_confidence': 0.9
            },
            {
                'field': 'company_name',
                'value': 'Somewhat.Unclear.Corp',
                'mock_confidence': 0.6
            },
            {
                'field': 'company_name',
                'value': 'x',
                'mock_confidence': 0.3
            }
        ]

        with patch('requests.post') as mock_post:
            for case in test_cases:
                # Mock API response with specific confidence
                mock_response = Mock()
                mock_response.ok = True
                mock_response.json.return_value = {
                    'is_valid': True,
                    'confidence': case['mock_confidence']
                }
                mock_post.return_value = mock_response

                result = llm_service.process_business_validation(
                    case['field'],
                    case['value'],
                    business_info
                )

                assert result['confidence'] == case['mock_confidence'], \
                    f"Confidence for '{case['value']}' should be {case['mock_confidence']}"

    def test_validation_with_context(self, llm_service):
        """Test validation with assessment context."""
        context = AssessmentContext(
            current_question_index=0,
            extracted_info={},
            conversation_history=[]
        )
        
        # Test sequential validation with context
        validations = [
            ('company_name', 'Test Corp Ltd'),
            ('registration_number', '2023/123456/07'),
            ('tax_number', '1234567890')
        ]
        
        for field, value in validations:
            assert context.update_business_info(field, value), \
                f"Should successfully validate {field}"
            
        # Verify final state
        assert context.business_info.company_name == 'Test Corp Ltd'
        assert context.business_info.registration_number == '2023/123456/07'
        assert context.business_info.tax_number == '1234567890'
        assert all(context.get_validation_status().values()), \
            "All fields should be marked as valid"

    def test_validation_suggestions(self, llm_service, business_info):
        """Test validation suggestions for invalid inputs."""
        test_cases = [
            (
                'company_name', 
                'a', 
                ['Company name is too short', 'Should be at least 2 characters']
            ),
            (
                'registration_number',
                '123',
                ['Invalid format', 'Should follow YYYY/XXXXXX/XX pattern']
            ),
            (
                'tax_number',
                'ABC',
                ['Invalid format', 'Should be 10 digits']
            )
        ]
        
        for field, value, expected_suggestions in test_cases:
            result = llm_service.process_business_validation(field, value, business_info)
            assert not result['is_valid']
            assert any(suggestion in result['suggestions'] for suggestion in expected_suggestions), \
                f"Should provide helpful suggestions for invalid {field}"

    def test_validation_state_transitions(self, business_info):
        """Test validation state transitions."""
        # Test invalid -> valid transition
        business_info.update_field('company_name', 'a')  # Invalid
        assert not business_info.validation_status['company_name']
        
        business_info.update_field('company_name', 'Valid Company')  # Valid
        assert business_info.validation_status['company_name']
        
        # Test valid -> invalid transition
        business_info.update_field('registration_number', '2023/123456/07')  # Valid
        assert business_info.validation_status['registration_number']
        
        business_info.update_field('registration_number', '123')  # Invalid
        assert not business_info.validation_status['registration_number'] 