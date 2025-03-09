# Export Guru MCP API Documentation

This document outlines the API endpoints exposed by the Export Guru MCP server.

## Base URL

All API endpoints are relative to the base URL:

```
http://localhost:3001/api
```

## Authentication

Authentication is not currently implemented. All endpoints are publicly accessible.

## Endpoints

### Regulatory Data

#### Get Regulatory Requirements

Retrieves regulatory requirements for exporting a product to a specific country.

```
GET /regulatory/requirements
```

**Query Parameters:**

- `country` (required): The target country
- `productCategory` (required): The product category
- `hsCode` (optional): The HS code of the product
- `enhance` (optional): Whether to enhance the requirements with LLM (default: false)

**Response:**

```json
{
  "requirements": [
    {
      "country": "Germany",
      "productCategory": "Electronics",
      "hsCode": "8471",
      "requirementType": "Certification",
      "description": "CE Marking is required for all electronic products sold in the EU",
      "agency": "European Commission",
      "url": "https://ec.europa.eu/growth/single-market/ce-marking_en",
      "lastUpdated": "2023-01-15",
      "confidence": 0.95
    }
  ]
}
```

#### Get Compliance Assessment

Assesses compliance with regulatory requirements for a specific business and market.

```
POST /regulatory/compliance-assessment
```

**Request Body:**

```json
{
  "business": {
    "businessName": "TechCorp",
    "categories": [
      {
        "mainSector": "Electronics",
        "subSector": "Consumer Electronics",
        "attributes": ["Manufacturing", "Export"],
        "confidence": 0.9
      }
    ],
    "products": [
      {
        "name": "Smartphone",
        "description": "High-end smartphone with 5G capability",
        "hsCode": "8517"
      }
    ],
    "certifications": {
      "items": ["ISO 9001", "CE"],
      "confidence": 0.8
    }
  },
  "targetMarket": "Germany"
}
```

**Response:**

```json
{
  "overallScore": 0.75,
  "weightedScore": 0.8,
  "satisfiedRequirements": [
    {
      "country": "Germany",
      "productCategory": "Electronics",
      "hsCode": "8517",
      "requirementType": "Certification",
      "description": "CE Marking",
      "agency": {
        "name": "European Commission",
        "country": "EU",
        "website": "https://ec.europa.eu/growth/single-market/ce-marking_en"
      },
      "confidence": 0.95
    }
  ],
  "missingRequirements": [
    {
      "country": "Germany",
      "productCategory": "Electronics",
      "hsCode": "8517",
      "requirementType": "Documentation",
      "description": "Technical File",
      "agency": {
        "name": "European Commission",
        "country": "EU",
        "website": "https://ec.europa.eu/growth/single-market/ce-marking_en"
      },
      "confidence": 0.9
    }
  ],
  "partiallyCompliantRequirements": []
}
```

### Market Intelligence

#### Get Market Information

Retrieves information about a specific market.

```
GET /market-intelligence/market-info
```

**Query Parameters:**

- `country` (required): The target country
- `productCategory` (optional): The product category
- `hsCode` (optional): The HS code of the product

**Response:**

```json
{
  "id": "DE",
  "name": "Germany",
  "description": "Germany is the largest economy in Europe and the fourth-largest in the world.",
  "confidence": 0.95,
  "marketSize": "$3.8 trillion",
  "growthRate": "1.5%",
  "entryBarriers": "Moderate",
  "regulatoryComplexity": "High",
  "strengths": [
    "Strong manufacturing base",
    "High consumer purchasing power",
    "Central location in Europe"
  ]
}
```

#### Get Trade Flow Data

Retrieves trade flow data between countries for a specific product.

```
GET /market-intelligence/trade-flow
```

**Query Parameters:**

- `exporter` (required): The exporting country
- `importer` (required): The importing country
- `hsCode` (required): The HS code of the product
- `year` (optional): The year of the data (default: current year - 1)

**Response:**

```json
{
  "exporterCountry": "China",
  "importerCountry": "Germany",
  "hsCode": "8517",
  "year": 2022,
  "value": 5000000000,
  "quantity": 25000000,
  "unit": "Items",
  "growth": 0.05,
  "marketShare": 0.35
}
```

#### Analyze Tariffs

Analyzes tariffs for exporting a product to a specific country.

```
GET /market-intelligence/analyze-tariffs
```

**Query Parameters:**

- `exporter` (required): The exporting country
- `importer` (required): The importing country
- `hsCode` (required): The HS code of the product

