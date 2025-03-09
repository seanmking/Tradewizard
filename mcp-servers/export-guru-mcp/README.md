# Export Guru MCP Server

Export Guru MCP Server serves as the conduit between trade databases/APIs and user-facing components (reports and dashboard) for the TradeKing platform. It provides a comprehensive set of tools for analyzing businesses, mapping products to HS codes, accessing trade flow data, and generating market intelligence reports.

## Features

- **Business Analysis Tools**: Categorize SME businesses and map to HS codes
- **Regulatory Requirement Tools**: Fetch country-specific export requirements
- **Market Intelligence Tools**: Access real trade flow data
- **SQL Generation Tools**: Create optimized database queries
- **Report Generation Tools**: Compile market insights for the user

## Architecture

The Export Guru MCP Server is built using the Model Context Protocol (MCP) framework, which allows for seamless integration with AI assistants. The server exposes a set of tools that can be called by AI assistants to perform specific tasks.

### Key Components

- **MCP Server**: Handles tool registration and execution
- **Connectors**: Interfaces with external APIs and databases
- **Tools**: Implements business logic for various tasks
- **Utilities**: Provides common functionality like caching and error handling

## Getting Started

### Prerequisites

- Node.js 18+
- Ollama (for LLM functionality)
- PostgreSQL (for internal database)
- API keys for Trade Map and UN Comtrade

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/seanmking/export-guru-mcp.git
   cd export-guru-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your API keys and database credentials.

5. Build the project:
   ```bash
   npm run build
   ```

6. Start the server:
   ```bash
   npm start
   ```

## API Reference

The MCP server exposes the following tool categories:

### Business Analysis Tools

- `categorizeBusiness`: Categorize a business based on its description and products
- `mapToHsCodes`: Map products to HS (Harmonized System) codes
- `analyzeWebsite`: Analyze a business website to extract product and business information

### Regulatory Tools

- `getExportRequirements`: Get export requirements for a specific product and destination
- `checkCompliance`: Check if a product meets the regulatory requirements for a specific market

### Market Intelligence Tools

- `getTradeFlowData`: Get trade flow data for a specific product and market
- `getMarketFitScore`: Calculate how well a product fits a specific market
- `getCompetitorAnalysis`: Analyze competitors in a target market

### SQL Tools

- `generateSqlQuery`: Generate SQL queries for specific data needs
- `validateSqlQuery`: Validate SQL queries for security and performance

### Report Tools

- `generateMarketReport`: Generate a comprehensive market report
- `generateExportPlan`: Generate an export plan for a specific business and market

## Integration Points

### Assessment Flow

The Export Guru MCP Server integrates with the assessment flow by providing tools for analyzing businesses and their products. The assessment flow can call the `analyzeWebsite` tool to extract business information, the `categorizeBusiness` tool to categorize the business, and the `mapToHsCodes` tool to map products to HS codes.

### Report Generation

The Export Guru MCP Server provides tools for generating comprehensive market reports and export plans. The report generation system can call the `generateMarketReport` tool to create a market report for a specific business and market, or the `generateExportPlan` tool to create an export plan.

### Dashboard Components

The Export Guru MCP Server supplies data to the dashboard components through its market intelligence tools. The dashboard can call the `getTradeFlowData` tool to get trade flow data, the `getMarketFitScore` tool to calculate market fit scores, and the `getCompetitorAnalysis` tool to analyze competitors.

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.