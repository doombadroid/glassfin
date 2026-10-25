/** Lower case with accents stripped, so "subtitulos" finds "Subtítulos". */
export const normalizeSettingsText = (text: string): string =>
  text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/**
 * Whether a settings entry answers the search: every word of the query has
 * to appear in its title or its keywords, in any order. An empty query
 * matches everything.
 */
export const matchesSettingsQuery = (
  entry: { title: string; keywords?: string },
  query: string,
): boolean => {
  const words = normalizeSettingsText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = normalizeSettingsText(
    `${entry.title} ${entry.keywords ?? ""}`,
  );
  return words.every((word) => haystack.includes(word));
};
