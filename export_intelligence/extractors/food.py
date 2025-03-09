"""
Food industry specific extractors for the Export Intelligence Scraper.

This module implements extractors specialized for the food processing industry
and its subsectors like frozen/canned goods and processed foods.
"""

import re
import json
import logging
from datetime import datetime

from export_intelligence.extractors.base import BaseExtractor
from export_intelligence.extractors.adaptive import AdaptiveExtractor

# Configure logging
logger = logging.getLogger(__name__)

# Common food-related extraction patterns
FOOD_MARKERS = {
    'shelf_life': [
        'best before', 'use by', 'shelf life', 'expiry date', 'expiration date',
        'store at', 'storage conditions', 'keep refrigerated', 'keep frozen'
    ],
    'nutrition': [
        'nutrition facts', 'nutritional information', 'nutrition information',
        'per 100g', 'per serving', 'calories', 'energy', 'fat', 'carbohydrate',
        'protein', 'salt', 'fiber', 'sugar'
    ],
    'allergens': [
        'allergen', 'contains', 'may contain', 'allergy advice', 'allergen advice',
        'allergen information', 'allergen warning'
    ],
    'ingredients': [
        'ingredients', 'ingredient list', 'ingredient declaration', 'made from',
        'contains', 'made with'
    ],
    'certification': [
        'certified', 'certification', 'halal', 'kosher', 'organic', 'fair trade',
        'non-gmo', 'gluten-free', 'vegan', 'vegetarian'
    ],
    'origin': [
        'country of origin', 'made in', 'product of', 'produce of', 'origin'
    ]
}


