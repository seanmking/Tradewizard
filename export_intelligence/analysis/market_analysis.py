def analyze_market_fit(product_categories, target_market):
    """
    Analyze how well the product categories fit the target market.
    
    Args:
        product_categories (list): List of product category strings
        target_market (str): Target market name
    
    Returns:
        int: Market fit score (0-100)
    """
    # Try to use structured market intelligence data first
    try:
        from .market_intelligence import get_market_intelligence, _normalize_market_name
        
        # Normalize market name
        normalized_market = _normalize_market_name(target_market)
        
        # Get market intelligence
        market_data = get_market_intelligence(target_market)
        
        # If we have match_score data, use it
        if market_data and 'match_score' in market_data:
            print(f"Using structured match score for {target_market}: {market_data['match_score']}")
            return market_data['match_score']
            
    except Exception as e:
        print(f"Falling back to hardcoded market fit analysis: {e}")
    
    # Default score
    base_score = 65
    
    # Market premium for specific markets
    market_premium = {
        'United Kingdom': 10,
        'United States': 8,
        'European Union': 7,
        'United Arab Emirates': 9,
        'Japan': 8,
        'Australia': 7,
        'Canada': 6
    }
    
    # Product category premium
    category_premium = {
        'Food Products': {
            'United Kingdom': 8,
            'United States': 5,
            'European Union': 7,
            'United Arab Emirates': 10,
            'Japan': 4,
            'Australia': 6,
            'Canada': 7
        },
        'Prepared Meals': {
            'United Kingdom': 10,
            'United States': 8,
            'European Union': 6,
            'United Arab Emirates': 7,
            'Japan': 5,
            'Australia': 7,
            'Canada': 8
        }
    }
    
    # Calculate score
    score = base_score
    
    # Add market premium
    if target_market in market_premium:
        score += market_premium[target_market]
    
    # Add category premium
    for category in product_categories:
        if category in category_premium and target_market in category_premium[category]:
            score += category_premium[category][target_market]
    
    # Cap at 100
    return min(score, 100)

def identify_strengths(user_data, target_market):
    """
    Identify business strengths relevant to the target market.
    
    Args:
        user_data (dict): User data dictionary
        target_market (str): Target market name
    
    Returns:
        list: List of strength statements
    """
    strengths = []
    
    # Business name
    business_name = user_data.get('business_name', 'Your company')
    
    # Add general strengths
    strengths.append(f"Premium quality product offering from {business_name}")
    
    # Add product-related strengths
    product_categories = []
    if 'products' in user_data and 'categories' in user_data['products']:
        product_categories = user_data['products']['categories']
        
    if product_categories:
        categories_str = ' and '.join(product_categories)
        strengths.append(f"Established expertise in {categories_str}")
    
    # Add market-related strengths
    current_markets = []
    if 'markets' in user_data and 'current' in user_data['markets']:
        current_markets = user_data['markets']['current']
    
    if current_markets:
        markets_str = ' and '.join(current_markets)
        strengths.append(f"Experience serving customers in {markets_str}")
    
    # Add export-related strength if applicable
    if 'export_experience' in user_data and user_data['export_experience']:
        strengths.append("Some international market exposure with sample shipments")
    
    # Add product certification strength if applicable
    if 'certifications' in user_data and user_data['certifications'].get('items', []):
        strengths.append("Product certifications that support international market entry")
    
    # Add mission-based strength if applicable
    if 'export_motivation' in user_data and 'sustainable' in user_data['export_motivation'].lower():
        strengths.append("Sustainability focus aligns with international market trends")
    
    return strengths

def identify_improvement_areas(user_data, target_market):
    """
    Identify areas for improvement relevant to the target market.
    
    Args:
        user_data (dict): User data dictionary
        target_market (str): Target market name
    
    Returns:
        list: List of improvement area statements
    """
    improvements = []
    
    # Add regulatory-related improvements
    if 'certifications' not in user_data or not user_data['certifications'].get('items', []):
        improvements.append(f"Obtain necessary certifications for {target_market} market entry")
    
    # Add export-related improvements
    if 'export_experience' in user_data and 'no direct exports' in user_data['export_experience'].lower():
        improvements.append("Develop export logistics and documentation processes")
    
    # Add market-specific improvements based on target market
    market_specific_improvements = {
        'United Kingdom': "Adapt packaging and labeling to UK post-Brexit requirements",
        'United States': "Ensure compliance with FDA food safety regulations",
        'European Union': "Meet EU packaging sustainability requirements",
        'United Arab Emirates': "Obtain Halal certification for food products",
        'Japan': "Adapt packaging aesthetics for Japanese consumer preferences",
        'Australia': "Comply with strict biosecurity and quarantine regulations",
        'Canada': "Bilingual packaging (English/French) for Canadian market"
    }
    
    if target_market in market_specific_improvements:
        improvements.append(market_specific_improvements[target_market])
    
    # Add general improvements
    improvements.append("Develop international marketing and digital presence")
    improvements.append("Build relationships with distributors in target markets")
    improvements.append("Secure trade financing and insurance for international shipments")
    
    return improvements 