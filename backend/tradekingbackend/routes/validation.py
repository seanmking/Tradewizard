from flask import Blueprint, request, jsonify

bp = Blueprint('validation', __name__, url_prefix='/api/validate')

@bp.route('/business', methods=['POST'])
def validate_business():
    try:
        data = request.get_json()
        registration_number = data.get('registrationNumber')
        
        if not registration_number:
            return jsonify({
                'error': 'Registration number is required'
            }), 400
        
        # Add your business validation logic here
        # For now, return mock data
        return jsonify({
            'is_valid': True,
            'suggestions': ['Valid registration number'],
            'details': {
                'companyName': 'Test Company (Pty) Ltd',
                'entityType': 'PTY_LTD',
                'status': 'Active'
            }
        })
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@bp.route('/tax', methods=['POST'])
def validate_tax():
    try:
        data = request.get_json()
        tax_number = data.get('taxNumber')
        
        if not tax_number:
            return jsonify({
                'error': 'Tax number is required'
            }), 400
        
        # Add your tax validation logic here
        # For now, return mock data
        return jsonify({
            'is_valid': True,
            'suggestions': ['Valid tax number']
        })
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500 