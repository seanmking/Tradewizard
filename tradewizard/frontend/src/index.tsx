import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Ensure the proper layout is maintained on refresh
const ensureAppLayout = () => {
  // Clear any direct path/hash that might be causing layout issues
  if (window.location.hash) {
    window.history.replaceState(null, '', window.location.pathname);
  }
};

// Call this function when the app loads
ensureAppLayout();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 