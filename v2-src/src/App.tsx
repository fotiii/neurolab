import { useEffect, useRef } from "react";
import { FactCheck } from "./components/FactCheck";
import { NeuronLab } from "./components/NeuronLab";
import { PromptBuilder } from "./components/PromptBuilder";
import { Summary } from "./components/Summary";
import { TaskHeader } from "./components/TaskHeader";
import { TaskTabs, ThemeSwitch, TotalBadge } from "./components/Chrome";
import { WhereAI } from "./components/WhereAI";
import { TASKS, TaskId } from "./data/content";
import { useHashRoute } from "./hooks/useHashRoute";
import { useLab } from "./hooks/useLab";
import { useTheme } from "./hooks/useTheme";

export function App() {
  const { state, dispatch, scores } = useLab();
  const [current, go] = useHashRoute();
  const [theme, setTheme] = useTheme();
  const mainRef = useRef<HTMLElement>(null);
  const total = scores.reduce((a, b) => a + b, 0);
  const task = TASKS[current];

  useEffect(() => {
    document.title = `${task.tab} · Нейролаб 11`;
  }, [task]);

  const goTo = (id: TaskId) => {
    go(id);
    const top = (mainRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY - 72;
    if (window.scrollY > top) window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  };

  const next = current < 4 ? TASKS[(current + 1) as TaskId] : null;

  return (
    <div className="page">
      <header className="top">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="5" cy="7" r="2" />
              <circle cx="5" cy="17" r="2" />
              <circle cx="13" cy="12" r="3.2" fill="currentColor" stroke="none" />
              <path d="M7 7.6l3.4 2.6M7 16.4l3.4-2.6M16.2 12H21" />
            </svg>
          </span>
          <div className="brand-text">
            <h1>Нейролаб</h1>
            <p>Информатика, 11 класс · Средства искусственного интеллекта</p>
          </div>
        </div>
        <div className="top-tools">
          <TotalBadge total={total} />
          <ThemeSwitch value={theme} onChange={setTheme} />
        </div>
      </header>

      <div className="student">
        <label htmlFor="student">Ученик</label>
        <input id="student" type="text" placeholder="Фамилия и имя" autoComplete="off" value={state.name} onChange={(e) => dispatch({ type: "name", value: e.target.value })} />
      </div>

      <TaskTabs current={current} scores={scores} onGo={goTo} />

      <main ref={mainRef} className="task" aria-labelledby={`h-${task.slug}`}>
        <TaskHeader id={current} score={scores[current]} />
        {current === 0 && <WhereAI state={state} dispatch={dispatch} score={scores[0]} />}
        {current === 1 && <NeuronLab state={state} dispatch={dispatch} />}
        {current === 2 && <PromptBuilder state={state} dispatch={dispatch} />}
        {current === 3 && <FactCheck state={state} dispatch={dispatch} />}
        {current === 4 && <Summary state={state} dispatch={dispatch} scores={scores} />}
        {next && (
          <a
            className="next"
            href={`#${next.slug}`}
            onClick={(e) => {
              e.preventDefault();
              goTo(next.id);
            }}
          >
            Следующее задание: {next.tab.toLowerCase()}
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7.5 4.5L13 10l-5.5 5.5" />
            </svg>
          </a>
        )}
      </main>

      <footer className="foot">
        <p>Цифровой дидактический материал к уроку «Средства искусственного интеллекта», информатика, 11 класс, базовый уровень, ФГОС СОО. Ответы сохраняются только в этом браузере.</p>
        <p>
          Версия 2 на React и TypeScript. <a href="../">Открыть первую версию</a>
        </p>
      </footer>
    </div>
  );
}
