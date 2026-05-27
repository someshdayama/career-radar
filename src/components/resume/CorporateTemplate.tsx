"use client";

import { ResumeData } from "@/types/resume";
import styles from "./CorporateTemplate.module.css";

interface CorporateTemplateProps {
  data: ResumeData;
}

export default function CorporateTemplate({ data }: CorporateTemplateProps) {
  const { personalInfo, summary, experience, education, skills } = data;

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.nameRow}>
          <h1 className={styles.name}>{personalInfo?.fullName || "Your Name"}</h1>
          <div className={styles.contactBlock}>
            {personalInfo?.email && <div>{personalInfo.email}</div>}
            {personalInfo?.phone && <div>{personalInfo.phone}</div>}
            {personalInfo?.location && <div>{personalInfo.location}</div>}
            {personalInfo?.linkedinUrl && (
              <div><a href={personalInfo.linkedinUrl} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a></div>
            )}
          </div>
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Professional Summary</h2>
          <p className={styles.summary}>{summary}</p>
        </section>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Professional Experience</h2>
          {experience.map((exp, index) => (
            <div key={index} className={styles.job}>
              <div className={styles.jobHeader}>
                <h3 className={styles.jobTitle}>{exp.position}</h3>
                <span className={styles.jobDate}>{exp.startDate} – {exp.endDate}</span>
              </div>
              <div className={styles.company}>{exp.company}</div>
              {exp.description && exp.description.length > 0 && (
                <ul className={styles.bulletList}>
                  {exp.description.map((desc, i) => (
                    <li key={i}>{desc}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}



      {/* Education */}
      {education && education.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Education</h2>
          {education.map((edu, index) => (
            <div key={index} className={styles.eduItem}>
              <div className={styles.eduHeader}>
                <h3 className={styles.degree}>{edu.degree}</h3>
                {(edu.startDate || edu.endDate) && (
                  <span className={styles.eduDate}>{edu.startDate} – {edu.endDate}</span>
                )}
              </div>
              <div className={styles.institution}>{edu.institution}</div>
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Core Competencies</h2>
          <div className={styles.skillsGrid}>
            {skills.map((skill, index) => (
              <div key={index} className={styles.skillItem}>{skill}</div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
