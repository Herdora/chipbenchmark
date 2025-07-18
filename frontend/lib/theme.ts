'use client';

import { createTheme } from '@mui/material/styles';

// Light theme configuration
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3B4656', // Night-Slate
      dark: '#3B4656',
      contrastText: '#F0F0F0',
    },
    secondary: {
      main: '#5F6A78', // Steel-Graphite
      contrastText: '#F0F0F0',
    },
    background: {
      default: '#F0F0F0', // Frost-White
      paper: '#FFFFFF',
    },
    text: {
      primary: '#3B4656', // Night-Slate
      secondary: '#5F6A78', // Steel-Graphite
      disabled: '#B4BAC1', // Cloud-Mist
    },
    divider: '#B4BAC1', // Cloud-Mist
    info: {
      main: '#A7F9FF', // Spark-Cyan
    },
    success: {
      main: '#A7F9FF', // Spark-Cyan as accent
    },
    warning: {
      main: '#A7F9FF', // Spark-Cyan as accent
    },
    error: {
      main: '#A7F9FF', // Spark-Cyan as accent
    },
    action: {
      active: '#A7F9FF', // Spark-Cyan for active states
      hover: '#B4BAC1',
      selected: '#A7F9FF',
      disabled: '#B4BAC1',
      disabledBackground: '#F0F0F0',
    },
  },
  typography: {
    fontFamily: '"IBM Plex Sans", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 0, // Flat UI - no rounded corners
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: 'none', // Flat UI - no shadows
          borderRadius: 0,
          border: '1px solid #B4BAC1',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 0, // Flat UI - no rounded corners
          fontWeight: 600,
          padding: '8px 16px',
          border: '1px solid #B4BAC1',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 0, // Flat UI - no rounded corners
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: 'none', // Flat UI - no shadows
          borderRadius: 0, // Flat UI - no rounded corners
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none', // Flat UI - no shadows
          borderBottom: '1px solid #B4BAC1',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 32,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 32,
          textTransform: 'none',
          borderRadius: 0,
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderRadius: 0,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #B4BAC1',
          padding: '8px 16px',
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#F8F9FA',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#F8F9FA',
          },
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          borderRadius: 0, // Flat UI - no rounded corners
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 0, // Flat UI - no rounded corners
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: {
          color: '#1A237E', // Navy blue color for dropdown arrow
        },
      },
    },
  },
});

// Dark theme configuration
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#A7F9FF', // Spark-Cyan for better contrast in dark mode
      dark: '#A7F9FF',
      contrastText: '#1a1a1a',
    },
    secondary: {
      main: '#B4BAC1', // Cloud-Mist for secondary in dark
      contrastText: '#1a1a1a',
    },
    background: {
      default: '#1a1a1a', // Very dark background
      paper: '#242424', // Slightly lighter for paper elements
    },
    text: {
      primary: '#F0F0F0', // Frost-White for primary text
      secondary: '#B4BAC1', // Cloud-Mist for secondary text
      disabled: '#5F6A78', // Steel-Graphite for disabled
    },
    divider: '#3B4656', // Night-Slate for dividers
    info: {
      main: '#A7F9FF', // Spark-Cyan
    },
    success: {
      main: '#A7F9FF', // Spark-Cyan as accent
    },
    warning: {
      main: '#A7F9FF', // Spark-Cyan as accent
    },
    error: {
      main: '#ff6b6b', // A softer red for errors in dark mode
    },
    action: {
      active: '#A7F9FF', // Spark-Cyan for active states
      hover: 'rgba(167, 249, 255, 0.08)',
      selected: 'rgba(167, 249, 255, 0.16)',
      disabled: '#5F6A78',
      disabledBackground: '#2a2a2a',
    },
  },
  typography: {
    fontFamily: '"IBM Plex Sans", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 0, // Flat UI - no rounded corners
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: 'none', // Flat UI - no shadows
          borderRadius: 0,
          border: '1px solid #3B4656', // Darker border for dark mode
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 0, // Flat UI - no rounded corners
          fontWeight: 600,
          padding: '8px 16px',
          border: '1px solid #3B4656', // Darker border for dark mode
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 0, // Flat UI - no rounded corners
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: 'none', // Flat UI - no shadows
          borderRadius: 0, // Flat UI - no rounded corners
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none', // Flat UI - no shadows
          borderBottom: '1px solid #3B4656', // Darker border for dark mode
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 32,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 32,
          textTransform: 'none',
          borderRadius: 0,
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderRadius: 0,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #3B4656', // Darker border for dark mode
          padding: '8px 16px',
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#2a2a2a', // Darker background for table headers
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(167, 249, 255, 0.04)', // Subtle hover for dark mode
          },
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          borderRadius: 0, // Flat UI - no rounded corners
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 0, // Flat UI - no rounded corners
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: {
          color: '#A7F9FF', // Cyan color for dropdown arrow in dark mode
        },
      },
    },
  },
});

// Export a single theme for backward compatibility
export const theme = lightTheme; 