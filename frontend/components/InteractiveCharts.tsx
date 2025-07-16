'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { BenchmarkResult } from '@/lib/schemas/benchmark';
import { Card, CardContent, Typography, FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';

interface InteractiveChartsProps {
  data: BenchmarkResult[];
}

const CHIP_COLORS = {
  'NVIDIA H100': '#22C55E',
  'NVIDIA A100': '#3B82F6',
  'NVIDIA RTX 4090': '#EF4444',
  'Apple M1 Ultra': '#8B5CF6',
  'Intel': '#F59E0B',
  'AMD': '#EC4899',
} as const;

export function InteractiveCharts({ data }: InteractiveChartsProps) {
  // Get all unique concurrency levels
  const concurrencyOptions = useMemo(() => {
    return Array.from(new Set(data.map(d => d.concurrency))).sort((a, b) => a - b);
  }, [data]);

  // Pick a default concurrency that has data
  const getFirstConcurrencyWithData = useCallback(() => {
    for (const c of concurrencyOptions) {
      if (data.some(d => d.concurrency === c)) return c;
    }
    return concurrencyOptions[0] ?? 1;
  }, [concurrencyOptions, data]);

  const [concurrency, setConcurrency] = useState(getFirstConcurrencyWithData());

  // If data or concurrencyOptions change, update concurrency to a valid one
  useEffect(() => {
    if (!concurrencyOptions.includes(concurrency)) {
      setConcurrency(getFirstConcurrencyWithData());
    }
  }, [concurrencyOptions, concurrency, data, getFirstConcurrencyWithData]);

  // Filter data by concurrency
  const filtered = useMemo(() => data.filter(d => d.concurrency === concurrency), [data, concurrency]);

  // Group by chip/model/precision for lines
  const groupKey = (d: BenchmarkResult) => `${d.chip} | ${d.model} | ${d.precision}`;
  const grouped = useMemo(() => {
    const map = new Map<string, BenchmarkResult[]>();
    for (const d of filtered) {
      const key = groupKey(d);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    return map;
  }, [filtered]);

  // Prepare chart data for output_sequence_length
  const chartData = useMemo(() => {
    // For each group, sort by output_sequence_length
    const result: Record<string, { output_sequence_length: number; tps: number; ttft_ms: number; }[]> = {};
    grouped.forEach((arr, key) => {
      result[key] = arr
        .slice()
        .sort((a, b) => a.output_sequence_length - b.output_sequence_length)
        .map(d => ({ output_sequence_length: d.output_sequence_length, tps: d.output_token_throughput_tok_s, ttft_ms: d.ttft_mean_ms }));
    });
    return result;
  }, [grouped]);

  const hasChartData = Object.values(chartData).some(arr => arr.length > 0);

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" component="h2">
            Interactive Charts
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Concurrency</InputLabel>
            <Select
              value={concurrency}
              label="Concurrency"
              onChange={e => setConcurrency(Number(e.target.value))}
            >
              {concurrencyOptions.map(opt => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {hasChartData ? (
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
            {/* TPS vs Output Length */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Throughput (tokens/sec) vs Output Length
              </Typography>
              <Box sx={{ height: 300, width: '100%' }}>
                <ResponsiveContainer>
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF0" />
                    <XAxis
                      dataKey="output_sequence_length"
                      type="number"
                      label={{ value: 'Output Length (tokens)', position: 'insideBottom', offset: -5 }}
                      style={{ fontSize: 12 }}
                    />
                    <YAxis
                      label={{ value: 'Tokens/sec', angle: -90, position: 'insideLeft' }}
                      style={{ fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E5EAF0',
                        borderRadius: 8,
                        fontSize: 12
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 12 }}
                      iconType="line"
                    />
                    {Object.entries(chartData).map(([key, arr], i) => (
                      <Line
                        key={key}
                        data={arr}
                        dataKey="tps"
                        name={key}
                        type="monotone"
                        stroke={Object.values(CHIP_COLORS)[i % Object.values(CHIP_COLORS).length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Box>

            {/* TTFT vs Output Length */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                TTFT vs Output Length
              </Typography>
              <Box sx={{ height: 300, width: '100%' }}>
                <ResponsiveContainer>
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF0" />
                    <XAxis
                      dataKey="output_sequence_length"
                      type="number"
                      label={{ value: 'Output Length (tokens)', position: 'insideBottom', offset: -5 }}
                      style={{ fontSize: 12 }}
                    />
                    <YAxis
                      label={{ value: 'TTFT (ms)', angle: -90, position: 'insideLeft' }}
                      style={{ fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E5EAF0',
                        borderRadius: 8,
                        fontSize: 12
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 12 }}
                      iconType="line"
                    />
                    {Object.entries(chartData).map(([key, arr], i) => (
                      <Line
                        key={key}
                        data={arr}
                        dataKey="ttft_ms"
                        name={key}
                        type="monotone"
                        stroke={Object.values(CHIP_COLORS)[i % Object.values(CHIP_COLORS).length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="body1" color="text.secondary">
              No data available for the selected concurrency.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
} 