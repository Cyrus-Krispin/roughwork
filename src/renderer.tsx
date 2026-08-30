import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider } from '@mui/material';

import { App } from './App';
import './index.css';
import { thinkEdgeTheme } from './theme';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('ThinkEdge could not find its root element.');
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider theme={thinkEdgeTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
