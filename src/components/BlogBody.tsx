import { Fragment } from "react";

/** Renders plain-text article bodies safely (no HTML is ever injected). "## " = heading, "- " = bullet, blank line = paragraph. */
export function BlogBody({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-5">
      {blocks.map((b, i) => {
        if (b.startsWith("## ")) return <h2 key={i} className="pt-4 text-2xl font-extrabold text-navy-900">{b.slice(3)}</h2>;
        const lines = b.split("\n");
        if (lines.every((l) => l.startsWith("- "))) return <ul key={i} className="list-disc space-y-1.5 pl-5 text-muted">{lines.map((l, j) => <li key={j}>{l.slice(2)}</li>)}</ul>;
        return <p key={i} className="leading-relaxed text-muted">{lines.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{l}</Fragment>)}</p>;
      })}
    </div>
  );
}
