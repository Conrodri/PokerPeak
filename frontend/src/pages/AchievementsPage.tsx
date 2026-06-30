import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Trophy, Zap, Flame, Target, Clock, Check } from 'lucide-react';
import { AchievementsGrid } from '../components/stats/AchievementsGrid';
import { Achievement, AchievementTier } from '../types/poker';
import { useAuthStore } from '../store/authStore';
import { statsApi, examApi } from '../services/api';
import { useLangStore } from '../store/langStore';
import { Button } from '../components/ui/Button';

// ─── Sprint modules catalogue ─────────────────────────────────────────────────

const SPRINT_MODULES: { key: string; labelFr: string; labelEn: string; icon: string }[] = [
  { key: 'preflop',          labelFr: 'Préflop 6-max',    labelEn: 'Preflop 6-max',    icon: '🎯' },
  { key: 'preflop-mtt',      labelFr: 'Préflop 6-max MTT',labelEn: 'Preflop 6-max MTT',icon: '🎯' },
  { key: 'preflop8',         labelFr: 'Préflop 8-max',    labelEn: 'Preflop 8-max',    icon: '🎯' },
  { key: 'preflop8-mtt',     labelFr: 'Préflop 8-max MTT',labelEn: 'Preflop 8-max MTT',icon: '🎯' },
  { key: 'preflop-3max',     labelFr: 'Préflop 3-max',    labelEn: 'Preflop 3-max',    icon: '🎯' },
  { key: 'preflop-mtt-3max', labelFr: 'Préflop 3-max MTT',labelEn: 'Preflop 3-max MTT',icon: '🎯' },
  { key: 'preflop-hu',       labelFr: 'Préflop HU',       labelEn: 'Preflop HU',       icon: '🎯' },
  { key: 'preflop-mtt-hu',   labelFr: 'Préflop HU MTT',   labelEn: 'Preflop HU MTT',   icon: '🎯' },
  { key: 'potodds',          labelFr: 'Pot Odds',         labelEn: 'Pot Odds',         icon: '📊' },
  { key: 'equity',           labelFr: 'Équité',           labelEn: 'Equity',           icon: '⚖️' },
  { key: 'outs',             labelFr: 'Outs',             labelEn: 'Outs',             icon: '🎲' },
  { key: 'postflop',         labelFr: 'Post-flop',        labelEn: 'Post-flop',        icon: '🃏' },
  { key: 'fullhand',         labelFr: 'Main complète',    labelEn: 'Full Hand',        icon: '🎰' },
  { key: 'betsizing',        labelFr: 'Bet Sizing',       labelEn: 'Bet Sizing',       icon: '📐' },
];

// ─── Tier styles ──────────────────────────────────────────────────────────────

const TIER_STYLES: Record<AchievementTier, { ring: string; bg: string; text: string; label: string }> = {
  bronze:   { ring: 'border-amber-700/60',  bg: 'bg-amber-900/20',  text: 'text-amber-500',  label: 'Bronze'  },
  silver:   { ring: 'border-gray-500/60',   bg: 'bg-gray-700/20',   text: 'text-gray-300',   label: 'Argent'  },
  gold:     { ring: 'border-yellow-600/60', bg: 'bg-yellow-900/20', text: 'text-yellow-400', label: 'Or'      },
  platinum: { ring: 'border-purple-600/60', bg: 'bg-purple-900/20', text: 'text-purple-400', label: 'Platine' },
};

// ─── Title section (hero + selectable list) ───────────────────────────────────

