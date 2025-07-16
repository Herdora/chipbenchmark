interface HardwareInfo {
  gpu?: string;
  type?: string;
  memory?: string;
  [key: string]: unknown;
}

// Cache for hardware information
const hardwareCache = new Map<string, HardwareInfo | null>();

/**
 * Creates a cache key for hardware information
 */
function createHardwareKey(model: string, tensorParallelism: string, chip: string, precision: string): string {
  return `${model}/${tensorParallelism}/${chip}/${precision}`;
}

/**
 * Fetches hardware information for a specific benchmark configuration
 */
export async function fetchHardwareInfo(model: string, tensorParallelism: string, chip: string, precision: string): Promise<HardwareInfo | null> {
  const cacheKey = createHardwareKey(model, tensorParallelism, chip, precision);

  // Check cache first
  if (hardwareCache.has(cacheKey)) {
    return hardwareCache.get(cacheKey) || null;
  }

  try {
    const url = `/api/benchmarks/${encodeURIComponent(model)}/${encodeURIComponent(tensorParallelism)}/${encodeURIComponent(chip)}/${encodeURIComponent(precision)}/hardware.json`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`Hardware info not available for ${model}/${tensorParallelism}/${chip}/${precision}`);
      hardwareCache.set(cacheKey, null);
      return null;
    }

    const hardwareInfo = await response.json() as HardwareInfo;
    hardwareCache.set(cacheKey, hardwareInfo);
    return hardwareInfo;
  } catch (error) {
    console.error(`Error fetching hardware info for ${model}/${tensorParallelism}/${chip}/${precision}:`, error);
    hardwareCache.set(cacheKey, null);
    return null;
  }
}

/**
 * Formats hardware information for display
 */
export function formatHardwareInfo(hardwareInfo: HardwareInfo | null): string {
  if (!hardwareInfo) {
    return 'Hardware info not available';
  }

  const parts: string[] = [];

  if (hardwareInfo.gpu) {
    parts.push(hardwareInfo.gpu);
  }

  if (hardwareInfo.type) {
    parts.push(`(${hardwareInfo.type})`);
  }

  if (hardwareInfo.memory) {
    parts.push(`${hardwareInfo.memory} memory`);
  }

  return parts.length > 0 ? parts.join(' ') : 'Hardware info not available';
}

/**
 * Preloads hardware data for multiple configurations
 */
export async function preloadHardwareData(configurations: Array<{ model: string, tensorParallelism: string, chip: string, precision: string; }>) {
  const promises = configurations.map(config =>
    fetchHardwareInfo(config.model, config.tensorParallelism, config.chip, config.precision)
  );

  // Wait for all requests to complete (ignoring failures)
  await Promise.allSettled(promises);
}

/**
 * Clears the hardware cache
 */
export function clearHardwareCache() {
  hardwareCache.clear();
}

/**
 * Gets cached hardware info without making a network request
 */
export function getCachedHardwareInfo(model: string, tensorParallelism: string, chip: string, precision: string): HardwareInfo | null | undefined {
  const cacheKey = createHardwareKey(model, tensorParallelism, chip, precision);
  return hardwareCache.get(cacheKey);
} 