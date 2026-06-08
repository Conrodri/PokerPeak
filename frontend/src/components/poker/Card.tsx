import { motion } from 'framer-motion';
import { CardStr } from '../../types/poker';
import { parseCard, getRankDisplay, getSuitSymbol } from '../../utils/pokerUtils';
import { useThemeStore, CARD_STYLES, CardStyle } from '../../store/themeStore';

// Re-export so callers can conveniently import CardStyle from here
export type { CardStyle };

interface CardProps {
  card: CardStr;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  faceDown?: boolean;
  animate?: boolean;
  delay?: number;
  className?: string;
  highlighted?: boolean;
  /** Which store preset to resolve when no explicit cardStyle is passed */
  context?: 'training' | 'display';
  /** Explicit override — use this for in-settings previews */
  cardStyle?: CardStyle;
}

// Standard poker card ratio ≈ 0.714 (63.5 × 88.9 mm)
const sizes = {
  xs: { card: 'w-7 h-10',    corner: 'text-[9px]',   center: 'text-lg',   rounded: 'rounded'    },
  sm: { card: 'w-10 h-14',   corner: 'text-[10px]',  center: 'text-2xl',  rounded: 'rounded-md' },
  md: { card: 'w-14 h-20',   corner: 'text-xs',      center: 'text-3xl',  rounded: 'rounded-lg' },
  lg: { card: 'w-20 h-28',   corner: 'text-sm',      center: 'text-5xl',  rounded: 'rounded-xl' },
  xl: { card: 'w-28 h-40',   corner: 'text-base',    center: 'text-6xl',  rounded: 'rounded-xl' },
};

export function Card({
  card,
  size = 'md',
  faceDown,
  animate = true,
  delay = 0,
  className = '',
  highlighted,
  context = 'training',
  cardStyle: cardStyleProp,
}: CardProps) {
  const s = sizes[size];

  // Always read both store values (no conditional hook calls)
  const trainingStyle = useThemeStore(st => st.trainingCardStyle);
  const displayStyle  = useThemeStore(st => st.displayCardStyle);
  const resolvedStyle = cardStyleProp ?? (context === 'display' ? displayStyle : trainingStyle);
  const def = CARD_STYLES[resolvedStyle];

  if (faceDown) {
    return (
      <motion.div
        initial={animate ? { scale: 0.8, opacity: 0 } : undefined}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay, type: 'spring', stiffness: 300 }}
        className={`${s.card} ${s.rounded} bg-gradient-to-br ${def.faceDown} shadow-card relative flex items-center justify-center overflow-hidden ${className}`}
      >
        <div className="absolute inset-[3px] rounded-[2px] border border-white/10 pointer-events-none" />
        <span className="text-white/30 text-base leading-none select-none">♠</span>
      </motion.div>
    );
  }

  const { rank, suit } = parseCard(card);
  const rankStr    = getRankDisplay(rank);
  const suitSym    = getSuitSymbol(suit);
  const textColor  = def.text[suit] ?? 'text-gray-900';
  const borderCls  = highlighted
    ? 'border-2 border-gold-400 shadow-glow-gold'
    : `border ${def.border}`;

  return (
    <motion.div
      initial={animate ? { scale: 0.5, rotateY: 90, opacity: 0 } : undefined}
      animate={{ scale: 1, rotateY: 0, opacity: 1 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 20 }}
      className={`${s.card} ${s.rounded} ${def.cardBg} ${borderCls} shadow-card relative select-none overflow-hidden ${className}`}
    >
      {/* Subtle gloss overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10 pointer-events-none" />

      {/* Top-left corner label */}
      <div className={`absolute top-0.5 left-0.5 flex flex-col items-center leading-none ${textColor} ${s.corner}`}>
        <span className="font-black">{rankStr}</span>
        <span className="-mt-px">{suitSym}</span>
      </div>

      {/* Center: large suit symbol only — rank lives in the corners */}
      <div className={`flex items-center justify-center h-full ${textColor} ${s.center} pointer-events-none`}>
        {suitSym}
      </div>

      {/* Bottom-right corner label (rotated 180°) */}
      <div className={`absolute bottom-0.5 right-0.5 flex flex-col items-center leading-none rotate-180 ${textColor} ${s.corner}`}>
        <span className="font-black">{rankStr}</span>
        <span className="-mt-px">{suitSym}</span>
      </div>
    </motion.div>
  );
}

// ─── Hand: a row of cards ─────────────────────────────────────────────────────

interface HandProps {
  cards: CardStr[];
  size?: CardProps['size'];
  animate?: boolean;
  gap?: string;
  context?: CardProps['context'];
  cardStyle?: CardProps['cardStyle'];
}

export function Hand({
  cards,
  size = 'md',
  animate = true,
  gap = 'gap-2',
  context,
  cardStyle,
}: HandProps) {
  return (
    <div className={`flex ${gap}`}>
      {cards.map((card, i) => (
        <Card
          key={card + i}
          card={card}
          size={size}
          animate={animate}
          delay={i * 0.1}
          context={context}
          cardStyle={cardStyle}
        />
      ))}
    </div>
  );
}
