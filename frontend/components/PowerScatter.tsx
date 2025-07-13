'use client';

import { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { BenchmarkResult } from '@/lib/schemas/benchmark';
import { Card, CardContent, Typography, Box } from '@mui/material';

interface PowerScatterProps {
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

export function PowerScatter({ data }: PowerScatterProps) {
  const { chartData, efficiencyLines } = useMemo(() => {
    // Group data by chip for scatter plot
    const groupedData = new Map<string, Array<{ x: number; y: number; chip: string; model: string; precision: string; }>>();

    data.forEach(result => {
      if (!groupedData.has(result.chip)) {
        groupedData.set(result.chip, []);
      }
      groupedData.get(result.chip)!.push({
        x: result.power_w_avg,
        y: result.tps,
        chip: result.chip,
        model: result.model,
        precision: result.precision
      });
    });

    // Calculate efficiency iso-lines (TPS = efficiency * power)
    const maxPower = Math.max(...data.map(d => d.power_w_avg));
    const minEfficiency = Math.min(...data.map(d => d.tps / d.power_w_avg));
    const maxEfficiency = Math.max(...data.map(d => d.tps / d.power_w_avg));

    // Create efficiency reference lines
    const efficiencyValues = [
      Math.round(minEfficiency * 10) / 10,
      Math.round(maxEfficiency * 0.3 * 10) / 10,
      Math.round(maxEfficiency * 0.6 * 10) / 10,
      Math.round(maxEfficiency * 0.9 * 10) / 10
    ];

    const efficiencyLines = efficiencyValues.map(efficiency => ({
      efficiency,
      points: [
        { x: 0, y: 0 },
        { x: maxPower, y: efficiency * maxPower }
      ]
    }));

    return {
      chartData: Array.from(groupedData.entries()).map(([chip, points]) => ({
        chip,
        data: points,
        color: CHIP_COLORS[chip as keyof typeof CHIP_COLORS] || '#6B7280'
      })),
      efficiencyLines
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            Throughput vs Power Consumption
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
          Throughput vs Power Consumption
        </Typography>
        <Box sx={{ height: 350, width: '100%' }}>
          <ResponsiveContainer>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF0" />
              <XAxis
                type="number"
                dataKey="x"
                name="Power"
                unit="W"
                label={{ value: 'Power (W)', position: 'insideBottom', offset: -5 }}
                style={{ fontSize: 12 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="TPS"
                unit="tok/s"
                label={{ value: 'TPS (tok/s)', angle: -90, position: 'insideLeft' }}
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
                  name === 'TPS' ? `${value.toFixed(0)} tok/s` : `${value.toFixed(1)}W`,
                  name
                ]}
                labelFormatter={() => ''}
                content={({ active, payload }) => {
                  if (active && payload && payload.length > 0) {
                    const data = payload[0].payload;
                    const efficiency = (data.y / data.x).toFixed(2);
                    return (
                      <Box sx={{
                        bgcolor: 'background.paper',
                        p: 1.5,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        boxShadow: 1
                      }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{data.chip}</Typography>
                        <Typography variant="caption" color="text.secondary">{data.model} ({data.precision})</Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="body2">TPS: {data.y.toFixed(0)} tok/s</Typography>
                          <Typography variant="body2">Power: {data.x.toFixed(1)}W</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                            Efficiency: {efficiency} tok/W
                          </Typography>
                        </Box>
                      </Box>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                iconType="rect"
              />

              {/* Efficiency iso-lines */}
              {efficiencyLines.map(({ efficiency, points }) => (
                <ReferenceLine
                  key={efficiency}
                  segment={points}
                  stroke="#E5EAF0"
                  strokeDasharray="5 5"
                  label={{
                    value: `${efficiency} tok/W`,
                    position: 'top',
                    fontSize: 11,
                    fill: '#7A8CA3'
                  }}
                />
              ))}

              {/* Scatter points for each chip */}
              {chartData.map(({ chip, data, color }) => (
                <Scatter
                  key={chip}
                  name={chip}
                  data={data}
                  fill={color}
                  stroke={color}
                  strokeWidth={2}
                  r={6}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          Dashed lines show iso-efficiency curves (tokens per watt).
          Points closer to the top-left corner represent better efficiency.
        </Typography>
      </CardContent>
    </Card>
  );
} 