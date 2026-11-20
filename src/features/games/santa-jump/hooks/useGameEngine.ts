import { useCallback, useEffect, useState } from 'react';
import { chapters } from '../constants';
import { createRun, jump as performJump, step } from '../simulation';
import type { Run } from '../types';

const SAVE_KEY = 'labmango:santa-post:v1';
function readRecord(): number[] {
  let saved: unknown;
  try { saved = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null'); } catch { /* Storage is optional. */ }
  return chapters.map((_, i) => Array.isArray(saved) && Number.isSafeInteger(saved[i]) && saved[i] > 0 ? saved[i] : 0);
}

export function useGameEngine() {
  const [{ state, record }, setSession] = useState(() => {
    const record = readRecord();
    const firstIncomplete = record.indexOf(0);
    return { state: createRun(firstIncomplete < 0 ? chapters.length - 1 : firstIncomplete), record };
  });
  const firstIncomplete = record.indexOf(0);
  const unlocked = firstIncomplete < 0 ? chapters.length - 1 : firstIncomplete;
  const setState = useCallback((update: (s: Run) => Run) => {
    setSession(session => {
      const state = update(session.state);
      if (state === session.state) return session;
      const record = state.phase === 'delivered'
        ? session.record.map((n, i) => i === state.chapter ? Math.max(n, state.score) : n)
        : session.record;
      return { state, record };
    });
  }, []);
  const jump = useCallback(() => setState(performJump), [setState]);
  const pause = useCallback(() => setState(s => s.phase === 'playing' ? { ...s, phase: 'paused' } : s), [setState]);
  const play = () => setState(s => s.phase === 'paused' ? { ...s, phase: 'playing' } : { ...createRun(s.chapter, unlocked), phase: 'playing' });
  const select = (chapter: number) => {
    if (chapter >= 0 && chapter <= unlocked) setState(() => createRun(chapter, unlocked));
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
  return { state, record, unlocked, jump, pause, play, select };
}
