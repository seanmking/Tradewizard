# TradeWizard AI Agent: Streamlined Implementation

## Overview

TradeWizard AI Agent is a proactive export partner that helps businesses navigate the complexities of international trade. This repository contains a streamlined implementation of the AI Agent, focusing on high-value essentials while maintaining alignment with the comprehensive architecture.

## Key Features

- **Simplified Business State Management**: Track essential business attributes
- **Focused Regulatory Monitoring**: Monitor critical regulatory requirements
- **Streamlined Market Reports**: Clear, concise market intelligence
- **Timeline Generation**: Sequential task planning with dependencies
- **Certification Monitoring**: Track expiration of essential documents
- **Action-Oriented Notifications**: Clear next steps for users

## Architecture

The streamlined AI Agent maintains the six key components from the comprehensive architecture:

1. **Agent Core**: Simplified orchestration focusing on essential business workflows
2. **State Manager**: Minimalist state tracking for critical business attributes
3. **Event System**: Focused event processing for regulatory and certification events
4. **Memory Subsystem**: Basic pattern recognition for industry-specific guidance
5. **Behavior Engine**: Prioritized monitoring of essential regulatory requirements
6. **Notification Service**: Action-oriented notifications with clear next steps

## Implementation Phases

The implementation is divided into three phases:

### Phase 1: Essential State & Regulatory Foundation (8 weeks)

- Basic State Manager
- Simplified Regulatory Monitor
- Timeline Generator

### Phase 2: Market Intelligence & Proactive Guidance (8 weeks)

- Streamlined Market Reports
- Certification Monitor
- Action Sequencer

### Phase 3: Learning & Optimization (6 weeks)

- Simple Pattern Recognition
- Agent Dashboard
- Feedback Collection

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- TypeScript (v4.5 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/tradewizard-ai-agent.git
   cd tradewizard-ai-agent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

### Running the Example

The repository includes a complete example application that demonstrates how to use the AI Agent:

```bash
./run-streamlined-example.sh
```

This will:
1. Compile the TypeScript code
2. Run the example application
3. Show the output of various AI Agent operations

### Web Server Integration

The AI Agent can be integrated with the existing Flask web server. To do this:

1. Install the AI Agent:
   ```bash
   ./install-aiagent.sh
   ```

2. Start the web server:
   ```bash
   ./start.sh
   ```

3. Access the AI Agent API at:
   - `POST /api/aiagent/assessment`
   - `POST /api/aiagent/market-report`
   - `POST /api/aiagent/timeline`
   - And more...

For detailed instructions on integrating with the web server, see [INTEGRATION.md](INTEGRATION.md).

## Documentation

- [Implementation Summary](IMPLEMENTATION.md): Detailed overview of the implementation
- [Integration Guide](INTEGRATION.md): Guide to integrating with the web server
- [Streamlined Instructions](aiagent-instructions-streamlined.md): Original streamlined implementation instructions
- [Source Code Documentation](src/README.md): Documentation of the source code

## Project Structure

```
├── IMPLEMENTATION.md           # Implementation summary
├── INTEGRATION.md              # Web server integration guide
├── README-STREAMLINED.md       # This file
├── aiagent-instructions-streamlined.md  # Original instructions
├── install-aiagent.sh          # Script to install the AI Agent
├── run-streamlined-example.sh  # Script to run the example
├── tsconfig.json               # TypeScript configuration
└── src/                        # Source code
    ├── README.md               # Source code documentation
    ├── agent/                  # AI Agent components
    │   ├── behaviors/          # Behavior engine components
    │   ├── memory/             # Memory subsystem components
    │   ├── notification-senders/ # Notification senders
    │   ├── streamlined_core.ts # Agent core
    │   ├── streamlined-event-system.ts # Event system
    │   ├── streamlined-index.ts # Export index
    │   ├── streamlined-notification-service.ts # Notification service
    │   └── streamlined-state-manager.ts # State manager
    ├── database/               # Database connection
    ├── examples/               # Example applications
    └── types/                  # TypeScript type definitions
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- TradeWizard team for the comprehensive architecture
- All contributors to the project 