'use client';

import React, { useState, useMemo } from 'react';
import { useModelBenchmarkData, useFilteredBenchmarkData, useFilterOptions, AVAILABLE_MODELS } from '@/hooks/useBenchmarkData';
import { getMetricLabel } from '@/lib/schemas/benchmark';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
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
  CircularProgress,
} from '@mui/material';
import { ResponsiveLine } from '@nivo/line';

interface FilterState {
  chips: string[];
  precisions: string[];
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
      style={{ height: '100%' }}
      {...other}
    >
      {value === index && <Box sx={{ height: '100%', overflow: 'hidden' }}>{children}</Box>}
    </div>
  );
}

export default function Dashboard() {
  // Primary model selection with proper default
  const [selectedModel, setSelectedModel] = useState<string>(AVAILABLE_MODELS[0] || 'llama3.3-70b');

  // Load data for selected model
  const { results: modelData, loading } = useModelBenchmarkData(selectedModel);

  // Secondary filters
  const [filters, setFilters] = useState<FilterState>({
    chips: [],
    precisions: []
  });

  const [activeTab, setActiveTab] = useState(0);

  // Table tab state
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Chart axis selectors
  const [xMetric, setXMetric] = useState('concurrency');
  const [yMetric, setYMetric] = useState('tps');

  // Combined I/O sequence length selector
  const [ioConfig, setIoConfig] = useState<string>('200/200');

  // Get filter options from current model data with fallback
  const filterOptions = useFilterOptions(modelData);

  // Get available I/O configurations
  const ioOptions = useMemo(() => {
    const configs = Array.from(new Set(modelData.map(d => `${d.input_sequence_length}/${d.output_sequence_length}`)))
      .sort((a, b) => {
        const [aInput, aOutput] = a.split('/').map(Number);
        const [bInput, bOutput] = b.split('/').map(Number);
        return aInput - bInput || aOutput - bOutput;
      });
    return configs;
  }, [modelData]);

  // Apply filters and restrict to specific concurrency values
  const ALLOWED_CONCURRENCIES = [1, 5, 100, 200];
  const filteredData = useFilteredBenchmarkData(modelData, {
    chips: filters.chips,
    precisions: filters.precisions,
    concurrencies: ALLOWED_CONCURRENCIES
  });

  // Further filter by I/O configuration
  const ioFilteredData = useMemo(() => {
    if (ioConfig === 'all') return filteredData;

    const [inputLength, outputLength] = ioConfig.split('/').map(Number);
    return filteredData.filter(item =>
      item.input_sequence_length === inputLength &&
      item.output_sequence_length === outputLength
    );
  }, [filteredData, ioConfig]);

  // Get available x-axis values from actual data
  const availableXValues = useMemo(() => {
    const values = Array.from(new Set(ioFilteredData.map(d => d[xMetric as keyof typeof d] as number)));
    return values.sort((a, b) => a - b);
  }, [ioFilteredData, xMetric]);

  // Chart data processing for Nivo Line chart
  const chartData = useMemo(() => {
    // Group data by chip-precision combination (simplified since we filter I/O separately)
    const groupedData = ioFilteredData.reduce((acc, item) => {
      const key = `${item.chip} (${item.precision.toUpperCase()})`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push({
        x: item[xMetric as keyof typeof item] as number,
        y: item[yMetric as keyof typeof item] as number,
        chip: item.chip,
        precision: item.precision,
        concurrency: item.concurrency,
        input_sequence_length: item.input_sequence_length,
        output_sequence_length: item.output_sequence_length,
      });
      return acc;
    }, {} as Record<string, Array<{
      x: number;
      y: number;
      chip: string;
      precision: string;
      concurrency: number;
      input_sequence_length: number;
      output_sequence_length: number;
    }>>);

    // Sort each group by x value for proper line connections
    Object.keys(groupedData).forEach(key => {
      groupedData[key].sort((a, b) => a.x - b.x);
    });

    // Convert to Nivo format
    return Object.entries(groupedData).map(([id, data]) => ({
      id,
      data
    }));
  }, [ioFilteredData, xMetric, yMetric]);

  // Table data processing
  const tableData = useMemo(() => {
    const data = [...ioFilteredData];

    // Apply sorting
    data.sort((a, b) => {
      const aVal = a[sortBy as keyof typeof a] as string | number;
      const bVal = b[sortBy as keyof typeof b] as string | number;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return data;
  }, [ioFilteredData, sortBy, sortDirection]);

  const updateFilter = (key: keyof FilterState, value: string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
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
  };

  const handleMultiSelectChange = (key: keyof FilterState) => (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    updateFilter(key, value);
  };

  const handleChipDelete = (filterKey: keyof FilterState, valueToDelete: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    updateFilter(filterKey, filters[filterKey].filter(v => v !== valueToDelete));
  };

  const availableMetrics = [
    { value: 'concurrency', label: 'Concurrency' },
    { value: 'tps', label: 'Throughput (TPS)' },
    { value: 'ttft_ms', label: 'Time to First Token (ms)' },
    { value: 'successful_requests', label: 'Successful Requests' },
    { value: 'request_throughput', label: 'Request Throughput' },
    { value: 'total_token_throughput', label: 'Total Token Throughput' },
  ];

  // Generate chart title based on selected I/O configuration
  const chartTitle = useMemo(() => {
    if (ioConfig === 'all') return 'All I/O Configurations';
    return `I/O Configuration: ${ioConfig}`;
  }, [ioConfig]);

  // Custom colors for better distinction
  const customColors = [
    '#1f77b4', // blue
    '#ff7f0e', // orange
    '#2ca02c', // green
    '#d62728', // red
    '#9467bd', // purple
    '#8c564b', // brown
    '#e377c2', // pink
    '#7f7f7f', // gray
    '#bcbd22', // olive
    '#17becf'  // cyan
  ];

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress />
        <Typography>Loading benchmark data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      overflow: 'hidden'
    }}>
      {/* Model Selection and Filters */}
      <Box sx={{
        display: 'flex',
        gap: 2,
        p: 2,
        borderBottom: 1,
        borderColor: 'divider',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        {/* Primary Model Selector */}
        <FormControl size="small" variant="outlined" sx={{ minWidth: 200 }}>
          <InputLabel sx={{ fontSize: 12 }}>Model</InputLabel>
          <Select
            value={selectedModel}
            label="Model"
            onChange={(e) => setSelectedModel(e.target.value)}
            sx={{ fontSize: 12, height: 32 }}
          >
            {AVAILABLE_MODELS.length > 0 ? (
              AVAILABLE_MODELS.map((model) => (
                <MenuItem key={model} value={model}>
                  {model}
                </MenuItem>
              ))
            ) : (
              <MenuItem value="" disabled>
                No models available
              </MenuItem>
            )}
          </Select>
        </FormControl>

        {/* Secondary Filters */}
        <FormControl size="small" variant="outlined" sx={{ minWidth: 150 }}>
          <InputLabel sx={{ fontSize: 12 }}>Chips</InputLabel>
          <Select
            multiple
            value={filters.chips}
            label="Chips"
            onChange={handleMultiSelectChange('chips')}
            input={<OutlinedInput label="Chips" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip
                    key={value}
                    label={value}
                    size="small"
                    onDelete={handleChipDelete('chips', value)}
                    sx={{
                      fontSize: 10,
                      height: 20,
                      bgcolor: '#1976d2',
                      color: 'white',
                      '& .MuiChip-deleteIcon': {
                        color: 'white',
                        fontSize: 14,
                        '&:hover': {
                          color: '#f0f0f0'
                        }
                      }
                    }}
                  />
                ))}
              </Box>
            )}
            sx={{ fontSize: 12, minHeight: 32 }}
          >
            {filterOptions.chips.length > 0 ? (
              filterOptions.chips.map((chip) => (
                <MenuItem key={chip} value={chip}>
                  {chip}
                </MenuItem>
              ))
            ) : (
              <MenuItem value="" disabled>
                No chips available
              </MenuItem>
            )}
          </Select>
        </FormControl>

        <FormControl size="small" variant="outlined" sx={{ minWidth: 150 }}>
          <InputLabel sx={{ fontSize: 12 }}>Precisions</InputLabel>
          <Select
            multiple
            value={filters.precisions}
            label="Precisions"
            onChange={handleMultiSelectChange('precisions')}
            input={<OutlinedInput label="Precisions" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip
                    key={value}
                    label={value.toUpperCase()}
                    size="small"
                    onDelete={handleChipDelete('precisions', value)}
                    sx={{
                      fontSize: 10,
                      height: 20,
                      bgcolor: '#1976d2',
                      color: 'white',
                      '& .MuiChip-deleteIcon': {
                        color: 'white',
                        fontSize: 14,
                        '&:hover': {
                          color: '#f0f0f0'
                        }
                      }
                    }}
                  />
                ))}
              </Box>
            )}
            sx={{ fontSize: 12, minHeight: 32 }}
          >
            {filterOptions.precisions.length > 0 ? (
              filterOptions.precisions.map((precision) => (
                <MenuItem key={precision} value={precision}>
                  {precision.toUpperCase()}
                </MenuItem>
              ))
            ) : (
              <MenuItem value="" disabled>
                No precisions available
              </MenuItem>
            )}
          </Select>
        </FormControl>

        <Box sx={{ flexGrow: 1 }} />

        <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
          {ioFilteredData.length} of {modelData.length} results
        </Typography>
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
          <Box sx={{ height: '100%', width: '100%', display: 'flex' }}>
            {/* Left side - Axis and I/O selectors */}
            <Box sx={{
              width: '20%',
              borderRight: 1,
              borderColor: 'divider',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}>
              <Typography variant="h6" sx={{ fontSize: 14, fontWeight: 600, mb: 1 }}>
                Chart Configuration
              </Typography>

              <FormControl size="small" variant="outlined" fullWidth>
                <InputLabel sx={{ fontSize: 12 }}>X-Axis</InputLabel>
                <Select
                  value={xMetric}
                  label="X-Axis"
                  onChange={(e) => setXMetric(e.target.value)}
                  sx={{ fontSize: 12, height: 32 }}
                >
                  {availableMetrics.map((metric) => (
                    <MenuItem key={metric.value} value={metric.value}>
                      {metric.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" variant="outlined" fullWidth>
                <InputLabel sx={{ fontSize: 12 }}>Y-Axis</InputLabel>
                <Select
                  value={yMetric}
                  label="Y-Axis"
                  onChange={(e) => setYMetric(e.target.value)}
                  sx={{ fontSize: 12, height: 32 }}
                >
                  {availableMetrics.map((metric) => (
                    <MenuItem key={metric.value} value={metric.value}>
                      {metric.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography variant="h6" sx={{ fontSize: 14, fontWeight: 600, mt: 2, mb: 1 }}>
                I/O Configuration
              </Typography>

              <FormControl size="small" variant="outlined" fullWidth>
                <InputLabel sx={{ fontSize: 12 }}>Input/Output</InputLabel>
                <Select
                  value={ioConfig}
                  label="Input/Output"
                  onChange={(e) => setIoConfig(e.target.value)}
                  sx={{ fontSize: 12, height: 32 }}
                >
                  <MenuItem value="all">All Configurations</MenuItem>
                  {ioOptions.map((config) => (
                    <MenuItem key={config} value={config}>
                      {config}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Right side - Chart */}
            <Box sx={{ width: '80%', height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
              {/* Chart Title */}
              <Box sx={{ mb: 2, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 600 }}>
                  {chartTitle}
                </Typography>
              </Box>

              {/* Chart Content */}
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {chartData.length === 0 || chartData.every(series => series.data.length === 0) ? (
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 2,
                    height: '100%',
                    width: '100%'
                  }}>
                    <Typography variant="h6" color="text.secondary">
                      No data to display
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Try adjusting filters or select a different model
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ width: '100%', height: '100%', minHeight: '400px' }}>
                    <ResponsiveLine
                      data={chartData}
                      margin={{ top: 60, right: 140, bottom: 70, left: 90 }}
                      xScale={{
                        type: 'linear',
                        min: 'auto',
                        max: 'auto'
                      }}
                      yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
                      colors={customColors}
                      pointSize={20}
                      pointColor={{ theme: 'background' }}
                      pointBorderWidth={6}
                      pointBorderColor={{ from: 'serieColor' }}
                      enablePointLabel={false}
                      useMesh={true}
                      lineWidth={3}
                      enableArea={false}
                      curve="monotoneX"
                      enableGridX={true}
                      enableGridY={true}
                      gridXValues={availableXValues}
                      axisTop={null}
                      axisRight={null}
                      axisBottom={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: getMetricLabel(xMetric),
                        legendPosition: 'middle',
                        legendOffset: 46,
                        tickValues: availableXValues
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
                          itemHeight: 16,
                          itemsSpacing: 8,
                          itemDirection: 'left-to-right',
                          symbolSize: 14,
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
                      tooltip={(props: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                        <div style={{
                          background: 'white',
                          padding: '12px 16px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          fontSize: '12px',
                          minWidth: '200px',
                          whiteSpace: 'nowrap'
                        }}>
                          <strong>{props.point.serieId}</strong><br />
                          {selectedModel}<br />
                          I/O: {props.point.data.input_sequence_length}/{props.point.data.output_sequence_length}<br />
                          Concurrency: {props.point.data.concurrency}<br />
                          {getMetricLabel(xMetric)}: {props.point.data.x}<br />
                          {getMetricLabel(yMetric)}: {props.point.data.y}
                        </div>
                      )}
                    />
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Table */}
            <TableContainer component={Paper} sx={{ flexGrow: 1, overflow: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'timestamp'}
                        direction={sortBy === 'timestamp' ? sortDirection : 'asc'}
                        onClick={() => handleSort('timestamp')}
                        sx={{ fontSize: 12 }}
                      >
                        Timestamp
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'chip'}
                        direction={sortBy === 'chip' ? sortDirection : 'asc'}
                        onClick={() => handleSort('chip')}
                        sx={{ fontSize: 12 }}
                      >
                        Chip
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'precision'}
                        direction={sortBy === 'precision' ? sortDirection : 'asc'}
                        onClick={() => handleSort('precision')}
                        sx={{ fontSize: 12 }}
                      >
                        Precision
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'input_sequence_length'}
                        direction={sortBy === 'input_sequence_length' ? sortDirection : 'asc'}
                        onClick={() => handleSort('input_sequence_length')}
                        sx={{ fontSize: 12 }}
                      >
                        Input Length
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'output_sequence_length'}
                        direction={sortBy === 'output_sequence_length' ? sortDirection : 'asc'}
                        onClick={() => handleSort('output_sequence_length')}
                        sx={{ fontSize: 12 }}
                      >
                        Output Length
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'concurrency'}
                        direction={sortBy === 'concurrency' ? sortDirection : 'asc'}
                        onClick={() => handleSort('concurrency')}
                        sx={{ fontSize: 12 }}
                      >
                        Concurrency
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'tps'}
                        direction={sortBy === 'tps' ? sortDirection : 'asc'}
                        onClick={() => handleSort('tps')}
                        sx={{ fontSize: 12 }}
                      >
                        Throughput (TPS)
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'ttft_ms'}
                        direction={sortBy === 'ttft_ms' ? sortDirection : 'asc'}
                        onClick={() => handleSort('ttft_ms')}
                        sx={{ fontSize: 12 }}
                      >
                        TTFT (ms)
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'successful_requests'}
                        direction={sortBy === 'successful_requests' ? sortDirection : 'asc'}
                        onClick={() => handleSort('successful_requests')}
                        sx={{ fontSize: 12 }}
                      >
                        Requests
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableData.map((row, index) => (
                    <TableRow key={index} hover>
                      <TableCell sx={{ fontSize: 11 }}>
                        {new Date(row.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{row.chip}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{row.precision.toUpperCase()}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{row.input_sequence_length}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{row.output_sequence_length}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{row.concurrency}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{row.tps.toFixed(2)}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{row.ttft_ms.toFixed(2)}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{row.successful_requests}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>
      </Box>
    </Box>
  );
}
