# TradeWizard Backend

This directory contains the backend services for the TradeWizard application.

## Mock Data vs. Live Data Extraction

TradeWizard has two operation modes:

1. **Demo Mode (Mock Data)** - For presentations, demos, and stable testing
2. **Live Mode (Dynamic Data)** - For real SME assessments with LLM-based data extraction

### Safe Demo Mode with Global Fresh

When using the Global Fresh domain (`globalfreshsa.co.za`), the system will ALWAYS use mock data. This ensures predictable and stable behavior for:
- Demo presentations
- Investor pitches
- Training sessions

#### Multiple Safety Checks for Global Fresh

We've implemented multiple safety checks to ensure demo mode is always used with Global Fresh:

1. **Domain Detection** - Any URL containing "globalfresh" or matching specific domains like "globalfreshsa.co.za" triggers mock data mode
2. **Default Fallback** - Services default to mock data unless explicitly set to use live data
3. **Mock Data Enforcement** - Critical components like market options always use consistent data for demos

### Live Mode with Other SMEs

For other SME websites:
1. The assessment begins normally
2. Upon entering a website URL that is NOT Global Fresh:
   - The system activates live data extraction mode
   - The company scraper extracts real website data
   - LLM-based analysis extracts structured business intelligence
   - Market recommendations are tailored to the actual SME data

## Implementation Details

Key components:

- **AssessmentFlowService** - Orchestrates the assessment and determines data mode
- **WebsiteAnalyzerService** - Analyzes website data (mock or scraped)
- **LLMService** - Handles LLM API calls for live data processing
- **MarketDataService** - Provides market intelligence (mock or generated)
- **CompanySpider** - Scrapes SME websites for data extraction

## Safety Features

1. **use_mock_data Flag** - Tracked throughout the assessment
2. **Multiple Domain Checks** - Several points validate the domain to ensure correct mode
3. **Fallback Mechanisms** - If live extraction fails, system gracefully handles the error
4. **Consistent Market Options** - Always provides standard market options for demos 