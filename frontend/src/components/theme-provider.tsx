"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "kinetic" | "warm";
const ThemeContext = createContext<{ theme: Theme; setTheme: (value: Theme) => void }>({
  theme: "kinetic",
  setTheme: () => undefined,
});

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [theme, setTheme] = useState<Theme>("kinetic");
  useEffect(() => {
    if (localStorage.getItem("todo-theme") === "warm") {
      const frame = requestAnimationFrame(() => {
        setTheme("warm");
      });
      return () => {
        cancelAnimationFrame(frame);
      };
    }
    return undefined;
  }, []);
  useEffect(() => {
    document.documentElement.dataset["theme"] = theme;
  }, [theme]);
  function chooseTheme(value: Theme): void {
    localStorage.setItem("todo-theme", value);
    setTheme(value);
  }
  return (
    <ThemeContext.Provider value={{ theme, setTheme: chooseTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): { theme: Theme; setTheme: (value: Theme) => void } {
  return useContext(ThemeContext);
}
