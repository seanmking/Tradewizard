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
├── new/                      # Current implementation
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
cd new/backend

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
cd new/frontend

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