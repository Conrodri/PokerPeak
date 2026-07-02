import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Zap, Lightbulb } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useExerciseLock } from '../../hooks/useExerciseLock';
import { useExamRunner } from '../../hooks/useExamRunner';
import { SprintTimer } from '../ui/SprintTimer';
import { ExamLauncher, ExamHud, ExamResult } from './ExamMode';
import { useShallow } from 'zustand/react/shallow';
import { useTrainingStore } from '../../store/trainingStore';
import { Button } from '../ui/Button';
import { SessionStatsBar } from '../ui/SessionStatsBar';
import { useModeStore } from '../../store/modeStore';
import { VerdictBanner } from '../ui/VerdictBanner';
import { ExplanationPanel } from '../ui/ExplanationPanel';
import { RichLine } from '../ui/RichText';
import { BeginnerGuide } from '../ui/BeginnerGuide';
import { SpoilableHint } from '../ui/SpoilableHint';
import { TrainerIntro } from '../ui/TrainerIntro';
import { SourcesFooter } from '../ui/SourcesFooter';
import type { Source } from '../ui/SourcesFooter';
import { PokerTable, SeatInfo } from '../poker/PokerTable';
import { Hand } from '../poker/Card';
import { Position } from '../../types/poker';
import { useLangStore } from '../../store/langStore';
import {
  EXERCISES, FREQUENCY_EXERCISES,
  type Street, type SizingKey, type FreqKey, type BetSizingExercise, type FrequencyExercise,
} from '../../data/betSizingExercises';

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'exercise' | 'result';

// ─── Sizing config ────────────────────────────────────────────────────────────

const SIZING: Record<SizingKey, { pct: number; labelFr: (bb: number) => string; labelEn: (bb: number) => string }> = {
  check:   { pct: 0,   labelFr: _  => 'Check',                    labelEn: _  => 'Check'                  },
  small:   { pct: 33,  labelFr: bb => `Mise 33%  (${bb}bb)`,      labelEn: bb => `Bet 33%  (${bb}bb)`     },
  medium:  { pct: 55,  labelFr: bb => `Mise 55%  (${bb}bb)`,      labelEn: bb => `Bet 55%  (${bb}bb)`     },
  large:   { pct: 75,  labelFr: bb => `Mise 75%  (${bb}bb)`,      labelEn: bb => `Bet 75%  (${bb}bb)`     },
  overbet: { pct: 130, labelFr: bb => `Surenchère 130%  (${bb}bb)`, labelEn: bb => `Overbet 130%  (${bb}bb)` },
};

function sizingBb(pot: number, key: SizingKey) {
  return Math.round(pot * SIZING[key].pct / 100 * 10) / 10;
}

const SIZING_VARIANT: Record<SizingKey, 'secondary' | 'gold' | 'danger'> = {
  check:   'secondary',
  small:   'secondary',
  medium:  'secondary',
  large:   'gold',
  overbet: 'danger',
};

const FREQ_OPTIONS: { key: FreqKey; labelFr: string; labelEn: string }[] = [
  { key: '0%',   labelFr: 'Jamais (0%)',      labelEn: 'Never (0%)' },
  { key: '33%',  labelFr: 'Rarement (33%)',   labelEn: 'Rarely (33%)' },
  { key: '67%',  labelFr: 'Souvent (67%)',    labelEn: 'Often (67%)' },
  { key: '100%', labelFr: 'Toujours (100%)',  labelEn: 'Always (100%)' },
];

