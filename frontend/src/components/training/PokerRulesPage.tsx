import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLangStore } from '../../store/langStore';
import { Hand } from '../poker/Card';
import { PokerTable, CLOCKWISE, CLOCKWISE_8, CLOCKWISE_3, CLOCKWISE_HU, POSITION_COLORS } from '../poker/PokerTable';
import { Position, Position8, TableFormat } from '../../types/poker';
import { PokerTerm } from '../ui/PokerTerm';
import { TutorialHand } from '../tutorial/HandTutorialModal';
import { useIsMobile } from '../../hooks/useIsMobile';

// ─── Module detail data ───────────────────────────────────────────────────────

type ModuleModeTexts = { fr: string; en: string };
type ModuleDetail = {
  id: string;
  icon: string;
  accentClass: string;
  borderClass: string;
  label: { fr: string; en: string };
  desc: { fr: string; en: string };
  essence: { fr: string; en: string };
  modes: { basic: ModuleModeTexts; advanced: ModuleModeTexts; expert: ModuleModeTexts };
};

const MODULE_DETAILS: ModuleDetail[] = [
  {
    id: 'preflop', icon: '🎯',
    accentClass: 'text-green-400', borderClass: 'border-green-700/50',
    label: { fr: 'Préflop', en: 'Preflop' },
    desc: { fr: 'Décider fold/raise (ou fold/call/3-bet en BB) selon ta main, ta position et le format de table. Ranges calibrées GTO (solveurs), sur 4 formats (6-max/8-max/3-max/HU) × Cash Game/MTT — 8 variantes de sprint indépendantes.', en: 'Choose fold/raise (or fold/call/3-bet from BB) based on your hand, position and table format. GTO-calibrated ranges (solvers), across 4 formats (6-max/8-max/3-max/HU) × Cash Game/MTT — 8 independent sprint variants.' },
    essence: {
      fr: 'Le pré-flop est la toute première décision de la main : avant même de voir un flop, tu juges si tes 2 cartes valent le coup depuis ta position. Une main jouée depuis la mauvaise position, ou trop souvent, perd de l\'argent sur la durée — même si le poker "se joue après le flop" en apparence. Ce module t\'apprend les ranges GTO : la fréquence à laquelle chaque main doit être jouée pour rester imbattable sur le long terme.',
      en: 'Preflop is the very first decision of the hand: before you even see a flop, you judge whether your 2 cards are worth playing from your position. A hand played from the wrong position, or too often, loses money over time — even though poker seems to be "played after the flop". This module teaches you GTO ranges: the frequency at which each hand should be played to stay unexploitable long-term.',
    },
    modes: {
      basic:    { fr: 'Range GTO affichée. La fréquence de la main et son contexte sont expliqués. Action : Fold ou Raise.', en: 'GTO range displayed. Hand frequency and context explained. Action: Fold or Raise.' },
      advanced: { fr: 'Range masquée. Tes ranges simples de "Mes Ranges" sont utilisées si activées. Jouez à l\'intuition.', en: 'Range hidden. Your simple ranges from "My Ranges" are used if enabled. Play by intuition.' },
      expert:   { fr: 'Format différent : choisis l\'action (Fold/Call/Raise/All-in) puis sa fréquence exacte %, d\'après tes ranges complexes. Aucun indice.', en: 'Different format: pick the action (Fold/Call/Raise/All-in) then its exact frequency %, from your complex ranges. No hints.' },
    },
  },
  {
    id: 'outs', icon: '🎲',
    accentClass: 'text-blue-400', borderClass: 'border-blue-700/50',
    label: { fr: 'Outs', en: 'Outs' },
    desc: { fr: 'Compter les cartes qui améliorent ta main (tirage couleur, quinte, etc.) à partir de tes cartes et du board. Applique ensuite la règle du 2 & 4 pour estimer ton équité sur la prochaine carte.', en: 'Count the cards that improve your hand (flush draw, straight draw, etc.) from your hole cards and the board. Then apply the rule of 2 & 4 to estimate your equity on the next card.' },
    essence: {
      fr: 'Un "out" est une carte encore dans le paquet qui transforme ta main en main gagnante — par exemple, avec un tirage couleur (4 cartes de la même couleur), il reste 9 cartes de cette couleur = 9 outs. Savoir les compter vite, puis appliquer la règle du 2 & 4 (outs × 4 au flop, outs × 2 au turn) pour convertir ce nombre en pourcentage de chances de gagner, est la base de toute décision d\'appel ou de mise sur un tirage.',
      en: 'An "out" is a card still in the deck that turns your hand into a winner — for example, with a flush draw (4 cards of the same suit), 9 cards of that suit remain = 9 outs. Learning to count them fast, then applying the rule of 2 & 4 (outs × 4 on the flop, outs × 2 on the turn) to convert that count into a winning percentage, is the foundation of every call or bet decision on a draw.',
    },
    modes: {
      basic:    { fr: 'Type de tirage indiqué, règle ×2/×4 expliquée. Tu saisis le nombre d\'outs.', en: 'Draw type shown, ×2/×4 rule explained. You enter the number of outs.' },
      advanced: { fr: 'Aucun indice — compte de tête. Réponse en nombre d\'outs. Timer 30 s en sprint.', en: 'No hints — count from scratch. Answer in number of outs. 30 s timer in sprint.' },
      expert:   { fr: 'Question différente : estimer directement l\'équité % (pas les outs). Applique la règle ×2/×4 mentalement. Scénarios plus durs. Timer 30 s.', en: 'Different question: estimate equity % directly (not outs). Apply ×2/×4 rule mentally. Harder scenarios. 30 s timer.' },
    },
  },
  {
    id: 'equity', icon: '⚖️',
    accentClass: 'text-purple-400', borderClass: 'border-purple-700/50',
    label: { fr: 'Équité', en: 'Equity' },
    desc: { fr: 'Calculer l\'équité minimale nécessaire pour rentabiliser un call, à partir du pot et de la mise adverse (Équité = Appel ÷ (Pot + Mise + Appel)). En expert, un bounty de tournoi vient abaisser ce seuil.', en: 'Calculate the minimum equity needed to profitably call, from the pot and villain\'s bet (Equity = Call ÷ (Pot + Bet + Call)). In expert mode, a tournament bounty lowers that threshold.' },
    essence: {
      fr: 'Quand vilain mise, appeler n\'est rentable que si ta chance de gagner (ton équité) dépasse le seuil mathématique imposé par le pot. L\'équité est ta probabilité de remporter la main si elle allait jusqu\'au bout. Ce module t\'apprend à calculer ce seuil minimum — la base mathématique de toute décision de call face à une mise, avant même de parler de pot odds.',
      en: 'When villain bets, calling is only profitable if your chance of winning (your equity) exceeds the mathematical threshold imposed by the pot. Equity is your probability of winning the hand if it went to showdown. This module teaches you to calculate that minimum threshold — the mathematical backbone of every call decision facing a bet, even before talking about pot odds.',
    },
    modes: {
      basic:    { fr: 'Formule d\'équité affichée étape par étape. Explication complète de la décision.', en: 'Equity formula shown step by step. Full explanation of the decision.' },
      advanced: { fr: 'Aucune formule — calculez de tête. Timer 30 s en sprint.', en: 'No formula — calculate mentally. 30 s timer in sprint.' },
      expert:   { fr: 'Scénarios avec bounty KO de tournoi : l\'équité requise intègre la valeur du bounty. Timer 30 s.', en: 'Scenarios with KO tournament bounty: required equity includes bounty value. 30 s timer.' },
    },
  },
  {
    id: 'potodds', icon: '💰',
    accentClass: 'text-cyan-400', borderClass: 'border-cyan-700/50',
    label: { fr: 'Pot Odds', en: 'Pot Odds' },
    desc: { fr: 'Comparer ton équité réelle aux pot odds pour décider call ou fold, avec le calcul d\'EV exact à la clé. En expert, l\'équité n\'est plus donnée — il faut la déduire de tes outs, parfois avec des implied odds.', en: 'Compare your real equity to the pot odds to decide call or fold, with the exact EV calculation behind it. In expert mode equity isn\'t given — you must derive it from your outs, sometimes with implied odds.' },
    essence: {
      fr: 'Les pot odds comparent ce que tu dois payer (l\'appel) à la taille totale du pot : Pot Odds = Mise ÷ (Pot + Mise). En comparant ce ratio à ton équité réelle, tu sais si un call est rentable (+EV) ou perdant (-EV) sur la durée. C\'est l\'outil mathématique le plus utilisé au poker pour arrêter de décider "au feeling" et raisonner en valeur espérée.',
      en: 'Pot odds compare what you must pay (the call) to the total pot size: Pot Odds = Call ÷ (Pot + Call). Comparing this ratio to your real equity tells you whether a call is profitable (+EV) or losing (-EV) over time. It\'s the most-used mathematical tool in poker to stop deciding "on feel" and reason in expected value.',
    },
    modes: {
      basic:    { fr: 'Formule, équité et décomposition EV affichées. Calcul guidé pas à pas.', en: 'Formula, equity and EV breakdown displayed. Guided step-by-step calculation.' },
      advanced: { fr: 'Aucun indice — calculez vous-même. Timer 30 s en sprint.', en: 'No hints — calculate on your own. 30 s timer in sprint.' },
      expert:   { fr: 'L\'équité est masquée : tu dois la calculer mentalement depuis les outs. Spots complexes, calcul mental pur. Timer 30 s.', en: 'Equity is hidden: you must calculate it mentally from your outs. Complex spots, pure mental math. 30 s timer.' },
    },
  },
  {
    id: 'postflop', icon: '🃏',
    accentClass: 'text-rose-400', borderClass: 'border-rose-700/50',
    label: { fr: 'Post-flop', en: 'Post-flop' },
    desc: { fr: 'Analyser la texture du board (sec, mouillé, monotone) et la force de ta main pour choisir entre fold/check/call/bet parmi plusieurs tailles. Scénarios calibrés GTO 6-max 100bb cash game (Premium).', en: 'Analyse board texture (dry, wet, monotone) and your hand strength to choose between fold/check/call/bet across several sizes. Scenarios calibrated on GTO 6-max 100bb cash game (Premium).' },
    essence: {
      fr: 'Après l\'action pré-flop, le donneur place des cartes communes sur la table : c\'est le board. Ta main forte sur un board peut devenir faible sur un autre, et inversement. Ce module t\'apprend à lire la texture (sec, mouillé, dangereux) et à choisir l\'action qui maximise ton gain espéré — plutôt que de jouer uniquement la force brute de tes 2 cartes.',
      en: 'After the preflop action, the dealer places community cards on the table — the board. Your strong hand on one board can become weak on another, and vice versa. This module teaches you to read texture (dry, wet, dangerous) and pick the action that maximises your expected value, rather than just playing the raw strength of your 2 cards.',
    },
    modes: {
      basic:    { fr: 'Force de main, équité et texture du board affichées. Situations lisibles.', en: 'Hand strength, equity and board texture shown. Readable situations.' },
      advanced: { fr: 'Aucun indice. Timer 30 s en sprint.', en: 'No hints. 30 s timer in sprint.' },
      expert:   { fr: 'Boards complexes — aucun indice, aucune équité affichée. Quand villain checke : choix entre Check / Bet 33% / Bet 67% / Bet pot (sizing précis requis). Timer 30 s.', en: 'Complex boards — no hints, no equity shown. When villain checks: choose between Check / Bet 33% / Bet 67% / Bet pot (exact sizing required). 30 s timer.' },
    },
  },
  {
    id: 'betsizing', icon: '📐',
    accentClass: 'text-orange-400', borderClass: 'border-orange-700/50',
    label: { fr: 'Bet Sizing', en: 'Bet Sizing' },
    desc: { fr: 'Choisir le sizing optimal (33% / 55% / 75% / overbet) selon la texture du board et l\'objectif du coup (value, protection, polarisation). Basé sur les mêmes concepts que le module Post-flop.', en: 'Pick the optimal sizing (33% / 55% / 75% / overbet) based on board texture and the goal of the bet (value, protection, polarisation). Built on the same concepts as the Post-flop module.' },
    essence: {
      fr: 'Miser trop petit laisse de la valeur sur la table face à une main forte ; miser trop gros fait fold les mains faibles adverses ou te fait surpayer le risque en cas de bluff raté. Ce module t\'apprend à choisir la bonne taille (25-33% petite, 50-60% médiane, 75-100% grande, 130%+ surenchère) selon ta range, la texture du board et l\'objectif du coup.',
      en: 'Betting too small leaves value on the table against a strong hand; betting too big folds out weaker hands or overpays for the risk on a failed bluff. This module teaches you to pick the right size (25-33% small, 50-60% medium, 75-100% large, 130%+ overbet) based on your range, board texture and the goal of the bet.',
    },
    modes: {
      basic:    { fr: 'Texture du board, type de main et indices clés affichés. Panneau de calcul du sizing fourni.', en: 'Board texture, hand type and key hints shown. Sizing calculation panel provided.' },
      advanced: { fr: 'Aucun indice, décision brute. Timer 30 s en sprint.', en: 'No hints, raw decision. 30 s timer in sprint.' },
      expert:   { fr: 'Questions de fréquence GTO : à quelle fréquence (0%, 33%, 67%, 100%) faut-il miser dans ce spot ? Décision de range, pas seulement de sizing. Timer 30 s.', en: 'GTO frequency questions: how often (0%, 33%, 67%, 100%) should you bet in this spot? Range decision, not just sizing. 30 s timer.' },
    },
  },
  {
    id: 'fullhand', icon: '🎰',
    accentClass: 'text-indigo-400', borderClass: 'border-indigo-700/50',
    label: { fr: 'Main complète', en: 'Full Hand' },
    desc: { fr: 'Jouer une main entière du pré-flop à la river, avec jusqu\'à 4 décisions enchaînées dans un même scénario cohérent. Équité et texture du board affichées à chaque street (Premium).', en: 'Play a full hand from preflop to the river, with up to 4 chained decisions in one coherent scenario. Equity and board texture shown at each street (Premium).' },
    essence: {
      fr: 'Une vraie main de poker s\'étend sur plusieurs rues (pré-flop → flop → turn → river) et chaque décision influence la suivante — impossible de bien jouer la river si le pré-flop était mauvais. Ce module recompose l\'ensemble : tu enchaînes 2 à 4 décisions dans le même scénario cohérent, pour apprendre à raisonner sur toute la main plutôt que street par street isolément.',
      en: 'A real poker hand spans several streets (preflop → flop → turn → river) and every decision shapes the next — you can\'t play the river well if the preflop decision was wrong. This module recreates the whole thing: you chain 2 to 4 decisions in the same coherent scenario, learning to reason across the entire hand rather than street by street in isolation.',
    },
    modes: {
      basic:    { fr: 'Équité et indices de texture affichés à chaque street. Mains favorables (90% in-range).', en: 'Equity and texture hints shown at each street. Favourable hands (90% in-range).' },
      advanced: { fr: 'Aucun indice — immersion totale. Timer 30 s en sprint.', en: 'No hints — full immersion. 30 s timer in sprint.' },
      expert:   { fr: 'Mains complexes multi-rues, aucune aide. À la river : attribution de range à villain (main forte / paire / draw / bluff) avant de choisir ton action. Décisions enchaînées. Timer 30 s.', en: 'Complex multi-street hands, no help. At the river: assign a range category to villain (strong hand / pair / draw / bluff) before choosing your action. Chained decisions. 30 s timer.' },
    },
  },
  {
    id: 'bluff', icon: '🎭',
    accentClass: 'text-pink-400', borderClass: 'border-pink-700/50',
    label: { fr: 'Bluff', en: 'Bluff' },
    desc: { fr: 'Décider de bluffer ou de checker-fold en croisant 4 facteurs : position, texture du board, range adverse estimée et blockers de ta main. Objectif : une fréquence de bluff non-exploitable.', en: 'Decide whether to bluff or check-fold by weighing 4 factors: position, board texture, estimated villain range and your hand\'s blockers. Goal: an unexploitable bluffing frequency.' },
    essence: {
      fr: 'Bluffer, c\'est miser avec une main faible pour faire abandonner une main adverse plus forte. Ce module t\'apprend à juger si un bluff a de bonnes chances de marcher en croisant 4 facteurs concrets — ta position (l\'IP donne plus de fold equity), la texture du board (menaçante = plus de folds), la range estimée du vilain (faible = bonne cible) et tes blockers (un semi-bluff vaut mieux qu\'un bluff pur) — plutôt qu\'à l\'instinct.',
      en: 'Bluffing means betting a weak hand to make a stronger opponent hand fold. This module teaches you to judge whether a bluff is likely to work by weighing 4 concrete factors — your position (IP gives more fold equity), board texture (scarier boards mean more folds), villain\'s estimated range (weak range = good target) and your blockers (a semi-bluff beats pure air) — instead of pure instinct.',
    },
    modes: {
      basic:    { fr: 'Analyse détaillée de chaque facteur (position, texture du board, range adverse, équité) affichée avant de répondre.', en: 'Detailed breakdown of each factor (position, board texture, opponent range, equity) shown before answering.' },
      advanced: { fr: 'Les facteurs s\'affichent seulement après ta réponse — lis le board et le contexte seul. Timer 30 s en sprint.', en: 'Factors only shown after your answer — read the board and context alone. 30 s timer in sprint.' },
      expert:   { fr: 'Aucun indice. Lecture pure de la position, range et dynamique du board. Scénarios OOP inclus. Timer 30 s.', en: 'No hints. Pure read of position, range and board dynamics. OOP scenarios included. 30 s timer.' },
    },
  },
];

