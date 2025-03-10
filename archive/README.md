# Archived Files

This directory contains files that were part of the initial development of TradeWizard but are no longer actively used in the main codebase. These files are kept for reference purposes.

## Mock Implementations
- `mock-server.js` - Original mock server implementation before MCP integration
- `src/agent/notification-senders/`
  - `email-sender.ts` - Mock email notification implementation
  - `sms-sender.ts` - Mock SMS notification implementation
  - `in-app-sender.ts` - Mock in-app notification implementation

## Development Tools
- `start-debug.sh` - Debug version of the start script (uses mock server)
- `frontend_debug.log` - Frontend debug logs

## Frontend Components with Mock Data
- `tradewizard/frontend/src/components/Dashboard/SetupScreens/ExportTimeline.tsx` - Timeline component using mock data
- `tradewizard/frontend/src/components/ExportReadinessReport.tsx` - Export readiness report using mock data
- `tradewizard/frontend/src/utils/cache-test.js` - Cache testing utility

## Note
These files were archived on the transition to using the MCP (Mission Control Panel) for real data handling. If you need to reference any mock implementations or testing utilities, you can find them here with their original directory structure preserved. 