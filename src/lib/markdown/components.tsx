/* eslint-disable react-refresh/only-export-components */

import type { MDXComponents } from "mdx/types";
import {
	type AnchorHTMLAttributes,
	type CSSProperties,
	createElement,
	type HTMLAttributes,
	type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import Accolades from "../../components/Accolades";
import Card from "../../components/Card";
import PRCards from "../../components/PRCards";
import { isExternalHref } from "../content/paths";
import { Gallery } from "./Gallery";
import { isVideoSource } from "./media";

type LineGapProps = { "data-line-gap"?: string | number };

function blockStyle(
	props: LineGapProps,
	style: CSSProperties | undefined,
): CSSProperties | undefined {
	const gap = Number(props["data-line-gap"]);
	if (!Number.isFinite(gap) || gap <= 0) {
		return style;
	}

	return { ...style, marginTop: `${gap}em` };
}

function withBlockGap<T extends keyof HTMLElementTagNameMap>(tag: T) {
	return ({ style, ...props }: HTMLAttributes<HTMLElement> & LineGapProps) =>
		createElement(tag, { ...props, style: blockStyle(props, style) });
}

function LinkIcon() {
	return (
		<svg
			aria-hidden="true"
			className="markdown-link__icon"
			fill="none"
			height="12"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
			viewBox="0 0 24 24"
			width="12"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path d="M7 7h10v10" />
			<path d="M7 17 17 7" />
		</svg>
	);
}

function MarkdownLink({
	children,
	href,
	...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
	const label = <span className="markdown-link__label">{children}</span>;

	if (href && href.startsWith("/")) {
		return (
			<Link className="markdown-link" to={href}>
				{label}
				<LinkIcon />
			</Link>
		);
	}

	const external = isExternalHref(href);

	return (
		<a
			{...props}
			className="markdown-link"
			href={href}
			rel={external ? "noreferrer" : props.rel}
			target={external ? "_blank" : props.target}
		>
			{label}
			<LinkIcon />
		</a>
	);
}

function parseDimensions(alt: string | null | undefined): {
	alt: string | undefined;
	width: number | undefined;
	height: number | undefined;
} {
	if (!alt) {
		return { alt: undefined, width: undefined, height: undefined };
	}

	const match = alt.match(/^(.*?):(\d+)(?:x(\d+))?$/);
	if (!match) {
		return { alt, width: undefined, height: undefined };
	}

	return {
		alt: match[1].trim() || undefined,
		width: Number(match[2]),
		height: match[3] ? Number(match[3]) : undefined,
	};
}

function MarkdownMedia({
	alt,
	className,
	src,
	title,
}: {
	alt?: string | null;
	className?: string;
	src?: string;
	title?: string;
}) {
	const parsed = parseDimensions(alt);
	const style: CSSProperties | undefined =
		parsed.width || parsed.height
			? {
					width: parsed.width ? `${parsed.width}px` : undefined,
					height: parsed.height ? `${parsed.height}px` : undefined,
				}
			: undefined;

	const mediaClass = [
		"markdown-media",
		parsed.width && parsed.height ? "markdown-media--framed" : "",
		className ?? "",
	]
		.filter(Boolean)
		.join(" ");

	if (isVideoSource(src)) {
		return (
			<video
				autoPlay
				className={mediaClass}
				height={parsed.height}
				loop
				muted
				playsInline
				src={src}
				style={style}
				title={title}
				width={parsed.width}
			/>
		);
	}

	return (
		<img
			alt={parsed.alt}
			className={mediaClass}
			height={parsed.height}
			src={src}
			style={style}
			title={title}
			width={parsed.width}
		/>
	);
}

function Muted({ children }: { children?: ReactNode }) {
	return <span className="markdown-muted">{children}</span>;
}

function Badge({ children }: { children?: ReactNode }) {
	return <span className="markdown-badge">{children}</span>;
}

export const mdxComponents: MDXComponents = {
	a: MarkdownLink,
	img: MarkdownMedia,
	p: withBlockGap("p"),
	h1: withBlockGap("h1"),
	h2: withBlockGap("h2"),
	h3: withBlockGap("h3"),
	h4: withBlockGap("h4"),
	h5: withBlockGap("h5"),
	h6: withBlockGap("h6"),
	hr: withBlockGap("hr"),
	ul: withBlockGap("ul"),
	ol: withBlockGap("ol"),
	blockquote: withBlockGap("blockquote"),
	pre: withBlockGap("pre"),
	table: withBlockGap("table"),
	Muted,
	Badge,
	Gallery,
	Card,
	Accolades,
	PRCards: PRCards,
};
