import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

/** Пользователь попросил систему уменьшить движение — тогда анимации не запускаем. */
export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/**
 * Параллакс «витрины»: положение указателя над сценой плавно переводится в CSS-переменные
 * --mx и --my (от −1 до 1). Каждый картридж сдвигается на свою глубину --d, поэтому
 * предметы как будто висят на разном расстоянии. На сенсорных экранах выключено.
 */
export function useParallax(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let raf = 0;

    const tick = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      el.style.setProperty("--mx", cx.toFixed(3));
      el.style.setProperty("--my", cy.toFixed(3));
      raf = Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001 ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
      kick();
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      kick();
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [ref]);
}

/** Число плавно «докручивается» до нового значения — так ученик замечает, что баллы изменились. */
export function useCountUp(target: number, ms = 600): number {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = from.current;
    if (start === target || prefersReducedMotion()) {
      from.current = target;
      setShown(target);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / ms);
      const eased = 1 - Math.pow(1 - k, 3);
      const v = Math.round(start + (target - start) * eased);
      setShown(v);
      from.current = v;
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return shown;
}

/** Переход между заданиями с плавной сменой экрана, если браузер это умеет. */
export function withTransition(update: () => void): void {
  type Transition = { ready: Promise<void>; finished: Promise<void> };
  const doc = document as Document & { startViewTransition?: (cb: () => void) => Transition };
  if (doc.startViewTransition && !prefersReducedMotion()) {
    const t = doc.startViewTransition(update);
    // Если ученик быстро листает, браузер пропускает предыдущую анимацию — это не ошибка.
    t.ready.catch(() => undefined);
    t.finished.catch(() => undefined);
  } else update();
}

/**
 * Стрелки ← и → листают задания. Не мешаем, когда ученик печатает
 * или двигает ползунок: там стрелки нужны самому элементу.
 */
export function useArrowKeys(onPrev: () => void, onNext: () => void): void {
  const handlers = useRef({ onPrev, onNext });
  handlers.current = { onPrev, onNext };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.closest("input, textarea, select, [contenteditable='true']") || t.getAttribute("role") === "radio")) return;
      if (e.key === "ArrowLeft") handlers.current.onPrev();
      else if (e.key === "ArrowRight") handlers.current.onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

/** Отмечает, что первый экран прокручен: шапка становится плотнее и получает тонкую линию снизу. */
export function useScrolledPast(ref: RefObject<HTMLElement | null>): boolean {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([entry]) => setPast(!entry.isIntersecting), { rootMargin: "-64px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return past;
}
