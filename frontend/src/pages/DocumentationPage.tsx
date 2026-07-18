import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import DOC_CONTENT from '../docs/DOCUMENTATION.md?raw';

// Internal developer documentation. Deliberately NOT linked from any nav,
// menu, or button anywhere in the app — reachable only by typing the URL
// directly (/documentation). Renders standalone, outside the consumer-facing
// Layout (see App.tsx), so it carries no PokerPeak header/footer/branding.

export function DocumentationPage() {
  return (
    <div className="min-h-screen bg-[#0a0e14] text-gray-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
        <article className="doc-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>{DOC_CONTENT}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
