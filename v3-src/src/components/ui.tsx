import type { ReactNode } from "react";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3.5 8.4l2.8 2.8 6.2-6.6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CrossIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Verdict({ ok }: { ok: boolean }) {
  return (
    <span className={cx("verdict", ok ? "is-ok" : "is-bad")} aria-label={ok ? "Верно" : "Неверно"}>
      {ok ? <CheckIcon size={12} /> : <CrossIcon size={12} />}
    </span>
  );
}

interface SegmentedProps<T extends string | number> {
  label: string;
  options: ReadonlyArray<{ value: T; label: ReactNode; title?: string }>;
  value: T | null;
  onChange: (v: T) => void;
  size?: "md" | "sm";
}

export function Segmented<T extends string | number>({ label, options, value, onChange, size = "md" }: SegmentedProps<T>) {
  return (
    <div className={cx("seg", size === "sm" && "seg-sm")} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          title={o.title}
          className={cx("seg-btn", value === o.value && "is-on")}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export type ChoiceState = "idle" | "good" | "weak";

interface ChoiceListProps {
  label: string;
  options: readonly string[];
  value: number | null;
  onChange: (i: number) => void;
  states?: ChoiceState[];
}

/** Список вариантов с одним выбором: строки как в тетради, отметка справа. */
export function ChoiceList({ label, options, value, onChange, states }: ChoiceListProps) {
  return (
    <div className="choices" role="radiogroup" aria-label={label}>
      {options.map((text, i) => {
        const st = states?.[i] ?? "idle";
        return (
          <button
            key={text}
            type="button"
            role="radio"
            aria-checked={value === i}
            className={cx("choice", value === i && "is-on", st === "good" && "is-good", st === "weak" && "is-weak")}
            onClick={() => onChange(i)}
          >
            <span className="choice-text">{text}</span>
            <span className="choice-mark" aria-hidden="true">
              {st === "weak" ? <CrossIcon size={14} /> : <CheckIcon size={14} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Note({ tone, children }: { tone: "ok" | "bad" | "info"; children: ReactNode }) {
  return (
    <div className={cx("note", `note-${tone}`)} role="status">
      {children}
    </div>
  );
}

export function Cta({ children }: { children: ReactNode }) {
  return <div className="cta-row">{children}</div>;
}

export function Chip({ children, tone }: { children: ReactNode; tone?: "marker" | "score" }) {
  return <span className={cx("chip", tone && `chip-${tone}`)}>{children}</span>;
}
