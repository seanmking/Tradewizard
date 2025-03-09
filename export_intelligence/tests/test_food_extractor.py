"""
Tests for the food industry extractors.
"""

import pytest
from bs4 import BeautifulSoup

from export_intelligence.extractors.food import (
    FoodProductExtractor,
    FrozenCannedExtractor,
    ProcessedFoodExtractor,
    BeverageExtractor
)

# Test HTML content
FROZEN_PRODUCT_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Frozen Peas - 500g</title>
</head>
<body>
    <h1>Frozen Garden Peas - Premium Quality</h1>
    <div class="product-description">
        Sweet and tender garden peas, picked at their peak and flash-frozen to preserve nutrients and flavor.
    </div>
    
    <div class="product-details">
        <h2>Storage Information</h2>
        <p>Keep frozen at or below -18°C. Do not refreeze after thawing.</p>
        <p>Best before: See date printed on package (DD/MM/YYYY)</p>
        <p>Shelf life of 24 months when kept frozen.</p>
        
        <h2>Nutritional Information</h2>
        <table class="nutrition-table">
            <tr>
                <th>Per 100g</th>
                <th>Value</th>
            </tr>
            <tr>
                <td>Energy</td>
                <td>81 kcal (339 kJ)</td>
            </tr>
            <tr>
                <td>Fat</td>
                <td>0.9g</td>
            </tr>
            <tr>
                <td>of which saturates</td>
                <td>0.2g</td>
            </tr>
            <tr>
                <td>Carbohydrates</td>
                <td>8.9g</td>
            </tr>
            <tr>
                <td>of which sugars</td>
                <td>5.9g</td>
            </tr>
            <tr>
                <td>Fiber</td>
                <td>5.5g</td>
            </tr>
            <tr>
                <td>Protein</td>
                <td>6.0g</td>
            </tr>
            <tr>
                <td>Salt</td>
                <td>0.05g</td>
            </tr>
        </table>
        
        <h2>Ingredients</h2>
        <p>Ingredients: 100% Garden Peas</p>
        
        <h2>Allergen Information</h2>
        <p>Allergen Advice: For allergens, see ingredients in <b>bold</b>.</p>
        <p>May contain traces of <b>celery</b>.</p>
        
        <h2>Packaging Information</h2>
        <p>Packaged in a recyclable plastic bag. Store in the freezer in the original packaging.</p>
        
        <h2>Country of Origin</h2>
        <p>Product of United Kingdom</p>
    </div>
    
    <div class="certifications">
        <img src="/images/organic-cert.png" alt="Organic Certified">
        <img src="/images/non-gmo.png" alt="Non-GMO Project Verified">
    </div>
</body>
</html>
"""

PROCESSED_FOOD_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Tomato Pasta Sauce - 500g</title>
</head>
<body>
    <h1>Organic Tomato Pasta Sauce</h1>
    <div class="description">
        A delicious and rich tomato sauce made with organic ingredients, perfect for pasta dishes.
    </div>
    
    <div class="product-info">
        <h2>Storage Information</h2>
        <p>Store in a cool, dry place. Once opened, refrigerate and use within 3 days.</p>
        <p>Best before: 12 months from production date.</p>
        
        <h2>Nutrition Facts</h2>
        <table>
            <tr>
                <th colspan="2">Nutrition Facts</th>
            </tr>
            <tr>
                <td colspan="2">Serving Size: 100g</td>
            </tr>
            <tr>
                <td>Calories</td>
                <td>75</td>
            </tr>
            <tr>
                <td>Total Fat</td>
                <td>3.5g</td>
            </tr>
            <tr>
                <td>Saturated Fat</td>
                <td>0.5g</td>
            </tr>
            <tr>
                <td>Cholesterol</td>
                <td>0mg</td>
            </tr>
            <tr>
                <td>Sodium</td>
                <td>650mg</td>
            </tr>
            <tr>
                <td>Total Carbohydrate</td>
                <td>8g</td>
            </tr>
            <tr>
                <td>Dietary Fiber</td>
                <td>2g</td>
            </tr>
            <tr>
                <td>Total Sugars</td>
                <td>5g</td>
            </tr>
            <tr>
                <td>Added Sugars</td>
                <td>0g</td>
            </tr>
            <tr>
                <td>Protein</td>
                <td>2g</td>
            </tr>
        </table>
        
        <h2>Ingredients</h2>
        <p>Ingredients: Organic Tomatoes (80%), Organic Onions, Organic Extra Virgin Olive Oil, 
           Organic Basil, Sea Salt, Organic Garlic, Organic Black Pepper, Citric Acid (E330).</p>
        
        <h2>Allergy Information</h2>
        <p>Contains: No allergens.</p>
        <p>May contain traces of <strong>celery</strong> and <strong>mustard</strong>.</p>
        
        <h2>Claims</h2>
        <ul>
            <li>Good source of vitamin C</li>
            <li>No added sugar</li>
            <li>No artificial preservatives</li>
        </ul>
        
        <h2>Made In</h2>
        <p>Made in Italy</p>
    </div>
    
    <div class="certifications">
        <img src="/images/organic.png" alt="Organic Certified">
        <img src="/images/vegan.png" alt="Vegan Friendly">
    </div>
</body>
</html>
"""

