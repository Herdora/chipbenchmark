'use client';

import { useState, useEffect } from 'react';
import {
  BenchmarkResult,
  BenchmarkIndex,
  BenchmarkDataFile,
  BenchmarkMetadata,
  validateIndex,
  validateDataFile,
  convertToFrontendFormat,
  filterBenchmarkResults
} from '@/lib/schemas/benchmark';

// Enhanced benchmark structure with tensor parallelism
interface BenchmarkStructure {
  model: string;
  tensorParallelism: string;
  chip: string;
  precision: string;
  hasData: boolean;
}

// Enhanced benchmark discovery
interface BenchmarkDiscovery {
  models: string[];
  tensorParallelisms: string[];
  chips: string[];
  precisions: string[];
  structure: BenchmarkStructure[];
}

/**
 * Hook for discovering available benchmark configurations
 */
export function useBenchmarkDiscovery() {
  const [discovery, setDiscovery] = useState<BenchmarkDiscovery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDiscovery = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/benchmarks');
        if (!response.ok) {
          throw new Error(`Failed to load benchmark index: ${response.statusText}`);
        }

        const rawIndex = await response.json();
        const index = validateIndex(rawIndex);

        // Extract unique values for filters
        const models = Array.from(new Set(index.benchmarks.map(b => b.model))).sort();
        const tensorParallelisms = Array.from(new Set(index.benchmarks.map(b => b.tensorParallelism))).sort();
        const chips = Array.from(new Set(index.benchmarks.map(b => b.chip))).sort();
        const precisions = Array.from(new Set(index.benchmarks.map(b => b.precision))).sort();

        // Create structure array
        const structure: BenchmarkStructure[] = index.benchmarks.map(b => ({
          model: b.model,
          tensorParallelism: b.tensorParallelism,
          chip: b.chip,
          precision: b.precision,
          hasData: b.dataPoints > 0
        }));

        setDiscovery({
          models,
          tensorParallelisms,
          chips,
          precisions,
          structure
        });
      } catch (err) {
        console.error('Error loading benchmark discovery:', err);
        setError(err instanceof Error ? err.message : 'Failed to load benchmark discovery');
      } finally {
        setLoading(false);
      }
    };

    loadDiscovery();
  }, []);

  return { discovery, loading, error };
}

/**
 * Load benchmark data for a specific configuration
 */
const loadBenchmarkDataFile = async (model: string, tensorParallelism: string, chip: string, precision: string): Promise<BenchmarkResult[]> => {
  const url = `/api/benchmarks/${encodeURIComponent(model)}/${encodeURIComponent(tensorParallelism)}/${encodeURIComponent(chip)}/${encodeURIComponent(precision)}/data.json`;

  const response = await fetch(url);
    if (!response.ok) {
    throw new Error(`Failed to load data for ${model}/${tensorParallelism}/${chip}/${precision}: ${response.statusText}`);
    }

  const rawData = await response.json();
  const dataFile = validateDataFile(rawData);

      // Convert to frontend format
  return dataFile.map(dataPoint =>
    convertToFrontendFormat(dataPoint, tensorParallelism, chip, precision)
  );
};

/**
 * Load all benchmark data from multiple configurations
 */
const loadAllBenchmarkData = async (structure: BenchmarkStructure[]): Promise<BenchmarkResult[]> => {
  const results: BenchmarkResult[] = [];

  for (const config of structure) {
    if (config.hasData) {
      try {
        const configResults = await loadBenchmarkDataFile(config.model, config.tensorParallelism, config.chip, config.precision);
        results.push(...configResults);
      } catch (error) {
        console.warn(`Failed to load data for ${config.model}/${config.tensorParallelism}/${config.chip}/${config.precision}:`, error);
      }
    }
  }

  return results;
};

/**
 * Hook for loading all benchmark data
 */
export function useBenchmarkData() {
  const [data, setData] = useState<BenchmarkResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { discovery, loading: discoveryLoading, error: discoveryError } = useBenchmarkDiscovery();

  useEffect(() => {
    if (discoveryLoading || !discovery) return;

    const loadAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        const results = await loadAllBenchmarkData(discovery.structure);
        setData(results);
      } catch (err) {
        console.error('Error loading benchmark data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load benchmark data');
      } finally {
      setLoading(false);
      }
    };

    loadAllData();
  }, [discovery, discoveryLoading]);

  return {
    data,
    loading: loading || discoveryLoading,
    error: error || discoveryError,
    discovery
  };
}

/**
 * Hook for loading benchmark data for a specific model
 */
