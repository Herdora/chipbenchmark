import { z } from 'zod';

// =============================================================================
// CONSTANTS AND ENUMS
// =============================================================================

// Available models, chips, and precisions are now loaded dynamically
// These will be populated from the API
export let AVAILABLE_MODELS: string[] = [];
export let AVAILABLE_CHIPS: string[] = [];
export let AVAILABLE_PRECISIONS: string[] = [];

// Common concurrency values used in benchmarks
export const COMMON_CONCURRENCY_VALUES = [1, 5, 100, 200] as const;

// Common I/O sequence lengths
export const COMMON_IO_LENGTHS = [200, 500, 1000] as const;

// Chart metric options
export const CHART_METRICS = {
  concurrency: 'Concurrency',
  tps: 'Throughput (TPS)',
  ttft_ms: 'Time to First Token (ms)',
  successful_requests: 'Successful Requests',
  request_throughput: 'Request Throughput',
  total_token_throughput: 'Total Token Throughput',
  power_w_avg: 'Power (W)',
} as const;

// =============================================================================
// CORE SCHEMAS
// =============================================================================

// Schema for timing metrics (TTFT, TPOT, ITL, E2EL)
export const TimingMetricsSchema = z.object({
  mean_ms: z.number(),
  median_ms: z.number(),
  p99_ms: z.number()
});

// Schema for the complete metrics object
export const MetricsSchema = z.object({
  successful_requests: z.number().int().min(0),
  benchmark_duration_s: z.number().positive(),
  total_input_tokens: z.number().int().min(0),
  total_generated_tokens: z.number().int().min(0),
  request_throughput_req_s: z.number().min(0),
  output_token_throughput_tok_s: z.number().min(0),
  total_token_throughput_tok_s: z.number().min(0),
  ttft: TimingMetricsSchema,  // Time to First Token
  tpot: TimingMetricsSchema,  // Time Per Output Token
  itl: TimingMetricsSchema,   // Inter-Token Latency
  e2el: TimingMetricsSchema   // End-to-End Latency
});

// Schema for individual benchmark data points (raw format)
export const BenchmarkDataPointSchema = z.object({
  timestamp: z.string().datetime(),
  config: z.string().optional(),
  model: z.string().min(1),
  input_sequence_length: z.number().int().positive(),
  output_sequence_length: z.number().int().positive(),
  concurrency: z.number().int().positive(),
  metrics: MetricsSchema
});

// Schema for the entire data file (array of data points)
export const BenchmarkDataFileSchema = z.array(BenchmarkDataPointSchema);

// Schema for processed results (flattened for frontend use)
export const BenchmarkResultSchema = z.object({
  // Identifiers
  model: z.string().min(1),
  chip: z.string().min(1),
  precision: z.string().min(1),

  // Configuration
  concurrency: z.number().int().positive(),
  input_sequence_length: z.number().int().positive(),
  output_sequence_length: z.number().int().positive(),
  timestamp: z.string().datetime(),

  // Core metrics (flattened for easier access)
  tps: z.number().min(0), // output_token_throughput_tok_s
  ttft_ms: z.number().min(0), // ttft.mean_ms
  successful_requests: z.number().int().min(0),
  request_throughput: z.number().min(0),
  total_token_throughput: z.number().min(0),

  // Optional metrics
  power_w_avg: z.number().min(0).optional(),

  // Extended timing metrics (optional for backward compatibility)
  ttft_median_ms: z.number().min(0).optional(),
  ttft_p99_ms: z.number().min(0).optional(),
  tpot_mean_ms: z.number().min(0).optional(),
  tpot_median_ms: z.number().min(0).optional(),
  tpot_p99_ms: z.number().min(0).optional(),
  itl_mean_ms: z.number().min(0).optional(),
  itl_median_ms: z.number().min(0).optional(),
  itl_p99_ms: z.number().min(0).optional(),
  e2el_mean_ms: z.number().min(0).optional(),
  e2el_median_ms: z.number().min(0).optional(),
  e2el_p99_ms: z.number().min(0).optional(),
});

