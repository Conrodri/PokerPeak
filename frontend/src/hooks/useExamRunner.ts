import { useEffect, useRef } from 'react';
import { useExamStore, SprintMistake } from '../store/examStore';
import { useModeStore } from '../store/modeStore';

/**
 * Shared exam wiring for a trainer. Encapsulates the examStore selectors, the
 * record-load on mount, and the auto-advance timer so each trainer only needs:
 *
 *   const { examActive, examFinished, startRun, quitRun, recordAnswer } = useExamRunner('potodds');
 *   // on answer:  if (examActive) recordAnswer(isCorrect, handleNext);
 *   // launcher:   onStart={() => { startRun(); ...enter exercise phase + fetch... }}
 *   // quit:       quitRun(); ...back to intro...
 */
// Base sprint countdown. In expert mode it shrinks by SPRINT_STEP_SECONDS
// every SPRINT_STEP_CORRECT correct answers within the run, down to a floor
// of SPRINT_MIN_SECONDS — the run gets harder the better you're doing.
const SPRINT_BASE_SECONDS = 30;
const SPRINT_MIN_SECONDS = 10;
const SPRINT_STEP_SECONDS = 5;
const SPRINT_STEP_CORRECT = 5;

export function useExamRunner(module: string) {
  const active = useExamStore(s => s.active);
  const finished = useExamStore(s => s.finished);
  const start = useExamStore(s => s.start);
  const answer = useExamStore(s => s.answer);
  const quit = useExamStore(s => s.quit);
  const loadRecords = useExamStore(s => s.loadRecords);
  const runMode = useExamStore(s => s.mode);
  const correct = useExamStore(s => s.correct);
  const currentMode = useModeStore(s => s.mode);
  const timer = useRef<number | null>(null);

  const sprintSeconds = runMode === 'expert'
    ? Math.max(SPRINT_MIN_SECONDS, SPRINT_BASE_SECONDS - SPRINT_STEP_SECONDS * Math.floor(correct / SPRINT_STEP_CORRECT))
    : SPRINT_BASE_SECONDS;

  useEffect(() => { loadRecords(); }, [loadRecords]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const clearTimer = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };

  /** Record one exam answer; auto-advance via `next` unless the run just ended. Returns true if ended. */
  const recordAnswer = (isCorrect: boolean, next: () => void, delay = 1400, mistake?: SprintMistake): boolean => {
    const ended = answer(isCorrect, mistake);
    if (!ended) timer.current = window.setTimeout(next, delay);
    return ended;
  };

  const startRun = () => { clearTimer(); start(module, currentMode); };
  const quitRun = () => { clearTimer(); quit(); };

  return { examActive: active, examFinished: finished, startRun, quitRun, recordAnswer, sprintSeconds };
}
