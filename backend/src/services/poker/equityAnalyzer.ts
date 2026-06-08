import { Card } from '../../types';
import { parseCard, RANK_VALUE } from './cards';

// ─── Types ────────────────────────────────────────────────────────────────────

type Lang = 'fr' | 'en';
type Verbose = 'beginner' | 'advanced';

interface ParsedCard { rank: string; suit: string; value: number; }

interface HandInfo {
  c1: ParsedCard;
  c2: ParsedCard;
  isPair: boolean;
  isSuited: boolean;
  highValue: number;
  lowValue: number;
  gap: number;
}

// ─── Rank names ───────────────────────────────────────────────────────────────

const RANK_FR: Record<number, string> = {
  14:'As', 13:'Roi', 12:'Dame', 11:'Valet', 10:'Dix',
  9:'Neuf', 8:'Huit', 7:'Sept', 6:'Six', 5:'Cinq', 4:'Quatre', 3:'Trois', 2:'Deux',
};
const RANK_EN: Record<number, string> = {
  14:'Ace', 13:'King', 12:'Queen', 11:'Jack', 10:'Ten',
  9:'Nine', 8:'Eight', 7:'Seven', 6:'Six', 5:'Five', 4:'Four', 3:'Three', 2:'Two',
};
const RANK_SYM = (v: number) => ({ 14:'A',13:'K',12:'Q',11:'J',10:'T',9:'9',8:'8',7:'7',6:'6',5:'5',4:'4',3:'3',2:'2' }[v] ?? String(v));
const SUIT_FR: Record<string, string> = { h:'cœur', d:'carreau', c:'trèfle', s:'pique' };
const SUIT_EN: Record<string, string> = { h:'heart', d:'diamond', c:'club',  s:'spade' };
const SUIT_SYM: Record<string, string> = { h:'♥', d:'♦', c:'♣', s:'♠' };

function rn(v: number, lang: Lang) { return lang === 'fr' ? RANK_FR[v] : RANK_EN[v]; }
function rs(v: number) { return RANK_SYM(v); }

// ─── Hand parsing ────────────────────────────────────────────────────────────

function parseHand(hand: [Card, Card]): HandInfo {
  const c1 = parseCard(hand[0]);
  const c2 = parseCard(hand[1]);
  const isPair = c1.rank === c2.rank;
  const isSuited = c1.suit === c2.suit;
  const highValue = Math.max(c1.value, c2.value);
  const lowValue  = Math.min(c1.value, c2.value);
  return { c1, c2, isPair, isSuited, highValue, lowValue, gap: highValue - lowValue };
}

// ─── Board analysis ───────────────────────────────────────────────────────────

interface BoardStatus {
  label: { fr: string; en: string };
  outs: number;
  isAhead: boolean;
  detail: { fr: string; en: string };
}