const LEVEL_CONFIGS = [
  { key: 'basic'    as const, badge: '🎓', labelFr: 'Débutant', labelEn: 'Basic',    cls: 'text-blue-300 bg-blue-900/20 border-blue-700/40' },
  { key: 'advanced' as const, badge: '⚡', labelFr: 'Avancé',   labelEn: 'Advanced', cls: 'text-yellow-300 bg-yellow-900/20 border-yellow-700/40' },
  { key: 'expert'   as const, badge: '🔥', labelFr: 'Expert',   labelEn: 'Expert',   cls: 'text-red-300 bg-red-900/20 border-red-700/40' },
];

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900/50 rounded-xl px-3 py-2.5 border border-gray-800">
      <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">{title}</h2>
      {children}
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'jeu',      icon: '🃏', fr: 'Le jeu',   en: 'The game'   },
  { id: 'partie',   icon: '🎲', fr: 'Déroulé',  en: 'The hand'   },
  { id: 'table',    icon: '📍', fr: 'La table', en: 'The table'  },
  { id: 'modules',  icon: '🎯', fr: 'Modules',  en: 'Modules'    },
] as const;
type Tab = typeof TABS[number]['id'];

// ─── Interactive table constants ─────────────────────────────────────────────

const POSITION_TIPS: Record<Position8, { fr: string; en: string }> = {
  BTN: {
    fr: 'La meilleure position. Tu agis en DERNIER post-flop — tu vois toutes les actions avant de décider. Range la plus large (~45%). Le jeton D tourne à chaque main.',
    en: 'The best position. You act LAST post-flop — you see all actions before deciding. Widest range (~45%). The D token rotates each hand.',
  },
  SB: {
    fr: 'Position délicate. Tu postes 0.5 BB obligatoire. Tu as un désavantage de position post-flop (tu agis avant BB). Range assez large mais jeu post-flop difficile.',
    en: 'Tricky position. You post 0.5 BB forced. You have a positional disadvantage post-flop (you act before BB). Fairly wide range but tough post-flop play.',
  },
  BB: {
    fr: "Tu as déjà payé 1 BB. Tu es le DERNIER à parler pré-flop, ce qui te donne un avantage pour fermer l'action. Post-flop tu es en OOP (hors position) sauf face au SB.",
    en: 'You already paid 1 BB. You are the LAST to act pre-flop, giving you an advantage to close the action. Post-flop you are OOP (out of position) except vs. SB.',
  },
  UTG: {
    fr: "La pire position. Tu agis en PREMIER sans aucune information sur les autres joueurs. Joue uniquement tes meilleures mains (~15%). Chaque adversaire est encore à parler.",
    en: 'The worst position. You act FIRST with no information on other players. Only play your best hands (~15%). Every opponent still has to act after you.',
  },
  UTG1: {
    fr: "Position très serrée, juste après UTG. Joue des mains solides (~17%). 6 joueurs actent encore après toi — tu n'as presque aucune information.",
    en: 'Very tight position, right after UTG. Play solid hands (~17%). 6 players still act after you — you have almost no information.',
  },
  LJ: {
    fr: "Position intermédiaire (Lojack). Tu peux élargir légèrement ta range (~19%) mais reste discipliné. 5 joueurs actent encore après toi.",
    en: 'Middle position (Lojack). You can widen your range slightly (~19%) but stay disciplined. 5 players still act after you.',
  },
  HJ: {
    fr: "Position intermédiaire, légèrement meilleure qu'UTG. Tu peux jouer quelques mains de plus (~20%) mais reste relativement serré. 3 joueurs actent encore après toi.",
    en: 'Middle position, slightly better than UTG. You can play a few more hands (~20%) but stay relatively tight. 3 players still act after you.',
  },
  CO: {
    fr: 'Bonne position, juste avant le Button. Tu peux voler les blindes régulièrement et jouer une range assez large (~26%). Seulement BTN, SB et BB actent après toi.',
    en: 'Good position, right before the Button. You can steal the blinds regularly and play a fairly wide range (~26%). Only BTN, SB and BB act after you.',
  },
};

