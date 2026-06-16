import Image from 'next/image';
import { Loader2 } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-dvh bg-zinc-950 gap-5">
      <Image src="/logo.png" alt="" width={635} height={403} className="h-16 w-auto" priority />
      <div className="flex items-center gap-2 text-zinc-400 text-sm">
        <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
        <span>Loading your files…</span>
      </div>
    </div>
  );
}
