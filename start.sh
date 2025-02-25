#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting TradeKing Verification Portal...${NC}\n"

# Function to check if command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed${NC}"
        return 1
    fi
    return 0
}

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -i :$port > /dev/null 2>&1; then
        echo -e "${RED}Port $port is in use. Attempting to free it...${NC}"
        lsof -ti :$port | xargs kill -9 2>/dev/null
        sleep 2
    fi
}

# Check for required commands
echo -e "${BLUE}Checking dependencies...${NC}"
check_command node || { echo -e "${RED}Please install Node.js${NC}"; exit 1; }
check_command npm || { echo -e "${RED}Please install npm${NC}"; exit 1; }
check_command python3 || { echo -e "${RED}Please install Python 3${NC}"; exit 1; }

# Enhanced cleanup of existing processes
echo -e "${BLUE}Cleaning up existing processes...${NC}"
# Kill Node processes for frontend
pkill -9 -f "node.*vite" 2>/dev/null
pkill -9 -f "npm.*run dev" 2>/dev/null
# Kill Python processes for backend
pkill -f "python.*app.py" 2>/dev/null
# Check and free required ports
check_port 3000  # Frontend port
check_port 5001  # Backend port
# Remove any leftover PID files
rm -f .frontend_pid .backend_pid 2>/dev/null
sleep 2

# Setup frontend verification
echo -e "${BLUE}Setting up configuration verification...${NC}"
cd frontend || { echo -e "${RED}Error: frontend directory not found${NC}"; exit 1; }

# Create scripts directory if it doesn't exist
mkdir -p scripts

# Create verify-config.js
cat > scripts/verify-config.js << 'EOL'
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
EOL

# Create package.json if it doesn't exist
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}Creating package.json...${NC}"
    cat > package.json << EOL
{
  "name": "tradekingfrontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
EOL
fi

# Install dependencies and run verification
npm install chalk --save-dev
node scripts/verify-config.js || {
    echo -e "${RED}Configuration verification failed. Please check the errors above.${NC}"
    exit 1
}
cd ..

# Start backend
echo -e "${BLUE}Starting backend server...${NC}"
cd backend || { echo -e "${RED}Error: backend directory not found${NC}"; exit 1; }
python3 app.py &
BACKEND_PID=$!
echo -e "${GREEN}Backend started with PID: $BACKEND_PID${NC}"
echo $BACKEND_PID > .backend_pid
cd ..

# Setup frontend
echo -e "${BLUE}Setting up frontend environment...${NC}"
cd frontend || { echo -e "${RED}Error: frontend directory not found${NC}"; exit 1; }

# Create .env.development if it doesn't exist
if [ ! -f ".env.development" ]; then
    echo -e "${YELLOW}Creating development environment configuration...${NC}"
    cat > .env.development << EOL
VITE_API_URL=http://localhost:5001/api
VITE_USE_MOCK=true
VITE_ENV=development
REACT_APP_USE_MOCK_VALIDATION=true
REACT_APP_ENABLE_INDUSTRY_FILTERS=true
REACT_APP_USE_REAL_TIME_VALIDATION=true
EOL
fi

# Create window.__env object for runtime configuration
echo -e "${YELLOW}Creating runtime environment configuration...${NC}"
mkdir -p public
cat > public/env-config.js << EOL
window.__env = {
  REACT_APP_USE_MOCK_VALIDATION: 'true',
  REACT_APP_ENABLE_INDUSTRY_FILTERS: 'true',
  REACT_APP_USE_REAL_TIME_VALIDATION: 'true'
};
EOL

# Install npm dependencies if needed
if [ -f "package.json" ]; then
    echo -e "${BLUE}Installing npm dependencies...${NC}"
    npm install || { echo -e "${RED}Failed to install npm dependencies${NC}"; exit 1; }
fi

# Start frontend
echo -e "${BLUE}Starting frontend development server...${NC}"
PORT=3000 npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}Frontend started with PID: $FRONTEND_PID${NC}"
echo $FRONTEND_PID > .frontend_pid
cd ..

# Trap SIGINT and SIGTERM signals to properly cleanup
cleanup() {
    echo -e "\n${BLUE}Shutting down services...${NC}"
    kill -9 $FRONTEND_PID 2>/dev/null
    kill -9 $BACKEND_PID 2>/dev/null
    rm -f .frontend_pid .backend_pid 2>/dev/null
    # Additional cleanup
    pkill -9 -f "node.*vite" 2>/dev/null
    pkill -9 -f "npm.*run dev" 2>/dev/null
    pkill -f "python.*app.py" 2>/dev/null
    echo -e "${GREEN}All services stopped${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

echo -e "\n${GREEN}Verification Portal is ready!${NC}"
echo -e "${BLUE}Frontend: http://localhost:3000${NC}"
echo -e "${BLUE}Backend: http://localhost:5001${NC}"
echo -e "${YELLOW}Running in MOCK mode with the following test data:${NC}"
echo -e "${GREEN}Business Registration: 2023/123456/07${NC}"
echo -e "${GREEN}Tax Number: 9876543210${NC}"
echo -e "${GREEN}Company Name: Test Company (Pty) Ltd${NC}"
echo -e "${GREEN}Entity Type: PTY_LTD${NC}"
echo -e "${BLUE}Press Ctrl+C to stop all services${NC}\n"

# Keep script running and show logs
wait 