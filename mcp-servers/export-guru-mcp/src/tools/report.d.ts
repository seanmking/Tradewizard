import { Connectors } from '../connectors';
import { LLM, Tool } from '../types';

export function registerReportTools(connectors: Connectors, llm: LLM): Tool[]; 