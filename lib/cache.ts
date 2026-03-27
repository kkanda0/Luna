import type { AnalysisResult } from './types';

const MAX_SIZE = 100;
const cache = new Map<string, AnalysisResult>();
const insertOrder: string[] = [];

export function cacheGet(key: string): AnalysisResult | undefined {
  return cache.get(normalizeKey(key));
}

export function cacheSet(key: string, value: AnalysisResult): void {
  const k = normalizeKey(key);
  if (!cache.has(k)) {
    if (insertOrder.length >= MAX_SIZE) {
      const oldest = insertOrder.shift()!;
      cache.delete(oldest);
    }
    insertOrder.push(k);
  }
  cache.set(k, value);
}

function normalizeKey(address: string): string {
  return address.toLowerCase().trim();
}
