"use client";

import { ResumeData } from "@/types/resume";
import styles from "./ElegantTemplate.module.css";

interface ElegantTemplateProps {
  data: ResumeData;
}

export default function ElegantTemplate({ data }: ElegantTemplateProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.name}>{data.personalInfo?.fullName || "Your Name"}</h1>
        <div className={styles.contactInfo}>
          {data.personalInfo?.email && <span>{data.personalInfo.email}</span>}
          {data.personalInfo?.phone && (
            <>
              <span className={styles.separator}>|</span>
              <span>{data.personalInfo.phone}</span>
            </>
          )}
          {data.personalInfo?.location && (
            <>
              <span className={styles.separator}>|</span>
              <span>{data.personalInfo.location}</span>
            </>
          )}
          {data.personalInfo?.linkedinUrl && (
            <>
              <span className={styles.separator}>|</span>
              <a href={data.personalInfo.linkedinUrl} target="_blank" rel="noopener noreferrer">LinkedIn</a>
            </>
          )}
        </div>
      </header>

      {data.summary && (
        <section className={styles.section}>
          <p className={styles.summary}>{data.summary}</p>
        </section>
      )}

      {data.experience && data.experience.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Professional Experience</h2>
          <div className={styles.experienceList}>
            {data.experience.map((exp, index) => (
              <div key={index} className={styles.job}>
                <div className={styles.jobHeader}>
                  <div className={styles.jobTitleGroup}>
                    <h3 className={styles.jobTitle}>{exp.position}</h3>
                    <span className={styles.companyName}>, {exp.company}</span>
                  </div>
                  <span className={styles.jobDate}>
                    {exp.startDate} – {exp.endDate}
                  </span>
                </div>
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



      {data.education && data.education.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Education</h2>
          <div className={styles.educationList}>
            {data.education.map((edu, index) => (
              <div key={index} className={styles.educationItem}>
                <div className={styles.educationHeader}>
                  <h3 className={styles.degree}>{edu.degree}</h3>
                  <span className={styles.educationDate}>
                    {edu.startDate} – {edu.endDate}
                  </span>
                </div>
                <div className={styles.institution}>{edu.institution}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.skills && data.skills.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Core Competencies</h2>
          <div className={styles.skillsGrid}>
            {data.skills.map((skill, index) => (
              <span key={index} className={styles.skillItem}>
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
