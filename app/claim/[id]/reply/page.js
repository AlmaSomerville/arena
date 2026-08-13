"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getReplySteps, composeReplyText, isStepValid } from "@/lib/claimWizard";
import { useIdentity } from "@/components/IdentityProvider";
import WizardShell from "@/components/wizard/WizardShell";
import StepField from "@/components/wizard/StepField";
import ReferencesEditor from "@/components/wizard/ReferencesEditor";
import RecordStep from "@/components/RecordStep";

export default function ReplyPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, requireIdentity } = useIdentity();

  const [parent, setParent] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [answers, setAnswers] = useState({ caveats: [] });
  const [screenIndex, setScreenIndex] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewInitialized, setReviewInitialized] = useState(false);
  const [references, setReferences] = useState([]);
  const [mediaKind, setMediaKind] = useState("audio");
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
      .catch(() => setLoadError("Couldn't load that claim."));
  }, [id]);

  const fieldSteps = useMemo(() => (parent ? getReplySteps(parent) : []), [parent]);

  const screens = useMemo(() => {
    const s = fieldSteps.map((step) => ({ kind: "field", step }));
    s.push({ kind: "review" });
    s.push({ kind: "references" });
    s.push({ kind: "record" });
    return s;
  }, [fieldSteps]);

  const current = screens[screenIndex];

  function updateAnswer(key, val) {
    setAnswers((a) => ({ ...a, [key]: val }));
  }

  function goBack() {
    if (screenIndex === 0) {
      router.push(`/claim/${id}`);
      return;
    }
    setScreenIndex((i) => Math.max(i - 1, 0));
  }

  function enterScreen(nextIndex) {
    const next = screens[nextIndex];
    if (next?.kind === "review" && !reviewInitialized) {
      setReviewText(composeReplyText(parent, answers));
      setReviewInitialized(true);
    }
    setScreenIndex(nextIndex);
  }

  function canProceed() {
    if (!current) return false;
    if (current.kind === "field") return isStepValid(current.step, answers);
    if (current.kind === "review") return reviewText.trim().length > 0;
    if (current.kind === "references") return true;
    if (current.kind === "record") return !!media;
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
          stance: answers.stance,
          addresses: answers.addresses,
          dimension: answers.dimension,
          scope: answers.scope,
          caveats: answers.caveats || [],
          displayText: reviewText,
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

  if (!parent || !current) {
    return <div className="card p-6 h-64 animate-pulse mt-4" />;
  }

  return (
    <WizardShell
      step={screenIndex}
      totalSteps={screens.length}
      onBack={goBack}
      footer={
        current.kind !== "record" ? (
          <button
            onClick={() => enterScreen(screenIndex + 1)}
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

      {current.kind === "field" && <StepField step={current.step} answers={answers} onChange={updateAnswer} />}

      {current.kind === "review" && (
        <div>
          <h2 className="font-display font-semibold text-xl mb-1.5">Here&apos;s your reply</h2>
          <p className="text-sm mb-4" style={{ color: "var(--text-dim)" }}>
            Tweak the wording if you like — keep the specifics.
          </p>
          <textarea
            className="input"
            rows={4}
            value={reviewText}
            autoCapitalize="sentences"
            onChange={(e) => setReviewText(e.target.value)}
          />
        </div>
      )}

      {current.kind === "references" && <ReferencesEditor references={references} onChange={setReferences} />}

      {current.kind === "record" && (
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
