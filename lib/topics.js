// The fixed topic list - mirrors the seed data in supabase/schema.sql (the
// `slug` values must match exactly). Used by the posting flow (pick one),
// the startup "what do you feel like browsing?" prompt (pick up to 10), and
// Settings (edit that selection later).
//
// This lives as a plain JS list rather than being fetched from the DB so
// the browsing-preference prompt can render instantly on load with no
// network round trip - topics change rarely enough that a code deploy to
// update the list is a fine tradeoff.

export const TOPICS = [
  { slug: "politics", label: "Politics" },
  { slug: "history", label: "History" },
  { slug: "philosophy", label: "Philosophy" },
  { slug: "science", label: "Science" },
  { slug: "technology", label: "Technology" },
  { slug: "health", label: "Health & Nutrition" },
  { slug: "food", label: "Food & Drink" },
  { slug: "sports", label: "Sports" },
  { slug: "pop_culture", label: "Pop Culture" },
  { slug: "music", label: "Music" },
  { slug: "movies_tv", label: "Movies & TV" },
  { slug: "books", label: "Books" },
  { slug: "relationships", label: "Relationships" },
  { slug: "parenting", label: "Parenting" },
  { slug: "money", label: "Money & Finance" },
  { slug: "career", label: "Career & Work" },
  { slug: "education", label: "Education" },
  { slug: "religion", label: "Religion & Spirituality" },
  { slug: "environment", label: "Environment" },
  { slug: "law", label: "Law & Justice" },
  { slug: "psychology", label: "Psychology" },
  { slug: "travel", label: "Travel" },
  { slug: "gaming", label: "Gaming" },
  { slug: "ethics", label: "Ethics" },
];

export const MAX_PREFERRED_TOPICS = 10;

export function topicLabel(slug) {
  return TOPICS.find((t) => t.slug === slug)?.label || slug;
}

// A handful of rotating phrasings for the startup browsing-preference
// prompt, so it doesn't feel like the same robotic question every time the
// app opens.
export const BROWSE_PROMPTS = [
  "What do you feel like browsing?",
  "What's on your mind today?",
  "Where should we start?",
  "What are you in the mood to watch?",
  "Pick what sounds good right now.",
  "What do you want to dig into?",
  "Feeling opinionated about anything in particular?",
  "What should fill your feed today?",
  "Anything specific calling to you?",
  "What's worth your time right now?",
  "Where do you want to jump in?",
  "What's catching your interest today?",
];
