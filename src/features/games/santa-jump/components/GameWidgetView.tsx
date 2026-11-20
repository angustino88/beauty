import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { ArrowRight, Check, ChevronRight, Clock3, Flag, LockKeyhole, Mail, MapPinned, Pause, Play, RotateCcw, Trophy, X } from 'lucide-react';
import { chapters, modes, FLOOR, HAZARD_SIZE, ITEM_SIZE, SANTA_SIZE, SANTA_X, WORLD_HEIGHT, WORLD_WIDTH } from '../constants';
import type { useGameEngine } from '../hooks/useGameEngine';
import santa from './santa-runner.webp';
import workshop from '../art/workshop.webp';
import forest from '../art/evergreen-forest.webp';
import village from '../art/village-rooftops.webp';
import glassworks from '../art/aurora-glassworks.webp';
import harbor from '../art/starlight-harbor.webp';
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
import goblin from '../art/pine-goblin.webp';
import king from '../art/frost-king.webp';
import magnet from '../art/holly-magnet.webp';
import hourglass from '../art/frost-hourglass.webp';
import prism from '../art/prism-brooch.webp';
import owl from '../art/snow-owl.webp';
import hare from '../art/horned-hare.webp';
import watch from '../art/pocket-watch.webp';
import type { Mode } from '../types';
import { isThreat } from '../simulation';
import css from './GameWidget.module.css';

const scenes = [workshop, forest, village, tower, glassworks, harbor];
const grounds = [workshopFloor, forestFloor, roof, marble, marble, workshopFloor];
const hazards = [present, stump, chimney, ice, ice, present];
const items = { letter, star, shield, goblin, magnet, hourglass, prism, owl, hare, blast: ice, counterStar: star };
const equipment = [
  [letter, 'Wish letter', '10 points; fills the mailbag in Story route.'],
  [star, 'Gold star', 'Worth 5 points.'],
  [shield, 'Ice shield', 'Absorbs the next hit.'],
  [magnet, 'Holly magnet', 'Draws nearby letters and stars to Santa for 8s.'],
  [hourglass, 'Frost hourglass', 'Slows the world for 5s.'],
  [prism, 'Prism brooch', 'Doubles letter and star points for 8s.'],
];
const creatures = [
  [goblin, 'Pine goblin', 'Charges faster than the scenery. Jump early.'],
  [owl, 'Snow owl', 'Flies overhead. Stay low to pass underneath.'],
  [hare, 'Horned hare', 'Bounds along the track. Clear it at the top of your jump.'],
];
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

