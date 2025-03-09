import React from 'react';
import ReactDOM from 'react-dom/client';
import 'process';
import { Buffer } from 'buffer';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorker';
import reportWebVitals from './reportWebVitals';

// Set global polyfills
window.global = window;
window.Buffer = Buffer;

// Ensure the proper layout is maintained on refresh
const ensureAppLayout = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};

// Set the layout initially
ensureAppLayout();

// Update on resize
window.addEventListener('resize', ensureAppLayout);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(); 