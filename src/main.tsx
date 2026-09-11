import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { AppThemeProvider } from '@/components/app-theme-provider';
import { initPwaInstallListeners } from '@/lib/pwa-install-store';
import { queryClient } from '@/lib/query-client';
import './styles/global.css';

initPwaInstallListeners();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        <App />
      </AppThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
