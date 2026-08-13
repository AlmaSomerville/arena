// ============================================================================
// THE ARENA — the guided claim wizard.
//
// The whole point of this file: people are bad at writing precise, debatable
// claims off the top of their head ("cheese is better than meat", "Deepak
// Chopra is the best philosopher"). Rather than a blank textbox, we walk
// them through a small, type-specific set of questions and compose the
// final claim ourselves — forcing the specificity, scope, and caveats that
// good debate needs, without asking anyone to think about "good debate" as
// a concept.
// ============================================================================

export const CLAIM_TYPES = [
  {
    id: "comparative",
    label: "X is better than Y",
    tagline: "A head-to-head comparison between two things.",
    example: '"Cheese is better than meat" → for what, exactly, and for whom?',
  },
  {
    id: "superlative",
    label: "X is the best / worst ___",
    tagline: "A claim that one thing tops (or bottoms) a whole category.",
    example: '"Deepak Chopra is the best philosopher" → best at what, among whom?',
  },
  {
    id: "assertion",
    label: "A straight-up claim",
    tagline: "\"X is true\", \"X should happen\", \"X causes Y\" — no comparison needed.",
    example: '"Remote work should be the default" → under what conditions?',
  },
];

const VAGUE_WORDS = [
  "good", "bad", "better", "worse", "best", "worst", "great", "terrible",
  "awesome", "amazing", "smart", "stupid", "true", "false", "right", "wrong",
  "correct", "incorrect", "nice", "cool", "goat", "superior", "inferior",
];

const VAGUE_ONLY_RE = new RegExp(
  `^(really |very |super |just |so |truly )?(${VAGUE_WORDS.join("|")})\\.?!?$`,
  "i"
);

/**
 * Flags text that's too short or is basically just a bare vague adjective
 * with no actual content ("better", "the best", "really good"). Returns
 * null when the text is fine, or a short nudge string to show the user.
 */
export function checkVague(text, minLength = 12) {
  const trimmed = (text || "").trim();
  if (trimmed.length === 0) return null; // handled by required-field validation
  if (VAGUE_ONLY_RE.test(trimmed)) {
    return `That's just a bare judgment word. Name the actual outcome, metric, or reason instead — e.g. swap "better" for "produces lower LDL cholesterol over a year".`;
  }
  if (trimmed.length < minLength) {
    return `A little more detail will make this much easier to actually debate — aim for a specific, checkable point rather than a one-word verdict.`;
  }
  return null;
}

// ----------------------------------------------------------------------------
// Step definitions per claim type. The wizard UI renders these generically.
// step.type: 'text' | 'textarea' | 'radio' | 'caveats'
// ----------------------------------------------------------------------------

