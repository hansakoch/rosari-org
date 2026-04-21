const DB_NAME = 'rosari-db';
const DB_VERSION = 1;

interface RosaryPreferences {
  language: string;
  voiceDescription: string;
  theme: 'night' | 'day';
}

interface AudioCache {
  key: string;
  audioData: ArrayBuffer;
  text: string;
  duration: number;
  timestamp: number;
}

let db: IDBDatabase | null = null;

async function openDB(): Promise<IDBDatabase> {
  if (db) return db;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('IndexedDB timeout')), 2000);
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const database = (e.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains('preferences')) {
        database.createObjectStore('preferences', { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains('audio_cache')) {
        database.createObjectStore('audio_cache', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => { clearTimeout(timer); db = req.result; resolve(db); };
    req.onerror = () => { clearTimeout(timer); reject(req.error); };
  });
}

export async function savePreferences(prefs: RosaryPreferences): Promise<void> {
  try {
    const database = await openDB();
    const tx = database.transaction('preferences', 'readwrite');
    tx.objectStore('preferences').put({ id: 'main', ...prefs });
  } catch {}
}

export async function loadPreferences(): Promise<RosaryPreferences | null> {
  try {
    const database = await openDB();
    return new Promise((resolve) => {
      const tx = database.transaction('preferences', 'readonly');
      const req = tx.objectStore('preferences').get('main');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch { return null; }
}

// Key on the actual text so identical prayers (all 50 Hail Marys) share a single
// client-side cache entry instead of fragmenting by decade/index.
export function buildCacheKey(text: string, language: string, voice: string): string {
  let hash = 5381;
  const src = text.trim().toLowerCase();
  for (let i = 0; i < src.length; i++) hash = ((hash * 33) ^ src.charCodeAt(i)) >>> 0;
  const lang = (language || '').toLowerCase().trim().replace(/\s+/g, '-');
  const voc  = (voice    || '').toLowerCase().trim().replace(/\s+/g, '-');
  return `${hash.toString(36)}::${lang}::${voc}`;
}

export async function saveAudioCache(entry: AudioCache): Promise<void> {
  try {
    const database = await openDB();
    const tx = database.transaction('audio_cache', 'readwrite');
    tx.objectStore('audio_cache').put(entry);
  } catch (e) {}
}

export async function loadAudioCache(key: string): Promise<AudioCache | null> {
  try {
    const database = await openDB();
    return new Promise((resolve) => {
      const tx = database.transaction('audio_cache', 'readonly');
      const req = tx.objectStore('audio_cache').get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch { return null; }
}

export type { RosaryPreferences, AudioCache };