import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, Flame, Target, ChevronDown, Crown, Lock } from 'lucide-react';
import { statsApi } from '../services/api';
import { LeaderboardEntry, LeaderboardModuleStat, LeaderboardTitle, AchievementTier } from '../types/poker';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { HoverTip } from '../components/ui/HoverTip';
import { useT } from '../i18n';
import { useLangStore } from '../store/langStore';

// ─── Module definitions ───────────────────────────────────────────────────────

// Main accuracy modules (shown as cards with accuracy bars).
const MODULES: {
  key: keyof NonNullable<LeaderboardEntry['modules']>;
  icon: string;
  labelFr: string;
  labelEn: string;
}[] = [
  { key: 'preflop',  icon: '🎯', labelFr: 'Pré-flop',     labelEn: 'Pre-flop'   },
  { key: 'outs',     icon: '🎲', labelFr: 'Outs',          labelEn: 'Outs'       },
  { key: 'equity',   icon: '⚖️', labelFr: 'Équité',        labelEn: 'Equity'     },
  { key: 'potodds',  icon: '📊', labelFr: 'Pot Odds',      labelEn: 'Pot Odds'   },
  { key: 'postflop', icon: '🃏', labelFr: 'Post-flop',     labelEn: 'Post-flop'  },
  { key: 'fullhand', icon: '🎰', labelFr: 'Main complète', labelEn: 'Full Hand'  },
];

