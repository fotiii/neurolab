import { useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { BrandMark, TaskNav, ThemeSwitch, TotalBadge } from "./components/Chrome";
import { FactCheck } from "./components/FactCheck";
import { Hero } from "./components/Hero";
import { NeuronLab } from "./components/NeuronLab";
import { PromptBuilder } from "./components/PromptBuilder";
import { Summary } from "./components/Summary";
import { TaskHeader } from "./components/TaskHeader";
import { cx } from "./components/ui";
import { WhereAI } from "./components/WhereAI";
import { TASKS, TaskId } from "./data/content";
import { prefersReducedMotion, useArrowKeys, useScrolledPast, withTransition } from "./hooks/motion";
import { useHashRoute } from "./hooks/useHashRoute";
import { useLab } from "./hooks/useLab";
import { useTheme } from "./hooks/useTheme";

const LAST = (TASKS.length - 1) as TaskId;

export function App() {
  const { state, dispatch, scores } = useLab();
  const [current, go] = useHashRoute();
  const [theme, setTheme] = useTheme();
  const heroRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const past = useScrolledPast(heroRef);
  const total = scores.reduce((a, b) => a + b, 0);
  const task = TASKS[current];

  useEffect(() => {
    document.title = `${task.tab} · Нейролаб 11`;
  }, [task]);

  // Куда ученик переходит прямо сейчас. Нужен, чтобы быстрые нажатия стрелок
  // не терялись, пока идёт анимация смены задания.
  const target = useRef<TaskId>(current);
  useEffect(() => {
    target.current = current;
  }, [current]);

  const scrollToTask = () => {
    const el = mainRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 76;
    window.scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  const goTo = (id: TaskId) => {
    if (id !== target.current) {
      target.current = id;
      withTransition(() => flushSync(() => go(id)));
    }
    scrollToTask();
  };

  useArrowKeys(
    () => target.current > 0 && goTo((target.current - 1) as TaskId),
    () => target.current < LAST && goTo((target.current + 1) as TaskId),
  );

  const prev = current > 0 ? TASKS[current - 1] : null;
  const next = current < LAST ? TASKS[current + 1] : null;

  return (
    <div className="page">
      <a className="skip" href={`#h-${task.slug}`}>
        К заданию
      </a>
      <header className={cx("topbar", past && "is-solid")}>
        <div className="topbar-in">
          <a
            className="brand"
            href="#"
            aria-label="Нейролаб, в начало страницы"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
            }}
          >
            <BrandMark />
          </a>
          <TaskNav current={current} scores={scores} onGo={goTo} />
          <div className="topbar-tools">
            <TotalBadge total={total} />
            <ThemeSwitch value={theme} onChange={setTheme} />
          </div>
        </div>
      </header>

      <div ref={heroRef}>
        <Hero current={current} scores={scores} name={state.name} onName={(v) => dispatch({ type: "name", value: v })} onGo={goTo} onStart={scrollToTask} />
      </div>

      <main ref={mainRef} className="task" aria-labelledby={`h-${task.slug}`}>
        <TaskHeader id={current} score={scores[current]} />
        {current === 0 && <WhereAI state={state} dispatch={dispatch} score={scores[0]} />}
        {current === 1 && <NeuronLab state={state} dispatch={dispatch} />}
        {current === 2 && <PromptBuilder state={state} dispatch={dispatch} />}
        {current === 3 && <FactCheck state={state} dispatch={dispatch} />}
        {current === 4 && <Summary state={state} dispatch={dispatch} scores={scores} />}

        <nav className="pager" aria-label="Соседние задания">
          {prev ? (
            <a
              className="pager-link"
              href={`#${prev.slug}`}
              onClick={(e) => {
                e.preventDefault();
                goTo(prev.id);
              }}
            >
              <span className="pager-dir">Назад</span>
              <span className="pager-name">{prev.tab}</span>
            </a>
          ) : (
            <span />
          )}
          {next && (
            <a
              className="pager-link is-next"
              href={`#${next.slug}`}
              onClick={(e) => {
                e.preventDefault();
                goTo(next.id);
              }}
            >
              <span className="pager-dir">Дальше</span>
              <span className="pager-name">{next.tab}</span>
            </a>
          )}
        </nav>
        <p className="keys-hint">Задания можно листать клавишами ← и →</p>
      </main>

      <footer className="foot">
        <p>Цифровой дидактический материал к уроку «Средства искусственного интеллекта», информатика, 11 класс, базовый уровень, ФГОС СОО.</p>
        <p>
          Версия 3 на React и TypeScript. <a href="../">Первая версия</a> · <a href="../v2/">Вторая версия</a>
        </p>
      </footer>
    </div>
  );
}
