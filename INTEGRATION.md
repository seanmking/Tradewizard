# Integrating the TradeWizard AI Agent with the Web Server

This document explains how to integrate the streamlined TradeWizard AI Agent with the existing Flask web server.

## Overview

The TradeWizard AI Agent is implemented as a TypeScript library that can be compiled to JavaScript. To integrate it with the Flask web server, we need to:

1. Compile the TypeScript code
2. Make the compiled code accessible to the Flask backend
3. Create API endpoints in the Flask backend that interface with the AI Agent

## Integration Steps

### 1. Install the AI Agent

Run the provided installation script to compile the TypeScript code and create a symbolic link to the compiled code:

```bash
./install-aiagent.sh
```

This script will:
- Compile the TypeScript code using `tsc`
- Create a symbolic link from the `dist` directory to `tradewizard/backend/aiagent`

### 2. Start the Web Server

Start the web server using the existing start script:

```bash
./start.sh
```

This will start the Flask backend on port 5002 and the frontend on port 3000.

### 3. Access the AI Agent API

The AI Agent API is available at the following endpoints:

- **Assessment**: `POST /api/aiagent/assessment`
- **Market Report**: `POST /api/aiagent/market-report`
- **Timeline**: `POST /api/aiagent/timeline`
- **Update Profile**: `POST /api/aiagent/update-profile`
- **Select Market**: `POST /api/aiagent/select-market`
- **Compare Markets**: `POST /api/aiagent/compare-markets`
- **Notifications**: `GET /api/aiagent/notifications`

## API Documentation

### Assessment

```
POST /api/aiagent/assessment
```

Request body:
```json
{
  "businessId": "business-123",
  "data": {
    // Assessment data
  }
}
```

### Market Report

```
POST /api/aiagent/market-report
```

Request body:
```json
{
  "businessId": "business-123",
  "country": "Germany"
}
```

### Timeline

```
POST /api/aiagent/timeline
```

Request body:
```json
{
  "businessId": "business-123",
  "country": "Germany"
}
```

### Update Profile

```
POST /api/aiagent/update-profile
```

Request body:
```json
{
  "businessId": "business-123",
  "profile": {
    "name": "Example Export Company",
    "industry": "Food & Beverage",
    "size": "MEDIUM",
    "products": [
      {
        "id": "prod-1",
        "name": "Organic Fruit Juice",
        "category": "Beverages"
      }
    ]
  }
}
```

### Select Market

```
POST /api/aiagent/select-market
```

Request body:
```json
{
  "businessId": "business-123",
  "country": "Germany"
}
```

### Compare Markets

```
POST /api/aiagent/compare-markets
```

Request body:
```json
{
  "businessId": "business-123",
  "countries": ["Germany", "France", "United Kingdom"]
}
```

### Notifications

```
GET /api/aiagent/notifications?businessId=business-123&unreadOnly=true&limit=10
```

Query parameters:
- `businessId`: The business ID (required)
- `unreadOnly`: Whether to get only unread notifications (optional, default: false)
- `limit`: The maximum number of notifications to return (optional, default: 50)

## Troubleshooting

### Import Errors

If you encounter import errors when starting the Flask backend, make sure:

1. The TypeScript code has been compiled successfully
2. The symbolic link has been created correctly
3. The AI Agent blueprint has been registered in the Flask app

You can check the symbolic link with:

```bash
ls -la tradewizard/backend/aiagent
```

### Runtime Errors

If you encounter runtime errors when using the AI Agent API:

1. Check the Flask backend logs for error messages
2. Make sure the AI Agent has been initialized correctly
3. Check that the database connection is working

## Next Steps

To further enhance the integration:

1. Add authentication to the API endpoints
2. Add error handling and validation
3. Add unit tests for the API endpoints
4. Add documentation for the API endpoints using Swagger 