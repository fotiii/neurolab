import { useState } from "react";
import type { Dispatch } from "react";
import { XOR_OPTIONS } from "../data/content";
import type { Action, LabState } from "../hooks/useLab";
import {
  boundary,
  firingRegion,
  GOALS,
  GoalId,
  hits,
  INPUTS,
  LIMITS,
  ru,
  trainEpoch,
  trainUntilDone,
  truthTable,
  weightedSum,
  ZERO,
} from "../lib/perceptron";
import type { Bit, Weights } from "../lib/perceptron";
import { ChoiceList, Note, Segmented, Verdict, cx } from "./ui";

interface Props {
  state: LabState;
  dispatch: Dispatch<Action>;
}

export function NeuronLab({ state, dispatch }: Props) {
  const { weights: w, goal, x, solved, xorPick } = state.t2;
  const rows = truthTable(w, goal);
  const matched = hits(rows);
  const sum = weightedSum(w, x[0], x[1]);
  const firing = sum > 0;
  const [log, setLog] = useState<number[]>([]);

  const setW = (patch: Partial<Weights>) => dispatch({ type: "t2/weights", value: patch });

  const step = () => {
    const r = trainEpoch(w, goal);
    setW(r.weights);
    setLog((l) => [...l, r.errors].slice(-12));
  };
  const train = () => {
    const r = trainUntilDone(w, goal);
    setW(r.weights);
    setLog(r.history);
  };
  const resetW = () => {
    setW({ ...ZERO });
    setLog([]);
  };

  const done = goal !== "xor" && matched === 4;
  const lastErrors = log.length ? log[log.length - 1] : null;

  return (
    <>
      <Segmented<GoalId>
        label="Логическая операция"
        value={goal}
        onChange={(v) => {
          dispatch({ type: "t2/goal", value: v });
          setLog([]);
        }}
        options={(["and", "or", "xor"] as const).map((g) => ({
          value: g,
          label: (
            <>
              {GOALS[g].name}
              {g !== "xor" && solved[g] && <span className="seg-done" aria-label="решено" />}
            </>
          ),
        }))}
      />

      <div className="lab">
        <section className="sheet lab-diagram" aria-label="Схема нейрона">
          <NeuronDiagram w={w} x={x} sum={sum} firing={firing} onToggle={(i) => dispatch({ type: "t2/toggle", input: i })} />
          <p className="formula">
            y = 1, если w₁·x₁ + w₂·x₂ + b &gt; 0 · <span className={cx("hl", firing && "hl-on")}>сейчас сумма {ru(sum)}, нейрон {firing ? "срабатывает" : "молчит"}</span>
          </p>
          <div className="sliders">
            <Slider id="w1" label="w₁" value={w.w1} min={-LIMITS.w} max={LIMITS.w} onChange={(v) => setW({ w1: v })} />
            <Slider id="w2" label="w₂" value={w.w2} min={-LIMITS.w} max={LIMITS.w} onChange={(v) => setW({ w2: v })} />
            <Slider id="b" label="b" value={w.b} min={-LIMITS.b} max={LIMITS.b} onChange={(v) => setW({ b: v })} />
          </div>
        </section>

        <section className="lab-side">
          <div className="sheet">
            <div className="sheet-head">
              <span>Таблица истинности: {GOALS[goal].formula}</span>
              <span className="muted">{matched} из 4</span>
            </div>
            <table className="truth">
              <thead>
                <tr>
                  <th scope="col">x₁</th>
                  <th scope="col">x₂</th>
                  <th scope="col">сумма</th>
                  <th scope="col">нужно</th>
                  <th scope="col">y</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.x1}${r.x2}`} className={cx(r.x1 === x[0] && r.x2 === x[1] && "is-current")}>
                    <td>{r.x1}</td>
                    <td>{r.x2}</td>
                    <td>{ru(r.sum)}</td>
                    <td>{r.need}</td>
                    <td>
                      <span className="y-cell">
                        {r.out} <Verdict ok={r.ok} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sheet">
            <div className="sheet-head">
              <span>Как нейрон делит плоскость</span>
            </div>
            <DecisionPlane w={w} goal={goal} />
            <p className="caption">Закрашена область, где нейрон выдаёт 1. Закрашенные точки должны попасть в неё, пустые — остаться снаружи.</p>
          </div>
        </section>
      </div>

      {done ? (
        <Note tone="ok">
          <b>Нейрон вычисляет «{GOALS[goal].name}».</b> Запишите веса в тетрадь: w₁ = {ru(w.w1)}, w₂ = {ru(w.w2)}, b = {ru(w.b)}.
        </Note>
      ) : (
        <Note tone="info">
          {goal === "xor"
            ? `Совпало строк: ${matched} из 4. Попробуйте разные веса и посмотрите на плоскость, затем ответьте на вопрос ниже.`
            : `Совпало строк: ${matched} из 4. Двигайте ползунки или включите обучение.`}
        </Note>
      )}

      {goal === "xor" && (
        <section className="block">
          <h3 className="block-title">Почему для исключающего ИЛИ веса не находятся?</h3>
          <ChoiceList
            label="Причина"
            options={XOR_OPTIONS.map((o) => o.text)}
            value={xorPick}
            onChange={(i) => dispatch({ type: "t2/xor", index: i })}
            states={XOR_OPTIONS.map((o, i) => (xorPick === i ? (o.right ? "good" : "weak") : "idle"))}
          />
          {xorPick !== null &&
            (XOR_OPTIONS[xorPick].right ? (
              <Note tone="ok">
                <b>Верно.</b> Это показали Марвин Минский и Сеймур Пейперт в 1969 году. Решение нашли позже: многослойные сети, у которых несколько нейронов проводят несколько прямых.
              </Note>
            ) : (
              <Note tone="bad">Нет. Посмотрите на плоскость: сколько прямых может провести один нейрон?</Note>
            ))}
        </section>
      )}

      <section className="block">
        <h3 className="block-title">Пусть нейрон учится сам</h3>
        <p className="muted">Если нейрон ошибся на примере, каждый вес сдвигается на 0,5 · (нужно − получено) · вход. Одна эпоха — проход по всем четырём строкам.</p>
        <div className="btn-row">
          <button type="button" className="btn btn-ghost" onClick={step}>
            Шаг обучения
          </button>
          <button type="button" className="btn btn-ghost" onClick={train}>
            Учить до результата
          </button>
          <button type="button" className="btn btn-ghost" onClick={resetW}>
            Сбросить веса
          </button>
        </div>
        {log.length > 0 && (
          <div className="sheet epochs" aria-live="polite">
            <div className="epoch-bars" aria-hidden="true">
              {log.map((e, i) => (
                <span key={i} className="epoch-bar" style={{ height: `${(e / 4) * 100}%` }} title={`Эпоха ${i + 1}: ошибок ${e}`} />
              ))}
            </div>
            <p>
              Эпох: {log.length}. Ошибок в последней: {lastErrors}.{" "}
              {lastErrors === 0 ? "Обучение завершено." : goal === "xor" && log.length >= 20 ? "Ошибки не исчезают: одного нейрона мало." : ""}
            </p>
          </div>
        )}
      </section>
    </>
  );
}

function Slider({ id, label, value, min, max, onChange }: { id: string; label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="slider">
      <label htmlFor={`sl-${id}`}>{label}</label>
      <input
        id={`sl-${id}`}
        type="range"
        min={min}
        max={max}
        step={LIMITS.step}
        value={value}
        style={{ ["--p" as string]: `${pct}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <output htmlFor={`sl-${id}`}>{ru(value)}</output>
    </div>
  );
}

