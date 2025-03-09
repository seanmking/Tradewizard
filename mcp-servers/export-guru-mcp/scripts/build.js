#!/usr/bin/env node

/**
 * Build Script
 * 
 * This script builds the Export Guru MCP for production.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  srcDir: path.resolve(__dirname, '../src'),
  distDir: path.resolve(__dirname, '../dist'),
  tsconfig: path.resolve(__dirname, '../tsconfig.json')
};

// Ensure the dist directory exists
if (!fs.existsSync(config.distDir)) {
  fs.mkdirSync(config.distDir, { recursive: true });
}

// Clean the dist directory
console.log('Cleaning dist directory...');
fs.readdirSync(config.distDir).forEach(file => {
  const filePath = path.join(config.distDir, file);
  if (fs.lstatSync(filePath).isDirectory()) {
    fs.rmSync(filePath, { recursive: true, force: true });
  } else {
    fs.unlinkSync(filePath);
  }
});

// Run TypeScript compiler
console.log('Compiling TypeScript...');
try {
  execSync(`tsc --project ${config.tsconfig}`, { stdio: 'inherit' });
} catch (error) {
  console.error('TypeScript compilation failed:', error.message);
  process.exit(1);
}

// Copy non-TypeScript files
console.log('Copying non-TypeScript files...');
const copyFiles = (dir, targetDir) => {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  fs.readdirSync(dir).forEach(file => {
    const sourcePath = path.join(dir, file);
    const targetPath = path.join(targetDir, file);
    
    if (fs.lstatSync(sourcePath).isDirectory()) {
      copyFiles(sourcePath, targetPath);
    } else if (!file.endsWith('.ts') && !file.endsWith('.tsx')) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
};

copyFiles(config.srcDir, config.distDir);

// Copy package.json and update it
console.log('Updating package.json...');
const packageJson = require('../package.json');
const distPackageJson = { ...packageJson };

// Remove development dependencies
delete distPackageJson.devDependencies;

// Update scripts
distPackageJson.scripts = {
  start: 'node index.js'
};

// Write the updated package.json
fs.writeFileSync(
  path.join(config.distDir, 'package.json'),
  JSON.stringify(distPackageJson, null, 2)
);

// Copy README.md
console.log('Copying README.md...');
fs.copyFileSync(
  path.resolve(__dirname, '../README.md'),
  path.join(config.distDir, 'README.md')
);

console.log('Build completed successfully!'); 