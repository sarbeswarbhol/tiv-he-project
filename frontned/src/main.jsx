import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(6,13,20,0.95)',
            border: '1px solid rgba(0,212,255,0.3)',
            color: '#e2e8f0',
            backdropFilter: 'blur(16px)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
          },
          success: {
            iconTheme: { primary: '#00ff88', secondary: '#020408' },
            style: {
              borderColor: 'rgba(0,255,136,0.4)',
              boxShadow: '0 0 20px rgba(0,255,136,0.2)',
            },
          },
          error: {
            iconTheme: { primary: '#ff5555', secondary: '#020408' },
            style: {
              borderColor: 'rgba(255,50,50,0.4)',
              boxShadow: '0 0 20px rgba(255,50,50,0.2)',
            },
          },
          loading: {
            iconTheme: { primary: '#00d4ff', secondary: '#020408' },
          },
          duration: 3000,
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
