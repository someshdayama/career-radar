"use client";

import { useState } from "react";
import { Palette, Type, AlignVerticalSpaceAround, ChevronDown, ChevronUp } from "lucide-react";
import styles from "./FormatCustomizer.module.css";

export interface FormatOptions {
  accentColor: string;
  fontFamily: string;
  spacing: "compact" | "normal" | "relaxed";
  fitToSinglePage: boolean;
}

interface FormatCustomizerProps {
  options: FormatOptions;
  onChange: (options: FormatOptions) => void;
}

const ACCENT_COLORS = [
  { id: "blue", value: "#3b82f6", label: "Blue" },
  { id: "purple", value: "#8b5cf6", label: "Purple" },
  { id: "emerald", value: "#10b981", label: "Emerald" },
  { id: "rose", value: "#f43f5e", label: "Rose" },
  { id: "amber", value: "#f59e0b", label: "Amber" },
  { id: "slate", value: "#475569", label: "Slate" },
  { id: "teal", value: "#14b8a6", label: "Teal" },
  { id: "indigo", value: "#6366f1", label: "Indigo" },
];

const FONT_OPTIONS = [
  { id: "inter", value: "'Inter', sans-serif", label: "Inter" },
  { id: "georgia", value: "'Georgia', serif", label: "Georgia" },
  { id: "times", value: "'Times New Roman', Times, serif", label: "Times" },
  { id: "system", value: "-apple-system, 'Segoe UI', sans-serif", label: "System" },
];

const SPACING_OPTIONS: { id: FormatOptions["spacing"]; label: string }[] = [
  { id: "compact", label: "Compact" },
  { id: "normal", label: "Normal" },
  { id: "relaxed", label: "Relaxed" },
];

export default function FormatCustomizer({ options, onChange }: FormatCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const update = (partial: Partial<FormatOptions>) => {
    onChange({ ...options, ...partial });
  };

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.toggle}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Palette size={14} />
        <span>Customize</span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {isOpen && (
        <div className={styles.panel}>
          {/* Fit to 1 Page Toggle */}
          <div className={styles.group}>
            <div className={styles.toggleLabel} onClick={() => update({ fitToSinglePage: !options.fitToSinglePage })}>
              <span className={styles.toggleText}>
                <AlignVerticalSpaceAround size={13} style={{ marginRight: '0.4rem', display: 'inline-block', verticalAlign: 'middle' }} />
                Fit to 1 Page
              </span>
              <button
                type="button"
                className={`${styles.toggleSwitch} ${options.fitToSinglePage ? styles.toggleOn : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  update({ fitToSinglePage: !options.fitToSinglePage });
                }}
              >
                <span className={styles.togglePin} />
              </button>
            </div>
          </div>

          {/* Accent Color */}
          <div className={styles.group}>
            <label className={styles.label}>
              <Palette size={13} />
              Accent Color
            </label>
            <div className={styles.colorGrid}>
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.id}
                  className={`${styles.colorSwatch} ${options.accentColor === c.value ? styles.colorActive : ""}`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => update({ accentColor: c.value })}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Font Family */}
          <div className={styles.group}>
            <label className={styles.label}>
              <Type size={13} />
              Font
            </label>
            <div className={styles.optionRow}>
              {FONT_OPTIONS.map((f) => (
                <button
                  key={f.id}
                  className={`${styles.optionBtn} ${options.fontFamily === f.value ? styles.optionActive : ""}`}
                  onClick={() => update({ fontFamily: f.value })}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Spacing */}
          <div className={styles.group}>
            <label className={styles.label}>
              <AlignVerticalSpaceAround size={13} />
              Spacing
            </label>
            <div className={styles.optionRow}>
              {SPACING_OPTIONS.map((s) => (
                <button
                  key={s.id}
                  className={`${styles.optionBtn} ${options.spacing === s.id ? styles.optionActive : ""}`}
                  onClick={() => update({ spacing: s.id })}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
