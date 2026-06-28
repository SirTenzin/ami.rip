import type { CSSProperties } from "react";

import { PRS, type Pr } from "../data/prs";

const AREA_COLOR: Record<string, string> = {
  "external psps": "#8b7bff",
  analytics: "#2dd4a7",
  auth: "#4d9fff",
  billing: "#7bd86b",
  infra: "#ff7a6b",
};

function PRCard({ pr }: { pr: Pr }) {
  const color = AREA_COLOR[pr.area] ?? "#8b7bff";

  return (
    <a
      className="card card--inner card--hoverable pr-card"
      href={pr.url}
      rel="noreferrer"
      style={{ "--accent": color } as CSSProperties}
      target="_blank"
    >
      <div className="pr-card__meta">
        <span className="pr-card__area">{pr.area}</span>
        {" · "}
        {pr.repo.split("/")[1]}#{pr.number}
      </div>
      <div className="pr-card__title">{pr.title}</div>
      <div className="pr-card__stats">
        <span className="pr-card__add">+{pr.additions.toLocaleString("en-US")}</span>
        <span className="pr-card__del">−{pr.deletions.toLocaleString("en-US")}</span>
        <span className="pr-card__files">{pr.changedFiles} files</span>
      </div>
    </a>
  );
}

export default function PRCards() {
  return (
    <div className="card card--outer pr-cards">
      {PRS.map((pr) => (
        <PRCard key={`${pr.repo}#${pr.number}`} pr={pr} />
      ))}
    </div>
  );
}
