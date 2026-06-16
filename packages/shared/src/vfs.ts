import type { Result } from './result.js';

export interface VfsFileMeta {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface VfsFile extends VfsFileMeta {
  content: string;
}

export const VfsErrorCode = {
  NOT_FOUND: 'File not found',
  INVALID_NAME: 'File name cannot be empty',
  NAME_TAKEN: 'A file with that name already exists',
} as const;

export type VfsErrorCode = typeof VfsErrorCode[keyof typeof VfsErrorCode];

/**
 * Async, environment-agnostic file storage port. The web app backs this with
 * IndexedDB; the CLI backs it with node:fs. Both sides implement this same
 * shape so editor state (file list, autosave) never depends on which one is running.
 */
export interface VirtualFileSystem {
  list(): Promise<VfsFileMeta[]>;
  read(id: string): Promise<Result<VfsFile, VfsErrorCode>>;
  create(name: string, content?: string): Promise<Result<VfsFile, VfsErrorCode>>;
  write(id: string, content: string): Promise<Result<void, VfsErrorCode>>;
  rename(id: string, name: string): Promise<Result<void, VfsErrorCode>>;
  delete(id: string): Promise<Result<void, VfsErrorCode>>;
  /** Deletes every file. Used to reset to a clean slate. */
  clear(): Promise<void>;
}
