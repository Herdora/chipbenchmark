import { z } from 'zod';

export const BenchmarkResultSchema = z.object({
  model: z.string().min(1, 'Model name is required'),
  chip: z.string().min(1, 'Chip name is required'),
  precision: z.enum(['FP16', 'FP32', 'INT8', 'INT4']),
  batch_size: z.number().positive('Batch size must be positive'),
  concurrency: z.number().positive('Concurrency must be positive'),
  ttft_ms: z.number().positive('TTFT must be positive'),
  tps: z.number().positive('TPS must be positive'),
  power_w_avg: z.number().positive('Power must be positive'),
  timestamp: z.string().datetime('Invalid timestamp format'),
  // Mock fields for interactive charts
  input_length: z.number().int().nonnegative().default(0),
  output_length: z.number().int().nonnegative().default(0)
});

export const BenchmarkIndexSchema = z.array(BenchmarkResultSchema);

export type BenchmarkResult = z.infer<typeof BenchmarkResultSchema>;
export type BenchmarkIndex = z.infer<typeof BenchmarkIndexSchema>;

// Helper function to validate a single result
export function validateResult(data: unknown): BenchmarkResult {
  return BenchmarkResultSchema.parse(data);
}

// Helper function to validate the entire index
export function validateIndex(data: unknown): BenchmarkIndex {
  return BenchmarkIndexSchema.parse(data);
} 