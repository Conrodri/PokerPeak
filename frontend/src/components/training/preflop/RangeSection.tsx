import { useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Sliders, Target } from 'lucide-react';
import { RangeMatrix } from '../../poker/RangeMatrix';
import { ExpertRangeGrid } from '../../poker/ExpertRangeEditor';
import { frequencyBg, bbCellColor } from '../../../utils/pokerUtils';
import { useT } from '../../../i18n';

interface RangeSectionProps {
  matrix: number[][] | null;
  /** When set, the range is an expert profile: render the stacked-bar mix grid. */
  mix?: number[] | null;
  highlightNotation: string;
  position: string;
  isCustom: boolean;
  resolvedLabel: string | null;
  heroStack: number;
  isEn: boolean;
  showRange: boolean;
  setShowRange: (fn: (v: boolean) => boolean) => void;
  t: ReturnType<typeof useT>;
}

// ─── Shared range matrix collapsible section ──────────────────────────────────

export function RangeSection({ matrix, mix, highlightNotation, position, isCustom, resolvedLabel, heroStack, isEn, showRange, setShowRange, t }: RangeSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  // BB-defense legend + tooltip, stabilized (t is a stable per-language object)
  // so the memoized RangeMatrix isn't re-rendered on every parent update.
  const bbLegend = useMemo(() => [
    { color: 'rgba(22,130,60,0.85)', label: t.training.bb_leg_value, tip: { title: t.training.bb_leg_value, text: t.training.bb_tip_value } },
    { color: 'rgba(202,138,4,0.82)', label: t.training.bb_leg_bluff, tip: { title: t.training.bb_leg_bluff, text: t.training.bb_tip_bluff } },
    { color: 'rgba(37,99,235,0.70)', label: t.training.bb_leg_call,  tip: { title: t.training.bb_leg_call,  text: t.training.bb_tip_call  } },
    { color: '#1a202c',              label: t.training.bb_leg_fold,  tip: { title: t.training.bb_leg_fold,  text: t.training.bb_tip_fold  } },
  ], [t]);
  const bbTooltipValue = useCallback((code: number) => ({
    0: t.training.bb_leg_fold, 1: t.training.bb_leg_call,
    2: t.training.bb_leg_call, 3: t.training.bb_leg_value, 4: t.training.bb_leg_bluff,
  } as Record<number, string>)[code] ?? '', [t]);

  if (!matrix && !mix) return null;
  return (
    <motion.div
      ref={sectionRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="w-full"
    >
      <button
        onClick={() => {
          setShowRange(v => {
            if (!v) {
              // Opening: scroll to top of page so the range grid is visible
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            return !v;
          });
        }}
        className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl border transition-colors mb-1
          border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-sm font-semibold"
      >
        <span className="flex items-center gap-1.5 flex-wrap">
          {isCustom ? (
            <>
              <Sliders size={14} className="text-purple-400 shrink-0" />
              <span className="text-purple-300">
                {resolvedLabel ?? (isEn ? 'My range' : 'Ma range')}
              </span>
              <span className="text-purple-500">— {position}</span>
              {/* Stack only matters for stack-tiered profiles (resolvedLabel set). */}
              {resolvedLabel && <span className="text-purple-600 font-normal text-xs">· {heroStack} bb</span>}
            </>
          ) : (
            <>
              <Target size={14} className="text-felt-400 shrink-0" />
              <span className="text-felt-300">
                {position === 'BB'
                  ? (isEn ? 'GTO BB defense range' : 'Range GTO défense BB')
                  : `${t.training.full_range_lbl} — ${position}`}
              </span>
            </>
          )}
        </span>
        {showRange
          ? <ChevronUp   size={16} className="text-gray-400 shrink-0" />
          : <ChevronDown size={16} className="text-gray-400 shrink-0" />
        }
      </button>
      <AnimatePresence initial={false}>
        {showRange && (
          <motion.div
            key="range-matrix"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden flex flex-col items-center gap-3 pt-2"
          >
            {mix ? (
              // Expert profile: render the exact stacked-bar scheme of the editor.
              <ExpertRangeGrid mix={mix} highlightNotation={highlightNotation} isEn={isEn} />
            ) : !matrix ? null
            : position === 'BB' && !isCustom ? (
              // GTO BB-defense grid uses action CODES (0-4), not raise frequencies,
              // so it needs the BB-specific colouring/legend (call ≠ raise).
              <RangeMatrix
                matrix={matrix}
                highlightNotation={highlightNotation}
                size="sm"
                cellColor={bbCellColor}
                legend={bbLegend}
                tooltipValue={bbTooltipValue}
              />
            ) : (
              <RangeMatrix
                matrix={matrix}
                highlightNotation={highlightNotation}
                size="sm"
                cellColor={frequencyBg}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
