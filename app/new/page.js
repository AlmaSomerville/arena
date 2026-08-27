"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useIdentity } from "@/components/IdentityProvider";
import WizardShell from "@/components/wizard/WizardShell";
import ReferencesEditor from "@/components/wizard/ReferencesEditor";
import RecordStep from "@/components/RecordStep";

const SCREENS = ["details", "references", "record"];

export default function NewClaimPage() {
  const router = useRouter();
  const { user, requireIdentity } = useIdentity();

  const [topics, setTopics] = useState(null);
  const [topicsError, setTopicsError] = useState("");
  const [topicId, setTopicId] = useState(null);
  const [title, setTitle] = useState("");
  const [screenIndex, setScreenIndex] = useState(0);
  const [references, setReferences] = useState([]);
  const [mediaKind, setMediaKind] = useState("video");
  const [media, setMedia] = useState(null);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  useEffect(() => {
    fetch("/api/topics")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setTopicsError(d.error);
        else setTopics(d.topics);
      })
      .catch(() => setTopicsError("Couldn't load topics."));
  }, []);

  const current = SCREENS[screenIndex];
  const titleValid = title.trim().length >= 6;

  function goBack() {
    if (screenIndex === 0) {
      router.push("/");
      return;
    }
    setScreenIndex((i) => Math.max(i - 1, 0));
  }

  function canProceed() {
    if (current === "details") return titleValid && !!topicId;
    if (current === "references") return true;
    if (current === "record") return !!media;
    return true;
  }

  async function handlePost() {
    const activeUser = user || (await requireIdentity("Pick a nickname to stake your claim."));
    if (!activeUser) return;

    setPosting(true);
    setPostError("");
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          topicId,
          references,
          mediaUrl: media.mediaUrl,
          mediaType: media.mediaType,
          mediaDurationSeconds: media.mediaDurationSeconds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      router.push(`/claim/${data.claim.id}`);
    } catch (err) {
      setPostError(err.message);
      setPosting(false);
    }
  }

  return (
    <WizardShell
      step={screenIndex}
      totalSteps={SCREENS.length}
      onBack={goBack}
      footer={
        current !== "record" ? (
          <button onClick={() => setScreenIndex((i) => i + 1)} disabled={!canProceed()} className="btn btn-primary w-full py-3.5">
            Continue
          </button>
        ) : media ? (
          <div>
            {postError && (
              <p className="text-sm mb-2 text-center" style={{ color: "var(--down)" }}>
                {postError}
              </p>
            )}
            <button onClick={handlePost} disabled={posting} className="btn btn-primary w-full py-3.5">
              {posting ? "Staking your claim…" : "Post to the arena"}
            </button>
          </div>
        ) : null
      }
    >
      {current === "details" && (
        <div>
          <h2 className="font-display font-semibold text-xl mb-1.5">Stake your claim</h2>
          <p className="text-sm mb-4" style={{ color: "var(--text-dim)" }}>
            Give it a short, specific title, then pick the topic it belongs under. Your recording is where you
            actually make the case.
          </p>

          <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: "var(--text-faint)" }}>
            Title
          </label>
          <input
            className="input mb-1"
            placeholder="e.g. Remote work makes teams less creative"
            maxLength={140}
            autoCapitalize="sentences"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <p className="text-xs mb-5" style={{ color: "var(--text-faint)" }}>
            {title.trim().length}/140 · at least 6 characters
          </p>

          <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: "var(--text-faint)" }}>
            Topic
          </label>
          {topicsError && (
            <p className="text-sm" style={{ color: "var(--down)" }}>
              {topicsError}
            </p>
          )}
          {!topics && !topicsError && (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-9 w-24 rounded-full animate-pulse" style={{ background: "var(--bg-elevated)" }} />
              ))}
            </div>
          )}
          {topics && (
            <div className="flex flex-wrap gap-2">
              {topics.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTopicId(t.id)}
                  className="px-3.5 py-2 rounded-full text-sm font-medium transition-colors"
                  style={{
                    border: "1px solid " + (topicId === t.id ? "var(--accent)" : "var(--border)"),
                    background: topicId === t.id ? "var(--accent-soft)" : "transparent",
                    color: topicId === t.id ? "#d6cbff" : "var(--text-dim)",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {current === "references" && <ReferencesEditor references={references} onChange={setReferences} />}

      {current === "record" && (
        <div>
          <h2 className="font-display font-semibold text-xl mb-1.5">Record it</h2>
          <p className="text-sm mb-4" style={{ color: "var(--text-dim)" }}>
            Say your claim out loud, make your case. This is what actually gets posted.
          </p>
          <RecordStep mediaType={mediaKind} onMediaTypeChange={setMediaKind} value={media} onChange={setMedia} />
        </div>
      )}
    </WizardShell>
  );
}
