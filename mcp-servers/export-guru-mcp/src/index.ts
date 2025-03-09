import { startServer } from './server';
import { loadConfig } from './config';

async function main() {
  try {
    // Load configuration
    const config = await loadConfig();
    
    // Start the MCP server
    const server = await startServer(config);
    
    console.log(`Export Guru MCP Server running on port ${config.port}`);
  } catch (error) {
    console.error('Failed to start Export Guru MCP Server:', error);
    process.exit(1);
  }
}

main();