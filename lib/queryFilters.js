import { getOrder } from "@/lib/sortOptions";

const MEDIA_VALUES = ["audio", "video"];

/**
 * Applies the multi-select filter chips to a Supabase query builder.
 * Different groups AND together.
 */
export function applyFilters(query, filters) {
  const mediaFilters = filters.filter((f) => MEDIA_VALUES.includes(f));
  if (mediaFilters.length) query = query.in("media_type", mediaFilters);

  if (filters.includes("has_references") && !filters.includes("no_references")) {
    query = query.gt("reference_count", 0);
  } else if (filters.includes("no_references") && !filters.includes("has_references")) {
    query = query.eq("reference_count", 0);
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
