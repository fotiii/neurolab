/** Модель одного искусственного нейрона (перцептрона) с пороговой функцией активации. */

export type Bit = 0 | 1;
export type GoalId = "and" | "or" | "xor";

export interface Weights {
  w1: number;
  w2: number;
  b: number;
}

export interface Goal {
  id: GoalId;
  name: string;
  formula: string;
  target: (x1: Bit, x2: Bit) => Bit;
  /** Можно ли решить задачу одним нейроном. */
  separable: boolean;
}

export const GOALS: Record<GoalId, Goal> = {
  and: { id: "and", name: "И", formula: "x₁ И x₂", target: (a, b) => (a && b ? 1 : 0), separable: true },
  or: { id: "or", name: "ИЛИ", formula: "x₁ ИЛИ x₂", target: (a, b) => (a || b ? 1 : 0), separable: true },
  xor: { id: "xor", name: "Исключающее ИЛИ", formula: "x₁ ⊕ x₂", target: (a, b) => (a !== b ? 1 : 0), separable: false },
};

export const INPUTS: ReadonlyArray<readonly [Bit, Bit]> = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
];

export const LIMITS = { w: 2, b: 3, step: 0.5 } as const;

export const ZERO: Weights = { w1: 0, w2: 0, b: 0 };

export function weightedSum(w: Weights, x1: Bit, x2: Bit): number {
  return round(w.w1 * x1 + w.w2 * x2 + w.b);
}

export function fire(w: Weights, x1: Bit, x2: Bit): Bit {
  return weightedSum(w, x1, x2) > 0 ? 1 : 0;
}

export interface TruthRow {
  x1: Bit;
  x2: Bit;
  sum: number;
  need: Bit;
  out: Bit;
  ok: boolean;
}

export function truthTable(w: Weights, goal: GoalId): TruthRow[] {
  return INPUTS.map(([x1, x2]) => {
    const need = GOALS[goal].target(x1, x2);
    const out = fire(w, x1, x2);
    return { x1, x2, sum: weightedSum(w, x1, x2), need, out, ok: need === out };
  });
}

export const hits = (rows: TruthRow[]): number => rows.filter((r) => r.ok).length;

/**
 * Одна эпоха обучения по правилу перцептрона:
 * если нейрон ошибся на примере, каждый вес сдвигается на η · (нужно − получено) · вход.
 */
export function trainEpoch(start: Weights, goal: GoalId, rate = LIMITS.step): { weights: Weights; errors: number } {
  let w = { ...start };
  let errors = 0;
  for (const [x1, x2] of INPUTS) {
    const e = GOALS[goal].target(x1, x2) - fire(w, x1, x2);
    if (e !== 0) {
      errors += 1;
      w = clampWeights({
        w1: w.w1 + rate * e * x1,
        w2: w.w2 + rate * e * x2,
        b: w.b + rate * e,
      });
    }
  }
  return { weights: w, errors };
}

export function trainUntilDone(start: Weights, goal: GoalId, maxEpochs = 20): { weights: Weights; history: number[] } {
  let w = start;
  const history: number[] = [];
  for (let i = 0; i < maxEpochs; i += 1) {
    const r = trainEpoch(w, goal);
    w = r.weights;
    history.push(r.errors);
    if (r.errors === 0) break;
  }
  return { weights: w, history };
}

export function clampWeights(w: Weights): Weights {
  return {
    w1: clamp(round(w.w1), -LIMITS.w, LIMITS.w),
    w2: clamp(round(w.w2), -LIMITS.w, LIMITS.w),
    b: clamp(round(w.b), -LIMITS.b, LIMITS.b),
  };
}

/**
 * Отрезок разделяющей прямой w1·x1 + w2·x2 + b = 0 внутри квадрата [lo, hi]².
 * Возвращает null, если прямой нет (оба веса равны нулю) или она не пересекает квадрат.
 */
export function boundary(w: Weights, lo = -0.5, hi = 1.5): [number, number, number, number] | null {
  const { w1, w2, b } = w;
  if (w1 === 0 && w2 === 0) return null;
  const pts: Array<[number, number]> = [];
  const push = (x: number, y: number) => {
    if (x >= lo - 1e-9 && x <= hi + 1e-9 && y >= lo - 1e-9 && y <= hi + 1e-9) pts.push([x, y]);
  };
  if (w2 !== 0) {
    push(lo, -(w1 * lo + b) / w2);
    push(hi, -(w1 * hi + b) / w2);
  }
  if (w1 !== 0) {
    push(-(w2 * lo + b) / w1, lo);
    push(-(w2 * hi + b) / w1, hi);
  }
  const uniq = pts.filter((p, i) => pts.findIndex((q) => Math.abs(q[0] - p[0]) < 1e-6 && Math.abs(q[1] - p[1]) < 1e-6) === i);
  if (uniq.length < 2) return null;
  return [uniq[0][0], uniq[0][1], uniq[1][0], uniq[1][1]];
}

/**
 * Многоугольник области квадрата [lo, hi]², где нейрон выдаёт 1 (w1·x1 + w2·x2 + b > 0).
 * Отсечение квадрата полуплоскостью (алгоритм Сазерленда — Ходжмана для одной границы).
 */
export function firingRegion(w: Weights, lo = -0.5, hi = 1.5): Array<[number, number]> {
  const square: Array<[number, number]> = [
    [lo, lo],
    [hi, lo],
    [hi, hi],
    [lo, hi],
  ];
  const f = (p: [number, number]) => w.w1 * p[0] + w.w2 * p[1] + w.b;
  const out: Array<[number, number]> = [];
  for (let i = 0; i < square.length; i += 1) {
    const cur = square[i];
    const prev = square[(i + square.length - 1) % square.length];
    const fc = f(cur);
    const fp = f(prev);
    if (fc > 0) {
      if (fp <= 0 && fc !== fp) out.push(lerp(prev, cur, fp / (fp - fc)));
      out.push(cur);
    } else if (fp > 0 && fc !== fp) {
      out.push(lerp(prev, cur, fp / (fp - fc)));
    }
  }
  return out;
}

function lerp(a: [number, number], b: [number, number], t: number): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export function round(v: number): number {
  return Math.round(v * 100) / 100;
}

/** Число в русской записи: запятая вместо точки и настоящий знак минуса. */
export function ru(v: number): string {
  return String(round(v)).replace(".", ",").replace("-", "−");
}
