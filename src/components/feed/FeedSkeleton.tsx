import styles from "./feed.module.css";

const SKELETON_COUNT = 4;

export function FeedSkeleton() {
  return (
    <div className={styles.skeletonGrid} aria-busy="true" aria-label="Загрузка постов">
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <div className={styles.skeletonCard} key={index}>
          <div className={styles.skeletonHeader}>
            <div className={styles.skeletonCircle} />
            <div className={styles.skeletonLines}>
              <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
              <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
            </div>
          </div>
          <div className={styles.skeletonMedia} />
          <div className={styles.skeletonFooter}>
            <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
            <div className={styles.skeletonLine} />
          </div>
        </div>
      ))}
    </div>
  );
}
