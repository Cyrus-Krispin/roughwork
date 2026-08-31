import { createTheme } from '@mui/material/styles';

export const strataAiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#242622',
      contrastText: '#f7f6f1',
    },
    secondary: {
      main: '#5f625c',
    },
    error: {
      main: '#9a3f32',
    },
    background: {
      default: '#f7f6f1',
      paper: '#f7f6f1',
    },
    text: {
      primary: '#242622',
      secondary: '#6f716b',
    },
    divider: '#deddd7',
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    button: {
      fontSize: '0.82rem',
      fontWeight: 600,
      letterSpacing: 0,
      textTransform: 'none',
    },
    h1: {
      fontWeight: 500,
      letterSpacing: '-0.045em',
    },
    h2: {
      fontWeight: 500,
      letterSpacing: '-0.035em',
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
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});
