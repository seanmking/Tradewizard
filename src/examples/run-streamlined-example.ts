/**
 * Run Streamlined Example
 * 
 * This script runs the streamlined AI Agent example.
 */

import runExample from './streamlined-example';

console.log('Starting streamlined example...');

runExample().catch(error => {
  console.error('Error running example:', error);
}); 