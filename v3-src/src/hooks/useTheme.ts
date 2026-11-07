import { useEffect, useState } from "react";

export type ThemeChoice = "light" | "dark";
const KEY = "neurolab11-v3-theme";

/** Третья версия по умолчанию тёмная («витрина»), светлую тему можно включить переключателем. */
export function useTheme(): [ThemeChoice, (t: ThemeChoice) => void] {
  const [theme, setTheme] = useState<ThemeChoice>(() => {
    try {
      return localStorage.getItem(KEY) === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#000000" : "#e5e7eb");
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* без сохранения */
    }
  }, [theme]);
  return [theme, setTheme];
}