**Response:**

```json
{
  "hsCode": "8517",
  "productDescription": "Smartphones and other telephone sets",
  "tariffRate": 0.0,
  "preferentialRate": 0.0,
  "valueAddedTax": 0.19,
  "otherTaxes": [],
  "nonTariffBarriers": [
    "CE Marking",
    "WEEE Directive",
    "RoHS Directive"
  ],
  "totalEstimatedDuty": 0.19
}
```

### Business Analysis

#### Analyze Website

Analyzes a website to extract business information.

```
POST /business-analysis/analyze-website
```

**Request Body:**

```json
{
  "url": "https://example.com",
  "content": "Example Corp is a leading manufacturer of smartphones and tablets..."
}
```

**Response:**

```json
{
  "businessProfile": {
    "products": [
      {
        "name": "Smartphone",
        "description": "High-end smartphone with 5G capability",
        "category": "Electronics",
        "estimatedHsCode": "8517"
      },
      {
        "name": "Tablet",
        "description": "Tablet computer with 10-inch display",
        "category": "Electronics",
        "estimatedHsCode": "8471"
      }
    ],
    "certifications": [
      "ISO 9001",
      "CE"
    ],
    "marketFocus": [
      "United States",
      "Europe",
      "Asia"
    ]
  },
  "regulatoryImplications": {
    "suggestedRequirements": [
      "CE Marking for European markets",
      "FCC certification for US market"
    ],
    "potentialCompliance": [
      "Already has CE certification"
    ],
    "riskAreas": [
      "GDPR compliance for data collection"
    ]
  }
}
```

#### Map Product to HS Code

Maps a product to an HS code.

```
POST /business-analysis/map-hs-code
```

**Request Body:**

```json
{
  "product": {
    "name": "Smartphone",
    "description": "High-end smartphone with 5G capability"
  }
}
```

**Response:**

```json
{
  "product": "Smartphone",
  "hsCode": "8517.12",
  "description": "Telephones for cellular networks or for other wireless networks",
  "confidence": 0.95,
  "metadata": {
    "alternativeCodes": [
      "8517.13",
      "8517.14"
    ],
    "notes": "Smartphones are typically classified under 8517.12"
  }
}
```

#### Assess Export Readiness

Assesses a business's readiness to export.

```
POST /business-analysis/export-readiness
```

**Request Body:**

```json
{
  "business": {
    "businessName": "TechCorp",
    "categories": [
      {
        "mainSector": "Electronics",
        "subSector": "Consumer Electronics",
        "attributes": ["Manufacturing", "Export"],
        "confidence": 0.9
      }
    ],
    "products": [
      {
        "name": "Smartphone",
        "description": "High-end smartphone with 5G capability",
        "hsCode": "8517"
      }
    ],
    "certifications": {
      "items": ["ISO 9001", "CE"],
      "confidence": 0.8
    },
    "businessDetails": {
      "estimatedSize": "Medium",
      "yearsOperating": "10+",
      "confidence": 0.9
    }
  }
}
```

**Response:**

```json
{
  "overallScore": 0.75,
  "dimensionScores": {
    "productReadiness": 0.8,
    "marketKnowledge": 0.7,
    "financialReadiness": 0.6,
    "operationalReadiness": 0.9
  },
  "regulatoryCompliance": 0.8,
  "recommendations": [
    "Improve market knowledge through market research",
    "Secure export financing",
    "Develop an export marketing plan"
  ],
  "timeline": {
    "readinessEstimate": "3-6 months",
    "keyMilestones": [
      "Complete market research",
      "Secure financing",
      "Develop marketing plan",
      "Identify distribution partners"
    ]
  }
}
```

### Reports

#### Generate Market Report

Generates a comprehensive market report for a business and target market.

```
POST /reports/market-report
```

**Request Body:**

```json
{
  "business": {
    "businessName": "TechCorp",
    "categories": [
      {
        "mainSector": "Electronics",
        "subSector": "Consumer Electronics",
        "attributes": ["Manufacturing", "Export"],
        "confidence": 0.9
      }
    ],
    "products": [
      {
        "name": "Smartphone",
        "description": "High-end smartphone with 5G capability",
        "hsCode": "8517"
      }
    ]
  },
  "targetMarket": "Germany"
}
```

**Response:**