function TitleSection({ achievements, selectedTitleId, onSelect, isEn }: {
  achievements: Achievement[];
  selectedTitleId: string | null;
  onSelect: (id: string | null) => void;
  isEn: boolean;
}) {
  const unlocked = achievements.filter(a => a.unlocked);

  // Derive displayed title: selected if valid, else auto-best
  const TIER_W: Record<string, number> = { platinum: 40, gold: 30, silver: 20, bronze: 10 };
  const CAT_W: Record<string, number>  = {
    accuracy: 6, sprint_expert: 5, daily_acc: 4,
    sprint_advanced: 3, daily_correct: 2, daily_ex: 1, days: 0, exercises: 0,
  };
  const activeTitle = (() => {
    if (selectedTitleId) {
      const chosen = unlocked.find(a => a.id === selectedTitleId);
      if (chosen) return chosen;
    }
    if (!unlocked.length) return null;
    return unlocked.reduce((a, b) =>
      (TIER_W[b.tier] + CAT_W[b.category]) > (TIER_W[a.tier] + CAT_W[a.category]) ? b : a
    );
  })();

  if (!unlocked.length) return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <span className="text-4xl opacity-30">🏅</span>
      <p className="text-sm text-gray-500">
        {isEn ? 'No title yet — complete achievements to unlock one.' : 'Pas encore de titre — complète des succès pour en débloquer un.'}
      </p>
    </div>
  );

  // Hero — active title
  const hs = activeTitle ? TIER_STYLES[activeTitle.tier] : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Active title hero */}
      {activeTitle && hs && (
        <motion.div
          key={activeTitle.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`flex items-center gap-3 rounded-xl border ${hs.ring} ${hs.bg} px-3 py-2.5`}
        >
          <span className="text-2xl leading-none shrink-0">{activeTitle.icon}</span>
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <span className={`text-sm font-black ${hs.text} leading-tight`}>
              {isEn ? activeTitle.title_en : activeTitle.title_fr}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${hs.text} opacity-60`}>
              {hs.label}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 shrink-0 text-right hidden sm:block">
            {isEn ? 'Shown on leaderboard' : 'Affiché dans le classement'}
          </p>
        </motion.div>
      )}

      {/* Selectable title list */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          {isEn ? `Choose a title (${unlocked.length} unlocked)` : `Choisir un titre (${unlocked.length} débloqués)`}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {unlocked
            .slice()
            .sort((a, b) => (TIER_W[b.tier] + CAT_W[b.category]) - (TIER_W[a.tier] + CAT_W[a.category]))
            .map(a => {
              const s = TIER_STYLES[a.tier];
              const isActive = a.id === (selectedTitleId ?? activeTitle?.id);
              return (
                <button
                  key={a.id}
                  onClick={() => onSelect(a.id === selectedTitleId ? null : a.id)}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-all
                    ${isActive
                      ? `${s.ring} ${s.bg} ring-1 ring-inset ${s.ring}`
                      : 'border-gray-700/50 bg-gray-800/30 hover:bg-gray-800/60 hover:border-gray-600'
                    }`}
                >
                  <span className="text-xl leading-none shrink-0">{a.icon}</span>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className={`text-xs font-bold truncate ${isActive ? s.text : 'text-gray-300'}`}>
                      {isEn ? a.title_en : a.title_fr}
                    </span>
                    <span className={`text-[10px] uppercase tracking-wide font-semibold ${s.text} opacity-60`}>
                      {s.label}
                    </span>
                  </div>
                  {isActive && (
                    <Check size={13} className={`shrink-0 ${s.text}`} />
                  )}
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}

// ─── Sprint records grid ──────────────────────────────────────────────────────

