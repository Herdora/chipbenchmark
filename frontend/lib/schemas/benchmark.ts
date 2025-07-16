import { z } from 'zod';

// Core timing metrics schema
export const TimingMetricsSchema = z.object({
  mean_ms: z.number(),
  median_ms: z.number(),
  p99_ms: z.number(),
});

// Complete metrics schema
export const MetricsSchema = z.object({
  successful_requests: z.number(),
  benchmark_duration_s: z.number(),
  total_input_tokens: z.number(),
  total_generated_tokens: z.number(),
  request_throughput_req_s: z.number(),
  output_token_throughput_tok_s: z.number(),
  total_token_throughput_tok_s: z.number(),
  ttft: TimingMetricsSchema,
  tpot: TimingMetricsSchema,
  itl: TimingMetricsSchema,
  e2el: TimingMetricsSchema,
});

// Individual benchmark data point schema
export const BenchmarkDataPointSchema = z.object({
  timestamp: z.string(),
  config: z.string().optional(),
  model: z.string(),
  input_sequence_length: z.number(),
  output_sequence_length: z.number(),
  concurrency: z.number(),
  metrics: MetricsSchema,
});

// Schema for the data.json file (array of benchmark data points)
export const BenchmarkDataFileSchema = z.array(BenchmarkDataPointSchema);

// Enhanced benchmark result with computed fields for frontend
export const BenchmarkResultSchema = z.object({
  timestamp: z.string(),
  model: z.string(),
  tensorParallelism: z.string(),
  chip: z.string(),
  precision: z.string(),
  input_sequence_length: z.number(),
  output_sequence_length: z.number(),
  concurrency: z.number(),
  io_config: z.string(),

  // Performance metrics
  output_token_throughput_tok_s: z.number(),
  request_throughput_req_s: z.number(),
  total_token_throughput_tok_s: z.number(),

  // Timing metrics
  ttft_mean_ms: z.number(),
  ttft_median_ms: z.number(),
  ttft_p99_ms: z.number(),

  tpot_mean_ms: z.number(),
  tpot_median_ms: z.number(),
  tpot_p99_ms: z.number(),

  itl_mean_ms: z.number(),
  itl_median_ms: z.number(),
  itl_p99_ms: z.number(),

  e2el_mean_ms: z.number(),
  e2el_median_ms: z.number(),
  e2el_p99_ms: z.number(),

  // Raw metrics for advanced analysis
  successful_requests: z.number(),
  benchmark_duration_s: z.number(),
  total_input_tokens: z.number(),
  total_generated_tokens: z.number(),
});

// Schema for benchmark index file
export const BenchmarkIndexSchema = z.object({
  lastUpdated: z.string(),
  benchmarks: z.array(
    z.object({
      model: z.string(),
      tensorParallelism: z.string(),
      chip: z.string(),
      precision: z.string(),
      dataPoints: z.number(),
      path: z.string(),
      hasHardwareData: z.boolean(),
    })
  ),
});

// Schema for individual benchmark metadata
export const BenchmarkMetadataSchema = z.object({
    model: z.string(),
  tensorParallelism: z.string(),
    chip: z.string(),
    precision: z.string(),
  dataPoints: z.number(),
  path: z.string(),
  hasHardwareData: z.boolean(),
});

// Filter state schema
export const FilterStateSchema = z.object({
  models: z.array(z.string()).optional(),
  tensorParallelisms: z.array(z.string()).optional(),
  chips: z.array(z.string()).optional(),
  precisions: z.array(z.string()).optional(),
  concurrencies: z.array(z.number()).optional(),
  ioConfigs: z.array(z.string()).optional(),
});

// Chart configuration schema
export const ChartConfigSchema = z.object({
  xAxis: z.string(),
  yAxis: z.string(),
  groupBy: z.string().optional(),
  filters: FilterStateSchema.optional(),
});

// Constants for validation and UI
export const SUPPORTED_MODELS = [
  'Llama-3.1-8B-Instruct',
  'Llama-3.1-70B-Instruct',
  'Llama-3-70B-Instruct',
  'Llama-4-Scout-17B-16E',
  'Qwen2-7B',
  'Qwen3-14B',
] as const;

export const SUPPORTED_TENSOR_PARALLELISMS = [
  '1', '2', '4', '8'
] as const;

export const SUPPORTED_CHIPS = [
  'H100', 'MI300X', 'A100', 'L40S'
] as const;

export const SUPPORTED_PRECISIONS = [
  'BF16', 'FP8', 'FP16', 'INT8'
] as const;

