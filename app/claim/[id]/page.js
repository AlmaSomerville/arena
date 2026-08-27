"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import GatedMediaPlayer from "@/components/GatedMediaPlayer";
import RelativeTime from "@/components/RelativeTime";
import ClaimCard from "@/components/ClaimCard";
import FilterBar from "@/components/FilterBar";
import ViewTracker from "@/components/ViewTracker";
import { useIdentity } from "@/components/IdentityProvider";
import { initials } from "@/lib/identity";
import { scoreTier } from "@/lib/scoreTiers";

export default function ClaimDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, requireIdentity } = useIdentity();

  const [claim, setClaim] = useState(null);
  const [error, setError] = useState("");
  const [replies, setReplies] = useState(null);
  const [order, setOrder] = useState("highest_voted");
  const [filters, setFilters] = useState([]);
  const [mySide, setMySide] = useState(null);

  useEffect(() => {
    fetch(`/api/claims/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setClaim(d.claim);
      })
      .catch(() => setError("Couldn't load this argument."));

    fetch(`/api/argument-sides?claimId=${id}`)
      .then((r) => r.json())
      .then((d) => setMySide(d.mySide || null))
      .catch(() => {});
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

  // Passed down to the gated player, which calls this once someone picks a
  // side from the end-of-video overlay. Throws on failure so the player can
  // show the error inline in its own overlay.
  async function pickSide(side) {
    const activeUser = user || (await requireIdentity("Pick a nickname to join this argument."));
    if (!activeUser) throw new Error("Pick a nickname to join this argument.");

    const res = await fetch("/api/argument-sides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimId: id, side }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Couldn't lock that in.");
    setMySide(data.mySide);
    setClaim((c) => (c ? { ...c, for_count: data.claim.for_count, against_count: data.claim.against_count } : c));
  }

  function scrollToReplies() {
    document.getElementById("replies-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

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
  const topicLabel = claim.topics?.label;
  const tier = scoreTier((claim.for_count || 0) + (claim.against_count || 0));

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
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={"badge" + (tier.glow ? " font-bold" : "")}
              style={{
                background: tier.bg,
                color: tier.color,
                boxShadow: tier.glow ? `0 0 0 1px ${tier.glow}, 0 2px 14px 0 ${tier.glow}` : undefined,
              }}
            >
              {tier.label}
            </span>
            {topicLabel && (
              <span className="badge" style={{ background: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
                {topicLabel}
              </span>
            )}
          </div>
        </div>

        <h1 className="font-display font-bold text-2xl leading-snug mb-2">{claim.arena_name}</h1>
        {claim.display_text && claim.display_text !== claim.arena_name && (
          <p className="text-base leading-relaxed mb-4" style={{ color: "var(--text-dim)" }}>
            {claim.display_text}
          </p>
        )}

        <div className="mb-4">
          <GatedMediaPlayer
            claimId={claim.id}
            url={claim.media_url}
            type={claim.media_type}
            mySide={mySide}
            onPickSide={pickSide}
            onSeeReplies={scrollToReplies}
          />
        </div>

        {(claim.scope || claim.timeframe || claim.caveats?.length > 0) && (
          <div className="card p-4 mb-2" style={{ background: "var(--bg-elevated)" }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-faint)" }}>
              Breakdown
            </p>
            <dl className="text-sm flex flex-col gap-1.5">
              {claim.scope && <BreakdownRow label="Applies to" value={claim.scope} />}
              {claim.timeframe && <BreakdownRow label="Timeframe" value={claim.timeframe} />}
              {claim.caveats?.length > 0 && <BreakdownRow label="Caveats" value={claim.caveats.join("; ")} />}
            </dl>
          </div>
        )}

        {claim.claim_references?.length > 0 && (
          <div className="mt-2 mb-2">
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

        <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <StandingBar forCount={claim.for_count || 0} againstCount={claim.against_count || 0} mySide={mySide} />
          <div className="flex items-center gap-4 text-xs mt-3" style={{ color: "var(--text-faint)" }}>
            <span>{claim.reply_count || 0} replies</span>
            <span>{claim.view_count || 0} views</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => router.push(`/claim/${claim.id}/reply`)}
        className="btn btn-primary w-full py-3.5 mb-8"
      >
        Reply to this argument
      </button>

      <div className="flex items-center justify-between mb-3">
        <h2 id="replies-heading" className="font-display font-bold text-lg scroll-mt-4">
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
            No replies yet. Be the first to weigh in.
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

function StandingBar({ forCount, againstCount, mySide }) {
  const total = forCount + againstCount;
  const forPct = total > 0 ? Math.round((forCount / total) * 100) : 50;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
          Standing
        </p>
        {mySide && (
          <span className="text-xs font-medium" style={{ color: mySide === "for" ? "var(--up)" : "var(--down)" }}>
            You: {mySide === "for" ? "For" : "Against"}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold shrink-0" style={{ color: "var(--up)" }}>
          {forCount} For
        </span>
        <div className="flex-1 h-2 rounded-full overflow-hidden flex" style={{ background: "var(--down-soft)" }}>
          <div className="h-full" style={{ width: `${forPct}%`, background: "var(--up)" }} />
        </div>
        <span className="text-sm font-semibold shrink-0" style={{ color: "var(--down)" }}>
          {againstCount} Against
        </span>
      </div>
      {!mySide && (
        <p className="text-xs mt-2" style={{ color: "var(--text-faint)" }}>
          Watch the argument through to the end to pick a side.
        </p>
      )}
    </div>
  );
}

function BreakdownRow({ label, value }) {
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