class FoodProductExtractor(BaseExtractor):
    """Base extractor for food products with common functionality."""
    
    def __init__(self, config=None):
        """
        Initialize food product extractor.
        
        Args:
            config: Configuration dictionary
        """
        super().__init__(config)
    
    def _extract(self, soup, url=None, context=None):
        """
        Extract food product data from parsed HTML.
        
        Args:
            soup: BeautifulSoup object
            url: Source URL for reference
            context: Additional context for extraction
            
        Returns:
            Extracted food product data
        """
        # Basic product data
        product_data = {
            'url': url,
            'extracted_at': datetime.now().isoformat(),
            'product_name': self._extract_product_name(soup),
            'description': self._extract_description(soup)
        }
        
        # Extract specialized data
        product_data.update(self._extract_shelf_life(soup))
        product_data.update(self._extract_nutritional_info(soup))
        product_data.update(self._extract_ingredients(soup))
        product_data.update(self._extract_allergens(soup))
        product_data.update(self._extract_certifications(soup))
        product_data.update(self._extract_origin(soup))
        
        return product_data
    
    def _extract_product_name(self, soup):
        """Extract product name from the page."""
        # Try common locations for product names
        for selector in ['h1', 'h2.product-name', '.product-title', '[itemprop="name"]']:
            element = soup.select_one(selector)
            if element:
                return element.get_text(strip=True)
        
        # Fallback: look for largest heading
        for tag in ['h1', 'h2', 'h3']:
            elements = soup.find_all(tag)
            if elements:
                return elements[0].get_text(strip=True)
                
        return None
    
    def _extract_description(self, soup):
        """Extract product description from the page."""
        # Try common locations for product descriptions
        for selector in ['.product-description', '.description', '[itemprop="description"]',
                         '.product-info', '.product-details']:
            element = soup.select_one(selector)
            if element:
                return element.get_text(strip=True)
                
        return None
    
    def _extract_shelf_life(self, soup):
        """Extract shelf life information."""
        result = {}
        
        # Find elements containing shelf life markers
        context_elements = self.find_context_with_markers(soup, FOOD_MARKERS['shelf_life'])
        
        for element in context_elements:
            text = element.get_text(strip=True)
            
            # Look for storage temperature
            temp_match = re.search(r'(store|keep) at ([<>]?[\-\d]+[\s]*[°℃CFcf])', text, re.IGNORECASE)
            if temp_match:
                result['storage_temperature'] = temp_match.group(2)
                
            # Look for shelf life duration
            duration_match = re.search(r'shelf[\s\-]?life(\s+of)?\s+(\d+)\s+(day|month|year)s?', text, re.IGNORECASE)
            if duration_match:
                result['shelf_life_duration'] = duration_match.group(2)
                result['shelf_life_unit'] = duration_match.group(3)
                
            # Look for best before format
            date_format_match = re.search(r'(best before|use by|expiry)[\s:]+([^\.]+)', text, re.IGNORECASE)
            if date_format_match:
                result['date_format'] = date_format_match.group(2)
                
        return {'shelf_life': result} if result else {}
    
    def _extract_nutritional_info(self, soup):
        """Extract nutritional information."""
        result = {}
        
        # Find nutritional tables
        tables = soup.find_all('table')
        for table in tables:
            # Check if this looks like a nutrition table
            text = table.get_text().lower()
            if any(marker in text for marker in ['calorie', 'energy', 'nutrition']):
                rows = table.find_all('tr')
                for row in rows:
                    cells = row.find_all(['td', 'th'])
                    if len(cells) >= 2:
                        nutrient = cells[0].get_text(strip=True)
                        value = cells[1].get_text(strip=True)
                        
                        # Clean up the nutrient name
                        nutrient = nutrient.lower().replace(':', '')
                        
                        # Store common nutrients
                        if any(n in nutrient for n in ['calorie', 'energy']):
                            result['calories'] = value
                        elif 'fat' in nutrient:
                            result['fat'] = value
                        elif 'carbohydrate' in nutrient:
                            result['carbohydrates'] = value
                        elif 'protein' in nutrient:
                            result['protein'] = value
                        elif 'sugar' in nutrient:
                            result['sugars'] = value
                        elif 'fibre' in nutrient or 'fiber' in nutrient:
                            result['fiber'] = value
                        elif 'salt' in nutrient or 'sodium' in nutrient:
                            result['sodium'] = value
        
        # Find serving size information
        serving_elements = self.find_context_with_markers(soup, ['serving size', 'per serving'])
        for element in serving_elements:
            text = element.get_text(strip=True)
            serving_match = re.search(r'serving size[:\s]+([^\.]+)', text, re.IGNORECASE)
            if serving_match:
                result['serving_size'] = serving_match.group(1)
                
        return {'nutrition': result} if result else {}
    
    def _extract_ingredients(self, soup):
        """Extract ingredients list."""
        result = {}
        
        # Find elements containing ingredient markers
        context_elements = self.find_context_with_markers(soup, FOOD_MARKERS['ingredients'])
        
        for element in context_elements:
            text = element.get_text(strip=True)
            
            # Look for ingredient list format: "Ingredients: X, Y, Z"
            ingredients_match = re.search(r'ingredients[:\s]+([^\.]+)', text, re.IGNORECASE)
            if ingredients_match:
                ingredients_text = ingredients_match.group(1)
                # Split by comma and clean up
                ingredients = [ing.strip() for ing in ingredients_text.split(',')]
                result['ingredients_list'] = ingredients
                break
                
        return {'ingredients': result} if result else {}
    
    def _extract_allergens(self, soup):
        """Extract allergen information."""
        result = {}
        
        # Find elements containing allergen markers
        context_elements = self.find_context_with_markers(soup, FOOD_MARKERS['allergens'])
        
        for element in context_elements:
            text = element.get_text(strip=True)
            
            # Look for contains/may contain statements
            contains_match = re.search(r'contains[:\s]+([^\.]+)', text, re.IGNORECASE)
            if contains_match:
                result['contains'] = contains_match.group(1)
                
            may_contain_match = re.search(r'may contain[:\s]+([^\.]+)', text, re.IGNORECASE)
            if may_contain_match:
                result['may_contain'] = may_contain_match.group(1)
                
            # Check for emphasized allergens (usually in bold)
            bold_elements = element.find_all(['b', 'strong'])
            if bold_elements:
                result['emphasized_allergens'] = [e.get_text(strip=True) for e in bold_elements]
                
        return {'allergens': result} if result else {}
    
    def _extract_certifications(self, soup):
        """Extract certification information."""
        result = {}
        
        # Look for certification text
        context_elements = self.find_context_with_markers(soup, FOOD_MARKERS['certification'])
        
        certifications = []
        for element in context_elements:
            text = element.get_text(strip=True).lower()
            
            # Check for common certifications
            for cert in ['halal', 'kosher', 'organic', 'non-gmo', 'gluten-free', 'vegan']:
                if cert in text:
                    certifications.append(cert)
        
        # Look for certification images
        for img in soup.find_all('img'):
            alt_text = img.get('alt', '').lower()
            if any(cert in alt_text for cert in ['certified', 'halal', 'kosher', 'organic']):
                cert_type = next((cert for cert in ['halal', 'kosher', 'organic', 'non-gmo', 'gluten-free', 'vegan'] 
                                if cert in alt_text), 'other')
                if cert_type not in certifications:
                    certifications.append(cert_type)
                    
        if certifications:
            result['certifications'] = certifications
                
        return {'certifications': result} if result else {}
    
    def _extract_origin(self, soup):
        """Extract origin information."""
        result = {}
        
        # Find elements containing origin markers
        context_elements = self.find_context_with_markers(soup, FOOD_MARKERS['origin'])
        
        for element in context_elements:
            text = element.get_text(strip=True)
            
            # Look for country of origin
            origin_match = re.search(r'(country of origin|made in|produce of|product of)[:\s]+([^\.]+)', 
                                    text, re.IGNORECASE)
            if origin_match:
                result['country_of_origin'] = origin_match.group(2).strip()
                break
                
        return {'origin': result} if result else {}