export function getClaimSteps(claimType) {
  if (claimType === "comparative") {
    return [
      {
        key: "subjectA",
        type: "text",
        question: "What's the first thing?",
        placeholder: "e.g. Cheese",
        required: true,
        maxLength: 60,
      },
      {
        key: "subjectB",
        type: "text",
        question: "Compared to what?",
        placeholder: "e.g. Meat",
        required: true,
        maxLength: 60,
      },
      {
        key: "direction",
        type: "radio",
        question: (a) => `Is ${a.subjectA || "the first thing"} better or worse?`,
        options: [
          { value: "better", label: "Better" },
          { value: "worse", label: "Worse" },
        ],
        required: true,
      },
      {
        key: "dimension",
        type: "textarea",
        question: (a) =>
          `Better or worse at what, specifically? What's the actual outcome or metric you mean?`,
        placeholder: "e.g. long-term cardiovascular health outcomes",
        help: '"Better" alone tells no one anything. Name the specific respect: a health outcome, a cost, an environmental impact, a taste category — whatever you actually mean.',
        required: true,
        vague: true,
        minLength: 12,
      },
      {
        key: "scope",
        type: "text",
        question: "Who or what does this apply to?",
        placeholder: "e.g. the average healthy adult eating a balanced diet",
        help: "This is the population or context your claim is actually about — it's not \"all humans forever\" unless you mean that literally.",
        required: true,
        minLength: 5,
      },
      {
        key: "timeframe",
        type: "text",
        question: "Any timeframe or condition worth naming? (optional)",
        placeholder: "e.g. assuming moderate consumption, as of current research",
        required: false,
      },
      {
        key: "caveats",
        type: "caveats",
        question: "Any explicit exceptions or caveats?",
        help: "Who or what does this NOT cover? Add as many as you like — this is what stops replies from being \"well actually, what about...\"",
        required: false,
      },
    ];
  }

  if (claimType === "superlative") {
    return [
      {
        key: "subjectA",
        type: "text",
        question: "Who or what is your claim about?",
        placeholder: "e.g. Deepak Chopra",
        required: true,
        maxLength: 60,
      },
      {
        key: "direction",
        type: "radio",
        question: "Best, or worst?",
        options: [
          { value: "best", label: "Best" },
          { value: "worst", label: "Worst" },
        ],
        required: true,
      },
      {
        key: "dimension",
        type: "textarea",
        question: (a) =>
          `Best or worst ${a.direction === "worst" ? "" : ""}at what, specifically?`,
        placeholder: "e.g. building an internally consistent, testable metaphysics",
        help: '"Best philosopher" could mean most influential, most rigorous, best writer, most quoted... pick the one you actually mean.',
        required: true,
        vague: true,
        minLength: 12,
      },
      {
        key: "subjectB",
        type: "text",
        question: "Among which group, exactly?",
        placeholder: "e.g. popular self-help authors publishing since 1990",
        help: 'This is the field they\'re beating. "Of all time", "living", and "in wellness" are all wildly different contests — name the one you mean.',
        required: true,
        minLength: 5,
      },
      {
        key: "scope",
        type: "text",
        question: "Anyone this judgment is from the perspective of? (optional, but useful)",
        placeholder: "e.g. by the standards of academic philosophy",
        help: "Whose standard of \"best\" is this — a specific field, a specific audience, your own?",
        required: false,
      },
      {
        key: "timeframe",
        type: "text",
        question: "Any timeframe worth naming? (optional)",
        placeholder: "e.g. as of 2026",
        required: false,
      },
      {
        key: "caveats",
        type: "caveats",
        question: "Any explicit exceptions or caveats?",
        help: "Anyone or anything you'd carve out of this ranking?",
        required: false,
      },
    ];
  }

  // assertion
  return [
    {
      key: "subjectA",
      type: "text",
      question: "What's your claim about?",
      placeholder: "e.g. Remote work",
      required: true,
      maxLength: 60,
    },
    {
      key: "direction",
      type: "radio",
      question: "Is this a statement of fact, or an opinion about what should happen?",
      options: [
        { value: "factual", label: "It's a fact (is/does/causes)" },
        { value: "normative", label: "It's a should (ought to/should)" },
      ],
      required: true,
    },
    {
      key: "dimension",
      type: "textarea",
      question: (a) =>
        a.direction === "normative"
          ? `What specifically should happen, and why?`
          : `What specifically is true, and what's the mechanism or evidence?`,
      placeholder: "e.g. should be the default for any role that doesn't require physical presence, because it measurably improves retention",
      help: "Say exactly what you're claiming and, if you can, why — not just a verdict.",
      required: true,
      vague: true,
      minLength: 15,
    },
    {
      key: "scope",
      type: "text",
      question: "Who or what does this apply to?",
      placeholder: "e.g. knowledge-work roles at companies over 50 people",
      required: true,
      minLength: 5,
    },
    {
      key: "timeframe",
      type: "text",
      question: "Any timeframe or condition worth naming? (optional)",
      placeholder: "e.g. under current remote-tooling norms",
      required: false,
    },
    {
      key: "caveats",
      type: "caveats",
      question: "Any explicit exceptions or caveats?",
      required: false,
    },
  ];
}

// ----------------------------------------------------------------------------
// Replies: same rigor, scoped to a specific part of the parent claim so a
// reply can't wander off-topic.
// ----------------------------------------------------------------------------

