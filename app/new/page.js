"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CLAIM_TYPES,
  getClaimSteps,
  composeDisplayText,
  isStepValid,
} from "@/lib/claimWizard";
import { useIdentity } from "@/components/IdentityProvider";
import WizardShell from "@/components/wizard/WizardShell";
import StepField from "@/components/wizard/StepField";
import ReferencesEditor from "@/components/wizard/ReferencesEditor";
import RecordStep from "@/components/RecordStep";

export default function NewClaimPage() {
  const router = useRouter();
  const { user, requireIdentity } = useIdentity();

  const [claimType, setClaimType] = useState(null);
  const [answers, setAnswers] = useState({ caveats: [] });
  const [screenIndex, setScreenIndex] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewInitialized, setReviewInitialized] = useState(false);
  const [references, setReferences] = useState([]);
  const [mediaKind, setMediaKind] = useState("audio");
  const [media, setMedia] = useState(null);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  const fieldSteps = useMemo(() => (claimType ? getClaimSteps(claimType) : []), [claimType]);

  const screens = useMemo(() => {
    const s = [{ kind: "type" }];
    fieldSteps.forEach((step) => s.push({ kind: "field", step }));
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
      router.push("/");
      return;
    }
    setScreenIndex((i) => Math.max(i - 1, 0));
  }

  function enterScreen(nextIndex) {
    const next = screens[nextIndex];
    if (next?.kind === "review" && !reviewInitialized) {
      setReviewText(composeDisplayText(claimType, answers));
      setReviewInitialized(true);
    }
    setScreenIndex(nextIndex);
  }

  function canProceed() {
    if (current.kind === "type") return !!claimType;
    if (current.kind === "field") return isStepValid(current.step, answers);
    if (current.kind === "review") return reviewText.trim().length > 0;
    if (current.kind === "references") return true;
    if (current.kind === "record") return !!media;
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
          claimType,
          subjectA: answers.subjectA,
          subjectB: answers.subjectB,
          direction: answers.direction,
          dimension: answers.dimension,
          scope: answers.scope,
          timeframe: answers.timeframe,
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
      router.push(`/claim/${data.claim.id}`);
    } catch (err) {
      setPostError(err.message);
      setPosting(false);
    }
  }

  return (
    <WizardShell
      step={screenIndex}
      totalSteps={screens.length}
      onBack={goBack}
      footer={
        current.kind !== "record" ? (
          <button onClick={() => enterScreen(screenIndex + 1)} disabled={!canProceed()} className="btn btn-primary w-full py-3.5">
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
      {current.kind === "type" && (
        <div>
          <h2 className="font-display font-semibold text-xl mb-1.5">What kind of claim is this?</h2>
          <p className="text-sm mb-4" style={{ color: "var(--text-dim)" }}>
            This decides which questions we&apos;ll ask so your claim comes out specific and debatable.
          </p>
          <div className="flex flex-col gap-2.5">
            {CLAIM_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setClaimType(t.id)}
                className={`card card-hover text-left p-4 ${claimType === t.id ? "" : ""}`}
                style={{
                  borderColor: claimType === t.id ? "var(--accent)" : "var(--border)",
                  background: claimType === t.id ? "var(--accent-soft)" : undefined,
                }}
              >
                <p className="font-display font-semibold mb-0.5">{t.label}</p>
                <p className="text-sm mb-1.5" style={{ color: "var(--text-dim)" }}>
                  {t.tagline}
                </p>
                <p className="text-xs italic" style={{ color: "var(--text-faint)" }}>
                  {t.example}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {current.kind === "field" && (
        <StepField step={current.step} answers={answers} onChange={updateAnswer} />
      )}

      {current.kind === "review" && (
        <div>
          <h2 className="font-display font-semibold text-xl mb-1.5">Here&apos;s your claim</h2>
          <p className="text-sm mb-4" style={{ color: "var(--text-dim)" }}>
            We built this from your answers so it&apos;s specific and scoped. Feel free to smooth the wording —
            just don&apos;t undo the specifics.
          </p>
          <textarea
            className="input"
            rows={4}
            value={reviewText}
            autoCapitalize="sentences"
            onChange={(e) => setReviewText(e.target.value)}
          />
          <div className="card p-4 mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-faint)" }}>
              Breakdown
            </p>
            <dl className="text-sm flex flex-col gap-1.5">
              <Row label="Applies to" value={answers.scope} />
              {answers.timeframe && <Row label="Timeframe" value={answers.timeframe} />}
              {(answers.caveats || []).length > 0 && (
                <Row label="Caveats" value={answers.caveats.join("; ")} />
              )}
            </dl>
          </div>
        </div>
      )}

      {current.kind === "references" && (
        <ReferencesEditor references={references} onChange={setReferences} />
      )}

      {current.kind === "record" && (
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

function Row({ label, value }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 w-24" style={{ color: "var(--text-faint)" }}>
        {label}
      </dt>
      <dd style={{ color: "var(--text-dim)" }}>{value}</dd>
    </div>
  );
}
