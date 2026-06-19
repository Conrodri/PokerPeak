// Concrete, situation-specific coaching hints (distinct from the generic
// "rules of the exercise" panels). These compute the actual numbers for the
// current spot so the player gets a real nudge toward the decision.

/** Minimum equity (%) needed to profitably call a bet, by direct pot odds.
 *  Call cost = bet; final pot = pot + bet + call. Matches the backend formula. */
export function requiredEquityPct(pot: number, bet: number): number {
  if (bet <= 0) return 0;
  return Math.round((bet / (pot + bet + bet)) * 1000) / 10;
}

/** Pot-odds coaching line: plugs the spot's numbers in and frames the compare. */
export function potOddsHint(pot: number, bet: number, equity: number, isEn: boolean): string {
  const req = requiredEquityPct(pot, bet);
  return isEn
    ? `You pay ${bet}bb to try to win a ${pot + bet}bb pot → you need about ${req}% equity for the call to break even. Yours is ${equity}%: if your equity ≥ ${req}% the call is profitable, otherwise fold.`
    : `Tu paies ${bet}bb pour tenter de gagner un pot de ${pot + bet}bb → il te faut environ ${req}% d'équité pour que le call soit rentable. La tienne est de ${equity}% : si ton équité ≥ ${req}% le call est rentable, sinon couche-toi.`;
}

export interface PostflopHintOpts {
  equity: number;
  facingBet: boolean;
  bet: number;
  pot: number;
  isEn: boolean;
  /** 0=high card, 1=pair, 2=two pair, 3=trips, 4=straight, 5=flush, 6=full house, 7=quads, 8=SF */
  handRank?: number;
  /** Label for the hand (e.g. "Paire de rois") */
  handLabel?: string;
  street?: 'flop' | 'turn' | 'river';
  isHeroIP?: boolean;
  /** Does hero have a flush draw or backdoor? */
  hasDraw?: boolean;
}

function margin(equity: number, req: number): 'way_above' | 'above' | 'close' | 'below' | 'way_below' {
  const diff = equity - req;
  if (diff >= 20) return 'way_above';
  if (diff >= 8)  return 'above';
  if (diff >= -4) return 'close';
  if (diff >= -12) return 'below';
  return 'way_below';
}