BEVERAGE_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Organic Red Wine - 750ml</title>
</head>
<body>
    <h1>Premium Organic Red Wine</h1>
    <div class="product-description">
        A full-bodied organic red wine with notes of blackberry, cherry, and a hint of oak.
    </div>
    
    <div class="product-info">
        <h2>Storage Information</h2>
        <p>Store in a cool, dark place. Best served at room temperature (16-18°C).</p>
        <p>Best consumed within 5 years of the vintage date.</p>
        
        <h2>Product Details</h2>
        <p>Alcohol content: 13.5% ABV</p>
        <p>Volume: 750ml</p>
        <p>Warning: Contains alcohol. Not suitable for pregnant women or persons under 18 years of age.</p>
        
        <h2>Nutritional Information (per 100ml)</h2>
        <table>
            <tr>
                <td>Energy</td>
                <td>85 kcal</td>
            </tr>
            <tr>
                <td>Carbohydrates</td>
                <td>2.6g</td>
            </tr>
            <tr>
                <td>of which sugars</td>
                <td>0.6g</td>
            </tr>
            <tr>
                <td>Protein</td>
                <td>0.1g</td>
            </tr>
            <tr>
                <td>Fat</td>
                <td>0g</td>
            </tr>
            <tr>
                <td>Salt</td>
                <td>0g</td>
            </tr>
        </table>
        
        <h2>Ingredients</h2>
        <p>Ingredients: Organic grapes, sulfites (E220).</p>
        
        <h2>Country of Origin</h2>
        <p>Product of France</p>
    </div>
    
    <div class="certifications">
        <img src="/images/organic.png" alt="Organic Certified">
    </div>