function analyzeHandOnBoard(hand: HandInfo, board: ParsedCard[]): BoardStatus {
  const handVals = [hand.c1.value, hand.c2.value];
  const handSuits = [hand.c1.suit, hand.c2.suit];
  const boardVals = board.map(c => c.value);
  const allVals = [...handVals, ...boardVals];
  const allSuits = [...handSuits, ...board.map(c => c.suit)];

  // Count how many board cards pair with our hand
  const pairsWithBoard = handVals.filter(v => boardVals.includes(v)).length;

  // Flush draw: 4 of same suit among all 6 cards (hand + board)
  const suitCounts = allSuits.reduce<Record<string, number>>((a, s) => ({ ...a, [s]: (a[s]||0)+1 }), {});
  const maxSuit = Object.keys(suitCounts).find(s => suitCounts[s] === 4 && handSuits.includes(s));
  const hasFlushDraw = !!maxSuit;
  const hasFlush = !!Object.keys(suitCounts).find(s => suitCounts[s] >= 5 && handSuits.includes(s));

  // Straight draw: check 5 consecutive in all vals
  const uniqueVals = [...new Set(allVals)].sort((a,b) => a-b);
  let maxConsec = 1; let curConsec = 1;
  for (let i = 1; i < uniqueVals.length; i++) {
    if (uniqueVals[i] - uniqueVals[i-1] === 1) { curConsec++; maxConsec = Math.max(maxConsec, curConsec); }
    else curConsec = 1;
  }
  const hasOESD = maxConsec === 4;
  // Gutshot: check 4 cards with 1 gap
  let hasGutshot = false;
  for (let start = 2; start <= 10; start++) {
    const needed = [start, start+1, start+2, start+3, start+4];
    const have = needed.filter(n => allVals.includes(n)).length;
    const missing = needed.filter(n => !allVals.includes(n));
    if (have === 4 && missing.length === 1 && missing[0] !== start && missing[0] !== start+4) {
      hasGutshot = true;
    }
  }

  // Three of a kind (set) - hole cards match board card
  const isTripps = handVals[0] === handVals[1]
    ? boardVals.includes(handVals[0])  // pocket pair hit set
    : handVals.filter(v => boardVals.filter(b => b === v).length >= 2).length > 0;

  // Two pair
  const pairs = handVals.filter(v => boardVals.includes(v));
  const isTwoPair = pairs.length === 2 || (pairs.length === 1 && hand.isPair);

  // Overpair (pocket pair higher than all board cards)
  const maxBoard = Math.max(...boardVals);
  const isOverpair = hand.isPair && hand.highValue > maxBoard;

  // Top pair
  const isTopPair = !hand.isPair && pairs.includes(maxBoard);

  // ─── Determine status ───────────────────────────────────────────────────────

  if (hasFlush) {
    return {
      label: { fr: 'Couleur complète ♥', en: 'Completed flush ♥' },
      outs: 0, isAhead: true,
      detail: { fr: `${rs(hand.c1.value)}${SUIT_SYM[hand.c1.suit]}${rs(hand.c2.value)}${SUIT_SYM[hand.c2.suit]} : couleur complète, main très forte.`, en: `${rs(hand.c1.value)}${SUIT_SYM[hand.c1.suit]}${rs(hand.c2.value)}${SUIT_SYM[hand.c2.suit]} : completed flush, very strong hand.` },
    };
  }
  if (isTripps) {
    const tripsVal = hand.isPair ? hand.highValue : handVals.find(v => boardVals.filter(b=>b===v).length>=2)!;
    return {
      label: { fr: `Brelan de ${rs(tripsVal)}`, en: `Three of a kind ${rs(tripsVal)}s` },
      outs: 0, isAhead: true,
      detail: { fr: `Brelan de ${rn(tripsVal,'fr')} — main forte, souvent gagnante.`, en: `Three of a kind ${rn(tripsVal,'en')}s — strong hand, usually winning.` },
    };
  }
  if (isTwoPair) {
    return {
      label: { fr: 'Double paire', en: 'Two pair' },
      outs: 0, isAhead: true,
      detail: { fr: 'Double paire : main solide sur ce board.', en: 'Two pair: solid hand on this board.' },
    };
  }
  if (isOverpair) {
    return {
      label: { fr: `Sur-paire ${rs(hand.highValue)}${rs(hand.highValue)}`, en: `Overpair ${rs(hand.highValue)}${rs(hand.highValue)}` },
      outs: 2, isAhead: true,
      detail: { fr: `Sur-paire de ${rn(hand.highValue,'fr')} — domine toutes les paires inférieures du board.`, en: `Overpair of ${rn(hand.highValue,'en')}s — dominates all lower pairs on the board.` },
    };
  }
  if (isTopPair) {
    return {
      label: { fr: `Paire top (${rs(maxBoard)})`, en: `Top pair (${rs(maxBoard)})` },
      outs: 2, isAhead: true,
      detail: { fr: `Paire top de ${rn(maxBoard,'fr')} — bonne main mais vulnérable aux top pairs avec meilleur kicker.`, en: `Top pair ${rn(maxBoard,'en')} — good hand but vulnerable to top pair better kicker.` },
    };
  }
  if (pairs.length === 1) {
    return {
      label: { fr: `Paire de ${rs(pairs[0])}`, en: `Pair of ${rs(pairs[0])}s` },
      outs: 2, isAhead: false,
      detail: { fr: `Paire de ${rn(pairs[0],'fr')} — main modeste, souvent derrière.`, en: `Pair of ${rn(pairs[0],'en')}s — modest hand, often behind.` },
    };
  }
  if (hasFlushDraw) {
    const suit = maxSuit!;
    return {
      label: { fr: `Tirage couleur ${SUIT_SYM[suit]}`, en: `Flush draw ${SUIT_SYM[suit]}` },
      outs: 9, isAhead: false,
      detail: { fr: `Tirage couleur (9 outs) — ~18% par carte (règle des 2 et 4 : ×2 au turn, ×4 au flop).`, en: `Flush draw (9 outs) — ~18% per card (rule of 2 & 4: ×2 on turn, ×4 on flop).` },
    };
  }
  if (hasOESD) {
    return {
      label: { fr: 'Tirage quinte ouvert (OESD)', en: 'Open-ended straight draw (OESD)' },
      outs: 8, isAhead: false,
      detail: { fr: 'Double tirage quinte (8 outs) — ~32% au flop, ~16% au turn.', en: 'Open-ended straight draw (8 outs) — ~32% on flop, ~16% on turn.' },
    };
  }
  if (hasGutshot) {
    return {
      label: { fr: 'Tirage quinte gutshot', en: 'Gutshot straight draw' },
      outs: 4, isAhead: false,
      detail: { fr: 'Quinte gutshot (4 outs) — ~16% au flop, ~8% au turn. Souvent trop faible seul.', en: 'Gutshot straight draw (4 outs) — ~16% on flop, ~8% on turn. Often too weak alone.' },
    };
  }
  // Overcards
  const overcards = handVals.filter(v => v > maxBoard);
  if (overcards.length > 0) {
    return {
      label: { fr: `${overcards.length} overcard(s)`, en: `${overcards.length} overcard(s)` },
      outs: overcards.length * 3,
      isAhead: false,
      detail: { fr: `${overcards.length} overcard(s) — ${overcards.length*3} outs pour faire une paire supérieure.`, en: `${overcards.length} overcard(s) — ${overcards.length*3} outs to make a superior pair.` },
    };
  }

  return {
    label: { fr: 'Carte haute', en: 'High card' },
    outs: 0, isAhead: false,
    detail: { fr: 'Aucune paire ni tirage — main très faible sur ce board.', en: 'No pair or draw — very weak hand on this board.' },
  };
}

