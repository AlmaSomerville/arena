"use client";

import { useRouter } from "next/navigation";
import RelativeTime from "@/components/RelativeTime";
import { ForAgainstBar } from "@/components/ClaimCard";
import { initials } from "@/lib/identity";

function formatDuration(sec) {
  if (!sec && sec !== 0) return null;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// The main feed's row layout: a thumbnail on the left, title and details to
// the right, in the spirit of a YouTube mobile feed rather than the fuller
// vertical cards used for replies.
export default function FeedThumbnailCard({ claim }) {
  const router = useRouter();
  const author = claim.users;
  const topicLabel = claim.topics?.label;
  const duration = formatDuration(claim.media_duration_seconds);

  return (
    <div
      onClick={() => router.push(`/claim/${claim.id}`)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && router.push(`/claim/${claim.id}`)}
      className="flex gap-3 p-2 rounded-xl cursor-pointer transition-colors fade-in hover:bg-white/5"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <Thumbnail claim={claim} duration={duration} />

      <div className="flex-1 min-w-0 flex flex-col py-0.5">
        <h3 className="font-display font-semibold text-[0.95rem] leading-snug line-clamp-2 mb-1">
          {claim.arena_name}
        </h3>

        <div className="flex items-center gap-1.5 text-xs mb-1.5 min-w-0" style={{ color: "var(--text-faint)" }}>
          <span
            className="w-4 h-4 rounded-full flex items-center justify-center font-bold text-[8px] shrink-0"
            style={{ background: author?.avatar_color || "#7C5CFF", color: "#0b0b12" }}
          >
            {initials(author?.nickname)}
          </span>
          <span className="truncate">{author?.nickname || "Someone"}</span>
          <span className="shrink-0">· <RelativeTime date={claim.created_at} /></span>
        </div>

        {topicLabel && (
          <span
            className="self-start badge mb-1.5"
            style={{ background: "var(--accent-soft)", color: "#d6cbff", fontSize: "0.65rem", padding: "2px 8px" }}
          >
            {topicLabel}
          </span>
        )}

        <div className="mt-auto flex items-center justify-between gap-2">
          <ForAgainstBar forCount={claim.for_count || 0} againstCount={claim.against_count || 0} />
          <span className="text-xs shrink-0" style={{ color: "var(--text-faint)" }}>
            {claim.reply_count || 0} replies
          </span>
        </div>
      </div>
    </div>
  );
}

function Thumbnail({ claim, duration }) {
  return (
    <div
      className="relative shrink-0 w-28 h-[4.5rem] sm:w-36 sm:h-24 rounded-lg overflow-hidden"
      style={{ background: "#000" }}
    >
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
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2">
            <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
      )}

      <span
        className="absolute inset-0 flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.15)" }}
      >
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "rgba(11,11,18,0.55)" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
            <path d="M6 4l15 8-15 8V4z" />
          </svg>
        </span>
      </span>

      {duration && (
        <span
          className="absolute bottom-1 right-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
          style={{ background: "rgba(0,0,0,0.75)", color: "white" }}
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
