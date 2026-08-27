"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useIdentity } from "@/components/IdentityProvider";
import WizardShell from "@/components/wizard/WizardShell";
import ReferencesEditor from "@/components/wizard/ReferencesEditor";
import RecordStep from "@/components/RecordStep";

const SCREENS = ["details", "references", "record"];

const STANCES = [
  { id: "for", label: "For", hint: "Backs the root argument", color: "var(--up)" },
  { id: "against", label: "Against", hint: "Pushes back on it", color: "var(--down)" },
  { id: "nuance", label: "Add nuance", hint: "Caveat or complication — visible to everyone", color: "var(--accent)" },
];

export default function ReplyPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const presetStance = searchParams.get("stance");
  const router = useRouter();
  const { user, requireIdentity } = useIdentity();

  const [parent, setParent] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [stance, setStance] = useState(
    ["for", "against", "nuance"].includes(presetStance) ? presetStance : null
  );
  const [title, setTitle] = useState("");
  const [screenIndex, setScreenIndex] = useState(0);
  const [references, setReferences] = useState([]);
  const [mediaKind, setMediaKind] = useState("video");
  const [media, setMedia] = useState(null);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  useEffect(() => {
    fetch(`/api/claims/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setLoadError(d.error);
        else setParent(d.claim);
      })
      .catch(() => setLoadError("Couldn't load that argument."));
  }, [id]);

  const current = SCREENS[screenIndex];

  function goBack() {
    if (screenIndex === 0) {
      router.push(`/claim/${id}`);
      return;
    }
    setScreenIndex((i) => Math.max(i - 1, 0));
  }

  function canProceed() {
    if (current === "details") return !!stance;
    if (current === "references") return true;
    if (current === "record") return !!media;
    return true;
  }

  async function handlePost() {
    const activeUser = user || (await requireIdentity("Pick a nickname to reply."));
    if (!activeUser) return;

    setPosting(true);
    setPostError("");
    try {
      const res = await fetch(`/api/claims/${id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stance,
          title,
          references,
          mediaUrl: media.mediaUrl,
          mediaType: media.mediaType,
          mediaDurationSeconds: media.mediaDurationSeconds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      router.push(`/claim/${id}#reply-${data.claim.id}`);
    } catch (err) {
      setPostError(err.message);
      setPosting(false);
    }
  }

  if (loadError) {
    return (
      <div className="card p-8 text-center mt-6">
        <p style={{ color: "var(--down)" }}>{loadError}</p>
      </div>
    );
  }

  if (!parent) {
    return <div className="card p-6 h-64 animate-pulse mt-4" />;
  }

  return (
    <WizardShell
      step={screenIndex}
      totalSteps={SCREENS.length}
      onBack={goBack}
      footer={
        current !== "record" ? (
          <button
            onClick={() => setScreenIndex((i) => i + 1)}
            disabled={!canProceed()}
            className="btn btn-primary w-full py-3.5"
          >
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
              {posting ? "Posting your reply…" : "Post reply"}
            </button>
          </div>
        ) : null
      }
    >
      <div className="mb-5 p-3 rounded-lg text-sm" style={{ background: "var(--bg-elevated)", color: "var(--text-dim)" }}>
        Replying to <span className="font-semibold" style={{ color: "var(--text)" }}>{parent.arena_name}</span>
      </div>

      {current === "details" && (
        <div>
          <h2 className="font-display font-semibold text-xl mb-1.5">Where do you stand?</h2>
          <p className="text-sm mb-4" style={{ color: "var(--text-dim)" }}>
            For and Against replies lock you to that side of this argument &mdash; you&apos;ll be able to watch the
            other side, but not vote on it. Nuance stays open to everyone.
          </p>
          <div className="flex flex-col gap-2.5 mb-6">
            {STANCES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStance(s.id)}
                className="card card-hover text-left p-4"
                style={{
                  borderColor: stance === s.id ? s.color : "var(--border)",
                  background: stance === s.id ? "var(--accent-soft)" : undefined,
                }}
              >
                <p className="font-display font-semibold mb-0.5" style={{ color: stance === s.id ? s.color : undefined }}>
                  {s.label}
                </p>
                <p className="text-sm" style={{ color: "var(--text-dim)" }}>
                  {s.hint}
                </p>
              </button>
            ))}
          </div>

          <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: "var(--text-faint)" }}>
            Short title (optional)
          </label>
          <input
            className="input"
            placeholder="What's the headline of your response?"
            maxLength={140}
            autoCapitalize="sentences"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
      )}

      {current === "references" && <ReferencesEditor references={references} onChange={setReferences} />}

      {current === "record" && (
        <div>
          <h2 className="font-display font-semibold text-xl mb-1.5">Record it</h2>
          <p className="text-sm mb-4" style={{ color: "var(--text-dim)" }}>
            Say your reply out loud.
          </p>
          <RecordStep mediaType={mediaKind} onMediaTypeChange={setMediaKind} value={media} onChange={setMedia} />
        </div>
      )}
    </WizardShell>
  );
}
