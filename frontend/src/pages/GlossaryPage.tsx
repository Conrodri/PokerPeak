import { useState } from 'react';
import { Search } from 'lucide-react';
import { GLOSSARY, GlossaryCategory, GlossaryEntry } from '../data/glossary';
import { useLangStore } from '../store/langStore';

// ─── Category meta ─────────────────────────────────────────────────────────────

const CATEGORIES: { id: GlossaryCategory; fr: string; en: string; emoji: string }[] = [
  { id: 'action',   fr: 'Actions',           en: 'Actions',        emoji: '⚡' },
  { id: 'position', fr: 'Positions',         en: 'Positions',      emoji: '📍' },
  { id: 'concept',  fr: 'Concepts',          en: 'Concepts',       emoji: '🧠' },
  { id: 'strength', fr: 'Force des mains',   en: 'Hand strength',  emoji: '💪' },
  { id: 'street',   fr: 'Streets (phases)',  en: 'Streets',        emoji: '🃏' },
  { id: 'board',    fr: 'Textures de board', en: 'Board textures', emoji: '🎴' },
];

// ─── GlossaryPage ──────────────────────────────────────────────────────────────

export function GlossaryPage() {
  const isEn = useLangStore(s => s.lang) === 'en';
  const [search, setSearch] = useState('');

  const q = search.trim().toLowerCase();

  const filtered = q
    ? GLOSSARY.filter(e =>
        e.id.includes(q) ||
        e.fr.toLowerCase().includes(q) ||
        e.en.toLowerCase().includes(q) ||
        e.definitionFr.toLowerCase().includes(q) ||
        e.definitionEn.toLowerCase().includes(q)
      )
    : null;

  return (
    <div className="flex flex-col gap-2.5 max-w-xl mx-auto">

      {/* Header */}
      <div className="text-center mb-1">
        <h1 className="text-xl font-bold text-white">
          📖 {isEn ? 'Poker Glossary' : 'Lexique Poker'}
        </h1>
        <p className="text-gray-400 mt-1 text-xs">
          {isEn
            ? 'All key terms to understand and master the game'
            : 'Tous les termes clés pour comprendre et maîtriser le jeu'}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={isEn ? 'Search a term…' : 'Rechercher un terme…'}
          className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
        />
      </div>

      {/* Results */}
      {filtered ? (
        /* ── Search mode: flat list ── */
        <div className="flex flex-col gap-3">
          {filtered.length === 0 ? (
            <p className="text-gray-500 text-center py-10">
              {isEn ? 'No results for' : 'Aucun résultat pour'} «&nbsp;{search}&nbsp;»
            </p>
          ) : (
            filtered.map(entry => (
              <EntryCard key={entry.id} entry={entry} isEn={isEn} />
            ))
          )}
        </div>
      ) : (
        /* ── Browse mode: by category ── */
        CATEGORIES.map(cat => {
          const entries = GLOSSARY.filter(e => e.category === cat.id);
          return (
            <div key={cat.id} className="bg-gray-900/50 rounded-xl px-3 py-2.5 border border-gray-800">
              <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                {cat.emoji} {isEn ? cat.en : cat.fr}
                <span className="text-[10px] font-normal text-gray-500 ml-1">
                  ({entries.length})
                </span>
              </h2>
              <div className="flex flex-col gap-1.5">
                {entries.map(entry => (
                  <EntryCard key={entry.id} entry={entry} isEn={isEn} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── Entry card ────────────────────────────────────────────────────────────────

function EntryCard({ entry, isEn }: { entry: GlossaryEntry; isEn: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <button
      onClick={() => setOpen(v => !v)}
      className="w-full text-left bg-gray-800/50 hover:bg-gray-800/80 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-all overflow-hidden"
    >
      <div className="flex items-center justify-between px-2.5 py-1.5 gap-2">
        <p className="text-gold-400 font-bold text-xs">{isEn ? entry.en : entry.fr}</p>
        <span className="text-gray-600 text-[10px] shrink-0">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="px-2.5 pb-2 border-t border-gray-700/50">
          <p className="text-gray-300 text-[11px] leading-relaxed pt-2">
            {isEn ? entry.definitionEn : entry.definitionFr}
          </p>
        </div>
      )}
    </button>
  );
}
