// Simple HTML entities decoder for client-side rendering
// Decodes named, decimal and hex entities (e.g., &amp;, &#34;, &#x2F;)
export const decodeHtmlEntities = (input: string): string => {
  if (!input) return '';
  // Use DOM when available (client side)
  if (typeof window !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = input;
    return textarea.value;
  }
  // Fallback for non-DOM (should rarely hit in our client components)
  let str = input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
  // Decimal entities
  str = str.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
  // Hex entities
  str = str.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  return str;
};

