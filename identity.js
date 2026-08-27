// Nickname-only identity. No passwords, no email — you pick a name once and
// The Arena remembers you via a long-lived cookie. Entering a nickname that
// already exists just signs you back in as that person, which is exactly
// what you want on a small trusted friends/family app (and lets someone
// pick up their identity again on a new device without any account-recovery
// flow).

export const UID_COOKIE = "arena_uid";
export const NICK_COOKIE = "arena_nick";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export const AVATAR_COLORS = [
  "#7C5CFF", // violet
  "#FF5C87", // rose
  "#22C7B5", // teal
  "#FFB03B", // amber
  "#4EA1FF", // sky
  "#FF7A45", // coral
  "#9AE66E", // lime
  "#C084FC", // lilac
];

export function pickAvatarColor(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export function initials(nickname) {
  if (!nickname) return "?";
  const parts = nickname.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function isValidNickname(nickname) {
  return /^[a-zA-Z0-9 _.'-]{2,20}$/.test(nickname || "");
}
