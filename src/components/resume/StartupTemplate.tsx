"use client";

import { ResumeData } from "@/types/resume";
import styles from "./StartupTemplate.module.css";

interface StartupTemplateProps {
  data: ResumeData;
}

export default function StartupTemplate({ data }: StartupTemplateProps) {
  return (
    <div className={styles.page}>
      {/* Bold, modern header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.name}>{data.personalInfo?.fullName || "Your Name"}</h1>
          <div className={styles.contact}>
            {data.personalInfo?.email && <span>{data.personalInfo.email}</span>}
            {data.personalInfo?.phone && <span>{data.personalInfo.phone}</span>}
            {data.personalInfo?.location && <span>{data.personalInfo.location}</span>}
            {data.personalInfo?.linkedinUrl && (
              <a href={data.personalInfo.linkedinUrl} target="_blank" rel="noopener noreferrer">LinkedIn</a>
            )}
          </div>
        </div>
        {/* Abstract tech accent */}
        <div className={styles.accentShape}></div>
      </header>

      {/* Intro block */}
      {data.summary && (
        <section className={styles.summarySection}>
          <p className={styles.summary}>{data.summary}</p>
        </section>
      )}

      <div className={styles.grid}>
        {/* Left Column: Experience */}
        <div className={styles.mainColumn}>
          {data.experience && data.experience.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.slash}>/</span> Experience
              </h2>
              <div className={styles.experienceList}>
                {data.experience.map((exp, index) => (
                  <div key={index} className={styles.job}>
                    <div className={styles.jobHeader}>
                      <h3 className={styles.jobTitle}>{exp.position}</h3>
                      <span className={styles.jobDate}>
                        {exp.startDate} – {exp.endDate}
                      </span>
                    </div>
                    <div className={styles.company}>{exp.company}</div>
                    {exp.description && exp.description.length > 0 && (
                      <ul className={styles.descriptionList}>
                        {exp.description.map((desc, i) => (
                          <li key={i}>{desc}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}


        </div>

        {/* Right Column: Skills & Edu */}
        <div className={styles.sideColumn}>
          {data.skills && data.skills.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.slash}>/</span> Tech Stack
              </h2>
              <ul className={styles.skillsList}>
                {data.skills.map((skill, index) => (
                  <li key={index}>{skill}</li>
                ))}
              </ul>
            </section>
          )}

          {data.education && data.education.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.slash}>/</span> Education
              </h2>
              <div className={styles.educationList}>
                {data.education.map((edu, index) => (
                  <div key={index} className={styles.educationItem}>
                    <h3 className={styles.degree}>{edu.degree}</h3>
                    <div className={styles.institution}>{edu.institution}</div>
                    <span className={styles.educationDate}>
                      {edu.startDate} – {edu.endDate}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