// All preflop format/gameType variants — shown as a sprint sub-section.
const PREFLOP_VARIANTS: {
  key: keyof NonNullable<LeaderboardEntry['modules']>;
  labelFr: string;
  labelEn: string;
}[] = [
  { key: 'preflop',          labelFr: '6-max CG',    labelEn: '6-max CG'    },
  { key: 'preflop-mtt',      labelFr: '6-max MTT',   labelEn: '6-max MTT'   },
  { key: 'preflop8',         labelFr: '8-max CG',    labelEn: '8-max CG'    },
  { key: 'preflop8-mtt',     labelFr: '8-max MTT',   labelEn: '8-max MTT'   },
  { key: 'preflop-3max',     labelFr: '3-max CG',    labelEn: '3-max CG'    },
  { key: 'preflop-mtt-3max', labelFr: '3-max MTT',   labelEn: '3-max MTT'   },
  { key: 'preflop-hu',       labelFr: 'HU CG',       labelEn: 'HU CG'       },
  { key: 'preflop-mtt-hu',   labelFr: 'HU MTT',      labelEn: 'HU MTT'      },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function accColor(pct: number | null) {
  if (pct === null) return 'text-gray-600';
  if (pct >= 75)   return 'text-green-400';
  if (pct >= 50)   return 'text-yellow-400';
  return 'text-red-400';
}

function accBarColor(pct: number) {
  if (pct >= 75) return 'bg-green-500';
  if (pct >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

// ─── Title badge ──────────────────────────────────────────────────────────────

const TITLE_STYLES: Record<AchievementTier, string> = {
  bronze:   'text-amber-500  bg-amber-900/30  border-amber-700/50',
  silver:   'text-gray-300   bg-gray-700/30   border-gray-600/50',
  gold:     'text-yellow-400 bg-yellow-900/30 border-yellow-700/50',
  platinum: 'text-purple-300 bg-purple-900/30 border-purple-600/50',
};

function TitleBadge({ title, isEn }: { title: LeaderboardTitle; isEn: boolean }) {
  const label = isEn ? title.en : title.fr;
  const desc  = isEn ? title.desc_en : title.desc_fr;
  return (
    <HoverTip title={label} text={desc} noBorder className="inline-flex cursor-pointer">
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${TITLE_STYLES[title.tier]}`}>
        <span>{title.icon}</span>
        <span>{label}</span>
      </span>
    </HoverTip>
  );
}

// ─── Module grid shown when a row is expanded ─────────────────────────────────

function ModuleGrid({ modules, isEn }: {
  modules: NonNullable<LeaderboardEntry['modules']>;
  isEn: boolean;
}) {
  const preflopVariantsWithData = PREFLOP_VARIANTS.filter(v => {
    const s = modules[v.key];
    return (s?.advanced ?? 0) > 0 || (s?.expert ?? 0) > 0;
  });

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      {/* ── Accuracy cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-2 pb-1 border-t border-gray-800/70 mt-2">
        {MODULES.map(mod => {
          const stat: LeaderboardModuleStat = modules[mod.key];
          const label = isEn ? mod.labelEn : mod.labelFr;
          const pct   = stat.accuracy;
          return (
            <div key={mod.key} className="flex flex-col gap-0.5 bg-gray-900/60 rounded-lg px-2 py-1.5">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <span>{mod.icon}</span>
                  <span className="truncate">{label}</span>
                </span>
                <span className={`text-xs font-bold tabular-nums ${accColor(pct)}`}>
                  {pct !== null ? `${pct}%` : '—'}
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-1 rounded-full bg-gray-800 overflow-hidden">
                {pct !== null && (
                  <div
                    className={`h-full rounded-full transition-all ${accBarColor(pct)}`}
                    style={{ width: `${pct}%` }}
                  />
                )}
              </div>
              <div className="flex items-center justify-between mt-0.5">
                {stat.total > 0 ? (
                  <span className="text-[10px] text-gray-600">{stat.total} ex.</span>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-1.5">
                  {(stat.advanced ?? 0) > 0 && (
                    <HoverTip
                      title={isEn ? 'Advanced sprint' : 'Sprint avancé'}
                      text={isEn ? `Best: ${stat.advanced} correct` : `Meilleur : ${stat.advanced} réussis`}
                      className="flex items-center gap-0.5 text-[10px] text-gold-400 font-semibold border-none"
                    >
                      <Zap size={9} className="text-gold-400" />
                      {stat.advanced}
                    </HoverTip>
                  )}
                  {(stat.expert ?? 0) > 0 && (
                    <HoverTip
                      title={isEn ? 'Expert sprint' : 'Sprint expert'}
                      text={isEn ? `Best: ${stat.expert} correct` : `Meilleur : ${stat.expert} réussis`}
                      className="flex items-center gap-0.5 text-[10px] text-purple-400 font-semibold border-none"
                    >
                      <Flame size={9} className="text-purple-400" />
                      {stat.expert}
                    </HoverTip>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Pre-flop sprint variants sub-section ── */}
      {preflopVariantsWithData.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-800/50">
          <p className="text-[10px] font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
            🎯 {isEn ? 'Pre-flop sprints by format' : 'Sprints pré-flop par format'}
          </p>
          <div className="rounded-lg border border-gray-800 overflow-hidden">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="bg-gray-800/60 border-b border-gray-700/50">
                  <th className="text-left px-2 py-1 text-gray-500 font-semibold">Format</th>
                  <th className="px-2 py-1 text-yellow-400 font-bold">
                    <span className="flex items-center justify-center gap-0.5">
                      <Zap size={8} />{isEn ? 'Adv.' : 'Avancé'}
                    </span>
                  </th>
                  <th className="px-2 py-1 text-purple-400 font-bold">
                    <span className="flex items-center justify-center gap-0.5">
                      <Flame size={8} />{isEn ? 'Expert' : 'Expert'}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {preflopVariantsWithData.map((v, i) => {
                  const s = modules[v.key];
                  return (
                    <tr key={v.key} className={i % 2 === 0 ? 'bg-gray-900/30' : 'bg-gray-800/20'}>
                      <td className="px-2 py-1 text-gray-400 font-medium">{isEn ? v.labelEn : v.labelFr}</td>
                      <td className="px-2 py-1 text-center">
                        {(s?.advanced ?? 0) > 0
                          ? <span className="font-black text-yellow-400">{s!.advanced}</span>
                          : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-2 py-1 text-center">
                        {(s?.expert ?? 0) > 0
                          ? <span className="font-black text-purple-400">{s!.expert}</span>
                          : <span className="text-gray-600">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LeaderboardPage() {
  const t       = useT();
  const isEn    = useLangStore(s => s.lang) === 'en';
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    if (!user) return;
    statsApi.getLeaderboard(20)
      .then(setLeaders)
      .catch(() => setLeaders([]))
      .finally(() => setLoading(false));
  }, [user]);

  const toggleExpand = (username: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(username) ? next.delete(username) : next.add(username);
      return next;
    });
  };

  const isPremium = !!(user?.isPremium || user?.isPremiumExpert);
  const rankEmoji  = ['🥇', '🥈', '🥉'];
  const rankBg     = [
    'bg-gold-900/30 border-gold-700',
    'bg-gray-800/60 border-gray-600',
    'bg-amber-900/20 border-amber-800',
  ];
  const rankColors = ['text-gold-400', 'text-gray-300', 'text-amber-600'];

  // ── Login gate — leaderboard requires an account (like Stats) ──
  if (!user) return (
    <div className="flex flex-col items-center gap-6 py-20 text-center">
      <div className="text-6xl">🏆</div>
      <h2 className="text-2xl font-bold text-white">
        {isEn ? 'Sign in to see the leaderboard' : 'Connecte-toi pour voir le classement'}
      </h2>
      <p className="text-gray-400 max-w-sm">
        {isEn
          ? 'Create a free account or log in to compare your progress with other players.'
          : 'Crée un compte gratuit ou connecte-toi pour comparer ta progression avec les autres joueurs.'}
      </p>
      <Link to="/login">
        <Button size="lg" variant="gold">
          {isEn ? 'Log in / Sign up' : 'Connexion / Inscription'}
        </Button>
      </Link>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">

      {/* Header */}
      <div className="text-center">
        <Trophy size={32} className="text-gold-400 mx-auto mb-2" />
        <h1 className="text-2xl font-bold text-white mb-1">{t.leaderboard.title}</h1>
        <p className="text-gray-400 text-sm">{t.leaderboard.subtitle}</p>
      </div>

      {/* Non-premium upsell banner */}
      {!isPremium && (
        <div className="flex items-center gap-3 bg-gold-900/20 border border-gold-700/40 rounded-xl px-4 py-3 text-sm">
          <Lock size={16} className="text-gold-400 shrink-0" />
          <p className="text-gray-300 flex-1">
            {isEn
              ? 'Only Premium members appear in the ranking. '
              : 'Seuls les membres Premium apparaissent dans le classement. '}
            <Link to="/premium" className="text-gold-400 hover:underline font-medium">
              {isEn ? 'Upgrade to be ranked →' : 'Passe Premium pour y figurer →'}
            </Link>
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center h-40 items-center">
          <div className="animate-spin h-8 w-8 border-2 border-gold-500 border-t-transparent rounded-full" />
        </div>
      ) : leaders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>{t.leaderboard.empty}</p>
          <p className="text-sm mt-2">{t.leaderboard.empty_sub}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {leaders.map((entry, i) => {
            const isTop3   = i < 3;
            const isMe     = user?.username === entry.username;
            const isOpen   = expanded.has(entry.username);
            const hasMods  = !!entry.modules;

            return (
              <motion.div
                key={entry.username}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`rounded-xl border transition-all ${
                  isTop3 ? rankBg[i] : 'bg-gray-900/40 border-gray-800'
                } ${isMe ? 'ring-2 ring-felt-500' : ''}`}
              >
                {/* ── Main row ── */}
                <div className="flex items-center gap-3 p-3">

                  {/* Rank */}
                  <div className={`w-8 text-center font-black text-lg shrink-0 ${isTop3 ? rankColors[i] : 'text-gray-500'}`}>
                    {isTop3 ? rankEmoji[i] : `#${entry.rank}`}
                  </div>

                  {/* Name + level */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/stats/${entry.username}`}
                        className={`font-bold truncate hover:underline transition-colors text-sm ${isMe ? 'text-felt-300 hover:text-felt-200' : 'text-white hover:text-gray-200'}`}
                      >
                        {entry.username}
                      </Link>
                      <Crown
                        size={11}
                        className={`shrink-0 ${entry.isPremiumExpert ? 'text-purple-400' : 'text-gold-400'}`}
                      />
                      {isMe && (
                        <span className="text-[10px] bg-felt-800 text-felt-300 px-1 py-0.5 rounded shrink-0">
                          {t.leaderboard.you}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-gray-500">{t.stats.level} {entry.level}</span>
                      <span className="text-[10px] text-gray-500">{entry.totalExercises} ex.</span>
                      {entry.title && (
                        <TitleBadge title={entry.title} isEn={isEn} />
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Global accuracy */}
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Target size={11} className="text-green-400" />
                        <span className={`text-xs font-bold ${accColor(entry.accuracy)}`}>
                          {entry.accuracy}%
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-600">{t.leaderboard.accuracy}</p>
                    </div>

                    {/* XP */}
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Zap size={11} className="text-blue-400" />
                        <span className="text-xs font-bold text-blue-400">{entry.xp}</span>
                      </div>
                      <p className="text-[10px] text-gray-600">XP</p>
                    </div>

                    {/* Expand toggle */}
                    {hasMods && (
                      <button
                        onClick={() => toggleExpand(entry.username)}
                        className="text-gray-500 hover:text-gray-300 transition-colors p-0.5 -mr-0.5"
                        title={isEn ? 'Module breakdown' : 'Détail par module'}
                      >
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Module detail (collapsible) ── */}
                <AnimatePresence initial={false}>
                  {isOpen && hasMods && (
                    <div className="px-3 pb-2">
                      <ModuleGrid modules={entry.modules!} isEn={isEn} />
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Footer note */}
      <div className="text-center text-xs text-gray-600 py-2 flex flex-col gap-1">
        <p className="flex items-center justify-center gap-1.5">
          <ChevronDown size={11} />
          {isEn
            ? 'Click any row to see accuracy & sprint records per module'
            : 'Cliquez sur une ligne pour voir la précision & records de sprint par module'}
        </p>
        <p>{t.leaderboard.updated}</p>
        <p>{t.leaderboard.coming_soon} 🃏</p>
      </div>
    </div>
  );
}
