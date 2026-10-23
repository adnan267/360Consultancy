import { cx } from "./ui";

/** Real SVG flag (flag-icons, MIT). `code` = lower-case ISO 3166-1 alpha-2. */
export function Flag({ code, label, className }: { code: string; label: string; className?: string }) {
  return (
    <span role="img" aria-label={`Flag of ${label}`} className={cx("fi inline-block shrink-0 overflow-hidden rounded-[3px] shadow-sm ring-1 ring-black/10", `fi-${code}`, className)} style={{ lineHeight: 1 }} />
  );
}
