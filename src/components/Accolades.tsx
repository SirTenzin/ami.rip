import { type MouseEvent, useEffect, useMemo, useRef, useState } from "react";

import type { ContribDay, Contributions } from "../lib/github/contributions";
import { USAGE, type UsageDay, type UsageModel } from "../data/usage";

const SIZE = 11;
const GAP = 3;
const STEP = SIZE + GAP;
const TOKEN_LEVELS = ["#242422", "#3a2f6b", "#5544a8", "#7a68df", "#a594ff"];
const GH_LEVELS = ["#242422", "#0e4429", "#006d32", "#26a641", "#39d353"];

function formatTokens(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${Math.round(n / 1e6)}M`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}k`;
  return `${n}`;
}

function prettyModel(name: string): string {
  return (name.split("/").pop() ?? name)
    .replace(/^anthropic\./, "")
    .replace(/^claude-/, "")
    .replace(/^gpt-/, "gpt ")
    .replace(/(\d)-(\d)/g, "$1.$2")
    .replace(/-/g, " ");
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`)
    .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    .toLowerCase();
}

function mergedModels(day: UsageDay): UsageModel[] {
  const totals = new Map<string, number>();
  for (const model of day.models) {
    const key = prettyModel(model.name);
    totals.set(key, (totals.get(key) ?? 0) + model.total);
  }
  return [...totals.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
}

// Walks the calendar from the Sunday before `start` to `end`, placing each dated
// day at (week column, weekday row). `valueFor` decides its colour level.
function buildGrid<T extends { date: string }>(
  items: T[],
  start: string,
  end: string,
  level: (item: T | undefined) => number,
) {
  const DAY = 86_400_000;
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  const gridStart = new Date(startDate);
  gridStart.setUTCDate(startDate.getUTCDate() - startDate.getUTCDay());
  const byDate = new Map(items.map((item) => [item.date, item]));

  const cells: Array<{ col: number; row: number; lvl: number; item: T | undefined }> = [];
  let weeks = 0;
  for (let t = gridStart.getTime(); t <= endDate.getTime(); t += DAY) {
    const date = new Date(t);
    const col = Math.floor((t - gridStart.getTime()) / (7 * DAY));
    const item = t >= startDate.getTime() ? byDate.get(date.toISOString().slice(0, 10)) : undefined;
    cells.push({ col, row: date.getUTCDay(), lvl: item ? level(item) : 0, item });
    weeks = Math.max(weeks, col + 1);
  }
  return { cells, width: weeks * STEP - GAP, height: 7 * STEP - GAP };
}

function Grid<T extends { date: string }>({
  cells,
  width,
  height,
  levels,
  ariaLabel,
  onHover,
  onLeave,
}: {
  cells: Array<{ col: number; row: number; lvl: number; item: T | undefined }>;
  width: number;
  height: number;
  levels: string[];
  ariaLabel: string;
  onHover: (event: MouseEvent, item: T) => void;
  onLeave: () => void;
}) {
  if (width <= 0) return null;
  return (
    <svg
      aria-label={ariaLabel}
      className="heatmap__grid"
      onMouseLeave={onLeave}
      role="img"
      viewBox={`0 0 ${width} ${height}`}
    >
      {cells.map((cell) => (
        <rect
          fill={levels[cell.lvl] ?? levels[0]}
          height={SIZE}
          key={`${cell.col}-${cell.row}`}
          onMouseMove={cell.item ? (event) => onHover(event, cell.item as T) : undefined}
          rx={2}
          width={SIZE}
          x={cell.col * STEP}
          y={cell.row * STEP}
        />
      ))}
    </svg>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="accolade-stat">
      <span className="accolade-stat__value">{value}</span>
      <span className="accolade-stat__label">{label}</span>
    </div>
  );
}

type TokenHover = { day: UsageDay; x: number; y: number };
type GhHover = { day: ContribDay; x: number; y: number };

function TokenHeatmap() {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<TokenHover | null>(null);

  const grid = useMemo(() => {
    const nonzero = USAGE.daily.map((d) => d.total).filter((v) => v > 0).sort((a, b) => a - b);
    const q = (p: number) => nonzero[Math.floor(p * (nonzero.length - 1))] ?? 0;
    const [t1, t2, t3] = [q(0.25), q(0.5), q(0.75)];
    const level = (d?: UsageDay) =>
      !d || d.total <= 0 ? 0 : d.total <= t1 ? 1 : d.total <= t2 ? 2 : d.total <= t3 ? 3 : 4;
    return buildGrid(USAGE.daily, USAGE.start, USAGE.end, level);
  }, []);

  const track = (event: MouseEvent, day: UsageDay) => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setHover({ day, x: event.clientX - rect.left, y: event.clientY - rect.top });
  };

  return (
    <div className="heatmap" ref={ref}>
      <Grid
        ariaLabel="ai token usage over the last year"
        cells={grid.cells}
        height={grid.height}
        levels={TOKEN_LEVELS}
        onHover={track}
        onLeave={() => setHover(null)}
        width={grid.width}
      />
      {hover ? (
        <div className="heatmap__tip" style={{ left: hover.x, top: hover.y }}>
          <div className="heatmap__tip-head">
            <span className="heatmap__tip-date">{formatDate(hover.day.date)}</span>
            <span className="heatmap__tip-total">{formatTokens(hover.day.total)}</span>
          </div>
          {hover.day.total > 0 ? (
            mergedModels(hover.day).map((model) => (
              <div className="heatmap__tip-row" key={model.name}>
                <span
                  className="heatmap__tip-bar"
                  style={{ width: `${Math.max(5, (model.total / hover.day.total) * 100)}%` }}
                />
                <span className="heatmap__tip-name">{model.name}</span>
                <span className="heatmap__tip-val">{formatTokens(model.total)}</span>
              </div>
            ))
          ) : (
            <div className="heatmap__tip-empty">no usage</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function GithubHeatmap({ days }: { days: ContribDay[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<GhHover | null>(null);

  const grid = useMemo(() => {
    if (days.length === 0) return { cells: [], width: 0, height: 0 };
    return buildGrid(days, days[0].date, days[days.length - 1].date, (d?: ContribDay) => d?.level ?? 0);
  }, [days]);

  const track = (event: MouseEvent, day: ContribDay) => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setHover({ day, x: event.clientX - rect.left, y: event.clientY - rect.top });
  };

  return (
    <div className="heatmap heatmap--github" ref={ref}>
      <Grid
        ariaLabel="github contributions over the last year"
        cells={grid.cells}
        height={grid.height}
        levels={GH_LEVELS}
        onHover={track}
        onLeave={() => setHover(null)}
        width={grid.width}
      />
      {hover ? (
        <div className="heatmap__tip" style={{ left: hover.x, top: hover.y }}>
          <div className="heatmap__tip-head">
            <span className="heatmap__tip-date">{formatDate(hover.day.date)}</span>
            <span className="heatmap__tip-total">{hover.day.count}</span>
          </div>
          <div className="heatmap__tip-empty">
            {hover.day.count === 1 ? "1 contribution" : `${hover.day.count} contributions`}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function Accolades() {
  const [gh, setGh] = useState<Contributions | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/github-heatmap")
      .then((response) => (response.ok ? response.json() : null))
      .then((json: Contributions | null) => {
        if (!cancelled && json) setGh(json);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="accolades">
      <div className="accolade-stats">
        <Stat label="tokens" value={formatTokens(USAGE.totalTokens)} />
        <Stat label="active days" value={`${USAGE.activeDays}`} />
        <Stat label="longest streak" value={`${USAGE.longestStreak}d`} />
        <Stat label="top model" value={prettyModel(USAGE.mostUsedModel.name)} />
        <Stat label="contributions" value={gh ? gh.total.toLocaleString("en-US") : "—"} />
      </div>

      <TokenHeatmap />
      <GithubHeatmap days={gh?.days ?? []} />
    </div>
  );
}
