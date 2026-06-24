import { GraduationCap, Zap, Flame } from 'lucide-react';
import { useModeStore } from '../../store/modeStore';
import { useLangStore } from '../../store/langStore';

/**
 * ModeBadge
 * ─────────
 * Small read-only pill that reminds the user which training mode is active
 * (Beginner / Advanced / Expert). Shown at the top of every exercise module —
 * the mode can't be changed mid-exercise, so this is purely informational.
 * Colours mirror the ModeToggle (blue / gold / purple).
 */

const CONFIG = {
  beginner: {
    label: { fr: 'Débutant', en: 'Beginner' },
    Icon: GraduationCap,
    cls: 'bg-blue-600/15 text-blue-300 border-blue-600/40',
  },
  advanced: {
    label: { fr: 'Avancé', en: 'Advanced' },
    Icon: Zap,
    cls: 'bg-gold-600/15 text-gold-300 border-gold-600/40',
  },
  expert: {
    label: { fr: 'Expert', en: 'Expert' },
    Icon: Flame,
    cls: 'bg-purple-600/15 text-purple-300 border-purple-600/40',
  },
} as const;

export function ModeBadge({ className = '' }: { className?: string }) {
  const mode = useModeStore(s => s.mode);
  const isEn = useLangStore(s => s.lang) === 'en';
  const cfg  = CONFIG[mode];
  const { Icon } = cfg;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wide ${cfg.cls} ${className}`}>
      <Icon size={11} className="shrink-0" />
      <span>{isEn ? 'Mode' : 'Mode'} : {isEn ? cfg.label.en : cfg.label.fr}</span>
    </div>
  );
}
