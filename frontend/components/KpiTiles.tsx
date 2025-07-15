'use client';

import { useBenchmarkKPIs } from '@/hooks/useBenchmarkData';
import type { BenchmarkResult } from '@/lib/schemas/benchmark';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { TrendingUp, Speed, Battery6Bar, EmojiNature } from '@mui/icons-material';

interface KpiTilesProps {
  data: BenchmarkResult[];
}

interface KpiTileProps {
  title: string;
  value: number;
  unit: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}

function KpiTile({ title, value, unit, subtitle, icon, color }: KpiTileProps) {
  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <Box
        sx={{
          position: 'absolute',
          top: -16,
          left: 24,
          width: 48,
          height: 48,
          borderRadius: 2,
          backgroundColor: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: 2,
        }}
      >
        {icon}
      </Box>
      <CardContent sx={{ pt: 5 }}>
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mt: 1 }}>
          <Typography variant="h3" color="text.primary" sx={{ fontWeight: 700 }}>
            {value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {unit}
          </Typography>
        </Box>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export function KpiTiles({ data }: KpiTilesProps) {
  const kpis = useBenchmarkKPIs(data);

  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
      gap: 3,
      mb: 4
    }}>
      <KpiTile
        title="Avg TTFT"
        value={kpis.avgLatency}
        unit="ms"
        subtitle={`Average latency`}
        icon={<Speed />}
        color="#7DE3F3"
      />
      <KpiTile
        title="Avg TPS"
        value={kpis.avgThroughput}
        unit="tok/s"
        subtitle={`Average throughput`}
        icon={<TrendingUp />}
        color="#3B82F6"
      />
      <KpiTile
        title="Total Requests"
        value={kpis.totalRequests}
        unit=""
        subtitle={`Successful requests`}
        icon={<Battery6Bar />}
        color="#F59E0B"
      />
      <KpiTile
        title="Avg Power"
        value={kpis.avgPower}
        unit="W"
        subtitle={`Average power consumption`}
        icon={<EmojiNature />}
        color="#22C55E"
      />
    </Box>
  );
} 