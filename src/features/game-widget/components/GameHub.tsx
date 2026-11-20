import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Gamepad2 } from 'lucide-react';
import { LionDanceIcon } from '@/components/svg';
import styles from './GameHub.module.css';

const LionJump = lazy(() => import('./GameWidget'));

export default function GameHub() {
  const [playingLion, setPlayingLion] = useState(false);
  return (
    <section className={styles.hub} aria-labelledby="game-hub-heading">
      <h1 id="game-hub-heading"><Gamepad2 aria-hidden="true" /> Game Hub</h1>
      <div className={styles.library}>
        <Link to="/games/little-acre" className={styles.farmCard}>
          <img src={`${import.meta.env.BASE_URL}farm-game/art/homestead.webp`} alt="" />
          <div className={styles.cardText}>
            <h2>Little Acre</h2>
            <p>Work the land and bring the valley’s last ferry home.</p>
            <span>Play Little Acre <ArrowRight size={17} /></span>
          </div>
        </Link>
        <button type="button" className={styles.runnerCard} onClick={() => setPlayingLion(true)}>
          <span className={styles.mascot} aria-hidden="true"><LionDanceIcon /></span>
          <strong>Lion Jump</strong>
          <small>Leap over lanterns and chase your high score.</small>
          <span className={styles.play}>Play Lion Jump <ArrowRight size={16} /></span>
        </button>
      </div>
      {playingLion && <Suspense fallback={null}><LionJump onClose={() => setPlayingLion(false)} /></Suspense>}
    </section>
  );
}
