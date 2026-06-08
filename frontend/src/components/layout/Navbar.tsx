import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { BarChart2, Trophy, BookOpen, Home, LogOut, Crown, ChevronDown, Lock } from 'lucide-react';
import { LanguageToggle } from '../ui/LanguageToggle';
import { ModeToggle } from '../ui/ModeToggle';
import { Tutorial, shouldShowTutorial } from '../tutorial/Tutorial';
import { useT } from '../../i18n';
import { useLangStore } from '../../store/langStore';

// ─── Training modules listed in the dropdown ──────────────────────────────────
const MODULES = [
  { id: 'preflop',   icon: '🎯', labelFr: 'Pré-flop',      labelEn: 'Pre-flop',    premium: false },
  { id: 'outs',      icon: '🎲', labelFr: 'Outs',           labelEn: 'Outs',        premium: false },
  { id: 'equity',    icon: '⚖️', labelFr: 'Équité',         labelEn: 'Equity',      premium: false },
  { id: 'potodds',   icon: '📊', labelFr: 'Pot Odds',       labelEn: 'Pot Odds',    premium: false },
  { id: 'postflop',  icon: '🃏', labelFr: 'Post-flop',      labelEn: 'Post-flop',   premium: true  },
  { id: 'fullhand',  icon: '🎰', labelFr: 'Main complète',  labelEn: 'Full Hand',   premium: true  },
  { id: 'betsizing', icon: '📐', labelFr: 'Bet Sizing',     labelEn: 'Bet Sizing',  premium: true  },
] as const;

