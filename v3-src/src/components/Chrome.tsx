import { TASKS, TaskId, TOTAL_MAX } from "../data/content";
import { useCountUp } from "../hooks/motion";
import type { ThemeChoice } from "../hooks/useTheme";
import { cx } from "./ui";

/** Знак «Нейролаба»: абстрактный нейрон без подписи, как фирменный символ в шапке. */
export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="6" cy="8" r="3" />
      <circle cx="6" cy="24" r="3" />
      <circle cx="19" cy="16" r="5.5" fill="currentColor" stroke="none" />
      <path d="M9 9.5l5.2 3.8M9 22.5l5.2-3.8M24.5 16H30" />
    </svg>
  );
}

/** Навигация по заданиям: двухстрочные ячейки — номер и баллы сверху, название снизу. */
export function TaskNav({ current, scores, onGo }: { current: TaskId; scores: number[]; onGo: (id: TaskId) => void }) {
  return (
    <nav className="tasknav" aria-label="Задания">
      <ol>
        {TASKS.map((t) => {
          const s = scores[t.id];
          const done = s === t.max;
          return (
            <li key={t.slug}>
              <a
                href={`#${t.slug}`}
                className={cx("navcell", current === t.id && "is-current", done && "is-done")}
                aria-current={current === t.id ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  onGo(t.id);
                }}
              >
                <span className="navcell-top">
                  {String(t.id + 1).padStart(2, "0")} · {s}/{t.max}
                </span>
                <span className="navcell-name">{t.tab}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function TotalBadge({ total }: { total: number }) {
  const shown = useCountUp(total);
  return (
    <span className="total" aria-label={`Набрано ${total} из ${TOTAL_MAX}`}>
      <b>{shown}</b>
      <span>/{TOTAL_MAX}</span>
    </span>
  );
}

export function ThemeSwitch({ value, onChange }: { value: ThemeChoice; onChange: (t: ThemeChoice) => void }) {
  const next: ThemeChoice = value === "dark" ? "light" : "dark";
  const label = next === "light" ? "Включить светлую тему" : "Включить тёмную тему";
  return (
    <button type="button" className="icon-btn" aria-label={label} title={label} onClick={() => onChange(next)}>
      {value === "dark" ? (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
          <path d="M19 14.6A7.5 7.5 0 019.4 5a7.5 7.5 0 109.6 9.6z" />
        </svg>
      )}
    </button>
  );
}
