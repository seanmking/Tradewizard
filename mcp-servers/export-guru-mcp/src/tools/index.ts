import { Connectors } from '../connectors';
import { LLM } from '../types';
import { registerBusinessAnalysisTools } from './business-analysis';
import { registerRegulatoryTools } from './regulatory';
import { registerMarketIntelligenceTools } from './market-intelligence';
import { registerSqlTools } from './sql';
import { registerReportTools } from './report';

export function registerTools(connectors: Connectors, llm: LLM) {
  const tools = [
    ...registerBusinessAnalysisTools(connectors, llm),
    ...registerRegulatoryTools(connectors, llm),
    ...registerMarketIntelligenceTools(connectors, llm),
    ...registerSqlTools(connectors, llm),
    ...registerReportTools(connectors, llm)
  ];
  
  return tools;
}