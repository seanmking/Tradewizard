# TradeWizard Export Assessment

TradeWizard is a conversational platform designed to help South African businesses assess their readiness for exporting products to international markets. It provides personalized guidance and actionable insights to help businesses navigate the complexities of international trade.

## Key Features

- Conversational assessment interface with natural language processing
- Intelligent extraction of business information
- Stage-based assessment flow covering key export readiness areas
- Progress tracking and reporting
- Personalized guidance and recommendations

## Project Structure

The project is organized into backend and frontend components:

```
TradeWizard/
├── archive/                  # Previous implementation (for reference)
│   └── old_version/
├── tradewizard/                      # Current implementation
│   ├── backend/              # Python Flask API
│   │   ├── app.py            # Main Flask application
│   │   ├── requirements.txt  # Python dependencies
│   │   ├── services/         # Core services
│   │   └── mock_data/        # Mock data for testing
│   └── frontend/             # React frontend
│       └── src/              # React source code
└── start.sh                  # Start script
```

## Getting Started

### Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- npm or yarn

### Running the Application

The easiest way to run the application is using the start script:

```bash
# Make the script executable (Unix-like systems)
chmod +x start.sh

# Run the application
./start.sh
```

This script will:
1. Set up the Python virtual environment
2. Install backend dependencies
3. Start the Flask backend server
4. Install frontend dependencies (if needed)
5. Start the React development server

### Manual Setup

If you prefer to set up the application manually:

#### Backend Setup

```bash
# Navigate to the backend directory
cd tradewizard/backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows
venv\Scripts\activate
# Unix/MacOS
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the backend
python app.py
```

#### Frontend Setup

```bash
# Navigate to the frontend directory
cd tradewizard/frontend

# Install dependencies
npm install

# Start the development server
npm start
```

## API Endpoints

The backend provides the following API endpoints:

- `POST /api/chat/start` - Start a new chat session
- `POST /api/chat/message` - Send a message in a chat session
- `GET /api/chat/history/{chat_id}` - Get the history of a chat session
- `GET /api/health` - Health check endpoint 

## Development and Showcase Workflows

TradeWizard uses Git branches to maintain a stable showcase version alongside ongoing development.

### Showcase Version (for investor presentations)

We maintain a dedicated `showcase` branch for investor presentations that is always in a stable, demo-ready state.

To quickly switch to the showcase version:

```bash
# Switch to showcase mode and build the application
./showcase.sh
```

This will:
1. Switch to the `showcase` branch
2. Build the frontend application
3. Prepare the system for demonstration

### Development Workflow

Development work happens on the `main` branch. To switch back to development mode:

```bash
# Switch to development mode
./development.sh
```

### Managing the Showcase Version

When you have a stable version ready for demonstrations:

1. Test thoroughly on the `main` branch
2. Run: `git checkout showcase`
3. Run: `git merge main`
4. Test the merged version
5. Commit: `git commit -am "Update showcase with latest stable features"`
6. Return to development: `git checkout main`

This workflow ensures you always have a stable version ready for investor presentations while allowing ongoing development.