export function useModelBenchmarkData(selectedModel: string) {
  const [data, setData] = useState<BenchmarkResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { discovery, loading: discoveryLoading, error: discoveryError } = useBenchmarkDiscovery();

  useEffect(() => {
    if (discoveryLoading || !discovery || !selectedModel) return;

    const loadModelData = async () => {
      try {
      setLoading(true);
        setError(null);

      // Filter structure for the selected model
        const modelStructure = discovery.structure.filter(s => s.model === selectedModel);

        const results = await loadAllBenchmarkData(modelStructure);
        setData(results);
      } catch (err) {
        console.error('Error loading model benchmark data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load model benchmark data');
      } finally {
        setLoading(false);
      }
    };

    loadModelData();
  }, [selectedModel, discovery, discoveryLoading]);

  return {
    data,
    loading: loading || discoveryLoading,
    error: error || discoveryError,
    discovery
  };
}

/**
 * Hook for filtering benchmark data
 */
export function useFilteredBenchmarkData(
  data: BenchmarkResult[],
  filters?: {
    models?: string[];
    tensorParallelisms?: string[];
    chips?: string[];
    precisions?: string[];
    concurrencies?: number[];
    ioConfigs?: string[];
  }
) {
  const [filteredData, setFilteredData] = useState<BenchmarkResult[]>([]);

  useEffect(() => {
    if (!data || !Array.isArray(data)) {
      setFilteredData([]);
      return;
    }

    if (!filters) {
      setFilteredData(data);
      return;
    }

    const filtered = filterBenchmarkResults(data, filters);
    setFilteredData(filtered);
  }, [data, filters]);

  return filteredData;
}

/**
 * Hook for extracting unique filter options from data
 */
export function useFilterOptions(data: BenchmarkResult[]) {
  const [options, setOptions] = useState({
    models: [] as string[],
    tensorParallelisms: [] as string[],
    chips: [] as string[],
    precisions: [] as string[],
    concurrencies: [] as number[],
    ioConfigs: [] as string[]
  });

  useEffect(() => {
    if (!data || !Array.isArray(data)) {
      setOptions({
        models: [],
        tensorParallelisms: [],
        chips: [],
        precisions: [],
        concurrencies: [],
        ioConfigs: []
      });
      return;
    }

    const models = Array.from(new Set(data.map(d => d.model))).sort();
    const tensorParallelisms = Array.from(new Set(data.map(d => d.tensorParallelism))).sort();
    const chips = Array.from(new Set(data.map(d => d.chip))).sort();
    const precisions = Array.from(new Set(data.map(d => d.precision))).sort();
    const concurrencies = Array.from(new Set(data.map(d => d.concurrency))).sort((a, b) => a - b);
    const ioConfigs = Array.from(new Set(data.map(d => d.io_config))).sort();

    setOptions({
      models,
      tensorParallelisms,
      chips,
      precisions,
      concurrencies,
      ioConfigs
    });
  }, [data]);

  return options;
}

/**
 * Hook for computing KPIs from benchmark data
 */
export function useBenchmarkKPIs(data: BenchmarkResult[]) {
  const [kpis, setKpis] = useState({
    maxThroughput: 0,
    avgLatency: 0,
    avgThroughput: 0,
    totalRequests: 0,
    avgPower: 0,
    totalConfigurations: 0,
    uniqueModels: 0
  });

  useEffect(() => {
    if (data.length === 0) {
      setKpis({ 
        maxThroughput: 0, 
        avgLatency: 0, 
        avgThroughput: 0,
        totalRequests: 0,
        avgPower: 0,
        totalConfigurations: 0, 
        uniqueModels: 0 
      });
      return;
    }

    const sum = (arr: number[]): number => arr.reduce((a, b) => a + b, 0);
    const avg = (arr: number[]): number => arr.length > 0 ? sum(arr) / arr.length : 0;

    const maxThroughput = Math.max(...data.map(d => d.output_token_throughput_tok_s));
    const avgLatency = avg(data.map(d => d.ttft_mean_ms));
    const avgThroughput = avg(data.map(d => d.output_token_throughput_tok_s));
    const totalRequests = sum(data.map(d => d.successful_requests));
    const avgPower = 0; // Power data not available in current schema
    const totalConfigurations = data.length;
    const uniqueModels = new Set(data.map(d => d.model)).size;

    setKpis({
      maxThroughput,
      avgLatency,
      avgThroughput,
      totalRequests,
      avgPower,
      totalConfigurations,
      uniqueModels
    });
  }, [data]);

  return kpis;
}