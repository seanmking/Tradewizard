import { Database } from '../database/connection';
import { setupDatabase } from '../database/setup';
import { Agent, AgentRequest } from '../agent';
import { EventType, EventPriority } from '../agent/event-system';

/**
 * Example of how to use the AI Agent.
 */
async function main() {
  console.log('Starting TradeWizard AI Agent example...');
  
  // Initialize the database
  const db = new Database();
  await db.connect();
  console.log('Connected to database');
  
  // Setup database indexes
  await setupDatabase(db);
  console.log('Database setup complete');
  
  // Initialize the agent
  const agent = new Agent(db);
  await agent.initialize();
  console.log('Agent initialized');
  
  // Get references to agent components
  const stateManager = agent.getStateManager();
  const eventSystem = agent.getEventSystem();
  const notificationService = agent.getNotificationService();
  
  // Create a business ID for our example
  const businessId = 'business-' + Math.random().toString(36).substring(2, 9);
  console.log(`Using business ID: ${businessId}`);
  
  // Create an initial business state
  const initialState = await stateManager.createEmptyBusinessState(businessId);
  console.log('Created initial business state');
  
  // Update the business profile
  await agent.handleRequest({
    businessId,
    type: 'UPDATE_BUSINESS_PROFILE',
    data: {
      profile: {
        name: 'Acme Widgets',
        website: 'https://acmewidgets.com',
        industry: 'Manufacturing',
        size: 'MEDIUM',
        exportExperience: 'BEGINNER',
        products: [
          {
            id: 'prod-1',
            name: 'Premium Widget',
            category: 'Industrial Tools',
            description: 'High-quality industrial widget for manufacturing applications',
            created: new Date()
          }
        ]
      }
    }
  });
  console.log('Updated business profile');
  
  // Complete an assessment
  await agent.handleRequest({
    businessId,
    type: 'COMPLETE_ASSESSMENT',
    data: {
      results: {
        overallScore: 72,
        readinessScore: 68,
        complianceScore: 75,
        marketFitScore: 80,
        recommendations: [
          'Consider obtaining ISO 9001 certification',
          'Research Canadian market regulations',
          'Develop an export pricing strategy'
        ]
      }
    }
  });
  console.log('Completed assessment');
  
  // Manually publish a market opportunity event
  await eventSystem.publish({
    type: EventType.MARKET_OPPORTUNITY_DETECTED,
    businessId,
    source: 'market-analysis',
    priority: EventPriority.MEDIUM,
    payload: {
      market: 'Canada',
      product: 'Premium Widget',
      score: 0.85,
      reasons: [
        'Similar regulatory environment to home market',
        'Strong demand for industrial tools',
        'Favorable trade agreement in place',
        'Low language and cultural barriers'
      ],
      detectedAt: new Date(),
      status: 'NEW'
    }
  });
  console.log('Published market opportunity event');
  
  // Get business state
  const response = await agent.handleRequest({
    businessId,
    type: 'GET_BUSINESS_STATE',
    data: {}
  });
  
  console.log('\nCurrent Business State:');
  console.log(JSON.stringify(response.data.businessState, null, 2));
  
  // Get recommendations
  const recommendationsResponse = await agent.handleRequest({
    businessId,
    type: 'GET_RECOMMENDATIONS',
    data: {}
  });
  
  console.log('\nRecommendations:');
  console.log(JSON.stringify(recommendationsResponse.data.recommendations, null, 2));
  
  // Get notifications
  const notificationsResponse = await agent.handleRequest({
    businessId,
    type: 'GET_NOTIFICATIONS',
    data: { unreadOnly: true }
  });
  
  console.log('\nNotifications:');
  console.log(JSON.stringify(notificationsResponse.data.notifications, null, 2));
  
  // Disconnect from database
  await db.disconnect();
  console.log('Disconnected from database');
  
  console.log('\nExample complete!');
}

// Run the example
main().catch(error => {
  console.error('Error running example:', error);
  process.exit(1);
}); 