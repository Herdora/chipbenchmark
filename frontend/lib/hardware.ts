interface HardwareInfo {
  gpu?: string;
  type?: string;
  memory?: string;
  [key: string]: unknown;
}

// Cache for hardware data
const hardwareCache = new Map<string, HardwareInfo | null>();

/**
 * Fetches hardware information for a specific model/chip/precision combination
 */
export async function fetchHardwareInfo(model: string, chip: string, precision: string): Promise<HardwareInfo | null> {
  const cacheKey = `${model}/${chip}/${precision}`;

  // Check cache first
  if (hardwareCache.has(cacheKey)) {
    return hardwareCache.get(cacheKey)!;
  }

  try {
    const response = await fetch(`/data/benchmarks/${model}/${chip}/${precision.toUpperCase()}/hardware.json`);
    if (!response.ok) {
      // Hardware data not available for this configuration
      hardwareCache.set(cacheKey, null);
      return null;
    }

    const hardwareData = await response.json();
    hardwareCache.set(cacheKey, hardwareData);
    return hardwareData;
  } catch (error) {
    console.warn(`Failed to fetch hardware info for ${cacheKey}:`, error);
    hardwareCache.set(cacheKey, null);
    return null;
  }
}

/**
 * Formats hardware information into a readable string
 */
export function formatHardwareInfo(hardwareInfo: HardwareInfo | null): string {
  if (!hardwareInfo) return '';

  const parts: string[] = [];

  if (hardwareInfo.gpu) {
    parts.push(hardwareInfo.gpu);
  }

  if (hardwareInfo.type) {
    parts.push(hardwareInfo.type);
  }

  if (hardwareInfo.memory) {
    parts.push(hardwareInfo.memory);
  }

  return parts.join(' • ');
}

/**
 * Preloads hardware data for multiple configurations
 */
export async function preloadHardwareData(configurations: Array<{ model: string, chip: string, precision: string; }>) {
  const promises = configurations.map(config =>
    fetchHardwareInfo(config.model, config.chip, config.precision)
  );

  await Promise.all(promises);
} 