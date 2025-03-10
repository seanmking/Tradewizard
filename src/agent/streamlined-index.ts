/**
 * Streamlined AI Agent for TradeWizard 2.0
 * 
 * This module exports the streamlined implementation of the AI Agent layer,
 * focusing on high-value essentials while maintaining alignment with the
 * comprehensive architecture.
 */

// Core components
export { StreamlinedAgentCore } from './streamlined_core';
export { StreamlinedStateManager } from './streamlined-state-manager';
export { StreamlinedEventSystem, EventPriority } from './streamlined-event-system';
export { StreamlinedNotificationService, NotificationChannel } from './streamlined-notification-service';

// Memory subsystem
export { PatternRecognition, PatternType } from './memory/pattern-recognition';

// Behavior engine
export { RegulatoryMonitor } from './behaviors/regulatory-monitor';
export { CertificationMonitor } from './behaviors/certification-monitor';
export { TimelineGenerator, Timeline, TimelineTask } from './behaviors/timeline-generator';
export { MarketReportGenerator } from './behaviors/market-report-generator';

// Types
export {
  StreamlinedBusinessState,
  StreamlinedMarketReport,
  StreamlinedRequirement,
  ActionNotification,
  CoreEventType
} from '../types/streamlined-state'; 