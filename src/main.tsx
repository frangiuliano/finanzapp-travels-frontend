import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initPwaInstallListeners } from '@/lib/pwa-install-store';
import './styles/global.css';

initPwaInstallListeners();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
