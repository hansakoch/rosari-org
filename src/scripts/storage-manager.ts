// ============================================================
// storage-manager.ts — IndexedDB + localStorage persistence
// ============================================================

const DB_NAME = 'rosari-db';
const DB_VERSION = 1;

interface RosaryPreferences {
  language: string;
  voiceDescription: string;
  theme: 'night' | 'day';
  secondLanguage?: string;
}

interface AudioCache {
  key: string;
  audioData: ArrayBuffer;
  text: string;
  duration: number;
  timestamp: number;
  wordTimings?: WordTiming[];
}

interface WordTiming {
  word: string;
  start: number;  // seconds from audio start
  end: number;
}

let db: IDBDatabase | null = null;

async function openDB(): Promise<IDBDatabase> {
  if (db) return db;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const database = (e.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains('preferences')) {
        database.createObjectStore('preferences', { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains('audio_cache')) {
        const store = database.createObjectStore('audio_cache', { keyPath: 'key' });
        store.createIndex('timestamp', 'timestamp');
      }
    };
    req.onsuccess = (e) => {
      db = (e.target as IDBOpenDBRequest).result;
      resolve(db);
    };
    req.onerror = () => reject(req.error);
  });
}

// ── Preferences ─────────────────────────────────────────────

export async function savePreferences(prefs: RosaryPreferences): Promise<void> {
  try {
    const database = await openDB();
    const tx = database.transaction('preferences', 'readwrite');
    tx.objectStore('preferences').put({ id: 'main', ...prefs });
    localStorage.setItem('rosari-prefs', JSON.stringify(prefs));
  } catch {
    localStorage.setItem('rosari-prefs', JSON.stringify(prefs));
  }
}

export async function loadPreferences(): Promise<RosaryPreferences | null> {
  try {
    const database = await openDB();
    return new Promise((resolve) => {
      const tx = database.transaction('preferences', 'readonly');
      const req = tx.objectStore('preferences').get('main');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => {
        const raw = localStorage.getItem('rosari-prefs');
        resolve(raw ? JSON.parse(raw) : null);
      };
    });
  } catch {
    const raw = localStorage.getItem('rosari-prefs');
    return raw ? JSON.parse(raw) : null;
  }
}

// ── Audio Cache ─────────────────────────────────────────────

export function buildCacheKey(prayerKey: string, language: string, voice: string): string {
  return `${prayerKey}::${language}::${voice}`.toLowerCase().replace(/\s+/g, '-');
}

export async function saveAudioCache(entry: AudioCache): Promise<void> {
  try {
    const database = await openDB();
    const tx = database.transaction('audio_cache', 'readwrite');
    tx.objectStore('audio_cache').put(entry);
  } catch (e) {
    console.warn('Audio cache save failed:', e);
  }
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
  } catch {
    return null;
  }
}

export async function getCacheSize(): Promise<{ count: number; bytes: number }> {
  try {
    const database = await openDB();
    return new Promise((resolve) => {
      const tx = database.transaction('audio_cache', 'readonly');
      const store = tx.objectStore('audio_cache');
      let count = 0;
      let bytes = 0;
      const req = store.openCursor();
      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          count++;
          bytes += cursor.value.audioData?.byteLength || 0;
          cursor.continue();
        } else {
          resolve({ count, bytes });
        }
      };
      req.onerror = () => resolve({ count: 0, bytes: 0 });
    });
  } catch {
    return { count: 0, bytes: 0 };
  }
}

export async function clearAudioCache(): Promise<void> {
  try {
    const database = await openDB();
    const tx = database.transaction('audio_cache', 'readwrite');
    tx.objectStore('audio_cache').clear();
  } catch (e) {
    console.warn('Cache clear failed:', e);
  }
}

// ── Offline Detection ─────────────────────────────────────

export function isOffline(): boolean {
  return !navigator.onLine;
}

export function onConnectivityChange(cb: (online: boolean) => void): () => void {
  const onOnline = () => cb(true);
  const onOffline = () => cb(false);
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

export type { RosaryPreferences, AudioCache, WordTiming };
