import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection pools
let memoryDbPool: Pool | null = null;

/**
 * Get a database connection pool for the memory database
 * @returns Database connection pool
 */
export function getDb(): Pool {
  if (!memoryDbPool) {
    memoryDbPool = new Pool({
      connectionString: process.env.MEMORY_DB_URL || 'postgresql://seanking@localhost:5432/memory_db'
    });
    
    // Log connection status
    memoryDbPool.on('connect', () => {
      console.log('Connected to memory database');
    });
    
    memoryDbPool.on('error', (err) => {
      console.error('Memory database connection error:', err);
    });
  }
  
  return memoryDbPool;
}

/**
 * Close all database connections
 */
export async function closeDb(): Promise<void> {
  if (memoryDbPool) {
    await memoryDbPool.end();
    memoryDbPool = null;
  }
} 