import './globals.css';
import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';
import Image from 'next/image';
import { Analytics } from '@vercel/analytics/next';
import { theme } from '@/lib/theme';
import { StayUpdated } from '@/components/StayUpdated';
import logo from './logo.png';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "chip benchmark",
  description: "a platform for monitoring the chip situation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      </head>
      <body className={inter.className}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100dvh',
            fallbacks: { height: '100vh' }, // Fallback for older browsers
            overflow: 'hidden',
            padding: 0,
          }}>
            <AppBar
              position="static"
              color="default"
              elevation={0}
              sx={{
                borderBottom: 1,
                padding: 0,
                borderColor: 'divider',
                height: { xs: 56, md: 72 },
                minHeight: { xs: 56, md: 72 },
              }}
            >
              <Container sx={{ height: '100%', px: { xs: 1, md: 0 }, py: 0, minWidth: "100%" }}>
                <Toolbar disableGutters sx={{
                  height: { xs: 56, md: 72 },
                  minHeight: { xs: 56, md: 72 },
                  py: 0,
                  px: { xs: 1, md: 0 }
                }}>
                  {/* Logo and Title */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
                    <Image
                      src={logo}
                      alt="chip benchmark Logo"
                      width={32}
                      height={32}
                      style={{
                        objectFit: 'contain',
                        width: 'auto',
                        height: 'auto'
                      }}
                    />
                    <Box>
                      <Typography
                        variant="h4"
                        component="h1"
                        color="primary"
                        sx={{
                          fontWeight: 700,
                          lineHeight: 1,
                          fontSize: { xs: 18, sm: 22, md: 28 },
                          mb: { xs: 0, md: 0.5 }
                        }}
                      >
                        chip benchmark
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontWeight: 400,
                          fontSize: { xs: 10, sm: 12, md: 14 },
                          lineHeight: 1,
                          display: { xs: 'none', sm: 'block' }
                        }}
                      >
                        a platform for monitoring the chip situation
                      </Typography>
                    </Box>
                  </Box>

                  {/* Right side items */}
                  <Box sx={{ flexGrow: 1 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1 } }}>
                    <StayUpdated />
                    <Tooltip title="View source code on GitHub">
                      <Link
                        href="https://github.com/Herdora/chipbenchmark"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          color: 'text.primary',
                          textDecoration: 'none',
                          '&:hover': {
                            color: 'primary.main'
                          }
                        }}
                      >
                        <IconButton
                          size="small"
                          sx={{
                            color: 'inherit',
                            '&:hover': {
                              bgcolor: 'rgba(0, 0, 0, 0.04)'
                            },
                            p: { xs: 0.5, md: 1 }
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                          </svg>
                        </IconButton>
                      </Link>
                    </Tooltip>
                  </Box>
                </Toolbar>
              </Container>
            </AppBar>
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                bgcolor: 'background.default',
                height: 'calc(100dvh - 56px)',
                fallbacks: { height: 'calc(100vh - 56px)' }, // Fallback for older browsers
                '@media (min-width: 900px)': {
                  height: 'calc(100dvh - 72px)',
                  fallbacks: { height: 'calc(100vh - 72px)' }
                },
                overflow: 'hidden',
                width: '100%'
              }}
            >
              {children}
            </Box>
          </Box>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
