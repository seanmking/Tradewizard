import { Connectors } from '../connectors';
import { LLM } from '../types';
import { registerBusinessAnalysisTools } from './business-analysis';
import { registerRegulatoryTools } from './regulatory';
import { registerMarketIntelligenceTools } from './market-intelligence';
import { registerSqlTools } from './sql';
import { registerReportTools } from './report';
import { registerExportReadinessTools } from './export-readiness';
import { createAnalyzeTariffsTool, createEvaluateMarketAccessTool } from './analyze-tariffs';

export function registerTools(connectors: Connectors, llm: LLM) {
  const tools = [
    ...registerBusinessAnalysisTools(connectors, llm),
    ...registerRegulatoryTools(connectors, llm),
    ...registerMarketIntelligenceTools(connectors, llm),
    ...registerSqlTools(connectors, llm),
    ...registerReportTools(connectors, llm),
    ...registerExportReadinessTools(connectors, llm),
    createAnalyzeTariffsTool(connectors),
    createEvaluateMarketAccessTool(connectors)
  ];
  
  return tools;
}