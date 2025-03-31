// Add process polyfill for browser environment
if (typeof process === 'undefined') {
  (window as any).process = {
    env: {
      GOOGLE_LOGGING_DISABLE_COLORS: 'true'
    },
    stdout: {
      isTTY: false,
      write: () => {},
      end: () => {}
    },
    stderr: {
      isTTY: false,
      write: () => {},
      end: () => {}
    }
  };
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);