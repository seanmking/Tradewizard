import axios from 'axios';
import { LLM, OllamaConfig } from '../types';

interface OllamaResponse {
  response: string;
  [key: string]: any;
}

export function setupOllama(config: OllamaConfig): LLM {
  // Check if Ollama is available
  axios.get(`${config.endpoint}/api/tags`)
    .then(() => {
      console.log(`Connected to Ollama at ${config.endpoint}`);
    })
    .catch((error) => {
      console.warn(`Warning: Could not connect to Ollama at ${config.endpoint}`);
      console.warn('LLM functionality may be limited');
    });
  
  // Create LLM interface
  const llm: LLM = {
    complete: async (options) => {
      try {
        const response = await axios.post<OllamaResponse>(`${config.endpoint}/api/generate`, {
          model: config.model,
          prompt: options.prompt,
          options: {
            temperature: options.temperature || config.parameters.temperature,
            top_p: options.top_p || config.parameters.top_p,
            num_predict: options.max_tokens || 500
          },
          stream: false
        });
        
        return response.data.response;
      } catch (error) {
        console.error('Error calling Ollama:', error);
        if (error instanceof Error) {
          throw new Error(`Failed to complete LLM request: ${error.message}`);
        }
        throw new Error('Failed to complete LLM request: Unknown error');
      }
    }
  };
  
  return llm;
}