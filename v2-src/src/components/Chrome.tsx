import type { ReactElement } from "react";
import { TASKS, TaskId, TOTAL_MAX } from "../data/content";
import type { ThemeChoice } from "../hooks/useTheme";
import { cx } from "./ui";

export function TaskTabs({ current, scores, onGo }: { current: TaskId; scores: number[]; onGo: (id: TaskId) => void }) {
  return (
    <nav className="tabs" aria-label="Задания">
      <ol>
        {TASKS.map((t) => {
          const s = scores[t.id];
          const done = s === t.max;
          return (
            <li key={t.slug}>
              <a
                href={`#${t.slug}`}
                className={cx("tab", current === t.id && "is-current", done && "is-done")}
                aria-current={current === t.id ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  onGo(t.id);
                }}
              >
                <span className="tab-n">{t.id + 1}</span>
                <span className="tab-name">{t.tab}</span>
                <span className="tab-score">
                  {s}/{t.max}
                </span>
                <span className="tab-progress" aria-hidden="true">
                  <i style={{ width: `${(s / t.max) * 100}%` }} />
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function TotalBadge({ total }: { total: number }) {
  return (
    <span className="total" aria-label={`Набрано ${total} из ${TOTAL_MAX}`}>
      <b>{total}</b>
      <span>/{TOTAL_MAX}</span>
    </span>
  );
}

const ICONS: Record<ThemeChoice, ReactElement> = {
  auto: (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 3.5v13a6.5 6.5 0 000-13z" fill="currentColor" />
    </svg>
  ),
  light: (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="10" cy="10" r="3.4" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4" />
    </svg>
  ),
  dark: (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M15.8 12.6A6.6 6.6 0 017.4 4.2 6.6 6.6 0 1015.8 12.6z" />
    </svg>
  ),
};

const THEME_LABEL: Record<ThemeChoice, string> = { auto: "Как в системе", light: "Светлая тема", dark: "Тёмная тема" };

export function ThemeSwitch({ value, onChange }: { value: ThemeChoice; onChange: (t: ThemeChoice) => void }) {
  return (
    <div className="seg seg-icons" role="radiogroup" aria-label="Тема оформления">
      {(Object.keys(ICONS) as ThemeChoice[]).map((t) => (
        <button key={t} type="button" role="radio" aria-checked={value === t} aria-label={THEME_LABEL[t]} title={THEME_LABEL[t]} className={cx("seg-btn", value === t && "is-on")} onClick={() => onChange(t)}>
          {ICONS[t]}
        </button>
      ))}
    </div>
  );
}
