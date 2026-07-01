import { useEffect } from 'react';
import { useModeStore } from '../../store/modeStore';
import { useExamStore } from '../../store/examStore';

interface SpoilableHintProps {
  children: React.ReactNode;
  /** Changing this resets nothing (kept for API compatibility). */
  resetKey?: string | number;
  className?: string;
}

/**
 * Hint visibility gate:
 *  - easy mode: shows the hint outright.
 *  - hard mode: renders nothing.
 *  - during an exam (any mode): renders nothing — exam = test, no help.
 */
export function SpoilableHint({ children, className }: SpoilableHintProps) {
  const hints = useModeStore(s => s.hints);
  const examActive = useExamStore(s => s.active);

  if (examActive) return null;
  if (hints === 'hard') return null;
  return <div className={className}>{children}</div>;
}
