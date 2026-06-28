import type { Plugin } from "vite";

/**
 * Nomo's authoring shortcuts collide with MDX's `{...}` expression syntax, so we
 * rewrite them to JSX *before* MDX parses the file:
 *
 *   {{muted text}}  ->  <Muted>muted text</Muted>
 *   ((badge))       ->  <Badge>badge</Badge>
 *
 * The rewrite is fence- and inline-code-aware so code samples are left alone.
 * `Muted` / `Badge` are supplied through the MDXProvider component map.
 */

const MUTED = /\{\{([\s\S]*?)\}\}/g;
const BADGE = /\(\(([\s\S]*?)\)\)/g;

function transformSegment(text: string): string {
  return text
    .replace(MUTED, (_match, inner: string) => `<Muted>${inner}</Muted>`)
    .replace(BADGE, (_match, inner: string) => `<Badge>${inner}</Badge>`);
}

function transformLine(line: string): string {
  // Leave inline code spans (`...`) untouched, transform everything else.
  return line
    .split(/(`+[^`]*`+)/)
    .map((part) => (part.startsWith("`") ? part : transformSegment(part)))
    .join("");
}

function transformBody(source: string): string {
  let inFence = false;
  let fenceChar: string | null = null;

  return source
    .split(/\r?\n/)
    .map((line) => {
      const fenceMatch = line.trimStart().match(/^(```+|~~~+)/);

      if (fenceMatch) {
        const marker = fenceMatch[1];
        if (!inFence) {
          inFence = true;
          fenceChar = marker[0];
        } else if (fenceChar === marker[0]) {
          inFence = false;
          fenceChar = null;
        }
        return line;
      }

      return inFence ? line : transformLine(line);
    })
    .join("\n");
}

export default function mdxShortcodes(): Plugin {
  return {
    name: "nomo:mdx-shortcodes",
    enforce: "pre",
    transform(code, id) {
      if (!id.split("?")[0].endsWith(".mdx")) {
        return null;
      }

      // Preserve a leading YAML frontmatter block verbatim.
      const frontmatter = code.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
      if (frontmatter) {
        const head = frontmatter[0];
        return head + transformBody(code.slice(head.length));
      }

      return transformBody(code);
    },
  };
}
