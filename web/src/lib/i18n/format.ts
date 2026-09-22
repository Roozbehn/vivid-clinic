// {token} interpolation, matching the static site's fmt() in scripts/build-site.mjs.
// Tokens with no provided value are left intact rather than silently dropped,
// so a missing translation param is obvious in the rendered page.
export function fmt(template: string, vars?: Record<string, string | number>): string {
  return String(template).replace(/\{(\w+)\}/g, (match, key: string) =>
    vars && key in vars ? String(vars[key]) : match,
  );
}