export function Navbar() {
  const location  = useLocation();
  const { user, logout } = useAuthStore();
  const t         = useT();
  const isEn      = useLangStore(s => s.lang) === 'en';

  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [dropOpen,     setDropOpen]     = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close dropdown on route change
  useEffect(() => { setDropOpen(false); }, [location.pathname]);

  const isTrainingActive = location.pathname.startsWith('/training');

  const NAV_ITEMS = [
    { path: '/',            label: t.nav.home,              icon: <Home size={16} /> },
    { path: '/rules',       label: isEn ? 'Rules' : 'Règles', icon: <span className="text-sm">📚</span> },
    // Training is rendered separately as a dropdown (see below)
    { path: '/table',       label: isEn ? 'Table' : 'Table',  icon: <span className="text-sm">🃏</span> },
    { path: '/stats',       label: t.nav.stats,             icon: <BarChart2 size={16} /> },
    { path: '/leaderboard', label: t.nav.leaderboard,       icon: <Trophy size={16} /> },
  ];

  const avatarLetter = user?.username?.[0]?.toUpperCase() ?? '?';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-felt-dark/95 backdrop-blur-sm border-b border-felt-900">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl shrink-0">
            <span className="text-2xl">🃏</span>
            <span className="text-gold-400 font-serif hidden sm:block">PokerTrainer</span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1 flex-1 justify-center">

            {/* Home + Rules */}
            {NAV_ITEMS.slice(0, 2).map(item => {
              const isActive = item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}
                  `}
                >
                  {item.icon}
                  <span className="hidden sm:block">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-white/10 rounded-lg -z-10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                </Link>
              );
            })}

            {/* ── Training dropdown ── */}
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setDropOpen(v => !v)}
                className={`
                  relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors select-none
                  ${isTrainingActive ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}
                `}
              >
                {isTrainingActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-white/10 rounded-lg -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <BookOpen size={16} />
                <span className="hidden sm:block">{t.nav.training}</span>
                <ChevronDown
                  size={12}
                  className={`hidden sm:block transition-transform duration-200 ${dropOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {dropOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0,  scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.14 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden py-2"
                  >
                    {/* Free modules */}
                    <p className="px-3 pt-1 pb-1.5 text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                      {isEn ? 'Free' : 'Gratuit'}
                    </p>
                    {MODULES.filter(m => !m.premium).map(mod => {
                      const label = isEn ? mod.labelEn : mod.labelFr;
                      const isActive = location.search.includes(`module=${mod.id}`) && isTrainingActive;
                      return (
                        <Link
                          key={mod.id}
                          to={`/training?module=${mod.id}`}
                          onClick={() => setDropOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 text-sm transition-colors group ${
                            isActive
                              ? 'bg-white/10 text-white'
                              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                          }`}
                        >
                          <span className="text-base leading-none">{mod.icon}</span>
                          <span className="flex-1">{label}</span>
                        </Link>
                      );
                    })}

                    {/* Separator */}
                    <div className="mx-3 my-1.5 border-t border-gray-800" />

                    {/* Premium modules */}
                    <p className="px-3 pb-1.5 text-[10px] font-bold text-yellow-700 uppercase tracking-wider flex items-center gap-1">
                      <Crown size={9} className="text-yellow-600" />
                      {isEn ? 'Premium' : 'Premium'}
                    </p>
                    {MODULES.filter(m => m.premium).map(mod => {
                      const label     = isEn ? mod.labelEn : mod.labelFr;
                      const isLocked  = !user?.isPremium;
                      const isActive  = location.search.includes(`module=${mod.id}`) && isTrainingActive;
                      return (
                        <Link
                          key={mod.id}
                          to={`/training?module=${mod.id}`}
                          onClick={() => setDropOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 text-sm transition-colors group ${
                            isActive
                              ? 'bg-white/10 text-white'
                              : isLocked
                                ? 'text-gray-500 hover:bg-gray-800/60 hover:text-gray-400'
                                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                          }`}
                        >
                          <span className="text-base leading-none">{mod.icon}</span>
                          <span className="flex-1">{label}</span>
                          {isLocked
                            ? <Lock size={11} className="text-yellow-700 shrink-0" />
                            : <Crown size={10} className="text-yellow-500 shrink-0 opacity-60" />
                          }
                        </Link>
                      );
                    })}

                    {/* If not logged in — invite to login */}
                    {!user && (
                      <>
                        <div className="mx-3 my-1.5 border-t border-gray-800" />
                        <Link
                          to="/login"
                          onClick={() => setDropOpen(false)}
                          className="flex items-center justify-center gap-1.5 mx-2 mb-1 py-1.5 rounded-lg bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 text-xs font-semibold transition-colors"
                        >
                          {isEn ? 'Log in for Premium' : 'Connexion pour le Premium'}
                        </Link>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Table, Stats, Leaderboard */}
            {NAV_ITEMS.slice(2).map(item => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}
                  `}
                >
                  {item.icon}
                  <span className="hidden sm:block">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-white/10 rounded-lg -z-10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                </Link>
              );
            })}

          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Tutorial button */}
            <button
              onClick={() => setTutorialOpen(true)}
              className="hidden sm:flex items-center gap-1 text-xs text-gray-500 hover:text-gold-400 transition-colors px-2 py-1 rounded-lg hover:bg-gray-800"
              title={t.nav.tutorial}
            >
              <BookOpen size={13} />
              <span>{t.nav.tutorial}</span>
            </button>

            <ModeToggle />
            <LanguageToggle />

            {user ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-1.5 group"
                  title={isEn ? 'My profile' : 'Mon profil'}
                >
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center text-xs font-black text-gray-900 shadow group-hover:ring-2 group-hover:ring-gold-400 transition-all">
                      {avatarLetter}
                    </div>
                    {user.isPremium && (
                      <div className="absolute -top-2 -right-1 text-yellow-400" style={{ fontSize: 11, lineHeight: 1 }}>
                        <Crown size={11} fill="currentColor" />
                      </div>
                    )}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gold-400 group-hover:text-gold-300 transition-colors">
                    {user.username}
                  </span>
                </Link>

                <button
                  onClick={logout}
                  className="p-1.5 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                  title={isEn ? 'Sign out' : 'Déconnexion'}
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                {t.nav.login}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Tutorial modal */}
      <AnimatePresence>
        {tutorialOpen && <Tutorial onClose={() => setTutorialOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