class FrozenCannedExtractor(FoodProductExtractor):
    """Specialized extractor for frozen and canned goods."""
    
    def __init__(self, config=None):
        """Initialize frozen/canned extractor."""
        super().__init__(config)
    
    def _extract(self, soup, url=None, context=None):
        """Extract frozen/canned specific data."""
        # Get base food product data
        product_data = super()._extract(soup, url, context)
        
        # Add frozen/canned specific data
        cold_chain_data = self._extract_cold_chain_info(soup)
        packaging_data = self._extract_packaging_info(soup)
        
        if cold_chain_data:
            product_data['cold_chain'] = cold_chain_data
            
        if packaging_data:
            product_data['packaging'] = packaging_data
            
        return product_data
    
    def _extract_cold_chain_info(self, soup):
        """Extract cold chain specific information."""
        result = {}
        
        # Find cold chain related elements
        cold_chain_markers = [
            'cold chain', 'temperature control', 'frozen at', 'refrigerated at',
            'temperature monitoring', 'keep frozen', 'freezer', 'do not refreeze'
        ]
        
        context_elements = self.find_context_with_markers(soup, cold_chain_markers)
        
        for element in context_elements:
            text = element.get_text(strip=True)
            
            # Look for temperature specifications
            temp_match = re.search(r'([<>]?[\-\d]+[\s]*[°℃CFcf])', text)
            if temp_match:
                result['temperature_specification'] = temp_match.group(1)
                
            # Look for monitoring requirements
            if 'monitor' in text.lower():
                result['monitoring_required'] = True
                
            # Look for "do not refreeze" warnings
            if 'do not refreeze' in text.lower():
                result['do_not_refreeze'] = True
                
        return result
    
    def _extract_packaging_info(self, soup):
        """Extract packaging specific information for frozen/canned goods."""
        result = {}
        
        # Find packaging related elements
        packaging_markers = [
            'packaging', 'can', 'tin', 'plastic', 'recyclable', 'BPA-free',
            'pouch', 'vacuum sealed', 'modified atmosphere'
        ]
        
        context_elements = self.find_context_with_markers(soup, packaging_markers)
        
        for element in context_elements:
            text = element.get_text(strip=True).lower()
            
            # Determine packaging type
            if 'can' in text or 'tin' in text:
                result['type'] = 'canned'
            elif 'pouch' in text:
                result['type'] = 'pouch'
            elif 'plastic' in text:
                result['type'] = 'plastic'
                
            # Check BPA status
            if 'bpa-free' in text or 'bpa free' in text:
                result['bpa_free'] = True
                
            # Check recyclability
            if 'recyclable' in text:
                result['recyclable'] = True
                
            # Check atmosphere packaging
            if 'modified atmosphere' in text or 'vacuum sealed' in text:
                result['modified_atmosphere'] = True
                
        return result


