/**
 * Offline reader cache (IndexedDB). Application-managed caching, not DRM: it
 * stores the bytes the user has already been authorized to read so the reader
 * can reopen them offline. The authoritative entitlement check still happens
 * server-side on every fresh fetch.
 */
const DB_NAME = 'storygalore-reader';
const STORE = 'pages';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function cachePage(publicationId: string, position: number, blob: Blob): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(blob, `${publicationId}:${position}`);
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
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(`${publicationId}:${position}`);
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

/** Drop the cached pages for a publication (removal / storage hygiene). */
export async function clearPublication(publicationId: string): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const keys = await new Promise<string[]>((resolve, reject) => {
      const req = store.getAllKeys();
      req.onsuccess = () => resolve((req.result as string[]).filter((k) => k.startsWith(`${publicationId}:`)));
      req.onerror = () => reject(req.error);
    });
    for (const k of keys) store.delete(k);
    await new Promise<void>((resolve) => (tx.oncomplete = () => resolve()));
    db.close();
  } catch {
    /* best-effort */
  }
}
