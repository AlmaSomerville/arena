"use client";

import { useRouter } from "next/navigation";
import RelativeTime from "@/components/RelativeTime";
import { scoreTier } from "@/lib/scoreTiers";

function formatDuration(sec) {
  if (!sec && sec !== 0) return null;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// The main feed's row: a big thumbnail taking up the left two thirds, and
// the title plus a snippet of the argument stacked in the right third,
// mirroring a YouTube feed row rather than a stacked card.
export default function FeedThumbnailCard({ claim }) {
  const router = useRouter();
  const author = claim.users;
  const duration = formatDuration(claim.media_duration_seconds);
  const snippet = claim.display_text && claim.display_text !== claim.arena_name ? claim.display_text : null;
  // Root arguments aren't voted on directly, so total engagement across
  // both sides stands in for "how well this is doing".
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
      className="flex items-stretch gap-2.5 pb-4 cursor-pointer fade-in"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <div className="shrink-0" style={{ width: "64%" }}>
        <Thumbnail claim={claim} duration={duration} tier={tier} />
      </div>

      <div className="flex-1 min-w-0 flex flex-col py-0.5">
        <h3 className="font-display font-semibold text-sm leading-snug line-clamp-3 mb-1.5">
          {claim.arena_name}
        </h3>

        {snippet && (
          <p className="text-xs leading-snug line-clamp-3 mb-1.5" style={{ color: "var(--text-dim)" }}>
            {snippet}
          </p>
        )}

        <div className="mt-auto text-[11px] leading-snug" style={{ color: "var(--text-faint)" }}>
          <div className="truncate">{author?.nickname || "Someone"}</div>
          <div>
            <RelativeTime date={claim.created_at} /> · {claim.reply_count || 0} replies
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
        className={
          "absolute top-2 left-2 font-bold uppercase tracking-wide rounded-md z-10 " +
          (tier.glow ? "text-[11px] px-2.5 py-1.5" : "text-[10px] px-2 py-1")
        }
        style={{
          background: tier.bg,
          color: tier.color,
          backdropFilter: "blur(4px)",
          boxShadow: tier.glow ? `0 0 0 1px ${tier.glow}, 0 2px 14px 0 ${tier.glow}` : undefined,
        }}
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
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2">
            <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
      )}

      <span className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.1)" }}>
        <span
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(11,11,18,0.6)", border: "1px solid rgba(255,255,255,0.25)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M6 4l15 8-15 8V4z" />
          </svg>
        </span>
      </span>

      {duration && (
        <span
          className="absolute bottom-1.5 right-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded"
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
