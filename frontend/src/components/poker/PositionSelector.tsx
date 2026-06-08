import { motion } from 'framer-motion';
import { Position, POSITION_SHORT, POSITION_DESCRIPTIONS } from '../../types/poker';

interface PositionSelectorProps {
  selected?: Position;
  onChange: (pos: Position) => void;
  disabled?: boolean;
  exclude?: Position[];
}

const POSITIONS: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

const POSITION_COLORS: Record<Position, string> = {
  UTG: 'border-red-700 hover:border-red-500',
  HJ: 'border-yellow-700 hover:border-yellow-500',
  CO: 'border-lime-700 hover:border-lime-500',
  BTN: 'border-green-600 hover:border-green-400',
  SB: 'border-blue-700 hover:border-blue-500',
  BB: 'border-purple-700 hover:border-purple-500',
};

const POSITION_ACTIVE: Record<Position, string> = {
  UTG: 'bg-red-800 border-red-500 shadow-[0_0_12px_rgba(220,38,38,0.5)]',
  HJ: 'bg-yellow-800 border-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.5)]',
  CO: 'bg-lime-800 border-lime-500 shadow-[0_0_12px_rgba(132,204,22,0.5)]',
  BTN: 'bg-green-700 border-green-400 shadow-[0_0_12px_rgba(74,222,128,0.5)]',
  SB: 'bg-blue-800 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]',
  BB: 'bg-purple-800 border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.5)]',
};

export function PositionSelector({ selected, onChange, disabled, exclude = [] }: PositionSelectorProps) {
  const positions = POSITIONS.filter(p => !exclude.includes(p));

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-gray-400 text-center">Choisir une position</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {positions.map(pos => (
          <motion.button
            key={pos}
            onClick={() => !disabled && onChange(pos)}
            whileTap={{ scale: 0.95 }}
            className={`
              px-4 py-2 rounded-xl border-2 text-sm font-bold text-white
              transition-all duration-150 cursor-pointer relative
              ${selected === pos ? POSITION_ACTIVE[pos] : `bg-gray-800 ${POSITION_COLORS[pos]}`}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            title={POSITION_DESCRIPTIONS[pos]}
          >
            {POSITION_SHORT[pos]}
            {selected === pos && (
              <motion.div
                layoutId="position-indicator"
                className="absolute inset-0 rounded-xl ring-2 ring-white/30"
              />
            )}
          </motion.button>
        ))}
      </div>
      {selected && (
        <motion.p
          key={selected}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-gray-400 text-center"
        >
          {POSITION_DESCRIPTIONS[selected]}
        </motion.p>
      )}
    </div>
  );
}
