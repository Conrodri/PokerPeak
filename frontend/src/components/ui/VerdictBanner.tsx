import { motion } from 'framer-motion';
import { useT } from '../../i18n';
import { useLangStore } from '../../store/langStore';

interface Props {
  isCorrect:      boolean;
  /** Right action but wrong frequency (expert quiz): orange "almost" verdict. */
  partial?:       boolean;
  correctText?:   string;
  incorrectText?: string;
}

/**
 * Large spring-animated verdict banner shown at the top of every result phase.
 * Green for correct, orange for "almost" (right action, wrong frequency), red otherwise.
 */
export function VerdictBanner({ isCorrect, partial, correctText, incorrectText }: Props) {
  const t = useT();
  const isEn = useLangStore(s => s.lang) === 'en';
  const showPartial = partial && !isCorrect;
  return (
    <motion.div
      initial={{ scale: 0.5 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className={`text-5xl font-black text-center py-4 px-8 rounded-2xl border-2 ${
        isCorrect
          ? 'text-green-400 bg-green-900/30 border-green-700'
          : showPartial
            ? 'text-orange-400 bg-orange-900/30 border-orange-700'
            : 'text-red-400 bg-red-900/30 border-red-700'
      }`}
    >
      {isCorrect
        ? (correctText ?? t.training.correct)
        : showPartial
          ? (isEn ? 'Almost!' : 'Presque !')
          : (incorrectText ?? t.training.incorrect)}
    </motion.div>
  );
}
