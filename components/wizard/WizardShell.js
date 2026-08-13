"use client";

export default function WizardShell({ step, totalSteps, onBack, children, footer }) {
  const pct = totalSteps > 1 ? (step / (totalSteps - 1)) * 100 : 100;
  return (
    <div className="max-w-lg mx-auto pt-2">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)" }}
          aria-label="Back"
        >
          ←
        </button>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--accent), var(--accent-2))" }}
          />
        </div>
      </div>

      <div className="mb-8">{children}</div>

      {footer}
    </div>
  );
}
