import type { Dispatch } from "react";
import { SENTENCES } from "../data/content";
import type { Action, LabState } from "../hooks/useLab";
import { Cta, Note, cx } from "./ui";

export function FactCheck({ state, dispatch }: { state: LabState; dispatch: Dispatch<Action> }) {
  const { marked, checked } = state.t4;
  const caught = marked.filter((m, i) => m && !SENTENCES[i].true).length;
  const falseAlarms = marked.filter((m, i) => m && SENTENCES[i].true).length;
  const count = marked.filter(Boolean).length;

  return (
    <>
      <div className="sheet chat">
        <p className="who who-me">Ученик</p>
        <div className="bubble bubble-me">
          <p>Коротко расскажи историю искусственного интеллекта.</p>
        </div>
        <p className="who">Чат-бот</p>
        <div className="answer">
          {SENTENCES.map((s, i) => {
            const isFalse = !s.true;
            const state = checked ? (isFalse && marked[i] ? "is-caught" : isFalse ? "is-missed" : marked[i] ? "is-wrong" : "") : "";
            return (
              <button
                key={s.text}
                type="button"
                aria-pressed={marked[i]}
                className={cx("sent", marked[i] && "is-marked", state)}
                onClick={() => dispatch({ type: "t4/toggle", index: i })}
              >
                {s.text}
              </button>
            );
          })}
        </div>
      </div>
      <Cta>
        <button type="button" className="btn btn-primary" disabled={count === 0} onClick={() => dispatch({ type: "t4/check" })}>
          {count === 0 ? "Отметьте ложные предложения" : `Проверить (отмечено: ${count})`}
        </button>
      </Cta>
      {checked && (
        <Note tone={caught === 3 && falseAlarms === 0 ? "ok" : "info"}>
          <p>
            <b>
              Найдено ошибок: {caught} из 3{falseAlarms > 0 ? `, лишних отметок: ${falseAlarms}` : ""}.
            </b>
          </p>
          <ul className="fixes">
            {SENTENCES.map((s, i) =>
              s.true ? null : (
                <li key={s.text}>
                  {marked[i] ? "Найдено" : "Пропущено"}: {s.fix}
                </li>
              ),
            )}
          </ul>
          <p>Уверенный тон не гарантирует правильность. Даты, имена и факты проверяйте по надёжным источникам.</p>
        </Note>
      )}
    </>
  );
}
