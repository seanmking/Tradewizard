#!/usr/bin/env node

/**
 * Deploy Script
 * 
 * This script deploys the Export Guru MCP to a production environment.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  distDir: path.resolve(__dirname, '../dist'),
  environment: process.argv[2] || 'development',
  validEnvironments: ['development', 'staging', 'production']
};

// Validate environment
if (!config.validEnvironments.includes(config.environment)) {
  console.error(`Invalid environment: ${config.environment}`);
  console.error(`Valid environments: ${config.validEnvironments.join(', ')}`);
  process.exit(1);
}

// Check if dist directory exists
if (!fs.existsSync(config.distDir)) {
  console.error('Dist directory does not exist. Run build script first.');
  process.exit(1);
}

// Run build if needed
console.log('Ensuring build is up to date...');
try {
  execSync('node scripts/build.js', { stdio: 'inherit' });
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

// Deploy based on environment
console.log(`Deploying to ${config.environment}...`);

try {
  switch (config.environment) {
    case 'development':
      // For development, we just copy to a local directory
      execSync('mkdir -p ../deploy/development', { stdio: 'inherit' });
      execSync('cp -r dist/* ../deploy/development/', { stdio: 'inherit' });
      break;
      
    case 'staging':
      // For staging, we might deploy to a staging server
      console.log('Deploying to staging server...');
      // This would typically use scp, rsync, or a deployment tool
      // execSync('scp -r dist/* user@staging-server:/path/to/deployment', { stdio: 'inherit' });
      console.log('Note: Staging deployment is configured as a placeholder. Update with actual deployment commands.');
      break;
      
    case 'production':
      // For production, we might deploy to a production server or container registry
      console.log('Deploying to production...');
      // This would typically use a deployment tool or container registry
      // execSync('docker build -t export-guru-mcp:latest .', { stdio: 'inherit' });
      // execSync('docker push export-guru-mcp:latest', { stdio: 'inherit' });
      console.log('Note: Production deployment is configured as a placeholder. Update with actual deployment commands.');
      break;
  }
  
  console.log(`Deployment to ${config.environment} completed successfully!`);
} catch (error) {
  console.error(`Deployment to ${config.environment} failed:`, error.message);
  process.exit(1);
}

// Post-deployment tasks
console.log('Running post-deployment tasks...');

try {
  // Example: Update version file
  const packageJson = require('../package.json');
  const versionInfo = {
    version: packageJson.version,
    environment: config.environment,
    deployedAt: new Date().toISOString()
  };
  
  // Create deploy directory if it doesn't exist
  if (!fs.existsSync('../deploy')) {
    fs.mkdirSync('../deploy', { recursive: true });
  }
  
  // Write version info
  fs.writeFileSync(
    path.resolve(__dirname, `../deploy/${config.environment}-version.json`),
    JSON.stringify(versionInfo, null, 2)
  );
  
  console.log('Post-deployment tasks completed successfully!');
} catch (error) {
  console.error('Post-deployment tasks failed:', error.message);
  // Don't exit with error for post-deployment tasks
} 