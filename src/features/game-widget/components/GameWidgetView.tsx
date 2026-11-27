import { LazyLionDanceIcon } from '@/components/svg';
import { COLLECT_SIZE, GAME_WIDTH, GROUND_Y, TIER_LABELS } from '../constants';
import type { GameWidgetState } from '../types';
import styleCss from './GameWidget.module.css';

interface GameWidgetViewProps {
  onClose: () => void;
  state: GameWidgetState;
  jump: () => void;
  restart: () => void;
  toggleRunning: () => void;
}

export default function GameWidgetView({ onClose, state, jump, restart, toggleRunning }: GameWidgetViewProps) {
  const {
    running,
    gameOver,
    score,
    highScore,
    jumpTier,
    shieldCountdown,
    tierNotice,
    isChallenge,
    isSuperChallenge,
    y,
    obstacles,
    collectibles,
  } = state;

  return (
    <div className={styleCss.gameOverlay}>
      <div className={styleCss.gameWindow}>
        {tierNotice && (
          <div className={styleCss.proAnnounce} role="status" aria-live="polite">
            {tierNotice}
          </div>
        )}

        <div className={styleCss.gameHeader}>
          <span className={styleCss.headerTitle}>Lion Jump</span>
          <div className={styleCss.headerActions}>
            <button className={styleCss.iconBtn} onClick={onClose} title="Close">
              ✖
            </button>
          </div>
        </div>

        <div className={styleCss.scoreRow}>
          <span className={styleCss.badge}>Score: {score}</span>
          <span className={styleCss.badgeSecondary}>Best: {highScore}</span>
          {jumpTier >= 2 && (
            <span className={styleCss.badgeJump}>
              <span className={styleCss.badgeIcon} aria-hidden="true">
                🥈
              </span>
              Double Jump
            </span>
          )}
          {jumpTier === 3 && (
            <span className={styleCss.badgeJump}>
              <span className={styleCss.badgeIcon} aria-hidden="true">
                🥇
              </span>
              Triple Jump
            </span>
          )}
          {shieldCountdown > 0 && (
            <span className={styleCss.badgeJump} title="Shield active">
              Shield ⛨ {shieldCountdown}s
            </span>
          )}
          {isChallenge && !isSuperChallenge && (
            <span className={styleCss.badgeJump} title="Challenge mode">
              🔥 Challenge
            </span>
          )}
          {isSuperChallenge && (
            <span className={styleCss.badgeJump} title={TIER_LABELS.SUPER}>
              💥 Super
            </span>
          )}
        </div>

        {gameOver && <div className={styleCss.gameOver}>Game Over</div>}

        <div
          className={`${styleCss.gameArea} ${jumpTier === 3 ? styleCss.challengeTheme : styleCss.snowTheme}`}
          style={{ width: GAME_WIDTH }}
          onClick={jump}
          role="button"
          aria-label="Game area (click to jump)"
        >
          {jumpTier === 3 && (
            <div className={styleCss.fireEmbers}>
              <span className={styleCss.ember} />
              <span className={styleCss.ember} />
              <span className={styleCss.ember} />
              <span className={styleCss.ember} />
              <span className={styleCss.ember} />
            </div>
          )}

          {jumpTier !== 3 && (
            <>
              <div className={styleCss.snowflake} />
              <div className={styleCss.snowflake} />
              <div className={styleCss.snowflake} />
            </>
          )}
          <div className={styleCss.groundLine} />

          <div
            className={`${styleCss.runner} ${y < GROUND_Y ? styleCss.runnerAir : ''}`}
            style={{ transform: `translate3d(0, ${y}px, 0)` }}
            title="Reindeer"
          >
            <LazyLionDanceIcon />
          </div>

          {obstacles.map((o) => (
            <div key={o.id} className={styleCss.obstacle} style={{ transform: `translate3d(${o.x}px, 0, 0)` }} title="Present">
              🏮
            </div>
          ))}

          {collectibles.map((c) => (
            <div
              key={c.id}
              className={styleCss.collectible}
              style={{
                transform: `translate3d(${c.x}px, 0, 0)`,
                top: `${c.y}px`,
                width: COLLECT_SIZE,
                height: COLLECT_SIZE,
                fontSize: Math.max(18, Math.round(COLLECT_SIZE * 0.85)),
                lineHeight: `${COLLECT_SIZE}px`,
                opacity: c.eaten ? 0 : 1,
              }}
              title={c.kind === 'shield' ? 'Shield' : 'Bonus'}
              aria-hidden={c.eaten ? 'true' : 'false'}
            >
              {c.kind === 'shield' ? '🛡️' : '🧧'}
            </div>
          ))}

          {!running && !gameOver && <div className={styleCss.pausedOverlay}>Paused ⏸️</div>}
        </div>

        <div className={styleCss.controlsRow}>
          {!gameOver && (
            <>
              <button className={styleCss.secondaryBtn} onClick={toggleRunning}>
                {running ? 'Pause' : 'Resume'}
              </button>
              <button className={styleCss.primaryBtn} onClick={jump}>
                Jump
              </button>
            </>
          )}
          {gameOver && (
            <button className={styleCss.primaryBtn} onClick={restart}>
              Restart
            </button>
          )}
        </div>

        <div className={styleCss.tip}>
          Click or press Space to jump. Avoid presents 🏮. Speed ramps up as you score. Grab 🧧 for bonus and 🛡️ for a shield.
        </div>
      </div>
    </div>
  );
}
