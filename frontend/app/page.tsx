'use client';

import React, { useState, useMemo } from 'react';
import { useModelBenchmarkData, useFilteredBenchmarkData, useFilterOptions, useBenchmarkDiscovery } from '@/hooks/useBenchmarkData';
import { getMetricLabel } from '@/lib/schemas/benchmark';
import { fetchHardwareInfo, formatHardwareInfo } from '@/lib/hardware';
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
  OutlinedInput,
  SelectChangeEvent,
  CircularProgress,
  TablePagination,
} from '@mui/material';
import { ResponsiveLine } from '@nivo/line';
import { RequestBenchmark } from '@/components/RequestHardware';

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

function ChartTooltip({ point, selectedModel, xMetric, yMetric }: {
  point: {
    data: {
      chip: string;
      precision: string;
      concurrency: number;
      input_sequence_length: number;
      output_sequence_length: number;
      x: number;
      y: number;
    };
  };
  selectedModel: string;
  xMetric: string;
  yMetric: string;
}) {
  const [hardwareInfo, setHardwareInfo] = React.useState<string>('');

  React.useEffect(() => {
    const loadHardwareInfo = async () => {
      const hardware = await fetchHardwareInfo(selectedModel, point.data.chip, point.data.precision);
      setHardwareInfo(formatHardwareInfo(hardware));
    };
    loadHardwareInfo();
  }, [selectedModel, point.data.chip, point.data.precision]);

  return (
    <div style={{
      background: 'white',
      padding: '12px 16px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      fontSize: '12px',
      minWidth: '200px',
      whiteSpace: 'nowrap'
    }}>
      <strong>{point.data.chip} ({point.data.precision.toUpperCase()})</strong><br />
      {hardwareInfo && <span style={{ color: '#666' }}>{hardwareInfo}</span>}
      {hardwareInfo && <br />}
      {selectedModel}<br />
      I/O: {point.data.input_sequence_length}/{point.data.output_sequence_length}<br />
      Concurrency: {point.data.concurrency}<br />
      {getMetricLabel(yMetric)}: {point.data.y}<br />
      {getMetricLabel(xMetric)}: {point.data.x}
    </div>
  );
}

