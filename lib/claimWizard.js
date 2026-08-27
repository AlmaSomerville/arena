// The guided question flow for staking a claim. Instead of a single free
// text box, we walk people through a few pointed questions so what gets
// posted is specific, scoped, and debatable rather than a vague one-liner.
// The answers get composed into a plain sentence (used as the claim's
// title), and are also kept as structured fields so a breakdown can be
// shown on the claim page later.

import { cap } from "@/lib/text";

export const CLAIM_TYPES = [
  {
    id: "comparative",
    label: "X is better than Y",
    tagline: "A head to head comparison between two things.",
    example: "Cheese is better than meat, but better for what, exactly, and for whom?",
  },
  {
    id: "superlative",
    label: "X is the best (or worst)",
    tagline: "A claim that one thing tops (or bottoms) a whole category.",
    example: "Deepak Chopra is the best philosopher, best at what, among whom?",
  },
  {
    id: "assertion",
    label: "A straight up claim",
    tagline: "X is true, X should happen, X causes Y. No comparison needed.",
    example: "Remote work should be the default, for whom, under what conditions?",
  },
];

const VAGUE_WORDS = new Set([
  "good", "bad", "better", "worse", "best", "worst", "great", "amazing",
  "terrible", "quality", "things", "stuff", "overall", "generally", "nice",
]);

export function checkVague(text) {
  const trimmed = (text || "").trim().toLowerCase();
  if (!trimmed) return false;
  // Flag it only when the whole answer is basically just a vague word or
  // two, not when a vague word merely appears inside a longer, real answer.
  const words = trimmed.split(/\s+/).filter(Boolean);
  return words.length <= 2 && words.every((w) => VAGUE_WORDS.has(w.replace(/[.,!?]/g, "")));
}

function req(field, answers) {
  return (answers[field] || "").trim().length > 0;
}

export function isFieldValid(field, answers) {
  if (field === "timeframe" || field === "caveats") return true; // optional
  return req(field, answers);
}

export function getClaimSteps(claimType) {
  if (claimType === "comparative") {
    return [
      { id: "setup", title: "Set up the comparison", fields: ["subjectA", "subjectB", "direction"] },
      { id: "specifics", title: "Make it specific", fields: ["dimension", "scope"] },
      { id: "extra", title: "Anything else?", fields: ["timeframe", "caveats"] },
    ];
  }
  if (claimType === "superlative") {
    return [
      { id: "setup", title: "What's the claim?", fields: ["subjectA", "direction"] },
      { id: "specifics", title: "Make it specific", fields: ["dimension", "scope"] },
      { id: "extra", title: "Anything else?", fields: ["timeframe", "caveats"] },
    ];
  }
  return [
    { id: "setup", title: "What's the claim?", fields: ["subjectA"] },
    { id: "specifics", title: "Who does this apply to?", fields: ["scope"] },
    { id: "extra", title: "Anything else?", fields: ["timeframe", "caveats"] },
  ];
}

export function isStepValid(step, answers) {
  return step.fields.every((f) => isFieldValid(f, answers));
}

export function fieldDef(claimType, fieldId) {
  const DEFS = {
    subjectA: {
      label: claimType === "assertion" ? "Your claim" : "What's the first thing?",
      placeholder: claimType === "assertion" ? "e.g. Remote work should be the default" : "e.g. Cheese",
      autoCapitalize: "sentences",
      sentenceStart: true,
    },
    subjectB: {
      label: "What's it being compared to?",
      placeholder: "e.g. Meat",
      autoCapitalize: "none",
    },
    direction: {
      label: claimType === "superlative" ? "Best or worst?" : "Which way does it go?",
      type: "choice",
      options:
        claimType === "superlative"
          ? [{ value: "best", label: "Best" }, { value: "worst", label: "Worst" }]
          : [{ value: "better", label: "Better" }, { value: "worse", label: "Worse" }],
    },
    dimension: {
      label: claimType === "superlative" ? "Best or worst at what, specifically?" : "Better or worse at what, specifically?",
      placeholder: "e.g. long-term cardiovascular outcomes",
      autoCapitalize: "none",
      vagueCheck: true,
    },
    scope: {
      label: claimType === "comparative" || claimType === "superlative" ? "Applies to whom or what?" : "Who does this apply to?",
      placeholder: "e.g. the average healthy adult",
      autoCapitalize: "none",
      vagueCheck: true,
    },
    timeframe: {
      label: "Any timeframe that matters? (optional)",
      placeholder: "e.g. over a lifetime, as of 2024",
      autoCapitalize: "none",
    },
    caveats: {
      label: "Any caveats or exceptions? (optional)",
      type: "list",
      placeholder: "e.g. doesn't cover people with dairy allergies",
      autoCapitalize: "none",
    },
  };
  return DEFS[fieldId];
}

export function composeDisplayText(claimType, answers) {
  const subjectA = cap((answers.subjectA || "").trim());
  const subjectB = (answers.subjectB || "").trim();
  const dimension = (answers.dimension || "").trim();
  const scope = (answers.scope || "").trim();
  const timeframe = (answers.timeframe || "").trim();
  const direction = answers.direction || "";

  let sentence = "";
  if (claimType === "comparative") {
    sentence = `${subjectA} is ${direction} than ${subjectB}, when it comes to ${dimension}, for ${scope}`;
  } else if (claimType === "superlative") {
    sentence = `${subjectA} is the ${direction} at ${dimension}, among ${scope}`;
  } else {
    sentence = scope ? `${subjectA}, for ${scope}` : subjectA;
  }
  if (timeframe) sentence += `, ${timeframe}`;
  if (!sentence.endsWith(".")) sentence += ".";
  return sentence;
}
