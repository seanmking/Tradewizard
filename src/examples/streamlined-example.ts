/**
 * Streamlined AI Agent Example Application
 * 
 * This example demonstrates how to use the streamlined AI Agent to:
 * 1. Initialize the agent
 * 2. Update a business profile
 * 3. Select a target market
 * 4. Get a market report
 * 5. Generate a timeline
 * 6. Handle notifications
 */

import { Database } from '../database/connection';
import { StreamlinedAgentCore } from '../agent/streamlined-core';
import { 
  StreamlinedBusinessState, 
  StreamlinedMarketReport,
  ActionNotification
} from '../types/streamlined-state';
import { Timeline, TimelineTask } from '../agent/behaviors/timeline-generator';

/**
 * Runs the streamlined AI Agent example.
 */
export default async function runExample() {
  console.log('Starting Streamlined AI Agent Example...');
  
  // Initialize the database
  const db = new Database();
  await db.connect();
  
  // Initialize the agent core
  const agentCore = new StreamlinedAgentCore(db);
  await agentCore.initialize();
  
  // Create a business ID for this example
  const businessId = `business-${Math.random().toString(36).substring(2, 8)}`;
  console.log(`Created business ID: ${businessId}`);
  
  // Step 1: Update business profile
  console.log('\n--- Step 1: Update Business Profile ---');
  const profileResponse = await agentCore.handleRequest({
    businessId,
    type: 'UPDATE_BUSINESS_PROFILE',
    data: {
      name: 'Example Export Company',
      industry: 'Food & Beverage',
      size: 'MEDIUM',
      products: [
        {
          id: 'prod-1',
          name: 'Organic Fruit Juice',
          category: 'Beverages'
        },
        {
          id: 'prod-2',
          name: 'Dried Fruits',
          category: 'Snacks'
        }
      ]
    }
  });
  
  console.log(`Profile update result: ${profileResponse.success ? 'Success' : 'Failed'}`);
  if (profileResponse.message) {
    console.log(`Message: ${profileResponse.message}`);
  }
  
  // Step 2: Get business state
  console.log('\n--- Step 2: Get Business State ---');
  const stateResponse = await agentCore.handleRequest({
    businessId,
    type: 'GET_BUSINESS_STATE',
    data: {}
  });
  
  if (stateResponse.success) {
    const state = stateResponse.data as StreamlinedBusinessState;
    console.log(`Business Name: ${state.profile.name}`);
    console.log(`Industry: ${state.profile.industry}`);
    console.log(`Products: ${state.profile.products.map(p => p.name).join(', ')}`);
  }
  
  // Step 3: Select target market
  console.log('\n--- Step 3: Select Target Market ---');
  const marketResponse = await agentCore.handleRequest({
    businessId,
    type: 'SELECT_TARGET_MARKET',
    data: {
      country: 'Germany'
    }
  });
  
  console.log(`Market selection result: ${marketResponse.success ? 'Success' : 'Failed'}`);
  if (marketResponse.message) {
    console.log(`Message: ${marketResponse.message}`);
  }
  
  // Step 4: Get market report
  console.log('\n--- Step 4: Get Market Report ---');
  const reportResponse = await agentCore.handleRequest({
    businessId,
    type: 'GET_MARKET_REPORT',
    data: {
      country: 'Germany'
    }
  });
  
  if (reportResponse.success && reportResponse.data) {
    const report = reportResponse.data as StreamlinedMarketReport;
    console.log(`Market Report for ${report.country}:`);
    console.log(`- Market Size: $${report.marketSize} million`);
    console.log(`- Growth Rate: ${report.growthRate.toFixed(1)}%`);
    console.log(`- Competitive Category: ${report.competitiveCategory}`);
    console.log(`- Tariff Percentage: ${report.tariffPercentage.toFixed(1)}%`);
    console.log('- Entry Requirements:');
    report.entryRequirements.forEach((req: string) => console.log(`  * ${req}`));
  }
  
  // Step 5: Get timeline
  console.log('\n--- Step 5: Get Timeline ---');
  const timelineResponse = await agentCore.handleRequest({
    businessId,
    type: 'GET_TIMELINE',
    data: {
      country: 'Germany'
    }
  });
  
  if (timelineResponse.success && timelineResponse.data) {
    const timeline = timelineResponse.data as Timeline;
    console.log(`Timeline for ${timeline.market}:`);
    console.log(`- Progress: ${(timeline.progress * 100).toFixed(0)}%`);
    console.log('- Tasks:');
    
    // Sort tasks by start date
    const sortedTasks = [...timeline.tasks].sort(
      (a: TimelineTask, b: TimelineTask) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    
    sortedTasks.forEach((task: TimelineTask) => {
      console.log(`  * ${task.name} (${task.status})`);
      console.log(`    Start: ${new Date(task.startDate).toLocaleDateString()}`);
      console.log(`    End: ${new Date(task.endDate).toLocaleDateString()}`);
      console.log(`    Cost: ${task.estimatedCost.amount} ${task.estimatedCost.currency}`);
    });
  }
  
  // Step 6: Get notifications
  console.log('\n--- Step 6: Get Notifications ---');
  const notificationsResponse = await agentCore.handleRequest({
    businessId,
    type: 'GET_NOTIFICATIONS',
    data: {}
  });
  
  if (notificationsResponse.success && notificationsResponse.data) {
    const notifications = notificationsResponse.data as ActionNotification[];
    console.log(`Found ${notifications.length} notifications:`);
    
    notifications.forEach((notification: ActionNotification) => {
      console.log(`- ${notification.title} (${notification.priority})`);
      console.log(`  ${notification.message}`);
      console.log('  Actions:');
      notification.actions.forEach((action: { label: string; action: string }) => {
        console.log(`  * ${action.label} (${action.action})`);
      });
      
      // Mark notification as read
      agentCore.handleRequest({
        businessId,
        type: 'MARK_NOTIFICATION_READ',
        data: {
          notificationId: notification.id
        }
      });
    });
  }
  
  // Step 7: Compare markets
  console.log('\n--- Step 7: Compare Markets ---');
  const compareResponse = await agentCore.handleRequest({
    businessId,
    type: 'COMPARE_MARKETS',
    data: {
      countries: ['Germany', 'France', 'United Kingdom']
    }
  });
  
  if (compareResponse.success && compareResponse.data) {
    const reports = compareResponse.data as StreamlinedMarketReport[];
    console.log('Market Comparison:');
    
    // Create a comparison table
    console.log('| Country | Market Size | Growth Rate | Competitive Category | Tariff % |');
    console.log('|---------|-------------|-------------|----------------------|----------|');
    
    reports.forEach((report: StreamlinedMarketReport) => {
      console.log(
        `| ${report.country} | $${report.marketSize}M | ${report.growthRate.toFixed(1)}% | ` +
        `${report.competitiveCategory} | ${report.tariffPercentage.toFixed(1)}% |`
      );
    });
  }
  
  // Step 8: Run certification monitor
  console.log('\n--- Step 8: Run Certification Monitor ---');
  await agentCore.runCertificationMonitor();
  console.log('Certification monitor completed');
  
  // Disconnect from database
  await db.disconnect();
  console.log('\nStreamlined AI Agent Example completed successfully');
  
  return {
    success: true,
    message: 'Example completed successfully'
  };
}

// If this file is run directly, run the example
if (require.main === module) {
  runExample().catch(error => {
    console.error('Error running example:', error);
  });
} 