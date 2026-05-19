"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("banki-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = savedTheme ? savedTheme === "dark" : prefersDark;

    setIsDark(shouldUseDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
  }, []);

  function toggleTheme() {
    const nextValue = !isDark;

    setIsDark(nextValue);
    document.documentElement.classList.toggle("dark", nextValue);
    window.localStorage.setItem("banki-theme", nextValue ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
      aria-label="Cambiar tema"
    >
      {isDark ? "Modo claro" : "Modo oscuro"}
    </button>
  );
}
