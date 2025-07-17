'use client';

import React, { useState, useMemo } from 'react';
import { useModelBenchmarkData, useFilteredBenchmarkData, useFilterOptions, useBenchmarkDiscovery } from '@/hooks/useBenchmarkData';
import { getMetricLabel } from '@/lib/schemas/benchmark';
import { fetchHardwareInfo, formatHardwareInfo } from '@/lib/hardware';
import { H100_PRICING, A100_PRICING, MI300X_PRICING } from '@/public/data/pricing/data';
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
  Checkbox,
  Chip,
} from '@mui/material';
import { ResponsiveLine } from '@nivo/line';
import { RequestBenchmark } from '@/components/RequestHardware';

interface FilterState {
  tensorParallelisms: string[];
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

function ChartTooltip({ point, xMetric, yMetric, selectedModel }: {
  point: {
    data: {
      chip: string;
      precision: string;
      tensorParallelism: string;
      x: number;
      y: number;
      [key: string]: string | number | undefined;
    };
  };
  xMetric: string;
  yMetric: string;
  selectedModel: string;
}) {
  const { data } = point;
  const [hardwareInfo, setHardwareInfo] = useState<string>('Loading hardware info...');

  // Load hardware info when component mounts
  React.useEffect(() => {
    const loadHardwareInfo = async () => {
      try {
        const hardware = await fetchHardwareInfo(
          selectedModel,
          data.tensorParallelism,
          data.chip,
          data.precision
        );
        setHardwareInfo(formatHardwareInfo(hardware));
      } catch (error) {
        console.error('Error loading hardware info:', error);
        setHardwareInfo('Hardware info not available');
      }
    };

    loadHardwareInfo();
  }, [selectedModel, data.tensorParallelism, data.chip, data.precision]);

  // Get average pricing for this chip
  const avgPrice = getAveragePricing(data.chip);

  return (
    <Box sx={{
      p: 2,
      backgroundColor: 'background.paper',
      border: 1,
      borderColor: 'divider',
      minWidth: 200,
      zIndex: 99999,
      position: 'relative',
      boxShadow: 4,
      marginTop: '-10px',

    }}>
      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
        {data.chip} • {data.precision.toUpperCase()} • TP:{data.tensorParallelism}
      </Typography>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        {xMetric}: {data.x}
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        {yMetric}: {data.y}
      </Typography>
      <Typography variant="body2" sx={{ mb: 1, fontSize: 11, color: 'text.secondary' }}>
        Avg GPU Price: ${avgPrice.toFixed(2)}/hr
      </Typography>
      <Typography variant="body2" sx={{ fontSize: 11, color: 'text.secondary', fontStyle: 'italic' }}>
        {hardwareInfo}
      </Typography>
    </Box>
  );
}

// Helper function to get average pricing for a chip type
function getAveragePricing(chip: string): number {
  let pricing;

  if (chip === 'H100') {
    pricing = H100_PRICING;
  } else if (chip === 'A100') {
    pricing = A100_PRICING;
  } else if (chip === 'MI300X') {
    pricing = MI300X_PRICING;
  } else {
    return 0; // Default for unknown chips
  }

  const total = pricing.reduce((sum, p) => sum + p.on_demand_dollar_per_gpu_hour, 0);
  return total / pricing.length;
}

export default function Dashboard() {
  // Load discovery data first
  const { discovery, loading: discoveryLoading } = useBenchmarkDiscovery();

  // Primary model selection with proper default
  const [selectedModel, setSelectedModel] = useState<string>('');

  // Set default model once discovery is loaded
  React.useEffect(() => {
    if (!discoveryLoading && discovery && discovery.models.length > 0 && !selectedModel) {
      // Default to Llama-3.1-8B-Instruct
      const defaultModel = discovery.models.find(model => model === 'Llama-3.1-8B-Instruct') || discovery.models[0];
      setSelectedModel(defaultModel);
    }
  }, [discovery, discoveryLoading, selectedModel]);

  // Reset page when model changes
  React.useEffect(() => {
    setPage(0);
  }, [selectedModel]);

  // Load data for selected model
  const { data: modelData, loading } = useModelBenchmarkData(selectedModel);

  // Secondary filters - default to empty arrays which means "all"
  const [filters, setFilters] = useState<FilterState>({
    tensorParallelisms: [],
    chips: [],
    precisions: []
  });

  // Get filter options from current model data with fallback
  const filterOptions = useFilterOptions(modelData);

  // Set default filters when model data is loaded
  React.useEffect(() => {
    if (modelData && modelData.length > 0 && filterOptions) {
      // Get available options for the current model
      const availableTps = Array.from(new Set(modelData.map(d => d.tensorParallelism))).sort();
      const availableChips = Array.from(new Set(modelData.map(d => d.chip))).sort();
      const availablePrecisions = Array.from(new Set(modelData.map(d => d.precision))).sort();

      // Set defaults: all TPs, all chips, all precisions
      setFilters({
        tensorParallelisms: availableTps, // All tensor parallelisms selected
        chips: availableChips, // All chips selected
        precisions: availablePrecisions // All precisions selected
      });
    }
  }, [modelData, filterOptions]);

  const [activeTab, setActiveTab] = useState(0);

  // Table tab state
  const [sortBy, setSortBy] = useState('concurrency');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Chart axis selectors
  const [xMetric, setXMetric] = useState('concurrency');
  const [yMetric, setYMetric] = useState('output_token_throughput_tok_s');

  // I/O sequence length selectors - separate for chart and table
  const [chartIoConfig, setChartIoConfig] = useState<string>('200/200');

  // Chart configuration toggle state
  const [isChartConfigOpen, setIsChartConfigOpen] = useState(false);

  // Filters toggle state
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const tableIoConfig: 'all' | string = 'all'; // Fixed value since setter was unused

  // Get available I/O configurations
  const ioOptions = useMemo(() => {
    if (!modelData || !Array.isArray(modelData)) {
      return [];
    }
    const configs = Array.from(new Set(modelData.map(d => `${d.input_sequence_length}/${d.output_sequence_length}`)))
      .sort((a, b) => {
        const [aInput, aOutput] = a.split('/').map(Number);
        const [bInput, bOutput] = b.split('/').map(Number);
        return aInput - bInput || aOutput - bOutput;
      });
    return configs;
  }, [modelData]);

  // Set chartIoConfig to first available option if default is not available
  React.useEffect(() => {
    if (ioOptions.length > 0 && !ioOptions.includes(chartIoConfig)) {
      setChartIoConfig(ioOptions[0]);
    }
  }, [ioOptions, chartIoConfig]);

  // Apply filters and restrict to specific concurrency values
  const ALLOWED_CONCURRENCIES = useMemo(() => [1, 64, 128, 256, 512, 1024], []);
  const memoizedFilters = useMemo(() => ({
    tensorParallelisms: filters.tensorParallelisms,
    chips: filters.chips,
    precisions: filters.precisions,
    concurrencies: ALLOWED_CONCURRENCIES
  }), [filters.tensorParallelisms, filters.chips, filters.precisions, ALLOWED_CONCURRENCIES]);

  const filteredData = useFilteredBenchmarkData(modelData, memoizedFilters);

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
    // Group data by chip-precision-TP combination
    const groupedData = chartFilteredData.reduce((acc, item) => {
      const key = `${item.chip} (${item.precision.toUpperCase()} - TP ${item.tensorParallelism})`;

      // Get x and y values with proper validation
      const xValue = item[xMetric as keyof typeof item] as number;

      // Handle special case for tokens_per_second_per_dollar metric
      let yValue: number;
      if (yMetric === 'tokens_per_second_per_dollar') {
        yValue = item.output_token_throughput_tok_s / getAveragePricing(item.chip);
      } else {
        yValue = item[yMetric as keyof typeof item] as number;
      }

      // Skip data points with invalid values
      if (xValue == null || yValue == null || isNaN(xValue) || isNaN(yValue)) {
        return acc;
      }

      if (!acc[key]) {
        acc[key] = [];
      }

      const finalYValue = yValue;

      acc[key].push({
        x: xValue,
        y: finalYValue,
        chip: item.chip,
        precision: item.precision,
        tensorParallelism: item.tensorParallelism,
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
      tensorParallelism: string;
      concurrency: number;
      input_sequence_length: number;
      output_sequence_length: number;
    }>>);

    // Sort each group by x value for proper line connections
    Object.keys(groupedData).forEach(key => {
      groupedData[key].sort((a, b) => a.x - b.x);
    });

    // Convert to Nivo format - only include groups with data
    return Object.entries(groupedData)
      .filter(([, data]) => data.length > 0)
      .map(([id, data]) => ({
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
  ];

  // Y-axis options (limited set as requested)
  const yAxisMetrics = useMemo(() => [
    { value: 'output_token_throughput_tok_s', label: 'Output Token Throughput (tok/s)' },
    { value: 'tokens_per_second_per_dollar', label: 'Perf per dollar (tok/s/$)' },
    { value: 'ttft_mean_ms', label: 'Time to First Token - Mean (ms)' },
  ], []);

  // Ensure Y-axis metric is valid
  React.useEffect(() => {
    const validYMetrics = yAxisMetrics.map(m => m.value);
    if (!validYMetrics.includes(yMetric)) {
      setYMetric('output_token_throughput_tok_s'); // Reset to default if current value is invalid
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

  // Chip style with no background
  const softBlueChipSx = {
    bgcolor: 'transparent',
    color: 'text.primary',
    fontWeight: 600,
    borderRadius: 1,
    fontSize: 12,
  };

  // Show loading spinner only for initial discovery (model dropdown)
  if (discoveryLoading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress />
        <Typography>Loading available models...</Typography>
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
        flexDirection: 'column',
        gap: { xs: 1, md: 2 },
        p: { xs: 1, md: 2 },
        pb: { xs: 3, md: 2 },
        borderBottom: 1,
        borderColor: 'divider',
        overflow: 'hidden',
        minWidth: 0
      }}>
        {/* Top Row: Model and Filters Label */}
        <Box sx={{
          display: 'flex',
          gap: { xs: 1, md: 2 },
          alignItems: 'center',
          flexWrap: 'nowrap'
        }}>
          {/* Primary Model Selector */}
          <FormControl size="small" variant="outlined" sx={{
            minWidth: { xs: 120, md: 180 },
            maxWidth: { xs: 140, md: 220 }
          }}>
            <InputLabel sx={{ fontSize: { xs: 10, md: 12 } }}>Model</InputLabel>
            <Select
              value={selectedModel}
              label="Model"
              onChange={(e) => setSelectedModel(e.target.value)}
              sx={{ fontSize: { xs: 10, md: 12 }, height: { xs: 24, md: 32 } }}
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

          {/* Filters Label */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: { xs: 'pointer', md: 'default' },
            gap: 0.5,
            px: { xs: 1, md: 0 },
            py: { xs: 0.5, md: 0 },
            borderRadius: { xs: 1, md: 0 },
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: { xs: 'action.hover', md: 'transparent' },
              transform: { xs: 'scale(1.02)', md: 'none' }
            },
            '&:active': {
              backgroundColor: { xs: 'action.selected', md: 'transparent' },
              transform: { xs: 'scale(0.98)', md: 'none' }
            }
          }}
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}>
            <Typography variant="h6" sx={{
              fontSize: { xs: 14, md: 16 },
              fontWeight: 600,
              lineHeight: 1,
              transition: 'color 0.2s ease',
              color: { xs: isFiltersOpen ? 'primary.main' : 'text.primary', md: 'text.primary' }
            }}>
              Filters:
            </Typography>
            <Typography sx={{
              fontSize: { xs: 10, md: 12 },
              display: { xs: 'block', md: 'none' },
              transform: isFiltersOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              lineHeight: 1,
              color: isFiltersOpen ? 'primary.main' : 'text.secondary'
            }}>
              ▼
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Typography variant="body2" color="text.secondary" sx={{
            fontSize: { xs: 9, md: 12 },
            flexShrink: 1,
            textAlign: 'right',
            lineHeight: 1.2,
            display: { xs: 'none', sm: 'block' }
          }}>
            {activeTab === 0
              ? `${tableFilteredData.length} of ${modelData?.length || 0} results`
              : `Showing ${Math.min(page * rowsPerPage + 1, tableData.length)}-${Math.min((page + 1) * rowsPerPage, tableData.length)} of ${tableData.length} results`
            }
          </Typography>
        </Box>

        {/* Filter Controls Row */}
        <Box sx={{
          display: { xs: isFiltersOpen ? 'flex' : 'none', md: 'flex' },
          gap: { xs: 0.5, md: 2 },
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Tensor Parallelism Filter */}
          <FormControl size="small" sx={{ minWidth: { xs: 90, md: 150 } }}>
            <InputLabel sx={{ fontSize: { xs: 10, md: 12 } }}>Tensor Parallelism</InputLabel>
            <Select
              multiple
              value={filters.tensorParallelisms}
              onChange={handleMultiSelectChange('tensorParallelisms')}
              input={<OutlinedInput label="Tensor Parallelism" />}
              sx={{ fontSize: { xs: 10, md: 12 }, height: { xs: 24, md: 32 } }}
              renderValue={(selected) => (
                selected.length > 1
                  ? `${selected.length} selected`
                  : selected.length === 1
                    ? <Chip key={selected[0]} label={`TP:${selected[0]}`} size="small" sx={softBlueChipSx} />
                    : null
              )}
            >
              {filterOptions.tensorParallelisms.map((tp) => (
                <MenuItem key={tp} value={tp} sx={{ py: 0.5 }}>
                  <Checkbox checked={filters.tensorParallelisms.includes(tp)} size="small" />
                  <Box sx={{
                    ml: 1,
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    bgcolor: filters.tensorParallelisms.includes(tp) ? 'primary.main' : 'grey.100',
                    color: filters.tensorParallelisms.includes(tp) ? 'white' : 'text.primary',
                    fontSize: 12,
                    fontWeight: 500,
                    minWidth: 'fit-content'
                  }}>
                    TP:{tp}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Chip Filter */}
          <FormControl size="small" sx={{ minWidth: { xs: 90, md: 150 } }}>
            <InputLabel sx={{ fontSize: { xs: 10, md: 12 } }}>Chips</InputLabel>
            <Select
              multiple
              value={filters.chips}
              onChange={handleMultiSelectChange('chips')}
              input={<OutlinedInput label="Chips" />}
              sx={{ fontSize: { xs: 10, md: 12 }, height: { xs: 24, md: 32 } }}
              renderValue={(selected) => (
                selected.length > 1
                  ? `${selected.length} selected`
                  : selected.length === 1
                    ? <Chip key={selected[0]} label={selected[0]} size="small" sx={softBlueChipSx} />
                    : null
              )}
            >
              {filterOptions.chips.map((chip) => (
                <MenuItem key={chip} value={chip} sx={{ py: 0.5 }}>
                  <Checkbox checked={filters.chips.includes(chip)} size="small" />
                  <Box sx={{
                    ml: 1,
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    bgcolor: filters.chips.includes(chip) ? 'primary.main' : 'grey.100',
                    color: filters.chips.includes(chip) ? 'white' : 'text.primary',
                    fontSize: 12,
                    fontWeight: 500,
                    minWidth: 'fit-content'
                  }}>
                    {chip}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Precision Filter */}
          <FormControl size="small" sx={{ minWidth: { xs: 90, md: 150 } }}>
            <InputLabel sx={{ fontSize: { xs: 10, md: 12 } }}>Precisions</InputLabel>
            <Select
              multiple
              value={filters.precisions}
              onChange={handleMultiSelectChange('precisions')}
              input={<OutlinedInput label="Precisions" />}
              sx={{ fontSize: { xs: 10, md: 12 }, height: { xs: 24, md: 32 } }}
              renderValue={(selected) => (
                selected.length > 1
                  ? `${selected.length} selected`
                  : selected.length === 1
                    ? <Chip key={selected[0]} label={selected[0]} size="small" sx={softBlueChipSx} />
                    : null
              )}
            >
              {filterOptions.precisions.map((precision) => (
                <MenuItem key={precision} value={precision} sx={{ py: 0.5 }}>
                  <Checkbox checked={filters.precisions.includes(precision)} size="small" />
                  <Box sx={{
                    ml: 1,
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    bgcolor: filters.precisions.includes(precision) ? 'primary.main' : 'grey.100',
                    color: filters.precisions.includes(precision) ? 'white' : 'text.primary',
                    fontSize: 12,
                    fontWeight: 500,
                    minWidth: 'fit-content'
                  }}>
                    {precision}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: { xs: 'pointer', md: 'default' },
                  mb: { xs: 0.5, md: 1 }
                }}
                  onClick={() => setIsChartConfigOpen(!isChartConfigOpen)}>
                  <Typography variant="h6" sx={{
                    fontSize: { xs: 12, md: 14 },
                    fontWeight: 600,
                    display: { xs: 'block', md: 'block' }
                  }}>
                    Chart Configuration
                  </Typography>
                  <Typography sx={{
                    fontSize: { xs: 12, md: 14 },
                    display: { xs: 'block', md: 'none' },
                    transform: isChartConfigOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}>
                    ▼
                  </Typography>
                </Box>

                <Box sx={{
                  display: { xs: isChartConfigOpen ? 'flex' : 'none', md: 'flex' },
                  flexDirection: 'column',
                  gap: { xs: 1, md: 2 }
                }}>
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

                  <Box sx={{
                    mt: { xs: 1.5, md: 2 },
                    pt: { xs: 1.5, md: 2 },
                    borderTop: 1,
                    borderColor: 'divider'
                  }}>
                    <Typography variant="body2" sx={{ fontSize: { xs: 10, md: 11 }, color: 'text.secondary', fontStyle: 'italic', textAlign: 'center' }}>
                      *Note: All GPU pricing data can be found{' '}
                      <a
                        href="https://github.com/Herdora/chipbenchmark/tree/main/frontend/public/data/pricing"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#1976d2',
                          textDecoration: 'underline'
                        }}
                      >
                        in the repository
                      </a>
                    </Typography>
                  </Box>
                </Box>
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
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {loading ? (
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 2,
                    height: '100%',
                    width: '100%'
                  }}>
                    <CircularProgress />
                    <Typography>Loading benchmark data...</Typography>
                  </Box>
                ) : (
                  chartData.length === 0 || chartData.every(series => series.data.length === 0) ? (
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
                    <Box sx={{ width: '100%', height: '100%', minHeight: { xs: '300px', md: '400px' }, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ flex: 1, position: 'relative' }}>
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
                          legends={[]}
                          tooltip={({ point }: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                            <ChartTooltip
                              point={point}
                              xMetric={xMetric}
                              yMetric={yMetric}
                              selectedModel={selectedModel}
                            />
                          )}
                        />
                        {/* Custom Legend Box - Desktop Only */}
                        <Box sx={{
                          position: 'absolute',
                          right: 16,
                          bottom: 80,
                          zIndex: 10,
                          bgcolor: 'background.paper',
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          boxShadow: 2,
                          px: 2,
                          py: 1,
                          minWidth: 120,
                          maxWidth: 220,
                          fontSize: 12,
                          display: { xs: 'none', md: 'block' }
                        }}>
                          {chartData.map((series, idx) => (
                            <Box key={series.id} sx={{
                              display: 'flex',
                              alignItems: 'center',
                              mb: idx !== chartData.length - 1 ? 0.5 : 0
                            }}>
                              <Box sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor: customColors[idx % customColors.length],
                                mr: 1,
                                flexShrink: 0
                              }} />
                              <Typography sx={{
                                fontSize: 12,
                                color: 'text.primary',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {series.id}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>

                      {/* Custom Legend Box - Mobile Only (Bottom) */}
                      <Box sx={{
                        display: { xs: 'grid', md: 'none' },
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: 1,
                        mt: 2,
                        p: 2,
                        bgcolor: 'background.paper',
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        boxShadow: 1
                      }}>
                        {chartData.map((series, idx) => (
                          <Box key={series.id} sx={{
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            <Box sx={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              bgcolor: customColors[idx % customColors.length],
                              mr: 1,
                              flexShrink: 0
                            }} />
                            <Typography sx={{
                              fontSize: 11,
                              color: 'text.primary',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              lineHeight: 1.2
                            }}>
                              {series.id}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )
                )}
              </Box>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
            {loading ? (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 2,
                height: '100%',
                width: '100%'
              }}>
                <CircularProgress />
                <Typography>Loading benchmark data...</Typography>
              </Box>
            ) : (
              <>
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
                          <TableCell sx={{ fontSize: 11 }}>{row.output_token_throughput_tok_s.toFixed(2)}</TableCell>
                          <TableCell sx={{ fontSize: 11 }}>{row.ttft_mean_ms.toFixed(2)}</TableCell>
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
                      fontSize: { xs: 11, md: 12 }
                    }
                  }}
                />
              </>
            )}
          </Box>
        </TabPanel>
      </Box>

      {/* Mobile bottom filler bar to reduce chart height */}
      <Box sx={{
        display: { xs: 'block', md: 'none' },
        height: { xs: 20, sm: 16 },
        backgroundColor: 'background.default',
        borderTop: 1,
        borderColor: 'divider',
        flexShrink: 0
      }} />
    </Box>
  );
}
