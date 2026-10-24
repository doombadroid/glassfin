const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/**
 * Plain text of a Jellyfin overview. The server stores overviews as HTML
 * (jellyfin-web renders them as markup), so a biography with links or
 * paragraphs would otherwise show its tags. Line breaks and paragraphs become
 * new lines; a `<` that does not open a tag is left as text.
 */
export const htmlToText = (html: string): string =>
  html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*/gi, "\n\n")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
      if (code[0] !== "#") return NAMED_ENTITIES[code.toLowerCase()] ?? entity;
      const point =
        code[1].toLowerCase() === "x"
          ? Number.parseInt(code.slice(2), 16)
          : Number.parseInt(code.slice(1), 10);
      // fromCodePoint throws past the last code point.
      return point <= 0x10ffff ? String.fromCodePoint(point) : entity;
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/*
 * Truncate a text longer than a certain length
 */
export const tc = (text: string | null | undefined, length = 20) => {
  if (!text) return "";
  return text.length > length ? `${text.substr(0, length)}...` : text;
};
