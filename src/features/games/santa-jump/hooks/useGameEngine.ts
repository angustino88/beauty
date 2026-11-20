import { useCallback, useEffect, useState } from 'react';
import { arcadeSlots, chapters } from '../constants';
import { createRun, jump as performJump, step } from '../simulation';
import type { Mode, Run } from '../types';

const SAVE_KEY = 'labmango:santa-post:v1';
const ARCADE_KEY = 'labmango:santa-arcade:v1';
function readRecord(key = SAVE_KEY, length: number = chapters.length): number[] {
  let saved: unknown;
  try { saved = JSON.parse(localStorage.getItem(key) ?? 'null'); } catch { /* Storage is optional. */ }
  return Array.from({ length }, (_, i) => Array.isArray(saved) && Number.isSafeInteger(saved[i]) && saved[i] > 0 ? saved[i] : 0);
}

export function useGameEngine() {
  const [{ state, record, arcade }, setSession] = useState(() => {
    const record = readRecord();
    const firstIncomplete = record.indexOf(0);
    return { state: createRun(firstIncomplete < 0 ? chapters.length - 1 : firstIncomplete), record, arcade: readRecord(ARCADE_KEY, Object.keys(arcadeSlots).length) };
  });
  const firstIncomplete = record.indexOf(0);
  const unlocked = firstIncomplete < 0 ? chapters.length - 1 : firstIncomplete;
  const setState = useCallback((update: (s: Run) => Run) => {
    setSession(session => {
      const state = update(session.state);
      if (state === session.state) return session;
      const record = state.phase === 'delivered' && state.mode === 'campaign'
        ? session.record.map((n, i) => i === state.chapter ? Math.max(n, state.score) : n)
        : session.record;
      const finished = state.phase === 'lost' || state.phase === 'delivered';
      const slot = state.mode === 'campaign' ? -1 : arcadeSlots[state.mode];
      const arcade = finished && state.mode !== 'campaign'
        ? session.arcade.map((n, i) => i === slot ? Math.max(n, state.score) : n)
        : session.arcade;
      return { state, record, arcade };
    });
  }, []);
  const jump = useCallback(() => setState(performJump), [setState]);
  const pause = useCallback(() => setState(s => s.phase === 'playing' ? { ...s, phase: 'paused' } : s), [setState]);
  const play = () => setState(s => s.phase === 'paused' ? { ...s, phase: 'playing' } : { ...createRun(s.chapter, unlocked, s.mode), phase: 'playing' });
  const selectMode = (mode: Mode) => setState(s => createRun(s.chapter, unlocked, mode));
  const select = (chapter: number) => {
    if (chapter >= 0 && chapter <= unlocked) setState(s => createRun(chapter, unlocked, s.mode));
  };

  useEffect(() => {
    if (state.phase !== 'playing') return;
    let frame: number;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.04));
      last = now;
      setState(s => step(s, dt));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [state.phase, setState]);

  useEffect(() => {
    if (!record.some(Boolean)) return;
    const saved = readRecord();
    const scores = record.map((n, i) => Math.max(n, saved[i]));
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(scores)); } catch { /* Keep session progress. */ }
  }, [record]);

  useEffect(() => {
    const hidden = () => { if (document.hidden) pause(); };
    window.addEventListener('blur', pause);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('blur', pause);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [pause]);
  useEffect(() => {
    if (!arcade.some(Boolean)) return;
    const saved = readRecord(ARCADE_KEY, Object.keys(arcadeSlots).length);
    try { localStorage.setItem(ARCADE_KEY, JSON.stringify(arcade.map((n, i) => Math.max(n, saved[i])))); } catch { /* Session-only storage. */ }
  }, [arcade]);
  return { state, record, arcade, unlocked, jump, pause, play, select, selectMode };
}
