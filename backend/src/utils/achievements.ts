// ─── Achievement definitions ──────────────────────────────────────────────────

export type AchievementTier     = 'bronze' | 'silver' | 'gold' | 'platinum';
export type AchievementCategory =
  | 'exercises'
  | 'accuracy'
  | 'days'
  | 'sprint_advanced'
  | 'sprint_expert'
  | 'daily_ex'
  | 'daily_correct'
  | 'daily_acc';

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
  progress: number;    // current value
  maxProgress: number; // = threshold
}

// Priority weight for "best title" — higher = preferred as display title
const TIER_WEIGHT: Record<AchievementTier, number> = {
  platinum: 40, gold: 30, silver: 20, bronze: 10,
};
const CAT_WEIGHT: Record<AchievementCategory, number> = {
  accuracy:        6,
  sprint_expert:   5,
  daily_acc:       4,
  sprint_advanced: 3,
  daily_correct:   2,
  daily_ex:        1,
  days:            0,
  exercises:       0,
};

export const ACHIEVEMENTS: AchievementDef[] = [

  // ── Exercices totaux (10 paliers) ─────────────────────────────────────────
  {
    id: 'ex_50',   category: 'exercises', tier: 'bronze',   icon: '📚', threshold: 50,
    title_fr: 'Apprenti',     title_en: 'Apprentice',
    desc_fr:  '50 exercices complétés',      desc_en: '50 exercises completed',
  },
  {
    id: 'ex_250',  category: 'exercises', tier: 'bronze',   icon: '📖', threshold: 250,
    title_fr: 'Studieux',     title_en: 'Diligent',
    desc_fr:  '250 exercices complétés',     desc_en: '250 exercises completed',
  },
  {
    id: 'ex_500',  category: 'exercises', tier: 'silver',   icon: '📗', threshold: 500,
    title_fr: 'Régulier',     title_en: 'Regular',
    desc_fr:  '500 exercices complétés',     desc_en: '500 exercises completed',
  },
  {
    id: 'ex_750',  category: 'exercises', tier: 'silver',   icon: '📘', threshold: 750,
    title_fr: 'Assidu',       title_en: 'Assiduous',
    desc_fr:  '750 exercices complétés',     desc_en: '750 exercises completed',
  },
  {
    id: 'ex_1000', category: 'exercises', tier: 'gold',     icon: '💪', threshold: 1000,
    title_fr: 'Acharné',      title_en: 'Grinder',
    desc_fr:  '1 000 exercices complétés',   desc_en: '1,000 exercises completed',
  },
  {
    id: 'ex_2000', category: 'exercises', tier: 'gold',     icon: '🔩', threshold: 2000,
    title_fr: 'Vétéran',      title_en: 'Veteran',
    desc_fr:  '2 000 exercices complétés',   desc_en: '2,000 exercises completed',
  },
  {
    id: 'ex_2500', category: 'exercises', tier: 'gold',     icon: '⚙️',  threshold: 2500,
    title_fr: 'Élite',        title_en: 'Elite',
    desc_fr:  '2 500 exercices complétés',   desc_en: '2,500 exercises completed',
  },
  {
    id: 'ex_3000', category: 'exercises', tier: 'platinum', icon: '🏋️', threshold: 3000,
    title_fr: 'Grand Maître', title_en: 'Grand Master',
    desc_fr:  '3 000 exercices complétés',   desc_en: '3,000 exercises completed',
  },
  {
    id: 'ex_4000', category: 'exercises', tier: 'platinum', icon: '🏆', threshold: 4000,
    title_fr: 'Champion',     title_en: 'Champion',
    desc_fr:  '4 000 exercices complétés',   desc_en: '4,000 exercises completed',
  },
  {
    id: 'ex_5000', category: 'exercises', tier: 'platinum', icon: '👑', threshold: 5000,
    title_fr: 'Légende',      title_en: 'Legend',
    desc_fr:  '5 000 exercices complétés',   desc_en: '5,000 exercises completed',
  },

  // ── Précision globale (min 100 ex, 10 paliers) ────────────────────────────
  {
    id: 'acc_60',  category: 'accuracy', tier: 'bronze',   icon: '🎯', threshold: 60,
    title_fr: 'Décent',        title_en: 'Decent',
    desc_fr:  '60 % de précision (100 ex. min)', desc_en: '60% accuracy (100+ exercises)',
  },
  {
    id: 'acc_70',  category: 'accuracy', tier: 'bronze',   icon: '🎯', threshold: 70,
    title_fr: 'Précis',        title_en: 'Precise',
    desc_fr:  '70 % de précision (100 ex. min)', desc_en: '70% accuracy (100+ exercises)',
  },
  {
    id: 'acc_80',  category: 'accuracy', tier: 'silver',   icon: '🎯', threshold: 80,
    title_fr: 'Sniper',        title_en: 'Sniper',
    desc_fr:  '80 % de précision (100 ex. min)', desc_en: '80% accuracy (100+ exercises)',
  },
  {
    id: 'acc_90',  category: 'accuracy', tier: 'silver',   icon: '🎯', threshold: 90,
    title_fr: 'Perfecto',      title_en: 'Perfecto',
    desc_fr:  '90 % de précision (100 ex. min)', desc_en: '90% accuracy (100+ exercises)',
  },
  {
    id: 'acc_95',  category: 'accuracy', tier: 'gold',     icon: '🎯', threshold: 95,
    title_fr: 'Maestro',       title_en: 'Maestro',
    desc_fr:  '95 % de précision (100 ex. min)', desc_en: '95% accuracy (100+ exercises)',
  },
  {
    id: 'acc_96',  category: 'accuracy', tier: 'gold',     icon: '🎯', threshold: 96,
    title_fr: 'Virtuose',      title_en: 'Virtuoso',
    desc_fr:  '96 % de précision (100 ex. min)', desc_en: '96% accuracy (100+ exercises)',
  },
  {
    id: 'acc_97',  category: 'accuracy', tier: 'gold',     icon: '🎯', threshold: 97,
    title_fr: 'Infaillible',   title_en: 'Infallible',
    desc_fr:  '97 % de précision (100 ex. min)', desc_en: '97% accuracy (100+ exercises)',
  },
  {
    id: 'acc_98',  category: 'accuracy', tier: 'platinum', icon: '🎯', threshold: 98,
    title_fr: 'Intouchable',   title_en: 'Untouchable',
    desc_fr:  '98 % de précision (100 ex. min)', desc_en: '98% accuracy (100+ exercises)',
  },
  {
    id: 'acc_99',  category: 'accuracy', tier: 'platinum', icon: '🎯', threshold: 99,
    title_fr: 'Quasi-parfait', title_en: 'Near Perfect',
    desc_fr:  '99 % de précision (100 ex. min)', desc_en: '99% accuracy (100+ exercises)',
  },
  {
    id: 'acc_100', category: 'accuracy', tier: 'platinum', icon: '🎯', threshold: 100,
    title_fr: 'Inhumain',      title_en: 'Inhuman',
    desc_fr:  '100 % de précision (100 ex. min)', desc_en: '100% accuracy (100+ exercises)',
  },

  // ── Jours joués (6 paliers, sans 100) ─────────────────────────────────────
  {
    id: 'days_7',   category: 'days', tier: 'bronze',   icon: '📅', threshold: 7,
    title_fr: 'Ponctuel',      title_en: 'Punctual',
    desc_fr:  '7 jours joués',   desc_en: '7 days played',
  },
  {
    id: 'days_30',  category: 'days', tier: 'bronze',   icon: '📅', threshold: 30,
    title_fr: 'Constant',      title_en: 'Consistent',
    desc_fr:  '30 jours joués',  desc_en: '30 days played',
  },
  {
    id: 'days_60',  category: 'days', tier: 'silver',   icon: '📅', threshold: 60,
    title_fr: 'Engagé',        title_en: 'Engaged',
    desc_fr:  '60 jours joués',  desc_en: '60 days played',
  },
  {
    id: 'days_90',  category: 'days', tier: 'silver',   icon: '📅', threshold: 90,
    title_fr: 'Persévérant',   title_en: 'Persistent',
    desc_fr:  '90 jours joués',  desc_en: '90 days played',
  },
  {
    id: 'days_180', category: 'days', tier: 'gold',     icon: '📅', threshold: 180,
    title_fr: 'Dévoué',        title_en: 'Devoted',
    desc_fr:  '180 jours joués', desc_en: '180 days played',
  },
  {
    id: 'days_365', category: 'days', tier: 'platinum', icon: '📅', threshold: 365,
    title_fr: 'Obsédé',        title_en: 'Obsessed',
    desc_fr:  '365 jours joués', desc_en: '365 days played',
  },

  // ── Sprint avancé (7 paliers) ─────────────────────────────────────────────
  {
    id: 'spr_adv_5',   category: 'sprint_advanced', tier: 'bronze',   icon: '⚡', threshold: 5,
    title_fr: 'Lancé',        title_en: 'Fired Up',
    desc_fr:  '5 bonnes réponses (sprint avancé)',  desc_en: '5 correct answers (advanced sprint)',
  },
  {
    id: 'spr_adv_10',  category: 'sprint_advanced', tier: 'bronze',   icon: '⚡', threshold: 10,
    title_fr: 'En série',     title_en: 'On a Roll',
    desc_fr:  '10 bonnes réponses (sprint avancé)', desc_en: '10 correct answers (advanced sprint)',
  },
  {
    id: 'spr_adv_20',  category: 'sprint_advanced', tier: 'silver',   icon: '⚡', threshold: 20,
    title_fr: 'Inarrêtable',  title_en: 'Unstoppable',
    desc_fr:  '20 bonnes réponses (sprint avancé)', desc_en: '20 correct answers (advanced sprint)',
  },
  {
    id: 'spr_adv_35',  category: 'sprint_advanced', tier: 'silver',   icon: '⚡', threshold: 35,
    title_fr: 'Imbattable',   title_en: 'Unbeatable',
    desc_fr:  '35 bonnes réponses (sprint avancé)', desc_en: '35 correct answers (advanced sprint)',
  },
  {
    id: 'spr_adv_50',  category: 'sprint_advanced', tier: 'gold',     icon: '⚡', threshold: 50,
    title_fr: 'Domination',   title_en: 'Domination',
    desc_fr:  '50 bonnes réponses (sprint avancé)', desc_en: '50 correct answers (advanced sprint)',
  },
  {
    id: 'spr_adv_75',  category: 'sprint_advanced', tier: 'gold',     icon: '⚡', threshold: 75,
    title_fr: 'Surhumain',    title_en: 'Superhuman',
    desc_fr:  '75 bonnes réponses (sprint avancé)', desc_en: '75 correct answers (advanced sprint)',
  },
  {
    id: 'spr_adv_100', category: 'sprint_advanced', tier: 'platinum', icon: '⚡', threshold: 100,
    title_fr: 'Centurion',    title_en: 'Centurion',
    desc_fr:  '100 bonnes réponses (sprint avancé)', desc_en: '100 correct answers (advanced sprint)',
  },

  // ── Sprint expert (7 paliers) ─────────────────────────────────────────────
  {
    id: 'spr_exp_5',   category: 'sprint_expert', tier: 'bronze',   icon: '🔥', threshold: 5,
    title_fr: 'Baptême du feu',  title_en: 'Trial by Fire',
    desc_fr:  '5 bonnes réponses (sprint expert)',  desc_en: '5 correct answers (expert sprint)',
  },
  {
    id: 'spr_exp_10',  category: 'sprint_expert', tier: 'bronze',   icon: '🔥', threshold: 10,
    title_fr: 'Maîtrisé',        title_en: 'Mastered',
    desc_fr:  '10 bonnes réponses (sprint expert)', desc_en: '10 correct answers (expert sprint)',
  },
  {
    id: 'spr_exp_20',  category: 'sprint_expert', tier: 'silver',   icon: '🔥', threshold: 20,
    title_fr: 'Redoutable',      title_en: 'Formidable',
    desc_fr:  '20 bonnes réponses (sprint expert)', desc_en: '20 correct answers (expert sprint)',
  },
  {
    id: 'spr_exp_35',  category: 'sprint_expert', tier: 'silver',   icon: '🔥', threshold: 35,
    title_fr: 'Implacable',      title_en: 'Relentless',
    desc_fr:  '35 bonnes réponses (sprint expert)', desc_en: '35 correct answers (expert sprint)',
  },
  {
    id: 'spr_exp_50',  category: 'sprint_expert', tier: 'gold',     icon: '🔥', threshold: 50,
    title_fr: 'Dominateur',      title_en: 'Dominant',
    desc_fr:  '50 bonnes réponses (sprint expert)', desc_en: '50 correct answers (expert sprint)',
  },
  {
    id: 'spr_exp_75',  category: 'sprint_expert', tier: 'gold',     icon: '🔥', threshold: 75,
    title_fr: 'Dévastateur',     title_en: 'Devastating',
    desc_fr:  '75 bonnes réponses (sprint expert)', desc_en: '75 correct answers (expert sprint)',
  },
  {
    id: 'spr_exp_100', category: 'sprint_expert', tier: 'platinum', icon: '🔥', threshold: 100,
    title_fr: 'Élite absolu',    title_en: 'Absolute Elite',
    desc_fr:  '100 bonnes réponses (sprint expert)', desc_en: '100 correct answers (expert sprint)',
  },

  // ── Exercices en une journée (4 paliers) ──────────────────────────────────
  {
    id: 'day_20',  category: 'daily_ex', tier: 'bronze',   icon: '⏱️', threshold: 20,
    title_fr: 'Productif',    title_en: 'Productive',
    desc_fr:  '20 exercices en une journée',  desc_en: '20 exercises in a single day',
  },
  {
    id: 'day_50',  category: 'daily_ex', tier: 'silver',   icon: '⏱️', threshold: 50,
    title_fr: 'Motivé',       title_en: 'Motivated',
    desc_fr:  '50 exercices en une journée',  desc_en: '50 exercises in a single day',
  },
  {
    id: 'day_100', category: 'daily_ex', tier: 'gold',     icon: '⏱️', threshold: 100,
    title_fr: 'Marathonien',  title_en: 'Marathoner',
    desc_fr:  '100 exercices en une journée', desc_en: '100 exercises in a single day',
  },
  {
    id: 'day_200', category: 'daily_ex', tier: 'platinum', icon: '⏱️', threshold: 200,
    title_fr: 'Machine',      title_en: 'Machine',
    desc_fr:  '200 exercices en une journée', desc_en: '200 exercises in a single day',
  },

  // ── Exercices réussis en une journée (4 paliers) ──────────────────────────
  {
    id: 'dayc_20',  category: 'daily_correct', tier: 'bronze',   icon: '✅', threshold: 20,
    title_fr: 'Adroit',         title_en: 'Adroit',
    desc_fr:  '20 bonnes réponses en une journée',  desc_en: '20 correct answers in a single day',
  },
  {
    id: 'dayc_50',  category: 'daily_correct', tier: 'silver',   icon: '✅', threshold: 50,
    title_fr: 'Confirmé',       title_en: 'Confirmed',
    desc_fr:  '50 bonnes réponses en une journée',  desc_en: '50 correct answers in a single day',
  },
  {
    id: 'dayc_100', category: 'daily_correct', tier: 'gold',     icon: '✅', threshold: 100,
    title_fr: 'Chirurgical',    title_en: 'Surgical',
    desc_fr:  '100 bonnes réponses en une journée', desc_en: '100 correct answers in a single day',
  },
  {
    id: 'dayc_200', category: 'daily_correct', tier: 'platinum', icon: '✅', threshold: 200,
    title_fr: 'Indestructible', title_en: 'Indestructible',
    desc_fr:  '200 bonnes réponses en une journée', desc_en: '200 correct answers in a single day',
  },

  // ── Précision journalière (min 10 ex, 4 paliers) ──────────────────────────
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
  accuracy: number;              // 0–100
  daysPlayed: number;
  bestSprintAdvanced: number;
  bestSprintExpert: number;
  bestDayExercises: number;
  bestDayCorrect: number;
  bestDayAccuracy: number;       // 0–100, only counted when >= 10 exercises that day
}

