// Shared sort + filter definitions for the main feed and for a claim's
// reply list. "Order" is single-select (you're picking one ordering).
// "Filters" are multi-select (any combination can be active at once).

export const ORDER_OPTIONS = [
  { value: "newest", label: "Newest first", column: "created_at", ascending: false },
  { value: "oldest", label: "Oldest first", column: "created_at", ascending: true },
  { value: "highest_voted", label: "Highest voted", column: "score", ascending: false },
  { value: "lowest_voted", label: "Lowest voted", column: "score", ascending: true },
  { value: "most_watched", label: "Most watched", column: "view_count", ascending: false },
  { value: "most_replies", label: "Most replied to", column: "reply_count", ascending: false },
  { value: "most_referenced", label: "Most references", column: "reference_count", ascending: false },
];

export const FILTER_OPTIONS = [
  { value: "has_references", label: "Has references" },
  { value: "no_references", label: "No references" },
  { value: "audio", label: "Audio" },
  { value: "video", label: "Video" },
];

export function getOrder(value) {
  return ORDER_OPTIONS.find((o) => o.value === value) || ORDER_OPTIONS[0];
}
