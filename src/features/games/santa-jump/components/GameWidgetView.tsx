import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { ArrowRight, Check, ChevronRight, Clock3, Flag, Flame, LockKeyhole, Mail, MapPinned, Pause, Play, RotateCcw, Trophy, X } from 'lucide-react';
import { chapters, FLOOR, HAZARD_SIZE, ITEM_SIZE, SANTA_SIZE, SANTA_X, WORLD_HEIGHT, WORLD_WIDTH } from '../constants';
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
import type { Foe, Item, Supply } from '../types';
import { chapterAct, chapterPace, chapterRule, isThreat } from '../simulation';
import railway from '../art/ribbon-railway.webp';
import bells from '../art/bell-tower.webp';
import caverns from '../art/violet-caverns.webp';
import summit from '../art/solstice-peak.webp';
import ram from '../art/clockwork-ram.webp';
import bat from '../art/crystal-bat.webp';
import mole from '../art/lantern-mole.webp';
import css from './GameWidget.module.css';

const scenes = [workshop, forest, village, tower, glassworks, harbor, railway, bells, caverns, summit];
const grounds = [workshopFloor, forestFloor, roof, marble, marble, workshopFloor, workshopFloor, marble, forestFloor, marble];
const hazards = [present, stump, chimney, ice, ice, present, present, chimney, ice, ice];
const items = { letter, star, shield, goblin, magnet, hourglass, prism, owl, hare, ram, bat, mole, blast: ice, counterStar: star };

const supplyGuide: Record<Supply, [string, string, string]> = {
  star: [star, 'Gold star', 'Worth 5 points.'],
  shield: [shield, 'Ice shield', 'Absorbs the next hit (disabled during Act III Climax).'],
  magnet: [magnet, 'Holly magnet', 'Draws nearby letters and stars to Santa for 8s.'],
  hourglass: [hourglass, 'Frost hourglass', 'Slows the world and countdown clock for 5s.'],
  prism: [prism, 'Prism brooch', 'Doubles letter and star points for 8s.'],
};

const creatureGuide: Record<Foe, [string, string, string]> = {
  hare: [hare, 'Horned hare', 'Bounds along the track. Clear it at the top of your jump.'],
  owl: [owl, 'Snow owl', 'Flies overhead. Stay low to pass underneath.'],
  goblin: [goblin, 'Pine goblin', 'Charges faster than the scenery. Jump early.'],
  ram: [ram, 'Clockwork ram', 'Accelerates halfway across the track.'],
  mole: [mole, 'Lantern mole', 'Look for its lamp before it surfaces.'],
  bat: [bat, 'Crystal bat', 'Flies in a wave. Run underneath.'],
};

const actLabels = ['Act I · 0–35%', 'Act II · 35–70%', 'Climax · 70–100%'] as const;
const actNotes = ['Vanguard wave', 'Twin hurdles & surge', 'Overdrive · No shields'] as const;

