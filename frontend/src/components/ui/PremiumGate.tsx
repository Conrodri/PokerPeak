import { Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useLangStore } from '../../store/langStore';

interface PremiumGateProps {
  children: React.ReactNode;
}

export function PremiumGate({ children }: PremiumGateProps) {
  const { user } = useAuthStore();
  const lang = useLangStore(s => s.lang);
  const isEn = lang === 'en';

  if (user?.isPremium) return <>{children}</>;

  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Content — visible but non-interactive */}
      <div className="pointer-events-none select-none">
        {children}
      </div>

      {/* Top ribbon — only blocks interactions via pointer-events-none above */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between gap-3 bg-gray-950/85 backdrop-blur-sm border-b border-yellow-800/40 px-4 py-2.5 z-10">
        <div className="flex items-center gap-2 min-w-0">
          <Crown size={14} className="text-yellow-400 shrink-0" />
          <span className="text-yellow-300 text-xs font-bold shrink-0">Premium</span>
          <span className="text-gray-400 text-xs truncate">
            {isEn ? '— preview mode, interactions disabled' : '— mode aperçu, interactions désactivées'}
          </span>
        </div>
        {!user ? (
          <Link
            to="/login"
            className="shrink-0 px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-lg text-xs transition-colors"
          >
            {isEn ? 'Log in' : 'Se connecter'}
          </Link>
        ) : (
          <span className="shrink-0 text-[10px] text-yellow-700 font-semibold">
            👑 {isEn ? 'Upgrade to interact' : 'Upgrade pour interagir'}
          </span>
        )}
      </div>
    </div>
  );
}
