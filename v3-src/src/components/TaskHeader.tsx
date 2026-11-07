import { TASKS, TaskId } from "../data/content";
import { Chip } from "./ui";

/** Заголовок задания по центру в две строки: тихая подпись сверху, крупное название снизу. */
export function TaskHeader({ id, score }: { id: TaskId; score: number }) {
  const t = TASKS[id];
  return (
    <header className="task-head">
      <p className="tb-label">
        Задание {id + 1} из {TASKS.length}
      </p>
      <h2 id={`h-${t.slug}`} className="tb-title tb-title-sm">
        {t.title}
      </h2>
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
