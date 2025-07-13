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
import Chip from '@mui/material/Chip';
import { theme } from '@/lib/theme';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "ChipBenchmark",
  description: "A platform for monitoring the chip situation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            overflow: 'hidden'
          }}>
            <AppBar
              position="static"
              color="default"
              elevation={0}
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                height: 72,
                minHeight: 72
              }}
            >
              <Container maxWidth="xl" sx={{ height: '100%', px: 0 }}>
                <Toolbar disableGutters sx={{ height: 72, minHeight: 72, py: 0, px: 3 }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography
                      variant="h4"
                      component="h1"
                      color="primary"
                      sx={{
                        fontWeight: 700,
                        lineHeight: 1,
                        fontSize: 28,
                        mb: 0.5
                      }}
                    >
                      ChipBenchmark
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        fontWeight: 400,
                        fontSize: 14,
                        lineHeight: 1
                      }}
                    >
                      A platform for monitoring the chip situation
                    </Typography>
                  </Box>
                  <Chip
                    label="v1.0"
                    color="primary"
                    variant="outlined"
                    size="medium"
                    sx={{ height: 28, fontSize: 13 }}
                  />
                </Toolbar>
              </Container>
            </AppBar>
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                bgcolor: 'background.default',
                height: 'calc(100vh - 72px)',
                overflow: 'hidden',
                width: '100%'
              }}
            >
              {children}
            </Box>
          </Box>
        </ThemeProvider>
      </body>
    </html>
  );
}
