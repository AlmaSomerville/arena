"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

function formatTime(sec) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// A player built for the "forced watch" rule: you can't scrub ahead of
// where you've actually watched (rewinding is always fine), and right as
// playback reaches the end, a For / Against / Add nuance overlay fades in
// over the media and stays there until you act on it or leave the page.
// Rep is awarded the moment playback completes.
export default function GatedMediaPlayer({ claimId, url, type, mySide, onPickSide, onSeeReplies }) {
  const router = useRouter();
  const mediaRef = useRef(null);
  const maxWatchedRef = useRef(0);
  const completedRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ended, setEnded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [sideBusy, setSideBusy] = useState(false);
  const [sideError, setSideError] = useState("");

  function completeWatch() {
    if (completedRef.current) return;
    completedRef.current = true;
    setEnded(true);
    fetch("/api/watch-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimId }),
    }).catch(() => {});
  }

  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return;

    function onTimeUpdate() {
      setCurrent(el.currentTime);
      if (el.currentTime > maxWatchedRef.current) maxWatchedRef.current = el.currentTime;
      if (!completedRef.current && el.duration && el.duration - el.currentTime <= 1) {
        completeWatch();
      }
    }
    function onLoaded() {
      setDuration(el.duration || 0);
    }
    function onSeeking() {
      // Rewinding is always allowed. Jumping ahead of the furthest point
      // actually watched gets snapped straight back, no forward-scrubbing.
      if (el.currentTime > maxWatchedRef.current + 0.35) {
        el.currentTime = maxWatchedRef.current;
      }
    }
    function onPlay() {
      setPlaying(true);
    }
    function onPause() {
      setPlaying(false);
    }
    function onEnded() {
      setPlaying(false);
      completeWatch();
    }

    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("durationchange", onLoaded);
    el.addEventListener("seeking", onSeeking);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("durationchange", onLoaded);
      el.removeEventListener("seeking", onSeeking);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  function togglePlay() {
    const el = mediaRef.current;
    if (!el) return;
    if (playing) el.pause();
    else el.play();
  }

  function seekTo(ratio) {
    const el = mediaRef.current;
    if (!el || !duration) return;
    const target = ratio * duration;
    if (target > maxWatchedRef.current + 0.35) return; // no skipping ahead
    el.currentTime = target;
    setCurrent(target);
  }

  async function pick(side) {
    if (sideBusy) return;
    setSideBusy(true);
    setSideError("");
    try {
      await onPickSide(side);
    } catch (err) {
      setSideError(err.message);
    } finally {
      setSideBusy(false);
    }
  }

  const pct = duration ? (current / duration) * 100 : 0;
  const showOverlay = ended && !dismissed;

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ background: "#000", border: "1px solid var(--border)" }}>
      {type === "video" ? (
        <video
          ref={mediaRef}
          src={url}
          playsInline
          preload="metadata"
          className="w-full block"
          style={{ maxHeight: 420 }}
          onClick={togglePlay}
        />
      ) : (
        <div className="p-6 flex items-center justify-center" style={{ minHeight: 140 }}>
          <audio ref={mediaRef} src={url} preload="metadata" />
          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
            aria-label={playing ? "Pause" : "Play"}
          >
            <PlayPauseIcon playing={playing} size={22} />
          </button>
        </div>
      )}

      {!showOverlay && type === "video" && !playing && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: current > 0 ? "transparent" : "rgba(0,0,0,0.25)" }}
          aria-label="Play"
        >
          <span
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "rgba(11,11,18,0.65)", border: "1px solid rgba(255,255,255,0.3)" }}
          >
            <PlayPauseIcon playing={false} size={22} />
          </span>
        </button>
      )}

      {!showOverlay && (
        <div className="flex items-center gap-3 px-3 py-2.5" style={{ background: "rgba(11,11,18,0.85)" }}>
          {type === "audio" && (
            <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className="shrink-0">
              <PlayPauseIcon playing={playing} size={16} />
            </button>
          )}
          <div
            className="flex-1 h-1.5 rounded-full cursor-pointer relative"
            style={{ background: "rgba(255,255,255,0.12)" }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              seekTo((e.clientX - rect.left) / rect.width);
            }}
          >
            <div
              className="h-1.5 rounded-full absolute left-0 top-0"
              style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--accent), var(--accent-2))" }}
            />
          </div>
          <span className="text-xs tabular-nums shrink-0" style={{ color: "rgba(255,255,255,0.7)" }}>
            {formatTime(current)} / {formatTime(duration)}
          </span>
        </div>
      )}

      {showOverlay && (
        <div
          className="absolute inset-0 flex items-center justify-center p-5 fade-in"
          style={{ background: "rgba(8,8,14,0.92)", backdropFilter: "blur(6px)" }}
        >
          <div className="w-full max-w-xs">
            {!mySide ? (
              <>
                <p className="text-center font-display font-semibold text-lg mb-4 text-white">What&apos;s your take?</p>
                <div className="flex gap-2 mb-2.5">
                  <button
                    onClick={() => pick("for")}
                    disabled={sideBusy}
                    className="flex-1 rounded-xl py-3.5 text-center font-display font-bold"
                    style={{ background: "var(--up-soft)", color: "var(--up)", border: "1.5px solid rgba(34,199,181,0.5)" }}
                  >
                    For
                  </button>
                  <button
                    onClick={() => pick("against")}
                    disabled={sideBusy}
                    className="flex-1 rounded-xl py-3.5 text-center font-display font-bold"
                    style={{ background: "var(--down-soft)", color: "var(--down)", border: "1.5px solid rgba(255,92,106,0.5)" }}
                  >
                    Against
                  </button>
                </div>
                <button
                  onClick={() => router.push(`/claim/${claimId}/reply?stance=nuance`)}
                  className="btn btn-ghost w-full mb-2.5"
                >
                  Add nuance
                </button>
                {sideError && (
                  <p className="text-xs text-center mb-2" style={{ color: "var(--down)" }}>
                    {sideError}
                  </p>
                )}
                <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Picking a side locks you to it for this argument.
                </p>
              </>
            ) : (
              <>
                <p className="text-center font-display font-semibold text-lg mb-1 text-white">
                  You&apos;re on the {mySide === "for" ? "For" : "Against"} side
                </p>
                <p className="text-xs text-center mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>
                  You can watch the other side, you just can&apos;t vote on it.
                </p>
                <button
                  onClick={() => router.push(`/claim/${claimId}/reply?stance=nuance`)}
                  className="btn btn-ghost w-full mb-2.5"
                >
                  Add nuance
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setDismissed(true);
                      onSeeReplies?.();
                    }}
                    className="btn btn-primary flex-1"
                  >
                    See replies
                  </button>
                  <button onClick={() => router.push("/")} className="btn btn-ghost flex-1">
                    Other arguments
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PlayPauseIcon({ playing, size }) {
  if (playing) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
        <rect x="5" y="4" width="5" height="16" rx="1" />
        <rect x="14" y="4" width="5" height="16" rx="1" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M6 4l15 8-15 8V4z" />
    </svg>
  );
}
