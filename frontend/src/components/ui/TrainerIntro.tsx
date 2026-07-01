import { motion } from 'framer-motion';
import { BookOpen, Play, Zap, Check, Crown, Lock, Gift, Flame, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { RichText } from './RichText';
import { useLangStore } from '../../store/langStore';
import { useModeStore, TrainingMode } from '../../store/modeStore';
import { analytics } from '../../lib/analytics';

interface TrainerIntroProps {
  emoji: string;
  title: string;
  description: string;
  whatTitle: string;
  whatContent: React.ReactNode;
  steps: string[];
  beginnerHint: string;
  advancedHint: string;
  expertHint?: string;
  startLabel: string;
  onStart: () => void;
  mode: TrainingMode;
  locked?: boolean;
  lockedVariant?: 'premium' | 'login' | 'quota';
  freeInfo?: { remaining: number; limit: number };
  examSlot?: React.ReactNode;
  bottomSlot?: React.ReactNode;
  aboveActionsSlot?: React.ReactNode;
}

export function TrainerIntro({
  emoji, title, description, whatTitle, whatContent,
  steps, beginnerHint, advancedHint, expertHint, startLabel, onStart, mode,
  locked = false, lockedVariant = 'premium', freeInfo, examSlot, bottomSlot, aboveActionsSlot,
}: TrainerIntroProps) {
  const isEn = useLangStore(s => s.lang) === 'en';
  const setMode = useModeStore(s => s.setMode);
  const hints = useModeStore(s => s.hints);
  const setHints = useModeStore(s => s.setHints);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-1.5 max-w-xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-0.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center text-base shadow-lg shadow-black/30">
          {emoji}
        </div>
        <h2 className="text-base sm:text-lg font-black text-white">{title}</h2>
        {locked && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-600/40 text-yellow-400 text-[10px] font-bold uppercase tracking-wide">
            <Crown size={11} fill="currentColor" />
            Premium
          </span>
        )}
        <div className="text-gray-400 text-xs leading-snug max-w-lg">
          <RichText text={description} />
        </div>
      </div>

      {/* Info sections */}
      <div className="flex flex-col gap-1">
        {/* What is X? */}
        <section className="bg-gray-900/50 rounded-xl px-2.5 py-1.5 border border-gray-800">
          <h3 className="text-gray-200 font-bold text-xs mb-1 flex items-center gap-1.5">
            <span className="grid place-items-center w-4 h-4 rounded bg-blue-900/40 text-blue-300 text-[10px]">📖</span>
            {whatTitle}
          </h3>
          {whatContent}
        </section>

        {/* How it works */}
        <section className="bg-gray-900/50 rounded-xl px-2.5 py-1.5 border border-gray-800">
          <h3 className="text-gray-200 font-bold text-xs mb-1 flex items-center gap-1.5">
            <span className="grid place-items-center w-4 h-4 rounded bg-gold-900/40 text-gold-300 text-[10px]">⚡</span>
            {isEn ? 'How the exercises work' : 'Comment ça marche ?'}
          </h3>
          <ul className="space-y-0.5 text-xs text-gray-400">
            {steps.map((item, i) => {
              const spaceIdx = item.indexOf(' ');
              return (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="grid place-items-center w-3.5 h-3.5 rounded bg-gray-800 text-[9px] shrink-0 mt-px">
                    {item.slice(0, spaceIdx)}
                  </span>
                  <div className="flex-1 leading-snug"><RichText text={item.slice(spaceIdx + 1)} /></div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* Mode + Hints selectors — footer of the card */}
      <div className="flex flex-wrap items-center justify-center gap-2 order-last">
        {/* Level selector */}
        <div className="inline-flex p-0.5 rounded-2xl bg-gray-900/70 border border-gray-700 gap-0.5">
          <button
            type="button"
            onClick={() => setMode('basic')}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-xl text-sm font-bold transition-all ${
              mode === 'basic' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <BookOpen size={15} />
            {isEn ? 'Basic' : 'Basique'}
            {mode === 'basic' && <Check size={13} />}
          </button>
          <button
            type="button"
            onClick={() => setMode('advanced')}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-xl text-sm font-bold transition-all ${
              mode === 'advanced' ? 'bg-gold-600 text-gray-900 shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Zap size={15} />
            {isEn ? 'Advanced' : 'Avancé'}
            {mode === 'advanced' && <Check size={13} />}
          </button>
          <button
            type="button"
            onClick={() => setMode('expert')}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-xl text-sm font-bold transition-all ${
              mode === 'expert' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Flame size={15} />
            Expert
            {mode === 'expert' && <Check size={13} />}
          </button>
        </div>

        {/* Hints toggle */}
        <div className="inline-flex p-0.5 rounded-xl bg-gray-900/70 border border-gray-700 gap-0.5">
          <button
            type="button"
            onClick={() => setHints('easy')}
            className={`flex items-center gap-1.5 px-3 py-0.5 rounded-lg text-xs font-bold transition-all ${
              hints === 'easy'
                ? 'bg-emerald-700/50 text-emerald-300 border border-emerald-600/40'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Eye size={12} />
            {isEn ? 'Easy — hints on' : 'Easy — indices'}
          </button>
          <button
            type="button"
            onClick={() => setHints('hard')}
            className={`flex items-center gap-1.5 px-3 py-0.5 rounded-lg text-xs font-bold transition-all ${
              hints === 'hard'
                ? 'bg-red-900/40 text-red-300 border border-red-700/40'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <EyeOff size={12} />
            {isEn ? 'Hard — no hints' : 'Hard — sans indices'}
          </button>
        </div>
      </div>

      {aboveActionsSlot}

      {/* Start button — or Premium / login / quota upsell when locked */}
      {locked ? (
        lockedVariant === 'login' ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-yellow-400 bg-yellow-900/25 border border-yellow-700/40 rounded-full px-3 py-1">
              <Crown size={12} fill="currentColor" />
              {isEn ? 'Premium module' : 'Module Premium'}
            </div>
            <Link to="/login" className="w-full">
              <Button size="lg" variant="gold" fullWidth>
                <Lock size={16} className="inline mr-2" />
                {isEn ? 'Log in to play' : 'Se connecter pour jouer'}
              </Button>
            </Link>
            <p className="flex items-center gap-1.5 text-xs text-gray-500 text-center">
              <Gift size={11} />
              {isEn
                ? '3 free exercises per day after login — Premium for unlimited access'
                : '3 exercices gratuits par jour après connexion — Premium pour l\'accès illimité'}
            </p>
          </div>
        ) : lockedVariant === 'quota' ? (
          <div className="flex flex-col items-center gap-2">
            <Link to="/premium" className="w-full">
              <Button size="lg" variant="gold" fullWidth>
                <Crown size={16} className="inline mr-2" fill="currentColor" />
                {isEn ? 'Go Premium for unlimited' : 'Passer Premium — accès illimité'}
              </Button>
            </Link>
            <p className="flex items-center gap-1.5 text-xs text-gray-500 text-center">
              <Lock size={11} />
              {isEn
                ? "You've used your 3 free exercises today — come back tomorrow or go Premium"
                : 'Tu as utilisé tes 3 exercices gratuits du jour — reviens demain ou passe Premium'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Link to="/premium" className="w-full">
              <Button size="lg" variant="gold" fullWidth>
                <Crown size={16} className="inline mr-2" fill="currentColor" />
                {isEn ? 'Unlock with Premium' : 'Débloquer avec Premium'}
              </Button>
            </Link>
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <Lock size={11} />
              {isEn
                ? 'This module is reserved for Premium members'
                : 'Ce module est réservé aux membres Premium'}
            </p>
          </div>
        )
      ) : (
        <div className="flex flex-col items-center gap-2">
          {freeInfo && (
            <div className="flex items-center gap-2 text-xs font-medium text-blue-300 bg-blue-900/25 border border-blue-700/40 rounded-full px-3 py-1">
              <Gift size={13} className="text-blue-400" />
              <span>
                {isEn
                  ? `${freeInfo.remaining}/${freeInfo.limit} free exercises left today`
                  : `${freeInfo.remaining}/${freeInfo.limit} exercices gratuits restants aujourd'hui`}
              </span>
            </div>
          )}
          <div className="flex gap-2 w-full">
            <Button size="md" variant="gold" onClick={() => { analytics.moduleStarted(title); onStart(); }} className="flex-1">
              <Play size={16} className="inline mr-2" />
              {startLabel}
            </Button>
            {examSlot}
          </div>
          {bottomSlot}
        </div>
      )}
    </motion.div>
  );
}
