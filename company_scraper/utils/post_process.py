import json
import os
import re
from datetime import datetime

def clean_string(text):
    """Clean a string by removing extra whitespace and normalizing text"""
    if not text:
        return ""
    # Replace multiple whitespaces with a single space
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def clean_data(data):
    """Clean the scraped data"""
    # Clean company info
    data['companyInfo']['name'] = clean_string(data['companyInfo']['name'])
    data['companyInfo']['location'] = clean_string(data['companyInfo']['location'])
    data['companyInfo']['description'] = clean_string(data['companyInfo']['description'])
    
    # Clean contact info
    data['companyInfo']['contact']['phone'] = clean_string(data['companyInfo']['contact']['phone'])
    data['companyInfo']['contact']['email'] = clean_string(data['companyInfo']['contact']['email'])
    data['companyInfo']['contact']['businessHours'] = clean_string(data['companyInfo']['contact']['businessHours'])
    
    # Clean team member data
    for member in data['team']:
        member['name'] = clean_string(member['name'])
        member['role'] = clean_string(member['role'])
        member['background'] = clean_string(member['background'])
        member['description'] = clean_string(member['description'])
    
    # Clean product data
    for category in data['products']['categories']:
        category['name'] = clean_string(category['name'])
        category['description'] = clean_string(category['description'])
        
        for item in category['items']:
            item['name'] = clean_string(item['name'])
            item['description'] = clean_string(item['description'])
            item['shelfLife'] = clean_string(item['shelfLife'])
            
            # Clean ingredients list
            item['ingredients'] = [clean_string(ing) for ing in item['ingredients'] if clean_string(ing)]
    
    # Clean blog posts
    for post in data['blogPosts']:
        post['title'] = clean_string(post['title'])
        post['content'] = clean_string(post['content'])
        post['date'] = clean_string(post['date'])
    
    # Clean sustainability initiatives
    for initiative in data['sustainability']['initiatives']:
        initiative['name'] = clean_string(initiative['name'])
        initiative['description'] = clean_string(initiative['description'])
    
    # Clean future plans
    data['sustainability']['futurePlans'] = [clean_string(plan) for plan in data['sustainability']['futurePlans'] if clean_string(plan)]
    
    return data

def enrich_data(data):
    """Add any missing data or enhance existing data"""
    # If no team members were found, add a placeholder
    if not data['team']:
        data['team'].append({
            "name": "[Team member information not available]",
            "role": "",
            "background": "",
            "description": ""
        })
    
    # If no product categories were found, add a placeholder
    if not data['products']['categories']:
        data['products']['categories'].append({
            "name": "Products",
            "description": "[Product information not available]",
            "items": []
        })
    
    # If no blog posts were found, add a placeholder
    if not data['blogPosts']:
        data['blogPosts'].append({
            "title": "[Blog content not available]",
            "date": datetime.now().strftime("%B %Y"),
            "content": ""
        })
    
    return data

def post_process_scraped_data(input_file, output_file=None):
    """Process scraped data to ensure it matches the required format"""
    try:
        # Read the scraped data
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Clean and enrich the data
        data = clean_data(data)
        data = enrich_data(data)
        
        # Write the processed data
        if output_file is None:
            base_name = os.path.splitext(input_file)[0]
            output_file = f"{base_name}_processed.json"
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"Data processing complete. Processed data saved to {output_file}")
        return True
    
    except Exception as e:
        print(f"Error processing data: {str(e)}")
        return False

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python post_process.py <input_file> [output_file]")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    post_process_scraped_data(input_file, output_file) 