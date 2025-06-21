import styles from './Loader.module.css';

export const Loader = () => {
  return (
    <div className={styles.loaderContainer}>
      <div className={styles.loader}></div>
      <span className={styles.loaderText}>Carregando...</span>
    </div>
  );
};