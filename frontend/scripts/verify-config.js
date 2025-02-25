import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function checkViteConfig() {
  const viteConfigPath = path.join(dirname(__dirname), 'vite.config.js');
  const viteConfig = await fs.promises.readFile(viteConfigPath, 'utf8');

  const checks = {
    proxyTarget: viteConfig.includes('target: \'http://localhost:5001\''),
    frontendPort: viteConfig.includes('port: 3000'),
    proxyConfig: viteConfig.includes('\'/api\': {'),
  };

  console.log(chalk.blue('\nChecking Vite Configuration:'));
  console.log(`Frontend Port (3000): ${checks.frontendPort ? '✅' : '❌'}`);
  console.log(`Proxy Target (5001): ${checks.proxyTarget ? '✅' : '❌'}`);
  console.log(`API Proxy Config: ${checks.proxyConfig ? '✅' : '❌'}`);

  return Object.values(checks).every(Boolean);
}

async function checkApiConfig() {
  const apiConfigPath = path.join(dirname(__dirname), 'src', 'services', 'api.js');
  const apiConfig = await fs.promises.readFile(apiConfigPath, 'utf8');

  const checks = {
    baseUrl: apiConfig.includes('const API_URL = \'/api\''),
    mockFallback: apiConfig.includes('Creating mock session'),
    errorHandling: apiConfig.includes('validateStatus:'),
  };

  console.log(chalk.blue('\nChecking API Configuration:'));
  console.log(`Base URL (/api): ${checks.baseUrl ? '✅' : '❌'}`);
  console.log(`Mock Fallback: ${checks.mockFallback ? '✅' : '❌'}`);
  console.log(`Error Handling: ${checks.errorHandling ? '✅' : '❌'}`);

  return Object.values(checks).every(Boolean);
}

async function checkBackendConfig() {
  const appPath = path.join(dirname(__dirname), '..', 'backend', 'app.py');
  const app = await fs.promises.readFile(appPath, 'utf8');

  const checks = {
    port: app.includes('port=5001'),
    corsConfig: app.includes('CORS('),
  };

  console.log(chalk.blue('\nChecking Backend Configuration:'));
  console.log(`Backend Port (5001): ${checks.port ? '✅' : '❌'}`);
  console.log(`CORS Config: ${checks.corsConfig ? '✅' : '❌'}`);

  return Object.values(checks).every(Boolean);
}

async function main() {
  console.log(chalk.yellow('Running Configuration Verification...'));
  
  try {
    const results = {
      vite: await checkViteConfig(),
      api: await checkApiConfig(),
      backend: await checkBackendConfig(),
    };

    const allPassed = Object.values(results).every(Boolean);

    if (allPassed) {
      console.log(chalk.green('\n✅ All configurations are correct!'));
    } else {
      console.log(chalk.red('\n❌ Some configurations need attention!'));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('\n❌ Error during verification:'), error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  process.exit(1);
});
