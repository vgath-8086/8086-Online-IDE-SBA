import { EXAMPLES, CATEGORIES } from '@emu8086/shared';
import { INSTRUCTION_GROUPS } from '@/lib/instructions';
import { Hero } from '@/components/landing/Hero';
import { ScreenshotPreview } from '@/components/landing/ScreenshotPreview';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { InstructionTable } from '@/components/landing/InstructionTable';
import { TeamSection } from '@/components/landing/TeamSection';

export default function Home() {
  return (
    <main className="flex flex-col items-center bg-zinc-950 text-zinc-100">
      <Hero exampleCount={EXAMPLES.length} />
      <ScreenshotPreview />
      <FeatureGrid exampleCount={EXAMPLES.length} categoryCount={CATEGORIES.length} />
      <InstructionTable groups={INSTRUCTION_GROUPS} />
      <TeamSection />
    </main>
  );
}
