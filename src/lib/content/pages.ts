import type { ComponentType } from "react";

import { normalizeFrontmatter } from "./frontmatter";
import { DEFAULT_FRONTMATTER, type PageFrontmatter } from "./types";

type MdxModule = {
  default: ComponentType;
  frontmatter?: Record<string, unknown>;
};

type Page = {
  Component: ComponentType;
  frontmatter: PageFrontmatter;
};

export type ResolvedRoute = Page & { slug: string };

const modules = import.meta.glob<MdxModule>("/pages/**/*.mdx", { eager: true });

const pages = new Map<string, Page>();

for (const [path, mod] of Object.entries(modules)) {
  const slug = path
    .replace(/^\/pages\//, "")
    .replace(/\.mdx$/i, "")
    .toLowerCase();

  pages.set(slug, {
    Component: mod.default,
    frontmatter: normalizeFrontmatter(mod.frontmatter ?? {}),
  });
}

const EMPTY: Page = {
  Component: () => null,
  frontmatter: DEFAULT_FRONTMATTER,
};

export function getRoute(pathname: string): ResolvedRoute {
  const slug = pathname.split("/").filter(Boolean).join("/").toLowerCase() || "home";

  const page = pages.get(slug);
  if (page) {
    return { ...page, slug };
  }

  return { ...(pages.get("404") ?? EMPTY), slug: "404" };
}
