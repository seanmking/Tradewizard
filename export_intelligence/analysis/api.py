"""
Analysis API module.

This module provides API endpoints for the analysis functions to be consumed by
the frontend or other services.
"""

import json
import logging
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import traceback

from export_intelligence.analysis.market import analyze_market_potential, identify_market_trends
from export_intelligence.analysis.regulatory import analyze_regulatory_requirements, calculate_compliance_readiness
from export_intelligence.analysis.timeline import generate_timeline_options, estimate_project_duration
from export_intelligence.analysis.resources import estimate_resource_requirements, estimate_roi, estimate_funding_options

# Configure logging
logger = logging.getLogger(__name__)

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

app = Flask(__name__)

# Enable CORS for all routes
CORS(app)

@app.route('/api/market/potential', methods=['POST'])
def market_potential_endpoint():
    """API endpoint for market potential analysis."""
    try:
        data = request.json
        market_data = data.get('market_data', {})
        
        result = analyze_market_potential(market_data)
        
        return jsonify({
            'success': True,
            'data': result,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error in market potential analysis: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/market/trends', methods=['POST'])
def market_trends_endpoint():
    """API endpoint for market trends analysis."""
    try:
        data = request.json
        market_data = data.get('market_data', {})
        
        trends = identify_market_trends(market_data)
        
        return jsonify({
            'success': True,
            'data': {
                'trends': trends
            },
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error in market trends analysis: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/export-readiness', methods=['POST'])
def export_readiness_report_endpoint():
    """
    Generate a comprehensive export readiness report for a specific market.
    
    Request JSON:
    {
        "userData": Object with user and business data,
        "market": String representing target market
    }
    
    Returns:
    JSON with export readiness report data
    """
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        user_data = data.get('userData', {})
        market = data.get('market', '')
        
        if not market:
            return jsonify({"error": "No target market specified"}), 400
            
        # Extract product categories
        product_categories = []
        if user_data.get('products', {}).get('categories'):
            product_categories = user_data['products']['categories']
        
        # Generate market fit score based on product categories and target market
        market_fit_score = market_analysis.analyze_market_fit(product_categories, market)
        
        # Get regulatory readiness
        regulatory_readiness = 60  # Default value
        if product_categories:
            requirements = regulatory.analyze_regulatory_requirements(product_categories[0], [market])
            # Calculate readiness based on requirements
            regulatory_readiness = 30 + (len(requirements) * 5)  # Simple formula for demo
            regulatory_readiness = min(regulatory_readiness, 90)  # Cap at 90%
            
        # Generate strengths and areas for improvement
        strengths = market_analysis.identify_strengths(user_data, market)
        areas_for_improvement = market_analysis.identify_improvement_areas(user_data, market)
        
        # Get market trends
        key_trends = market_analysis.identify_market_trends(product_categories[0] if product_categories else "Food", [market])
        
        # Get regulatory requirements
        regulatory_requirements = []
        if product_categories:
            regulatory_requirements = regulatory.analyze_regulatory_requirements(product_categories[0], [market])
        
        # Construct the report
        report = {
            "company_name": user_data.get('business_name', 'Your Company'),
            "target_market": market,
            "analysis_date": datetime.now().strftime("%d/%m/%Y"),
            "market_fit_score": market_fit_score,
            "regulatory_readiness": regulatory_readiness,
            "strengths": strengths[:3],  # Limit to 3 items
            "areas_for_improvement": areas_for_improvement[:3],  # Limit to 3 items
            "key_trends": key_trends,
            "regulatory_requirements": regulatory_requirements
        }
        
        return jsonify(report)
    
    except Exception as e:
        logger.error(f"Error generating export readiness report: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": f"Failed to generate report: {str(e)}"}), 500

@app.route('/api/regulatory/requirements', methods=['POST'])
def regulatory_requirements_endpoint():
    """API endpoint for regulatory requirements analysis."""
    try:
        data = request.json
        industry = data.get('industry', 'Food Products')
        markets = data.get('markets', [])
        
        # Use the regulatory module to get requirements
        result = analyze_regulatory_requirements(industry, markets)
        
        return jsonify({
            'success': True,
            'data': result,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error in regulatory requirements analysis: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/timeline/options', methods=['POST'])
def timeline_options_endpoint():
    """API endpoint for export timeline options."""
    try:
        data = request.json
        industry = data.get('industry', 'Food Products')
        markets = data.get('markets', [])
        
        # Use the timeline module to generate options
        options = generate_timeline_options(industry, markets)
        
        return jsonify({
            'success': True,
            'data': {
                'options': options
            },
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error in timeline options analysis: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/timeline/estimate', methods=['POST'])
def timeline_estimate_endpoint():
    """API endpoint for detailed timeline estimation."""
    try:
        data = request.json
        industry = data.get('industry', 'Food Products')
        markets = data.get('markets', [])
        timeline_option = data.get('timeline_option', 'standard')
        
        # Get regulatory documents for timeline adjustment
        regulatory_reqs = analyze_regulatory_requirements(industry, markets)
        # Flatten documents from all markets
        all_documents = []
        for market, market_data in regulatory_reqs.get('markets', {}).items():
            all_documents.extend(market_data.get('documents', []))
        
        # Estimate project timeline with regulatory documents
        timeline = estimate_project_duration(timeline_option, all_documents)
        
        return jsonify({
            'success': True,
            'data': timeline,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error in timeline estimation: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/resources/estimate', methods=['POST'])
def resource_estimate_endpoint():
    """API endpoint for resource requirement estimates."""
    try:
        data = request.json
        industry = data.get('industry', 'Food Products')
        markets = data.get('markets', [])
        timeline_option = data.get('timeline_option', 'standard')
        company_size = data.get('company_size', 'medium')
        
        # Get regulatory documents for cost adjustment
        regulatory_reqs = analyze_regulatory_requirements(industry, markets)
        # Flatten documents from all markets
        all_documents = []
        for market, market_data in regulatory_reqs.get('markets', {}).items():
            all_documents.extend(market_data.get('documents', []))
        
        # Estimate resources with regulatory documents included
        resource_estimate = estimate_resource_requirements(
            industry, 
            markets, 
            timeline_option,
            all_documents,
            company_size
        )
        
        return jsonify({
            'success': True,
            'data': resource_estimate,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error in resource estimation: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/resources/roi', methods=['POST'])
def roi_estimate_endpoint():
    """API endpoint for ROI estimation."""
    try:
        data = request.json
        industry = data.get('industry', 'Food Products')
        markets = data.get('markets', [])
        timeline_option = data.get('timeline_option', 'standard')
        projected_sales = data.get('projected_sales')
        
        # Estimate ROI
        roi_estimate = estimate_roi(
            industry,
            markets,
            timeline_option,
            projected_sales
        )
        
        return jsonify({
            'success': True,
            'data': roi_estimate,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error in ROI estimation: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/resources/funding', methods=['POST'])
def funding_options_endpoint():
    """API endpoint for funding options."""
    try:
        data = request.json
        cost_estimate = data.get('cost_estimate', {})
        company_size = data.get('company_size', 'medium')
        industry = data.get('industry', 'Food Products')
        
        # Get funding options
        funding_options = estimate_funding_options(
            cost_estimate,
            company_size,
            industry
        )
        
        return jsonify({
            'success': True,
            'data': {
                'funding_options': funding_options
            },
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error in funding options analysis: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

# Main entry point for running the API server
if __name__ == '__main__':
    app.run(debug=True, port=5000) 