export default function Dashboard() {
  // Load discovery data first
  const { discovery, loading: discoveryLoading } = useBenchmarkDiscovery();

  // Primary model selection with proper default
  const [selectedModel, setSelectedModel] = useState<string>('');

  // Set default model once discovery is loaded
  React.useEffect(() => {
    if (!discoveryLoading && discovery && discovery.models.length > 0 && !selectedModel) {
      setSelectedModel(discovery.models[0]);
    }
  }, [discovery, discoveryLoading, selectedModel]);

  // Reset page when model changes
  React.useEffect(() => {
    setPage(0);
  }, [selectedModel]);

  // Load data for selected model
  const { results: modelData, loading } = useModelBenchmarkData(selectedModel);

  // Secondary filters
  const [filters, setFilters] = useState<FilterState>({
    chips: [],
    precisions: []
  });

  const [activeTab, setActiveTab] = useState(0);

  // Table tab state
  const [sortBy, setSortBy] = useState('concurrency');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Chart axis selectors
  const [xMetric, setXMetric] = useState('concurrency');
  const [yMetric, setYMetric] = useState('tps');

  // I/O sequence length selectors - separate for chart and table
  const [chartIoConfig, setChartIoConfig] = useState<string>('200/200');
  const tableIoConfig: 'all' | string = 'all'; // Fixed value since setter was unused

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
  const ALLOWED_CONCURRENCIES = [1, 64, 128, 256];
  const filteredData = useFilteredBenchmarkData(modelData, {
    chips: filters.chips,
    precisions: filters.precisions,
    concurrencies: ALLOWED_CONCURRENCIES
  });

  // Filter data for chart by I/O configuration
  const chartFilteredData = useMemo(() => {
    const [inputLength, outputLength] = chartIoConfig.split('/').map(Number);
    return filteredData.filter(item =>
      item.input_sequence_length === inputLength &&
      item.output_sequence_length === outputLength
    );
  }, [filteredData, chartIoConfig]);

  // Filter data for table by I/O configuration
  const tableFilteredData = useMemo(() => {
    if (tableIoConfig === 'all') return filteredData;

    // This code path is never reached since tableIoConfig is always 'all'
    // But keeping for potential future use
    if (tableIoConfig.includes('/')) {
      const [inputLength, outputLength] = tableIoConfig.split('/').map(Number);
      return filteredData.filter(item =>
        item.input_sequence_length === inputLength &&
        item.output_sequence_length === outputLength
      );
    }
    return filteredData;
  }, [filteredData, tableIoConfig]);

  // Get available x-axis values from actual data
  const availableXValues = useMemo(() => {
    const values = Array.from(new Set(chartFilteredData.map(d => d[xMetric as keyof typeof d] as number)));
    return values.sort((a, b) => a - b);
  }, [chartFilteredData, xMetric]);

  // Chart data processing for Nivo Line chart
  const chartData = useMemo(() => {
    // Group data by chip-precision combination
    const groupedData = chartFilteredData.reduce((acc, item) => {
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
  }, [chartFilteredData, xMetric, yMetric]);

  // Table data processing
  const tableData = useMemo(() => {
    const data = [...tableFilteredData];

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
  }, [tableFilteredData, sortBy, sortDirection]);

  // Paginated table data
  const paginatedTableData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return tableData.slice(startIndex, startIndex + rowsPerPage);
  }, [tableData, page, rowsPerPage]);

  const updateFilter = (key: keyof FilterState, value: string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Reset to first page when filters change
    setPage(0);
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
    // Reset to first page when sorting
    setPage(0);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMultiSelectChange = (key: keyof FilterState) => (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];

    // Handle "All" selection
    if (value.includes('')) {
      updateFilter(key, []);
    } else {
      updateFilter(key, value);
    }
  };



  const availableMetrics = [
    { value: 'concurrency', label: 'Concurrency' },
    { value: 'tps', label: 'Throughput (TPS)' },
    { value: 'ttft_ms', label: 'Time to First Token (ms)' },
    { value: 'successful_requests', label: 'Successful Requests' },
    { value: 'request_throughput', label: 'Request Throughput' },
    { value: 'total_token_throughput', label: 'Total Token Throughput' },
  ];

  // Y-axis options (limited set as requested)
  const yAxisMetrics = useMemo(() => [
    { value: 'tps', label: 'Throughput (TPS)' },
    { value: 'ttft_ms', label: 'Time to First Token (ms)' },
    { value: 'request_throughput', label: 'Request Throughput' },
    { value: 'total_token_throughput', label: 'Total Token Throughput' },
  ], []);

  // Ensure Y-axis metric is valid
  React.useEffect(() => {
    const validYMetrics = yAxisMetrics.map(m => m.value);
    if (!validYMetrics.includes(yMetric)) {
      setYMetric('tps'); // Reset to default if current value is invalid
    }
  }, [yAxisMetrics, yMetric]);

  // Generate chart title based on selected I/O configuration
  const chartTitle = useMemo(() => {
    return `I/O Configuration: ${chartIoConfig}`;
  }, [chartIoConfig]);

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

  if (loading || discoveryLoading) {
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
      maxWidth: '100vw',
      overflow: 'hidden',
      minWidth: 0 // Prevent flex items from overflowing
    }}>
      {/* Model Selection and Filters */}
      <Box sx={{
        display: 'flex',
        gap: { xs: 1, md: 2 },
        p: { xs: 1, md: 2 },
        borderBottom: 1,
        borderColor: 'divider',
        alignItems: 'center',
        flexWrap: 'wrap',
        overflow: 'hidden',
        minWidth: 0
      }}>
        {/* Primary Model Selector */}
        <FormControl size="small" variant="outlined" sx={{ minWidth: { xs: 140, md: 180 }, maxWidth: { xs: 180, md: 220 } }}>
          <InputLabel sx={{ fontSize: { xs: 11, md: 12 } }}>Model</InputLabel>
          <Select
            value={selectedModel}
            label="Model"
            onChange={(e) => setSelectedModel(e.target.value)}
            sx={{ fontSize: { xs: 11, md: 12 }, height: { xs: 28, md: 32 } }}
          >
            {discovery && discovery.models.length > 0 ? (
              discovery.models.map((model) => (
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
        <FormControl size="small" variant="outlined" sx={{ minWidth: { xs: 80, md: 120 }, maxWidth: { xs: 140, md: 160 } }}>
          <InputLabel sx={{ fontSize: { xs: 11, md: 12 } }}>Chips</InputLabel>
          <Select
            multiple
            value={filters.chips}
            label="Chips"
            onChange={handleMultiSelectChange('chips')}
            input={<OutlinedInput label="Chips" />}
            renderValue={(selected) => {
              if (selected.length === 0) {
                return 'All Chips';
              }
              if (selected.length === filterOptions.chips.length) {
                return 'All Chips';
              }
              if (selected.length <= 2) {
                return selected.join(', ');
              }
              return `${selected.slice(0, 2).join(', ')} + ${selected.length - 2} more`;
            }}
            sx={{ fontSize: { xs: 11, md: 12 }, minHeight: { xs: 28, md: 32 } }}
          >
            {filterOptions.chips.length > 0 ? (
              [
                <MenuItem
                  key="all"
                  value=""
                  sx={{ fontSize: 12, fontWeight: 'bold' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <input
                      type="checkbox"
                      checked={filters.chips.length === 0}
                      readOnly
                      style={{ marginRight: 8 }}
                    />
                    All
                  </Box>
                </MenuItem>,
                ...filterOptions.chips.map((chip) => (
                  <MenuItem key={chip} value={chip} sx={{ fontSize: 12 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <input
                        type="checkbox"
                        checked={filters.chips.includes(chip)}
                        readOnly
                        style={{ marginRight: 8 }}
                      />
                      {chip}
                    </Box>
                  </MenuItem>
                ))
              ]
            ) : (
              <MenuItem value="" disabled>
                No chips available
              </MenuItem>
            )}
          </Select>
        </FormControl>

        <FormControl size="small" variant="outlined" sx={{ minWidth: { xs: 80, md: 120 }, maxWidth: { xs: 140, md: 160 } }}>
          <InputLabel sx={{ fontSize: { xs: 11, md: 12 } }}>Precisions</InputLabel>
          <Select
            multiple
            value={filters.precisions}
            label="Precisions"
            onChange={handleMultiSelectChange('precisions')}
            input={<OutlinedInput label="Precisions" />}
            renderValue={(selected) => {
              if (selected.length === 0) {
                return 'All Precisions';
              }
              if (selected.length === filterOptions.precisions.length) {
                return 'All Precisions';
              }
              if (selected.length <= 2) {
                return selected.map(p => p.toUpperCase()).join(', ');
              }
              return `${selected.slice(0, 2).map(p => p.toUpperCase()).join(', ')} + ${selected.length - 2} more`;
            }}
            sx={{ fontSize: { xs: 11, md: 12 }, minHeight: { xs: 28, md: 32 } }}
          >
            {filterOptions.precisions.length > 0 ? (
              [
                <MenuItem
                  key="all"
                  value=""
                  sx={{ fontSize: 12, fontWeight: 'bold' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <input
                      type="checkbox"
                      checked={filters.precisions.length === 0}
                      readOnly
                      style={{ marginRight: 8 }}
                    />
                    All
                  </Box>
                </MenuItem>,
                ...filterOptions.precisions.map((precision) => (
                  <MenuItem key={precision} value={precision} sx={{ fontSize: 12 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <input
                        type="checkbox"
                        checked={filters.precisions.includes(precision)}
                        readOnly
                        style={{ marginRight: 8 }}
                      />
                      {precision.toUpperCase()}
                    </Box>
                  </MenuItem>
                ))
              ]
            ) : (
              <MenuItem value="" disabled>
                No precisions available
              </MenuItem>
            )}
          </Select>
        </FormControl>

        <Box sx={{ flexGrow: 1, minWidth: { xs: 8, md: 16 } }} />

        <Typography variant="body2" color="text.secondary" sx={{
          fontSize: { xs: 10, md: 12 },
          flexShrink: 1,
          textAlign: 'right',
          lineHeight: 1.2
        }}>
          {activeTab === 0
            ? `${tableFilteredData.length} of ${modelData.length} results`
            : `Showing ${Math.min(page * rowsPerPage + 1, tableData.length)}-${Math.min((page + 1) * rowsPerPage, tableData.length)} of ${tableData.length} results`
          }
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
          <Box sx={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' }
          }}>
            {/* Left side - Axis and I/O selectors */}
            <Box sx={{
              width: { xs: '100%', md: '280px', lg: '320px' },
              minWidth: { md: '250px' },
              maxWidth: { xs: '100%', md: '350px' },
              borderRight: { xs: 0, md: 1 },
              borderBottom: { xs: 1, md: 0 },
              borderColor: 'divider',
              p: { xs: 1, md: 2 },
              display: 'flex',
              flexDirection: { xs: 'row', md: 'column' },
              gap: { xs: 1, md: 2 },
              flexWrap: { xs: 'wrap', md: 'nowrap' },
              alignItems: { xs: 'flex-start', md: 'stretch' },
              maxHeight: { xs: 'auto', md: '100%' },
              overflowY: { xs: 'visible', md: 'auto' }
            }}>
              <Box sx={{
                width: { xs: '100%', md: 'auto' },
                minWidth: { xs: 'auto', md: '100%' },
                display: 'flex',
                flexDirection: 'column',
                gap: { xs: 1, md: 2 }
              }}>
                <Typography variant="h6" sx={{
                  fontSize: { xs: 12, md: 14 },
                  fontWeight: 600,
                  mb: { xs: 0.5, md: 1 },
                  display: { xs: 'none', md: 'block' }
                }}>
                  Chart Configuration
                </Typography>

                <FormControl size="small" variant="outlined" sx={{ minWidth: { xs: 120, md: 'auto' } }}>
                  <InputLabel sx={{ fontSize: { xs: 11, md: 12 } }}>Y-Axis</InputLabel>
                  <Select
                    value={yMetric}
                    label="Y-Axis"
                    onChange={(e) => setYMetric(e.target.value)}
                    sx={{ fontSize: { xs: 11, md: 12 }, height: { xs: 28, md: 32 } }}
                  >
                    {yAxisMetrics.map((metric) => (
                      <MenuItem key={metric.value} value={metric.value}>
                        {metric.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" variant="outlined" sx={{ minWidth: { xs: 120, md: 'auto' } }}>
                  <InputLabel sx={{ fontSize: { xs: 11, md: 12 } }}>X-Axis</InputLabel>
                  <Select
                    value={xMetric}
                    label="X-Axis"
                    onChange={(e) => setXMetric(e.target.value)}
                    sx={{ fontSize: { xs: 11, md: 12 }, height: { xs: 28, md: 32 } }}
                  >
                    {availableMetrics.map((metric) => (
                      <MenuItem key={metric.value} value={metric.value}>
                        {metric.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Typography variant="h6" sx={{
                  fontSize: { xs: 12, md: 14 },
                  fontWeight: 600,
                  mt: { xs: 0, md: 2 },
                  mb: { xs: 0.5, md: 1 },
                  display: { xs: 'none', md: 'block' }
                }}>
                  I/O Configuration
                </Typography>

                <FormControl size="small" variant="outlined" sx={{ minWidth: { xs: 120, md: 'auto' } }}>
                  <InputLabel sx={{ fontSize: { xs: 11, md: 12 } }}>Input/Output</InputLabel>
                  <Select
                    value={chartIoConfig}
                    label="Input/Output"
                    onChange={(e) => setChartIoConfig(e.target.value)}
                    sx={{ fontSize: { xs: 11, md: 12 }, height: { xs: 28, md: 32 } }}
                  >
                    {ioOptions.map((config) => (
                      <MenuItem key={config} value={config}>
                        {config}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <RequestBenchmark />
              </Box>
            </Box>

            {/* Right side - Chart */}
            <Box sx={{
              flex: 1,
              height: { xs: 'calc(100% - 120px)', md: '100%' },
              minHeight: { xs: '400px', md: 'auto' },
              display: 'flex',
              flexDirection: 'column',
              p: { xs: 1, md: 2 },
              overflow: 'hidden'
            }}>
              {/* Chart Title */}
              <Box sx={{ mb: { xs: 1, md: 2 }, textAlign: 'center' }}>
                <Typography variant="h6" sx={{
                  fontSize: { xs: 14, md: 16 },
                  fontWeight: 600
                }}>
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
                  <Box sx={{ width: '100%', height: '100%', minHeight: { xs: '300px', md: '400px' } }}>
                    <ResponsiveLine
                      data={chartData}
                      margin={{ top: 40, right: 60, bottom: 60, left: 70 }}
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
                          translateX: 50,
                          translateY: 0,
                          itemWidth: 80,
                          itemHeight: 14,
                          itemsSpacing: 6,
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
                      tooltip={({ point }: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                        <ChartTooltip
                          point={point}
                          selectedModel={selectedModel}
                          xMetric={xMetric}
                          yMetric={yMetric}
                        />
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
            <TableContainer component={Paper} sx={{
              flexGrow: 1,
              overflow: 'auto',
              maxHeight: 'calc(100% - 60px)' // Reserve space for pagination
            }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
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
                  {paginatedTableData.map((row, index) => (
                    <TableRow key={page * rowsPerPage + index} hover>
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

            {/* Table Pagination */}
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={tableData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                borderTop: 1,
                borderColor: 'divider',
                backgroundColor: 'background.paper',
                '& .MuiTablePagination-toolbar': {
                  fontSize: { xs: 11, md: 14 },
                  minHeight: { xs: 42, md: 52 }
                },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontSize: { xs: 11, md: 14 }
                }
              }}
            />
          </Box>
        </TabPanel>
      </Box>
    </Box>
  );
}
