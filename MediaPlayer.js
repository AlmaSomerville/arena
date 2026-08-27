"use client";

import { useEffect, useRef, useState } from "react";

function formatTime(sec) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function MediaPlayer({ url, type = "audio" }) {
  if (!url) return null;
  if (type === "video") {
    return (
      <video
        src={url}
        controls
        playsInline
        preload="metadata"
        className="w-full rounded-xl border"
        style={{ borderColor: "var(--border)", background: "#000", maxHeight: 420 }}
      />
    );
  }
  return <AudioPlayer url={url} />;
}

function AudioPlayer({ url }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setCurrent(el.currentTime);
    const onLoaded = () => setDuration(el.duration || 0);
    const onEnd = () => setPlaying(false);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("ended", onEnd);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("ended", onEnd);
    };
  }, []);

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
    } else {
      el.play();
    }
    setPlaying(!playing);
  }

  function seek(e) {
    const el = audioRef.current;
    if (!el || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    el.currentTime = ratio * duration;
    setCurrent(el.currentTime);
  }

  const pct = duration ? (current / duration) * 100 : 0;

  return (
    <div
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 border"
      style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
    >
      <audio ref={audioRef} src={url} preload="metadata" />
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle();
        }}
        aria-label={playing ? "Pause" : "Play"}
        className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
      >
        {playing ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
            <rect x="5" y="4" width="5" height="16" rx="1" />
            <rect x="14" y="4" width="5" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
            <path d="M6 4l15 8-15 8V4z" />
          </svg>
        )}
      </button>
      <div className="flex-1">
        <div
          className="h-1.5 rounded-full cursor-pointer relative"
          style={{ background: "rgba(255,255,255,0.1)" }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            seek(e);
          }}
        >
          <div
            className="h-1.5 rounded-full absolute left-0 top-0"
            style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--accent), var(--accent-2))" }}
          />
        </div>
      </div>
      <span className="text-xs tabular-nums shrink-0" style={{ color: "var(--text-faint)" }}>
        {formatTime(current)} / {formatTime(duration)}
      </span>
    </div>
  );
}
