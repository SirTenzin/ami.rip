import {
  DEFAULT_FRONTMATTER,
  type PageAlign,
  type PageFrontmatter,
  type ThemeName,
} from "./types";

function normalizeTheme(value: unknown): ThemeName {
  return value === "light" || value === "dark" || value === "adn" || value === "system"
    ? value
    : DEFAULT_FRONTMATTER.theme;
}

function normalizeAlign(value: unknown): PageAlign {
  return value === "middle" || value === "bottom" || value === "top"
    ? value
    : DEFAULT_FRONTMATTER.align;
}

function normalizeFont(value: unknown): string {
  if (typeof value !== "string") {
    return DEFAULT_FRONTMATTER.font;
  }

  return value.trim() || DEFAULT_FRONTMATTER.font;
}

function normalizeFontSize(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value}px`;
  }

  if (typeof value !== "string") {
    return DEFAULT_FRONTMATTER.fontsize;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return DEFAULT_FRONTMATTER.fontsize;
  }

  return /^\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed;
}

export function normalizeFrontmatter(frontmatter: Record<string, unknown>): PageFrontmatter {
  return {
    align: normalizeAlign(frontmatter.align),
    theme: normalizeTheme(frontmatter.theme),
    font: normalizeFont(frontmatter.font),
    fontsize: normalizeFontSize(
      frontmatter.fontsize ?? frontmatter.fontSize ?? frontmatter["font-size"],
    ),
  };
}
