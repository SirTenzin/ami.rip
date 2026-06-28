// Custom remark transforms shared by the MDX pipeline.

type GapNode = {
  type: string;
  position?: { start?: { line?: number }; end?: { line?: number } };
  data?: { hProperties?: Record<string, string> };
};

type ParagraphNode = {
  type: string;
  children?: Array<{ type: string }>;
};

type RemarkPlugin = () => (tree: unknown) => void;

/**
 * Annotates each top-level block with `data-line-gap`, the number of blank
 * source lines that preceded it, so the renderer can preserve intentional
 * vertical spacing from the markdown source.
 */
export const remarkSourceSpacing: RemarkPlugin = () => (tree) => {
  const children = (tree as { children?: GapNode[] }).children ?? [];
  let previousEndLine: number | null = null;

  for (const child of children) {
    if (typeof child.position?.start?.line !== "number") {
      continue;
    }

    const lineGap =
      previousEndLine === null
        ? 0
        : Math.max(child.position.start.line - previousEndLine - 1, 0);

    child.data ??= {};
    child.data.hProperties ??= {};
    child.data.hProperties["data-line-gap"] = String(lineGap);

    previousEndLine = child.position?.end?.line ?? child.position.start.line;
  }
};

/**
 * Drops the soft break inserted after a leading image in a paragraph so an
 * image followed by text on the next line doesn't render a stray gap.
 */
export const remarkLeadingImageBreak: RemarkPlugin = () => (tree) => {
  const children = (tree as { children?: ParagraphNode[] }).children ?? [];

  for (const child of children) {
    if (child.type !== "paragraph" || !child.children || child.children.length < 2) {
      continue;
    }

    if (child.children[0].type === "image" && child.children[1].type === "break") {
      child.children.splice(1, 1);
    }
  }
};
