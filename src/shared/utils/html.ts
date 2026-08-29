/**
 * Utility to strip HTML tags and Markdown formatting characters from raw entry content.
 * Used for clean text previews in cards, feeds, and search.
 */

export function stripHtml(html: string): string {
  if (!html) return '';

  // 1. Replace line break tags with spaces
  let text = html.replace(/<br\s*\/?>/gi, ' ');
  text = text.replace(/<\/p>/gi, ' ');
  text = text.replace(/<\/h[1-6]>/gi, ' ');

  // 2. Remove all HTML tags
  text = text.replace(/<\/?[a-zA-Z][^>]*>/g, '');

  // 3. Remove common Markdown symbols
  text = text.replace(/[*#`>•\-_]/g, '');

  // 4. Replace HTML entities
  text = text.replace(/&nbsp;/gi, ' ');
  text = text.replace(/&amp;/gi, '&');
  text = text.replace(/&lt;/gi, '<');
  text = text.replace(/&gt;/gi, '>');
  text = text.replace(/&#39;/gi, "'");
  text = text.replace(/&quot;/gi, '"');

  // 5. Normalize whitespace
  return text.replace(/\s+/g, ' ').trim();
}

export function isHtmlContentBlank(html: string): boolean {
  return stripHtml(html).length === 0;
}

export function normalizeHtmlContent(html: string): string {
  return isHtmlContentBlank(html) ? '' : html;
}
