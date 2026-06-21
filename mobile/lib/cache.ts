import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEnvelope<T> {
  data: T;
  cachedAt: string; // ISO
}

const PREFIX = 'bair1.cache.';

export async function writeCache(key: string, data: unknown): Promise<void> {
  try {
    const envelope = { data, cachedAt: new Date().toISOString() };
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(envelope));
  } catch {
    // best-effort cache; ignore write failures
  }
}

export async function readCache<T>(key: string): Promise<CacheEnvelope<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return parsed as CacheEnvelope<T>;
  } catch {
    return null;
  }
}
