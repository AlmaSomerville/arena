"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ClaimCard from "@/components/ClaimCard";
import FilterBar from "@/components/FilterBar";

export default function FeedPage() {
  const [order, setOrder] = useState("newest");
  const [filters, setFilters] = useState([]);
  const [claims, setClaims] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams({ order });
    if (filters.length) params.set("filters", filters.join(","));
    fetch(`/api/claims?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setClaims(d.claims);
      })
      .catch(() => setError("Couldn't load the feed. Check your connection."));
  }, [order, filters]);

  function handleOrderChange(v) {
    setClaims(null);
    setOrder(v);
  }

  function handleFiltersChange(v) {
    setClaims(null);
    setFilters(v);
  }

  return (
    <div>
      <div className="mb-6 pt-2">
        <h1 className="font-display font-bold text-3xl mb-1.5">The Feed</h1>
        <p className="text-sm" style={{ color: "var(--text-dim)" }}>
          Every claim staked so far. Pick a side.
        </p>
      </div>

      <FilterBar order={order} onOrderChange={handleOrderChange} filters={filters} onFiltersChange={handleFiltersChange} />

      {error && (
        <p className="text-sm py-6 text-center" style={{ color: "var(--down)" }}>
          {error}
        </p>
      )}

      {claims === null && !error && <FeedSkeleton />}

      {claims && claims.length === 0 && (
        <div className="card p-10 text-center fade-in">
          <p className="font-display font-semibold text-lg mb-1.5">The arena is empty.</p>
          <p className="text-sm mb-5" style={{ color: "var(--text-dim)" }}>
            {filters.length ? "Nothing matches those filters yet." : "Be the first to stake a claim."}
          </p>
          {!filters.length && (
            <Link href="/new" className="btn btn-primary">
              Stake the first claim
            </Link>
          )}
        </div>
      )}

      {claims && claims.length > 0 && (
        <div className="flex flex-col gap-3.5">
          {claims.map((c) => (
            <ClaimCard key={c.id} claim={c} compact />
          ))}
        </div>
      )}
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-3.5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="card p-5 h-36 animate-pulse" style={{ background: "var(--bg-card)" }} />
      ))}
    </div>
  );
}
