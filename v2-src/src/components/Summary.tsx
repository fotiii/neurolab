import { useState } from "react";
import type { Dispatch } from "react";
import { markFor, MOODS, QUIZ, TASKS, TOTAL_MAX } from "../data/content";
import type { Action, LabState } from "../hooks/useLab";
import { ChoiceList, Cta, cx } from "./ui";

export function Summary({ state, dispatch, scores }: { state: LabState; dispatch: Dispatch<Action>; scores: number[] }) {
  const { picks, checked } = state.t5;
  const left = picks.filter((p) => p === null).length;
  const total = scores.reduce((a, b) => a + b, 0);
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");
  const [confirmReset, setConfirmReset] = useState(false);

  const resultText = [
    `Нейролаб 11 — ${state.name.trim() || "ученик не указан"}`,
    `Итог: ${total} из ${TOTAL_MAX}, ${markFor(total).toLowerCase()}`,
    ...TASKS.map((t, i) => `${t.tab}: ${scores[i]} из ${t.max}`),
    state.mood !== null ? `Самооценка: ${MOODS[state.mood]}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(resultText);
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
  };

  const r = 56;
  const circ = 2 * Math.PI * r;

  return (
    <>
      <div className="quiz">
        {QUIZ.map((q, i) => (
          <section key={q.q} className="block">
            <h3 className="block-title">
              {i + 1}. {q.q}
            </h3>
            <ChoiceList
              label={`Вопрос ${i + 1}`}
              options={q.options}
              value={picks[i]}
              onChange={(o) => dispatch({ type: "t5/pick", index: i, option: o })}
              states={q.options.map((_, j) => (!checked ? "idle" : j === q.answer && picks[i] !== null ? "good" : picks[i] === j ? "weak" : "idle"))}
            />
          </section>
        ))}
      </div>
      <Cta>
        <button type="button" className="btn btn-primary" disabled={left > 0} onClick={() => dispatch({ type: "t5/check" })}>
          {left > 0 ? `Осталось вопросов: ${left}` : "Проверить ответы"}
        </button>
      </Cta>

      <section className="sheet result" aria-label="Результат">
        <div className="ring">
          <svg viewBox="0 0 132 132" aria-hidden="true">
            <circle cx="66" cy="66" r={r} className="ring-track" />
            <circle cx="66" cy="66" r={r} className="ring-bar" strokeDasharray={circ} strokeDashoffset={circ * (1 - total / TOTAL_MAX)} />
          </svg>
          <div className="ring-num">
            <b>{total}</b>
            <span>из {TOTAL_MAX}</span>
          </div>
        </div>
        <div className="result-body">
          <h3>{markFor(total)}</h3>
          <p className="muted">{state.name.trim() || "Ученик не указан"}</p>
          <ul className="bars">
            {TASKS.map((t, i) => (
              <li key={t.slug}>
                <span>{t.tab}</span>
                <span className="muted">
                  {scores[i]} из {t.max}
                </span>
                <span className="bar">
                  <i style={{ width: `${(scores[i] / t.max) * 100}%` }} />
                </span>
              </li>
            ))}
          </ul>
          <div className="btn-row">
            <button type="button" className="btn btn-ghost" onClick={copy}>
              {copied === "ok" ? "Скопировано" : "Скопировать результат"}
            </button>
          </div>
          {copied === "fail" && (
            <textarea className="copy-fallback" readOnly value={resultText} rows={8} onFocus={(e) => e.currentTarget.select()} aria-label="Результат для копирования" />
          )}
        </div>
      </section>

      <section className="block">
        <h3 className="block-title">Как прошёл урок для вас?</h3>
        <ChoiceList label="Самооценка" options={MOODS} value={state.mood} onChange={(m) => dispatch({ type: "mood", value: m })} />
      </section>

      <section className={cx("block", "reset", confirmReset && "is-confirm")}>
        {confirmReset ? (
          <>
            <p>
              <b>Сбросить результаты?</b> Удалятся имя, все ответы и баллы на этом устройстве.
            </p>
            <div className="btn-row">
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  dispatch({ type: "reset" });
                  setConfirmReset(false);
                  window.location.hash = TASKS[0].slug;
                }}
              >
                Сбросить
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(false)}>
                Отмена
              </button>
            </div>
          </>
        ) : (
          <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(true)}>
            Начать заново
          </button>
        )}
      </section>
    </>
  );
}
