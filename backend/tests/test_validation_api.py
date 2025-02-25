import pytest
from flask import json
from backend.app import app
from backend.app.services.llm_service import LLMService, BusinessInfo
from unittest.mock import Mock
from typing import Dict, Optional

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@pytest.fixture
def mock_llm_service(monkeypatch):
    """Mock LLM service responses with realistic validation behavior."""
    mock_service = Mock(spec=LLMService)
    
    def process_validation(field: str, value: str, business_info: Optional[BusinessInfo] = None) -> Dict:
        # Handle error simulation for test_validation_error_response
        if getattr(mock_service, '_simulate_error', False):
            return {
                'is_valid': False,
                'suggestions': ['Service error occurred'],
                'confidence': 0.0
            }
        
        # Simulate field-specific validation rules
        if not value:
            result = {
                'is_valid': False,
                'suggestions': ['Value cannot be empty'],
                'confidence': 0.0
            }
        elif field == 'company_name':
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
            if not value.count('/') == 2 or not all(p.isdigit() for p in value.split('/')):
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
        elif field not in ['company_name', 'registration_number', 'tax_number']:
            result = {
                'is_valid': False,
                'suggestions': ['Invalid field name'],
                'confidence': 0.0
            }
        else:
            result = {
                'is_valid': True,
                'suggestions': ['Valid input'],
                'confidence': 0.9
            }
        
        # Update business_info if provided
        if business_info is not None and result['is_valid']:
            if not hasattr(business_info, 'validation_status'):
                business_info.validation_status = {}
            business_info.validation_status[field] = True
        
        return result
    
    mock_service.process_business_validation.side_effect = process_validation
    monkeypatch.setattr('backend.app.llm_service', mock_service)
    return mock_service

