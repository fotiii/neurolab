import type { Dispatch } from "react";
import { PAIRS, PROMPT_PARTS } from "../data/content";
import type { Action, LabState } from "../hooks/useLab";
import { ChoiceList, Cta, Note, cx } from "./ui";

export function PromptBuilder({ state, dispatch }: { state: LabState; dispatch: Dispatch<Action> }) {
  const { parts, pairs, checkedParts, checkedPairs } = state.t3;
  const chosen = parts.filter((p) => p !== null).length;
  const goodNow = parts.filter((p, i) => p !== null && PROMPT_PARTS[i].options[p].good).length;
  const text = parts
    .map((p, i) => (p === null ? null : PROMPT_PARTS[i].options[p].text))
    .filter((t): t is string => t !== null && t !== "Без роли.");
  const pairsLeft = pairs.filter((p) => p === null).length;
  const pairsRight = pairs.filter((p, i) => p === PAIRS[i].better).length;

  return (
    <>
      <div className="compose">
        <div className="compose-parts">
          {PROMPT_PARTS.map((part, i) => (
            <section key={part.key} className="block">
              <h3 className="block-title">
                {i + 1}. {part.key} <span className="muted">— {part.hint}</span>
              </h3>
              <ChoiceList
                label={part.key}
                options={part.options.map((o) => o.text)}
                value={parts[i]}
                onChange={(o) => dispatch({ type: "t3/part", index: i, option: o })}
                states={part.options.map((o, j) => (checkedParts && parts[i] === j ? (o.good ? "good" : "weak") : "idle"))}
              />
            </section>
          ))}
        </div>

        <aside className="compose-preview" aria-label="Собранный запрос">
          <div className="sheet chat">
            <div className="sheet-head">
              <span>Ваш запрос</span>
              <span className="muted">{chosen} из 5 частей</span>
            </div>
            <div className={cx("bubble", text.length === 0 && "is-empty")}>
              {text.length ? text.map((t) => <p key={t}>{t}</p>) : <p>Здесь появится запрос, когда вы выберете части.</p>}
            </div>
            <div className="meter" aria-label={`Удачных частей: ${goodNow} из 5`}>
              {PROMPT_PARTS.map((_, k) => (
                <span key={k} className={cx("meter-cell", k < goodNow && "is-on")} />
              ))}
            </div>
          </div>
          <Cta>
            <button type="button" className="btn btn-primary" disabled={chosen < 5} onClick={() => dispatch({ type: "t3/checkParts" })}>
              {chosen < 5 ? `Выберите ещё ${5 - chosen}` : "Проверить запрос"}
            </button>
          </Cta>
          {checkedParts &&
            (goodNow === 5 ? (
              <Note tone="ok">
                <b>5 из 5.</b> В хорошем запросе есть роль, конкретная задача, контекст, формат ответа и ограничения.
              </Note>
            ) : (
              <Note tone="info">
                <b>Удачных частей: {goodNow} из 5.</b> Красным отмечены расплывчатые варианты: модель не знает, что вам нужно, и додумывает сама.
              </Note>
            ))}
        </aside>
      </div>

      <header className="sub-head">
        <h3>Какой запрос сработает лучше?</h3>
        <p className="muted">Повышенный уровень. В каждой паре выберите запрос, на который модель ответит полезнее.</p>
      </header>
      <div className="pairs">
        {PAIRS.map((p, i) => (
          <section key={p.a} className="pair" aria-label={`Пара ${i + 1}`}>
            <p className="pair-n">Пара {i + 1}</p>
            <div className="pair-grid" role="radiogroup" aria-label={`Пара ${i + 1}`}>
              {([0, 1] as const).map((j) => {
                const picked = pairs[i] === j;
                const st = checkedPairs && picked ? (j === p.better ? "is-good" : "is-weak") : "";
                return (
                  <button key={j} type="button" role="radio" aria-checked={picked} className={cx("pick", picked && "is-on", st)} onClick={() => dispatch({ type: "t3/pair", index: i, option: j })}>
                    {j === 0 ? p.a : p.b}
                  </button>
                );
              })}
            </div>
            {checkedPairs && <p className="muted pair-why">{p.why}</p>}
          </section>
        ))}
      </div>
      <Cta>
        <button type="button" className="btn btn-primary" disabled={pairsLeft > 0} onClick={() => dispatch({ type: "t3/checkPairs" })}>
          {pairsLeft > 0 ? `Осталось пар: ${pairsLeft}` : "Проверить пары"}
        </button>
      </Cta>
      {checkedPairs && (
        <Note tone={pairsRight === PAIRS.length ? "ok" : "info"}>
          <b>
            Верно {pairsRight} из {PAIRS.length}.
          </b>
        </Note>
      )}
    </>
  );
}
