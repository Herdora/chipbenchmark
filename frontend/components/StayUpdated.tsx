'use client';

import React, { useState } from 'react';
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Snackbar,
  Tooltip,
  CircularProgress
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import { submitEmailSubscription } from '@/lib/supabase';

export function StayUpdated() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      setShowError(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitEmailSubscription(email.trim());

      if (result.success) {
        // Reset form
        setEmail('');
        setShowSuccess(true);
        setOpen(false);
      } else {
        setErrorMessage(result.error || 'Failed to subscribe. Please try again.');
        setShowError(true);
      }
    } catch (error) {
      console.error('Error submitting subscription:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Tooltip title="Stay Updated">
        <IconButton
          onClick={() => setOpen(true)}
          size="medium"
          sx={{
            color: 'text.primary',
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.04)',
              color: 'primary.main'
            }
          }}
        >
          <NotificationsIcon />
        </IconButton>
      </Tooltip>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            minHeight: '250px'
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmailIcon color="primary" />
            <Typography variant="h6">Stay Updated</Typography>
          </Box>
          <IconButton
            onClick={() => setOpen(false)}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Get notified when we add new hardware benchmarks and updates to the platform.
            </Typography>

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your.email@example.com"
                variant="outlined"
              />
            </form>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setOpen(false)}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!email || isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <EmailIcon />}
            sx={{ textTransform: 'none' }}
          >
            {isSubmitting ? 'Subscribing...' : 'Subscribe'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error notifications */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setShowSuccess(false)} severity="success">
          Successfully subscribed to updates!
        </Alert>
      </Snackbar>

      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setShowError(false)} severity="error">
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
} 