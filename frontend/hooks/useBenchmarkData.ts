'use client';

import { useState, useEffect, useMemo } from 'react';
import { validateIndex, type BenchmarkResult } from '@/lib/schemas/benchmark';

// Load results.index.json using fetch
const loadBenchmarkData = async (): Promise<BenchmarkResult[]> => {
  try {
    const response = await fetch('/data/results.index.json');

    if (!response.ok) {
      throw new Error(`Failed to load benchmark data: ${response.status}`);
    }

    const data = await response.json();

    try {
      const validatedData = validateIndex(data);
      return validatedData;
    } catch (validationError) {
      console.error('Validation failed:', validationError);
      return data; // Return raw data if validation fails
    }
  } catch (error) {
    console.error('Error loading benchmark data:', error);
    return [];
  }
};

export function useBenchmarkData() {
  const [results, setResults] = useState<BenchmarkResult[]>([]);

  useEffect(() => {
    loadBenchmarkData().then(data => {
      setResults(data);
    }).catch(error => {
      console.error('Error in data loading:', error);
      setResults([]);
    });
  }, []);

  return results;
}

// Hook for filtering and computing derived data
export function useFilteredBenchmarkData(filters?: {
  chip?: string;
  model?: string;
  precision?: string;
}) {
  const data = useBenchmarkData();

  const filteredData = useMemo(() => {
    if (!filters) return data;

    return data.filter(result => {
      return (!filters.chip || result.chip === filters.chip) &&
        (!filters.model || result.model === filters.model) &&
        (!filters.precision || result.precision === filters.precision);
    });
  }, [data, filters]);

  return filteredData;
}

// Hook for computing KPI statistics
export function useBenchmarkKPIs(data: BenchmarkResult[]) {
  return useMemo(() => {
    if (data.length === 0) {
      return {
        ttft: { min: 0, max: 0, median: 0 },
        tps: { min: 0, max: 0, median: 0 },
        power: { min: 0, max: 0, median: 0 },
        efficiency: { min: 0, max: 0, median: 0 } // TPS per Watt
      };
    }

    const sortedTtft = [...data].sort((a, b) => a.ttft_ms - b.ttft_ms);
    const sortedTps = [...data].sort((a, b) => a.tps - b.tps);
    const sortedPower = [...data].sort((a, b) => a.power_w_avg - b.power_w_avg);
    const sortedEfficiency = [...data].sort((a, b) => (a.tps / a.power_w_avg) - (b.tps / b.power_w_avg));

    const median = <T>(arr: T[]): T => arr[Math.floor(arr.length / 2)];

    return {
      ttft: {
        min: sortedTtft[0].ttft_ms,
        max: sortedTtft[sortedTtft.length - 1].ttft_ms,
        median: median(sortedTtft).ttft_ms
      },
      tps: {
        min: sortedTps[0].tps,
        max: sortedTps[sortedTps.length - 1].tps,
        median: median(sortedTps).tps
      },
      power: {
        min: sortedPower[0].power_w_avg,
        max: sortedPower[sortedPower.length - 1].power_w_avg,
        median: median(sortedPower).power_w_avg
      },
      efficiency: {
        min: sortedEfficiency[0].tps / sortedEfficiency[0].power_w_avg,
        max: sortedEfficiency[sortedEfficiency.length - 1].tps / sortedEfficiency[sortedEfficiency.length - 1].power_w_avg,
        median: median(sortedEfficiency).tps / median(sortedEfficiency).power_w_avg
      }
    };
  }, [data]);
} 