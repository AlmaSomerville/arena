"use client";

import { useRouter } from "next/navigation";
import VoteButtons from "@/components/VoteButtons";
import MediaPlayer from "@/components/MediaPlayer";
import RelativeTime from "@/components/RelativeTime";
import { initials } from "@/lib/identity";

const STANCE_STYLE = {
  for: { label: "For", color: "var(--up)", bg: "var(--up-soft)" },
  against: { label: "Against", color: "var(--down)", bg: "var(--down-soft)" },
  nuance: { label: "Nuance", color: "#ffb03b", bg: "rgba(255,176,59,0.14)" },
};

export default function ClaimCard({ claim, compact = false, linkable = true, id }) {
  const router = useRouter();
  const author = claim.users;
  const isReply = !!claim.parent_claim_id;
  const stance = isReply ? STANCE_STYLE[claim.stance] : null;
  const topicLabel = claim.topics?.label;

  function goToClaim() {
    if (!linkable) return;
    router.push(`/claim/${isReply ? claim.parent_claim_id : claim.id}${isReply ? `#reply-${claim.id}` : ""}`);
  }

  const interactiveProps = linkable
    ? {
        onClick: goToClaim,
        role: "link",
        tabIndex: 0,
        onKeyDown: (e) => e.key === "Enter" && goToClaim(),
      }
    : {};

  return (
    <div
      id={id}
      {...interactiveProps}
      className={`card fade-in p-4 sm:p-5 ${linkable ? "card-hover cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0"
            style={{ background: author?.avatar_color || "#7C5CFF", color: "#0b0b12" }}
          >
            {initials(author?.nickname)}
          </span>
          <span className="text-sm font-medium truncate" style={{ color: "var(--text-dim)" }}>
            {author?.nickname || "Someone"}
          </span>
          <span className="text-xs shrink-0" style={{ color: "var(--text-faint)" }}>
            · <RelativeTime date={claim.created_at} />
          </span>
        </div>
        {stance ? (
          <span className="badge shrink-0" style={{ background: stance.bg, color: stance.color }}>
            {stance.label}
          </span>
        ) : topicLabel ? (
          <span className="badge shrink-0" style={{ background: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
            {topicLabel}
          </span>
        ) : null}
      </div>

      <h3 className="font-display font-bold text-[1.05rem] leading-snug mb-1.5">{claim.arena_name}</h3>
      {claim.display_text && claim.display_text !== claim.arena_name && (
        <p
          className={`text-sm leading-relaxed mb-3 ${compact ? "line-clamp-2" : "line-clamp-3"}`}
          style={{ color: "var(--text-dim)" }}
        >
          {claim.display_text}
        </p>
      )}

      {!compact && (
        <div onClick={(e) => e.stopPropagation()} className="mb-3">
          <MediaPlayer url={claim.media_url} type={claim.media_type} />
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        {isReply ? (
          <div onClick={(e) => e.stopPropagation()}>
            <VoteButtons claim={claim} />
          </div>
        ) : (
          <ForAgainstBar forCount={claim.for_count || 0} againstCount={claim.against_count || 0} />
        )}
        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-faint)" }}>
          {!isReply && (
            <span className="flex items-center gap-1">
              <Icon name="reply" /> {claim.reply_count || 0}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Icon name="link" /> {claim.reference_count || 0}
          </span>
          <span className="flex items-center gap-1">
            <Icon name="eye" /> {claim.view_count || 0}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ForAgainstBar({ forCount, againstCount }) {
  const total = forCount + againstCount;
  const forPct = total > 0 ? (forCount / total) * 100 : 50;
  return (
    <div className="flex items-center gap-2 min-w-0" style={{ maxWidth: 160 }}>
      <span className="text-xs font-semibold shrink-0" style={{ color: "var(--up)" }}>
        {forCount}
      </span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden flex" style={{ background: "var(--down-soft)", minWidth: 40 }}>
        <div className="h-full" style={{ width: `${forPct}%`, background: "var(--up)" }} />
      </div>
      <span className="text-xs font-semibold shrink-0" style={{ color: "var(--down)" }}>
        {againstCount}
      </span>
    </div>
  );
}

function Icon({ name }) {
  if (name === "reply") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 17l-5-5 5-5M4 12h11a4 4 0 0 1 4 4v1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "link") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          d="M10 13a5 5 0 0 0 7.07 0l2-2a5 5 0 0 0-7.07-7.07l-1 1M14 11a5 5 0 0 0-7.07 0l-2 2a5 5 0 0 0 7.07 7.07l1-1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
