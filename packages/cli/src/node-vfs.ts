import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { VirtualFileSystem, VfsFile, VfsFileMeta, Result } from '@emu8086/shared';
import { VfsErrorCode } from '@emu8086/shared';

interface ManifestEntry { name: string; createdAt: number; updatedAt: number; }
type Manifest = Record<string, ManifestEntry>;

const ROOT = join(homedir(), '.emu8086', 'files');
const MANIFEST_PATH = join(ROOT, 'manifest.json');

async function ensureRoot(): Promise<void> {
  await mkdir(ROOT, { recursive: true });
}

async function readManifest(): Promise<Manifest> {
  await ensureRoot();
  try {
    return JSON.parse(await readFile(MANIFEST_PATH, 'utf-8')) as Manifest;
  } catch {
    return {};
  }
}

async function writeManifest(manifest: Manifest): Promise<void> {
  await ensureRoot();
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
}

function filePath(id: string): string {
  return join(ROOT, `${id}.asm`);
}

/** node:fs-backed implementation of the shared VirtualFileSystem port — files live under ~/.emu8086/files/. */
export class NodeVfs implements VirtualFileSystem {
  async list(): Promise<VfsFileMeta[]> {
    const manifest = await readManifest();
    return Object.entries(manifest)
      .map(([id, m]) => ({ id, ...m }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async read(id: string): Promise<Result<VfsFile, VfsErrorCode>> {
    const manifest = await readManifest();
    const meta = manifest[id];
    if (!meta) return { ok: false, error: VfsErrorCode.NOT_FOUND };
    try {
      const content = await readFile(filePath(id), 'utf-8');
      return { ok: true, value: { id, ...meta, content } };
    } catch {
      return { ok: false, error: VfsErrorCode.NOT_FOUND };
    }
  }

  async create(name: string, content = ''): Promise<Result<VfsFile, VfsErrorCode>> {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: VfsErrorCode.INVALID_NAME };
    const manifest = await readManifest();
    if (Object.values(manifest).some(m => m.name === trimmed)) return { ok: false, error: VfsErrorCode.NAME_TAKEN };

    const id = randomUUID();
    const now = Date.now();
    manifest[id] = { name: trimmed, createdAt: now, updatedAt: now };
    await writeFile(filePath(id), content, 'utf-8');
    await writeManifest(manifest);
    return { ok: true, value: { id, name: trimmed, content, createdAt: now, updatedAt: now } };
  }

  async write(id: string, content: string): Promise<Result<void, VfsErrorCode>> {
    const manifest = await readManifest();
    const meta = manifest[id];
    if (!meta) return { ok: false, error: VfsErrorCode.NOT_FOUND };
    meta.updatedAt = Date.now();
    await writeFile(filePath(id), content, 'utf-8');
    await writeManifest(manifest);
    return { ok: true, value: undefined };
  }

  async rename(id: string, name: string): Promise<Result<void, VfsErrorCode>> {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: VfsErrorCode.INVALID_NAME };
    const manifest = await readManifest();
    const meta = manifest[id];
    if (!meta) return { ok: false, error: VfsErrorCode.NOT_FOUND };
    if (Object.entries(manifest).some(([otherId, m]) => otherId !== id && m.name === trimmed)) {
      return { ok: false, error: VfsErrorCode.NAME_TAKEN };
    }
    meta.name = trimmed;
    meta.updatedAt = Date.now();
    await writeManifest(manifest);
    return { ok: true, value: undefined };
  }

  async delete(id: string): Promise<Result<void, VfsErrorCode>> {
    const manifest = await readManifest();
    if (!manifest[id]) return { ok: false, error: VfsErrorCode.NOT_FOUND };
    delete manifest[id];
    await writeManifest(manifest);
    await rm(filePath(id), { force: true });
    return { ok: true, value: undefined };
  }

  async clear(): Promise<void> {
    const manifest = await readManifest();
    await Promise.all(Object.keys(manifest).map(id => rm(filePath(id), { force: true })));
    await writeManifest({});
  }
}
