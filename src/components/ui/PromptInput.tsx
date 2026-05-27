"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import styles from "./PromptInput.module.css";
import { ResumeData } from "@/types/resume";

interface PromptInputProps {
  onDataGenerated: (data: ResumeData) => void;
  onLoading?: (isLoading: boolean) => void;
  jobContext?: { title: string; company: string };
}

export default function PromptInput({ onDataGenerated, onLoading, jobContext }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter your details first.");
      return;
    }

    setIsLoading(true);
    onLoading?.(true);
    setError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, ...(jobContext ? { jobContext } : {}) }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to generate resume.");
      }

      onDataGenerated(json.data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
      onLoading?.(false);
    }
  };

  const handleClear = () => {
    setPrompt("");
    setError("");
  };

  const handleInsertExample = () => {
    setPrompt(`My name is Somesh Dayama. I am based in Mumbai, India. Phone: 7049614849. Email: someshdayama2@gmail.com.

I am a Software Engineer with over 3 years of experience in DevOps, Cloud Infrastructure, and SRE roles.

SKILLS:
- Cloud Platforms: GCP (Compute Engine, GKE, Cloud SQL, IAM, VPC), AWS, Azure
- DevOps Tools: Jenkins, Docker, Kubernetes, Terraform, Ansible, Helm, GitHub Actions
- Programming & Scripting: Java, Python, SQL, Groovy, Bash, Linux Shell
- Monitoring & CI/CD: Prometheus, Grafana, CI/CD Pipelines, Maven, Git
- Agile & Project Management: Scrum (CSM certified), Agile Methodologies, JIRA

WORK EXPERIENCE:

NCR Atleos Corporation | Mumbai, India — DevOps Engineer / Release Lead — Feb 2025 to Present
- Managed release lifecycles and CI/CD coordination for an 11-member engineering squad on the AMP Services Product in Azure.
- Primary Incident Commander for production outages, coordinating Dev and Ops teams to significantly reduce Mean Time to Resolution.
- Orchestrated end-to-end cloud infrastructure using GCP (GKE, Compute Engine).

Monocept Consulting Pvt. Ltd. | Hyderabad — Software Engineer / Cloud & SRE — May 2023 to Feb 2025
- FinOps/Cost Optimisation: Achieved a 34.56% reduction in GCP cloud infrastructure costs.
- Database Reliability: Reduced database-related production incidents by 24% using automated maintenance.

EDUCATION:
Master of Computer Applications (MCA) — National Institute of Technology, Bhopal - 2020 to 2023
Bachelor of Computer Applications (BCA) — Prestige Institute of Management and Research, Indore - 2017 to 2020`);
    setError("");
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Paste Your Info</h2>
        <div className={styles.helperActions}>
          <button className={styles.helperButton} onClick={handleClear} disabled={isLoading}>Clear</button>
          <button className={styles.helperButton} onClick={handleInsertExample} disabled={isLoading}>Example</button>
        </div>
      </div>
      
      <p className={styles.subtitle}>
        Dump your work history, education, skills, and contact info below. Our AI will instantly format it into a professional resume.
      </p>

      <textarea
        className={styles.textarea}
        placeholder="e.g. My name is John Doe. I've worked as a Software Engineer at Acme Corp since Jan 2020 where I migrated the database to PostgreSQL and increased performance by 40%. Before that, I was at..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      {error && <p className={styles.error}>{error}</p>}

      <button
        className={styles.button}
        onClick={handleGenerate}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className={styles.iconSpin} size={18} />
            Analyzing & Formatting...
          </>
        ) : (
          <>
            <Sparkles size={18} />
            Generate Resume Now
          </>
        )}
      </button>
    </div>
  );
}
