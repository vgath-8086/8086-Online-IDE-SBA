import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-950 p-8">
      <h1 className="text-4xl font-bold text-zinc-100">8086 Online IDE</h1>
      <p className="text-zinc-400 text-center max-w-md">
        Write, compile and step through 8086 assembly programs in your browser.
        Full register, RAM, stack and console visibility.
      </p>
      <Link href="/ide">
        <Button size="lg">Open IDE</Button>
      </Link>
    </main>
  );
}