const foeNames: Partial<Record<Item, string>> = {
  ram: 'Clockwork ram', mole: 'Lantern mole', bat: 'Crystal bat', goblin: 'Pine goblin', owl: 'Snow owl', hare: 'Horned hare',
};
const duration = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.round(seconds) % 60).padStart(2, '0')}`;
const baseDuration = chapters.reduce((total, c) => total + c.routeLength / c.speed, 0);
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
  const act = chapterAct(state);
  const activeRule = chapterRule(state);
  const pace = chapterPace(state);
  const inClimax = act === 2 || state.bossHP !== null;
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

  const best = record[chapter];
  const uniqueSupplies = Array.from(new Set(level.supplies));
  const stageSupplies: [string, string, string][] = [
    [letter, 'Wish letter', `10 points · Collect ${level.letters} to complete this stop.`],
    ...uniqueSupplies.map(kind => supplyGuide[kind]),
  ];
  const stageThreats: [string, string, string][] = [
    [hazards[chapter], level.hazard, 'Static track obstacle. Pairs into twin hurdles from Act II.'],
    ...level.foes.map((kind, idx) => {
      const [icon, name, hint] = creatureGuide[kind];
      const tag = idx === 0 ? 'Act I' : idx === 1 ? 'Act II' : 'Climax';
      return [icon, `${name} (${tag})`, hint] as [string, string, string];
    }),
    ...(level.boss ? [[
      king,
      level.boss === 'summit-king' ? 'Summit Frost King (Climax)' : 'Frost King (Climax)',
      level.boss === 'summit-king'
        ? 'Fires paired ice blasts. Catch three high stars between volleys.'
        : 'Guards the summit. Dodge ice blasts and catch three high stars.',
    ] as [string, string, string]] : []),
  ];

  let title: string = level.name;
  let message: string = level.story;
  let action = 'Set off';
  if (phase === 'paused') {
    title = 'Paused';
    message = 'Resume when you’re ready, or pick another unlocked stop below.';
    action = 'Resume';
  } else if (complete) {
    title = finale ? 'Every wish delivered' : 'Mail delivered';
    message = level.ending;
    action = finale ? 'Back to the mailroom' : 'Next stop';
  } else if (phase === 'lost') {
    const timedOut = level.timeLimit > 0 && state.elapsed >= level.timeLimit;
    title = timedOut ? 'Deadline missed' : 'Delivery interrupted';
    message = timedOut
      ? `The ${level.timeLimit}s clock ran out on ${level.short}. Try this stop again.`
      : `Santa was stopped during ${activeRule}. Try this stop again.`;
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
        <div className={css.main}>
          <section className={css.board} data-active={playing || undefined} data-climax={playing && inClimax || undefined} aria-label={level.name}>
            <div aria-hidden="true" className={css.scenery}
              style={{ backgroundImage: `url("${scenes[chapter]}")` }} />
            <div className={css.hud}>
              <span><Flag size={13} /> Stop {chapterNumber(chapter)}</span>
              <span data-climax={inClimax || undefined}>
                {inClimax ? <Flame size={13} /> : null}
                {state.bossHP !== null ? 'Boss' : `Act ${['I', 'II', 'III'][act]}`}: {activeRule}
              </span>
              <span aria-label={`Route distance: ${routePercent}%`}>Route {routePercent}%</span>
              {level.timeLimit > 0 && <span><img src={watch} alt="Time remaining" />{Math.max(0, Math.ceil(level.timeLimit - state.elapsed))}s</span>}
              {pace > 1.01 && <span aria-label="Current speed">{Math.round(pace * 100)}% pace</span>}
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
              {state.bossHP !== null && <img className={css.sprite} data-foe="king" src={king} alt="Frost King" style={spriteStyle(618, 0, 136)} />}
              {state.entities.map(e => <img key={e.id}
                className={css.sprite} data-foe={e.kind === 'goblin' || e.kind === 'ram' ? 'goblin' : undefined} alt={e.kind === 'hazard' ? level.hazard : foeNames[e.kind] ?? ''}
                src={e.kind === 'hazard' ? hazards[chapter] : items[e.kind]}
                style={spriteStyle(e.x, e.bottom, isThreat(e.kind) ? HAZARD_SIZE : ITEM_SIZE)} />)}
            </>}
            {playing ? <button ref={field} className={css.field} onClick={jump} aria-label="Jump" /> :
              <div className={css.sceneOverlay}>
                <div className={css.sceneText} role="status">
                  <div className={css.sceneLabel}><Clock3 size={13}/> {level.time} <i/> {finale ? 'Route complete' : level.recipient} <i/> {level.rule}</div>
                  <h2>{title}</h2><p>{message}</p>
                </div>
                <button ref={actionButton} className={css.startButton} onClick={() => complete ? select(finale ? 0 : chapter + 1) : play()}>
                  {phase === 'lost' ? <RotateCcw size={15}/> : <Play size={14} fill="currentColor"/>}{action}<ArrowRight size={15}/>
                </button>
              </div>}
          </section>
          <aside className={css.dispatch}>
            <div className={css.eyebrow}><Mail size={14} /> Stop {chapterNumber(chapter)} · Tier {chapter + 1}/{chapters.length}</div>
            <h2>{activeRule}</h2>
            <p className={css.ruleHint} role={state.bossHP !== null ? 'status' : undefined}>
              {state.bossHP !== null
                ? `Frost seals: ${state.bossHP}/3. Jump over ice blasts and catch the high stars to break his crown.`
                : level.ruleHint}
            </p>
            <div className={css.delivery}><span>Wish letters</span><strong>{letters} / {level.letters}</strong></div>
            <progress value={letters} max={level.letters} aria-label="Letters collected" />
            <div className={css.actList} aria-label="Stage acts">
              {level.phases.map((phaseName, idx) => {
                const foe = creatureGuide[level.foes[idx]];
                return (
                  <div key={phaseName} className={css.actItem} data-active={act === idx || undefined} data-climax={idx === 2 || undefined}>
                    <img src={foe[0]} alt="" />
                    <div>
                      <small>{actLabels[idx]} · {actNotes[idx]}</small>
                      <b>{phaseName} (+{foe[1]})</b>
                    </div>
                  </div>
                );
              })}
            </div>
            {[{ label: `Stage threats (${stageThreats.length})`, entries: stageThreats, open: false }, { label: `Stage supplies (${stageSupplies.length})`, entries: stageSupplies, open: false }].map(({ label, entries, open }) => (
              <details key={label} className={css.guide} open={open}>
                <summary>{label}</summary>
                <div className={css.gear}>{entries.map(([icon, name, hint]) =>
                  <div key={name}><img src={icon} alt=""/><span><b>{name}</b><small>{hint}</small></span></div>)}</div>
              </details>
            ))}
          </aside>
        </div>
        <div className={css.routeTitle}><h2><MapPinned size={17}/> Delivery route</h2><span>{record.filter(Boolean).length} / {chapters.length} stops complete · Base route {duration(baseDuration)}</span></div>
        <nav className={css.route} aria-label="Choose a delivery stop">
          {chapters.map((c, i) => <button key={c.short} className={css.routeCard} aria-current={chapter === i ? 'step' : undefined}
            disabled={!routeOpen || i > unlocked} onClick={() => select(i)} aria-label={`${c.short}${i > unlocked ? ', locked' : ''}`}>
            <img src={scenes[i]} alt="" /><div><small>Stop {chapterNumber(i)} · {c.rule}</small><strong>{c.short}</strong></div>
            {i > unlocked ? <LockKeyhole size={13}/> : record[i] ? <Check size={15}/> : <ChevronRight size={15}/>}
          </button>)}
        </nav>
        <footer className={css.footer}>
          <span><kbd>Space</kbd> or tap to jump{state.jumpLimit > 1 ? ` · ${state.jumpLimit === 2 ? "Double jump" : "Triple jump"} ready` : ''}</span>
          <span><Trophy size={13}/> Stop record <b>{best}</b></span>
        </footer>
      </div>
    </dialog>
  );
}
