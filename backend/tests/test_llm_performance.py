"""Performance tests for LLM service."""

import pytest
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from backend.app.services.llm_service import LLMService, BusinessInfo

@pytest.fixture
def llm_service():
    """Create a test instance of LLMService."""
    return LLMService()

@pytest.fixture
def business_info():
    """Create a test instance of BusinessInfo."""
    return BusinessInfo()

def test_llm_response_time(llm_service, business_info):
    """Test LLM response time for different validation types."""
    test_cases = [
        ('company_name', 'Test Corporation Ltd'),
        ('registration_number', '2023/123456/07'),
        ('tax_number', '1234567890')
    ]
    
    results = []
    for field, value in test_cases:
        start_time = time.time()
        response = llm_service.process_business_validation(field, value, business_info)
        end_time = time.time()
        
        results.append({
            'field': field,
            'time': end_time - start_time,
            'is_valid': response['is_valid'],
            'confidence': response['confidence']
        })
    
    # Assert reasonable response times (adjust thresholds as needed)
    for result in results:
        assert result['time'] < 2.0, f"Validation for {result['field']} took too long: {result['time']}s"

def test_llm_concurrent_performance(llm_service, business_info):
    """Test LLM performance under concurrent load."""
    def validate_field(field_value):
        field, value = field_value
        return llm_service.process_business_validation(field, value, business_info)
    
    test_cases = [
        ('company_name', 'Test Corp A'),
        ('company_name', 'Test Corp B'),
        ('registration_number', '2023/123456/07'),
        ('registration_number', '2023/654321/07'),
        ('tax_number', '1234567890'),
        ('tax_number', '9876543210')
    ]
    
    start_time = time.time()
    with ThreadPoolExecutor(max_workers=3) as executor:
        future_to_case = {executor.submit(validate_field, case): case for case in test_cases}
        for future in as_completed(future_to_case):
            case = future_to_case[future]
            try:
                result = future.result()
                assert isinstance(result, dict)
                assert 'is_valid' in result
                assert 'confidence' in result
            except Exception as e:
                pytest.fail(f"Validation failed for {case}: {str(e)}")
    
    total_time = time.time() - start_time
    assert total_time < 10.0, f"Concurrent validations took too long: {total_time}s"

def test_llm_response_accuracy(llm_service, business_info):
    """Test accuracy of LLM responses for known valid and invalid cases."""
    test_cases = [
        # Valid cases
        {
            'field': 'company_name',
            'value': 'Test Corporation (Pty) Ltd',
            'expected_valid': True
        },
        {
            'field': 'registration_number',
            'value': '2023/123456/07',
            'expected_valid': True
        },
        {
            'field': 'tax_number',
            'value': '1234567890',
            'expected_valid': True
        },
        # Invalid cases
        {
            'field': 'company_name',
            'value': 'A',  # Too short
            'expected_valid': False
        },
        {
            'field': 'registration_number',
            'value': '123',  # Wrong format
            'expected_valid': False
        },
        {
            'field': 'tax_number',
            'value': '123',  # Wrong length
            'expected_valid': False
        }
    ]
    
    for case in test_cases:
        result = llm_service.process_business_validation(
            case['field'],
            case['value'],
            business_info
        )
        assert result['is_valid'] == case['expected_valid'], \
            f"Validation for {case['field']} with value '{case['value']}' " \
            f"returned {result['is_valid']}, expected {case['expected_valid']}"
        
        # Check confidence scores
        if case['expected_valid']:
            assert result['confidence'] >= 0.8, \
                f"Low confidence ({result['confidence']}) for valid {case['field']}"
        else:
            assert result['confidence'] <= 0.5, \
                f"High confidence ({result['confidence']}) for invalid {case['field']}"

def test_llm_error_recovery(llm_service, business_info):
    """Test LLM service error recovery capabilities."""
    # Test malformed input
    result = llm_service.process_business_validation(
        'company_name',
        '!@#$%^&*()',  # Malformed input
        business_info
    )
    assert not result['is_valid']
    assert len(result['suggestions']) > 0
    assert result['confidence'] < 0.5
    
    # Test empty input
    result = llm_service.process_business_validation(
        'company_name',
        '',
        business_info
    )
    assert not result['is_valid']
    assert len(result['suggestions']) > 0
    assert result['confidence'] == 0.0
    
    # Test extremely long input
    result = llm_service.process_business_validation(
        'company_name',
        'A' * 1000,  # Very long input
        business_info
    )
    assert not result['is_valid']
    assert len(result['suggestions']) > 0
    assert result['confidence'] < 0.5

def test_llm_prompt_quality(llm_service, business_info):
    """Test quality and consistency of LLM prompts."""
    fields = ['company_name', 'registration_number', 'tax_number']
    
    for field in fields:
        prompt = llm_service.build_business_validation_prompt(
            field,
            'test_value',
            business_info
        )
        
        # Check prompt structure
        assert 'Current validation status' in prompt
        assert 'Previous errors' in prompt
        
        # Check field-specific validation rules
        if field == 'company_name':
            assert 'Name format and length' in prompt
            assert 'Industry-specific conventions' in prompt
        elif field == 'registration_number':
            assert 'YYYY/XXXXXX/XX' in prompt
            assert 'Length' in prompt
        elif field == 'tax_number':
            assert 'Number length' in prompt
            assert 'Format' in prompt

def test_confidence_score_calculation(llm_service, business_info):
    """Test confidence score calculation and thresholds."""
    test_cases = [
        # Perfect match
        ('company_name', 'Test Corporation (Pty) Ltd', 0.9),
        # Partially valid
        ('company_name', 'Test Corp', 0.7),
        # Invalid
        ('company_name', 'A', 0.3),
        # Perfect match
        ('registration_number', '2023/123456/07', 0.9),
        # Wrong format
        ('registration_number', '2023-123456-07', 0.4),
        # Invalid
        ('registration_number', '123', 0.1)
    ]
    
    for field, value, min_expected_confidence in test_cases:
        result = llm_service.process_business_validation(field, value, business_info)
        if result['is_valid']:
            assert result['confidence'] >= min_expected_confidence, \
                f"Confidence too low for valid {field}: {result['confidence']}"
        else:
            assert result['confidence'] <= min_expected_confidence, \
                f"Confidence too high for invalid {field}: {result['confidence']}" 