// ─── Compute which achievements are unlocked ──────────────────────────────────

export function computeAchievements(input: AchievementInput): AchievementResult[] {
  const {
    totalExercises, accuracy, daysPlayed,
    bestSprintAdvanced, bestSprintExpert,
    bestDayExercises, bestDayCorrect, bestDayAccuracy,
  } = input;

  return ACHIEVEMENTS.map(def => {
    let value: number;
    let progress: number;

    switch (def.category) {
      case 'exercises':
        value = totalExercises;
        progress = Math.min(totalExercises, def.threshold);
        break;
      case 'accuracy':
        value    = totalExercises >= 100 ? accuracy : 0;
        progress = Math.min(accuracy, def.threshold);
        break;
      case 'days':
        value    = daysPlayed;
        progress = Math.min(daysPlayed, def.threshold);
        break;
      case 'sprint_advanced':
        value    = bestSprintAdvanced;
        progress = Math.min(bestSprintAdvanced, def.threshold);
        break;
      case 'sprint_expert':
        value    = bestSprintExpert;
        progress = Math.min(bestSprintExpert, def.threshold);
        break;
      case 'daily_ex':
        value    = bestDayExercises;
        progress = Math.min(bestDayExercises, def.threshold);
        break;
      case 'daily_correct':
        value    = bestDayCorrect;
        progress = Math.min(bestDayCorrect, def.threshold);
        break;
      case 'daily_acc':
        value    = bestDayAccuracy;
        progress = Math.min(bestDayAccuracy, def.threshold);
        break;
    }

    return { ...def, unlocked: value >= def.threshold, progress, maxProgress: def.threshold };
  });
}

