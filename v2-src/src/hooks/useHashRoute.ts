import { useCallback, useEffect, useState } from "react";
import { TASKS, TaskId } from "../data/content";

function fromHash(): TaskId {
  const slug = window.location.hash.replace(/^#/, "");
  const found = TASKS.find((t) => t.slug === slug);
  return found ? found.id : 0;
}

/** Текущее задание хранится в адресе (#neiron), поэтому на задание можно дать прямую ссылку. */
export function useHashRoute(): [TaskId, (id: TaskId) => void] {
  const [current, setCurrent] = useState<TaskId>(fromHash);
  useEffect(() => {
    const onHash = () => setCurrent(fromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const go = useCallback((id: TaskId) => {
    const slug = TASKS[id].slug;
    if (window.location.hash !== `#${slug}`) window.location.hash = slug;
    setCurrent(id);
  }, []);
  return [current, go];
}
