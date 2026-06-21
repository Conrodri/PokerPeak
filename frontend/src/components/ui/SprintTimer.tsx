import { useEffect, useRef, useState } from 'react';
import { Timer } from 'lucide-react';

/**
 * Per-question countdown for Expert sprints. When `active`, runs a `seconds`
 * countdown that restarts whenever `resetKey` changes (i.e. a new question), and
 * fires `onTimeout` once if it reaches zero. Renders a compact bar + seconds;
 * renders nothing (and runs no timer) when inactive.
 */
export function SprintTimer({
  active, resetKey, onTimeout, seconds = 5,
}: {
  active: boolean;
  resetKey: string | number;
  onTimeout: () => void;
  seconds?: number;
}) {
  const [left, setLeft] = useState(seconds);
  const fired = useRef(false);
  const cb = useRef(onTimeout);
  cb.current = onTimeout;

  useEffect(() => {
    if (!active) return;
    fired.current = false;
    setLeft(seconds);
    const start = Date.now();
    const id = window.setInterval(() => {
      const remaining = seconds - (Date.now() - start) / 1000;
      if (remaining <= 0) {
        window.clearInterval(id);
        setLeft(0);
        if (!fired.current) { fired.current = true; cb.current(); }
      } else {
        setLeft(remaining);
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [active, resetKey, seconds]);

  if (!active) return null;

  const pct = Math.max(0, Math.min(100, (left / seconds) * 100));
  const urgent = left <= 2;
  const color = urgent ? '#ef4444' : '#f59e0b';

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-center gap-1.5 text-xs font-bold" style={{ color }}>
        <Timer size={12} /> {Math.ceil(left)}s
      </div>
      <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color, transition: 'width 100ms linear' }}
        />
      </div>
    </div>
  );
}