// ─── Pick the single best achievement (full object) ──────────────────────────

export function getBestAchievement(
  achievements: AchievementResult[],
): AchievementResult | null {
  const unlocked = achievements.filter(a => a.unlocked);
  if (!unlocked.length) return null;
  return unlocked.reduce((acc, cur) =>
    (TIER_WEIGHT[cur.tier] + CAT_WEIGHT[cur.category]) > (TIER_WEIGHT[acc.tier] + CAT_WEIGHT[acc.category]) ? cur : acc
  );
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
    tier:  best.tier,
    icon:  best.icon,
  };
}

// ─── Build input from leaderboard-available data (no byDay) ──────────────────

export function buildLeaderboardInput(
  totalExercises: number,
  totalCorrect: number,
  sprintMap: Record<string, { advanced: number; expert: number }>,
): AchievementInput {
  const accuracy           = totalExercises > 0 ? Math.round((totalCorrect / totalExercises) * 100) : 0;
  const bestSprintAdvanced = Object.values(sprintMap).reduce((m, v) => Math.max(m, v.advanced), 0);
  const bestSprintExpert   = Object.values(sprintMap).reduce((m, v) => Math.max(m, v.expert),   0);
  return {
    totalExercises, accuracy, daysPlayed: 0,
    bestSprintAdvanced, bestSprintExpert,
    bestDayExercises: 0, bestDayCorrect: 0, bestDayAccuracy: 0,
  };
}
