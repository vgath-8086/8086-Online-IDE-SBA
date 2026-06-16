'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronDown, FileCode, Folder, Plus, Pencil, X, Trash2 } from 'lucide-react';
import type { VfsFileMeta } from '@emu8086/shared';

interface Props {
  files: VfsFileMeta[];
  currentId: string | null;
  onSelect(id: string): void;
  onCreate(): void;
  onRename(id: string, name: string): void;
  onDelete(id: string): void;
  onResetAll(): void;
}

interface TreeFolder {
  path: string;
  folders: Map<string, TreeFolder>;
  files: VfsFileMeta[];
}

function buildTree(files: VfsFileMeta[]): TreeFolder {
  const root: TreeFolder = { path: '', folders: new Map(), files: [] };
  for (const file of files) {
    const parts = file.name.split('/').filter(Boolean);
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const path = node.path ? `${node.path}/${part}` : part;
      if (!node.folders.has(part)) node.folders.set(part, { path, folders: new Map(), files: [] });
      node = node.folders.get(part)!;
    }
    node.files.push(file);
  }
  return root;
}

function leafName(name: string): string {
  return name.slice(name.lastIndexOf('/') + 1);
}

interface RowProps extends Props {
  node: TreeFolder;
  depth: number;
  collapsed: Set<string>;
  toggleCollapsed(path: string): void;
  editingId: string | null;
  startRename(file: VfsFileMeta): void;
  editingValue: string;
  setEditingValue(v: string): void;
  commitRename(): void;
  cancelRename(): void;
}

function TreeNode(props: RowProps) {
  const { node, depth, collapsed, toggleCollapsed, files: _files, ...rest } = props;
  const folderEntries = [...node.folders.values()].sort((a, b) => a.path.localeCompare(b.path));
  const fileEntries = [...node.files].sort((a, b) => leafName(a.name).localeCompare(leafName(b.name)));

  return (
    <>
      {folderEntries.map(folder => {
        const isCollapsed = collapsed.has(folder.path);
        return (
          <div key={folder.path}>
            <button
              onClick={() => toggleCollapsed(folder.path)}
              className="flex items-center gap-1 w-full px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800 rounded"
              style={{ paddingLeft: `${depth * 14 + 8}px` }}
            >
              {isCollapsed ? <ChevronRight className="h-3 w-3 flex-shrink-0" /> : <ChevronDown className="h-3 w-3 flex-shrink-0" />}
              <Folder className="h-3.5 w-3.5 flex-shrink-0 text-brand-400" />
              <span className="truncate">{folder.path.slice(folder.path.lastIndexOf('/') + 1)}</span>
            </button>
            {!isCollapsed && (
              <TreeNode {...rest} files={_files} node={folder} depth={depth + 1} collapsed={collapsed} toggleCollapsed={toggleCollapsed} />
            )}
          </div>
        );
      })}
      {fileEntries.map(file => {
        const active = file.id === rest.currentId;
        const editing = rest.editingId === file.id;
        return (
          <div
            key={file.id}
            className={`group flex items-center gap-1 w-full px-2 py-1 rounded text-xs cursor-pointer ${
              active ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-300 hover:bg-zinc-800'
            }`}
            style={{ paddingLeft: `${depth * 14 + 8}px` }}
            onClick={() => !editing && rest.onSelect(file.id)}
          >
            <FileCode className="h-3.5 w-3.5 flex-shrink-0 text-zinc-500" />
            {editing ? (
              <input
                autoFocus
                value={rest.editingValue}
                onChange={e => rest.setEditingValue(e.target.value)}
                onBlur={rest.commitRename}
                onKeyDown={e => {
                  if (e.key === 'Enter') rest.commitRename();
                  if (e.key === 'Escape') rest.cancelRename();
                }}
                onClick={e => e.stopPropagation()}
                className="bg-zinc-950 text-zinc-100 text-xs px-1 rounded border border-brand-600 outline-none flex-1 min-w-0"
              />
            ) : (
              <>
                <span className="truncate flex-1 min-w-0">{leafName(file.name)}</span>
                <button
                  onClick={e => { e.stopPropagation(); rest.startRename(file); }}
                  className="opacity-0 group-hover:opacity-100 hover:text-zinc-100 flex-shrink-0"
                  title="Rename"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                {props.files.length > 1 && (
                  <button
                    onClick={e => { e.stopPropagation(); rest.onDelete(file.id); }}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 flex-shrink-0"
                    title="Delete"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </>
            )}
          </div>
        );
      })}
    </>
  );
}

export function FileExplorer({ files, currentId, onSelect, onCreate, onRename, onDelete, onResetAll }: Props) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const tree = useMemo(() => buildTree(files), [files]);
  const currentFile = files.find(f => f.id === currentId);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const toggleCollapsed = (path: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const startRename = (file: VfsFileMeta) => {
    setEditingId(file.id);
    setEditingValue(leafName(file.name));
  };

  const commitRename = () => {
    if (editingId) {
      const file = files.find(f => f.id === editingId);
      const parentPath = file ? file.name.slice(0, file.name.lastIndexOf('/') + 1) : '';
      if (editingValue.trim()) onRename(editingId, `${parentPath}${editingValue.trim()}`);
    }
    setEditingId(null);
  };

  return (
    <div ref={containerRef} className="relative flex items-center h-8 px-1 bg-zinc-900 border-b border-zinc-800 flex-shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 h-6 px-2 rounded text-xs text-zinc-200 hover:bg-zinc-800"
      >
        <FileCode className="h-3.5 w-3.5 text-brand-400" />
        <span className="truncate max-w-[14rem]">{currentFile ? currentFile.name : 'No file'}</span>
        {open ? <ChevronDown className="h-3 w-3 text-zinc-500" /> : <ChevronRight className="h-3 w-3 text-zinc-500" />}
      </button>
      <button
        onClick={onCreate}
        className="flex items-center justify-center h-6 w-6 rounded text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 ml-1"
        title="New file (name it with a / to place it in a folder, e.g. algorithms/bubble.asm)"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute top-full left-1 mt-1 w-72 max-h-96 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-md shadow-2xl z-50 py-1">
          <TreeNode
            node={tree}
            depth={0}
            files={files}
            currentId={currentId}
            onSelect={id => { onSelect(id); setOpen(false); }}
            onCreate={onCreate}
            onRename={onRename}
            onDelete={onDelete}
            collapsed={collapsed}
            toggleCollapsed={toggleCollapsed}
            editingId={editingId}
            startRename={startRename}
            editingValue={editingValue}
            setEditingValue={setEditingValue}
            commitRename={commitRename}
            cancelRename={() => setEditingId(null)}
            onResetAll={onResetAll}
          />
          <div className="border-t border-zinc-800 mt-1 pt-1">
            <button
              onClick={() => {
                if (window.confirm('Delete all files and reset to a blank slate? This cannot be undone.')) {
                  onResetAll();
                  setOpen(false);
                }
              }}
              className="flex items-center gap-1.5 w-full px-2 py-1 text-xs text-red-400 hover:bg-red-950/40 rounded"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Reset all files
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
