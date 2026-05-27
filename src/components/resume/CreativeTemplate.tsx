"use client";

import { ResumeData } from "@/types/resume";
import styles from "./CreativeTemplate.module.css";

interface CreativeTemplateProps {
  data: ResumeData;
}

export default function CreativeTemplate({ data }: CreativeTemplateProps) {
  return (
    <div className={styles.page}>
      {/* Sidebar Focus Area */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.avatarPlaceholder}>
             {data.personalInfo?.fullName?.charAt(0) || "U"}
          </div>
          <h1 className={styles.name}>{data.personalInfo?.fullName || "Your Name"}</h1>
        </div>

        <div className={styles.contactBlock}>
          <h3 className={styles.sidebarTitle}>Contact</h3>
          {data.personalInfo?.email && <p>{data.personalInfo.email}</p>}
          {data.personalInfo?.phone && <p>{data.personalInfo.phone}</p>}
          {data.personalInfo?.location && <p>{data.personalInfo.location}</p>}
          {data.personalInfo?.linkedinUrl && (
            <p><a href={data.personalInfo.linkedinUrl} target="_blank" rel="noopener noreferrer">LinkedIn Profile</a></p>
          )}
        </div>

        {data.skills && data.skills.length > 0 && (
          <div className={styles.skillsBlock}>
            <h3 className={styles.sidebarTitle}>Expertise</h3>
            <ul className={styles.skillsList}>
              {data.skills.map((skill, index) => (
                <li key={index}>{skill}</li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {data.summary && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Profile</h2>
            <p className={styles.summary}>{data.summary}</p>
          </section>
        )}

        {data.experience && data.experience.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Experience</h2>
            <div className={styles.timeline}>
              {data.experience.map((exp, index) => (
                <div key={index} className={styles.timelineItem}>
                  <div className={styles.timelineDot}></div>
                  <div className={styles.timelineContent}>
                    <h3 className={styles.jobTitle}>{exp.position}</h3>
                    <div className={styles.companyMeta}>
                      <span className={styles.company}>{exp.company}</span>
                      <span className={styles.date}>
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
                  <h3 className={styles.degree}>{edu.degree}</h3>
                  <div className={styles.institutionMeta}>
                     <span>{edu.institution}</span>
                     <span className={styles.date}>
                      {edu.startDate} – {edu.endDate}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
