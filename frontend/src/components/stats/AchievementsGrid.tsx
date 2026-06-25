import { motion } from 'framer-motion';
import { useLangStore } from '../../store/langStore';
import { Achievement, AchievementCategory, AchievementTier } from '../../types/poker';

// ─── Tier styles ──────────────────────────────────────────────────────────────

const TIER_STYLES: Record<AchievementTier, { ring: string; bg: string; text: string; label: string }> = {
  bronze:   { ring: 'border-amber-700/60',  bg: 'bg-amber-900/20',  text: 'text-amber-500',  label: 'Bronze'  },
  silver:   { ring: 'border-gray-500/60',   bg: 'bg-gray-700/20',   text: 'text-gray-300',   label: 'Argent'  },
  gold:     { ring: 'border-yellow-600/60', bg: 'bg-yellow-900/20', text: 'text-yellow-400', label: 'Or'      },
  platinum: { ring: 'border-purple-600/60', bg: 'bg-purple-900/20', text: 'text-purple-400', label: 'Platine' },
};

const CAT_LABELS: Record<AchievementCategory, { fr: string; en: string }> = {
  exercises:       { fr: 'Exercices',              en: 'Exercises'          },
  accuracy:        { fr: 'Précision globale',      en: 'Global accuracy'    },
  days:            { fr: 'Jours joués',            en: 'Days played'        },
  sprint_advanced: { fr: 'Sprint avancé ⚡',       en: 'Advanced sprint ⚡' },
  sprint_expert:   { fr: 'Sprint expert 🔥',       en: 'Expert sprint 🔥'  },
  daily_ex:        { fr: 'Exercices en 1 journée', en: 'Exercises in a day' },
  daily_correct:   { fr: 'Réussis en 1 journée',  en: 'Correct in a day'   },
  daily_acc:       { fr: 'Précision du jour',      en: 'Daily accuracy'     },
};

const CATEGORIES: AchievementCategory[] = [
  'exercises', 'accuracy', 'days',
  'sprint_advanced', 'sprint_expert',
  'daily_ex', 'daily_correct', 'daily_acc',
];

// ─── Single card ──────────────────────────────────────────────────────────────

function AchievCard({ a, isEn }: { a: Achievement; isEn: boolean }) {
  const s = TIER_STYLES[a.tier];
  const pct = Math.round((a.progress / a.maxProgress) * 100);

  return (
    <div className={`relative flex flex-col gap-1.5 rounded-xl border p-3 transition-all ${
      a.unlocked ? `${s.ring} ${s.bg}` : 'border-gray-800 bg-gray-900/30 opacity-50'
    }`}>
      {/* Icon + title */}
      <div className="flex items-center gap-2">
        <span className={`text-xl leading-none ${a.unlocked ? '' : 'grayscale'}`}>{a.icon}</span>
        <div className="flex flex-col min-w-0">
          <span className={`text-xs font-bold leading-tight truncate ${a.unlocked ? s.text : 'text-gray-500'}`}>
            {isEn ? a.title_en : a.title_fr}
          </span>
          <span className={`text-[10px] leading-tight ${a.unlocked ? 'text-gray-400' : 'text-gray-600'}`}>
            {isEn ? a.desc_en : a.desc_fr}
          </span>
        </div>
      </div>

      {/* Progress bar (only when locked) */}
      {!a.unlocked && (
        <div className="w-full h-1 rounded-full bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gray-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Tier badge */}
      {a.unlocked && (
        <span className={`self-start text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${s.ring} ${s.text}`}>
          {s.label}
        </span>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AchievementsGrid({ achievements }: { achievements: Achievement[] }) {
  const isEn = useLangStore(s => s.lang) === 'en';

  const byCategory = (cat: AchievementCategory) =>
    achievements.filter(a => a.category === cat);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white">
          {isEn ? '🏅 Achievements' : '🏅 Succès'}
        </h2>
        <span className="text-xs text-gray-400">
          {unlockedCount}/{achievements.length} {isEn ? 'unlocked' : 'débloqués'}
        </span>
      </div>

      {/* Categories */}
      {CATEGORIES.map(cat => {
        const items = byCategory(cat);
        const catLabel = isEn ? CAT_LABELS[cat].en : CAT_LABELS[cat].fr;
        return (
          <div key={cat} className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{catLabel}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {items.map(a => (
                <AchievCard key={a.id} a={a} isEn={isEn} />
              ))}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}
