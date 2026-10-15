// ---------------------------------------------------------------------------
// Decorative divider in the Dark Academia idiom: a gold filigree rule with a
// central diamond/fleuron. Pure CSS + a glyph — no images, so it ships weightless.
// ---------------------------------------------------------------------------

export default function Ornament({
  variant = 'full',
}: {
  variant?: 'full' | 'mini';
}) {
  if (variant === 'mini') {
    return (
      <div className="ornament ornament--mini" aria-hidden>
        <span className="ornament__glyph">❧</span>
      </div>
    );
  }
  return (
    <div className="ornament" aria-hidden>
      <span className="ornament__line" />
      <span className="ornament__star">✦</span>
      <span className="ornament__glyph">❦</span>
      <span className="ornament__star">✦</span>
      <span className="ornament__line" />
    </div>
  );
}
