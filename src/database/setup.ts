import { Database } from './connection';

/**
 * Sets up the database with required indexes for the AI Agent implementation.
 */
export async function setupDatabase(db: Database): Promise<void> {
  console.log('Setting up database indexes...');
  
  // Create indexes for business state
  await db.businessStates.createIndex({ businessId: 1 }, { unique: true });
  await db.businessStates.createIndex({ 'profile.industry': 1 });
  await db.businessStates.createIndex({ 'exportJourney.stage': 1 });
  await db.businessStates.createIndex({ lastInteraction: 1 });
  
  // Create indexes for state history
  await db.stateHistory.createIndex({ businessId: 1 });
  await db.stateHistory.createIndex({ timestamp: 1 });
  
  // Create indexes for events
  await db.events.createIndex({ type: 1 });
  await db.events.createIndex({ businessId: 1 });
  await db.events.createIndex({ timestamp: -1 });
  await db.events.createIndex({ priority: 1 });
  
  // Create indexes for notifications
  await db.notifications.createIndex({ businessId: 1 });
  await db.notifications.createIndex({ read: 1 });
  await db.notifications.createIndex({ createdAt: -1 });
  await db.notifications.createIndex({ 'channels': 1 });
  await db.notifications.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  
  // Create indexes for scheduled jobs
  await db.scheduledJobs.createIndex({ jobType: 1 });
  await db.scheduledJobs.createIndex({ nextRunTime: 1 });
  
  // Create indexes for regulatory monitoring
  await db.regulatorySnapshots.createIndex({ timestamp: -1 });
  await db.businessStates.createIndex({ 'profile.products.category': 1 });
  await db.businessStates.createIndex({ 'exportJourney.targetMarkets.country': 1 });
  
  // Create indexes for memory subsystem
  await db.profileChanges.createIndex({ businessId: 1 });
  await db.profileChanges.createIndex({ timestamp: 1 });
  
  await db.exportOutcomes.createIndex({ businessId: 1 });
  await db.exportOutcomes.createIndex({ market: 1 });
  await db.exportOutcomes.createIndex({ 'results.successful': 1 });
  await db.exportOutcomes.createIndex({ 'businessProfile.industry': 1 });
  await db.exportOutcomes.createIndex({ 'businessProfile.size': 1 });
  
  await db.exportPatterns.createIndex({ industryType: 1 });
  await db.exportPatterns.createIndex({ marketRegion: 1 });
  await db.exportPatterns.createIndex({ businessSize: 1 });
  await db.exportPatterns.createIndex({ timestamp: 1 });
  
  await db.marketSelections.createIndex({ businessId: 1 });
  await db.marketSelections.createIndex({ 'profile.industry': 1 });
  await db.marketSelections.createIndex({ selectedMarkets: 1 });
  await db.marketSelections.createIndex({ timestamp: 1 });
  
  // Create indexes for behavior engine
  await db.businessStates.createIndex({ 'exportJourney.opportunities.status': 1 });
  await db.businessStates.createIndex({ 'preferences.autonomySettings.behaviorType': 1 });
  await db.businessStates.createIndex({ 'preferences.autonomySettings.enabled': 1 });
  
  console.log('Database setup complete');
} 