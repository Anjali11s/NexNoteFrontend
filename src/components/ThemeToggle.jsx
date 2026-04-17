// src/components/ThemeToggle.jsx
import { MoonIcon, SunIcon } from "lucide-react";
import { useEffect, useState } from "react";

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark";
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="p-2 rounded-xl bg-white dark:bg-stone-800 border-2 border-amber-200 dark:border-stone-600 hover:border-amber-400 dark:hover:border-amber-500 transition-all"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <SunIcon className="size-5 text-amber-500" />
      ) : (
        <MoonIcon className="size-5 text-stone-700 dark:text-stone-300" />
      )}
    </button>
  );
};

export default ThemeToggle;