function NeuronDiagram({ w, x, sum, firing, onToggle }: { w: Weights; x: [Bit, Bit]; sum: number; firing: boolean; onToggle: (i: 0 | 1) => void }) {
  const edge = (v: number) => ({
    stroke: v > 0 ? "var(--ink)" : v < 0 ? "var(--bad)" : "var(--line-2)",
    strokeWidth: 1.5 + Math.abs(v) * 2,
    strokeDasharray: v < 0 ? "6 6" : undefined,
  });
  const input = (i: 0 | 1, cy: number) => (
    <g
      key={i}
      className="nd-in"
      role="button"
      tabIndex={0}
      aria-label={`Вход x${i + 1} = ${x[i]}. Нажмите, чтобы переключить`}
      onClick={() => onToggle(i)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle(i);
        }
      }}
    >
      <rect x={40} y={cy - 26} width={52} height={52} rx={10} className={cx("nd-box", x[i] === 1 && "is-on")} />
      <text x={66} y={cy + 6} textAnchor="middle" className="nd-val">
        {x[i]}
      </text>
      <text x={66} y={cy - 36} textAnchor="middle" className="nd-lbl">
        x{i === 0 ? "₁" : "₂"}
      </text>
    </g>
  );
  return (
    <svg className="nd" viewBox="0 0 600 250" role="img" aria-label="Схема нейрона: два входа, веса, сумматор и выход">
      <path d="M92 70 C 210 70, 250 125, 330 125" fill="none" {...edge(w.w1)} />
      <path d="M92 180 C 210 180, 250 125, 330 125" fill="none" {...edge(w.w2)} />
      <path d="M375 205 L 375 162" fill="none" stroke="var(--line-2)" strokeWidth={1.5} strokeDasharray="3 5" />
      <path d="M418 125 L 506 125" fill="none" stroke={firing ? "var(--aqua)" : "var(--line-2)"} strokeWidth={firing ? 4 : 2} />
      {input(0, 70)}
      {input(1, 180)}
      <text x={205} y={62} textAnchor="middle" className="nd-lbl">
        w₁ = {ru(w.w1)}
      </text>
      <text x={205} y={205} textAnchor="middle" className="nd-lbl">
        w₂ = {ru(w.w2)}
      </text>
      <text x={375} y={230} textAnchor="middle" className="nd-lbl">
        b = {ru(w.b)}
      </text>
      <circle cx={375} cy={125} r={firing ? 58 : 40} className="nd-glow" style={{ opacity: firing ? 1 : 0 }} />
      <circle cx={375} cy={125} r={40} className={cx("nd-soma", firing && "is-on")} />
      <text x={375} y={121} textAnchor="middle" className="nd-val nd-sigma">
        Σ
      </text>
      <text x={375} y={142} textAnchor="middle" className="nd-lbl nd-sum">
        {ru(sum)}
      </text>
      <rect x={506} y={99} width={52} height={52} rx={10} className={cx("nd-box", firing && "is-out")} />
      <text x={532} y={131} textAnchor="middle" className="nd-val">
        {firing ? 1 : 0}
      </text>
      <text x={532} y={89} textAnchor="middle" className="nd-lbl">
        y
      </text>
    </svg>
  );
}

