"use client";

import styles from "./TemplateSwitcher.module.css";

interface TemplateSwitcherProps {
  currentTemplate: string;
  onTemplateChange: (template: string) => void;
}

export default function TemplateSwitcher({
  currentTemplate,
  onTemplateChange,
}: TemplateSwitcherProps) {
  const templates = [
    { id: "minimalist", label: "Minimalist" },
    { id: "corporate",  label: "Corporate" },
    { id: "startup",    label: "Startup" },
    { id: "creative",   label: "Creative" },
    { id: "elegant",    label: "Elegant" },
  ];

  return (
    <div className={styles.container}>
      {templates.map((t) => (
        <button
          key={t.id}
          className={`${styles.button} ${
            currentTemplate === t.id ? styles.active : ""
          }`}
          onClick={() => onTemplateChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