export default function GameWidgetView({ state, record, arcade, unlocked, jump, pause, play, select, selectMode, onClose }: Props) {
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

  const campaign = state.mode === 'campaign';
  const best = campaign ? record[chapter] : arcade[state.mode === 'rush' ? 0 : 1];
  let title: string = level.name;
  let message: string = level.story;
  let action = 'Set off';
  if (phase === 'paused') {
    title = 'Paused';
    message = 'Resume when you’re ready, or choose another mode to start a new run.';
    action = 'Resume';
  } else if (!campaign && (complete || phase === 'lost')) {
    title = complete ? 'Time’s up!' : 'Run complete';
    message = `Final score: ${score} · Personal best: ${best}`;
    action = 'Play again';
  } else if (complete) {
    title = finale ? 'Every wish delivered' : 'Mail delivered';
    message = level.ending;
    action = finale ? 'Back to the mailroom' : 'Next stop';
  } else if (phase === 'lost') {
    title = 'Delivery interrupted';
    message = 'Santa took a hit. Try this stop again.';
    action = 'Retry this stop';
  }

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
        <nav className={css.modes} aria-label="Game mode">
          {(Object.keys(modes) as Mode[]).map(mode => <button key={mode} aria-pressed={state.mode === mode}
            disabled={playing} onClick={() => selectMode(mode)}>{modes[mode].label}</button>)}
        </nav>
        <div className={css.main}>
          <section className={css.board} data-panorama={chapter >= 4 || undefined} data-active={playing || undefined} style={{
            backgroundImage: `url("${scenes[chapter]}")`,
            backgroundPositionX: `${50 + 44 * Math.sin(state.distance / 1450)}%`,
          }} aria-label={level.name}>
            <div className={css.hud}>
              <span><Flag size={13} /> Stop {chapterNumber(chapter)}</span>
              {campaign ? <span aria-label={`Route distance: ${routePercent}%`}>Route {routePercent}%</span> : <span><img src={watch} alt="Time" />{state.mode === 'rush' ? Math.ceil(60 - state.elapsed) : Math.floor(state.elapsed)}s</span>}
              <span><img src={star} alt="Score" />{score}</span>
              {state.bossHP !== null && <span aria-label="Frost seals remaining">♛ {state.bossHP}/3</span>}
              {state.magnet > 0 && <span><img src={magnet} alt="Magnet" />{Math.ceil(state.magnet)}s</span>}
              {state.slow > 0 && <span><img src={hourglass} alt="Slow motion" />{Math.ceil(state.slow)}s</span>}
              {state.multiplier > 0 && <span><img src={prism} alt="Double points" />{Math.ceil(state.multiplier)}s</span>}
              {state.shield && <span><img src={shield} alt="Shield active" /></span>}
              {playing && <button onClick={pause} aria-label="Pause"><Pause size={14} /></button>}
            </div>
            {!briefing && <>
              <div className={css.ground} style={{backgroundImage: `url("${grounds[chapter]}")`, backgroundPositionX: `-${state.distance % 260 / WORLD_WIDTH * 100}cqw`}} />
              <img src={santa} alt="Santa" data-runner data-running={playing && state.height === 0 || undefined} className={state.shield ? css.protected : css.sprite}
                style={spriteStyle(SANTA_X, state.height, SANTA_SIZE)} />
              {state.bossHP !== null && <img className={css.sprite} src={king} alt="Frost King" style={spriteStyle(618, 0, 136)} />}
              {state.entities.map(e => <img key={e.id}
                className={css.sprite} data-foe={e.kind === 'goblin' ? 'goblin' : undefined} alt={e.kind === 'hazard' ? level.hazard : e.kind === 'goblin' ? 'Pine goblin' : e.kind === 'owl' ? 'Snow owl' : e.kind === 'hare' ? 'Horned hare' : ''}
                src={e.kind === 'hazard' ? hazards[chapter] : items[e.kind]}
                style={spriteStyle(e.x, e.bottom, isThreat(e.kind) ? HAZARD_SIZE : ITEM_SIZE)} />)}
            </>}
            {playing ? <button ref={field} className={css.field} onClick={jump} aria-label="Jump" /> :
              <div className={css.sceneOverlay}>
                <div className={css.sceneText} role="status">
                  <div className={css.sceneLabel}><Clock3 size={13}/> {level.time} <i/> {finale ? 'Route complete' : level.recipient}</div>
                  <h2>{title}</h2><p>{message}</p>
                </div>
                <button ref={actionButton} className={css.startButton} onClick={() => campaign && complete ? select(finale ? 0 : chapter + 1) : play()}>
                  {phase === 'lost' ? <RotateCcw size={15}/> : <Play size={14} fill="currentColor"/>}{action}<ArrowRight size={15}/>
                </button>
              </div>}
          </section>
          <aside className={css.dispatch}>
            <div className={css.eyebrow}><Mail size={14} /> Delivery slip</div>
            <h2>{state.bossHP !== null ? 'Frost King' : campaign ? 'Your delivery' : modes[state.mode].label}</h2>
            {state.bossHP !== null && <p role="status">Frost seals: {state.bossHP}/3. Jump over ice blasts and catch the high stars to break his crown.</p>}
            {campaign ? <><div className={css.delivery}><span>Wish letters</span><strong>{letters} / {level.letters}</strong></div>
            <progress value={letters} max={level.letters} aria-label="Letters collected" /></> : <p>{modes[state.mode].description}</p>}
            <p className={css.trackHazard}><img src={hazards[chapter]} alt=""/>Watch for {level.hazard.toLowerCase()} obstacles.</p>
            {[{ label: 'Supplies', entries: equipment }, { label: 'Creatures', entries: creatures }].map(({ label, entries }) => (
              <details key={label} className={css.guide}>
                <summary>{label}</summary>
                <div className={css.gear}>{entries.map(([icon, name, hint]) =>
                  <div key={name}><img src={icon} alt=""/><span><b>{name}</b><small>{hint}</small></span></div>)}</div>
              </details>
            ))}
          </aside>
        </div>
        <div className={css.routeTitle}><h2><MapPinned size={17}/> Delivery route</h2><span>{record.filter(Boolean).length} / {chapters.length} stops complete</span></div>
        <nav className={css.route} aria-label="Choose a delivery stop">
          {chapters.map((c, i) => <button key={c.short} className={css.routeCard} aria-current={chapter === i ? 'step' : undefined}
            disabled={!routeOpen || i > unlocked} onClick={() => select(i)} aria-label={`${c.short}${i > unlocked ? ', locked' : ''}`}>
            <img src={scenes[i]} alt="" /><div><small>Stop {chapterNumber(i)}</small><strong>{c.short}</strong></div>
            {i > unlocked ? <LockKeyhole size={13}/> : record[i] ? <Check size={15}/> : <ChevronRight size={15}/>}
          </button>)}
        </nav>
        <footer className={css.footer}>
          <span><kbd>Space</kbd> or tap to jump{state.jumpLimit > 1 ? ` · ${state.jumpLimit === 2 ? "Double jump" : "Triple jump"} ready` : ''}</span>
          <span><Trophy size={13}/> {campaign ? 'Stop record' : 'Mode record'} <b>{best}</b></span>
        </footer>
      </div>
    </dialog>
  );
}
