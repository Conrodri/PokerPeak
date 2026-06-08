import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  label?: string;
  sublabel?: string;
  color?: 'green' | 'gold' | 'red' | 'blue';
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  animate?: boolean;
}

const colors = {
  green: 'from-felt-600 to-felt-400',
  gold: 'from-gold-700 to-gold-400',
  red: 'from-red-700 to-red-500',
  blue: 'from-blue-700 to-blue-500',
};

const heights = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export function ProgressBar({ value, max = 100, label, sublabel, color = 'green', size = 'md', showValue, animate = true }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm text-gray-300">{label}</span>}
          {showValue && <span className="text-sm font-mono text-white">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={`w-full bg-gray-800 rounded-full overflow-hidden ${heights[size]}`}>
        <motion.div
          className={`${heights[size]} bg-gradient-to-r ${colors[color]} rounded-full`}
          initial={animate ? { width: 0 } : { width: `${pct}%` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      {sublabel && <p className="text-xs text-gray-500 mt-1">{sublabel}</p>}
    </div>
  );
}
