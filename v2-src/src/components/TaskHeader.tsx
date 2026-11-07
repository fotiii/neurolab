import { TASKS, TaskId } from "../data/content";
import { Chip } from "./ui";

export function TaskHeader({ id, score }: { id: TaskId; score: number }) {
  const t = TASKS[id];
  return (
    <header className="task-head">
      <p className="task-count">
        Задание {id + 1} из {TASKS.length}
      </p>
      <h2 id={`h-${t.slug}`}>{t.title}</h2>
      <p className="task-lead">{t.lead}</p>
      <div className="chips">
        <Chip>{t.level}</Chip>
        {t.extra && <Chip tone="marker">{t.extra}</Chip>}
        <Chip tone="score">
          {score} из {t.max}
        </Chip>
      </div>
    </header>
  );
}
