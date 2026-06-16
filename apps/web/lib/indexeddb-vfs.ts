import type { VirtualFileSystem, VfsFile, VfsFileMeta, Result } from '@emu8086/shared';
import { VfsErrorCode } from '@emu8086/shared';

const DB_NAME = 'emu8086-vfs';
const DB_VERSION = 1;
const STORE = 'files';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(db: IDBDatabase, mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const store = transaction.objectStore(STORE);
    const req = run(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function newId(): string {
  return crypto.randomUUID();
}

/** IndexedDB-backed implementation of the shared VirtualFileSystem port. */
export class IndexedDbVfs implements VirtualFileSystem {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDb(): Promise<IDBDatabase> {
    if (!this.dbPromise) this.dbPromise = openDb();
    return this.dbPromise;
  }

  async list(): Promise<VfsFileMeta[]> {
    const db = await this.getDb();
    const all = await tx<VfsFile[]>(db, 'readonly', store => store.getAll());
    return all
      .map(({ id, name, createdAt, updatedAt }) => ({ id, name, createdAt, updatedAt }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async read(id: string): Promise<Result<VfsFile, VfsErrorCode>> {
    const db = await this.getDb();
    const file = await tx<VfsFile | undefined>(db, 'readonly', store => store.get(id));
    if (!file) return { ok: false, error: VfsErrorCode.NOT_FOUND };
    return { ok: true, value: file };
  }

  async create(name: string, content = ''): Promise<Result<VfsFile, VfsErrorCode>> {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: VfsErrorCode.INVALID_NAME };
    const db = await this.getDb();
    const all = await tx<VfsFile[]>(db, 'readonly', store => store.getAll());
    if (all.some(f => f.name === trimmed)) return { ok: false, error: VfsErrorCode.NAME_TAKEN };

    const now = Date.now();
    const file: VfsFile = { id: newId(), name: trimmed, content, createdAt: now, updatedAt: now };
    await tx(db, 'readwrite', store => store.add(file));
    return { ok: true, value: file };
  }

  async write(id: string, content: string): Promise<Result<void, VfsErrorCode>> {
    const db = await this.getDb();
    const file = await tx<VfsFile | undefined>(db, 'readonly', store => store.get(id));
    if (!file) return { ok: false, error: VfsErrorCode.NOT_FOUND };
    const updated: VfsFile = { ...file, content, updatedAt: Date.now() };
    await tx(db, 'readwrite', store => store.put(updated));
    return { ok: true, value: undefined };
  }

  async rename(id: string, name: string): Promise<Result<void, VfsErrorCode>> {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: VfsErrorCode.INVALID_NAME };
    const db = await this.getDb();
    const all = await tx<VfsFile[]>(db, 'readonly', store => store.getAll());
    const file = all.find(f => f.id === id);
    if (!file) return { ok: false, error: VfsErrorCode.NOT_FOUND };
    if (all.some(f => f.id !== id && f.name === trimmed)) return { ok: false, error: VfsErrorCode.NAME_TAKEN };

    const updated: VfsFile = { ...file, name: trimmed, updatedAt: Date.now() };
    await tx(db, 'readwrite', store => store.put(updated));
    return { ok: true, value: undefined };
  }

  async delete(id: string): Promise<Result<void, VfsErrorCode>> {
    const db = await this.getDb();
    const file = await tx<VfsFile | undefined>(db, 'readonly', store => store.get(id));
    if (!file) return { ok: false, error: VfsErrorCode.NOT_FOUND };
    await tx(db, 'readwrite', store => store.delete(id));
    return { ok: true, value: undefined };
  }

  async clear(): Promise<void> {
    const db = await this.getDb();
    await tx(db, 'readwrite', store => store.clear());
  }
}