const FORMAT_POSITIONS: Record<TableFormat, Position8[]> = {
  '6max': CLOCKWISE as Position8[],
  '8max': CLOCKWISE_8 as Position8[],
  '3max': CLOCKWISE_3 as Position8[],
  'hu':   CLOCKWISE_HU as Position8[],
};

const FORMAT_RANGE_PCT: Record<TableFormat, Partial<Record<Position8, string>>> = {
  '6max': { BTN: '~45%', SB: '~35%', BB: 'Défend', UTG: '~15%', HJ: '~20%', CO: '~26%' },
  '8max': { BTN: '~45%', SB: '~35%', BB: 'Défend', UTG: '~13%', UTG1: '~17%', LJ: '~19%', HJ: '~22%', CO: '~27%' },
  '3max': { BTN: '~50%', SB: '~40%', BB: 'Défend' },
  'hu':   { BTN: '~65%', BB: 'Défend' },
};

const FORMAT_RANGE_PCT_EN: Record<TableFormat, Partial<Record<Position8, string>>> = {
  '6max': { BTN: '~45%', SB: '~35%', BB: 'Defend', UTG: '~15%', HJ: '~20%', CO: '~26%' },
  '8max': { BTN: '~45%', SB: '~35%', BB: 'Defend', UTG: '~13%', UTG1: '~17%', LJ: '~19%', HJ: '~22%', CO: '~27%' },
  '3max': { BTN: '~50%', SB: '~40%', BB: 'Defend' },
  'hu':   { BTN: '~65%', BB: 'Defend' },
};

