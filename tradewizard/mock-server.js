const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
// Use environment variable PORT or default to 3002
const PORT = process.env.PORT || 3002;

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

app.listen(PORT, () => {
  console.log(`Mock server running at http://localhost:${PORT}`);
  console.log(`Serving mock data from ${path.join(__dirname, '..', 'mock-data')}`);
}); 