/** Postflop/full-hand coaching line: actionable, situation-specific advice. */
export function postflopHint(opts: PostflopHintOpts): string {
  const { equity, facingBet, bet, pot, isEn, handRank = 0, handLabel, street, isHeroIP, hasDraw } = opts;

  const isStrong  = handRank >= 2;   // two pair+
  const isMade    = handRank >= 1;   // at least pair
  const isNuts    = handRank >= 4;   // straight+
  const isRiver   = street === 'river';
  const isTurn    = street === 'turn';

  // ─── Facing a bet ───────────────────────────────────────────────────────────
  if (facingBet) {
    const req  = requiredEquityPct(pot, bet);
    const mrg  = margin(equity, req);
    const handStr = handLabel ? `(${handLabel})` : '';

    if (isEn) {
      if (mrg === 'way_above') {
        if (isStrong)
          return `Your equity (${equity}%) is well above the ${req}% required. With a strong hand ${handStr}, raising is the best play — extract value and charge draws.`;
        if (hasDraw)
          return `Your equity (${equity}%) greatly exceeds the ${req}% needed. You have a powerful draw: raise as a semi-bluff to fold out weaker hands and protect your outs.`;
        return `Your equity (${equity}%) is well above the ${req}% required. Call confidently — you're getting a great price.`;
      }
      if (mrg === 'above') {
        if (isStrong)
          return `With ${equity}% equity (required: ${req}%) and a solid hand ${handStr}, calling is correct. Consider a raise if you want to build the pot and are ahead of villain's range.`;
        return `Your ${equity}% equity beats the ${req}% threshold. Call — you have the odds. ${!isRiver && hasDraw ? 'You also have a draw, which adds further implied equity.' : ''}`;
      }
      if (mrg === 'close') {
        if (isStrong)
          return `The price is tight (${equity}% vs ${req}% required), but your hand strength ${handStr} justifies calling. On a wet board, consider raising to deny equity to draws.`;
        if (hasDraw && !isRiver)
          return `Right on the edge (${equity}% vs ${req}%). Your draw adds implied odds — a call can be correct if the pot will grow when you hit.`;
        return `It's borderline: ${equity}% equity vs ${req}% required. Without a strong hand or draw, folding is the safer play here.`;
      }
      if (mrg === 'below') {
        if (isStrong)
          return `Your equity (${equity}%) is below the ${req}% required, but your hand ${handStr} could have strong implied value. Think carefully — if villain has worse hands that pay you off, a call can be valid.`;
        return `Your equity (${equity}%) falls short of the ${req}% needed. Folding is correct — you're not getting the right price to continue.`;
      }
      // way_below
      return `Fold — your equity (${equity}%) is far below the ${req}% required. Continuing here would be a significant loss in expectation.`;
    } else {
      // French
      if (mrg === 'way_above') {
        if (isStrong)
          return `Ton équité (${equity}%) dépasse largement les ${req}% requis. Avec une main forte ${handStr}, le raise est optimal — construis le pot et fais payer les tirages.`;
        if (hasDraw)
          return `Ton équité (${equity}%) dépasse largement les ${req}% nécessaires. Avec un tirage puissant, un raise en semi-bluff est idéal : tu prends le pot si l'adversaire se couche, et tu tiens si tu complètes.`;
        return `Ton équité (${equity}%) est bien au-dessus des ${req}% requis. Call confiant — tu bénéficies d'une excellente cote.`;
      }
      if (mrg === 'above') {
        if (isStrong)
          return `Avec ${equity}% d'équité (requis : ${req}%) et une main solide ${handStr}, le call est la bonne décision. Un raise est envisageable si tu veux construire le pot.`;
        return `Tes ${equity}% dépassent le seuil de ${req}%. Call correct — tu as les cotes. ${!isRiver && hasDraw ? 'Ton tirage ajoute encore de l\'équité implicite.' : ''}`;
      }
      if (mrg === 'close') {
        if (isStrong)
          return `La cote est serrée (${equity}% vs ${req}% requis), mais ta main ${handStr} justifie de continuer. Sur un board dynamique, un raise peut être correct pour nier l'équité aux tirages adverses.`;
        if (hasDraw && !isRiver)
          return `C'est limite (${equity}% vs ${req}%). Ton tirage ajoute des cotes implicites — un call peut être justifié si le pot grossit quand tu complètes.`;
        return `C'est borderline : ${equity}% vs ${req}% requis. Sans main forte ni tirage, le fold est la décision la plus sûre.`;
      }
      if (mrg === 'below') {
        if (isStrong)
          return `Ton équité (${equity}%) est sous les ${req}% requis, mais ta main ${handStr} peut avoir de la valeur implicite. Si l'adversaire peut payer avec pire, un call est parfois justifié.`;
        return `Ton équité (${equity}%) est insuffisante (requis : ${req}%). Le fold est la décision mathématiquement correcte.`;
      }
      // way_below
      return `Couche-toi — ton équité (${equity}%) est bien loin des ${req}% requis. Continuer serait une perte d'espérance significative.`;
    }
  }

  // ─── No bet — hero acts first / after check ─────────────────────────────────
  const handStr = handLabel ? `(${handLabel}) ` : '';

  if (isEn) {
    if (isNuts)
      return `Monster hand ${handStr}(${equity}% equity). Bet for value — you want to build the pot now. Slow-playing risks giving free cards that complete draws against you.`;
    if (isStrong)
      return `Strong hand ${handStr}(${equity}% equity). Bet for value${!isRiver ? ' and to protect against draws' : ''}. Sizing around 40-60% of the pot is standard here.`;
    if (isMade && equity >= 50)
      return `Good made hand ${handStr}(${equity}% equity). Bet for thin value — you're ahead of most of villain's range. ${isHeroIP === false ? 'Being OOP, a bet also limits the info you give away by checking.' : ''}`;
    if (hasDraw && !isRiver)
      return `You have a draw ${handStr}(${equity}% equity). A semi-bluff bet works here: you win when villain folds, and you can hit your draw if called. ${isTurn ? 'On the turn, your draw has fewer cards to come — charge them now.' : ''}`;
    if (equity >= 35)
      return `Decent equity (${equity}%) but no strong made hand. Consider a small bet as a semi-bluff if you have a draw; otherwise check to see a free card.`;
    return `Weak hand ${handStr}(${equity}% equity). Check — a bluff here has little value without equity behind it. ${!isRiver ? 'Wait to see if you improve.' : 'On the river, a bluff needs a very specific read on villain.'}`;
  } else {
    if (isNuts)
      return `Main très forte ${handStr}(${equity}% d'équité). Mise pour la valeur — construis le pot maintenant. Le slow-play risque de donner une carte gratuite qui complète un tirage adverse.`;
    if (isStrong)
      return `Main forte ${handStr}(${equity}% d'équité). Mise pour la valeur${!isRiver ? ' et pour protéger contre les tirages' : ''}. Une taille de mise autour de 40-60% du pot est standard.`;
    if (isMade && equity >= 50)
      return `Bonne main faite ${handStr}(${equity}% d'équité). Mise pour la valeur — tu es devant la majorité de la range adverse. ${isHeroIP === false ? 'Hors position, miser limite aussi l\'information que tu cèdes en checkant.' : ''}`;
    if (hasDraw && !isRiver)
      return `Tu as un tirage ${handStr}(${equity}% d'équité). Un semi-bluff est efficace ici : tu gagnes si l'adversaire se couche, et tu peux compléter si il appelle. ${isTurn ? 'Au turn, il reste moins de cartes à venir — fais-le payer maintenant.' : ''}`;
    if (equity >= 35)
      return `Équité correcte (${equity}%) sans main faite forte. Envisage une petite mise en semi-bluff si tu as un tirage ; sinon checke pour voir une carte gratuite.`;
    return `Main faible ${handStr}(${equity}% d'équité). Checke — un bluff ici manque d'équité. ${!isRiver ? 'Attends d\'améliorer ta main.' : 'En river, un bluff nécessite une lecture très précise de l\'adversaire.'}`;
  }
}
