import type { Feature } from "@/lib/features";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";

// Stays a server component (the `icon` entries are component functions, which
// can't cross to the client as props) — the client-side reveal wrappers only
// receive the already-rendered card markup as children.
export function FeatureGrid({ features }: { features: Feature[] }) {
  return (
    <RevealGroup
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      stagger={0.09}
      amount={0.15}
    >
      {features.map(({ icon: Icon, title, body }) => (
        <RevealItem
          key={title}
          scale={0.97}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-hover)]"
        >
          <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
            {title}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {body}
          </p>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}
