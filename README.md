# TradeWizard AI Agent

TradeWizard is an AI-powered export partner for SMEs, designed to provide proactive guidance and support throughout the export journey. This repository contains the implementation of the AI Agent layer, which is responsible for maintaining context, processing events, and generating personalized recommendations.

## Architecture

The AI Agent layer is built with a modular architecture, consisting of several key components:

### Core Components

- **Agent Core**: The central component that coordinates all subsystems and handles requests.
- **Event System**: Enables event-driven architecture, allowing the agent to respond to changes in the environment.
- **State Manager**: Maintains persistent business context across interactions.
- **Notification Service**: Manages communication with users through various channels.

### Notification Senders

- **Email Sender**: Sends email notifications to users.
- **SMS Sender**: Sends SMS notifications to users.
- **In-App Sender**: Delivers notifications to the user's in-app notification center.

### Database

The AI Agent uses a database to store business states, events, notifications, and other data. The implementation includes:

- **Database Connection**: A mock database implementation for demonstration purposes.
- **Database Setup**: Sets up the necessary indexes for optimal performance.

## State Management

The AI Agent maintains a comprehensive state for each business, including:

- **Business Profile**: Basic information about the business, such as name, industry, and products.
- **Export Journey**: Information about the business's export journey, including target markets and completed steps.
- **User Preferences**: User preferences for notifications and agent autonomy.
- **Business Metrics**: Metrics related to export readiness and compliance.
- **History**: Record of interactions, significant events, and state changes.
- **Temporal Triggers**: Time-based triggers for certifications, regulatory deadlines, and market events.

## Event System

The Event System enables the agent to respond to changes in the environment and trigger appropriate behaviors. Events are categorized into:

- **Business Events**: Events related to business profile updates, assessment completion, etc.
- **Regulatory Events**: Events related to regulatory changes, certification expiration, etc.
- **Market Events**: Events related to market opportunities, tariff changes, etc.
- **Agent Events**: Events related to agent insights, autonomous actions, etc.
- **Notification Events**: Events related to notification creation, reading, and actions.

## Notification System

The Notification System manages communication with users through various channels:

- **In-App Notifications**: Delivered to the user's in-app notification center.
- **Email Notifications**: Sent to the user's email address.
- **SMS Notifications**: Sent to the user's phone number.

Notifications can have different priorities and can include actions that the user can take.

## Usage

To use the AI Agent, you need to:

1. Initialize the database
2. Initialize the agent
3. Send requests to the agent

Example:

```typescript
// Initialize the database
const db = new Database();
await db.connect();

// Initialize the agent
const agent = new Agent(db);
await agent.initialize();

// Send a request to the agent
const response = await agent.handleRequest({
  businessId: 'business-123',
  type: 'GET_RECOMMENDATIONS',
  data: {}
});

console.log(response.data.recommendations);
```

See `src/examples/agent-usage.ts` for a complete example.

## Development

### Prerequisites

- Node.js 14+
- TypeScript 4.5+

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Run the example: `npm run example`

## License

This project is licensed under the MIT License - see the LICENSE file for details.
