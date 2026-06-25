// ─── Achievement definitions ──────────────────────────────────────────────────

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type AchievementCategory = 'exercises' | 'accuracy' | 'days' | 'sprint' | 'daily_ex' | 'daily_acc';

export interface AchievementDef {
  id: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon: string;
  threshold: number;
  title_fr: string;
  title_en: string;
  desc_fr: string;
  desc_en: string;
}

export interface AchievementResult extends AchievementDef {
  unlocked: boolean;
  progress: number;   // current value (for progress bar)
  maxProgress: number; // threshold (for progress bar)
}

// Priority weight for "best title" — higher = preferred as display title
const TIER_WEIGHT: Record<AchievementTier, number> = {
  platinum: 40, gold: 30, silver: 20, bronze: 10,
};
const CAT_WEIGHT: Record<AchievementCategory, number> = {
  accuracy: 5, sprint: 4, daily_acc: 3, daily_ex: 2, days: 1, exercises: 0,
};

export const ACHIEVEMENTS: AchievementDef[] = [
  // ── Exercices totaux ──────────────────────────────────────────────────────
  {
    id: 'ex_50',   category: 'exercises', tier: 'bronze',   icon: '📚', threshold: 50,
    title_fr: 'Apprenti',   title_en: 'Apprentice',
    desc_fr:  '50 exercices complétés',      desc_en: '50 exercises completed',
  },
  {
    id: 'ex_250',  category: 'exercises', tier: 'silver',   icon: '📖', threshold: 250,
    title_fr: 'Studieux',   title_en: 'Diligent',
    desc_fr:  '250 exercices complétés',     desc_en: '250 exercises completed',
  },
  {
    id: 'ex_1000', category: 'exercises', tier: 'gold',     icon: '💪', threshold: 1000,
    title_fr: 'Acharné',    title_en: 'Grinder',
    desc_fr:  '1 000 exercices complétés',   desc_en: '1,000 exercises completed',
  },
  {
    id: 'ex_5000', category: 'exercises', tier: 'platinum', icon: '🏋️', threshold: 5000,
    title_fr: 'Légende',    title_en: 'Legend',
    desc_fr:  '5 000 exercices complétés',   desc_en: '5,000 exercises completed',
  },

  // ── Précision globale (min 50 ex) ─────────────────────────────────────────
  {
    id: 'acc_60',  category: 'accuracy', tier: 'bronze',   icon: '🎯', threshold: 60,
    title_fr: 'Décent',    title_en: 'Decent',
    desc_fr:  '60 % de précision (50 ex. min)', desc_en: '60% accuracy (50+ exercises)',
  },
  {
    id: 'acc_70',  category: 'accuracy', tier: 'silver',   icon: '🎯', threshold: 70,
    title_fr: 'Précis',    title_en: 'Precise',
    desc_fr:  '70 % de précision (50 ex. min)', desc_en: '70% accuracy (50+ exercises)',
  },
  {
    id: 'acc_80',  category: 'accuracy', tier: 'gold',     icon: '🎯', threshold: 80,
    title_fr: 'Sniper',    title_en: 'Sniper',
    desc_fr:  '80 % de précision (50 ex. min)', desc_en: '80% accuracy (50+ exercises)',
  },
  {
    id: 'acc_90',  category: 'accuracy', tier: 'platinum', icon: '🎯', threshold: 90,
    title_fr: 'Perfecto',  title_en: 'Perfecto',
    desc_fr:  '90 % de précision (50 ex. min)', desc_en: '90% accuracy (50+ exercises)',
  },

  // ── Jours joués ──────────────────────────────────────────────────────────
  {
    id: 'days_7',   category: 'days', tier: 'bronze',   icon: '📅', threshold: 7,
    title_fr: 'Régulier',  title_en: 'Regular',
    desc_fr:  '7 jours joués',              desc_en: '7 days played',
  },
  {
    id: 'days_30',  category: 'days', tier: 'silver',   icon: '📅', threshold: 30,
    title_fr: 'Constant',  title_en: 'Consistent',
    desc_fr:  '30 jours joués',             desc_en: '30 days played',
  },
  {
    id: 'days_100', category: 'days', tier: 'gold',     icon: '📅', threshold: 100,
    title_fr: 'Dévoué',    title_en: 'Devoted',
    desc_fr:  '100 jours joués',            desc_en: '100 days played',
  },
  {
    id: 'days_365', category: 'days', tier: 'platinum', icon: '📅', threshold: 365,
    title_fr: 'Obsédé',    title_en: 'Obsessed',
    desc_fr:  '365 jours joués',            desc_en: '365 days played',
  },

  // ── Sprint max ────────────────────────────────────────────────────────────
  {
    id: 'spr_5',   category: 'sprint', tier: 'bronze',   icon: '⚡', threshold: 5,
    title_fr: 'Lancé',        title_en: 'Fired Up',
    desc_fr:  '5 bonnes réponses en sprint', desc_en: '5 correct answers in a sprint',
  },
  {
    id: 'spr_10',  category: 'sprint', tier: 'silver',   icon: '⚡', threshold: 10,
    title_fr: 'En série',     title_en: 'On a Roll',
    desc_fr:  '10 bonnes réponses en sprint', desc_en: '10 correct answers in a sprint',
  },
  {
    id: 'spr_20',  category: 'sprint', tier: 'gold',     icon: '⚡', threshold: 20,
    title_fr: 'Inarrêtable',  title_en: 'Unstoppable',
    desc_fr:  '20 bonnes réponses en sprint', desc_en: '20 correct answers in a sprint',
  },
  {
    id: 'spr_35',  category: 'sprint', tier: 'platinum', icon: '⚡', threshold: 35,
    title_fr: 'Imbattable',   title_en: 'Unbeatable',
    desc_fr:  '35 bonnes réponses en sprint', desc_en: '35 correct answers in a sprint',
  },

  // ── Exercices en une journée ──────────────────────────────────────────────
  {
    id: 'day_20',  category: 'daily_ex', tier: 'bronze',   icon: '🔥', threshold: 20,
    title_fr: 'Productif',    title_en: 'Productive',
    desc_fr:  '20 exercices en une journée', desc_en: '20 exercises in a single day',
  },
  {
    id: 'day_50',  category: 'daily_ex', tier: 'silver',   icon: '🔥', threshold: 50,
    title_fr: 'Motivé',       title_en: 'Motivated',
    desc_fr:  '50 exercices en une journée', desc_en: '50 exercises in a single day',
  },
  {
    id: 'day_100', category: 'daily_ex', tier: 'gold',     icon: '🔥', threshold: 100,
    title_fr: 'Marathonien',  title_en: 'Marathoner',
    desc_fr:  '100 exercices en une journée', desc_en: '100 exercises in a single day',
  },
  {
    id: 'day_200', category: 'daily_ex', tier: 'platinum', icon: '🔥', threshold: 200,
    title_fr: 'Machine',      title_en: 'Machine',
    desc_fr:  '200 exercices en une journée', desc_en: '200 exercises in a single day',
  },

  // ── Précision journalière (min 10 ex) ─────────────────────────────────────
  {
    id: 'dacc_70',  category: 'daily_acc', tier: 'bronze',   icon: '✨', threshold: 70,
    title_fr: 'Bonne journée',    title_en: 'Good Day',
    desc_fr:  '70 % en une journée (10 ex. min)', desc_en: '70% accuracy in a day (10+ exercises)',
  },
  {
    id: 'dacc_80',  category: 'daily_acc', tier: 'silver',   icon: '✨', threshold: 80,
    title_fr: 'Journée solide',   title_en: 'Solid Day',
    desc_fr:  '80 % en une journée (10 ex. min)', desc_en: '80% accuracy in a day (10+ exercises)',
  },
  {
    id: 'dacc_90',  category: 'daily_acc', tier: 'gold',     icon: '✨', threshold: 90,
    title_fr: 'Journée parfaite', title_en: 'Perfect Day',
    desc_fr:  '90 % en une journée (10 ex. min)', desc_en: '90% accuracy in a day (10+ exercises)',
  },
  {
    id: 'dacc_100', category: 'daily_acc', tier: 'platinum', icon: '✨', threshold: 100,
    title_fr: 'Sans faute',       title_en: 'Flawless',
    desc_fr:  '100 % en une journée (10 ex. min)', desc_en: '100% accuracy in a day (10+ exercises)',
  },
];

