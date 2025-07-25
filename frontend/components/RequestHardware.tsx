'use client';

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Collapse,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SendIcon from '@mui/icons-material/Send';
import { submitBenchmarkRequest } from '@/lib/supabase';

interface RequestBenchmarkProps {
  // No props needed for simplified version
  readonly placeholder?: never;
}

export function RequestBenchmark({}: RequestBenchmarkProps) {
  const [expanded, setExpanded] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!suggestion.trim()) {
      setErrorMessage('Please enter your benchmark suggestion.');
      setShowError(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitBenchmarkRequest(suggestion.trim());

      if (result.success) {
        // Reset form
        setSuggestion('');
        setShowSuccess(true);
        setExpanded(false);
      } else {
        setErrorMessage(result.error || 'Failed to submit request. Please try again.');
        setShowError(true);
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = suggestion.trim().length > 0 && !isSubmitting;

  return (
    <>
      <Box sx={{ mt: 2 }}>
        <Button
          onClick={() => setExpanded(!expanded)}
          variant="outlined"
          size="small"
          endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          sx={{
            fontSize: { xs: 10, md: 12 },
            textTransform: 'none',
            width: '100%',
            minWidth: { xs: 140, md: 'auto' },
            height: { xs: 28, md: 32 },
            justifyContent: 'space-between',
            borderColor: 'divider',
            color: 'text.primary',
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.04)',
              borderColor: 'primary.main'
            }
          }}
        >
          Request Benchmark
        </Button>

        <Collapse in={expanded}>
          <Box sx={{ mt: { xs: 1, md: 2 } }}>
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1, md: 2 } }}>
                <TextField
                  size="small"
                  label="Suggest benchmark"
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  required
                  multiline
                  rows={3}
                  placeholder="model, chip, precision, concurrency, anything really"
                  sx={{
                    '& .MuiInputBase-input': { fontSize: { xs: 10, md: 12 } },
                    '& .MuiInputLabel-root': { fontSize: { xs: 10, md: 12 } }
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="small"
                  disabled={!isFormValid}
                  startIcon={isSubmitting ? <CircularProgress size={14} color="inherit" /> : <SendIcon />}
                  sx={{
                    fontSize: { xs: 10, md: 12 },
                    textTransform: 'none',
                    height: { xs: 28, md: 32 },
                    bgcolor: 'primary.main',
                    '&:hover': {
                      bgcolor: 'primary.dark'
                    }
                  }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </Box>
            </form>
          </Box>
        </Collapse>
      </Box>

      {/* Success/Error notifications */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setShowSuccess(false)} severity="success">
          Benchmark request submitted successfully!
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