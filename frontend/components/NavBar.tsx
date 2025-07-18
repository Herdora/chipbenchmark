'use client';

import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';
import Image from 'next/image';
import { StayUpdated } from '@/components/StayUpdated';
import { DarkModeToggle } from '@/components/DarkModeToggle';
import logo from '@/app/logo.png';

export const NavBar: React.FC = () => {
  return (
    <AppBar
      position="static"
      color="default"
      elevation={0}
      sx={{
        borderBottom: 1,
        padding: 0,
        borderColor: 'divider',
        height: { xs: 56, md: 64 },
        minHeight: { xs: 56, md: 64 },
      }}
    >
      <Container sx={{ height: '100%', px: { xs: 1, md: 0 }, py: 0, minWidth: "100%" }}>
        <Toolbar disableGutters sx={{
          height: { xs: 56, md: 64 },
          minHeight: { xs: 56, md: 64 },
          py: 0,
          pl: { xs: 1, md: 3 }, // Add padding to the left
          pr: { xs: 2, md: 3 } // Add padding to the right
        }}>
          {/* Logo and Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
            <Image
              src={logo}
              alt="chip benchmark Logo"
              width={48}
              height={48}
              style={{
                objectFit: 'contain',
                width: 'auto',
                height: 'auto',
                maxWidth: 52,
                maxHeight: 52
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
            <DarkModeToggle />
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
                      bgcolor: 'action.hover'
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
  );
}; 