const CONCEPT_COLOR: Record<string, string> = {
  'Range Bet':       'bg-blue-900/30 text-blue-300 border-blue-700',
  'Protection':      'bg-orange-900/30 text-orange-300 border-orange-700',
  'Polarisation':    'bg-purple-900/30 text-purple-300 border-purple-700',
  'Valeur fine':     'bg-green-900/30 text-green-300 border-green-700',
  'Thin Value':      'bg-green-900/30 text-green-300 border-green-700',
  'Surenchère':      'bg-red-900/30 text-red-300 border-red-700',
  'Overbet':         'bg-red-900/30 text-red-300 border-red-700',
  'Hors position':   'bg-gray-700/40 text-gray-300 border-gray-600',
  'Out of Position': 'bg-gray-700/40 text-gray-300 border-gray-600',
  'SPR bas':         'bg-yellow-900/30 text-yellow-300 border-yellow-700',
  'Low SPR':         'bg-yellow-900/30 text-yellow-300 border-yellow-700',
  'Bluff polarisé':  'bg-purple-900/30 text-purple-300 border-purple-700',
  'Polarized Bluff': 'bg-purple-900/30 text-purple-300 border-purple-700',
  'Pot Control':     'bg-teal-900/30 text-teal-300 border-teal-700',
};

const STREET_COLORS: Record<Street, string> = {
  flop:  'text-blue-400 border-blue-700 bg-blue-900/20',
  turn:  'text-yellow-400 border-yellow-700 bg-yellow-900/20',
  river: 'text-red-400 border-red-700 bg-red-900/20',
};
const STREET_LABELS: Record<Street, { fr: string; en: string }> = {
  flop:  { fr: 'Flop',  en: 'Flop'  },
  turn:  { fr: 'Turn',  en: 'Turn'  },
  river: { fr: 'River', en: 'River' },
};


// Shuffle utility (Fisher-Yates)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Sources footer ───────────────────────────────────────────────────────────

const BETSIZING_SOURCES: Source[] = [
  {
    authors: 'Acevedo, M.',
    title: 'Modern Poker Theory',
    year: '2019',
    note: { fr: 'Fondements GTO, sizings dérivés de solveurs', en: 'GTO fundamentals, solver-derived sizings' },
    url: null,
  },
  {
    authors: 'Janda, M.',
    title: 'Applications of No-Limit Hold\'em',
    year: '2013',
    note: { fr: 'Théorie de la polarisation et du sizing relatif à la range', en: 'Polarization theory and range-relative bet sizing' },
    url: null,
  },
  {
    authors: 'Miller, E.',
    title: "Poker's 1%",
    year: '2014',
    note: { fr: 'Texture du board et concepts de sizing', en: 'Board texture and sizing concepts' },
    url: null,
  },
  {
    authors: 'GTO Wizard',
    title: 'Solver solutions database',
    year: '2023',
    note: { fr: 'Sizings moyens de la population, spots résolus', en: 'Population average sizings, solved spots' },
    url: 'https://gtowizard.com',
  },
  {
    authors: 'PioSolver',
    title: 'EV-maximizing bet sizing research',
    year: '2016–',
    note: { fr: 'Calcul EV, fréquences de mise optimales', en: 'EV calculation, optimal bet frequency outputs' },
    url: 'https://piosolver.com',
  },
];