const TABLE_FORMATS: { id: TableFormat; label: string; players: number }[] = [
  { id: '6max', label: '6-Max', players: 6 },
  { id: '8max', label: '8-Max', players: 8 },
  { id: '3max', label: '3-Max', players: 3 },
  { id: 'hu',   label: 'HU',    players: 2 },
];

type PosGroupDef = { key: string; colorClass: string; dotClass: string; descFr: string; descEn: string };

const FORMAT_GROUPS: Record<TableFormat, PosGroupDef[]> = {
  '6max': [
    { key: 'BTN',       colorClass: 'border-green-700/50 bg-green-900/20 text-green-300',   dotClass: 'bg-green-500',  descFr: 'La meilleure — tu parles en dernier',    descEn: 'The best — you act last' },
    { key: 'CO/HJ',     colorClass: 'border-yellow-700/50 bg-yellow-900/20 text-yellow-300', dotClass: 'bg-yellow-500', descFr: 'Bonnes — tu parles vers la fin',           descEn: 'Good — you act near the end' },
    { key: 'UTG/SB',    colorClass: 'border-red-700/50 bg-red-900/20 text-red-300',          dotClass: 'bg-red-500',    descFr: 'Les moins bonnes — tu parles en premier', descEn: 'The worst — you act first' },
  ],
  '8max': [
    { key: 'BTN',          colorClass: 'border-green-700/50 bg-green-900/20 text-green-300',    dotClass: 'bg-green-500',  descFr: 'La meilleure — tu parles en dernier',    descEn: 'The best — you act last' },
    { key: 'CO/HJ',        colorClass: 'border-yellow-700/50 bg-yellow-900/20 text-yellow-300', dotClass: 'bg-yellow-500', descFr: 'Bonnes — tu parles vers la fin',           descEn: 'Good — you act near the end' },
    { key: 'LJ/UTG1/UTG',  colorClass: 'border-orange-700/50 bg-orange-900/20 text-orange-300', dotClass: 'bg-orange-500', descFr: 'Early — range la plus serrée',            descEn: 'Early — tightest range' },
    { key: 'SB',           colorClass: 'border-red-700/50 bg-red-900/20 text-red-300',          dotClass: 'bg-red-500',    descFr: 'Délicate — hors position post-flop',     descEn: 'Tricky — out of position post-flop' },
  ],
  '3max': [
    { key: 'BTN', colorClass: 'border-green-700/50 bg-green-900/20 text-green-300',   dotClass: 'bg-green-500',  descFr: 'La meilleure — tu parles en dernier',       descEn: 'The best — you act last' },
    { key: 'SB',  colorClass: 'border-yellow-700/50 bg-yellow-900/20 text-yellow-300', dotClass: 'bg-yellow-500', descFr: 'Délicate — hors position post-flop',         descEn: 'Tricky — out of position post-flop' },
    { key: 'BB',  colorClass: 'border-red-700/50 bg-red-900/20 text-red-300',          dotClass: 'bg-red-500',    descFr: 'Défend — poste 1 BB obligatoire',            descEn: 'Defend — posts 1 BB forced' },
  ],
  'hu': [
    { key: 'BTN', colorClass: 'border-green-700/50 bg-green-900/20 text-green-300', dotClass: 'bg-green-500', descFr: 'La meilleure — BTN = SB, tu parles en dernier post-flop', descEn: 'The best — BTN = SB, you act last post-flop' },
    { key: 'BB',  colorClass: 'border-red-700/50 bg-red-900/20 text-red-300',       dotClass: 'bg-red-500',   descFr: 'Défend — poste 1 BB, tu agis en premier post-flop',     descEn: 'Defend — posts 1 BB, you act first post-flop' },
  ],
};

