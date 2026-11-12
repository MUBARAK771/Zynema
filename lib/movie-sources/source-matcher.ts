import type { MovieIdentity } from "./types";

function normalizeTitle(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\b(the|a|an)\b/g, " ")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function removeYearSuffix(value: string) {
  return value
    .replace(/\s*[\[(](?:18|19|20)\d{2}[\])]\s*$/, "")
    .replace(/[,;:\s]+(?:18|19|20)\d{2}\s*$/, "")
    .trim();
}

function parseYear(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const match = String(value).match(/\b((?:18|19|20)\d{2})\b/);
  return match ? match[1] : undefined;
}

export function matchesMovie(
  movie: MovieIdentity,
  candidate: { title: string; year?: unknown },
) {
  const movieYear = parseYear(movie.year);
  const candidateYear = parseYear(candidate.year);

  if (!movieYear || !candidateYear || movieYear !== candidateYear) return false;

  const candidateTitle = normalizeTitle(removeYearSuffix(candidate.title));
  if (!candidateTitle) return false;

  return [movie.title, ...movie.alternativeTitles].some((title) => {
    const normalized = normalizeTitle(title);
    return normalized.length > 0 && normalized === candidateTitle;
  });
}