const BETSIZING_METHODOLOGY = {
  fr: 'Tous les scénarios et réponses correctes sont calibrés sur des sorties de solveurs GTO et la littérature poker de référence. Les sizings reflètent les fréquences moyennes de la population pour des stacks de 100bb en cash game 6-max, sauf mention contraire.',
  en: 'All exercise scenarios and correct answers are calibrated from GTO solver outputs and established poker theory literature. Sizings reflect population-average solver frequencies for 100bb effective stacks in 6-max cash games unless specified.',
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BetSizingTrainer() {
  const lang     = useLangStore(s => s.lang);
  const isEn     = lang === 'en';
  const isMobile = useIsMobile();
  const { sessionStats, recordResult, setTrainerStarted } = useTrainingStore(
    useShallow(s => ({ sessionStats: s.sessionStats, recordResult: s.recordResult, setTrainerStarted: s.setTrainerStarted }))
  );
  const mode     = useModeStore(s => s.mode);

  const [showIntro, setShowIntro] = useState(true);
  const [phase,     setPhase]     = useState<Phase>('exercise');
  const [queue,     setQueue]     = useState<BetSizingExercise[]>([]);
  const [exercise,  setExercise]  = useState<BetSizingExercise | null>(null);
  const [selected,  setSelected]  = useState<string | null>(null);
  const [xpEarned,  setXpEarned]  = useState(0);

  // Listen for global back-to-intro event
  useEffect(() => {
    const onBack = () => { backToIntro(); };
    window.addEventListener('training:back', onBack);
    return () => window.removeEventListener('training:back', onBack);
  }, []);

  // Lock mode switching while a question is on screen.
  useExerciseLock(!showIntro && phase === 'exercise' && !!exercise);

  // Exam mode — premium only here (each exercise consumes a credit for free users).
  const { examActive, examFinished, startRun, quitRun, recordAnswer } = useExamRunner('betsizing');

  const buildPool = (): BetSizingExercise[] => {
    if (mode === 'expert') {
      // All sizing exercises + the frequency-quiz ones (expert only) — each
      // appears once per pass, so a sprint never repeats the same exercise
      // before the full 28-item pool has been seen.
      return shuffle([...EXERCISES, ...FREQUENCY_EXERCISES]);
    }
    return shuffle(EXERCISES as BetSizingExercise[]);
  };

  const nextExercise = (q = queue) => {
    let remaining = q;
    if (remaining.length === 0) remaining = buildPool();
    const [ex, ...rest] = remaining;
    setExercise(ex);
    setQueue(rest);
    setPhase('exercise');
    setSelected(null);
  };

  const handleStart = () => {
    quitRun();              // clear any leftover exam state — normal mode never shows the lives HUD / auto-advance
    setShowIntro(false);
    setTrainerStarted(true);
    nextExercise(buildPool());
  };

  const backToIntro = () => {
    setShowIntro(true);
    setTrainerStarted(false);
  };

  const handleAnswer = async (key: string) => {
    if (!exercise || phase === 'result') return;
    setSelected(key);
    const ok = exercise.frequencyMode
      ? key === exercise.correctFrequency
      : key === exercise.correctKey;
    const xp = ok ? 15 : 5;
    setXpEarned(xp);
    await recordResult(ok, xp, 'betsizing');
    setPhase('result');
    if (examActive) recordAnswer(ok, handleNext);
  };

  // Expert sprint: no decision within 30 s → submit a wrong answer (a miss).
  const handleTimeout = () => {
    if (!exercise || phase !== 'exercise') return;
    if (exercise.frequencyMode) {
      const wrong = FREQ_OPTIONS.find(o => o.key !== exercise.correctFrequency);
      if (wrong) handleAnswer(wrong.key);
    } else {
      const wrong = exercise.options.find(k => k !== exercise.correctKey);
      if (wrong) handleAnswer(wrong);
    }
  };

  const handleNext = () => nextExercise();

  const handleStartExam = () => {
    startRun();
    setShowIntro(false);
    setTrainerStarted(true);
    nextExercise(buildPool());
  };

  const handleQuitExam = () => {
    quitRun();
    setShowIntro(true);
    setTrainerStarted(false);
  };

  const ex        = exercise;
  const isCorrect = !!ex && (
    ex.frequencyMode ? selected === ex.correctFrequency : selected === ex.correctKey
  );

  // ── Intro ─────────────────────────────────────────────────────────────────
  if (showIntro) return (
    <div className="flex flex-col gap-3 sm:gap-4 max-w-2xl mx-auto">
      <TrainerIntro
        emoji="📐"
        title={isEn ? 'Bet Sizing Trainer' : 'Entraîneur Bet Sizing'}
        description={isEn
          ? 'Choose the right bet size — the most underrated skill in poker.'
          : 'Choisissez la bonne taille de mise — la compétence la plus sous-estimée.'}
        whatTitle={isEn ? 'Why does sizing matter?' : 'Pourquoi le sizing est-il crucial ?'}
        whatContent={
          <>
            <p className="text-gray-400 text-xs leading-snug mb-2">
              <RichLine text={isEn
                ? 'A wrong bet size leaks EV on every hand — even when the strategic decision is right. It depends on your range, board texture, position and stack depth.'
                : 'Une mauvaise taille fait fuir de l\'EV sur chaque main — même quand la décision est correcte. Elle dépend de votre range, la texture du board, votre position et les stacks.'} />
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { pct: 29, color: 'bg-blue-500', border: 'border-blue-900/50', bg: 'bg-blue-950/20', label: isEn ? 'Small — 25–33%' : 'Petite — 25–33%', desc: isEn ? 'Range bets, thin value' : 'Range bets, valeur fine' },
                { pct: 55, color: 'bg-green-500', border: 'border-green-900/50', bg: 'bg-green-950/20', label: isEn ? 'Medium — 50–60%' : 'Médiane — 50–60%', desc: isEn ? 'Balanced, dynamic boards' : 'Équilibre, boards dynamiques' },
                { pct: 87, color: 'bg-orange-500', border: 'border-orange-900/50', bg: 'bg-orange-950/20', label: isEn ? 'Large — 75–100%' : 'Grande — 75–100%', desc: isEn ? 'Protection, polarized' : 'Protection, polarisation' },
                { pct: 100, color: 'bg-red-500', border: 'border-red-900/50', bg: 'bg-red-950/20', label: isEn ? 'Overbet — 130%+' : 'Surenchère — 130%+', desc: isEn ? 'Nuts, bluffs' : 'Nuts, bluffs' },
              ].map(s => (
                <div key={s.label} className={`rounded-lg border px-2 py-1.5 ${s.border} ${s.bg}`}>
                  <div className="text-white font-bold text-[11px] leading-tight mb-0.5">{s.label}</div>
                  <div className="text-gray-500 text-[10px] leading-tight mb-1">{s.desc}</div>
                  <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        }
        steps={isEn ? [
          '🎯 A scenario appears: position, board, hand, pot size',
          '🃏 Cards displayed on the poker table — no text descriptions',
          '📐 Choose the best sizing from the options',
          '💡 Detailed GTO explanation after each answer',
        ] : [
          '🎯 Un scénario s\'affiche : position, board, main, pot',
          '🃏 Cartes affichées sur la table — pas de descriptions texte',
          '📐 Choisissez la meilleure taille parmi les options',
          '💡 Explication GTO détaillée après chaque réponse',
        ]}
        beginnerHint={isEn ? 'Shows board texture, hand type & key hints' : 'Affiche texture, type de main & indices clés'}
        advancedHint={isEn ? 'No hints — raw decision-making' : 'Sans indices — décision brute'}
        expertHint={isEn ? 'Advanced GTO spots — no hints, no texture shown, raw sizing decision' : 'Spots GTO avancés — aucun indice, aucune texture affichée, décision de sizing pure'}
        startLabel={isEn ? 'Start training' : "Commencer l'entraînement"}
        onStart={handleStart}
        mode={mode}
        examSlot={<ExamLauncher module="betsizing" onStart={handleStartExam} />}
      />
    </div>
  );

  if (examFinished) {
    return (
      <div className="flex flex-col gap-5 max-w-2xl mx-auto pt-4">
        <ExamResult module="betsizing" onRetry={handleStartExam} onQuit={handleQuitExam} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto">

      {/* ── Header — lives HUD during an exam ── */}
      {examActive && <ExamHud onQuit={handleQuitExam} />}

      {/* Expert sprint countdown */}
      {phase === 'exercise' && ex && (
        <SprintTimer
          active={examActive && (mode === 'advanced' || mode === 'expert')}
          resetKey={ex.id}
          onTimeout={handleTimeout}
          seconds={30}
        />
      )}

      {/* ════════════ EXERCISE ════════════ */}
      {phase === 'exercise' && ex && (
        <AnimatePresence mode="wait">
          <motion.div
            key={ex.id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="flex flex-col items-center gap-2"
          >
            {/* Street badge — scenario context */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <div className={`px-3 py-1 rounded-full border text-xs font-bold ${STREET_COLORS[ex.street]}`}>
                {isEn ? STREET_LABELS[ex.street].en : STREET_LABELS[ex.street].fr}
              </div>
            </div>

            {/* Poker table */}
            <div className="w-full max-w-[260px] sm:max-w-sm mx-auto">
              <PokerTable
                heroPosition={ex.heroPosition}
                interactive={false}
                activePlayers={[ex.heroPosition, ex.villainPosition]}
                potDisplay={`${ex.potSize}bb`}
                heroCards={ex.heroHand}
                boardCards={ex.board}
                boardCardSize="md"
                compact={true}
                seatInfos={{
                  [ex.heroPosition]:    { stack: `${ex.effectiveStack}bb` },
                  [ex.villainPosition]: { stack: `${ex.effectiveStack}bb` },
                } as Partial<Record<Position, SeatInfo>>}
              />
            </div>

            {/* Hero cards in a clearly separated info block */}
            <div className="w-full max-w-xs sm:max-w-sm rounded-2xl border border-gray-700/60 bg-gray-900/50 px-4 py-2 flex items-center justify-center gap-2">
              <Hand cards={ex.heroHand as any} size="sm" gap="gap-2" animate={false} />
            </div>

            {/* Context block */}
            <div className="w-full rounded-2xl border border-gray-700 overflow-hidden text-sm">
              {/* Preflop context */}
              <div className="flex items-start gap-3 px-4 py-3 bg-gray-900/70 border-b border-gray-700/60">
                <span className="text-gray-500 font-bold text-xs uppercase tracking-wide pt-0.5 shrink-0 w-16">
                  {isEn ? 'Preflop' : 'Préflop'}
                </span>
                <div className="flex-1">
                  <p className="text-gray-300">{isEn ? ex.preflopContext.en : ex.preflopContext.fr}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {isEn ? 'Pot:' : 'Pot :'}{' '}
                    <span className="text-yellow-400 font-bold">{ex.potSize}bb</span>
                    {' · '}
                    <span className={`font-semibold ${ex.isHeroIP ? 'text-green-400' : 'text-orange-400'}`}>
                      {isEn
                        ? (ex.isHeroIP ? 'In Position (IP)' : 'Out of Position (OOP)')
                        : (ex.isHeroIP ? 'En position (IP)'  : 'Hors position (OOP)')}
                    </span>
                  </p>
                </div>
              </div>

              {/* Question */}
              <div className="flex items-start gap-3 px-4 py-3 bg-yellow-900/10">
                <span className="text-yellow-600 font-bold text-xs uppercase tracking-wide pt-0.5 shrink-0 w-16">
                  {isEn ? 'Question' : 'Question'}
                </span>
                <p className="text-yellow-100 font-semibold flex-1">
                  {ex.frequencyMode
                    ? (isEn
                        ? 'Villain checks. How often (%) should you bet in this spot? (GTO frequency)'
                        : 'Villain checke. À quelle fréquence (%) faut-il miser dans ce spot ? (fréquence GTO)')
                    : (isEn
                        ? 'Your opponent checks to you. What is the optimal bet size?'
                        : 'Votre adversaire checke. Quelle est la taille de mise optimale ?')}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap gap-3 justify-center w-full"
            >
              {ex.frequencyMode ? (
                FREQ_OPTIONS.map(opt => (
                  <Button
                    key={opt.key}
                    size="lg"
                    variant="secondary"
                    onClick={() => handleAnswer(opt.key)}
                    className="min-w-[150px]"
                  >
                    {isEn ? opt.labelEn : opt.labelFr}
                  </Button>
                ))
              ) : (
                ex.options.map(key => {
                  const cfg = SIZING[key];
                  const bb  = key === 'check' ? null : sizingBb(ex.potSize, key);
                  return (
                    <Button
                      key={key}
                      size="lg"
                      variant={SIZING_VARIANT[key]}
                      onClick={() => handleAnswer(key)}
                      className="min-w-[150px] flex flex-col items-center gap-0.5 py-2"
                    >
                      <span className="font-bold">
                        {isEn ? cfg.labelEn(bb ?? 0) : cfg.labelFr(bb ?? 0)}
                      </span>
                      {bb !== null && (
                        <span className="text-xs opacity-70 font-normal">
                          {isEn ? `= ${bb}bb into ${ex.potSize}bb` : `= ${bb}bb dans pot ${ex.potSize}bb`}
                        </span>
                      )}
                    </Button>
                  );
                })
              )}
            </motion.div>

            {/* ── Indices — below the decision. Beginner shows them; advanced
                reveals behind a streak-breaking spoiler; expert hides them. ── */}
            <SpoilableHint resetKey={ex.id} className="w-full">
              <div className="flex flex-col gap-2 w-full">
                {/* Concrete coaching hint — sizing logic for this spot */}
                <div className="w-full rounded-xl border border-amber-700/40 bg-amber-950/30 px-4 py-3 flex items-start gap-2 text-left">
                  <Lightbulb size={15} className="text-amber-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-gray-300 leading-relaxed">
                    <p className="font-bold text-amber-300 mb-1">{isEn ? 'Hint' : 'Indice'}</p>
                    <p>{isEn
                      ? `Theme: ${ex.conceptTag.en}. Size to the board: dry/static boards → bet small (¼–⅓ pot, you can bet your whole range); wet boards with draws → bet big (⅔–pot) to charge them; a very strong hand on a dynamic board can overbet for max value. Position matters: you can go thinner in position.`
                      : `Thème : ${ex.conceptTag.fr}. Adapte au board : board sec/statique → mise petit (¼–⅓ pot, tu peux miser toute ta range) ; board humide avec tirages → mise gros (⅔–pot) pour les faire payer ; une main très forte sur board dynamique peut surmiser (overbet) pour un max de valeur. La position compte : tu peux miser plus fin en position.`}</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className={`px-3 py-1 rounded-full border text-xs font-bold ${CONCEPT_COLOR[isEn ? ex.conceptTag.en : ex.conceptTag.fr] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                    {isEn ? ex.conceptTag.en : ex.conceptTag.fr}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full">
                  <div className="bg-gray-800/60 rounded-xl px-4 py-2.5 border border-gray-700 text-center">
                    <p className="text-gray-500 text-xs mb-0.5">{isEn ? 'Your hand' : 'Votre main'}</p>
                    <p className="text-white font-semibold text-sm">{isEn ? ex.handDescription.en : ex.handDescription.fr}</p>
                  </div>
                  <div className="bg-gray-800/60 rounded-xl px-4 py-2.5 border border-gray-700 text-center">
                    <p className="text-gray-500 text-xs mb-0.5">{isEn ? 'Board texture' : 'Texture du board'}</p>
                    <p className="text-white font-semibold text-sm">{isEn ? ex.boardTexture.en : ex.boardTexture.fr}</p>
                  </div>
                </div>
              </div>
            </SpoilableHint>

            {/* Guidance below the decision — no scrolling needed to answer. */}
            <BeginnerGuide
              title={isEn ? 'What you must do' : 'Ce qu\'on te demande'}
              text={isEn
                ? `You have decided to **bet** — but the big question is: **how much**?\nThe pot is **${ex.potSize}bb**. You can bet a small, medium or large slice of it (or sometimes more than the pot = an overbet). Each size sends a different message and gives your opponent different odds.\n👉 Your job: pick the bet size that fits the situation. Look at the hints above — your hand strength and the board texture — to decide.\n💡 Rule of thumb: bet **small** on calm boards, **big** when there are draws to charge or when you have the nuts.`
                : `Tu as décidé de **miser** — mais la grande question est : **combien** ?\nLe pot est de **${ex.potSize}bb**. Tu peux en miser une petite, moyenne ou grande part (ou parfois plus que le pot = une surenchère). Chaque taille envoie un message différent et donne des cotes différentes à l'adversaire.\n👉 Ton travail : choisis la taille de mise adaptée à la situation. Regarde les indices ci-dessus — la force de ta main et la texture du board — pour décider.\n💡 Règle simple : mise **petit** sur les boards calmes, **gros** quand il y a des tirages à faire payer ou quand tu as les nuts.`}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* ════════════ RESULT ════════════ */}
      {phase === 'result' && ex && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-5"
        >
          <VerdictBanner isCorrect={isCorrect} />

          {/* Table recap */}
          <div className="w-full max-w-xs sm:max-w-full">
            <PokerTable
              heroPosition={ex.heroPosition}
              interactive={false}
              activePlayers={[ex.heroPosition, ex.villainPosition]}
              potDisplay={`${ex.potSize}bb`}
              heroCards={ex.heroHand}
              boardCards={ex.board}
              compact={false}
              seatInfos={{
                [ex.heroPosition]:    { stack: `${ex.effectiveStack}bb` },
                [ex.villainPosition]: { stack: `${ex.effectiveStack}bb` },
              } as Partial<Record<Position, SeatInfo>>}
            />
          </div>

          {/* Street + concept badges */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <div className={`px-3 py-1 rounded-full border text-xs font-bold ${STREET_COLORS[ex.street]}`}>
              {isEn ? STREET_LABELS[ex.street].en : STREET_LABELS[ex.street].fr}
            </div>
            <div className={`px-3 py-1 rounded-full border text-xs font-bold ${CONCEPT_COLOR[isEn ? ex.conceptTag.en : ex.conceptTag.fr] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
              {isEn ? ex.conceptTag.en : ex.conceptTag.fr}
            </div>
          </div>

          {/* Answer recap pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            {ex.frequencyMode ? (
              <>
                <span className="px-2.5 py-1 rounded-full border bg-green-900/30 text-green-300 border-green-700">
                  ✓ {isEn ? 'Correct:' : 'Correct :'} <strong>{ex.correctFrequency}</strong>
                </span>
                {selected && selected !== ex.correctFrequency && (
                  <span className="px-2.5 py-1 rounded-full border bg-red-900/30 text-red-300 border-red-700">
                    ✗ {isEn ? 'You chose:' : 'Votre choix :'} <strong>{selected}</strong>
                  </span>
                )}
              </>
            ) : (() => {
              const ck = ex.correctKey as SizingKey;
              const sk = selected as SizingKey | null;
              const correctCfg = SIZING[ck];
              const correctBb  = ck === 'check' ? null : sizingBb(ex.potSize, ck);
              return (
                <>
                  <span className="px-2.5 py-1 rounded-full border bg-green-900/30 text-green-300 border-green-700">
                    ✓ {isEn ? 'Correct:' : 'Correct :'}{' '}
                    <strong>{isEn ? correctCfg.labelEn(correctBb ?? 0) : correctCfg.labelFr(correctBb ?? 0)}</strong>
                  </span>
                  {sk && sk !== ck && (() => {
                    const selCfg = SIZING[sk];
                    const selBb  = sk === 'check' ? null : sizingBb(ex.potSize, sk);
                    return (
                      <span className="px-2.5 py-1 rounded-full border bg-red-900/30 text-red-300 border-red-700">
                        ✗ {isEn ? 'You chose:' : 'Votre choix :'}{' '}
                        <strong>{isEn ? selCfg.labelEn(selBb ?? 0) : selCfg.labelFr(selBb ?? 0)}</strong>
                      </span>
                    );
                  })()}
                </>
              );
            })()}
            <span className="px-2.5 py-1 rounded-full border bg-blue-900/30 text-blue-300 border-blue-700">
              <Zap size={10} className="inline mr-1" />+{xpEarned} XP
            </span>
          </div>

          {/* Stats summary */}
          <div className="grid grid-cols-2 gap-3 w-full text-sm">
            <div className="bg-gray-800/60 rounded-xl px-3 py-2 border border-gray-700 text-center">
              <p className="text-gray-500 text-xs mb-0.5">{isEn ? 'Board texture' : 'Texture'}</p>
              <p className="text-white font-semibold text-xs">{isEn ? ex.boardTexture.en : ex.boardTexture.fr}</p>
            </div>
            <div className="bg-gray-800/60 rounded-xl px-3 py-2 border border-gray-700 text-center">
              <p className="text-gray-500 text-xs mb-0.5">{isEn ? 'Position' : 'Position'}</p>
              <p className={`font-bold text-sm ${ex.isHeroIP ? 'text-green-400' : 'text-orange-400'}`}>
                {ex.isHeroIP ? 'IP' : 'OOP'}{' '}
                <span className="text-gray-400 font-normal text-xs">({ex.heroPosition})</span>
              </p>
            </div>
          </div>

          {/* Next + stats — hidden during an exam (auto-advances) */}
          {!examActive && (
            <>
              <div className="w-full max-w-xs">
                <Button size="lg" variant="gold" onClick={handleNext} fullWidth>
                  {isEn ? 'Next exercise' : 'Exercice suivant'}{' '}
                  <ChevronRight size={18} className="inline" />
                </Button>
              </div>
              <SessionStatsBar
                total={sessionStats.total}
                correct={sessionStats.correct}
                xp={sessionStats.xp}
              />
            </>
          )}

          {/* Bet sizing calculation panel — beginner + sizing exercises only */}
          {mode === 'basic' && !ex.frequencyMode && (() => {
            const correctCfg = SIZING[ex.correctKey];
            const correctBb  = ex.correctKey === 'check' ? 0 : sizingBb(ex.potSize, ex.correctKey);
            const totalAfterBet = ex.potSize + correctBb;
            const villainPotOdds = correctBb > 0
              ? Math.round((correctBb / totalAfterBet) * 100)
              : null;
            return (
              <div className="w-full rounded-2xl border border-gray-700 overflow-hidden text-xs">
                <div className="px-4 py-2.5 bg-gray-800/50 border-b border-gray-700 flex items-center gap-2 text-gray-400 font-semibold">
                  <span>🧮</span>
                  {isEn ? 'Sizing calculation' : 'Calcul du sizing'}
                </div>
                <div className="px-4 py-3 bg-gray-900/50 flex flex-col gap-2">
                  {ex.correctKey === 'check' ? (
                    <p className="text-gray-400">
                      {isEn
                        ? 'Optimal play is to check — no bet required.'
                        : 'La décision optimale est de checker — aucune mise requise.'}
                    </p>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 flex-wrap font-mono">
                        <span className="text-gray-400">{isEn ? 'Pot' : 'Pot'} =</span>
                        <span className="text-yellow-400 font-bold">{ex.potSize}bb</span>
                        <span className="text-gray-600">×</span>
                        <span className="text-blue-300 font-bold">{correctCfg.pct}%</span>
                        <span className="text-gray-600">=</span>
                        <span className="text-green-400 font-bold">{correctBb}bb</span>
                      </div>
                      <p className="text-gray-400 leading-relaxed">
                        {isEn
                          ? `${ex.potSize}bb × ${correctCfg.pct / 100} = ${correctBb}bb into ${ex.potSize}bb pot.`
                          : `${ex.potSize}bb × ${correctCfg.pct / 100} = ${correctBb}bb dans un pot de ${ex.potSize}bb.`}
                      </p>
                      {villainPotOdds !== null && (
                        <div className="mt-1 pt-2 border-t border-gray-800">
                          <p className="text-gray-500 mb-1">
                            {isEn ? 'Pot odds villain faces:' : 'Pot odds de l\'adversaire :'}
                          </p>
                          <p className="font-mono text-purple-300">
                            ( {correctBb} / {totalAfterBet} ) × 100 = <strong>{villainPotOdds}%</strong>
                          </p>
                          <p className="text-gray-500 mt-0.5">
                            {isEn
                              ? `Villain must call ${correctBb}bb into a ${totalAfterBet}bb pot → needs ${villainPotOdds}%+ equity to call profitably.`
                              : `L'adversaire doit payer ${correctBb}bb pour un pot de ${totalAfterBet}bb → il lui faut ${villainPotOdds}%+ d'équité pour call rentable.`}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })()}

          {/* GTO explanation */}
          {!examActive && <ExplanationPanel text={isEn ? ex.explanation.en : ex.explanation.fr} className="p-5" />}
        </motion.div>
      )}

      {/* ─── Sources footer ─────────────────────────────────────────────────── */}
      <SourcesFooter isEn={isEn} sources={BETSIZING_SOURCES} methodology={BETSIZING_METHODOLOGY} />

    </div>
  );
}

