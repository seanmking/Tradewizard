# Company Data Scraper

A web scraper built with Scrapy to extract company information from websites and structure it according to a standardized format.

## Installation

1. Ensure you have Python 3.8+ installed
2. Clone this repository
3. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows, use: venv\Scripts\activate
   ```
4. Install the required dependencies:
   ```bash
   cd /path/to/company_scraper
   pip install -e .
   ```

## Usage

### Running the Scraper

To scrape data from a company website, use the `run_scraper.py` script:

```bash
python run_scraper.py https://example.com
```

By default, the scraped data will be saved to `scraped_company_data.json`. You can specify a different output file:

```bash
python run_scraper.py https://example.com -o custom_output.json
```

### Post-Processing the Data

After scraping, you can use the post-processing utility to clean and enrich the data:

```bash
python -m utils.post_process scraped_company_data.json
```

This will create a processed version of the data at `scraped_company_data_processed.json`.

## Output Data Format

The scraper extracts data in the following JSON structure:

```json
{
  "companyInfo": {
    "name": "Company Name",
    "founded": 2000,
    "location": "Company Address",
    "description": "Company description",
    "contact": {
      "phone": "Phone number",
      "email": "contact@example.com",
      "businessHours": "Monday-Friday: 9am-5pm",
      "social": {
        "instagram": "Instagram link",
        "facebook": "Facebook link",
        "linkedin": "LinkedIn link"
      }
    },
    "registrationDetails": {
      "regNumber": "Registration number",
      "vat": "VAT number",
      "beeLevel": "BEE level"
    }
  },
  "team": [
    {
      "name": "Team Member Name",
      "role": "Job Title",
      "background": "Background information",
      "description": "Detailed description"
    }
  ],
  "products": {
    "categories": [
      {
        "name": "Product Category",
        "description": "Category description",
        "items": [
          {
            "name": "Product Name",
            "sizes": ["Size1", "Size2"],
            "prices": [100, 200],
            "description": "Product description",
            "ingredients": ["Ingredient1", "Ingredient2"],
            "shelfLife": "Shelf life information"
          }
        ]
      }
    ]
  },
  "facilities": {
    "mainFacility": {
      "size": "Facility size",
      "location": "Facility location",
      "features": ["Feature1", "Feature2"],
      "capacity": "Production capacity",
      "certifications": ["Certification1", "Certification2"],
      "upcomingCertifications": ["Upcoming Certification"]
    }
  },
  "distribution": {
    "retailLocations": {
      "Region1": {
        "Store1": ["Location1", "Location2"],
        "Store2": ["Location3", "Location4"]
      }
    },
    "markets": ["Market1", "Market2"],
    "onlinePlatforms": ["Platform1", "Platform2"]
  },
  "blogPosts": [
    {
      "title": "Blog Post Title",
      "date": "Date",
      "content": "Blog post content"
    }
  ],
  "sustainability": {
    "initiatives": [
      {
        "name": "Initiative Name",
        "description": "Initiative description"
      }
    ],
    "futurePlans": ["Future Plan1", "Future Plan2"]
  }
}
```

## Customizing the Spider

To customize the spider for a specific website:

1. Open `company_scraper/spiders/company_spider.py`
2. Modify the CSS selectors to match the structure of the target website
3. Add any additional parsing logic specific to the target website

## Troubleshooting

If the spider is not extracting the expected data:

1. Check the CSS selectors in the spider to ensure they match the structure of the website
2. Use the Scrapy shell to test selectors: `scrapy shell https://example.com`
3. Inspect the website's HTML structure to identify the correct selectors 