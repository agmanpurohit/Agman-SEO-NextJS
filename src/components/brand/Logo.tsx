import { logo_full, logo_mark, logo_word } from "./logo-paths";

type Variant = "mark" | "full" | "word";
const sources = { mark: logo_mark, full: logo_full, word: logo_word };

/**
 * Agman's supplied logo, traced to vector. Light parts follow `currentColor`;
 * the notch / rules use the ember accent. Proportions are never altered.
 */
export function Logo({
  variant = "mark",
  className,
  title = "Agman Rajpurohit",
  accent = true,
}: {
  variant?: Variant;
  className?: string;
  title?: string | null;
  accent?: boolean;
}) {
  const s = sources[variant];
  return (
    <svg
      viewBox={s.viewBox}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title ?? undefined}
      aria-hidden={title ? undefined : true}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path data-logo="light" fill="currentColor" fillRule="evenodd" d={s.light} />
      {s.accent && (
        <path
          data-logo="accent"
          fill={accent ? "var(--color-ember)" : "currentColor"}
          fillRule="evenodd"
          d={s.accent}
        />
      )}
    </svg>
  );
}
