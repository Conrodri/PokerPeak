import { useLangStore } from '../../../store/langStore';
import { Position8, TableFormat } from '../../../types/poker';

// ─── Position info badge ───────────────────────────────────────────────────────
export function PositionInfo({ position, format = '6max' }: { position: Position8; format?: TableFormat }) {
  const isEn = useLangStore(s => s.lang) === 'en';
  const def = isEn ? 'Defend' : 'Défend';
  const ranges: Record<string, Partial<Record<Position8, string>>> = {
    '6max': { UTG: '~12%', HJ: '~20%', CO: '~26%', BTN: '~45%', SB: '~35%', BB: def },
    '8max': { UTG: '~11%', UTG1: '~13%', LJ: '~16%', HJ: '~18%', CO: '~26%', BTN: '~45%', SB: '~35%', BB: def },
    '3max': { BTN: '~75%', SB: '~58%', BB: def },
    'hu':   { BTN: '~83%', BB: def },
  };
  const label = ranges[format]?.[position] ?? '';
  return (
    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
      {label}
    </span>
  );
}
