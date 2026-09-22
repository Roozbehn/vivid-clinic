import type { Feature } from "@/lib/features";

export function FeatureGrid({ features }: { features: Feature[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {features.map(({ icon: Icon, title, body }) => (
        <div
          key={title}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)]"
        >
          <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
            {title}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {body}
          </p>
        </div>
      ))}
    </div>
  );
}
