"use client";

import styles from "./ResumeSkeleton.module.css";

export default function ResumeSkeleton() {
  return (
    <div className={styles.skeletonWrapper}>
      <div className={styles.header}>
        <div className={`${styles.box} ${styles.avatar}`}></div>
        <div className={`${styles.box} ${styles.title}`}></div>
        <div className={`${styles.box} ${styles.subtitle}`}></div>
      </div>

      <div className={styles.section}>
        <div className={`${styles.box} ${styles.sectionTitle}`}></div>
        <div className={`${styles.box} ${styles.line}`}></div>
        <div className={`${styles.box} ${styles.lineShort}`}></div>
        <div className={`${styles.box} ${styles.lineShorter}`}></div>
      </div>

      <div className={styles.section}>
        <div className={`${styles.box} ${styles.sectionTitle}`}></div>
        
        {/* Fake Job 1 */}
        <div className={styles.jobBlock}>
          <div className={styles.jobHeader}>
            <div className={`${styles.box} ${styles.lineShorter}`}></div>
            <div className={`${styles.box}`} style={{width: '20%', height: '16px'}}></div>
          </div>
          <div className={styles.jobDetailRow}>
             <div className={`${styles.box} ${styles.line}`}></div>
          </div>
          <div className={styles.jobDetailRow}>
             <div className={`${styles.box} ${styles.lineShort}`}></div>
          </div>
        </div>

        {/* Fake Job 2 */}
        <div className={styles.jobBlock}>
          <div className={styles.jobHeader}>
            <div className={`${styles.box} ${styles.lineShorter}`}></div>
            <div className={`${styles.box}`} style={{width: '20%', height: '16px'}}></div>
          </div>
          <div className={styles.jobDetailRow}>
             <div className={`${styles.box} ${styles.line}`}></div>
          </div>
        </div>
      </div>

    </div>
  );
}