```json
{
  "businessName": "TechCorp",
  "productCategories": ["Electronics", "Consumer Electronics"],
  "targetMarket": "Germany",
  "marketSize": "$10 billion",
  "growthRate": "5%",
  "entryBarriers": "Moderate",
  "regulatoryRequirements": [
    {
      "country": "Germany",
      "productCategory": "Electronics",
      "hsCode": "8517",
      "requirementType": "Certification",
      "description": "CE Marking is required for all electronic products sold in the EU",
      "agency": "European Commission",
      "url": "https://ec.europa.eu/growth/single-market/ce-marking_en",
      "lastUpdated": "2023-01-15",
      "confidence": 0.95
    }
  ],
  "competitorAnalysis": {
    "topCompetitors": ["Samsung", "Apple", "Huawei"],
    "marketShare": {
      "Samsung": 0.3,
      "Apple": 0.25,
      "Huawei": 0.15,
      "Others": 0.3
    },
    "strengthsWeaknesses": {
      "Samsung": ["Strong brand", "Wide product range", "High prices"],
      "Apple": ["Premium brand", "Loyal customer base", "Very high prices"],
      "Huawei": ["Competitive pricing", "Growing market share", "Political concerns"]
    }
  },
  "opportunityTimeline": {
    "months": 6,
    "milestones": {
      "Market Research": "Month 1",
      "Product Adaptation": "Month 2-3",
      "Certification": "Month 3-4",
      "Partner Identification": "Month 4-5",
      "Market Entry": "Month 6"
    }
  },
  "recommendations": [
    "Focus on mid-range smartphone segment",
    "Emphasize price-performance ratio",
    "Partner with established distributors",
    "Invest in localized marketing"
  ],
  "generatedDate": "2023-06-15T12:00:00Z"
}
```

### Integration

#### Create Integrated Assessment

Creates an integrated assessment for a business across multiple markets.

```
POST /integration/assessment
```

**Request Body:**

```json
{
  "business": {
    "businessName": "TechCorp",
    "categories": [
      {
        "mainSector": "Electronics",
        "subSector": "Consumer Electronics",
        "attributes": ["Manufacturing", "Export"],
        "confidence": 0.9
      }
    ],
    "products": [
      {
        "name": "Smartphone",
        "description": "High-end smartphone with 5G capability",
        "hsCode": "8517"
      }
    ]
  },
  "options": {
    "includeRegulatoryCompliance": true,
    "includeMarketIntelligence": true,
    "includeExportReadiness": true,
    "targetMarkets": ["Germany", "France", "UK"]
  }
}
```

**Response:**

```json
{
  "Germany": {
    "exportReadiness": {
      "overallScore": 0.75,
      "dimensionScores": {
        "productReadiness": 0.8,
        "marketKnowledge": 0.7,
        "financialReadiness": 0.6,
        "operationalReadiness": 0.9
      },
      "regulatoryCompliance": 0.8
    },
    "marketIntelligence": {
      "marketAccessScore": 0.7,
      "regulatoryBarriers": 0.3,
      "competitivePosition": "Moderate"
    },
    "regulatoryCompliance": {
      "complianceScore": 0.8,
      "missingRequirements": 2,
      "timeline": 3,
      "estimatedCost": "$5,000-$10,000"
    }
  },
  "France": {
    "exportReadiness": {
      "overallScore": 0.75,
      "dimensionScores": {
        "productReadiness": 0.8,
        "marketKnowledge": 0.6,
        "financialReadiness": 0.6,
        "operationalReadiness": 0.9
      },
      "regulatoryCompliance": 0.8
    },
    "marketIntelligence": {
      "marketAccessScore": 0.65,
      "regulatoryBarriers": 0.35,
      "competitivePosition": "Moderate"
    },
    "regulatoryCompliance": {
      "complianceScore": 0.8,
      "missingRequirements": 2,
      "timeline": 3,
      "estimatedCost": "$5,000-$10,000"
    }
  },
  "UK": {
    "exportReadiness": {
      "overallScore": 0.75,
      "dimensionScores": {
        "productReadiness": 0.8,
        "marketKnowledge": 0.8,
        "financialReadiness": 0.6,
        "operationalReadiness": 0.9
      },
      "regulatoryCompliance": 0.7
    },
    "marketIntelligence": {
      "marketAccessScore": 0.75,
      "regulatoryBarriers": 0.25,
      "competitivePosition": "Strong"
    },
    "regulatoryCompliance": {
      "complianceScore": 0.7,
      "missingRequirements": 3,
      "timeline": 4,
      "estimatedCost": "$7,000-$12,000"
    }
  }
}
```

