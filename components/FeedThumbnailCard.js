"use client";

import { useRouter } from "next/navigation";
import RelativeTime from "@/components/RelativeTime";
import { ForAgainstBar } from "@/components/ClaimCard";
import { initials } from "@/lib/identity";
import { scoreTier } from "@/lib/scoreTiers";

function formatDuration(sec) {
  if (!sec && sec !== 0) return null;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// The main feed's card: a big, full-width thumbnail on top (the part meant
// to grab attention while scrolling), with the title and details underneath,
// in the spirit of a YouTube feed card rather than a small side-by-side row.
export default function FeedThumbnailCard({ claim }) {
  const router = useRouter();
  const author = claim.users;
  const topicLabel = claim.topics?.label;
  const duration = formatDuration(claim.media_duration_seconds);
  // Root arguments aren't voted on directly, so the closest thing to "how
  // well this is doing" is total engagement across both sides, not just
  // the net split, a hot, well argued 30-for-25-against claim earns its
  // tier just as much as a lopsided one.
  const engagement = (claim.for_count || 0) + (claim.against_count || 0);
  const tier = scoreTier(engagement);

  function go() {
    router.push(`/claim/${claim.id}`);
  }

  return (
    <div
      onClick={go}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && go()}
      className="cursor-pointer fade-in"
    >
      <Thumbnail claim={claim} duration={duration} tier={tier} />

      <div className="flex gap-2.5 pt-2.5">
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0"
          style={{ background: author?.avatar_color || "#7C5CFF", color: "#0b0b12" }}
        >
          {initials(author?.nickname)}
        </span>

        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-[0.98rem] leading-snug line-clamp-2 mb-1">
            {claim.arena_name}
          </h3>

          <div className="flex items-center gap-1.5 text-xs mb-2 min-w-0" style={{ color: "var(--text-faint)" }}>
            <span className="truncate">{author?.nickname || "Someone"}</span>
            <span className="shrink-0">· <RelativeTime date={claim.created_at} /></span>
            {topicLabel && (
              <>
                <span className="shrink-0">·</span>
                <span className="truncate">{topicLabel}</span>
              </>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <ForAgainstBar forCount={claim.for_count || 0} againstCount={claim.against_count || 0} />
            <span className="text-xs shrink-0" style={{ color: "var(--text-faint)" }}>
              {claim.reply_count || 0} replies
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Thumbnail({ claim, duration, tier }) {
  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden" style={{ background: "#000" }}>
      <span
        className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md z-10"
        style={{ background: tier.bg, color: tier.color, backdropFilter: "blur(4px)" }}
      >
        {tier.label}
      </span>

      {claim.media_type === "video" ? (
        <video
          src={claim.media_url ? `${claim.media_url}#t=0.5` : undefined}
          muted
          playsInline
          preload="metadata"
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${avatarTint(claim.id)}, #14141f)` }}
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2">
            <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
      )}

      <span
        className="absolute inset-0 flex items-center justify-center transition-colors"
        style={{ background: "rgba(0,0,0,0.1)" }}
      >
        <span
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: "rgba(11,11,18,0.6)", border: "1px solid rgba(255,255,255,0.25)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M6 4l15 8-15 8V4z" />
          </svg>
        </span>
      </span>

      {duration && (
        <span
          className="absolute bottom-2 right-2 text-xs font-semibold px-1.5 py-0.5 rounded"
          style={{ background: "rgba(0,0,0,0.8)", color: "white" }}
        >
          {duration}
        </span>
      )}
    </div>
  );
}

function avatarTint(seed) {
  const colors = ["#7C5CFF", "#FF5C87", "#22C7B5", "#FFB03B", "#4EA1FF", "#FF7A45"];
  let hash = 0;
  for (let i = 0; i < String(seed).length; i++) {
    hash = (hash << 5) - hash + String(seed).charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length];
}
