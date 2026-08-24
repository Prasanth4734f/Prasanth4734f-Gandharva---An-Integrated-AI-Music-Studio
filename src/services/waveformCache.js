/**
 * In-Memory & Persistent Waveform Peaks Cache
 * Generates lightweight, normalized peak arrays for fast SVG/Canvas rendering
 */

const memoryCache = new Map();

/**
 * Generate simulated deterministic peaks for an audio source (used when server peaks are loading or offline)
 */
export const generateProceduralPeaks = (sourceId, numPeaks = 60) => {
  if (memoryCache.has(sourceId)) {
    return memoryCache.get(sourceId);
  }

  // Generate pleasant, organic music-like waveform pattern based on string hash
  let seed = 0;
  for (let i = 0; i < sourceId.length; i++) {
    seed = (seed << 5) - seed + sourceId.charCodeAt(i);
    seed |= 0;
  }
  const absSeed = Math.abs(seed);

  const peaks = [];
  for (let i = 0; i < numPeaks; i++) {
    const freq1 = Math.sin((i / numPeaks) * Math.PI * 4 + absSeed);
    const freq2 = Math.cos((i / numPeaks) * Math.PI * 8 + absSeed * 0.5);
    const freq3 = Math.sin((i / numPeaks) * Math.PI * 16);
    
    // Normalized amplitude between 0.15 and 0.95
    const rawVal = 0.45 + (freq1 * 0.25 + freq2 * 0.18 + freq3 * 0.12);
    const peak = Math.max(0.12, Math.min(0.98, rawVal));
    peaks.push(Number(peak.toFixed(3)));
  }

  memoryCache.set(sourceId, peaks);
  return peaks;
};

/**
 * Get cached peaks or generate fallback
 */
export const getCachedWaveform = (sourceUrl, numPeaks = 60) => {
  if (!sourceUrl) return Array.from({ length: numPeaks }, () => 0.3);
  return generateProceduralPeaks(sourceUrl, numPeaks);
};

/**
 * Save real server-extracted peaks into cache
 */
export const setCachedWaveform = (sourceUrl, peaksArray) => {
  if (sourceUrl && Array.isArray(peaksArray) && peaksArray.length > 0) {
    memoryCache.set(sourceUrl, peaksArray);
  }
};
