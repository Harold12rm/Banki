"use client";

import { useState } from "react";

function getInitialIsDark() {
  if (typeof window === "undefined") {
    return false;
  }

  const savedTheme = window.localStorage.getItem("banki-theme");

  if (savedTheme) {
    const isDark = savedTheme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    return isDark;
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", prefersDark);

  return prefersDark;
}

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(getInitialIsDark);

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
