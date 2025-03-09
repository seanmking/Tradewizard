const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
// Use environment variable PORT or default to 3002
const PORT = process.env.PORT || 3002;

// Store logs and errors
const logs = [];
const errors = [];

// Override console methods to capture logs
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = function() {
  logs.push({
    type: 'log',
    timestamp: new Date().toISOString(),
    message: Array.from(arguments).join(' ')
  });
  originalLog.apply(console, arguments);
};

console.error = function() {
  errors.push({
    type: 'error',
    timestamp: new Date().toISOString(),
    message: Array.from(arguments).join(' ')
  });
  originalError.apply(console, arguments);
};

console.warn = function() {
  logs.push({
    type: 'warning',
    timestamp: new Date().toISOString(),
    message: Array.from(arguments).join(' ')
  });
  originalWarn.apply(console, arguments);
};

// Enable CORS for all routes
app.use(cors());

// Serve static files from the mock-data directory
app.use('/mock-data', express.static(path.join(__dirname, '..', 'mock-data')));

// Add a simple health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Endpoint to get logs
app.get('/logs', (req, res) => {
  res.json({ logs });
});

// Endpoint to get errors
app.get('/errors', (req, res) => {
  res.json({ errors });
});

// Endpoint to clear logs and errors
app.post('/clear-logs', (req, res) => {
  logs.length = 0;
  errors.length = 0;
  res.json({ status: 'ok', message: 'Logs and errors cleared' });
});

app.listen(PORT, () => {
  console.log(`Mock server running at http://localhost:${PORT}`);
  console.log(`Serving mock data from ${path.join(__dirname, '..', 'mock-data')}`);
}); 