import { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Hand } from '../poker/Card';

// ─── Step data ────────────────────────────────────────────────────────────────

export const HAND_STEPS = [
  {
    labelFr: 'Préflop — Distribution',
    labelEn: 'Preflop — Cards dealt',
    color: 'text-blue-400 border-blue-700 bg-blue-900/20',
    heroCards: ['Ah', 'Kd'] as const,
    board: [] as const,
    contextFr: "Tu es au CO (Cutoff). BTN est dealer, SB poste 0.5bb et BB poste 1bb. UTG relance à 3bb, tout le monde se couche jusqu'à toi.",
    contextEn: "You're in CO (Cutoff). BTN is dealer, SB posts 0.5bb and BB posts 1bb. UTG raises to 3bb, everyone folds to you.",
    actionFr: "💡 A-K est une main premium (~top 3%). Tu 3-bet à 9bb. BB se couche, UTG appelle. Pot : ~19bb — tu entres dans le flop.",
    actionEn: "💡 A-K is a premium hand (~top 3%). You 3-bet to 9bb. BB folds, UTG calls. Pot: ~19bb — you go to the flop.",
  },
  {
    labelFr: 'Flop',
    labelEn: 'Flop',
    color: 'text-blue-400 border-blue-700 bg-blue-900/20',
    heroCards: ['Ah', 'Kd'] as const,
    board: ['As', 'Th', '5d'] as const,
    contextFr: 'Le croupier pose 3 cartes communes : A♠ T♥ 5♦. UTG checke (ne mise rien).',
    contextEn: 'The dealer places 3 community cards: A♠ T♥ 5♦. UTG checks (bets nothing).',
    actionFr: "💡 Tu as Paire d'As avec le meilleur kicker (K). C'est une main forte ! Tu mises 10bb (~55% du pot) pour protéger et construire le pot. UTG appelle. Pot : ~39bb.",
    actionEn: "💡 You have top pair with the best kicker (K). That's a strong hand! You bet 10bb (~55% pot) to protect and build the pot. UTG calls. Pot: ~39bb.",
  },
  {
    labelFr: 'Turn',
    labelEn: 'Turn',
    color: 'text-yellow-400 border-yellow-700 bg-yellow-900/20',
    heroCards: ['Ah', 'Kd'] as const,
    board: ['As', 'Th', '5d', 'Kc'] as const,
    contextFr: 'La 4ème carte tombe : K♣. UTG checke encore.',
    contextEn: 'The 4th card falls: K♣. UTG checks again.',
    actionFr: '💡 Tu as maintenant Deux Paires (As & Rois) — une très bonne main ! Tu mises 20bb pour extraire de la valeur. UTG appelle. Pot : ~79bb.',
    actionEn: '💡 You now have Two Pair (Aces & Kings) — a very strong hand! You bet 20bb for value. UTG calls. Pot: ~79bb.',
  },
  {
    labelFr: 'River & Showdown',
    labelEn: 'River & Showdown',
    color: 'text-red-400 border-red-700 bg-red-900/20',
    heroCards: ['Ah', 'Kd'] as const,
    board: ['As', 'Th', '5d', 'Kc', '2h'] as const,
    contextFr: "La dernière carte : 2♥. Rien de dangereux. UTG checke une dernière fois.",
    contextEn: 'The last card: 2♥. Nothing dangerous. UTG checks one last time.',
    actionFr: '🏆 Deux Paires (As & Rois) — tu mises 40bb pour le maximum. UTG se couche. Tu remportes le pot de ~79bb !',
    actionEn: '🏆 Two Pair (Aces & Kings) — you bet 40bb for maximum value. UTG folds. You win the ~79bb pot!',
  },
] as const;

// ─── Stepper content (used inline in Rules page) ──────────────────────────────

export function TutorialHand({ isEn, onClose }: { isEn: boolean; onClose?: () => void }) {
  const [step, setStep] = useState(0);
  const s = HAND_STEPS[step];

  return (
    <div className="flex flex-col gap-4">
      {/* Progress dots */}
      <div className="flex gap-2 justify-center">
        {HAND_STEPS.map((_, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={`rounded-full transition-all ${i === step ? 'w-8 h-1.5 bg-gold-500' : 'w-4 h-1.5 bg-gray-700 hover:bg-gray-500'}`}
          />
        ))}
      </div>

      {/* Street badge */}
      <div className={`self-center px-3 py-1 rounded-full border text-xs font-bold ${s.color}`}>
        {isEn ? s.labelEn : s.labelFr}
      </div>

      {/* Cards */}
      <div className="flex flex-col items-center gap-3">
        {s.board.length > 0 && (
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">{isEn ? 'Board' : 'Board commun'}</p>
            <Hand cards={s.board as any} size="sm" animate={false} context="display" cardStyle="fourcolor" gap="gap-1.5" />
          </div>
        )}
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-2">{isEn ? 'Your hand (CO)' : 'Ta main (CO — toi)'}</p>
          <Hand cards={s.heroCards as any} size="sm" animate={false} context="display" cardStyle="fourcolor" gap="gap-2" />
        </div>
      </div>

      {/* Context */}
      <p className="text-sm text-gray-300 text-center leading-relaxed">
        {isEn ? s.contextEn : s.contextFr}
      </p>

      {/* Action */}
      <div className="bg-gray-800/60 rounded-xl px-4 py-3 border border-gray-700 text-sm text-gray-200 leading-relaxed">
        {isEn ? s.actionEn : s.actionFr}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          className="px-4 py-2 text-sm rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← {isEn ? 'Previous' : 'Précédent'}
        </button>
        <span className="text-xs text-gray-600">{step + 1} / {HAND_STEPS.length}</span>
        {step < HAND_STEPS.length - 1 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            className="px-4 py-2 text-sm rounded-lg bg-gold-700 hover:bg-gold-600 text-white font-semibold transition-colors"
          >
            {isEn ? 'Next' : 'Suivant'} →
          </button>
        ) : (
          <Link
            to="/training?module=preflop"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg bg-felt-700 hover:bg-felt-600 text-white font-semibold transition-colors"
          >
            {isEn ? "Train now →" : "S'entraîner →"}
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Modal wrapper (used from Navbar) ────────────────────────────────────────

export function HandTutorialModal({ isEn, onClose }: { isEn: boolean; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
          <span className="font-bold text-white text-sm">
            🎯 {isEn ? 'Step-by-step hand tutorial' : 'Tutoriel : une main pas à pas'}
          </span>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-5 overflow-y-auto max-h-[75vh]">
          <TutorialHand isEn={isEn} onClose={onClose} />
        </div>
      </motion.div>
    </div>
  );
}
