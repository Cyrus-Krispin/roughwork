import { createTheme } from '@mui/material/styles';

export const thinkEdgeTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#36513b',
      contrastText: '#fffdf7',
    },
    secondary: {
      main: '#a7482f',
    },
    error: {
      main: '#a7482f',
    },
    background: {
      default: '#f2eee4',
      paper: '#f8f5ed',
    },
    text: {
      primary: '#20231d',
      secondary: '#696b63',
    },
    divider: '#cbc6b9',
  },
  shape: {
    borderRadius: 0,
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    button: {
      fontSize: '0.82rem',
      fontWeight: 700,
      letterSpacing: 0,
      textTransform: 'none',
    },
    h1: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontWeight: 400,
      letterSpacing: '-0.055em',
    },
    h2: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontWeight: 400,
      letterSpacing: '-0.04em',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          minHeight: '100%',
        },
        body: {
          minWidth: 320,
          minHeight: '100vh',
        },
        '#root': {
          minHeight: '100vh',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
    },
  },
});
