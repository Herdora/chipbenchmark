'use client';

import React, { useState, useMemo } from 'react';
import { useBenchmarkData } from '@/hooks/useBenchmarkData';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
  Chip,
  OutlinedInput,
  SelectChangeEvent,
} from '@mui/material';
import { ScatterPlot } from '@nivo/scatterplot';

interface FilterState {
  chip: string[];
  model: string[];
  precision: string[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ height: '100%', overflow: 'hidden' }}>{children}</Box>}
    </div>
  );
}

export default function Dashboard() {
  const allData = useBenchmarkData();
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    chip: [],
    model: [],
    precision: []
  });

  // Chart tab state
  const [xMetric, setXMetric] = useState('tps');
  const [yMetric, setYMetric] = useState('ttft_ms');

  // Table tab state
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [customFormula, setCustomFormula] = useState('');

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const chips = Array.from(new Set(allData.map(d => d.chip))).sort();
    const models = Array.from(new Set(allData.map(d => d.model))).sort();
    const precisions = Array.from(new Set(allData.map(d => d.precision))).sort();
    return { chips, models, precisions };
  }, [allData]);

  // Apply filters
  const filteredData = useMemo(() => {
    return allData.filter(result => {
      return (filters.chip.length === 0 || filters.chip.includes(result.chip)) &&
        (filters.model.length === 0 || filters.model.includes(result.model)) &&
        (filters.precision.length === 0 || filters.precision.includes(result.precision));
    });
  }, [allData, filters]);

  // Chart data processing for Nivo
  const chartData = useMemo(() => {
    const data = filteredData.map(item => ({
      id: `${item.chip}-${item.model}-${item.precision}`,
      x: item[xMetric as keyof typeof item] as number,
      y: item[yMetric as keyof typeof item] as number,
      chip: item.chip,
      model: item.model,
      precision: item.precision,
    }));

    return [{
      id: 'benchmarks',
      data: data
    }];
  }, [filteredData, xMetric, yMetric]);

  // Table data processing with custom formulas
  const tableData = useMemo(() => {
    let data = [...filteredData];

    // Apply custom formula sorting
    if (customFormula) {
      data = data.map(item => ({
        ...item,
        customValue: evaluateFormula(item, customFormula)
      })).sort((a, b) => {
        const aVal = a.customValue || 0;
        const bVal = b.customValue || 0;
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      });
    } else {
      // Regular sorting
      data.sort((a, b) => {
        const aVal = a[sortBy as keyof typeof a] as number;
        const bVal = b[sortBy as keyof typeof b] as number;
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }

    return data;
  }, [filteredData, sortBy, sortDirection, customFormula]);

  const updateFilter = (key: keyof FilterState, value: string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ chip: [], model: [], precision: [] });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
    setCustomFormula(''); // Clear custom formula when sorting by column
  };

  const handleMultiSelectChange = (key: keyof FilterState) => (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    updateFilter(key, value);
  };

  if (allData.length === 0) {
    return (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        overflow: 'hidden'
      }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress size={60} />
          <Typography variant="h5" color="text.primary">
            Loading benchmark data...
          </Typography>
        </Stack>
      </Box>
    );
  }

  const hasActiveFilters = filters.chip.length > 0 || filters.model.length > 0 || filters.precision.length > 0;

  return (
    <Box sx={{
      height: '100%',
      bgcolor: 'background.default',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      width: '100%'
    }}>
      {/* Filters */}
      <Box sx={{
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        width: '100%'
      }}>
        <Box sx={{ py: 1, px: 2, width: '100%' }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Box sx={{ minWidth: 120, flex: '0 0 auto' }}>
              <FormControl fullWidth size="small" variant="outlined">
                <InputLabel sx={{ fontSize: 12 }}>Chips</InputLabel>
                <Select
                  multiple
                  value={filters.chip}
                  onChange={handleMultiSelectChange('chip')}
                  input={<OutlinedInput label="Chips" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" sx={{ fontSize: 10, height: 20 }} />
                      ))}
                    </Box>
                  )}
                  sx={{ fontSize: 12, minHeight: 32 }}
                >
                  {filterOptions.chips.map((chip) => (
                    <MenuItem key={chip} value={chip}>
                      {chip}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ minWidth: 120, flex: '0 0 auto' }}>
              <FormControl fullWidth size="small" variant="outlined">
                <InputLabel sx={{ fontSize: 12 }}>Models</InputLabel>
                <Select
                  multiple
                  value={filters.model}
                  onChange={handleMultiSelectChange('model')}
                  input={<OutlinedInput label="Models" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" sx={{ fontSize: 10, height: 20 }} />
                      ))}
                    </Box>
                  )}
                  sx={{ fontSize: 12, minHeight: 32 }}
                >
                  {filterOptions.models.map((model) => (
                    <MenuItem key={model} value={model}>
                      {model}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ minWidth: 120, flex: '0 0 auto' }}>
              <FormControl fullWidth size="small" variant="outlined">
                <InputLabel sx={{ fontSize: 12 }}>Precisions</InputLabel>
                <Select
                  multiple
                  value={filters.precision}
                  onChange={handleMultiSelectChange('precision')}
                  input={<OutlinedInput label="Precisions" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" sx={{ fontSize: 10, height: 20 }} />
                      ))}
                    </Box>
                  )}
                  sx={{ fontSize: 12, minHeight: 32 }}
                >
                  {filterOptions.precisions.map((precision) => (
                    <MenuItem key={precision} value={precision}>
                      {precision}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  size="small"
                  color="primary"
                  sx={{
                    minWidth: 0,
                    fontSize: 11,
                    px: 1,
                    py: 0.25,
                    height: 24
                  }}
                >
                  Clear
                </Button>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                {filteredData.length} of {allData.length} results
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="dashboard tabs"
          sx={{ minHeight: 32 }}
        >
          <Tab label="Chart" sx={{ minHeight: 32, py: 0, fontSize: 13 }} />
          <Tab label="Table" sx={{ minHeight: 32, py: 0, fontSize: 13 }} />
        </Tabs>
      </Box>

      {/* Content Area */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', width: '100%', height: '100%' }}>
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ height: '100%', width: '100%' }}>
            {/* Chart Controls */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
              <FormControl size="small" variant="outlined" sx={{ minWidth: 120 }}>
                <InputLabel sx={{ fontSize: 12 }}>X Axis</InputLabel>
                <Select
                  value={xMetric}
                  label="X Axis"
                  onChange={(e) => setXMetric(e.target.value)}
                  sx={{ fontSize: 12, height: 32 }}
                >
                  <MenuItem value="tps">Throughput (TPS)</MenuItem>
                  <MenuItem value="ttft_ms">Time to First Token (ms)</MenuItem>
                  <MenuItem value="power_w_avg">Power (W)</MenuItem>
                  <MenuItem value="batch_size">Batch Size</MenuItem>
                  <MenuItem value="concurrency">Concurrency</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" variant="outlined" sx={{ minWidth: 120 }}>
                <InputLabel sx={{ fontSize: 12 }}>Y Axis</InputLabel>
                <Select
                  value={yMetric}
                  label="Y Axis"
                  onChange={(e) => setYMetric(e.target.value)}
                  sx={{ fontSize: 12, height: 32 }}
                >
                  <MenuItem value="tps">Throughput (TPS)</MenuItem>
                  <MenuItem value="ttft_ms">Time to First Token (ms)</MenuItem>
                  <MenuItem value="power_w_avg">Power (W)</MenuItem>
                  <MenuItem value="batch_size">Batch Size</MenuItem>
                  <MenuItem value="concurrency">Concurrency</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Chart */}
            <Box sx={{ height: 'calc(100% - 60px)', width: '100%' }}>
              {chartData[0]?.data.length === 0 ? (
                <Box sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 2
                }}>
                  <Typography variant="h6" color="text.secondary">
                    No data to display
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try clearing filters or check if data is loaded
                  </Typography>
                </Box>
              ) : (
                <ScatterPlot
                  width={800}
                  height={400}
                  data={chartData}
                  margin={{ top: 60, right: 140, bottom: 70, left: 90 }}
                  xScale={{ type: 'linear', min: 'auto', max: 'auto' }}
                  yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
                  colors={{ scheme: 'category10' }}
                  blendMode="multiply"
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: getMetricLabel(xMetric),
                    legendPosition: 'middle',
                    legendOffset: 46
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: getMetricLabel(yMetric),
                    legendPosition: 'middle',
                    legendOffset: -60
                  }}
                  legends={[
                    {
                      anchor: 'bottom-right',
                      direction: 'column',
                      justify: false,
                      translateX: 130,
                      translateY: 0,
                      itemWidth: 100,
                      itemHeight: 12,
                      itemsSpacing: 5,
                      itemDirection: 'left-to-right',
                      symbolSize: 12,
                      symbolShape: 'circle',
                      effects: [
                        {
                          on: 'hover',
                          style: {
                            itemOpacity: 1
                          }
                        }
                      ]
                    }
                  ]}
                  tooltip={({ node }) => (
                    <div style={{
                      background: 'white',
                      padding: '9px 12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      <strong>{node.data.chip}</strong><br />
                      {node.data.model} ({node.data.precision})<br />
                      {getMetricLabel(xMetric)}: {node.data.x}<br />
                      {getMetricLabel(yMetric)}: {node.data.y}
                    </div>
                  )}
                />
              )}
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Table Controls */}
            <Box sx={{ p: 2, pb: 1, width: '100%' }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <Box sx={{ minWidth: 150, flex: '0 0 auto' }}>
                  <FormControl size="small" variant="outlined" fullWidth>
                    <InputLabel sx={{ fontSize: 12 }}>Sort By</InputLabel>
                    <Select
                      value={sortBy}
                      label="Sort By"
                      onChange={(e) => handleSort(e.target.value)}
                      sx={{ fontSize: 12, height: 32 }}
                    >
                      <MenuItem value="timestamp">Timestamp</MenuItem>
                      <MenuItem value="tps">Throughput (TPS)</MenuItem>
                      <MenuItem value="ttft_ms">Time to First Token (ms)</MenuItem>
                      <MenuItem value="power_w_avg">Power (W)</MenuItem>
                      <MenuItem value="batch_size">Batch Size</MenuItem>
                      <MenuItem value="concurrency">Concurrency</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ minWidth: 150, flex: '0 0 auto' }}>
                  <FormControl size="small" variant="outlined" fullWidth>
                    <InputLabel sx={{ fontSize: 12 }}>Direction</InputLabel>
                    <Select
                      value={sortDirection}
                      label="Direction"
                      onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
                      sx={{ fontSize: 12, height: 32 }}
                    >
                      <MenuItem value="asc">Ascending</MenuItem>
                      <MenuItem value="desc">Descending</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: '0 0 auto' }}>
                  <Button
                    onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: 12, height: 32 }}
                  >
                    Toggle Direction
                  </Button>
                </Box>
              </Box>
            </Box>

            {/* Table */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', width: '100%' }}>
              <TableContainer component={Paper} sx={{ height: '100%', boxShadow: 0, border: 1, borderColor: 'divider' }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: 12, fontWeight: 600, bgcolor: 'background.paper' }}>Chip</TableCell>
                      <TableCell sx={{ fontSize: 12, fontWeight: 600, bgcolor: 'background.paper' }}>Model</TableCell>
                      <TableCell sx={{ fontSize: 12, fontWeight: 600, bgcolor: 'background.paper' }}>Precision</TableCell>
                      <TableCell sx={{ fontSize: 12, fontWeight: 600, bgcolor: 'background.paper' }}>
                        <TableSortLabel
                          active={sortBy === 'tps'}
                          direction={sortBy === 'tps' ? sortDirection : 'asc'}
                          onClick={() => handleSort('tps')}
                        >
                          TPS
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, fontWeight: 600, bgcolor: 'background.paper' }}>
                        <TableSortLabel
                          active={sortBy === 'ttft_ms'}
                          direction={sortBy === 'ttft_ms' ? sortDirection : 'asc'}
                          onClick={() => handleSort('ttft_ms')}
                        >
                          TTFT (ms)
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, fontWeight: 600, bgcolor: 'background.paper' }}>
                        <TableSortLabel
                          active={sortBy === 'power_w_avg'}
                          direction={sortBy === 'power_w_avg' ? sortDirection : 'asc'}
                          onClick={() => handleSort('power_w_avg')}
                        >
                          Power (W)
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, fontWeight: 600, bgcolor: 'background.paper' }}>
                        <TableSortLabel
                          active={sortBy === 'batch_size'}
                          direction={sortBy === 'batch_size' ? sortDirection : 'asc'}
                          onClick={() => handleSort('batch_size')}
                        >
                          Batch Size
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, fontWeight: 600, bgcolor: 'background.paper' }}>
                        <TableSortLabel
                          active={sortBy === 'concurrency'}
                          direction={sortBy === 'concurrency' ? sortDirection : 'asc'}
                          onClick={() => handleSort('concurrency')}
                        >
                          Concurrency
                        </TableSortLabel>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableData.map((row, index) => (
                      <TableRow key={index} hover>
                        <TableCell sx={{ fontSize: 12 }}>{row.chip}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{row.model}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{row.precision}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{row.tps.toFixed(2)}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{row.ttft_ms.toFixed(2)}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{row.power_w_avg.toFixed(2)}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{row.batch_size}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{row.concurrency}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        </TabPanel>
      </Box>
    </Box>
  );
}

// Helper functions
function getMetricLabel(metric: string): string {
  const labels: { [key: string]: string; } = {
    tps: 'Throughput (TPS)',
    ttft_ms: 'TTFT (ms)',
    power_w_avg: 'Power (W)',
    batch_size: 'Batch Size',
    concurrency: 'Concurrency'
  };
  return labels[metric] || metric;
}

interface BenchmarkResult {
  tps: number;
  ttft_ms: number;
  power_w_avg: number;
  batch_size: number;
  concurrency: number;
}

function evaluateFormula(item: BenchmarkResult, formula: string): number {
  try {
    // Replace metric names with actual values
    const expression = formula
      .replace(/tps/g, item.tps.toString())
      .replace(/ttft_ms/g, item.ttft_ms.toString())
      .replace(/power_w_avg/g, item.power_w_avg.toString())
      .replace(/batch_size/g, item.batch_size.toString())
      .replace(/concurrency/g, item.concurrency.toString());

    // Simple evaluation (in production, use a proper expression parser)
    return eval(expression);
  } catch {
    return 0;
  }
}