function DecisionPlane({ w, goal }: { w: Weights; goal: GoalId }) {
  const lo = -0.5;
  const hi = 1.5;
  const size = 220;
  const pad = 28;
  const sx = (v: number) => pad + ((v - lo) / (hi - lo)) * size;
  const sy = (v: number) => pad + size - ((v - lo) / (hi - lo)) * size;
  const region = firingRegion(w, lo, hi);
  const line = boundary(w, lo, hi);
  return (
    <svg className="plane" viewBox={`0 0 ${size + pad * 2} ${size + pad * 2}`} role="img" aria-label="Плоскость входов x1 и x2 с разделяющей прямой нейрона">
      <rect x={pad} y={pad} width={size} height={size} className="plane-bg" />
      {[0, 1].map((v) => (
        <g key={v}>
          <line x1={sx(v)} y1={pad} x2={sx(v)} y2={pad + size} className="plane-grid" />
          <line x1={pad} y1={sy(v)} x2={pad + size} y2={sy(v)} className="plane-grid" />
          <text x={sx(v)} y={pad + size + 18} textAnchor="middle" className="plane-tick">
            {v}
          </text>
          <text x={pad - 10} y={sy(v) + 4} textAnchor="end" className="plane-tick">
            {v}
          </text>
        </g>
      ))}
      <text x={pad + size} y={pad + size + 18} textAnchor="end" className="plane-axis">
        x₁
      </text>
      <text x={pad - 10} y={pad + 4} textAnchor="end" className="plane-axis">
        x₂
      </text>
      {region.length > 2 && <polygon points={region.map(([a, b]) => `${sx(a)},${sy(b)}`).join(" ")} className="plane-region" />}
      {line && <line x1={sx(line[0])} y1={sy(line[1])} x2={sx(line[2])} y2={sy(line[3])} className="plane-line" />}
      {INPUTS.map(([a, b]) => {
        const need = GOALS[goal].target(a, b);
        return <circle key={`${a}${b}`} cx={sx(a)} cy={sy(b)} r={9} className={cx("plane-pt", need === 1 && "is-one")} />;
      })}
    </svg>
  );
}
