#!/usr/bin/env node

/**
 * Test Script
 * 
 * This script runs tests for the Export Guru MCP.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  testDir: path.resolve(__dirname, '../tests'),
  srcDir: path.resolve(__dirname, '../src'),
  coverage: true,
  watch: process.argv.includes('--watch')
};

// Check if tests directory exists
if (!fs.existsSync(config.testDir)) {
  console.error('Tests directory does not exist. Creating it...');
  fs.mkdirSync(config.testDir, { recursive: true });
  
  // Create subdirectories
  ['unit', 'integration', 'performance', 'accuracy'].forEach(dir => {
    fs.mkdirSync(path.join(config.testDir, dir), { recursive: true });
  });
  
  // Create a sample test
  const sampleTest = `
import { expect } from 'chai';

describe('Sample Test', () => {
  it('should pass', () => {
    expect(true).to.be.true;
  });
});
`;
  
  fs.writeFileSync(path.join(config.testDir, 'unit/sample.test.ts'), sampleTest);
  
  console.log('Created sample test file at tests/unit/sample.test.ts');
}

// Run tests
console.log('Running tests...');

try {
  // Determine test command
  let testCommand = 'mocha';
  
  // Add TypeScript support
  testCommand += ' -r ts-node/register';
  
  // Add test pattern
  testCommand += ' "tests/**/*.test.ts"';
  
  // Add coverage if enabled
  if (config.coverage) {
    testCommand = `nyc --reporter=lcov --reporter=text ${testCommand}`;
  }
  
  // Add watch mode if enabled
  if (config.watch) {
    testCommand += ' --watch';
  }
  
  // Run the command
  execSync(testCommand, { stdio: 'inherit' });
  
  console.log('Tests completed successfully!');
} catch (error) {
  console.error('Tests failed:', error.message);
  process.exit(1);
}

// Run linting
console.log('Running linting...');

try {
  execSync('eslint "src/**/*.ts"', { stdio: 'inherit' });
  console.log('Linting completed successfully!');
} catch (error) {
  console.error('Linting failed:', error.message);
  process.exit(1);
} 