// ─── PokerRulesPage ───────────────────────────────────────────────────────────

export function PokerRulesPage() {
  const isEn = useLangStore(s => s.lang) === 'en';
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [activePos, setActivePos] = useState<Position8>('BTN');
  const [tab, setTab] = useState<Tab>('jeu');
  const [tableFormat, setTableFormat] = useState<TableFormat>('6max');
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const formatPositions = FORMAT_POSITIONS[tableFormat];
  const rangePct = isEn ? FORMAT_RANGE_PCT_EN[tableFormat] : FORMAT_RANGE_PCT[tableFormat];

  function handleFormatChange(fmt: TableFormat) {
    setTableFormat(fmt);
    const pos = FORMAT_POSITIONS[fmt];
    if (!pos.includes(activePos as Position8)) setActivePos(pos[0]);
  }

  const hands = [
    { emoji: '📋', fr: 'Carte haute',        en: 'High card',       descFr: 'La carte la plus haute gagne',           descEn: 'The highest card wins',              cards: ['As', 'Kd'] },
    { emoji: '1️⃣', fr: 'Paire',             en: 'Pair',            descFr: '2 cartes identiques',                   descEn: '2 identical cards',                  cards: ['Ac', 'Ad'] },
    { emoji: '2️⃣', fr: 'Double paire',      en: 'Two pair',        descFr: '2 paires différentes',                  descEn: '2 different pairs',                  cards: ['Jc', 'Jd', '8h', '8s'] },
    { emoji: '3️⃣', fr: 'Brelan',            en: 'Three of a kind', descFr: '3 cartes identiques',                   descEn: '3 identical cards',                  cards: ['Qc', 'Qd', 'Qh'] },
    { emoji: '📈', fr: 'Suite',              en: 'Straight',        descFr: '5 cartes qui se suivent',               descEn: '5 consecutive cards',                cards: ['9d', '8c', '7h', '6s', '5d'] },
    { emoji: '🎨', fr: 'Couleur',            en: 'Flush',           descFr: '5 cartes de même couleur',              descEn: '5 cards of the same suit',           cards: ['Ac', 'Tc', '8c', '5c', '2c'] },
    { emoji: '🏠', fr: 'Full house',         en: 'Full house',      descFr: 'Brelan + paire',                        descEn: 'Three of a kind + pair',             cards: ['Kc', 'Kd', 'Kh', '8c', '8d'] },
    { emoji: '💪', fr: 'Carré',             en: 'Four of a kind',  descFr: '4 cartes identiques',                   descEn: '4 identical cards',                  cards: ['Ac', 'Ad', 'Ah', 'As'] },
    { emoji: '✨', fr: 'Quinte flush',       en: 'Straight flush',  descFr: 'Suite de même couleur',                 descEn: 'Consecutive + same suit',            cards: ['9h', '8h', '7h', '6h', '5h'] },
    { emoji: '🏆', fr: 'Quinte flush royale',en: 'Royal flush',     descFr: 'A-K-Q-J-10 même couleur — imbattable !',descEn: 'A-K-Q-J-10 same suit — unbeatable!', cards: ['As', 'Ks', 'Qs', 'Js', 'Ts'] },
  ] as const;

  const steps = [
    { num: 1, color: 'bg-blue-500',   label: 'Préflop',   descFr: 'Chaque joueur reçoit 2 cartes secrètes. On mise, on suit ou on se couche.', descEn: 'Each player receives 2 secret cards. You bet, call, or fold.' },
    { num: 2, color: 'bg-green-500',  label: 'Flop',      descFr: 'Le croupier pose 3 cartes au milieu. Ces cartes appartiennent à tout le monde.', descEn: 'The dealer places 3 community cards. Everyone shares them.' },
    { num: 3, color: 'bg-yellow-500', label: 'Turn',      descFr: 'Une 4ème carte est posée au milieu. Nouveau tour de mises.', descEn: 'A 4th card is placed in the middle. Another betting round.' },
    { num: 4, color: 'bg-red-500',    label: 'River',     descFr: 'La 5ème et dernière carte. Dernier tour de mises.', descEn: 'The 5th and last card. Final betting round.' },
    { num: 5, color: 'bg-yellow-400', label: 'Showdown',  descFr: 'Les joueurs restants montrent leurs cartes. La meilleure combinaison gagne !', descEn: 'Remaining players show their cards. The best hand wins!' },
  ] as const;

  const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

  return (
    <div className="flex flex-col gap-3 max-w-xl mx-auto">
      {/* Page title */}
      <div className="text-center">
        <h1 className="text-lg font-black text-white">
          📚 {isEn ? 'Poker Rules' : 'Règles du Poker'}
        </h1>
        <p className="text-gray-400 text-xs mt-0.5">
          {isEn ? 'Everything you need to know to get started' : 'Tout ce qu\'il faut savoir pour comprendre le jeu'}
        </p>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 border ${
              tab === t.id
                ? 'bg-yellow-600 border-yellow-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-700'
            }`}
          >
            <span className="leading-none">{t.icon}</span>
            <span>{isEn ? t.en : t.fr}</span>
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.12 }}
          className="flex flex-col gap-2.5"
        >

          {/* ══ LE JEU ══ */}
          {tab === 'jeu' && <>
            <Section title={`🃏 ${isEn ? 'The deck' : 'Le jeu de cartes'}`}>
              <p className="text-[11px] text-gray-400 font-mono bg-gray-800 rounded-lg px-2 py-1 inline-block mb-2">
                52 {isEn ? 'cards' : 'cartes'} = 4 {isEn ? 'suits' : 'couleurs'} × 13 {isEn ? 'ranks' : 'valeurs'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
                {[
                  { sym: '♠', color: 'text-gray-100',  fr: 'Pique',   en: 'Spades'   },
                  { sym: '♥', color: 'text-red-500',   fr: 'Cœur',    en: 'Hearts'   },
                  { sym: '♦', color: 'text-blue-400',  fr: 'Carreau', en: 'Diamonds' },
                  { sym: '♣', color: 'text-green-400', fr: 'Trèfle',  en: 'Clubs'    },
                ].map(s => (
                  <div key={s.sym} className="flex items-center gap-1.5 bg-gray-800/50 rounded-lg px-2 py-1.5 border border-gray-700">
                    <span className={`text-lg leading-none ${s.color}`}>{s.sym}</span>
                    <span className="text-[11px] text-gray-300 font-semibold">{isEn ? s.en : s.fr}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-500 mb-2">
                {isEn ? '4-colour deck: each suit has its own colour.' : 'Jeu 4 couleurs : chaque couleur a sa teinte propre.'}
              </p>
              <p className="text-[11px] text-gray-400 mb-1.5 font-semibold">
                {isEn ? 'Rank order (weakest → strongest)' : 'Ordre des rangs (plus faible → plus fort)'}
              </p>
              <div className="flex flex-wrap gap-1 mb-2">
                {ranks.map(r => (
                  <span key={r} className={`px-1.5 py-0.5 rounded text-[11px] font-bold border ${
                    r === 'A'
                      ? 'bg-yellow-700/40 text-yellow-300 border-yellow-600'
                      : 'bg-gray-800 text-gray-300 border-gray-700'
                  }`}>
                    {r}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-yellow-300">⭐ As (A) = {isEn ? 'strongest card' : 'carte la plus forte'}</p>
            </Section>

            <Section title={`🏆 ${isEn ? 'Hand rankings (weakest → strongest)' : 'Combinaisons (plus faible → plus fort)'}`}>
              <div className="space-y-1">
                {hands.map((h, i) => (
                  <div key={i} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${
                    i === 9 ? 'bg-yellow-900/20 border border-yellow-700/40' : 'bg-gray-800/50'
                  }`}>
                    <span className="text-xs w-4 text-center shrink-0 leading-none">{h.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-white text-[11px]">{isEn ? h.en : h.fr}</span>
                      <span className="text-gray-500 text-[10px] ml-1">— {isEn ? h.descEn : h.descFr}</span>
                    </div>
                    <Hand cards={h.cards as any} size="xs" animate={false} context="display" cardStyle="fourcolor" />
                  </div>
                ))}
              </div>
            </Section>
          </>}

          {/* ══ LA PARTIE (DÉROULÉ) ══ */}
          {tab === 'partie' && (
            <>
            <Section title={`🎲 ${isEn ? 'How a hand plays out' : 'Comment se déroule une partie'}`}>
              <div className="flex flex-col gap-2 mb-3">
                {steps.map(step => {
                  const STEP_TERM: Record<number, string> = { 1: 'preflop', 2: 'flop', 3: 'turn', 4: 'river', 5: 'showdown' };
                  const termId = STEP_TERM[step.num];
                  return (
                    <div key={step.num} className="flex items-start gap-2">
                      <div className={`${step.color} text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5`}>
                        {step.num}
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs">
                          {termId ? <PokerTerm id={termId}>{step.label}</PokerTerm> : step.label}
                        </span>
                        <span className="text-gray-400 text-[11px] ml-1.5">— {isEn ? step.descEn : step.descFr}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-gray-800/60 rounded-lg p-2.5 border border-gray-700">
                <p className="text-[11px] text-gray-400 mb-1.5 font-semibold">
                  {isEn ? 'Example at showdown:' : 'Exemple au showdown :'}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <div>
                    <p className="text-[10px] text-gray-500 mb-1">{isEn ? 'Your hand' : 'Ta main'}</p>
                    <Hand cards={['Ah', 'Kd']} size="xs" animate={false} context="display" cardStyle="fourcolor" />
                  </div>
                  <span className="text-gray-500 font-bold">+</span>
                  <div>
                    <p className="text-[10px] text-gray-500 mb-1">{isEn ? 'Community' : 'Communes'}</p>
                    <Hand cards={['Qs', 'Jc', 'Tc', '2h', '5d']} size="xs" animate={false} context="display" cardStyle="fourcolor" />
                  </div>
                  <span className="text-gray-500">=</span>
                  <span className="text-green-400 font-bold text-xs">
                    {isEn ? '🏆 Straight (A-K-Q-J-T)!' : '🏆 Suite (A-K-Q-J-T) !'}
                  </span>
                </div>
              </div>
            </Section>

            <Section title={isEn ? "🚶 Hand: step by step" : "🚶 Une main pas à pas"}>
              <TutorialHand isEn={isEn} />
            </Section>
            </>
          )}


          {/* ══ LA TABLE ══ */}
          {tab === 'table' && <>
            {/* Format selector */}
            <div className="flex gap-1.5">
              {TABLE_FORMATS.map(f => (
                <button
                  key={f.id}
                  onClick={() => handleFormatChange(f.id)}
                  className={`flex-1 flex flex-col items-center py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    tableFormat === f.id
                      ? 'bg-yellow-600 border-yellow-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                  }`}
                >
                  <span className="font-bold">{f.label}</span>
                  <span className="text-[10px] opacity-70">{f.players} {isEn ? 'players' : 'joueurs'}</span>
                </button>
              ))}
            </div>

            <Section title={`📍 ${isEn ? 'Positions' : 'Les positions'}`}>
              <p className="text-[11px] text-gray-400 mb-2">
                {isEn ? 'Your seat at the table matters a lot!' : 'Ta place à la table est très importante au poker !'}
              </p>
              <div className="flex flex-col gap-1.5 mb-2">
                {FORMAT_GROUPS[tableFormat].map(grp => {
                  const POS_LABEL: Record<string, ReactNode> = {
                    'BTN':        <><PokerTerm id="btn">BTN</PokerTerm> (Button)</>,
                    'CO/HJ':      <><PokerTerm id="co">CO</PokerTerm> / <PokerTerm id="hj">HJ</PokerTerm></>,
                    'UTG/SB':     <><PokerTerm id="utg">UTG</PokerTerm> / <PokerTerm id="sb">SB</PokerTerm></>,
                    'LJ/UTG1/UTG':<>LJ / UTG1 / <PokerTerm id="utg">UTG</PokerTerm></>,
                    'SB':         <><PokerTerm id="sb">SB</PokerTerm></>,
                    'BB':         <><PokerTerm id="bb">BB</PokerTerm></>,
                  };
                  return (
                    <div key={grp.key} className={`rounded-lg p-2 border ${grp.colorClass} flex items-center gap-2`}>
                      <div className={`${grp.dotClass} rounded-full w-2 h-2 shrink-0`} />
                      <span className="font-bold text-xs">{POS_LABEL[grp.key] ?? grp.key}</span>
                      <span className="text-[11px] opacity-70">— {isEn ? grp.descEn : grp.descFr}</span>
                    </div>
                  );
                })}
              </div>
              <div className="bg-green-900/20 border border-green-700/50 rounded-lg px-3 py-1.5">
                <p className="text-green-300 font-bold text-xs">
                  {isEn
                    ? <>✅ <PokerTerm id="ip">In position</PokerTerm> = act LAST = huge advantage!</>
                    : <>✅ <PokerTerm id="ip">En position</PokerTerm> = parler EN DERNIER = gros avantage !</>}
                </p>
              </div>
            </Section>

            <Section title={`🎮 ${isEn ? 'Interactive table' : 'Table interactive'}`}>
              <p className="text-[11px] text-gray-400 mb-2">
                {isEn ? 'Click a seat to see tips for each position.' : 'Clique sur une place pour voir les conseils de chaque position.'}
              </p>

              <div className="mb-2">
                <PokerTable
                  heroPosition={activePos as Position}
                  onPositionChange={(p) => setActivePos(p as Position8)}
                  interactive
                  format={tableFormat}
                  compact={isMobile}
                />
              </div>

              <motion.div
                key={`${tableFormat}-${activePos}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12 }}
                className="rounded-lg px-3 py-2 border mb-2"
                style={{
                  background: `${POSITION_COLORS[activePos]}0f`,
                  borderColor: `${POSITION_COLORS[activePos]}30`,
                }}
              >
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: POSITION_COLORS[activePos] }} />
                  <span className="text-white font-bold text-sm">{activePos}</span>
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full" style={{
                    background: `${POSITION_COLORS[activePos]}22`,
                    color: POSITION_COLORS[activePos],
                    border: `1px solid ${POSITION_COLORS[activePos]}44`,
                  }}>
                    {rangePct[activePos]}
                  </span>
                  {activePos === 'BTN' && <span className="text-[10px] px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded-full">{isEn ? '⬤ Dealer' : '⬤ Donneur'}</span>}
                  {activePos === 'SB'  && <span className="text-[10px] px-1.5 py-0.5 bg-blue-900/50 text-blue-300 rounded-full border border-blue-800">{isEn ? 'Posts ½ BB' : 'Poste ½ BB'}</span>}
                  {activePos === 'BB'  && <span className="text-[10px] px-1.5 py-0.5 bg-red-900/50 text-red-300 rounded-full border border-red-800">{isEn ? 'Posts 1 BB' : 'Poste 1 BB'}</span>}
                </div>
                <p className="text-gray-300 text-xs leading-snug">
                  {isEn ? POSITION_TIPS[activePos].en : POSITION_TIPS[activePos].fr}
                </p>
              </motion.div>

              <div className={`grid gap-1.5 mb-2 ${formatPositions.length <= 3 ? 'grid-cols-3' : formatPositions.length <= 6 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                {formatPositions.map(pos => (
                  <button
                    key={pos}
                    onClick={() => setActivePos(pos)}
                    className={`flex items-center gap-1.5 p-2 rounded-lg border text-left transition-all ${
                      activePos === pos
                        ? 'border-white/20 bg-gray-800/80'
                        : 'border-gray-800 bg-gray-900/30 hover:border-gray-700 hover:bg-gray-900/60'
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: POSITION_COLORS[pos] }} />
                    <div className="min-w-0">
                      <p className="text-white text-[11px] font-bold leading-none">{pos}</p>
                      <p className="text-gray-500 text-[10px] mt-0.5">{rangePct[pos]}</p>
                    </div>
                    {activePos === pos && <div className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: POSITION_COLORS[pos] }} />}
                  </button>
                ))}
              </div>

              <Link to={`/training?module=preflop&tableFormat=${tableFormat}`}>
                <button className="w-full py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5">
                  {isEn ? `Train from ${activePos} (${TABLE_FORMATS.find(f => f.id === tableFormat)?.label}) →` : `S'entraîner depuis ${activePos} (${TABLE_FORMATS.find(f => f.id === tableFormat)?.label}) →`}
                  <ArrowRight size={13} />
                </button>
              </Link>
            </Section>
          </>}

          {/* ══ MODULES ══ */}
          {tab === 'modules' && (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] text-gray-500 px-0.5">
                {isEn
                  ? 'Tap a module to see what each difficulty level trains.'
                  : 'Appuie sur un module pour voir ce que chaque niveau entraîne.'}
              </p>
              {MODULE_DETAILS.map(m => {
                const isOpen = expandedModule === m.id;
                const label = isEn ? m.label.en : m.label.fr;
                return (
                  <div
                    key={m.id}
                    className={`bg-gray-900/50 rounded-xl border transition-colors ${isOpen ? m.borderClass : 'border-gray-800'}`}
                  >
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
                      onClick={() => setExpandedModule(isOpen ? null : m.id)}
                    >
                      <span className="text-sm leading-none shrink-0">{m.icon}</span>
                      <span className={`font-bold text-xs ${isOpen ? m.accentClass : 'text-white'}`}>{label}</span>
                      <span className={`ml-auto text-[10px] text-gray-600 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-3 pb-2.5 flex flex-col gap-2">
                        <p className="text-[11px] text-gray-400 leading-snug">
                          {isEn ? m.desc.en : m.desc.fr}
                        </p>
                        <div className="bg-gray-800/40 rounded-lg px-2.5 py-2 border border-gray-700/50">
                          <p className="text-[10px] font-bold text-gray-300 mb-1 flex items-center gap-1">
                            🎯 {isEn ? 'The goal' : 'Le but'}
                          </p>
                          <p className="text-[11px] text-gray-400 leading-snug">
                            {isEn ? m.essence.en : m.essence.fr}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {LEVEL_CONFIGS.map(lvl => (
                            <div key={lvl.key} className={`rounded-lg px-2.5 py-1.5 border ${lvl.cls}`}>
                              <p className="text-[10px] font-bold mb-0.5">
                                {lvl.badge} {isEn ? lvl.labelEn : lvl.labelFr}
                              </p>
                              <p className="text-[11px] opacity-80 leading-snug">
                                {isEn ? m.modes[lvl.key].en : m.modes[lvl.key].fr}
                              </p>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => navigate(`/training?module=${m.id}`)}
                          className="w-full py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 mt-0.5"
                        >
                          {isEn ? `Train — ${label}` : `S'entraîner — ${label}`}
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
