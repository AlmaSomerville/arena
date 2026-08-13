import { getOrder } from "@/lib/sortOptions";

const TYPE_VALUES = ["comparative", "superlative", "assertion"];
const MEDIA_VALUES = ["audio", "video"];

/**
 * Applies the multi-select filter chips to a Supabase query builder.
 * Filters within the same "group" (e.g. comparative + superlative) are
 * OR'd together via `.in(...)`; different groups AND together.
 */
export function applyFilters(query, filters) {
  const typeFilters = filters.filter((f) => TYPE_VALUES.includes(f));
  if (typeFilters.length) query = query.in("claim_type", typeFilters);

  const mediaFilters = filters.filter((f) => MEDIA_VALUES.includes(f));
  if (mediaFilters.length) query = query.in("media_type", mediaFilters);

  if (filters.includes("has_references") && !filters.includes("no_references")) {
    query = query.gt("reference_count", 0);
  } else if (filters.includes("no_references") && !filters.includes("has_references")) {
    query = query.eq("reference_count", 0);
  }

  if (filters.includes("has_caveats")) {
    query = query.not("caveats", "eq", "[]");
  }

  return query;
}

export function applyOrder(query, orderKey) {
  const order = getOrder(orderKey);
  return query.order(order.column, { ascending: order.ascending, nullsFirst: false });
}

export function parseFilters(searchParams) {
  return (searchParams.get("filters") || "").split(",").map((s) => s.trim()).filter(Boolean);
}
