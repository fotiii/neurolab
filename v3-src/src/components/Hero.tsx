import { useRef } from "react";
import type { CSSProperties } from "react";
import { TASKS, TaskId, TOTAL_MAX } from "../data/content";
import { useParallax } from "../hooks/motion";
import { cx } from "./ui";

/** Положение «картриджей» заданий вокруг нейрона: x, y в процентах сцены, поворот, глубина параллакса. */
const ORBIT: ReadonlyArray<{ x: number; y: number; r: number; d: number }> = [
  { x: 16, y: 22, r: -11, d: 1.1 },
  { x: 82, y: 16, r: 8, d: 0.7 },
  { x: 10, y: 68, r: 7, d: 0.8 },
  { x: 89, y: 60, r: -9, d: 1.2 },
  { x: 67, y: 84, r: 5, d: 0.5 },
];

interface Props {
  current: TaskId;
  scores: number[];
  name: string;
  onName: (v: string) => void;
  onGo: (id: TaskId) => void;
  onStart: () => void;
}

export function Hero({ current, scores, name, onName, onGo, onStart }: Props) {
  const stage = useRef<HTMLDivElement>(null);
  useParallax(stage);
  const started = scores.some((s) => s > 0);

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div ref={stage} className="stage">
        <div className="core" aria-hidden="true">
          <CoreNeuron />
        </div>
        <ol className="carts" aria-label="Задания урока">
          {TASKS.map((t, i) => {
            const o = ORBIT[i];
            const s = scores[t.id];
            const style = { "--x": `${o.x}%`, "--y": `${o.y}%`, "--r": `${o.r}deg`, "--d": o.d, "--i": i } as CSSProperties;
            return (
              <li key={t.slug} className="cart-slot" style={style}>
                <a
                  href={`#${t.slug}`}
                  className={cx("cart", current === t.id && "is-current", s === t.max && "is-done")}
                  onClick={(e) => {
                    e.preventDefault();
                    onGo(t.id);
                  }}
                >
                  <span className="cart-label">
                    <span className="cart-n">{String(t.id + 1).padStart(2, "0")}</span>
                    <span className="cart-name">{t.tab}</span>
                  </span>
                  <span className="cart-meta">
                    <span>
                      {s} из {t.max}
                    </span>
                    <span className="cart-bar" aria-hidden="true">
                      <i style={{ width: `${(s / t.max) * 100}%` }} />
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="title-block">
        <p className="tb-label">Информатика, 11 класс · Средства искусственного интеллекта</p>
        <h1 id="hero-title" className="tb-title">
          Нейролаб
        </h1>
      </div>

      <form
        className="hero-actions"
        onSubmit={(e) => {
          e.preventDefault();
          onStart();
        }}
      >
        <label className="name-pill">
          <span className="sr-only">Фамилия и имя ученика</span>
          <input type="text" placeholder="Фамилия и имя" autoComplete="off" value={name} onChange={(e) => onName(e.target.value)} />
        </label>
        <button type="submit" className="btn btn-primary">
          {started ? "Продолжить" : "Начать урок"}
        </button>
      </form>
      <p className="hero-note">Пять заданий · {TOTAL_MAX} баллов · ответы сохраняются только в этом браузере</p>
    </section>
  );
}

/** Нейрон в центре витрины: два входа, сумматор и выход, тонкие белые линии. */
function CoreNeuron() {
  return (
    <svg viewBox="0 0 320 200" className="core-svg">
      <path className="core-wire" d="M58 58 C 128 58, 150 100, 196 100" />
      <path className="core-wire" d="M58 142 C 128 142, 150 100, 196 100" />
      <path className="core-wire" d="M244 100 H 292" />
      <path className="core-pulse" d="M58 58 C 128 58, 150 100, 196 100" />
      <path className="core-pulse core-pulse-2" d="M58 142 C 128 142, 150 100, 196 100" />
      <path className="core-pulse core-pulse-3" d="M244 100 H 292" />
      <rect x="22" y="38" width="40" height="40" rx="12" className="core-node" />
      <rect x="22" y="122" width="40" height="40" rx="12" className="core-node" />
      <circle cx="220" cy="100" r="30" className="core-soma" />
      <text x="220" y="109" textAnchor="middle" className="core-sigma">
        Σ
      </text>
      <circle cx="298" cy="100" r="8" className="core-out" />
    </svg>
  );
}
