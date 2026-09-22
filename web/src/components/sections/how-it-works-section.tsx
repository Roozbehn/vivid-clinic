// Real copy, ported verbatim from source.en.json's "how_it_works" key.
const STEPS = [
  {
    title: "Send your request",
    body: "Share your treatment interest and how to reach you — it takes about two minutes.",
  },
  {
    title: "A coordinator reviews your needs",
    body: "A Vivid Clinic patient coordinator looks at what you're asking for and how best to help.",
  },
  {
    title: "The medical team evaluates suitability",
    body: "Where appropriate, the medical team reviews your case to understand what may be possible.",
  },
  {
    title: "You receive next-step guidance",
    body: "You get clear, no-obligation guidance on the next step — on WhatsApp, video, or in clinic.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section id="how-it-works" aria-labelledby="hiw-h" className="bg-card py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="rounded-full border border-border px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
            How it works
          </span>
          <h2
            id="hiw-h"
            className="mt-5 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
          >
            How the consultation works
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ title, body }, i) => (
            <div key={title} className="flex flex-col gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-[family-name:var(--font-display)] text-lg font-semibold text-primary-foreground">
                {i + 1}
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
