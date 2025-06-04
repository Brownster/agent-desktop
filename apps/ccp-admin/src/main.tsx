import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { APIProvider } from './providers/APIProvider';
import App from './App';
import './index.css';

/**
 * Application root with providers
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <APIProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </APIProvider>
  </React.StrictMode>
);