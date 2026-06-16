import Image from 'next/image';

export function ScreenshotPreview() {
  return (
    <section className="w-full max-w-4xl px-6 py-10">
      <div className="rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl shadow-black/40">
        <div className="h-8 bg-zinc-900 border-b border-zinc-800 flex items-center gap-1.5 px-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
          <span className="ml-3 text-[11px] text-zinc-400 font-mono">localhost:3000/ide</span>
        </div>
        <Image
          src="/screenshot-ide.png"
          alt="8086 Online IDE running the Fibonacci example, mid-step, with registers and RAM populated"
          width={2560}
          height={1600}
          className="w-full h-auto"
          priority
        />
      </div>
    </section>
  );
}
