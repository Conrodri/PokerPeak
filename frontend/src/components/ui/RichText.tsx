/**
 * RichText
 * ────────
 * Renders a string that may contain:
 *   - `\n`  line breaks (renders as paragraph)
 *   - `\n\n` paragraph separators (renders as spacer)
 *   - `**bold**` inline bold spans
 *
 * Works for both single-newline (BBDefense style) and
 * double-newline paragraph (Postflop/FullHand style) texts.
 */
export function RichText({ text }: { text: string }) {
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) => {
        if (line.trim() === '') return <div key={i} className="h-1" />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="text-sm text-gray-300 leading-relaxed">
            {parts.map((part, j) =>
              part.startsWith('**') && part.endsWith('**')
                ? <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>
                : part
            )}
          </p>
        );
      })}
    </div>
  );
}
