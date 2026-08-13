// Every claim gets a fun, individual "arena name" instead of just showing
// the raw sentence as its title — this is what gives the feed personality
// (e.g. "The Dairy Duel", "Chopra's Throne", "Cheese on Trial").

const ADJECTIVES = [
  "Great", "Grand", "Bold", "Fierce", "Petty", "Eternal", "Absolute",
  "Reluctant", "Unlikely", "Notorious", "Sacred", "Ridiculous", "Solemn",
  "Heated", "Ironclad", "Contested", "Legendary", "Midnight", "Velvet",
  "Blunt",
];

const DUEL_NOUNS = [
  "Duel", "Showdown", "Standoff", "Clash", "Face-Off", "Tug-of-War",
  "Rivalry", "Bout", "Feud",
];

const THRONE_NOUNS = [
  "Throne", "Crown", "Pedestal", "Podium", "Verdict", "Title", "Ranking",
];

const TRIAL_NOUNS = [
  "Trial", "Hearing", "Verdict", "Case", "Reckoning", "Defense", "Inquiry",
];

function hashSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pick(list, seed, salt) {
  return list[(seed + salt) % list.length];
}

/**
 * Generates a display name for a claim from its structured fields.
 * Deterministic-ish per subject text (via a seed) so re-renders don't
 * flicker between names, but still feels varied claim-to-claim.
 */
export function generateArenaName({ claimType, subjectA, subjectB, seed }) {
  const s = hashSeed((seed || subjectA || "") + (subjectB || ""));
  const adj = pick(ADJECTIVES, s, 1);

  if (claimType === "comparative" && subjectB) {
    const noun = pick(DUEL_NOUNS, s, 2);
    return `${subjectA} vs. ${subjectB}: The ${adj} ${noun}`;
  }
  if (claimType === "superlative") {
    const noun = pick(THRONE_NOUNS, s, 3);
    return `${subjectA}'s ${adj} ${noun}`;
  }
  const noun = pick(TRIAL_NOUNS, s, 4);
  return `${subjectA}: The ${adj} ${noun}`;
}

const REPLY_STANCE_LABEL = {
  support: "Backs it up",
  challenge: "Pushes back",
  nuance: "Adds nuance",
};

export function generateReplyName({ stance, subjectA, seed }) {
  const s = hashSeed((seed || subjectA || "") + stance);
  const adj = pick(ADJECTIVES, s, 5);
  const label = REPLY_STANCE_LABEL[stance] || "Responds";
  return `${label}: The ${adj} Rebuttal on ${subjectA}`;
}
