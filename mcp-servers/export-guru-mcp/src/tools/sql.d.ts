import { Connectors } from '../connectors';
import { LLM, Tool } from '../types';

export function registerSqlTools(connectors: Connectors, llm: LLM): Tool[]; 