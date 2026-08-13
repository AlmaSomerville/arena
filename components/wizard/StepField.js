"use client";

import { useState } from "react";
import { checkVague } from "@/lib/claimWizard";

// A screen is either a single field (step.type is text/textarea/radio/caveats)
// or a group of a few closely-related fields shown together (step.type ===
// "group", step.fields is an array of the same field shapes). Grouping
// keeps things like "better or worse, and in what way?" on one screen
// instead of two disconnected ones.
export default function StepField({ step, answers, onChange }) {
  const title = typeof step.question === "function" ? step.question(answers) : step.question;

  if (step.type === "group") {
    return (
      <div className="fade-in">
        <h2 className="font-display font-semibold text-xl leading-snug mb-1.5">{title}</h2>
        {step.help && (
          <p className="text-sm mb-4" style={{ color: "var(--text-dim)" }}>
            {step.help}
          </p>
        )}
        {!step.help && <div className="mb-4" />}
        <div className="flex flex-col gap-5">
          {step.fields.map((field) => (
            <FieldControl key={field.key} field={field} answers={answers} onChange={onChange} showLabel />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <h2 className="font-display font-semibold text-xl leading-snug mb-1.5">{title}</h2>
      {step.help && (
        <p className="text-sm mb-4" style={{ color: "var(--text-dim)" }}>
          {step.help}
        </p>
      )}
      {!step.help && <div className="mb-4" />}
      <FieldControl field={step} answers={answers} onChange={onChange} />
    </div>
  );
}

function FieldControl({ field, answers, onChange, showLabel = false }) {
  const value = answers[field.key];
  const label = typeof field.label === "function" ? field.label(answers) : field.label;
  const [touched, setTouched] = useState(false);
  const vagueWarning = field.vague && touched ? checkVague(value, field.minLength) : null;

  return (
    <div>
      {showLabel && label && (
        <p className="text-sm font-semibold mb-1.5" style={{ color: "var(--text-dim)" }}>
          {label}
        </p>
      )}

      {field.type === "text" && (
        <input
          className="input"
          placeholder={field.placeholder}
          maxLength={field.maxLength || 200}
          value={value || ""}
          autoCapitalize={field.autoCapitalize || "words"}
          onChange={(e) => onChange(field.key, e.target.value)}
          onBlur={() => setTouched(true)}
        />
      )}

      {field.type === "textarea" && (
        <>
          <textarea
            className="input"
            rows={field.rows || 3}
            placeholder={field.placeholder}
            maxLength={field.maxLength || 400}
            value={value || ""}
            autoCapitalize={field.autoCapitalize || "sentences"}
            onChange={(e) => onChange(field.key, e.target.value)}
            onBlur={() => setTouched(true)}
          />
          {vagueWarning && (
            <p className="text-sm mt-2 flex items-start gap-1.5" style={{ color: "#ffb03b" }}>
              <span>⚠</span> <span>{vagueWarning}</span>
            </p>
          )}
        </>
      )}

      {field.type === "radio" && (
        <div className="flex gap-2 flex-wrap">
          {field.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange(field.key, opt.value)}
              className={`btn text-left justify-start px-4 py-3 flex-1 min-w-[45%] ${
                value === opt.value ? "btn-primary" : "btn-ghost"
              }`}
              style={{ whiteSpace: "normal", lineHeight: 1.4 }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {field.type === "radio-list" && (
        <div className="flex flex-col gap-2">
          {field.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange(field.key, opt.value)}
              className={`btn text-left justify-start px-4 py-3.5 ${
                value === opt.value ? "btn-primary" : "btn-ghost"
              }`}
              style={{ whiteSpace: "normal", lineHeight: 1.4 }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {field.type === "caveats" && <CaveatsEditor value={value || []} onChange={(v) => onChange(field.key, v)} />}
    </div>
  );
}

function CaveatsEditor({ value, onChange }) {
  const [draft, setDraft] = useState("");

  function add() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...value, trimmed]);
    setDraft("");
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          className="input"
          placeholder="e.g. doesn't apply to people with allergies"
          autoCapitalize="none"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button onClick={add} className="btn btn-ghost shrink-0">
          Add
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-col gap-2 mt-3">
          {value.map((c, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
            >
              <span style={{ color: "var(--text-dim)" }}>{c}</span>
              <button
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                style={{ color: "var(--text-faint)" }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
