import { useCallback, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";

import "./CurtainThemeToggle.css";

type Theme = "light" | "dark";

export default function CurtainThemeToggle({
  theme,
  onChange,
  lightLabel = "Light mode",
  darkLabel = "Dark mode",
  compact = false,
}: {
  theme: Theme;
  onChange: (theme: Theme) => void;
  lightLabel?: string;
  darkLabel?: string;
  compact?: boolean;
}) {
  const [phase, setPhase] = useState<"idle" | "falling" | "rising">("idle");
  const nextThemeRef = useRef<Theme>(theme);

  const toggle = useCallback(() => {
    if (phase !== "idle") return;
    const nextTheme = theme === "light" ? "dark" : "light";
    nextThemeRef.current = nextTheme;
    setPhase("falling");
    window.setTimeout(() => {
      onChange(nextTheme);
      setPhase("rising");
      window.setTimeout(() => setPhase("idle"), 610);
    }, 420);
  }, [onChange, phase, theme]);

  const isDark = theme === "dark";

  return (
    <>
      <div
        aria-hidden="true"
        className={`curtain-theme-overlay ${phase !== "idle" ? `is-${phase}` : ""} ${
          nextThemeRef.current === "dark" ? "is-dark" : "is-light"
        }`}
      />
      <button
        className={`curtain-theme-toggle ${compact ? "is-compact" : ""}`}
        type="button"
        onClick={toggle}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        aria-pressed={isDark}
      >
        <span className={`curtain-theme-option ${!isDark ? "is-active" : ""}`}>
          <Sun size={15} aria-hidden="true" />
          {lightLabel}
        </span>
        <span className={`curtain-theme-option ${isDark ? "is-active" : ""}`}>
          <Moon size={15} aria-hidden="true" />
          {darkLabel}
        </span>
      </button>
    </>
  );
}
