import type { HTMLAttributes, ReactNode } from "react";

/**
 * Layered surface ported from chord.so (dqnamo/chord).
 *
 *   layer={0}  outer frame
 *   layer={1}  inner card (use `hoverable` for the interactive variant)
 *
 * Additive to chord's API: pass `href` to render the card as a link
 * (whole-card clickable). External hrefs open in a new tab.
 */

const LAYER_CLASS = ["card card--outer", "card card--inner"] as const;

export default function Card({
  layer = 0,
  hoverable = false,
  href,
  className,
  children,
  ...props
}: {
  layer?: 0 | 1;
  hoverable?: boolean;
  href?: string;
  children: ReactNode;
} & HTMLAttributes<HTMLElement>) {
  const classes = [
    LAYER_CLASS[layer] ?? LAYER_CLASS[0],
    hoverable ? "card--hoverable" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    const external = /^https?:\/\//i.test(href);
    return (
      <a
        className={classes}
        href={href}
        rel={external ? "noreferrer" : undefined}
        target={external ? "_blank" : undefined}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
