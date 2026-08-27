// Per-device browsing preferences (which topics you're into right now, and
// whether to keep asking). These live in localStorage rather than the
// database - they're a lightweight, per-browser convenience, not something
// that needs to sync across devices or be readable server-side.

const TOPICS_KEY = "arena_preferred_topics";
const SKIP_PROMPT_KEY = "arena_skip_topic_prompt";
const THEME_KEY = "arena_theme";
const BROWSE_PROMPT_INDEX_KEY = "arena_browse_prompt_index";

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore - private browsing / storage disabled, just don't persist
  }
}

export function getPreferredTopics() {
  try {
    const raw = safeGet(TOPICS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setPreferredTopics(slugs) {
  safeSet(TOPICS_KEY, JSON.stringify(slugs || []));
}

export function getSkipTopicPrompt() {
  return safeGet(SKIP_PROMPT_KEY) === "1";
}

export function setSkipTopicPrompt(skip) {
  safeSet(SKIP_PROMPT_KEY, skip ? "1" : "0");
}

// Theme preference: "system" (default, follows the OS), "light", or "dark".
// applyTheme is split out from setTheme so the anti flash-of-wrong-theme
// script in the root layout can call the same logic before React mounts.
export function getTheme() {
  const v = safeGet(THEME_KEY);
  return v === "light" || v === "dark" ? v : "system";
}

export function applyTheme(theme) {
  try {
    if (theme === "light" || theme === "dark") {
      document.documentElement.setAttribute("data-theme", theme);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  } catch {
    // ignore - not running in a browser
  }
}

export function setTheme(theme) {
  safeSet(THEME_KEY, theme);
  applyTheme(theme);
}

// Picks which startup browsing-prompt phrase to show, once per time the
// modal opens (not on a timer while it's open). Rotates through the list in
// order rather than randomly, and the counter persists across separate app
// opens so it keeps moving forward instead of resetting to the same phrase
// every time.
export function nextBrowsePromptIndex(total) {
  const raw = safeGet(BROWSE_PROMPT_INDEX_KEY);
  const current = raw ? parseInt(raw, 10) : -1;
  const next = (Number.isFinite(current) ? current + 1 : 0) % total;
  safeSet(BROWSE_PROMPT_INDEX_KEY, String(next));
  return next;
}