export const COMMON_CONCURRENCY_VALUES = [1, 64, 128, 256] as const;

export const CHART_METRICS = {
  'output_token_throughput_tok_s': 'Output Token Throughput (tok/s)',
  'request_throughput_req_s': 'Request Throughput (req/s)',
  'total_token_throughput_tok_s': 'Total Token Throughput (tok/s)',
  'ttft_mean_ms': 'Time to First Token - Mean (ms)',
  'ttft_median_ms': 'Time to First Token - Median (ms)',
  'ttft_p99_ms': 'Time to First Token - P99 (ms)',
  'tpot_mean_ms': 'Time Per Output Token - Mean (ms)',
  'tpot_median_ms': 'Time Per Output Token - Median (ms)',
  'tpot_p99_ms': 'Time Per Output Token - P99 (ms)',
  'itl_mean_ms': 'Inter-Token Latency - Mean (ms)',
  'itl_median_ms': 'Inter-Token Latency - Median (ms)',
  'itl_p99_ms': 'Inter-Token Latency - P99 (ms)',
  'e2el_mean_ms': 'End-to-End Latency - Mean (ms)',
  'e2el_median_ms': 'End-to-End Latency - Median (ms)',
  'e2el_p99_ms': 'End-to-End Latency - P99 (ms)',
} as const;

// Export types
export type TimingMetrics = z.infer<typeof TimingMetricsSchema>;
export type Metrics = z.infer<typeof MetricsSchema>;
export type BenchmarkDataPoint = z.infer<typeof BenchmarkDataPointSchema>;
export type BenchmarkDataFile = z.infer<typeof BenchmarkDataFileSchema>;
export type BenchmarkResult = z.infer<typeof BenchmarkResultSchema>;
export type BenchmarkIndex = z.infer<typeof BenchmarkIndexSchema>;
export type BenchmarkMetadata = z.infer<typeof BenchmarkMetadataSchema>;
export type FilterState = z.infer<typeof FilterStateSchema>;
export type ChartConfig = z.infer<typeof ChartConfigSchema>;

// Additional type exports
export type ModelName = string;
export type TensorParallelismValue = string;
export type ChipName = string;
export type PrecisionType = string;
export type ConcurrencyValue = typeof COMMON_CONCURRENCY_VALUES[number];
export type MetricKey = keyof typeof CHART_METRICS;

// Validation functions
/**
 * Validates and parses a raw benchmark data file
 */
export function validateDataFile(data: unknown): BenchmarkDataFile {
  try {
    return BenchmarkDataFileSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid benchmark data file format: ${error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ')}`
      );
    }
    throw error;
  }
}

/**
 * Validates and parses a benchmark index file
 */
export function validateIndex(data: unknown): BenchmarkIndex {
  try {
    return BenchmarkIndexSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid benchmark index format: ${error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ')}`
      );
    }
    throw error;
  }
}

/**
 * Validates and parses benchmark metadata
 */
export function validateMetadata(data: unknown): BenchmarkMetadata {
  try {
    return BenchmarkMetadataSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid benchmark metadata format: ${error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ')}`
      );
    }
    throw error;
  }
}

/**
 * Validates and parses a benchmark result
 */
export function validateBenchmarkResult(data: unknown): BenchmarkResult {
  try {
    return BenchmarkResultSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid benchmark result format: ${error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ')}`
      );
    }
    throw error;
  }
}

/**
 * Type guard for model names
 */
export function isValidModel(value: string): value is ModelName {
  return SUPPORTED_MODELS.includes(value as ModelName);
}

/**
 * Type guard for tensor parallelism values
 */
export function isValidTensorParallelism(value: string): value is TensorParallelismValue {
  return SUPPORTED_TENSOR_PARALLELISMS.includes(value as TensorParallelismValue);
}

/**
 * Type guard for chip names
 */
export function isValidChip(value: string): value is ChipName {
  return SUPPORTED_CHIPS.includes(value as ChipName);
}

/**
 * Type guard for precision types
 */
export function isValidPrecision(value: string): value is PrecisionType {
  return SUPPORTED_PRECISIONS.includes(value as PrecisionType);
}

/**
 * Type guard for metric keys
 */
export function isValidMetricKey(value: string): value is MetricKey {
  return value in CHART_METRICS;
}

// Data transformation functions
/**
 * Converts a raw benchmark data point to frontend format
 */
