'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { BenchmarkResult } from '@/lib/schemas/benchmark';
import { Card, CardContent, Typography, Box } from '@mui/material';

interface LatencyCurveProps {
  data: BenchmarkResult[];
}

// Color palette for different chips
const CHIP_COLORS = {
  'NVIDIA H100': '#22C55E',
  'NVIDIA A100': '#3B82F6',
  'NVIDIA RTX 4090': '#EF4444',
  'Apple M1 Ultra': '#8B5CF6',
  'Intel': '#F59E0B',
  'AMD': '#EC4899',
} as const;

export function LatencyCurve({ data }: LatencyCurveProps) {
  const chartData = useMemo(() => {
    // Group data by concurrency level
    const groupedData = new Map<number, Map<string, BenchmarkResult>>();

    data.forEach(result => {
      if (!groupedData.has(result.concurrency)) {
        groupedData.set(result.concurrency, new Map());
      }
      groupedData.get(result.concurrency)!.set(result.chip, result);
    });

    // Convert to chart format
    const chartPoints = Array.from(groupedData.entries())
      .sort(([a], [b]) => a - b)
      .map(([concurrency, chipData]) => {
        const point: any = { concurrency };

        chipData.forEach((result, chip) => {
          point[chip] = result.ttft_ms;
        });

        return point;
      });

    return chartPoints;
  }, [data]);

  const chips = useMemo(() => {
    return Array.from(new Set(data.map(d => d.chip)));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            Time to First Token vs Concurrency
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
            <Typography variant="body1" color="text.secondary">
              No data available
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" component="h2" gutterBottom>
          Time to First Token vs Concurrency
        </Typography>
        <Box sx={{ height: 350, width: '100%' }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF0" />
              <XAxis
                dataKey="concurrency"
                label={{ value: 'Concurrency', position: 'insideBottom', offset: -5 }}
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
                formatter={(value: number, name: string) => [
                  `${value.toFixed(1)}ms`,
                  name
                ]}
                labelFormatter={(label) => `Concurrency: ${label}`}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                iconType="line"
              />
              {chips.map(chip => (
                <Line
                  key={chip}
                  type="monotone"
                  dataKey={chip}
                  stroke={CHIP_COLORS[chip as keyof typeof CHIP_COLORS] || '#6B7280'}
                  strokeWidth={2}
                  dot={{ fill: CHIP_COLORS[chip as keyof typeof CHIP_COLORS] || '#6B7280', r: 4 }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
} 