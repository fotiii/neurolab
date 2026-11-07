import type { Dispatch } from "react";
import { CASES } from "../data/content";
import type { Action, LabState } from "../hooks/useLab";
import { Cta, Note, Segmented, Verdict } from "./ui";

export function WhereAI({ state, dispatch, score }: { state: LabState; dispatch: Dispatch<Action>; score: number }) {
  const { picks, checked } = state.t1;
  const left = picks.filter((p) => p === null).length;
  return (
    <>
      <ol className="sheet cases">
        {CASES.map((c, i) => {
          const pick = picks[i];
          const ok = pick === c.isAI;
          return (
            <li key={c.text} className="case">
              <span className="case-n" aria-hidden="true">
                {i + 1}
              </span>
              <p className="case-text">{c.text}</p>
              <Segmented<"ai" | "algo">
                label={`Ситуация ${i + 1}`}
                value={pick === null ? null : pick ? "ai" : "algo"}
                onChange={(v) => dispatch({ type: "t1/pick", index: i, value: v === "ai" })}
                options={[
                  { value: "ai", label: "Обучена" },
                  { value: "algo", label: "Алгоритм" },
                ]}
              />
              {checked && pick !== null && (
                <p className="case-why">
                  <Verdict ok={ok} />
                  <span>
                    {ok ? "Верно." : "Неверно."} {c.why}
                  </span>
                </p>
              )}
            </li>
          );
        })}
      </ol>
      <Cta>
        <button type="button" className="btn btn-primary" disabled={left > 0} onClick={() => dispatch({ type: "t1/check" })}>
          {left > 0 ? `Осталось ответить: ${left}` : "Проверить"}
        </button>
      </Cta>
      {checked &&
        (score === CASES.length ? (
          <Note tone="ok">
            <b>8 из 8.</b> Общий признак ИИ: решение не записано заранее, а получено обучением на данных.
          </Note>
        ) : (
          <Note tone="info">
            <b>Верно {score} из 8.</b> Прочитайте пояснения к ошибкам и измените ответы.
          </Note>
        ))}
    </>
  );
}
