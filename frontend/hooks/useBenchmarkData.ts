'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  validateDataFile,
  convertToFrontendFormat,
  type BenchmarkResult,
  type BenchmarkDataFile,
  AVAILABLE_MODELS,
  AVAILABLE_CHIPS,
  AVAILABLE_PRECISIONS,
  filterBenchmarkResults
} from '@/lib/schemas/benchmark';

// Types for the benchmark discovery API
interface BenchmarkStructure {
  model: string;
  chip: string;
  precision: string;
  hasData: boolean;
}

interface BenchmarkDiscovery {
  models: string[];
  chips: string[];
  precisions: string[];
  structure: BenchmarkStructure[];
}

// Hook to load available benchmarks dynamically
export function useBenchmarkDiscovery() {
  const [discovery, setDiscovery] = useState<BenchmarkDiscovery | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDiscovery = async () => {
      try {
        const response = await fetch('/api/benchmarks');
        if (response.ok) {
          const data = await response.json();
          setDiscovery(data);

          // Update global constants
          AVAILABLE_MODELS.length = 0;
          AVAILABLE_MODELS.push(...data.models);
          AVAILABLE_CHIPS.length = 0;
          AVAILABLE_CHIPS.push(...data.chips);
          AVAILABLE_PRECISIONS.length = 0;
          AVAILABLE_PRECISIONS.push(...data.precisions);
        } else {
          console.error('Failed to load benchmark discovery');
          setDiscovery({ models: [], chips: [], precisions: [], structure: [] });
        }
      } catch (error) {
        console.error('Error loading benchmark discovery:', error);
        setDiscovery({ models: [], chips: [], precisions: [], structure: [] });
      } finally {
        setLoading(false);
      }
    };

    loadDiscovery();
  }, []);

  return { discovery, loading };
}

// Load benchmark data for a specific model/chip/precision combination
const loadBenchmarkDataFile = async (model: string, chip: string, precision: string): Promise<BenchmarkResult[]> => {
  try {
    const response = await fetch(`/api/benchmarks/${model}/${chip}/${precision}/data.json`);

    if (!response.ok) {
      console.warn(`Failed to load data for ${model}/${chip}/${precision}: ${response.status}`);
      return [];
    }

    const data = await response.json();

    try {
      const validatedData = validateDataFile(data);
      // Convert to frontend format
      return validatedData.map(dataPoint => convertToFrontendFormat(dataPoint, chip, precision));
    } catch (validationError) {
      console.error('Validation failed for', model, chip, precision, ':', validationError);
      // Try to convert raw data anyway
      return data.map((dataPoint: any) => convertToFrontendFormat(dataPoint, chip, precision));
    }
  } catch (error) {
    console.error(`Error loading benchmark data for ${model}/${chip}/${precision}:`, error);
    return [];
  }
};

// Load all available benchmark data using discovered structure
const loadAllBenchmarkData = async (structure: BenchmarkStructure[]): Promise<BenchmarkResult[]> => {
  const allData: BenchmarkResult[] = [];

  for (const item of structure) {
    if (item.hasData) {
      const data = await loadBenchmarkDataFile(item.model, item.chip, item.precision);
      allData.push(...data);
    }
  }

  return allData;
};

export function useBenchmarkData() {
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { discovery, loading: discoveryLoading } = useBenchmarkDiscovery();

  useEffect(() => {
    if (discoveryLoading || !discovery) return;

    loadAllBenchmarkData(discovery.structure).then(data => {
      setResults(data);
      setLoading(false);
    }).catch(error => {
      console.error('Error in data loading:', error);
      setResults([]);
      setLoading(false);
    });
  }, [discovery, discoveryLoading]);

  return { results, loading: loading || discoveryLoading };
}

// Hook for model-centric data loading
export function useModelBenchmarkData(selectedModel: string) {
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { discovery, loading: discoveryLoading } = useBenchmarkDiscovery();

  useEffect(() => {
    if (discoveryLoading || !discovery || !selectedModel) {
      setResults([]);
      setLoading(!selectedModel ? false : discoveryLoading);
      return;
    }

    const loadModelData = async () => {
      setLoading(true);
      const allData: BenchmarkResult[] = [];

      // Filter structure for the selected model
      const modelStructures = discovery.structure.filter(
        item => item.model === selectedModel && item.hasData
      );

      for (const item of modelStructures) {
        const data = await loadBenchmarkDataFile(item.model, item.chip, item.precision);
        allData.push(...data);
      }

      setResults(allData);
      setLoading(false);
    };

    loadModelData();
  }, [selectedModel, discovery, discoveryLoading]);

  return { results, loading: loading || discoveryLoading };
}

// Hook for filtering and computing derived data
export function useFilteredBenchmarkData(
  data: BenchmarkResult[],
  filters?: {
    chips?: string[];
    precisions?: string[];
    concurrencies?: number[];
  }
) {
  return useMemo(() => {
    if (!filters) return data;

    return filterBenchmarkResults(data, {
      chips: filters.chips,
      precisions: filters.precisions,
      concurrencies: filters.concurrencies
    });
  }, [data, filters]);
}

// Hook for getting available filter options from data
export function useFilterOptions(data: BenchmarkResult[]) {
  return useMemo(() => {
    const models = Array.from(new Set(data.map(d => d.model))).sort();
    const chips = Array.from(new Set(data.map(d => d.chip))).sort();
    const precisions = Array.from(new Set(data.map(d => d.precision))).sort();
    const concurrencies = Array.from(new Set(data.map(d => d.concurrency))).sort((a, b) => a - b);

    return { models, chips, precisions, concurrencies };
  }, [data]);
}

export function useBenchmarkKPIs(data: BenchmarkResult[]) {
  return useMemo(() => {
    if (data.length === 0) {
      return {
        avgThroughput: 0,
        avgLatency: 0,
        totalRequests: 0,
        avgPower: 0
      };
    }

    const sum = (arr: number[]): number => arr.reduce((a, b) => a + b, 0);
    const avg = (arr: number[]): number => arr.length > 0 ? sum(arr) / arr.length : 0;

    const throughputs = data.map(d => d.tps);
    const latencies = data.map(d => d.ttft_ms);
    const requests = data.map(d => d.successful_requests);
    const powers = data.map(d => d.power_w_avg).filter(p => p !== undefined) as number[];

    return {
      avgThroughput: avg(throughputs),
      avgLatency: avg(latencies),
      totalRequests: sum(requests),
      avgPower: powers.length > 0 ? avg(powers) : 0
    };
  }, [data]);
}

// Export constants and types for use in components
export { AVAILABLE_MODELS, AVAILABLE_CHIPS, AVAILABLE_PRECISIONS };
export type { BenchmarkStructure, BenchmarkDiscovery }; 