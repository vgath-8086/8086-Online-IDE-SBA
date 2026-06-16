'use client';
import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface Props {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}

export function PanelModal({ title, description, onClose, children }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-lg w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-3 py-2 border-b border-zinc-800 flex-shrink-0">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-zinc-200">{title}</div>
            {description && <div className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{description}</div>}
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 rounded p-0.5 hover:bg-zinc-800 flex-shrink-0"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