// ─── Pre-flop matchup analysis ───────────────────────────────────────────────

function analyzePreflopMatchup(h1: HandInfo, h2: HandInfo, h1Equity: number, h2Equity: number, lang: Lang, verbose: Verbose): string {
  const l = lang;

  // Both pocket pairs
  if (h1.isPair && h2.isPair) {
    const biggerIdx = h1.highValue > h2.highValue ? 1 : 2;
    const bigger = biggerIdx === 1 ? h1 : h2;
    const smaller = biggerIdx === 1 ? h2 : h1;
    const bigE = biggerIdx === 1 ? h1Equity : h2Equity;
    const smallE = biggerIdx === 1 ? h2Equity : h1Equity;

    if (verbose === 'advanced') {
      return l === 'fr'
        ? `Paire vs paire. ${rs(bigger.highValue)}${rs(bigger.highValue)} a ${bigE}% d'equity contre ${rs(smaller.highValue)}${rs(smaller.highValue)} (${smallE}%).`
        : `Pair vs pair. ${rs(bigger.highValue)}${rs(bigger.highValue)} has ${bigE}% equity vs ${rs(smaller.highValue)}${rs(smaller.highValue)} (${smallE}%).`;
    }

    return l === 'fr'
      ? `**Confrontation Paire vs Paire**\n\n` +
        `La ${rn(bigger.highValue, 'fr')} domine la ${rn(smaller.highValue, 'fr')} : ${bigE}% vs ${smallE}%.\n\n` +
        `Pourquoi ? La plus grande paire gagne si aucune des deux n'améliore sa main. ` +
        `La petite paire a besoin de faire un **brelan** (probabilité ~11% sur 5 cartes) pour renverser la situation. ` +
        `La grande paire a aussi ~11% de chances de faire un brelan, ce qui verouille encore plus son avantage.\n\n` +
        `📌 **Concept clé** : Contre une sur-paire, la seule sortie est le brelan. C'est pourquoi on évite de jouer les petites paires face à des relances importantes.`
      : `**Pair vs Pair Confrontation**\n\n` +
        `${rn(bigger.highValue, 'en')}s dominate ${rn(smaller.highValue, 'en')}s: ${bigE}% vs ${smallE}%.\n\n` +
        `Why? The bigger pair wins if neither hand improves. ` +
        `The smaller pair needs to make a **set** (~11% over 5 cards) to turn things around. ` +
        `The bigger pair also has ~11% chance to make a set, further locking in its advantage.\n\n` +
        `📌 **Key concept**: Against an overpair, the only way out is hitting a set. That's why we avoid playing small pairs facing large raises.`;
  }

  // Pocket pair vs two non-paired cards
  if (h1.isPair !== h2.isPair) {
    const pairH = h1.isPair ? h1 : h2;
    const drawerH = h1.isPair ? h2 : h1;
    const pairE = h1.isPair ? h1Equity : h2Equity;
    const drawE = h1.isPair ? h2Equity : h1Equity;
    const isCoinflip = Math.abs(pairE - drawE) < 20;

    // Overcards to pair
    const overcards = [drawerH.highValue, drawerH.lowValue].filter(v => v > pairH.highValue);

    if (verbose === 'advanced') {
      const label = isCoinflip ? (l === 'fr' ? 'Coinflip' : 'Coinflip') : (l === 'fr' ? 'Domination' : 'Domination');
      return l === 'fr'
        ? `${label}. ${rs(pairH.highValue)}${rs(pairH.highValue)} a ${pairE}% vs ${rs(drawerH.highValue)}${rs(drawerH.lowValue)}${drawerH.isSuited?'s':'o'} (${drawE}%). ${overcards.length === 2 ? '2 overcards.' : overcards.length === 1 ? '1 overcard.' : 'Paire sur-classée.'}`
        : `${label}. ${rs(pairH.highValue)}${rs(pairH.highValue)} has ${pairE}% vs ${rs(drawerH.highValue)}${rs(drawerH.lowValue)}${drawerH.isSuited?'s':'o'} (${drawE}%). ${overcards.length === 2 ? '2 overcards.' : overcards.length === 1 ? '1 overcard.' : 'Pair dominated.'}`;
    }

    if (isCoinflip) {
      const handStr = `${rs(drawerH.highValue)}${rs(drawerH.lowValue)}${drawerH.isSuited?'s':'o'}`;
      const pairStr = `${rs(pairH.highValue)}${rs(pairH.highValue)}`;
      return l === 'fr'
        ? `**Coinflip classique : Paire vs 2 Overcards**\n\n` +
          `${pairStr} a ${pairE}% d'equity contre ${handStr} (${drawE}%).\n\n` +
          `Pourquoi si peu d'avantage pour la paire ? Les deux cartes sont toutes les deux SUPÉRIEURES à la paire. ` +
          `Si l'une des deux overcards fait une paire, la ${pairStr} perd !\n\n` +
          `🎲 **La répartition des gains :**\n` +
          `• La paire gagne si le board ne fait pas une paire aux overcards et qu'il n'y a pas de straight/flush possible.\n` +
          `• Les overcards gagnent si l'une d'elles fait une paire (6 outs × 4 ≈ 24%), ou si elles font une quinte/couleur.\n\n` +
          `📌 **Concept clé** : Ce "coinflip" est l'une des situations les plus fréquentes en tournoi (ex: TT vs AK). La paire est légèrement favorite (~55/45) mais loin d'être dominante.`
        : `**Classic Coinflip: Pair vs 2 Overcards**\n\n` +
          `${pairStr} has ${pairE}% equity vs ${handStr} (${drawE}%).\n\n` +
          `Why such a small edge for the pair? Both cards are HIGHER than the pair. ` +
          `If either overcard pairs up, the ${pairStr} loses!\n\n` +
          `🎲 **How the equity breaks down:**\n` +
          `• The pair wins if the board doesn't pair the overcards and no straight/flush is possible.\n` +
          `• The overcards win if one of them pairs up (6 outs × 4 ≈ 24%), or they make a straight/flush.\n\n` +
          `📌 **Key concept**: This "coinflip" is one of the most common tournament situations (e.g., TT vs AK). The pair is a slight favorite (~55/45) but far from dominant.`;
    }

    // Pair dominates (underpair situation, or overcards don't fully dominate)
    return l === 'fr'
      ? `**Paire contre ${overcards.length === 0 ? 'sous-cartes' : `${overcards.length} overcard${overcards.length>1?'s':''}`}**\n\n` +
        `${rs(pairH.highValue)}${rs(pairH.highValue)} a ${pairE}% d'equity.\n\n` +
        `${overcards.length === 0
          ? `Les deux cartes adverses sont sous la paire. L'adversaire a besoin d'un brelan ou d'une quinte/couleur pour gagner.`
          : `${overcards.length} des cartes adverses est supérieure à la paire. L'overcard a ${6*overcards.length} outs pour faire une paire supérieure.`
        }\n\n📌 La paire est ici nettement favorite.`
      : `**Pair vs ${overcards.length === 0 ? 'undercards' : `${overcards.length} overcard${overcards.length>1?'s':''}`}**\n\n` +
        `${rs(pairH.highValue)}${rs(pairH.highValue)} has ${pairE}% equity.\n\n` +
        `${overcards.length === 0
          ? `Both opponent cards are below the pair. Opponent needs a set or straight/flush to win.`
          : `${overcards.length} of the opponent's cards are above the pair. The overcard has ${6*overcards.length} outs to make a superior pair.`
        }\n\n📌 The pair is a clear favorite here.`;
  }

  // Both unpaired — check for domination
  const shareHigh = h1.highValue === h2.highValue;
  const shareLow  = h1.lowValue  === h2.lowValue;

  if (shareHigh || shareLow) {
    // Dominated hand (e.g., AK vs AQ: share the A)
    const sharedVal = shareHigh ? h1.highValue : h1.lowValue;
    const h1Other = shareHigh ? h1.lowValue : h1.highValue;
    const h2Other = shareHigh ? h2.lowValue : h2.highValue;
    const betterH = h1Other > h2Other ? h1 : h2;
    const worseH  = h1Other > h2Other ? h2 : h1;
    const betterE = h1Other > h2Other ? h1Equity : h2Equity;
    const worseE  = h1Other > h2Other ? h2Equity : h1Equity;

    if (verbose === 'advanced') {
      return l === 'fr'
        ? `Domination par kicker. ${rs(betterH.highValue)}${rs(betterH.lowValue)} a ${betterE}% vs ${rs(worseH.highValue)}${rs(worseH.lowValue)} (${worseE}%).`
        : `Kicker domination. ${rs(betterH.highValue)}${rs(betterH.lowValue)} has ${betterE}% vs ${rs(worseH.highValue)}${rs(worseH.lowValue)} (${worseE}%).`;
    }

    const shared = rs(sharedVal);
    const betterK = rs(h1Other > h2Other ? h1Other : h2Other);
    const worseK  = rs(h1Other > h2Other ? h2Other : h1Other);

    return l === 'fr'
      ? `**Domination par le Kicker**\n\n` +
        `Les deux mains partagent un ${rn(sharedVal,'fr')} (${shared}). La différence ? Le kicker.\n\n` +
        `${shared}${betterK} a ${betterE}% d'equity contre ${shared}${worseK} (${worseE}%).\n\n` +
        `Pourquoi si dominé ? Scénarios pour la main plus faible :\n` +
        `• Si le ${shared} fait une paire → les deux mains ont une paire, mais le kicker de la main forte gagne.\n` +
        `• La main faible gagne uniquement si elle fait une paire avec son kicker (${worseK}) SANS que la main forte ne s'améliore.\n` +
        `• Ou en faisant une quinte / couleur (rare).\n\n` +
        `📌 **Concept clé** : La "domination" est l'une des situations les plus dangereuses au poker — tu peux faire une paire et quand même perdre. C'est pourquoi ${shared}${worseK} doit être joué prudemment face à une relance.`
      : `**Kicker Domination**\n\n` +
        `Both hands share a ${rn(sharedVal,'en')} (${shared}). The difference? The kicker.\n\n` +
        `${shared}${betterK} has ${betterE}% equity vs ${shared}${worseK} (${worseE}%).\n\n` +
        `Why so dominated? Scenarios for the weaker hand:\n` +
        `• If the ${shared} pairs → both hands have a pair, but the stronger hand wins with better kicker.\n` +
        `• The weaker hand only wins if it pairs its kicker (${worseK}) WITHOUT the stronger hand improving.\n` +
        `• Or by making a straight/flush (rare).\n\n` +
        `📌 **Key concept**: "Domination" is one of the most dangerous situations in poker — you can make a pair and still lose. That's why ${shared}${worseK} must be played carefully against a raise.`;
  }

  // General matchup
  const winnerIdx = h1Equity > h2Equity ? 1 : 2;
  const wH = winnerIdx === 1 ? h1 : h2;
  const wE = winnerIdx === 1 ? h1Equity : h2Equity;
  const lE = winnerIdx === 1 ? h2Equity : h1Equity;

  return l === 'fr'
    ? `${rs(wH.highValue)}${rs(wH.lowValue)}${wH.isSuited?'s':'o'} a ${wE}% d'equity (${lE}% pour la main adverse).\n\nLes deux mains sont relativement équilibrées — la valeur des cartes et les possibilités de quinte/couleur déterminent l'avantage.`
    : `${rs(wH.highValue)}${rs(wH.lowValue)}${wH.isSuited?'s':'o'} has ${wE}% equity (${lE}% for the opponent's hand).\n\nBoth hands are relatively balanced — card values and straight/flush possibilities determine the edge.`;
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function generateEquityExplanation(
  hand1: [Card, Card],
  hand2: [Card, Card],
  board: Card[],
  hand1Equity: number,
  hand2Equity: number,
  lang: Lang = 'fr',
  mode: Verbose = 'beginner'
): string {
  const h1 = parseHand(hand1);
  const h2 = parseHand(hand2);
  const parsedBoard = board.map(c => parseCard(c));

  // ── No board: pre-flop analysis ──────────────────────────────────────────
  if (board.length === 0) {
    return analyzePreflopMatchup(h1, h2, hand1Equity, hand2Equity, lang, mode);
  }

  // ── With board: postflop analysis ────────────────────────────────────────
  const b1 = analyzeHandOnBoard(h1, parsedBoard);
  const b2 = analyzeHandOnBoard(h2, parsedBoard);

  const boardStr = board.map(c => {
    const p = parseCard(c);
    return `${rs(p.value)}${SUIT_SYM[p.suit]}`;
  }).join(' ');

  const winner = hand1Equity > hand2Equity ? 1 : 2;
  const winnerBoard = winner === 1 ? b1 : b2;
  const loserBoard  = winner === 1 ? b2 : b1;
  const winnerHand  = winner === 1 ? h1 : h2;
  const loserHand   = winner === 1 ? h2 : h1;
  const winnerEq    = winner === 1 ? hand1Equity : hand2Equity;
  const loserEq     = winner === 1 ? hand2Equity : hand1Equity;

  const wStr = `${rs(winnerHand.c1.value)}${SUIT_SYM[winnerHand.c1.suit]}${rs(winnerHand.c2.value)}${SUIT_SYM[winnerHand.c2.suit]}`;
  const lStr = `${rs(loserHand.c1.value)}${SUIT_SYM[loserHand.c1.suit]}${rs(loserHand.c2.value)}${SUIT_SYM[loserHand.c2.suit]}`;

  if (mode === 'advanced') {
    return lang === 'fr'
      ? `Board : ${boardStr}\n${wStr} (${winnerBoard.label.fr}, ${winnerEq}%) vs ${lStr} (${loserBoard.label.fr}, ${loserEq}%).`
      : `Board: ${boardStr}\n${wStr} (${winnerBoard.label.en}, ${winnerEq}%) vs ${lStr} (${loserBoard.label.en}, ${loserEq}%).`;
  }

  // Verbose beginner explanation
  const rulesOfTwo = (outs: number, cardsLeft: number) => {
    const factor = cardsLeft >= 2 ? 4 : 2;
    return `~${outs * factor}%`;
  };
  const cardsLeft = 5 - board.length;

  if (lang === 'fr') {
    let text = `**Board : ${boardStr}**\n\n`;
    text += `**Main 1 (${wStr})** : ${winnerBoard.label.fr} → ${winnerEq}% d'equity\n`;
    text += `${winnerBoard.detail.fr}\n\n`;
    text += `**Main 2 (${lStr})** : ${loserBoard.label.fr} → ${loserEq}% d'equity\n`;
    text += `${loserBoard.detail.fr}\n\n`;

    if (loserBoard.outs > 0) {
      text += `🎯 **Calcul des outs** : La main 2 a **${loserBoard.outs} outs** pour s'améliorer.\n`;
      text += `Règle des 2 et 4 : ${loserBoard.outs} × ${cardsLeft >= 2 ? 4 : 2} = **${rulesOfTwo(loserBoard.outs, cardsLeft)}** de chances d'amélioration (${cardsLeft} carte${cardsLeft>1?'s':''} restante${cardsLeft>1?'s':''}).\n\n`;
    }

    if (winnerEq > 70) {
      text += `📌 **Conclusion** : La main 1 est nettement favorite. La main 2 est dans une position difficile et dépend de ses outs pour renverser la situation.`;
    } else if (winnerEq > 55) {
      text += `📌 **Conclusion** : La main 1 est favorite mais pas invincible — la main 2 a encore des chances de gagner.`;
    } else {
      text += `📌 **Conclusion** : Situation très serrée ! Les deux mains ont des chances significatives de gagner.`;
    }
    return text;
  }

  // English
  let text = `**Board: ${boardStr}**\n\n`;
  text += `**Hand 1 (${wStr})**: ${winnerBoard.label.en} → ${winnerEq}% equity\n`;
  text += `${winnerBoard.detail.en}\n\n`;
  text += `**Hand 2 (${lStr})**: ${loserBoard.label.en} → ${loserEq}% equity\n`;
  text += `${loserBoard.detail.en}\n\n`;

  if (loserBoard.outs > 0) {
    text += `🎯 **Outs calculation**: Hand 2 has **${loserBoard.outs} outs** to improve.\n`;
    text += `Rule of 2 & 4: ${loserBoard.outs} × ${cardsLeft >= 2 ? 4 : 2} = **${rulesOfTwo(loserBoard.outs, cardsLeft)}** chance of improvement (${cardsLeft} card${cardsLeft>1?'s':''} remaining).\n\n`;
  }

  if (winnerEq > 70) {
    text += `📌 **Conclusion**: Hand 1 is a clear favorite. Hand 2 is in trouble and depends on its outs to turn things around.`;
  } else if (winnerEq > 55) {
    text += `📌 **Conclusion**: Hand 1 is favored but not invincible — Hand 2 still has real chances.`;
  } else {
    text += `📌 **Conclusion**: Very close situation! Both hands have significant chances of winning.`;
  }
  return text;
}
