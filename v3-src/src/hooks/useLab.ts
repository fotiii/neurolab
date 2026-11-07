import { useEffect, useMemo, useReducer } from "react";
import { CASES, PAIRS, PROMPT_PARTS, QUIZ, SENTENCES, XOR_OPTIONS } from "../data/content";
import { clampWeights, GoalId, hits, truthTable, Weights, ZERO } from "../lib/perceptron";
import type { Bit } from "../lib/perceptron";

const STORAGE_KEY = "neurolab11-v3";

export interface LabState {
  version: 2;
  name: string;
  mood: number | null;
  t1: { picks: Array<boolean | null>; checked: boolean };
  t2: {
    weights: Weights;
    goal: GoalId;
    x: [Bit, Bit];
    solved: { and: boolean; or: boolean };
    xorPick: number | null;
  };
  t3: { parts: Array<number | null>; pairs: Array<0 | 1 | null>; checkedParts: boolean; checkedPairs: boolean };
  t4: { marked: boolean[]; checked: boolean };
  t5: { picks: Array<number | null>; checked: boolean };
}

export type Action =
  | { type: "name"; value: string }
  | { type: "mood"; value: number }
  | { type: "t1/pick"; index: number; value: boolean }
  | { type: "t1/check" }
  | { type: "t2/weights"; value: Partial<Weights> }
  | { type: "t2/goal"; value: GoalId }
  | { type: "t2/toggle"; input: 0 | 1 }
  | { type: "t2/xor"; index: number }
  | { type: "t3/part"; index: number; option: number }
  | { type: "t3/pair"; index: number; option: 0 | 1 }
  | { type: "t3/checkParts" }
  | { type: "t3/checkPairs" }
  | { type: "t4/toggle"; index: number }
  | { type: "t4/check" }
  | { type: "t5/pick"; index: number; option: number }
  | { type: "t5/check" }
  | { type: "reset" };

export function initialState(): LabState {
  return {
    version: 2,
    name: "",
    mood: null,
    t1: { picks: CASES.map(() => null), checked: false },
    t2: { weights: { ...ZERO }, goal: "and", x: [0, 0], solved: { and: false, or: false }, xorPick: null },
    t3: { parts: PROMPT_PARTS.map(() => null), pairs: PAIRS.map(() => null), checkedParts: false, checkedPairs: false },
    t4: { marked: SENTENCES.map(() => false), checked: false },
    t5: { picks: QUIZ.map(() => null), checked: false },
  };
}

function markSolved(t2: LabState["t2"]): LabState["t2"] {
  if (t2.goal === "xor") return t2;
  const allRight = hits(truthTable(t2.weights, t2.goal)) === 4;
  if (!allRight || t2.solved[t2.goal]) return t2;
  return { ...t2, solved: { ...t2.solved, [t2.goal]: true } };
}

export function reducer(s: LabState, a: Action): LabState {
  switch (a.type) {
    case "name":
      return { ...s, name: a.value };
    case "mood":
      return { ...s, mood: a.value };
    case "t1/pick": {
      const picks = s.t1.picks.slice();
      picks[a.index] = a.value;
      return { ...s, t1: { picks, checked: false } };
    }
    case "t1/check":
      return { ...s, t1: { ...s.t1, checked: true } };
    case "t2/weights":
      return { ...s, t2: markSolved({ ...s.t2, weights: clampWeights({ ...s.t2.weights, ...a.value }) }) };
    case "t2/goal":
      return { ...s, t2: markSolved({ ...s.t2, goal: a.value }) };
    case "t2/toggle": {
      const x: [Bit, Bit] = [...s.t2.x];
      x[a.input] = x[a.input] ? 0 : 1;
      return { ...s, t2: { ...s.t2, x } };
    }
    case "t2/xor":
      return { ...s, t2: { ...s.t2, xorPick: a.index } };
    case "t3/part": {
      const parts = s.t3.parts.slice();
      parts[a.index] = a.option;
      return { ...s, t3: { ...s.t3, parts, checkedParts: false } };
    }
    case "t3/pair": {
      const pairs = s.t3.pairs.slice();
      pairs[a.index] = a.option;
      return { ...s, t3: { ...s.t3, pairs, checkedPairs: false } };
    }
    case "t3/checkParts":
      return { ...s, t3: { ...s.t3, checkedParts: true } };
    case "t3/checkPairs":
      return { ...s, t3: { ...s.t3, checkedPairs: true } };
    case "t4/toggle": {
      const marked = s.t4.marked.slice();
      marked[a.index] = !marked[a.index];
      return { ...s, t4: { marked, checked: false } };
    }
    case "t4/check":
      return { ...s, t4: { ...s.t4, checked: true } };
    case "t5/pick": {
      const picks = s.t5.picks.slice();
      picks[a.index] = a.option;
      return { ...s, t5: { picks, checked: false } };
    }
    case "t5/check":
      return { ...s, t5: { ...s.t5, checked: true } };
    case "reset":
      return initialState();
    default:
      return s;
  }
}

/** Баллы считаются из текущих ответов: после изменения ответа задание нужно проверить снова. */
export function scoresOf(s: LabState): number[] {
  const t1 = s.t1.checked ? s.t1.picks.filter((p, i) => p === CASES[i].isAI).length : 0;
  const t2 = (s.t2.solved.and ? 2 : 0) + (s.t2.solved.or ? 2 : 0) + (s.t2.xorPick !== null && XOR_OPTIONS[s.t2.xorPick].right ? 1 : 0);
  const parts = s.t3.checkedParts ? s.t3.parts.filter((p, i) => p !== null && PROMPT_PARTS[i].options[p].good).length : 0;
  const pairs = s.t3.checkedPairs ? s.t3.pairs.filter((p, i) => p === PAIRS[i].better).length : 0;
  let t4 = 0;
  if (s.t4.checked) {
    const caught = s.t4.marked.filter((m, i) => m && !SENTENCES[i].true).length;
    const falseAlarms = s.t4.marked.filter((m, i) => m && SENTENCES[i].true).length;
    t4 = Math.max(0, caught - falseAlarms);
  }
  const t5 = s.t5.checked ? s.t5.picks.filter((p, i) => p === QUIZ[i].answer).length : 0;
  return [t1, t2, parts + pairs, t4, t5];
}

function load(): LabState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw) as Partial<LabState>;
    if (parsed.version !== 2) return initialState();
    return { ...initialState(), ...parsed } as LabState;
  } catch {
    return initialState();
  }
}

export function useLab() {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* хранилище недоступно: работаем без сохранения */
    }
  }, [state]);
  const scores = useMemo(() => scoresOf(state), [state]);
  return { state, dispatch, scores };
}
