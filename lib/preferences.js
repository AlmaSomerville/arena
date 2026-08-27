// Per-device browsing preferences (which topics you're into right now, and
// whether to keep asking). These live in localStorage rather than the
// database - they're a lightweight, per-browser convenience, not something
// that needs to sync across devices or be readable server-side.

const TOPICS_KEY = "arena_preferred_topics";
const SKIP_PROMPT_KEY = "arena_skip_topic_prompt";

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