// ─── Input for compute function ───────────────────────────────────────────────

export interface AchievementInput {
  totalExercises: number;
  accuracy: number;          // 0–100
  daysPlayed: number;
  bestSprint: number;
  bestDayExercises: number;
  bestDayAccuracy: number;   // 0–100, only counted when >= 10 exercises that day
}

// ─── Compute which achievements are unlocked ──────────────────────────────────

export function computeAchievements(input: AchievementInput): AchievementResult[] {
  const { totalExercises, accuracy, daysPlayed, bestSprint, bestDayExercises, bestDayAccuracy } = input;

  return ACHIEVEMENTS.map(def => {
    let value: number;
    let progress: number;

    switch (def.category) {
      case 'exercises':  value = totalExercises;    progress = Math.min(totalExercises, def.threshold);  break;
      case 'accuracy':   value = totalExercises >= 50 ? accuracy : 0; progress = Math.min(accuracy, def.threshold); break;
      case 'days':       value = daysPlayed;         progress = Math.min(daysPlayed, def.threshold);     break;
      case 'sprint':     value = bestSprint;         progress = Math.min(bestSprint, def.threshold);     break;
      case 'daily_ex':   value = bestDayExercises;  progress = Math.min(bestDayExercises, def.threshold); break;
      case 'daily_acc':  value = bestDayAccuracy;   progress = Math.min(bestDayAccuracy, def.threshold); break;
    }

    return { ...def, unlocked: value >= def.threshold, progress, maxProgress: def.threshold };
  });
}

// ─── Pick the single best title for display ───────────────────────────────────

export function getBestTitle(
  achievements: AchievementResult[],
  lang: 'fr' | 'en' = 'fr',
): { title: string; tier: AchievementTier; icon: string } | null {
  const unlocked = achievements.filter(a => a.unlocked);
  if (!unlocked.length) return null;

  const best = unlocked.reduce((acc, cur) => {
    const scoreAcc = TIER_WEIGHT[acc.tier] + CAT_WEIGHT[acc.category];
    const scoreCur = TIER_WEIGHT[cur.tier] + CAT_WEIGHT[cur.category];
    return scoreCur > scoreAcc ? cur : acc;
  });

  return {
    title: lang === 'en' ? best.title_en : best.title_fr,
    tier: best.tier,
    icon: best.icon,
  };
}

// ─── Build input from leaderboard-available data (no byDay) ──────────────────
// Used in the leaderboard endpoint where we don't have per-day history.

export function buildLeaderboardInput(
  totalExercises: number,
  totalCorrect: number,
  sprintMap: Record<string, { advanced: number; expert: number }>,
): AchievementInput {
  const accuracy = totalExercises > 0 ? Math.round((totalCorrect / totalExercises) * 100) : 0;
  const bestSprint = Object.values(sprintMap).reduce(
    (m, v) => Math.max(m, v.advanced, v.expert), 0,
  );
  return { totalExercises, accuracy, daysPlayed: 0, bestSprint, bestDayExercises: 0, bestDayAccuracy: 0 };
}
