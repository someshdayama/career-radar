"use client";

import { ResumeData } from "@/types/resume";
import styles from "./MinimalistTemplate.module.css";

interface MinimalistTemplateProps {
  data: ResumeData;
}

export default function MinimalistTemplate({ data }: MinimalistTemplateProps) {
  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.name}>{data.personalInfo?.fullName || "Your Name"}</h1>
        <div className={styles.contact}>
          {data.personalInfo?.email && <span>{data.personalInfo.email}</span>}
          {data.personalInfo?.phone && (
            <>
              <span className={styles.dot}>•</span>
              <span>{data.personalInfo.phone}</span>
            </>
          )}
          {data.personalInfo?.location && (
            <>
              <span className={styles.dot}>•</span>
              <span>{data.personalInfo.location}</span>
            </>
          )}
          {data.personalInfo?.linkedinUrl && (
            <>
              <span className={styles.dot}>•</span>
              <a href={data.personalInfo.linkedinUrl} target="_blank" rel="noopener noreferrer">LinkedIn</a>
            </>
          )}
        </div>
      </header>

      {/* Summary */}
      {data.summary && (
        <section className={styles.section}>
          <p className={styles.summary}>{data.summary}</p>
        </section>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Experience</h2>
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



      {/* Education */}
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

      {/* Skills */}
      {data.skills && data.skills.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Skills</h2>
          <div className={styles.skillsList}>
            {data.skills.map((skill, index) => (
              <span key={index} className={styles.skillTag}>{skill}</span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
