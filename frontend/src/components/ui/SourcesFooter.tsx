import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ExternalLink } from 'lucide-react';

export interface Source {
  authors: string;
  title: string;
  year: string;
  note: { fr: string; en: string };
  url?: string | null;
}

interface Props {
  isEn: boolean;
  sources: Source[];
  methodology: { fr: string; en: string };
}

export function SourcesFooter({ isEn, sources, methodology }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-8 rounded-2xl border border-gray-800 overflow-hidden text-xs">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-gray-900/60 hover:bg-gray-800/60 transition-colors text-left"
      >
        <span className="flex items-center gap-2 text-gray-400 font-semibold">
          <BookOpen size={12} className="shrink-0" />
          {isEn ? 'Sources & methodology' : 'Sources & méthodologie'}
        </span>
        <span className="text-gray-600">{open ? '▲' : '▼'}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-4 bg-gray-950/50 border-t border-gray-800 flex flex-col gap-3">
              <p className="text-gray-500 leading-relaxed mb-1">
                {isEn ? methodology.en : methodology.fr}
              </p>
              <div className="flex flex-col gap-2">
                {sources.map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-gray-600 shrink-0 mt-0.5">▸</span>
                    <div>
                      <span className="text-gray-300 font-semibold">{s.authors}</span>
                      {' — '}
                      <span className="text-gray-400 italic">{s.title}</span>
                      {' '}
                      <span className="text-gray-600">({s.year})</span>
                      {' — '}
                      <span className="text-gray-500">{isEn ? s.note.en : s.note.fr}</span>
                      {s.url && (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1.5 inline-flex items-center gap-0.5 text-sky-500 hover:text-sky-400 transition-colors"
                        >
                          <ExternalLink size={9} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