export function convertToFrontendFormat(
  dataPoint: BenchmarkDataPoint,
  tensorParallelism: string,
  chip: string,
  precision: string
): BenchmarkResult {
  const ioConfig = formatIoConfig(
    dataPoint.input_sequence_length,
    dataPoint.output_sequence_length
  );

  return {
    timestamp: dataPoint.timestamp,
    model: dataPoint.model,
    tensorParallelism,
    chip,
    precision,
    input_sequence_length: dataPoint.input_sequence_length,
    output_sequence_length: dataPoint.output_sequence_length,
    concurrency: dataPoint.concurrency,
    io_config: ioConfig,

    // Performance metrics
    output_token_throughput_tok_s: dataPoint.metrics.output_token_throughput_tok_s,
    request_throughput_req_s: dataPoint.metrics.request_throughput_req_s,
    total_token_throughput_tok_s: dataPoint.metrics.total_token_throughput_tok_s,

    // TTFT metrics
    ttft_mean_ms: dataPoint.metrics.ttft.mean_ms,
    ttft_median_ms: dataPoint.metrics.ttft.median_ms,
    ttft_p99_ms: dataPoint.metrics.ttft.p99_ms,

    // TPOT metrics
    tpot_mean_ms: dataPoint.metrics.tpot.mean_ms,
    tpot_median_ms: dataPoint.metrics.tpot.median_ms,
    tpot_p99_ms: dataPoint.metrics.tpot.p99_ms,

    // ITL metrics
    itl_mean_ms: dataPoint.metrics.itl.mean_ms,
    itl_median_ms: dataPoint.metrics.itl.median_ms,
    itl_p99_ms: dataPoint.metrics.itl.p99_ms,

    // E2EL metrics
    e2el_mean_ms: dataPoint.metrics.e2el.mean_ms,
    e2el_median_ms: dataPoint.metrics.e2el.median_ms,
    e2el_p99_ms: dataPoint.metrics.e2el.p99_ms,

    // Raw metrics
    successful_requests: dataPoint.metrics.successful_requests,
    benchmark_duration_s: dataPoint.metrics.benchmark_duration_s,
    total_input_tokens: dataPoint.metrics.total_input_tokens,
    total_generated_tokens: dataPoint.metrics.total_generated_tokens,
  };
}

/**
 * Gets a human-readable label for a metric
 */
export function getMetricLabel(metric: string): string {
  return CHART_METRICS[metric as MetricKey] || metric;
}

/**
 * Formats input/output sequence lengths into a readable string
 */
export function formatIoConfig(input: number, output: number): string {
  return `${input}:${output}`;
}

/**
 * Parses an IO configuration string back to input/output lengths
 */
export function parseIoConfig(ioConfig: string): { input: number; output: number; } | null {
  const parts = ioConfig.split(':');
  if (parts.length !== 2) return null;

  const input = parseInt(parts[0], 10);
  const output = parseInt(parts[1], 10);

  if (isNaN(input) || isNaN(output)) return null;

  return { input, output };
}

/**
 * Creates a unique key for a benchmark result
 */
export function createBenchmarkKey(result: BenchmarkResult): string {
  return `${result.model}/${result.tensorParallelism}/${result.chip}/${result.precision}/${result.io_config}/${result.concurrency}`;
}

/**
 * Groups benchmark results by a key function
 */
export function groupBenchmarkResults<T extends string>(
  results: BenchmarkResult[],
  keyFn: (result: BenchmarkResult) => T
): Record<T, BenchmarkResult[]> {
  const grouped = {} as Record<T, BenchmarkResult[]>;

  for (const result of results) {
    const key = keyFn(result);
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(result);
  }

  return grouped;
}

/**
 * Filters benchmark results based on provided filters
 */
export function filterBenchmarkResults(
  results: BenchmarkResult[],
  filters: {
    models?: string[];
    tensorParallelisms?: string[];
    chips?: string[];
    precisions?: string[];
    concurrencies?: number[];
    ioConfigs?: string[];
  }
): BenchmarkResult[] {
  if (!results || !Array.isArray(results)) {
    return [];
  }
  
  return results.filter(result => {
    if (filters.models && !filters.models.includes(result.model)) return false;
    if (filters.tensorParallelisms && !filters.tensorParallelisms.includes(result.tensorParallelism)) return false;
    if (filters.chips && !filters.chips.includes(result.chip)) return false;
    if (filters.precisions && !filters.precisions.includes(result.precision)) return false;
    if (filters.concurrencies && !filters.concurrencies.includes(result.concurrency)) return false;
    if (filters.ioConfigs && !filters.ioConfigs.includes(result.io_config)) return false;
    return true;
  });
} 