import Fuse from "fuse.js";

/**
 * Fuzzy-matches a requested text against a catalog of service names.
 * @param {string} query - text extracted from customer message (e.g. "logo design")
 * @param {Array<{name: string}>} catalog - list of known services
 * @returns {{ status: "matched"|"ambiguous"|"not_found", match: object|null, candidates: object[] }}
 */
export const fuzzyMatchService = (query, catalog) => {
  if (!query || !catalog?.length) {
    return { status: "not_found", match: null, candidates: [] };
  }

  const fuse = new Fuse(catalog, {
    keys: ["name", "aliases"],
    threshold: 0.35, // lower = stricter match
    includeScore: true,
  });

  const results = fuse.search(query);

  if (results.length === 0) {
    return { status: "not_found", match: null, candidates: [] };
  }

  const best = results[0];
  const secondBest = results[1];

  // If top-2 scores are very close, treat as ambiguous instead of guessing
  const isAmbiguous =
    secondBest && Math.abs(best.score - secondBest.score) < 0.05;

  if (isAmbiguous) {
    return {
      status: "ambiguous",
      match: null,
      candidates: results.slice(0, 3).map((r) => r.item),
    };
  }

  // Score close to 0 = strong match, close to 1 = weak match
  if (best.score <= 0.4) {
    return { status: "matched", match: best.item, candidates: [] };
  }

  return { status: "not_found", match: null, candidates: [] };
};
