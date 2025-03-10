import { Connectors } from '../connectors';
import { LLM, Tool } from '../types';
import { registerRegulatoryTools } from './regulatory';
import { registerRegulatoryComplianceTools } from './regulatory-compliance';
import { registerComplianceChecklistTools } from './compliance-checklist';
import { registerMarketIntelligenceTools } from './market-intelligence';
import { registerExportReadinessTools } from './export-readiness';
import { registerSqlTools } from './sql';
import { registerReportTools } from './report';
import { createAnalyzeTariffsTool, createEvaluateMarketAccessTool } from './analyze-tariffs';
import { registerBusinessAnalysisTools } from './business-analysis';
import { registerComplianceCostTools } from './compliance-cost';
import { registerAssessmentIntegrationTools } from './assessment-integration';
import { registerBusinessProfileTrackerTools } from './business-profile-tracker';

/**
 * Register all tools
 */
export function registerTools(connectors: Connectors, llm: LLM): Tool[] {
  return [
    ...registerRegulatoryTools(connectors, llm),
    ...registerRegulatoryComplianceTools(connectors, llm),
    ...registerComplianceChecklistTools(connectors, llm),
    ...registerMarketIntelligenceTools(connectors, llm),
    ...registerExportReadinessTools(connectors, llm),
    ...registerSqlTools(connectors, llm),
    ...registerReportTools(connectors, llm),
    ...registerBusinessAnalysisTools(connectors, llm),
    ...registerComplianceCostTools(connectors, llm),
    ...registerAssessmentIntegrationTools(connectors, llm),
    ...registerBusinessProfileTrackerTools(connectors, llm),
    createAnalyzeTariffsTool(connectors),
    createEvaluateMarketAccessTool(connectors)
  ];
}