class ProcessedFoodExtractor(FoodProductExtractor):
    """Specialized extractor for processed foods."""
    
    def __init__(self, config=None):
        """Initialize processed food extractor."""
        super().__init__(config)
    
    def _extract(self, soup, url=None, context=None):
        """Extract processed food specific data."""
        # Get base food product data
        product_data = super()._extract(soup, url, context)
        
        # Add processed food specific data
        additives_data = self._extract_additives(soup)
        health_claims_data = self._extract_health_claims(soup)
        
        if additives_data:
            product_data['additives'] = additives_data
            
        if health_claims_data:
            product_data['health_claims'] = health_claims_data
            
        return product_data
    
    def _extract_additives(self, soup):
        """Extract food additives information."""
        result = {}
        
        # Find additive related elements
        additive_markers = [
            'additives', 'preservatives', 'colorings', 'flavorings', 'E-number',
            'added', 'artificial', 'natural', 'sweetener'
        ]
        
        context_elements = self.find_context_with_markers(soup, additive_markers)
        
        additives_list = []
        for element in context_elements:
            text = element.get_text(strip=True)
            
            # Look for E-numbers (EU food additives)
            e_numbers = re.findall(r'E[ -]?\d{3,4}[a-z]?', text)
            if e_numbers:
                additives_list.extend(e_numbers)
                
            # Look for additive names
            additive_names = re.findall(r'(sodium benzoate|potassium sorbate|citric acid|aspartame|MSG)', 
                                      text, re.IGNORECASE)
            if additive_names:
                additives_list.extend([name.lower() for name in additive_names])
                
        if additives_list:
            result['identified_additives'] = list(set(additives_list))  # Remove duplicates
            
        return result
    
    def _extract_health_claims(self, soup):
        """Extract health claims information."""
        result = {}
        
        # Find health claim related elements
        health_claim_markers = [
            'health claim', 'benefit', 'good source', 'high in', 'low in',
            'reduced', 'light', 'free from', 'no added', 'natural', 'whole grain'
        ]
        
        context_elements = self.find_context_with_markers(soup, health_claim_markers)
        
        claims = []
        for element in context_elements:
            text = element.get_text(strip=True)
            
            # Look for common health claims
            for claim_pattern in [
                r'(good source of|high in) ([^\.]+)',
                r'(low|reduced|no|free from) ([^\.]+)',
                r'(whole grain|natural ingredients|no artificial) ([^\.]*)',
                r'(helps|supports|maintains|improves) ([^\.]+)'
            ]:
                matches = re.findall(claim_pattern, text, re.IGNORECASE)
                for match in matches:
                    claims.append(' '.join(match).strip())
                    
        if claims:
            result['claims'] = list(set(claims))  # Remove duplicates
            
        return result


class BeverageExtractor(FoodProductExtractor):
    """Specialized extractor for beverage products."""
    
    def __init__(self, config=None):
        """Initialize beverage extractor."""
        super().__init__(config)
    
    def _extract(self, soup, url=None, context=None):
        """Extract beverage specific data."""
        # Get base food product data
        product_data = super()._extract(soup, url, context)
        
        # Add beverage specific data
        alcohol_data = self._extract_alcohol_content(soup)
        caffeine_data = self._extract_caffeine_content(soup)
        
        if alcohol_data:
            product_data['alcohol'] = alcohol_data
            
        if caffeine_data:
            product_data['caffeine'] = caffeine_data
            
        return product_data
    
    def _extract_alcohol_content(self, soup):
        """Extract alcohol content information."""
        result = {}
        
        # Find alcohol related elements
        alcohol_markers = [
            'alcohol', 'ABV', '% vol', 'proof', 'contains alcohol',
            'alcoholic beverage', 'spirit', 'wine', 'beer'
        ]
        
        context_elements = self.find_context_with_markers(soup, alcohol_markers)
        
        for element in context_elements:
            text = element.get_text(strip=True)
            
            # Look for alcohol percentage
            abv_match = re.search(r'(\d+(\.\d+)?)\s*%\s*(ABV|alcohol|vol)', text, re.IGNORECASE)
            if abv_match:
                result['abv_percentage'] = abv_match.group(1)
                
            # Look for alcohol warnings
            if re.search(r'not (suitable|recommended) for (children|pregnant)', text, re.IGNORECASE):
                result['warning_present'] = True
                
        return result
    
    def _extract_caffeine_content(self, soup):
        """Extract caffeine content information."""
        result = {}
        
        # Find caffeine related elements
        caffeine_markers = [
            'caffeine', 'high caffeine', 'contains caffeine', 'caffeine content',
            'coffee', 'energy drink', 'per serving'
        ]
        
        context_elements = self.find_context_with_markers(soup, caffeine_markers)
        
        for element in context_elements:
            text = element.get_text(strip=True)
            
            # Look for caffeine amount
            caffeine_match = re.search(r'(\d+(\.\d+)?)\s*(mg|milligrams)(\s+of)?\s+caffeine', text, re.IGNORECASE)
            if caffeine_match:
                result['caffeine_mg'] = caffeine_match.group(1)
                
            # Look for high caffeine warnings
            high_match = re.search(r'high\s+caffeine\s+content', text, re.IGNORECASE)
            if high_match:
                result['high_caffeine_warning'] = True
                
        return result


