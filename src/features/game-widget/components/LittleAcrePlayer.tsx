import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from './GameHub.module.css';

export default function LittleAcrePlayer() {
  return (
    <main className={styles.player}>
      <nav aria-label="Game navigation">
        <Link to="/games"><ArrowLeft size={16} aria-hidden="true" /> Game Hub</Link>
      </nav>
      <iframe title="Little Acre farming game" src={`${import.meta.env.BASE_URL}farm-game/index.html`} />
    </main>
  );
}
