import { motion } from 'framer-motion';
import { useT } from '../../i18n';

interface Props {
  isCorrect:      boolean;
  correctText?:   string;
  incorrectText?: string;
}

/**
 * Large spring-animated verdict banner shown at the top of every result phase.
 * Green for correct, red for incorrect.
 */
export function VerdictBanner({ isCorrect, correctText, incorrectText }: Props) {
  const t = useT();
  return (
    <motion.div
      initial={{ scale: 0.5 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className={`text-5xl font-black text-center py-4 px-8 rounded-2xl border-2 ${
        isCorrect
          ? 'text-green-400 bg-green-900/30 border-green-700'
          : 'text-red-400 bg-red-900/30 border-red-700'
      }`}
    >
      {isCorrect ? (correctText ?? t.training.correct) : (incorrectText ?? t.training.incorrect)}
    </motion.div>
  );
}
