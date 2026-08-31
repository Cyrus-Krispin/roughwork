import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';

import { App } from './App';
import { strataAiTheme } from './theme';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Strata AI could not find its root element.');
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider theme={strataAiTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
