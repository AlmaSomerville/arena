"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import VoteButtons from "@/components/VoteButtons";
import MediaPlayer from "@/components/MediaPlayer";
import RelativeTime from "@/components/RelativeTime";
import ClaimCard from "@/components/ClaimCard";
import FilterBar from "@/components/FilterBar";
import ViewTracker from "@/components/ViewTracker";
import { initials } from "@/lib/identity";

const TYPE_LABEL = {
  comparative: "Comparison",
  superlative: "Best / Worst",
  assertion: "Claim",
};

export default function ClaimDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [claim, setClaim] = useState(null);
  const [error, setError] = useState("");
  const [replies, setReplies] = useState(null);
  const [order, setOrder] = useState("highest_voted");
  const [filters, setFilters] = useState([]);

  useEffect(() => {
    fetch(`/api/claims/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setClaim(d.claim);
      })
      .catch(() => setError("Couldn't load this claim."));
  }, [id]);

  useEffect(() => {
    const params = new URLSearchParams({ order });
    if (filters.length) params.set("filters", filters.join(","));
    fetch(`/api/claims/${id}/replies?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setReplies(d.claims || []))
      .catch(() => setReplies([]));
  }, [id, order, filters]);

  function handleOrderChange(v) {
    setReplies(null);
    setOrder(v);
  }

  function handleFiltersChange(v) {
    setReplies(null);
    setFilters(v);
  }

  useEffect(() => {
    if (!replies) return;
    const hash = window.location.hash;
    if (hash?.startsWith("#reply-")) {
      const el = document.getElementById(hash.slice(1));
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [replies]);

  if (error) {
    return (
      <div className="card p-8 text-center mt-6">
        <p className="mb-4" style={{ color: "var(--down)" }}>
          {error}
        </p>
        <Link href="/" className="btn btn-ghost">
          Back to feed
        </Link>
      </div>
    );
  }

  if (!claim) return <DetailSkeleton />;

  const author = claim.users;

  return (
    <div>
      <ViewTracker claimId={claim.id} />

      <div className="card p-5 sm:p-6 fade-in mb-6">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
              style={{ background: author?.avatar_color || "#7C5CFF", color: "#0b0b12" }}
            >
              {initials(author?.nickname)}
            </span>
            <span className="text-sm font-medium truncate">{author?.nickname || "Someone"}</span>
            <span className="text-xs shrink-0" style={{ color: "var(--text-faint)" }}>
              · <RelativeTime date={claim.created_at} />
            </span>
          </div>
          <span className="badge shrink-0" style={{ background: "var(--accent-soft)", color: "#d6cbff" }}>
            {TYPE_LABEL[claim.claim_type]}
          </span>
        </div>

        <h1 className="font-display font-bold text-2xl leading-snug mb-2">{claim.arena_name}</h1>
        <p className="text-base leading-relaxed mb-4" style={{ color: "var(--text-dim)" }}>
          {claim.display_text}
        </p>

        <div className="mb-4">
          <MediaPlayer url={claim.media_url} type={claim.media_type} />
        </div>

        <Breakdown claim={claim} />

        {claim.claim_references?.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-faint)" }}>
              References
            </p>
            <div className="flex flex-col gap-1.5">
              {claim.claim_references.map((r) => (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm truncate hover:underline"
                  style={{ color: "#a9c7ff" }}
                >
                  {r.label || r.url}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <VoteButtons claim={claim} size="lg" />
          <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-faint)" }}>
            <span>{claim.reply_count || 0} replies</span>
            <span>{claim.view_count || 0} views</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => router.push(`/claim/${claim.id}/reply`)}
        className="btn btn-primary w-full py-3.5 mb-8"
      >
        Reply to this claim
      </button>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-bold text-lg">
          {replies ? replies.length : "…"} {replies?.length === 1 ? "Reply" : "Replies"}
        </h2>
      </div>

      <FilterBar order={order} onOrderChange={handleOrderChange} filters={filters} onFiltersChange={handleFiltersChange} />

      {replies === null && (
        <div className="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="card p-5 h-28 animate-pulse" />
          ))}
        </div>
      )}

      {replies && replies.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-sm" style={{ color: "var(--text-dim)" }}>
            No replies yet — be the first to weigh in.
          </p>
        </div>
      )}

      {replies && replies.length > 0 && (
        <div className="flex flex-col gap-3">
          {replies.map((r) => (
            <ClaimCard key={r.id} claim={r} linkable={false} id={`reply-${r.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}

function Breakdown({ claim }) {
  return (
    <div className="card p-4" style={{ background: "var(--bg-elevated)" }}>
      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-faint)" }}>
        Breakdown
      </p>
      <dl className="text-sm flex flex-col gap-1.5">
        <Row label="Applies to" value={claim.scope} />
        {claim.timeframe && <Row label="Timeframe" value={claim.timeframe} />}
        {claim.caveats?.length > 0 && <Row label="Caveats" value={claim.caveats.join("; ")} />}
      </dl>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 w-24" style={{ color: "var(--text-faint)" }}>
        {label}
      </dt>
      <dd style={{ color: "var(--text-dim)" }}>{value}</dd>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="card p-6 h-72 animate-pulse" />
      <div className="card p-5 h-24 animate-pulse" />
    </div>
  );
}