#### Get Dashboard Data

Retrieves data for a dashboard.

```
POST /integration/dashboard-data
```

**Request Body:**

```json
{
  "business": {
    "businessName": "TechCorp",
    "categories": [
      {
        "mainSector": "Electronics",
        "subSector": "Consumer Electronics",
        "attributes": ["Manufacturing", "Export"],
        "confidence": 0.9
      }
    ],
    "products": [
      {
        "name": "Smartphone",
        "description": "High-end smartphone with 5G capability",
        "hsCode": "8517"
      }
    ]
  },
  "targetMarkets": ["Germany", "France", "UK"]
}
```

**Response:**

```json
{
  "businessProfile": {
    "name": "TechCorp",
    "sectors": ["Electronics - Consumer Electronics"],
    "products": ["Smartphone"],
    "currentMarkets": []
  },
  "marketComparison": {
    "markets": ["Germany", "France", "UK"],
    "metrics": [
      {
        "name": "Export Readiness",
        "data": [75, 75, 75]
      },
      {
        "name": "Market Access",
        "data": [70, 65, 75]
      },
      {
        "name": "Regulatory Compliance",
        "data": [80, 80, 70]
      },
      {
        "name": "Market Size",
        "data": [10, 8, 7]
      },
      {
        "name": "Growth Rate",
        "data": [5, 4, 3]
      }
    ],
    "recommendations": {
      "Germany": "Moderate potential with some challenges",
      "France": "Moderate potential with some challenges",
      "UK": "High potential market with good fit"
    }
  },
  "regulatoryRequirements": {
    "Germany": {
      "requirements": [
        {
          "country": "Germany",
          "requirementType": "Certification",
          "description": "CE Marking",
          "difficulty": 0.2
        }
      ],
      "requirementsByType": {
        "Certification": 1,
        "Documentation": 1
      },
      "requirementsByCountry": {
        "Germany": 2
      }
    }
  },
  "exportReadiness": {
    "overallScore": 75,
    "dimensionScores": [
      {
        "dimension": "productReadiness",
        "score": 80
      },
      {
        "dimension": "marketKnowledge",
        "score": 70
      },
      {
        "dimension": "financialReadiness",
        "score": 60
      },
      {
        "dimension": "operationalReadiness",
        "score": 90
      }
    ],
    "recommendations": [
      "Improve market knowledge through market research",
      "Secure export financing",
      "Develop an export marketing plan",
      "Establish logistics and distribution channels"
    ],
    "timeline": [
      {
        "milestone": "Market research and selection",
        "timeframe": "1-2 months"
      },
      {
        "milestone": "Product adaptation and certification",
        "timeframe": "3-6 months"
      },
      {
        "milestone": "Partner identification and negotiation",
        "timeframe": "2-4 months"
      },
      {
        "milestone": "First export shipment",
        "timeframe": "6-9 months"
      }
    ]
  }
}
```

### SQL

#### Generate SQL Query

Generates an SQL query from natural language.

```
POST /sql/generate
```

**Request Body:**

```json
{
  "naturalLanguageQuery": "Find all regulatory requirements for electronics in Germany",
  "context": {
    "tables": ["regulatory_requirements", "countries", "product_categories"],
    "domain": "regulatory"
  }
}
```

**Response:**

```json
{
  "sql": "SELECT r.* FROM regulatory_requirements r JOIN countries c ON r.country_id = c.id JOIN product_categories p ON r.product_category_id = p.id WHERE c.name = 'Germany' AND p.name = 'Electronics'",
  "parameters": [],
  "explanation": "This query joins the regulatory_requirements table with countries and product_categories to find all requirements for electronics products in Germany."
}
```

## Error Handling

All endpoints return standard HTTP status codes:

- `200 OK`: The request was successful
- `400 Bad Request`: The request was invalid
- `404 Not Found`: The requested resource was not found
- `500 Internal Server Error`: An error occurred on the server

Error responses include a JSON object with an error message:

```json
{
  "error": "Invalid country code"
}
```

## Rate Limiting

There is currently no rate limiting implemented.

## Versioning

The API is currently at version 1.0.0 and does not include version information in the URL.

## Future Enhancements

Future API enhancements will include:

- Authentication and authorization
- Rate limiting
- Versioning
- Pagination for large result sets
- Filtering and sorting options
- Webhooks for long-running operations 