// Schema for benchmark index file
export const BenchmarkIndexSchema = z.array(BenchmarkResultSchema);

// Schema for benchmark metadata
export const BenchmarkMetadataSchema = z.object({
  lastUpdated: z.string().datetime(),
  benchmarks: z.array(z.object({
    model: z.string(),
    chip: z.string(),
    precision: z.string(),
    dataPoints: z.number().int().min(0),
    path: z.string()
  }))
});

// Schema for filter state
export const FilterStateSchema = z.object({
  chips: z.array(z.string()),
  precisions: z.array(z.string())
});

// Schema for chart configuration
export const ChartConfigSchema = z.object({
  xMetric: z.string(),
  yMetric: z.string(),
  ioConfig: z.string()
});

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type TimingMetrics = z.infer<typeof TimingMetricsSchema>;
export type Metrics = z.infer<typeof MetricsSchema>;
export type BenchmarkDataPoint = z.infer<typeof BenchmarkDataPointSchema>;
export type BenchmarkDataFile = z.infer<typeof BenchmarkDataFileSchema>;
export type BenchmarkResult = z.infer<typeof BenchmarkResultSchema>;
export type BenchmarkIndex = z.infer<typeof BenchmarkIndexSchema>;
export type BenchmarkMetadata = z.infer<typeof BenchmarkMetadataSchema>;
export type FilterState = z.infer<typeof FilterStateSchema>;
export type ChartConfig = z.infer<typeof ChartConfigSchema>;

// Utility types
export type ModelName = string;
export type ChipName = string;
export type PrecisionType = string;
export type ConcurrencyValue = typeof COMMON_CONCURRENCY_VALUES[number];
export type MetricKey = keyof typeof CHART_METRICS;

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validates a raw benchmark data file
 */
