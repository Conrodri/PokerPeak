import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'gold';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  fullWidth?: boolean;
}

const variants = {
  primary: 'bg-felt-600 hover:bg-felt-500 text-white border border-felt-500 shadow-glow-green',
  secondary: 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600',
  danger: 'bg-red-700 hover:bg-red-600 text-white border border-red-600 shadow-glow-red',
  ghost: 'bg-transparent hover:bg-white/10 text-white border border-white/20',
  gold: 'bg-gold-600 hover:bg-gold-500 text-gray-900 border border-gold-500 font-semibold shadow-glow-gold',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-5 py-2.5 text-base rounded-lg',
  lg: 'px-7 py-3.5 text-lg rounded-xl',
  xl: 'px-10 py-4 text-xl rounded-2xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, className = '', children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`
          ${variants[variant]} ${sizes[size]}
          ${fullWidth ? 'w-full' : ''}
          font-medium transition-all duration-150 cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
          ${className}
        `}
        disabled={disabled || loading}
        {...(props as any)}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Chargement...
          </span>
        ) : children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
