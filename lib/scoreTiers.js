// A purely cosmetic "tier" badge based on an argument's score, separate
// from the title itself (which always stays exactly what the poster wrote).
// Bumps up a level every 10 points, from dismissive at the bottom to
// something to be proud of at the top. Thresholds and wording can change
// later without touching any stored data, since this is computed from
// `score` on the fly.

// `glow` marks the tiers worth showing off, the badge gets a matching
// drop-shadow and a bolder border wherever it's rendered so the top of the
// ladder actually reads as an achievement instead of blending into the
// other pills on the page.
export const SCORE_TIERS = [
  { min: 50, label: "Flawless argument", color: "#1a1406", bg: "#FFD24A", glow: "rgba(255,210,74,0.7)" },
  { min: 40, label: "Compelling", color: "#08211d", bg: "#22c7b5", glow: "rgba(34,199,181,0.55)" },
  { min: 30, label: "Sharp argument", color: "var(--accent-2)", bg: "var(--accent-soft)" },
  { min: 20, label: "Solid case", color: "#4EA1FF", bg: "rgba(78,161,255,0.14)" },
  { min: 10, label: "Getting somewhere", color: "var(--accent-soft-text)", bg: "var(--accent-soft)" },
  { min: 0, label: "Petty", color: "var(--text-dim)", bg: "rgba(255,255,255,0.08)" },
  { min: -5, label: "Not landing", color: "var(--down)", bg: "var(--down-soft)" },
  { min: -Infinity, label: "Widely mocked", color: "var(--down)", bg: "var(--down-soft)" },
];

export function scoreTier(score) {
  const s = score ?? 0;
  return SCORE_TIERS.find((t) => s >= t.min) || SCORE_TIERS[SCORE_TIERS.length - 1];
}
