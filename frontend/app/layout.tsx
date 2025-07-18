import './globals.css';
import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import { CustomThemeProvider } from '@/contexts/ThemeContext';
import Box from '@mui/material/Box';
import { Analytics } from '@vercel/analytics/next';
import { NavBar } from '@/components/NavBar';

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
        <CustomThemeProvider>
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100dvh',
            fallbacks: { height: '100vh' }, // Fallback for older browsers
            overflow: 'hidden',
            padding: 0,
          }}>
            <NavBar />
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                bgcolor: 'background.default',
                height: 'calc(100dvh - 56px)',
                fallbacks: { height: 'calc(100vh - 56px)' }, // Fallback for older browsers
                '@media (min-width: 900px)': {
                  height: 'calc(100dvh - 64px)',
                  fallbacks: { height: 'calc(100vh - 64px)' }
                },
                overflow: 'hidden',
                width: '100%'
              }}
            >
              {children}
            </Box>
          </Box>
          <Analytics />
        </CustomThemeProvider>
      </body>
    </html>
  );
}
