# TradeKing Business Assessment

A modern web application for validating and assessing business information using AI-powered validation.

## Features

- Multi-step business assessment form
- Real-time field validation
- AI-powered business information validation
- Session management
- Modern, responsive UI
- Type-safe frontend and backend

## Tech Stack

### Frontend
- React 18 with TypeScript
- React Router for navigation
- Axios for API requests
- TailwindCSS for styling
- Framer Motion for animations
- Vite for development and building

### Backend
- Flask for the web framework
- Flask-CORS for cross-origin resource sharing
- Flask-Session for session management
- Python 3.12+ for modern language features
- Pytest for testing

## Getting Started

### Prerequisites
- Python 3.12 or higher
- Node.js 18 or higher
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Install the package in development mode:
   ```bash
   pip install -e .
   ```

5. Run the development server:
   ```bash
   python wsgi.py
   ```

The backend will be available at `http://localhost:5000`.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

The frontend will be available at `http://localhost:3000`.

## Development

### Backend Development

- Run tests:
  ```bash
  cd backend
  pytest
  ```

- Run tests with coverage:
  ```bash
  pytest --cov=app tests/
  ```

### Frontend Development

- Run linter:
  ```bash
  npm run lint
  # or
  yarn lint
  ```

- Run tests:
  ```bash
  npm test
  # or
  yarn test
  ```

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   ├── services/
│   │   └── __init__.py
│   ├── tests/
│   ├── requirements.txt
│   └── wsgi.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── services/
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Environment Variables

### Backend
- `SECRET_KEY`: Flask secret key for session encryption
- `FLASK_ENV`: Development or production environment
- `FLASK_DEBUG`: Enable debug mode

### Frontend
- `VITE_API_BASE_URL`: Backend API URL

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 