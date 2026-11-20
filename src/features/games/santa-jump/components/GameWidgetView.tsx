import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { ArrowRight, Check, ChevronRight, Clock3, Flag, LockKeyhole, Mail, MapPinned, Pause, Play, RotateCcw, Trophy, X } from 'lucide-react';
import { chapters, FLOOR, HAZARD_SIZE, ITEM_SIZE, SANTA_SIZE, SANTA_X, WORLD_HEIGHT, WORLD_WIDTH } from '../constants';
import type { useGameEngine } from '../hooks/useGameEngine';
import santa from './santa-runner.webp';
import workshop from '../art/workshop.webp';
import forest from '../art/evergreen-forest.webp';
import village from '../art/village-rooftops.webp';
import tower from '../art/star-observatory.webp';
import letter from '../art/sealed-letter.webp';
import star from '../art/gold-star.webp';
import shield from '../art/ice-shield.webp';
import present from '../art/gift-crate.webp';
import stump from '../art/pine-stump.webp';
import chimney from '../art/brick-chimney.webp';
import ice from '../art/ice-cluster.webp';
import horn from '../art/post-horn.webp';
import workshopFloor from '../art/workshop-timber.webp';
import forestFloor from '../art/forest-bank.webp';
import roof from '../art/roof-tiles.webp';
import marble from '../art/observatory-stone.webp';
import css from './GameWidget.module.css';

const scenes = [workshop, forest, village, tower];
const grounds = [workshopFloor, forestFloor, roof, marble];
const hazards = [present, stump, chimney, ice];
const items = { letter, star, shield };
const chapterNumber = (index: number) => String(index + 1).padStart(2, '0');

function spriteStyle(x: number, height: number, size: number): CSSProperties {
  return {
    left: (x / WORLD_WIDTH) * 100 + '%',
    top: ((FLOOR - height - size) / WORLD_HEIGHT) * 100 + '%',
    width: (size / WORLD_WIDTH) * 100 + '%',
    height: (size / WORLD_HEIGHT) * 100 + '%',
  };
}

type Props = ReturnType<typeof useGameEngine> & { onClose: () => void };

