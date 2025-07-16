'use client';

import { useMemo } from 'react';
import type { BenchmarkResult } from '@/lib/schemas/benchmark';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
} from '@mui/material';
import { Download } from '@mui/icons-material';

interface RunsTableProps {
  data: BenchmarkResult[];
}

// CSV export functionality
const exportToCSV = (data: BenchmarkResult[]) => {
  const headers = [
    'Model',
    'Chip',
    'Precision',
    'Batch Size',
    'Concurrency',
    'TTFT (ms)',
    'TPS',
    'Power (W)',
    'Efficiency (tok/W)',
    'Timestamp'
  ];

  const rows = data.map(result => [
    result.model,
    result.chip,
    result.precision,
    result.concurrency.toString(), // Use concurrency instead of batch_size
    result.concurrency.toString(),
    result.ttft_mean_ms.toFixed(1),
    result.total_token_throughput_tok_s.toFixed(1),
    'N/A', // power_w_avg not available in schema
    'N/A', // efficiency not available without power data
    result.timestamp
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `chipbenchmark-results-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const getPrecisionColor = (precision: string) => {
  switch (precision) {
    case 'FP16': return 'info';
    case 'FP32': return 'primary';
    case 'INT8': return 'success';
    case 'INT4': return 'warning';
    default: return 'default';
  }
};

export function RunsTable({ data }: RunsTableProps) {
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [data]);

  if (data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            All Benchmark Results
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
            <Typography variant="body1" color="text.secondary">
              No data available
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" component="h2">
            All Benchmark Results
            <Typography component="span" variant="body1" color="text.secondary" sx={{ ml: 1 }}>
              ({data.length} runs)
            </Typography>
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => exportToCSV(sortedData)}
            size="small"
          >
            Export CSV
          </Button>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Model</TableCell>
                <TableCell>Chip</TableCell>
                <TableCell>Precision</TableCell>
                <TableCell align="right">Batch Size</TableCell>
                <TableCell align="right">Concurrency</TableCell>
                <TableCell align="right">TTFT (ms)</TableCell>
                <TableCell align="right">TPS</TableCell>
                <TableCell align="right">Power (W)</TableCell>
                <TableCell align="right">Efficiency</TableCell>
                <TableCell>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((result, index) => (
                <TableRow key={index} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{result.model}</TableCell>
                  <TableCell>{result.chip}</TableCell>
                  <TableCell>
                    <Chip
                      label={result.precision}
                      size="small"
                      color={getPrecisionColor(result.precision)}
                    />
                  </TableCell>
                  <TableCell align="right">{result.concurrency}</TableCell>
                  <TableCell align="right">{result.concurrency}</TableCell>
                                  <TableCell align="right">{result.ttft_mean_ms.toFixed(1)}</TableCell>
                <TableCell align="right">{result.total_token_throughput_tok_s.toFixed(0)}</TableCell>
                <TableCell align="right">N/A</TableCell>
                <TableCell align="right">N/A
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(result.timestamp), 'MMM d, yyyy HH:mm')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
} 