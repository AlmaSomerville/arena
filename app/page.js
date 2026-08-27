"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FeedThumbnailCard from "@/components/FeedThumbnailCard";
import FilterBar from "@/components/FilterBar";
import BrowsePrompt from "@/components/BrowsePrompt";
import { getPreferredTopics, getSkipTopicPrompt } from "@/lib/preferences";

export default function FeedPage() {
  const [order, setOrder] = useState("newest");
  const [filters, setFilters] = useState([]);
  const [claims, setClaims] = useState(null);
  const [error, setError] = useState("");

  // Seeded from localStorage via lazy initializers, this is a one-time read
  // of an external value at mount, not a subscription.
  const [preferred, setPreferred] = useState(() => getPreferredTopics());
  const [showPrompt, setShowPrompt] = useState(() => !getSkipTopicPrompt());

  useEffect(() => {
    const params = new URLSearchParams({ order });
    if (filters.length) params.set("filters", filters.join(","));
    if (preferred.length) params.set("preferred", preferred.join(","));
    fetch(`/api/claims?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setClaims(d.claims);
      })
      .catch(() => setError("Couldn't load the feed. Check your connection."));
  }, [order, filters, preferred]);

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
      {showPrompt && (
        <BrowsePrompt
          initialTopics={preferred}
          onSet={(topics) => {
            setPreferred(topics);
            setShowPrompt(false);
          }}
          onDismiss={() => setShowPrompt(false)}
        />
      )}

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
        <div className="flex flex-col gap-1">
          {claims.map((c) => (
            <FeedThumbnailCard key={c.id} claim={c} />
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
        <div key={i} className="card p-5 h-24 animate-pulse" style={{ background: "var(--bg-card)" }} />
      ))}
    </div>
  );
}
