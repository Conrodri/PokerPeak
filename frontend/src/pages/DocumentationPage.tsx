import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import DOC_CONTENT from '../docs/DOCUMENTATION.md?raw';

// Internal developer documentation. Deliberately NOT linked from any nav,
// menu, or button anywhere in the app — reachable only by typing the URL
// directly (/documentation). Renders standalone, outside the consumer-facing
// Layout (see App.tsx), so it carries no PokerPeak header/footer/branding.

interface DocSection {
  number: number;
  title: string;
  content: string;
}

// Splits the raw markdown on "## " (H2) boundaries into one entry per
// numbered section ("## 9. Mode Sprint / Exam" → { number: 9, title: "Mode
// Sprint / Exam", content: "..." }). The hand-written "Table des matières"
// section is dropped — the sidebar below replaces it.
function parseSections(raw: string): { intro: string; sections: DocSection[] } {
  const lines = raw.split('\n');
  const h2Indices: number[] = [];
  lines.forEach((line, i) => { if (/^## /.test(line)) h2Indices.push(i); });

  const introEnd = h2Indices.length > 0 ? h2Indices[0] : lines.length;
  const intro = lines.slice(0, introEnd).join('\n');

  const sections: DocSection[] = [];
  for (let k = 0; k < h2Indices.length; k++) {
    const start = h2Indices[k];
    const end = k + 1 < h2Indices.length ? h2Indices[k + 1] : lines.length;
    const heading = lines[start].replace(/^## /, '').trim();
    if (/table des matières/i.test(heading)) continue;

    const match = heading.match(/^(\d+)\.\s*(.+)$/);
    const number = match ? parseInt(match[1], 10) : sections.length + 1;
    const title = match ? match[2] : heading;
    const content = lines.slice(start, end).join('\n');
    sections.push({ number, title, content });
  }
  return { intro, sections };
}

export function DocumentationPage() {
  const { intro, sections } = useMemo(() => parseSections(DOC_CONTENT), []);
  const [activeNumber, setActiveNumber] = useState<number>(sections[0]?.number ?? 1);
  const active = sections.find(s => s.number === activeNumber) ?? sections[0];

  const goToSection = (num: number) => {
    setActiveNumber(num);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  // Internal cross-references like "[§9](#9-mode-sprint--exam)" must switch
  // the visible section instead of anchor-scrolling a page that no longer
  // renders every section at once. External / unrecognized links behave normally.
  const components = {
    a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children?: React.ReactNode }) => {
      const targetNumber = href?.startsWith('#') ? href.match(/^#(\d+)-/)?.[1] : undefined;
      if (targetNumber) {
        return (
          <a
            href={href}
            onClick={e => { e.preventDefault(); goToSection(parseInt(targetNumber, 10)); }}
            {...props}
          >
            {children}
          </a>
        );
      }
      return (
        <a href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel="noreferrer" {...props}>
          {children}
        </a>
      );
    },
  };

  return (
    <div className="min-h-screen bg-[#0a0e14] text-gray-200">
      <header className="border-b border-gray-800 px-4 sm:px-8 py-6">
        <div className="max-w-6xl mx-auto doc-content doc-intro">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{intro}</ReactMarkdown>
        </div>
      </header>

      <div className="max-w-6xl mx-auto md:flex">
        {/* Mobile: native <select> — a fixed 280px sidebar isn't usable at 375px width. */}
        <div className="md:hidden px-4 py-3 border-b border-gray-800">
          <select
            value={activeNumber}
            onChange={e => goToSection(parseInt(e.target.value, 10))}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white"
          >
            {sections.map(s => (
              <option key={s.number} value={s.number}>{s.number}. {s.title}</option>
            ))}
          </select>
        </div>

        {/* Desktop: sticky left sidebar */}
        <nav className="hidden md:block w-72 shrink-0 h-[calc(100vh-4.5rem)] sticky top-0 overflow-y-auto border-r border-gray-800 px-3 py-5">
          <ul className="flex flex-col gap-0.5">
            {sections.map(s => (
              <li key={s.number}>
                <button
                  onClick={() => goToSection(s.number)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                    s.number === activeNumber
                      ? 'bg-amber-900/30 text-amber-300 font-semibold'
                      : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
                  }`}
                >
                  <span className="opacity-50 mr-1.5">{s.number}.</span>{s.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main className="flex-1 min-w-0 px-4 sm:px-8 py-8 sm:py-10">
          <article className="doc-content max-w-3xl">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]} components={components}>
              {active?.content ?? ''}
            </ReactMarkdown>
          </article>
        </main>
      </div>
    </div>
  );
}