export default function GameWidgetView({ state, record, unlocked, jump, pause, play, select, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const actionButton = useRef<HTMLButtonElement>(null);
  const field = useRef<HTMLButtonElement>(null);
  const { phase, chapter, letters, score } = state;
  const level = chapters[chapter];
  const routePercent = Math.min(100, Math.floor(state.distance / level.routeLength * 100));
  const playing = phase === 'playing';
  const briefing = phase === 'briefing';
  const complete = phase === 'delivered';
  const finale = complete && chapter === chapters.length - 1;
  const routeOpen = briefing || complete || phase === 'lost';
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, []);
  useEffect(() => {
    const target = playing ? field.current : actionButton.current;
    target?.focus({ preventScroll: true });
  }, [playing, phase, chapter]);

  const title = briefing ? level.name : complete ? finale ? 'Every wish delivered' : 'Mail delivered' : phase === 'paused' ? 'Paused' : 'Delivery interrupted';
  const message = briefing ? level.story : complete ? level.ending : phase === 'paused' ? 'Your letters are safe. Resume here when you’re ready.' : `Santa hit the ${level.hazard.toLowerCase()}. Try this stop again.`;
  const action = complete ? finale ? 'Back to the mailroom' : 'Next stop' : briefing ? 'Set off' : phase === 'paused' ? 'Resume' : 'Retry this stop';

  return (
    <dialog ref={dialog} className={css.dialog} aria-labelledby="santa-jump-title" lang="en"
      onCancel={event => { event.preventDefault(); onClose(); }}
      onKeyDown={event => {
        if (playing && (event.code === 'ArrowUp' || (event.code === 'Space' && event.target === field.current))) {
          event.preventDefault();
          if (!event.repeat) jump();
        }
      }}>
      <header className={css.header}>
        <div className={css.brandIcon}><img src={horn} alt="" /></div>
        <div><div className={css.eyebrow}>North Pole Post</div><h1 id="santa-jump-title">Santa Jump</h1></div>
        <div className={css.stamp}><Mail size={17} /> Christmas Eve</div>
        <button className={css.iconButton} onClick={onClose} aria-label="Close game"><X size={20} /></button>
      </header>

      <div className={css.body}>
        <div className={css.main}>
          <section className={css.board} data-active={playing || undefined} style={{
            backgroundImage: `url("${scenes[chapter]}")`,
            backgroundPositionX: `${50 + 44 * Math.sin(state.distance / 1450)}%`,
          }} aria-label={level.name}>
            <div className={css.hud}>
              <span><Flag size={13} /> Stop {chapterNumber(chapter)}</span>
              <span aria-label={`Route distance: ${routePercent}%`}>Route {routePercent}%</span>
              <span><img src={star} alt="Score" />{score}</span>
              {state.shield && <span><img src={shield} alt="Shield active" /></span>}
              {playing && <button onClick={pause} aria-label="Pause"><Pause size={14} /></button>}
            </div>
            {!briefing && <>
              <div className={css.ground} style={{backgroundImage: `url("${grounds[chapter]}")`, backgroundPositionX: `-${state.distance % 260 / WORLD_WIDTH * 100}cqw`}} />
              <img src={santa} alt="Santa" data-runner data-running={playing && state.height === 0 || undefined} className={state.shield ? css.protected : css.sprite}
                style={spriteStyle(SANTA_X, state.height, SANTA_SIZE)} />
              {state.entities.map(e => <img key={e.id}
                className={css.sprite} alt={e.kind === 'hazard' ? level.hazard : ''}
                src={e.kind === 'hazard' ? hazards[chapter] : items[e.kind]}
                style={spriteStyle(e.x, e.bottom, e.kind === 'hazard' ? HAZARD_SIZE : ITEM_SIZE)} />)}
            </>}
            {playing ? <button ref={field} className={css.field} onClick={jump} aria-label="Jump" /> :
              <div className={css.sceneOverlay}>
                <div className={css.sceneText} role="status">
                  <div className={css.sceneLabel}><Clock3 size={13}/> {level.time} <i/> {finale ? 'Route complete' : level.recipient}</div>
                  <h2>{title}</h2><p>{message}</p>
                </div>
                <button ref={actionButton} className={css.startButton} onClick={() => complete ? select(finale ? 0 : chapter + 1) : play()}>
                  {phase === 'lost' ? <RotateCcw size={15}/> : <Play size={14} fill="currentColor"/>}{action}<ArrowRight size={15}/>
                </button>
              </div>}
          </section>
          <aside className={css.dispatch}>
            <div className={css.eyebrow}><Mail size={14} /> Delivery slip</div>
            <h2>Your delivery</h2>
            <div className={css.delivery}><span>Wish letters</span><strong>{letters} / {level.letters}</strong></div>
            <progress value={letters} max={level.letters} aria-label="Letters collected" />
            <div className={css.gear}>
              <div><img src={letter} alt=""/><span><b>Sealed letter</b><small>Fill the bag and finish the route</small></span></div>
              <div><img src={star} alt=""/><span><b>Gold star</b><small>Worth 5 points</small></span></div>
              <div><img src={shield} alt=""/><span><b>Ice shield</b><small>Blocks one hit</small></span></div>
              <div><img src={hazards[chapter]} alt=""/><span><b>{level.hazard}</b><small>Jump over it</small></span></div>
            </div>
          </aside>
        </div>
        <div className={css.routeTitle}><h2><MapPinned size={17}/> Delivery route</h2><span>{record.filter(Boolean).length} / 4 stops complete</span></div>
        <nav className={css.route} aria-label="Choose a delivery stop">
          {chapters.map((c, i) => <button key={c.short} className={css.routeCard} aria-current={chapter === i ? 'step' : undefined}
            disabled={!routeOpen || i > unlocked} onClick={() => select(i)} aria-label={`${c.short}${i > unlocked ? ', locked' : ''}`}>
            <img src={scenes[i]} alt="" /><div><small>Stop {chapterNumber(i)}</small><strong>{c.short}</strong></div>
            {i > unlocked ? <LockKeyhole size={13}/> : record[i] ? <Check size={15}/> : <ChevronRight size={15}/>}
          </button>)}
        </nav>
        <footer className={css.footer}>
          <span><kbd>Space</kbd> or tap to jump{level.jumps > 1 ? ` · Up to ${level.jumps} jumps in a row` : ''}</span>
          <span><Trophy size={13}/> Stop record <b>{record[chapter]}</b></span>
        </footer>
      </div>
    </dialog>
  );
}
