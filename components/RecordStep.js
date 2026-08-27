"use client";

import { useEffect, useRef, useState } from "react";
import { getBrowserClient } from "@/lib/supabase";
import MediaPlayer from "@/components/MediaPlayer";

const MAX_SECONDS = 30 * 60; // 30 minutes, as requested - see the storage note in the UI below.

function pickMimeType(kind) {
  const candidates =
    kind === "video"
      ? ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
      : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(c)) return c;
  }
  return "";
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function RecordStep({ mediaType, onMediaTypeChange, value, onChange }) {
  const [phase, setPhase] = useState(value ? "done" : "idle"); // idle | requesting | recording | preview | uploading | done | error
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [bytes, setBytes] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const rafRef = useRef(null);
  const videoPreviewRef = useRef(null);

  useEffect(() => () => cleanup(), []);

  function cleanup() {
    clearInterval(timerRef.current);
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
  }

  async function startRecording() {
    setErrorMsg("");
    setPhase("requesting");
    try {
      const constraints = mediaType === "video" ? { audio: true, video: { facingMode: "user" } } : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (mediaType === "video" && videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.muted = true;
        videoPreviewRef.current.play().catch(() => {});
      }

      // live level meter off the audio track
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setLevel(Math.min(1, avg / 90));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();

      const mimeType = pickMimeType(mediaType);
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
          setBytes((b) => b + e.data.size);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || (mediaType === "video" ? "video/webm" : "audio/webm") });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        recorderRef.current = { blob };
        setPhase("preview");
        cleanup();
      };
      recorder.start(1000);
      recorderRef.current = recorder;

      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) {
            stopRecording();
            return MAX_SECONDS;
          }
          return s + 1;
        });
      }, 1000);

      setPhase("recording");
    } catch (err) {
      setErrorMsg(
        err?.name === "NotAllowedError"
          ? "Microphone/camera access was denied. Allow access in your browser settings and try again."
          : "Couldn't access your microphone/camera on this device."
      );
      setPhase("error");
      cleanup();
    }
  }

  function stopRecording() {
    clearInterval(timerRef.current);
    if (recorderRef.current instanceof MediaRecorder && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  }

  function reRecord() {
    setPreviewUrl(null);
    setBytes(0);
    setSeconds(0);
    onChange(null);
    setPhase("idle");
  }

  async function confirmUpload() {
    const blob = recorderRef.current?.blob;
    if (!blob) return;
    setPhase("uploading");
    setErrorMsg("");
    try {
      const supabase = getBrowserClient();
      const ext = mediaType === "video" ? "webm" : "webm";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("recordings")
        .upload(path, blob, { contentType: blob.type, upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("recordings").getPublicUrl(path);
      onChange({ mediaUrl: data.publicUrl, mediaType, mediaDurationSeconds: seconds, sizeBytes: blob.size });
      setPhase("done");
    } catch (err) {
      setErrorMsg(
        err?.message?.includes("Bucket not found")
          ? "Storage bucket \"recordings\" doesn't exist yet in Supabase. See the README setup steps."
          : `Upload failed: ${err.message || "unknown error"}`
      );
      setPhase("preview");
    }
  }

  if (phase === "done" && value) {
    return (
      <div className="fade-in">
        <div className="flex items-center justify-between mb-2">
          <span className="badge" style={{ background: "var(--up-soft)", color: "var(--up)" }}>
            Recorded · {formatTime(value.mediaDurationSeconds)}
          </span>
          <button onClick={reRecord} className="btn btn-ghost text-xs">
            Re-record
          </button>
        </div>
        <MediaPlayer url={value.mediaUrl} type={value.mediaType} />
      </div>
    );
  }

  return (
    <div>
      {(phase === "idle" || phase === "requesting" || phase === "error") && (
        <div className="flex gap-2 mb-4">
          <TypeButton active={mediaType === "audio"} onClick={() => onMediaTypeChange("audio")} label="🎙 Audio" />
          <TypeButton active={mediaType === "video"} onClick={() => onMediaTypeChange("video")} label="🎥 Video" />
        </div>
      )}

      {phase === "idle" && (
        <button onClick={startRecording} className="btn btn-primary w-full py-4 text-base">
          Start recording
        </button>
      )}

      {phase === "requesting" && (
        <p className="text-sm text-center py-4" style={{ color: "var(--text-dim)" }}>
          Waiting for {mediaType === "video" ? "camera + microphone" : "microphone"} access…
        </p>
      )}

      {phase === "error" && (
        <p className="text-sm py-3 text-center" style={{ color: "var(--down)" }}>
          {errorMsg}
        </p>
      )}

      {phase === "recording" && (
        <div className="card p-5 fade-in">
          {mediaType === "video" && (
            <video ref={videoPreviewRef} className="w-full rounded-lg mb-4 bg-black" style={{ maxHeight: 300 }} />
          )}
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="w-3 h-3 rounded-full pulse-rec" style={{ background: "var(--down)" }} />
            <span className="font-display font-bold text-3xl tabular-nums">{formatTime(seconds)}</span>
            <span className="text-sm" style={{ color: "var(--text-faint)" }}>/ {formatTime(MAX_SECONDS)}</span>
          </div>
          <LevelMeter level={level} />
          <p className="text-xs text-center mt-3" style={{ color: "var(--text-faint)" }}>
            ~{formatBytes(bytes)} so far
          </p>
          <button onClick={stopRecording} className="btn btn-primary w-full py-3.5 mt-4">
            Stop recording
          </button>
        </div>
      )}

      {phase === "preview" && (
        <div className="fade-in">
          <p className="text-sm mb-2" style={{ color: "var(--text-dim)" }}>
            {formatTime(seconds)} recorded · ~{formatBytes(bytes)}
          </p>
          <MediaPlayer url={previewUrl} type={mediaType} />
          {errorMsg && (
            <p className="text-sm mt-2" style={{ color: "var(--down)" }}>
              {errorMsg}
            </p>
          )}
          <div className="flex gap-2 mt-3">
            <button onClick={reRecord} className="btn btn-ghost flex-1">
              Re-record
            </button>
            <button onClick={confirmUpload} className="btn btn-primary flex-1">
              Use this recording
            </button>
          </div>
        </div>
      )}

      {phase === "uploading" && (
        <p className="text-sm text-center py-4" style={{ color: "var(--text-dim)" }}>
          Uploading your recording…
        </p>
      )}

      {(phase === "idle" || phase === "recording") && (
        <p className="text-xs mt-3" style={{ color: "var(--text-faint)" }}>
          Recordings can run up to 30 minutes. Longer, video recordings use a lot of free storage,
          audio and shorter clips leave more room for everyone else&apos;s claims.
        </p>
      )}
    </div>
  );
}

function TypeButton({ active, onClick, label }) {
  return (
    <button onClick={onClick} className={`btn btn-ghost flex-1 ${active ? "active" : ""}`}>
      {label}
    </button>
  );
}

function LevelMeter({ level }) {
  const bars = 24;
  const lit = Math.round(level * bars);
  return (
    <div className="flex items-center gap-[3px] h-8 justify-center">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="w-1.5 rounded-full transition-all"
          style={{
            height: `${20 + (i / bars) * 60}%`,
            background: i < lit ? "linear-gradient(180deg, var(--accent-2), var(--accent))" : "rgba(255,255,255,0.08)",
          }}
        />
      ))}
    </div>
  );
}
