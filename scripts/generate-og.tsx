// Build-time OG image generation with takumi. Run: bun run scripts/generate-og.tsx
// Pulls static usage stats + live GitHub contributions (PAT from env) so the
// card carries real accolade numbers.
import { writeFile } from "node:fs/promises";

import { render } from "takumi-js";

import { fetchContributions } from "../src/lib/github/contributions";
import { USAGE } from "../src/data/usage";

const W = 1200;
const H = 630;
const BG = "#191918";
const RAIL = "#2a2a2a";
const RAIL_INSET = 132; // wider left/right framing

const SQUARES = [
  "#242422", "#3a2f6b", "#5544a8", "#7a68df", "#a594ff", "#5544a8", "#242422",
  "#0e4429", "#26a641", "#39d353", "#26a641", "#242422", "#4d9fff", "#2dd4a7",
];

function compact(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${Math.round(n / 1e6)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return `${n}`;
}

async function liveContributions(): Promise<number | null> {
  const token = process.env.PAT;
  if (!token) return null;
  try {
    const data = await fetchContributions(process.env.GITHUB_LOGIN || "SirTenzin", token);
    return data.total;
  } catch {
    return null;
  }
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ fontSize: 64, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ fontSize: 24, color: "#8a8a8a", marginTop: 10 }}>{label}</span>
    </div>
  );
}

function Og({ contributions }: { contributions: number | null }) {
  const stats = [
    { value: compact(USAGE.totalTokens), label: "tokens" },
    ...(contributions != null ? [{ value: compact(contributions), label: "contributions" }] : []),
  ];

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        backgroundColor: BG,
        color: "#fafafa",
        fontFamily: "sans-serif",
        padding: `0 ${RAIL_INSET + 56}px`,
      }}
    >
      <div style={{ position: "absolute", top: 0, bottom: 0, left: RAIL_INSET, width: 1, backgroundColor: RAIL }} />
      <div style={{ position: "absolute", top: 0, bottom: 0, right: RAIL_INSET, width: 1, backgroundColor: RAIL }} />

      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 96, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1 }}>
          amianthus
        </span>
        <span style={{ fontSize: 32, color: "#9a9a9a", marginTop: 18, letterSpacing: "-0.02em" }}>
          founding swe @ autumn · yc s25
        </span>
      </div>

      <div style={{ display: "flex", gap: 72, marginTop: 56 }}>
        {stats.map((stat) => (
          <Stat key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 56 }}>
        {SQUARES.map((color, index) => (
          <div key={index} style={{ width: 30, height: 30, borderRadius: 7, backgroundColor: color }} />
        ))}
      </div>
    </div>
  );
}

const contributions = await liveContributions();
const png = await render(<Og contributions={contributions} />, { width: W, height: H });
await writeFile("public/og.png", png);
console.log(`wrote public/og.png (${png.length} bytes, contributions: ${contributions ?? "n/a"})`);