</body>
</html>
"""


@pytest.fixture
def frozen_product_soup():
    """Return a BeautifulSoup object for a frozen product."""
    return BeautifulSoup(FROZEN_PRODUCT_HTML, 'html.parser')


@pytest.fixture
def processed_food_soup():
    """Return a BeautifulSoup object for a processed food product."""
    return BeautifulSoup(PROCESSED_FOOD_HTML, 'html.parser')


@pytest.fixture
def beverage_soup():
    """Return a BeautifulSoup object for a beverage product."""
    return BeautifulSoup(BEVERAGE_HTML, 'html.parser')


class TestFoodProductExtractor:
    """Test the basic food product extractor."""
    
    def test_extract_product_name(self, frozen_product_soup):
        """Test extraction of product name."""
        extractor = FoodProductExtractor()
        name = extractor._extract_product_name(frozen_product_soup)
        assert name == "Frozen Garden Peas - Premium Quality"
    
    def test_extract_description(self, frozen_product_soup):
        """Test extraction of product description."""
        extractor = FoodProductExtractor()
        description = extractor._extract_description(frozen_product_soup)
        assert "Sweet and tender garden peas" in description
    
    def test_extract_shelf_life(self, frozen_product_soup):
        """Test extraction of shelf life information."""
        extractor = FoodProductExtractor()
        shelf_life = extractor._extract_shelf_life(frozen_product_soup)
        assert 'shelf_life' in shelf_life
        assert shelf_life['shelf_life']['storage_temperature'] == "-18°C"
        assert shelf_life['shelf_life']['shelf_life_duration'] == "24"
        assert shelf_life['shelf_life']['shelf_life_unit'] == "month"
    
    def test_extract_nutritional_info(self, frozen_product_soup):
        """Test extraction of nutritional information."""
        extractor = FoodProductExtractor()
        nutrition = extractor._extract_nutritional_info(frozen_product_soup)
        assert 'nutrition' in nutrition
        assert nutrition['nutrition']['calories'] == "81 kcal (339 kJ)"
        assert nutrition['nutrition']['protein'] == "6.0g"
    
    def test_extract_ingredients(self, frozen_product_soup):
        """Test extraction of ingredients."""
        extractor = FoodProductExtractor()
        ingredients = extractor._extract_ingredients(frozen_product_soup)
        assert 'ingredients' in ingredients
        assert "100% Garden Peas" in ingredients['ingredients']['ingredients_list']
    
    def test_extract_allergens(self, frozen_product_soup):
        """Test extraction of allergen information."""
        extractor = FoodProductExtractor()
        allergens = extractor._extract_allergens(frozen_product_soup)
        assert 'allergens' in allergens
        assert 'may_contain' in allergens['allergens']
        assert 'celery' in allergens['allergens']['emphasized_allergens']
    
    def test_extract_certifications(self, frozen_product_soup):
        """Test extraction of certification information."""
        extractor = FoodProductExtractor()
        certifications = extractor._extract_certifications(frozen_product_soup)
        assert 'certifications' in certifications
        assert 'organic' in certifications['certifications']['certifications']
    
    def test_extract_origin(self, frozen_product_soup):
        """Test extraction of origin information."""
        extractor = FoodProductExtractor()
        origin = extractor._extract_origin(frozen_product_soup)
        assert 'origin' in origin
        assert origin['origin']['country_of_origin'] == "United Kingdom"


class TestFrozenCannedExtractor:
    """Test the frozen/canned goods extractor."""
    
    def test_extract_cold_chain_info(self, frozen_product_soup):
        """Test extraction of cold chain information."""
        extractor = FrozenCannedExtractor()
        cold_chain = extractor._extract_cold_chain_info(frozen_product_soup)
        assert cold_chain['temperature_specification'] == "-18°C"
        assert cold_chain['do_not_refreeze'] == True
    
    def test_extract_packaging_info(self, frozen_product_soup):
        """Test extraction of packaging information."""
        extractor = FrozenCannedExtractor()
        packaging = extractor._extract_packaging_info(frozen_product_soup)
        assert packaging['type'] == "plastic"
        assert packaging['recyclable'] == True
    
    def test_full_extraction(self, frozen_product_soup):
        """Test full extraction of a frozen product."""
        extractor = FrozenCannedExtractor()
        data = extractor._extract(frozen_product_soup, "http://example.com/frozen-peas")
        assert data['product_name'] == "Frozen Garden Peas - Premium Quality"
        assert 'shelf_life' in data
        assert 'nutrition' in data
        assert 'cold_chain' in data
        assert 'packaging' in data
        assert data['cold_chain']['temperature_specification'] == "-18°C"
        assert data['origin']['country_of_origin'] == "United Kingdom"


class TestProcessedFoodExtractor:
    """Test the processed food extractor."""
    
    def test_extract_additives(self, processed_food_soup):
        """Test extraction of additives information."""
        extractor = ProcessedFoodExtractor()
        additives = extractor._extract_additives(processed_food_soup)
        assert 'identified_additives' in additives
        assert 'e330' in [a.lower() for a in additives['identified_additives']]
    
    def test_extract_health_claims(self, processed_food_soup):
        """Test extraction of health claims."""
        extractor = ProcessedFoodExtractor()
        claims = extractor._extract_health_claims(processed_food_soup)
        assert 'claims' in claims
        assert any('good source of vitamin c' in claim.lower() for claim in claims['claims'])
        assert any('no added sugar' in claim.lower() for claim in claims['claims'])
    
    def test_full_extraction(self, processed_food_soup):
        """Test full extraction of a processed food product."""
        extractor = ProcessedFoodExtractor()
        data = extractor._extract(processed_food_soup, "http://example.com/tomato-sauce")
        assert data['product_name'] == "Organic Tomato Pasta Sauce"
        assert 'additives' in data
        assert 'health_claims' in data
        assert 'nutrition' in data
        assert data['nutrition']['calories'] == "75"
        assert data['origin']['country_of_origin'] == "Italy"


class TestBeverageExtractor:
    """Test the beverage extractor."""
    
    def test_extract_alcohol_content(self, beverage_soup):
        """Test extraction of alcohol content."""
        extractor = BeverageExtractor()
        alcohol = extractor._extract_alcohol_content(beverage_soup)
        assert alcohol['abv_percentage'] == "13.5"
        assert alcohol['warning_present'] == True
    
    def test_full_extraction(self, beverage_soup):
        """Test full extraction of a beverage product."""
        extractor = BeverageExtractor()
        data = extractor._extract(beverage_soup, "http://example.com/red-wine")
        assert data['product_name'] == "Premium Organic Red Wine"
        assert 'alcohol' in data
        assert data['alcohol']['abv_percentage'] == "13.5"
        assert data['origin']['country_of_origin'] == "France" 