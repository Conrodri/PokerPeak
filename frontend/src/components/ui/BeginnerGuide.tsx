import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { useModeStore } from '../../store/modeStore';
import { useExamStore } from '../../store/examStore';
import { useLangStore } from '../../store/langStore';
import { RichText } from './RichText';

interface BeginnerGuideProps {
  title: string;
  text: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  /** Bypass the hints guard when called explicitly (legacy compat). */
  forceShow?: boolean;
  className?: string;
}

/**
 * Collapsible guide panel shown when hints are enabled (easy mode).
 * Hidden in hard mode and during sprints.
 */
export function BeginnerGuide({
  title,
  text,
  children,
  defaultOpen = false,
  forceShow = false,
  className,
}: BeginnerGuideProps) {
  const hints = useModeStore(s => s.hints);
  const examActive = useExamStore(s => s.active);
  const isEn = useLangStore(s => s.lang) === 'en';
  const [open, setOpen] = useState(defaultOpen);

  if (examActive) return null;
  if (hints !== 'easy' && !forceShow) return null;

  return (
    <div
      className={`w-full rounded-2xl border border-blue-700/40 bg-gradient-to-br from-blue-950/50 to-indigo-950/30 overflow-hidden ${className ?? ''}`}
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-blue-900/20 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-blue-200">
          <Lightbulb size={16} className="text-blue-400 shrink-0" />
          {title}
        </span>
        <span className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-500/70 hidden sm:block">
            {isEn ? 'Guide' : 'Guide'}
          </span>
          {open
            ? <ChevronUp   size={16} className="text-blue-400" />
            : <ChevronDown size={16} className="text-blue-400" />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="guide-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3.5 pt-0.5">
              <RichText text={text} className="!text-blue-100/90 leading-relaxed" />
              {children && <div className="mt-3">{children}</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
