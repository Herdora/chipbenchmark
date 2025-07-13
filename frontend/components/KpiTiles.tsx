'use client';

import { useBenchmarkKPIs } from '@/hooks/useBenchmarkData';
import type { BenchmarkResult } from '@/lib/schemas/benchmark';
import { Card, CardContent, Grid, Typography, Box } from '@mui/material';
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
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <KpiTile
          title="Best TTFT"
          value={kpis.ttft.min}
          unit="ms"
          subtitle={`Median: ${kpis.ttft.median.toFixed(1)}ms`}
          icon={<Speed />}
          color="#7DE3F3"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KpiTile
          title="Peak TPS"
          value={kpis.tps.max}
          unit="tok/s"
          subtitle={`Median: ${kpis.tps.median.toFixed(0)} tok/s`}
          icon={<TrendingUp />}
          color="#3B82F6"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KpiTile
          title="Min Power"
          value={kpis.power.min}
          unit="W"
          subtitle={`Median: ${kpis.power.median.toFixed(0)}W`}
          icon={<Battery6Bar />}
          color="#F59E0B"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KpiTile
          title="Best Efficiency"
          value={kpis.efficiency.max}
          unit="tok/W"
          subtitle={`Median: ${kpis.efficiency.median.toFixed(2)} tok/W`}
          icon={<EmojiNature />}
          color="#22C55E"
        />
      </Grid>
    </Grid>
  );
} 