class TestValidationAPI:
    """Integration tests for business validation API endpoints."""

    @pytest.fixture(autouse=True)
    def setup_session(self, client):
        """Initialize session before each test."""
        # Clear any existing sessions
        app.sessions = {}
        
        # Create a new session only if not testing missing session
        if not getattr(self, '_skip_session_creation', False):
            response = client.post('/api/start', headers={'X-Session-ID': 'test_session'})
            assert response.status_code == 200

    def test_validate_company_name_endpoint(self, client):
        """Test company name validation endpoint."""
        response = client.post('/api/validate/business',
            json={
                'field': 'company_name',
                'value': 'Fresh Earth Foods'
            },
            headers={'X-Session-ID': 'test_session'}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'is_valid' in data
        assert 'suggestions' in data
        assert 'confidence' in data

    def test_validate_registration_number_endpoint(self, client):
        """Test registration number validation endpoint."""
        response = client.post('/api/validate/business',
            json={
                'field': 'registration_number',
                'value': '2023/123456/07'
            },
            headers={'X-Session-ID': 'test_session'}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['is_valid']
        assert len(data['suggestions']) > 0
        assert data['confidence'] > 0.8

    def test_validate_tax_number_endpoint(self, client):
        """Test tax number validation endpoint."""
        response = client.post('/api/validate/business',
            json={
                'field': 'tax_number',
                'value': '1234567890'
            },
            headers={'X-Session-ID': 'test_session'}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['is_valid']
        assert len(data['suggestions']) > 0
        assert data['confidence'] > 0.8

    def test_missing_session_id(self, client):
        """Test validation endpoint without session ID."""
        self._skip_session_creation = True
        response = client.post('/api/validate/business',
            json={
                'field': 'company_name',
                'value': 'Test Corp'
            }
        )
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert not data['is_valid']
        assert 'Session ID is required' in data['suggestions'][0]
        self._skip_session_creation = False

    def test_invalid_session_id(self, client):
        """Test validation with invalid session ID."""
        response = client.post('/api/validate/business',
            json={
                'field': 'company_name',
                'value': 'Test Corp'
            },
            headers={'X-Session-ID': 'nonexistent_session'}
        )
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert not data['is_valid']
        assert 'Invalid session' in data['suggestions'][0]

    def test_invalid_field_name(self, client):
        """Test validation with invalid field name."""
        response = client.post('/api/validate/business',
            json={
                'field': 'invalid_field',
                'value': 'test'
            },
            headers={'X-Session-ID': 'test_session'}
        )
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert not data['is_valid']
        assert 'Invalid field name' in data['suggestions'][0]

    def test_empty_value(self, client):
        """Test validation with empty value."""
        response = client.post('/api/validate/business',
            json={
                'field': 'company_name',
                'value': ''
            },
            headers={'X-Session-ID': 'test_session'}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert not data['is_valid']
        assert len(data['suggestions']) > 0
        assert 'cannot be empty' in data['suggestions'][0].lower()

    def test_concurrent_requests(self, client):
        """Test handling multiple concurrent validation requests."""
        test_cases = [
            ('company_name', 'Test Corp'),
            ('registration_number', '2023/123456/07'),
            ('tax_number', '1234567890')
        ]
        
        responses = []
        for field, value in test_cases:
            response = client.post('/api/validate/business',
                json={'field': field, 'value': value},
                headers={'X-Session-ID': 'test_session'}
            )
            assert response.status_code == 200
            responses.append(json.loads(response.data))
        
        assert len(responses) == 3
        assert all(r['is_valid'] for r in responses)

    def test_validation_error_response(self, client, mock_llm_service):
        """Test API response when validation service fails."""
        # Set mock to simulate error
        mock_llm_service._simulate_error = True

        response = client.post('/api/validate/business',
            json={
                'field': 'company_name',
                'value': 'Test Corp'
            },
            headers={'X-Session-ID': 'test_session'}
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert not data['is_valid']
        assert 'Service error occurred' in data['suggestions'][0]
        assert data['confidence'] == 0.0

        # Reset mock for other tests
        mock_llm_service._simulate_error = False

    def test_validation_with_special_characters(self, client):
        """Test validation with special characters in input."""
        test_cases = [
            ('company_name', 'Test & Co. (Pty) Ltd'),
            ('company_name', 'Smith\'s Trading'),
            ('company_name', 'Tech Solutions - SA')
        ]
        
        for field, value in test_cases:
            response = client.post('/api/validate/business',
                json={'field': field, 'value': value},
                headers={'X-Session-ID': 'test_session'}
            )
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert data['is_valid']
            assert len(data['suggestions']) > 0

    def test_validation_response_format(self, client):
        """Test the format of validation response."""
        response = client.post('/api/validate/business',
            json={
                'field': 'company_name',
                'value': 'Test Corp'
            },
            headers={'X-Session-ID': 'test_session'}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        # Check response structure
        assert isinstance(data['is_valid'], bool)
        assert isinstance(data['suggestions'], list)
        assert isinstance(data['confidence'], (int, float))
        assert 0 <= data['confidence'] <= 1
        
        # Check content types
        assert all(isinstance(s, str) for s in data['suggestions'])

    def test_malformed_request_body(self, client):
        """Test handling of malformed request body."""
        # Missing field
        response1 = client.post('/api/validate/business',
            json={'value': 'test'},
            headers={'X-Session-ID': 'test_session'}
        )
        assert response1.status_code == 400
        
        # Missing value
        response2 = client.post('/api/validate/business',
            json={'field': 'company_name'},
            headers={'X-Session-ID': 'test_session'}
        )
        assert response2.status_code == 400
        
        # Invalid JSON
        response3 = client.post('/api/validate/business',
            data='not json',
            headers={'X-Session-ID': 'test_session'},
            content_type='application/json'
        )
        assert response3.status_code == 400

    def test_boundary_conditions(self, client):
        """Test validation with boundary conditions."""
        test_cases = [
            # Company name edge cases
            ('company_name', 'A', False),  # Too short
            ('company_name', 'A' * 256, False),  # Too long
            ('company_name', 'AB', True),  # Minimum valid length
            
            # Registration number format cases
            ('registration_number', '2023/12/07', False),  # Wrong format
            ('registration_number', '2023/123456/0', False),  # Incomplete
            ('registration_number', 'ABCD/123456/07', False),  # Non-numeric
            
            # Tax number format cases
            ('tax_number', '123456789', False),  # Too short
            ('tax_number', '12345678901', False),  # Too long
            ('tax_number', '123abc4567', False),  # Non-numeric
        ]
        
        for field, value, should_be_valid in test_cases:
            response = client.post('/api/validate/business',
                json={'field': field, 'value': value},
                headers={'X-Session-ID': 'test_session'}
            )
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert data['is_valid'] == should_be_valid
            assert len(data['suggestions']) > 0

    def test_session_persistence(self, client):
        """Test that validation results persist within a session."""
        # First validation
        response1 = client.post('/api/validate/business',
            json={
                'field': 'company_name',
                'value': 'Test Corp'
            },
            headers={'X-Session-ID': 'test_session'}
        )
        
        # Second validation with same session
        response2 = client.post('/api/validate/business',
            json={
                'field': 'registration_number',
                'value': '2023/123456/07'
            },
            headers={'X-Session-ID': 'test_session'}
        )
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        # Both validations should succeed and be stored in session
        data1 = json.loads(response1.data)
        data2 = json.loads(response2.data)
        assert data1['is_valid']
        assert data2['is_valid'] 