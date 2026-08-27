"use client";

import { useState } from "react";
import { ORDER_OPTIONS, FILTER_OPTIONS } from "@/lib/sortOptions";

export default function FilterBar({ order, onOrderChange, filters, onFiltersChange }) {
  const [open, setOpen] = useState(false);

  function toggleFilter(value) {
    if (filters.includes(value)) {
      onFiltersChange(filters.filter((f) => f !== value));
    } else {
      onFiltersChange([...filters, value]);
    }
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="relative shrink-0">
          <select
            value={order}
            onChange={(e) => onOrderChange(e.target.value)}
            className="btn btn-ghost text-sm appearance-none pr-8 cursor-pointer"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            {ORDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} style={{ background: "#15151f" }}>
                ↕ {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="w-px h-5 shrink-0" style={{ background: "var(--border)" }} />

        <button
          onClick={() => setOpen((v) => !v)}
          className={`btn btn-ghost text-sm shrink-0 ${filters.length ? "active" : ""}`}
        >
          Filters {filters.length ? `(${filters.length})` : ""}
        </button>

        {filters.map((f) => {
          const opt = FILTER_OPTIONS.find((o) => o.value === f);
          if (!opt) return null;
          return (
            <button
              key={f}
              onClick={() => toggleFilter(f)}
              className="btn btn-ghost active text-sm shrink-0"
            >
              {opt.label} ✕
            </button>
          );
        })}
      </div>

      {open && (
        <div className="card p-3 mt-2 fade-in flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => toggleFilter(opt.value)}
              className={`btn btn-ghost text-sm ${filters.includes(opt.value) ? "active" : ""}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
