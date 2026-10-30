/**
 * Shared IndexedDB access for NSEI Skul's offline (Hybrid) mode.
 *
 * Stores:
 *  - outbox: queued mutations created while offline / on flaky networks.
 *  - kv:     small key/value records (device identity, receipt counters, caches).
 *
 * Marks entry still uses its own database (lib/academic/offline-marks-db.ts);
 * it will migrate onto this engine in a later phase.
 */

const DB_NAME = "nsei_offline";
const DB_VERSION = 1;
export const STORE_OUTBOX = "outbox";
export const STORE_KV = "kv";

let dbPromise: Promise<IDBDatabase> | null = null;

export function isIndexedDbAvailable(): boolean {
  return typeof window !== "undefined" && !!window.indexedDB;
}

export function openOfflineDb(): Promise<IDBDatabase> {
  if (!isIndexedDbAvailable()) {
    return Promise.reject(new Error("IndexedDB is not available in this environment"));
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
        const outbox = db.createObjectStore(STORE_OUTBOX, { keyPath: "id" });
        outbox.createIndex("by_type", "type", { unique: false });
        outbox.createIndex("by_school", "schoolId", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_KV)) {
        db.createObjectStore(STORE_KV, { keyPath: "key" });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function idbGet<T>(store: string, key: IDBValidKey): Promise<T | undefined> {
  const db = await openOfflineDb();
  return promisify(db.transaction(store, "readonly").objectStore(store).get(key)) as Promise<T | undefined>;
}

export async function idbGetAll<T>(store: string): Promise<T[]> {
  const db = await openOfflineDb();
  return promisify(db.transaction(store, "readonly").objectStore(store).getAll()) as Promise<T[]>;
}

export async function idbPut<T>(store: string, value: T): Promise<void> {
  const db = await openOfflineDb();
  await promisify(db.transaction(store, "readwrite").objectStore(store).put(value));
}

export async function idbDelete(store: string, key: IDBValidKey): Promise<void> {
  const db = await openOfflineDb();
  await promisify(db.transaction(store, "readwrite").objectStore(store).delete(key));
}

/**
 * Atomically read-modify-write a single kv record. IndexedDB serialises
 * readwrite transactions on the same store, even across browser tabs, so this
 * is safe for counters.
 */
export async function idbUpdateKv<T>(key: string, updater: (current: T | undefined) => T): Promise<T> {
  const db = await openOfflineDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_KV, "readwrite");
    const store = tx.objectStore(STORE_KV);
    let next: T;
    const getReq = store.get(key);
    getReq.onsuccess = () => {
      const current = getReq.result ? (getReq.result.value as T) : undefined;
      next = updater(current);
      store.put({ key, value: next });
    };
    getReq.onerror = () => reject(getReq.error);
    tx.oncomplete = () => resolve(next);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function kvGet<T>(key: string): Promise<T | undefined> {
  const record = await idbGet<{ key: string; value: T }>(STORE_KV, key);
  return record?.value;
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  await idbPut(STORE_KV, { key, value });
}