# Industry pattern definitions based on the provided extraction pattern examples
FOOD_PROCESSING_PATTERNS = {
    'shelfLife': {
        'patternId': 'SHELF_LIFE_UK_FROZEN',
        'type': 'regex',
        'targetMarket': 'UK',
        'subsector': 'Frozen/Canned Goods',
        'textMarkers': [
            'best before', 'use by', 'shelf life', 'storage at ≤-18°C', 'shelf-stable for'
        ],
        'contextWindowSize': 300,
        'regexPattern': '(store|keep) at ([\\-\\d]+°C)|shelf[\\-\\s]life of ([\\d]+) (month|day|week|year)',
        'attributeExtraction': {
            'temperature': 'regexGroup[2]',
            'duration': 'regexGroup[3]',
            'unitOfTime': 'regexGroup[4]'
        },
        'validationLogic': 'if (subsector === "Frozen/Canned Goods" && temperature !== "≤-18°C") { flag = "TEMPERATURE_MISMATCH"; }'
    },
    'nutritionPanel': {
        'patternId': 'NUTRITION_USA_PROCESSED',
        'type': 'table',
        'targetMarket': 'USA',
        'subsector': 'Processed Foods',
        'textMarkers': [
            'Nutrition Facts', 'Serving size', 'Amount per serving', 'Daily value', 'Calories'
        ],
        'contextWindowSize': 1000,
        'regexPattern': 'Nutrition Facts[\\s\\S]*?Serving size[:\\s]+(\\d+[\\w\\s]+)[\\s\\S]*?Calories[:\\s]+(\\d+)',
        'structuredTableExtraction': {
            'tableHeaders': ['Amount Per Serving', '% Daily Value'],
            'requiredNutrients': ['Total Fat', 'Saturated Fat', 'Cholesterol', 'Sodium', 'Total Carbohydrate', 'Dietary Fiber', 'Total Sugars', 'Added Sugars', 'Protein']
        },
        'validationLogic': 'if (!nutrientValues["Added Sugars"]) { flag = "MISSING_ADDED_SUGARS"; }'
    },
    'allergen': {
        'patternId': 'ALLERGEN_EU_PROCESSED',
        'type': 'list',
        'targetMarket': 'UK',
        'subsector': 'Processed Foods',
        'textMarkers': [
            'allergen', 'contains', 'may contain', 'allergy advice'
        ],
        'contextWindowSize': 500,
        'regexPattern': '(Contains|May contain)[:](.*?)(?=\\.|$)',
        'structuredListExtraction': {
            'mandatoryAllergens': ['cereals containing gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soybeans', 'milk', 'nuts', 'celery', 'mustard', 'sesame', 'sulphur dioxide and sulphites', 'lupin', 'molluscs']
        },
        'attributeExtraction': {
            'allergenType': 'regexGroup[1]',
            'allergenList': 'regexGroup[2]'
        },
        'validationLogic': 'if (containsAllergen && !allergenHighlighted) { flag = "ALLERGEN_NOT_EMPHASIZED"; }'
    },
    'halal': {
        'patternId': 'HALAL_UAE_PROCESSED',
        'type': 'regex',
        'targetMarket': 'UAE',
        'subsector': 'Processed Foods',
        'textMarkers': [
            'Halal', 'حلال', 'certified', 'certification', 'permissible'
        ],
        'contextWindowSize': 500,
        'regexPattern': 'Halal certified by ([\\w\\s]+)',
        'attributeExtraction': {
            'certifyingBody': 'regexGroup[1]'
        },
        'validationLogic': 'if (containsAnimalProducts && !halalCertification) { flag = "MISSING_HALAL_CERTIFICATION"; }'
    }
}

# Categorize patterns by industry and market
def get_food_industry_patterns():
    """Get food industry extraction patterns organized by industry and market."""
    industry_patterns = {
        'Food Products': {
            'Frozen/Canned Goods': {
                'shelf_life_pattern': FOOD_PROCESSING_PATTERNS['shelfLife']
            },
            'Processed Foods': {
                'nutrition_pattern': FOOD_PROCESSING_PATTERNS['nutritionPanel'],
                'allergen_pattern': FOOD_PROCESSING_PATTERNS['allergen']
            }
        },
        'Beverages': {}
    }
    
    market_patterns = {
        'UK': {
            'allergen_pattern': FOOD_PROCESSING_PATTERNS['allergen']
        },
        'USA': {
            'nutrition_pattern': FOOD_PROCESSING_PATTERNS['nutritionPanel']
        },
        'UAE': {
            'halal_pattern': FOOD_PROCESSING_PATTERNS['halal']
        }
    }
    
    return {
        'industry_patterns': industry_patterns,
        'market_patterns': market_patterns
    } 