export function getReplyAddressOptions(parent) {
  const opts = [
    { value: "comparison", label: `The core claim itself: "${parent.display_text}"` },
    { value: "dimension", label: `The specific point: "${parent.dimension}"` },
    { value: "scope", label: `Who it applies to: "${parent.scope}"` },
  ];
  if (parent.timeframe) {
    opts.push({ value: "timeframe", label: `The timeframe/condition: "${parent.timeframe}"` });
  }
  (parent.caveats || []).forEach((c, i) => {
    opts.push({ value: `caveat:${i}`, label: `The caveat: "${c}"` });
  });
  return opts;
}

export function getReplySteps(parent) {
  return [
    {
      key: "stance",
      type: "radio",
      question: "What's your reply doing?",
      options: [
        { value: "support", label: "Backing it up" },
        { value: "challenge", label: "Pushing back on it" },
        { value: "nuance", label: "Adding nuance / a caveat" },
      ],
      required: true,
    },
    {
      key: "addresses",
      type: "radio",
      question: "Which specific part of the claim are you replying to?",
      help: "Keep replies on-topic — pick the exact part you're responding to.",
      options: getReplyAddressOptions(parent),
      required: true,
    },
    {
      key: "dimension",
      type: "textarea",
      question: "Make your specific point.",
      placeholder: "State exactly what you're adding, disputing, or backing up — with the reasoning.",
      help: "Same rule as always: a specific, checkable point beats a verdict.",
      required: true,
      vague: true,
      minLength: 12,
    },
    {
      key: "scope",
      type: "text",
      question: "Does your point apply to everyone the original claim covers, or a narrower group? (optional)",
      placeholder: "e.g. specifically people with lactose intolerance",
      required: false,
      defaultFrom: (parent) => parent.scope,
    },
    {
      key: "caveats",
      type: "caveats",
      question: "Any caveats on your reply? (optional)",
      required: false,
    },
  ];
}

// ----------------------------------------------------------------------------
// Compose the canonical, human-readable sentence from wizard answers.
// The user gets to lightly edit this before posting, but it always starts
// from a properly-scoped sentence rather than a blank box.
// ----------------------------------------------------------------------------

export function composeDisplayText(claimType, a) {
  const caveatSuffix =
    a.caveats && a.caveats.length
      ? ` (Doesn't cover: ${a.caveats.join("; ")}.)`
      : "";
  const timeframePart = a.timeframe ? `, ${a.timeframe}` : "";

  if (claimType === "comparative") {
    return `${a.subjectA} is ${a.direction} than ${a.subjectB} when it comes to ${a.dimension}, for ${a.scope}${timeframePart}.${caveatSuffix}`;
  }

  if (claimType === "superlative") {
    const scopePart = a.scope ? `, ${a.scope}` : "";
    return `${a.subjectA} is the ${a.direction} at ${a.dimension} among ${a.subjectB}${scopePart}${timeframePart}.${caveatSuffix}`;
  }

  // assertion
  const verb = a.direction === "normative" ? "should" : "";
  const lead = verb ? `${a.subjectA} ${verb} — ${a.dimension}` : `${a.subjectA}: ${a.dimension}`;
  return `${lead}, for ${a.scope}${timeframePart}.${caveatSuffix}`;
}

export function composeReplyText(parent, a) {
  const stanceWord =
    a.stance === "support" ? "Backing this up" : a.stance === "challenge" ? "Pushing back" : "Adding nuance";
  const addressed = getReplyAddressOptions(parent).find((o) => o.value === a.addresses);
  const scopePart = a.scope ? ` This applies to ${a.scope}.` : "";
  const caveatSuffix =
    a.caveats && a.caveats.length ? ` (Doesn't cover: ${a.caveats.join("; ")}.)` : "";
  return `${stanceWord} on ${addressed ? addressed.label.split(":")[0].toLowerCase() : "this claim"}: ${a.dimension}.${scopePart}${caveatSuffix}`;
}