function SprintRecords({ records, isEn }: {
  records: Record<string, { advanced: number; expert: number }>;
  isEn: boolean;
}) {
  const active = SPRINT_MODULES.filter(m => {
    const r = records[m.key];
    return r && (r.advanced > 0 || r.expert > 0);
  });

  if (!active.length) return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <span className="text-3xl opacity-30">⚡</span>
      <p className="text-sm text-gray-500">
        {isEn
          ? 'No sprint completed yet. Start a sprint in Advanced or Expert mode.'
          : 'Aucun sprint effectué. Lance un sprint en mode Avancé ou Expert.'}
      </p>
      <Link to="/training">
        <Button variant="secondary" size="sm" className="mt-1">
          {isEn ? 'Go to training' : "Aller à l'entraînement"}
        </Button>
      </Link>
    </div>
  );

  return (
    <div className="rounded-xl border border-gray-700/50 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-800/70 border-b border-gray-700/50">
            <th className="text-left px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wide">
              {isEn ? 'Module' : 'Module'}
            </th>
            <th className="text-center px-3 py-2 text-xs font-bold text-yellow-400 uppercase tracking-wide">
              <span className="flex items-center justify-center gap-1">
                <Zap size={11} />{isEn ? 'Advanced' : 'Avancé'}
              </span>
            </th>
            <th className="text-center px-3 py-2 text-xs font-bold text-purple-400 uppercase tracking-wide">
              <span className="flex items-center justify-center gap-1">
                <Flame size={11} />{isEn ? 'Expert' : 'Expert'}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {active.map((m, i) => {
            const r = records[m.key] ?? { advanced: 0, expert: 0 };
            return (
              <tr
                key={m.key}
                className={i % 2 === 0 ? 'bg-gray-900/30' : 'bg-gray-800/20'}
              >
                <td className="px-3 py-2 text-gray-300 font-medium">
                  <span className="flex items-center gap-2">
                    <span className="text-base leading-none">{m.icon}</span>
                    <span className="text-xs">{isEn ? m.labelEn : m.labelFr}</span>
                  </span>
                </td>
                <td className="px-3 py-2 text-center">
                  {r.advanced > 0
                    ? <span className="font-black text-yellow-400">{r.advanced}</span>
                    : <span className="text-gray-600">—</span>}
                </td>
                <td className="px-3 py-2 text-center">
                  {r.expert > 0
                    ? <span className="font-black text-purple-400">{r.expert}</span>
                    : <span className="text-gray-600">—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-2"
    >
      <div className="flex items-center gap-1.5">
        <span className="text-gray-400">{icon}</span>
        <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wide">{title}</h2>
      </div>
      {children}
    </motion.section>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AchievementsPage() {
  const isEn = useLangStore(s => s.lang) === 'en';
  const user = useAuthStore(s => s.user);

  const [achievements,   setAchievements]   = useState<Achievement[]>([]);
  const [records,        setRecords]        = useState<Record<string, { advanced: number; expert: number }>>({});
  const [selectedTitle,  setSelectedTitle]  = useState<string | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [activeTab,      setActiveTab]      = useState("succes");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.all([
      statsApi.getUserStats(user.username),
      examApi.records(),
    ])
      .then(([ud, rec]) => {
        setAchievements(ud.achievements ?? []);
        setRecords(rec ?? {});
        setSelectedTitle(ud.selectedTitleId ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleSelectTitle = useCallback(async (id: string | null) => {
    const prev = selectedTitle;
    setSelectedTitle(id);          // optimistic
    setSaving(true);
    try {
      await statsApi.setTitle(id);
    } catch {
      setSelectedTitle(prev);      // revert on error
    } finally {
      setSaving(false);
    }
  }, [selectedTitle]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount    = achievements.length;

  if (!user) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center flex flex-col items-center gap-4">
      <Trophy size={32} className="text-gray-500" />
      <p className="text-gray-400 text-sm">
        {isEn ? 'Log in to see your achievements.' : 'Connecte-toi pour voir tes succès.'}
      </p>
      <Link to="/login"><Button variant="gold">{isEn ? 'Log in' : 'Se connecter'}</Button></Link>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-gold-500/40 border-t-gold-400 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-base font-black text-white flex items-center gap-1.5">
            <Trophy size={16} className="text-gold-400" />
            {isEn ? 'Achievements' : 'Succès & Récompenses'}
          </h1>
          {totalCount > 0 && (
            <p className="text-xs text-gray-400">
              {unlockedCount}/{totalCount} {isEn ? 'unlocked' : 'débloqués'}
              {unlockedCount > 0 && (
                <span className="ml-2 text-gold-400 font-semibold">
                  · {Math.round((unlockedCount / totalCount) * 100)} %
                </span>
              )}
            </p>
          )}
        </div>
        {saving && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <span className="w-3 h-3 border border-gray-500 border-t-gray-300 rounded-full animate-spin" />
            {isEn ? 'Saving…' : 'Sauvegarde…'}
          </span>
        )}
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex gap-1.5 flex-wrap">
        {[
          { id: 'succes',    labelFr: 'Succès',    labelEn: 'Achievements' },
          { id: 'sprints',   labelFr: 'Sprints',   labelEn: 'Sprints'      },
          { id: 'titre',     labelFr: 'Titre',     labelEn: 'Title'        },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${activeTab === tab.id ? 'bg-yellow-600 border-yellow-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}
          >
            {isEn ? tab.labelEn : tab.labelFr}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {activeTab === 'titre' && (
        <Section icon={<Trophy size={15} />} title={isEn ? 'Title' : 'Titre'}>
          <TitleSection
            achievements={achievements}
            selectedTitleId={selectedTitle}
            onSelect={handleSelectTitle}
            isEn={isEn}
          />
        </Section>
      )}

      {activeTab === 'sprints' && (
        <Section icon={<Target size={15} />} title={isEn ? 'Sprint records' : 'Records de sprints'}>
          <SprintRecords records={records} isEn={isEn} />
        </Section>
      )}

      {activeTab === 'succes' && (
        <Section icon={<Clock size={15} />} title={isEn ? 'All achievements' : 'Tous les succès'}>
          {achievements.length > 0
            ? <AchievementsGrid achievements={achievements} />
            : (
              <p className="text-sm text-gray-500 py-4 text-center">
                {isEn ? 'Play exercises to unlock your first achievement.' : 'Fais des exercices pour débloquer ton premier succès.'}
              </p>
            )
          }
        </Section>
      )}


    </div>
  );
}
