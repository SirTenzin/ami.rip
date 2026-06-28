export function isExternalHref(href: string | undefined): boolean {
  return typeof href === "string" && /^https?:\/\//i.test(href);
}
