/**
 * Offline reader cache (IndexedDB). Application-managed caching, not DRM: it
 * stores the bytes the user has already been authorized to read so the reader
 * can reopen them offline. The authoritative entitlement check still happens
 * server-side on every fresh fetch.
 */
const DB_NAME = 'storygalore-reader';
const PAGES_STORE = 'pages';
const META_STORE = 'publications';
const DB_VERSION = 2;

export interface CachedPublication {
  publicationId: string;
  title: string;
  pageCount: number;
  cachedAt: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PAGES_STORE)) {
        db.createObjectStore(PAGES_STORE);
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'publicationId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function cachePage(publicationId: string, position: number, blob: Blob): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(PAGES_STORE, 'readwrite');
    tx.objectStore(PAGES_STORE).put(blob, `${publicationId}:${position}`);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* cache writes are best-effort */
  }
}

export async function getCachedPage(publicationId: string, position: number): Promise<Blob | undefined> {
  try {
    const db = await openDb();
    const tx = db.transaction(PAGES_STORE, 'readonly');
    const req = tx.objectStore(PAGES_STORE).get(`${publicationId}:${position}`);
    const blob = await new Promise<Blob | undefined>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result as Blob | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return blob;
  } catch {
    return undefined;
  }
}

/** Record a publication's offline metadata (title, page count) for the library. */
export async function recordPublicationMeta(publicationId: string, title: string, pageCount: number): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(META_STORE, 'readwrite');
    tx.objectStore(META_STORE).put({
      publicationId,
      title,
      pageCount,
      cachedAt: new Date().toISOString(),
    } satisfies CachedPublication);
    await new Promise<void>((resolve) => (tx.oncomplete = () => resolve()));
    db.close();
  } catch {
    /* best-effort */
  }
}

/** List the publications currently cached for offline reading. */
export async function listCachedPublications(): Promise<CachedPublication[]> {
  try {
    const db = await openDb();
    const tx = db.transaction(META_STORE, 'readonly');
    const req = tx.objectStore(META_STORE).getAll();
    const rows = await new Promise<CachedPublication[]>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result as CachedPublication[]);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return rows;
  } catch {
    return [];
  }
}

/** Drop the cached pages + metadata for a publication (removal / storage hygiene). */
export async function clearPublication(publicationId: string): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction([PAGES_STORE, META_STORE], 'readwrite');
    const store = tx.objectStore(PAGES_STORE);
    const keys = await new Promise<string[]>((resolve, reject) => {
      const req = store.getAllKeys();
      req.onsuccess = () => resolve((req.result as string[]).filter((k) => k.startsWith(`${publicationId}:`)));
      req.onerror = () => reject(req.error);
    });
    for (const k of keys) store.delete(k);
    tx.objectStore(META_STORE).delete(publicationId);
    await new Promise<void>((resolve) => (tx.oncomplete = () => resolve()));
    db.close();
  } catch {
    /* best-effort */
  }
}
