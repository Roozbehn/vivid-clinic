import { clinic } from "@/lib/clinic";

export function HeroSection() {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-gradient-to-b from-primary/[0.06] via-background to-background px-6 pb-16 pt-24 sm:pb-24 sm:pt-32"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <span className="rounded-full border border-border bg-card px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
          {clinic.descriptor}
        </span>

        <h1 className="mt-6 font-[family-name:var(--font-display)] text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl">
          Real reviews from real
          <span className="italic text-primary"> Vivid Clinic </span>
          patients
        </h1>

        <p className="mt-6 max-w-xl text-balance text-lg leading-relaxed text-muted-foreground">
          {clinic.tagline} 159 verified Google reviews, a 5.0 average, and
          patients who came back to say so.
        </p>

        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <a
            href={`${clinic.contact.whatsappUrl}&text=${encodeURIComponent(
              clinic.contact.whatsappPrefill,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-md)] transition-shadow hover:shadow-[var(--shadow-hover)]"
          >
            Free consultation on WhatsApp
          </a>
          <a
            href="#testimonials"
            className="inline-flex items-center justify-center rounded-full border border-border px-7 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Read patient reviews
          </a>
        </div>

        <dl className="mt-14 grid w-full max-w-md grid-cols-3 gap-6 border-t border-border pt-8">
          <div className="flex flex-col items-center">
            <dt className="sr-only">Average rating</dt>
            <dd className="font-[family-name:var(--font-display)] text-3xl font-semibold text-primary">
              5.0
            </dd>
            <dd className="mt-1 text-xs text-muted-foreground">Avg. rating</dd>
          </div>
          <div className="flex flex-col items-center border-x border-border">
            <dt className="sr-only">Total Google reviews</dt>
            <dd className="font-[family-name:var(--font-display)] text-3xl font-semibold text-primary">
              159
            </dd>
            <dd className="mt-1 text-xs text-muted-foreground">
              Google reviews
            </dd>
          </div>
          <div className="flex flex-col items-center">
            <dt className="sr-only">Percentage five-star</dt>
            <dd className="font-[family-name:var(--font-display)] text-3xl font-semibold text-primary">
              98%
            </dd>
            <dd className="mt-1 text-xs text-muted-foreground">Are 5★</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
