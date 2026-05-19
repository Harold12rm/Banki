"use client";

import { useEffect, useSyncExternalStore } from "react";

const themeChangeEvent = "banki-theme-change";

function getPreferredIsDark() {
  const savedTheme = window.localStorage.getItem("banki-theme");

  if (savedTheme) {
    return savedTheme === "dark";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getServerSnapshot() {
  return false;
}

function subscribeToThemeChange(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(themeChangeEvent, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(themeChangeEvent, callback);
  };
}

export default function ThemeToggle() {
  const isDark = useSyncExternalStore(
    subscribeToThemeChange,
    getPreferredIsDark,
    getServerSnapshot
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  function toggleTheme() {
    const nextValue = !isDark;

    document.documentElement.classList.toggle("dark", nextValue);
    window.localStorage.setItem("banki-theme", nextValue ? "dark" : "light");
    window.dispatchEvent(new Event(themeChangeEvent));
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