export function validateDataFile(data: unknown): BenchmarkDataFile {
  try {
    return BenchmarkDataFileSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid benchmark data file: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Validates a benchmark index
 */
export function validateIndex(data: unknown): BenchmarkIndex {
  try {
    return BenchmarkIndexSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid benchmark index: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Validates benchmark metadata
 */
export function validateMetadata(data: unknown): BenchmarkMetadata {
  try {
    return BenchmarkMetadataSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid benchmark metadata: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Validates a single benchmark result
 */
export function validateBenchmarkResult(data: unknown): BenchmarkResult {
  try {
    return BenchmarkResultSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid benchmark result: ${error.message}`);
    }
    throw error;
  }
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard to check if a value is a valid model name
 */
export function isValidModel(value: string): value is ModelName {
  return AVAILABLE_MODELS.includes(value);
}

/**
 * Type guard to check if a value is a valid chip name
 */
export function isValidChip(value: string): value is ChipName {
  return AVAILABLE_CHIPS.includes(value);
}

/**
 * Type guard to check if a value is a valid precision type
 */
export function isValidPrecision(value: string): value is PrecisionType {
  return AVAILABLE_PRECISIONS.includes(value);
}

/**
 * Type guard to check if a value is a valid metric key
 */
export function isValidMetricKey(value: string): value is MetricKey {
  return value in CHART_METRICS;
}

// =============================================================================
// CONVERSION FUNCTIONS
// =============================================================================

/**
 * Converts raw benchmark data point to frontend format
 */
export function convertToFrontendFormat(
  dataPoint: BenchmarkDataPoint,
  chip: string,
  precision: string
): BenchmarkResult {
  return {
    // Identifiers
    model: dataPoint.model,
    chip: chip,
    precision: precision,

    // Configuration
    concurrency: dataPoint.concurrency,
    input_sequence_length: dataPoint.input_sequence_length,
    output_sequence_length: dataPoint.output_sequence_length,
    timestamp: dataPoint.timestamp,

    // Core metrics
    tps: dataPoint.metrics.output_token_throughput_tok_s,
    ttft_ms: dataPoint.metrics.ttft.mean_ms,
    successful_requests: dataPoint.metrics.successful_requests,
    request_throughput: dataPoint.metrics.request_throughput_req_s,
    total_token_throughput: dataPoint.metrics.total_token_throughput_tok_s,

    // Extended timing metrics
    ttft_median_ms: dataPoint.metrics.ttft.median_ms,
    ttft_p99_ms: dataPoint.metrics.ttft.p99_ms,
    tpot_mean_ms: dataPoint.metrics.tpot.mean_ms,
    tpot_median_ms: dataPoint.metrics.tpot.median_ms,
    tpot_p99_ms: dataPoint.metrics.tpot.p99_ms,
    itl_mean_ms: dataPoint.metrics.itl.mean_ms,
    itl_median_ms: dataPoint.metrics.itl.median_ms,
    itl_p99_ms: dataPoint.metrics.itl.p99_ms,
    e2el_mean_ms: dataPoint.metrics.e2el.mean_ms,
    e2el_median_ms: dataPoint.metrics.e2el.median_ms,
    e2el_p99_ms: dataPoint.metrics.e2el.p99_ms,

    // Optional metrics (not available in current data)
    power_w_avg: undefined,
  };
}

/**
 * Gets the display label for a metric key
 */
export function getMetricLabel(metric: string): string {
  if (isValidMetricKey(metric)) {
    return CHART_METRICS[metric];
  }

  // Fallback for custom or unknown metrics
  return metric.charAt(0).toUpperCase() + metric.slice(1).replace(/_/g, ' ');
}

/**
 * Formats an I/O configuration string
 */
export function formatIoConfig(input: number, output: number): string {
  return `${input}/${output}`;
}

/**
 * Parses an I/O configuration string
 */
export function parseIoConfig(ioConfig: string): { input: number; output: number; } | null {
  if (ioConfig === 'all') return null;

  const parts = ioConfig.split('/');
  if (parts.length !== 2) return null;

  const input = parseInt(parts[0], 10);
  const output = parseInt(parts[1], 10);

  if (isNaN(input) || isNaN(output)) return null;

  return { input, output };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Creates a unique key for a benchmark result
 */
export function createBenchmarkKey(result: BenchmarkResult): string {
  return `${result.model}-${result.chip}-${result.precision}-${result.input_sequence_length}-${result.output_sequence_length}-${result.concurrency}`;
}

/**
 * Groups benchmark results by a specified key
 */
export function groupBenchmarkResults<T extends string>(
  results: BenchmarkResult[],
  keyFn: (result: BenchmarkResult) => T
): Record<T, BenchmarkResult[]> {
  return results.reduce((acc, result) => {
    const key = keyFn(result);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(result);
    return acc;
  }, {} as Record<T, BenchmarkResult[]>);
}

/**
 * Filters benchmark results by various criteria
 */
export function filterBenchmarkResults(
  results: BenchmarkResult[],
  filters: {
    models?: string[];
    chips?: string[];
    precisions?: string[];
    concurrencies?: number[];
    ioConfigs?: string[];
  }
): BenchmarkResult[] {
  return results.filter(result => {
    if (filters.models && filters.models.length > 0 && !filters.models.includes(result.model)) {
      return false;
    }

    if (filters.chips && filters.chips.length > 0 && !filters.chips.includes(result.chip)) {
      return false;
    }

    if (filters.precisions && filters.precisions.length > 0 && !filters.precisions.includes(result.precision)) {
      return false;
    }

    if (filters.concurrencies && filters.concurrencies.length > 0 && !filters.concurrencies.includes(result.concurrency)) {
      return false;
    }

    if (filters.ioConfigs && filters.ioConfigs.length > 0) {
      const resultIoConfig = formatIoConfig(result.input_sequence_length, result.output_sequence_length);
      if (!filters.ioConfigs.includes(resultIoConfig)) {
        return false;
      }
    }

    return true;
  });
} 