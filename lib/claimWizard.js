// ============================================================================
// THE ARENA — the guided claim wizard.
//
// The whole point of this file: people are bad at writing precise, debatable
// claims off the top of their head ("cheese is better than meat", "Deeprak
// Chopra is the best philosopher"). Rather than a blank textbox, we walk
// them through a small, type-specific set of questions and compose the
// final claim ourselves — forcing the specificity, scope, and caveats that
// good debate needs, without asking anyone to think about "good debate" as
// a concept.
//
// Related questions are grouped onto one screen (e.g. "better or worse, and
// in what way?") instead of spread across disconnected screens, and every
// question is phrased as plainly as possible.
// ============================================================================

export const CLAIM_TYPES = [
  {
    id: "comparative",
    label: "X is better than Y",
    tagline: "A head-to-head comparison between two things.",
    example: '"Cheese is better than meat" — better for what, exactly, and for whom?',
  },
  {
    id: "superlative",
    label: "X is the best (or worst)",
    tagline: "A claim that one thing tops (or bottoms) a whole category.",
    example: '"Deepak Chopra is the best philosopher" — best at what, among whom?',
  },
  {
    id: "assertion",
    label: "A straight-up claim",
    tagline: '"X is true", "X should happen", "X causes Y" — no comparison needed.',
    example: '"Remote work should be the default" — for whom, under what conditions?',
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
    return `That's just a bare judgment word — swap it for the actual outcome or reason (e.g. "lower LDL cholesterol over a year" instead of "better").`;
  }
  if (trimmed.length < minLength) {
    return `A bit more detail will make this much easier to actually debate.`;
  }
  return null;
}

/** Capitalizes just the first letter — used when composing sentences so a
 * lowercase "cheese" typed into a field still reads as a proper sentence. */
export function cap(text) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Validates a single field's current answer against its own rules
 * (required / minLength / vague-check). Shared by single-field steps and
 * each sub-field inside a "group" step. */
export function isFieldValid(field, answers) {
  const value = answers[field.key];
  if (field.type === "caveats") return true;
  if (!field.required) return true;
  if (!value || (typeof value === "string" && !value.trim())) return false;
  if (field.minLength && value.trim().length < field.minLength) return false;
  if (field.vague && checkVague(value, field.minLength)) return false;
  return true;
}

/** Validates an entire screen — either one field or a group of them. */
export function isStepValid(step, answers) {
  if (step.type === "group") return step.fields.every((f) => isFieldValid(f, answers));
  return isFieldValid(step, answers);
}

// ----------------------------------------------------------------------------
// Step definitions per claim type. Each entry is either a single field or a
// { type: "group", fields: [...] } screen combining a couple of closely
// related fields (e.g. a quick either/or plus the follow-up detail).
// ----------------------------------------------------------------------------

export function getClaimSteps(claimType) {
  if (claimType === "comparative") {
    return [
      {
        type: "group",
        question: "What are you comparing?",
        fields: [
          {
            key: "subjectA",
            type: "text",
            label: "First thing",
            placeholder: "e.g. Cheese",
            required: true,
            maxLength: 60,
          },
          {
            key: "subjectB",
            type: "text",
            label: "Compared to",
            placeholder: "e.g. Meat",
            required: true,
            maxLength: 60,
          },
        ],
      },
      {
        type: "group",
        question: (a) =>
          a.subjectA && a.subjectB
            ? `Is ${a.subjectA} better or worse than ${a.subjectB} — and in what specific way?`
            : "Better or worse — and in what specific way?",
        help: '"Better" alone tells no one anything. Name the actual respect you mean: a health outcome, a cost, an environmental impact, a taste category — whatever you actually mean.',
        fields: [
          {
            key: "direction",
            type: "radio",
            options: [
              { value: "better", label: "Better" },
              { value: "worse", label: "Worse" },
            ],
            required: true,
          },
          {
            key: "dimension",
            type: "textarea",
            label: "In what specific way?",
            placeholder: "e.g. long-term cardiovascular health outcomes",
            required: true,
            vague: true,
            minLength: 12,
            autoCapitalize: "sentences",
          },
        ],
      },
      {
        key: "scope",
        type: "text",
        question: "Who does this apply to?",
        placeholder: "e.g. the average healthy adult eating a balanced diet",
        help: "This is the population your claim is actually about — it's not \"all humans forever\" unless you mean that literally.",
        required: true,
        minLength: 5,
        autoCapitalize: "sentences",
      },
      {
        key: "timeframe",
        type: "text",
        question: "Any conditions or timeframe worth naming?",
        help: "Optional — skip if there's nothing to add.",
        placeholder: "e.g. assuming moderate consumption",
        required: false,
        autoCapitalize: "sentences",
      },
      {
        key: "caveats",
        type: "caveats",
        question: "Any explicit exceptions?",
        help: "Optional. Who or what does this NOT cover? This is what stops replies from being \"well actually, what about...\"",
        required: false,
      },
    ];
  }

  if (claimType === "superlative") {
    return [
      {
        key: "subjectA",
        type: "text",
        question: "Who or what is this about?",
        placeholder: "e.g. Deepak Chopra",
        required: true,
        maxLength: 60,
      },
      {
        type: "group",
        question: (a) =>
          a.subjectA ? `Is ${a.subjectA} the best or the worst — at what, exactly?` : "Best or worst — at what, exactly?",
        help: '"Best philosopher" could mean most influential, most rigorous, best writer, most quoted... pick the one you actually mean.',
        fields: [
          {
            key: "direction",
            type: "radio",
            options: [
              { value: "best", label: "Best" },
              { value: "worst", label: "Worst" },
            ],
            required: true,
          },
          {
            key: "dimension",
            type: "textarea",
            label: "At what, exactly?",
            placeholder: "e.g. building an internally consistent, testable metaphysics",
            required: true,
            vague: true,
            minLength: 12,
            autoCapitalize: "sentences",
          },
        ],
      },
      {
        key: "subjectB",
        type: "text",
        question: (a) =>
          `${cap(a.direction) || "Best or worst"} among which group, exactly?`,
        placeholder: "e.g. popular self-help authors publishing since 1990",
        help: 'This is the field they\'re beating. "Of all time", "living", and "in wellness" are all different contests — name the one you mean.',
        required: true,
        minLength: 5,
        autoCapitalize: "sentences",
      },
      {
        key: "scope",
        type: "text",
        question: "Whose standard is this judged by?",
        help: "Optional — a specific field, a specific audience, your own.",
        placeholder: "e.g. by the standards of academic philosophy",
        required: false,
        autoCapitalize: "sentences",
      },
      {
        key: "timeframe",
        type: "text",
        question: "Any timeframe worth naming?",
        help: "Optional — skip if there's nothing to add.",
        placeholder: "e.g. as of 2026",
        required: false,
        autoCapitalize: "sentences",
      },
      {
        key: "caveats",
        type: "caveats",
        question: "Any explicit exceptions?",
        help: "Optional. Anyone or anything you'd carve out of this ranking?",
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
      type: "group",
      question: "What exactly are you claiming?",
      fields: [
        {
          key: "direction",
          type: "radio-list",
          options: [
            { value: "factual", label: "It's a fact — something that is, does, or causes something" },
            { value: "normative", label: "It's an opinion about what should happen" },
          ],
          required: true,
        },
        {
          key: "dimension",
          type: "textarea",
          label: (a) =>
            a.direction === "normative"
              ? "What should happen, and why?"
              : "What's true, and what's the evidence or mechanism?",
          placeholder:
            "e.g. should be the default for any role that doesn't require physical presence, because it measurably improves retention",
          required: true,
          vague: true,
          minLength: 15,
          autoCapitalize: "sentences",
        },
      ],
    },
    {
      key: "scope",
      type: "text",
      question: "Who or what does this apply to?",
      placeholder: "e.g. knowledge-work roles at companies over 50 people",
      required: true,
      minLength: 5,
      autoCapitalize: "sentences",
    },
    {
      key: "timeframe",
      type: "text",
      question: "Any conditions or timeframe worth naming?",
      help: "Optional — skip if there's nothing to add.",
      placeholder: "e.g. under current remote-tooling norms",
      required: false,
      autoCapitalize: "sentences",
    },
    {
      key: "caveats",
      type: "caveats",
      question: "Any explicit exceptions?",
      help: "Optional.",
      required: false,
    },
  ];
}

// ----------------------------------------------------------------------------
// Replies: same rigor, scoped to a specific part of the parent claim so a
// reply can't wander off-topic.
// ----------------------------------------------------------------------------

function truncate(text, max = 60) {
  if (!text || text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

export function getReplyAddressOptions(parent) {
  const opts = [
    { value: "comparison", label: `The claim itself — "${truncate(parent.display_text, 70)}"` },
    { value: "dimension", label: `The specific point — "${truncate(parent.dimension)}"` },
    { value: "scope", label: `Who it applies to — "${truncate(parent.scope)}"` },
  ];
  if (parent.timeframe) {
    opts.push({ value: "timeframe", label: `The timeframe or condition — "${truncate(parent.timeframe)}"` });
  }
  (parent.caveats || []).forEach((c, i) => {
    opts.push({ value: `caveat:${i}`, label: `The caveat — "${truncate(c)}"` });
  });
  return opts;
}

export function getReplySteps(parent) {
  return [
    {
      type: "group",
      question: "What's your reply doing, and which part is it about?",
      fields: [
        {
          key: "stance",
          type: "radio-list",
          label: "What's your reply doing?",
          options: [
            { value: "support", label: "Backing it up" },
            { value: "challenge", label: "Pushing back on it" },
            { value: "nuance", label: "Adding nuance or a caveat" },
          ],
          required: true,
        },
        {
          key: "addresses",
          type: "radio-list",
          label: "Which part of the claim?",
          options: getReplyAddressOptions(parent),
          required: true,
        },
      ],
    },
    {
      key: "dimension",
      type: "textarea",
      question: "What's your specific point?",
      placeholder: "State exactly what you're adding, disputing, or backing up — with the reasoning.",
      help: "Same rule as always: a specific, checkable point beats a one-word verdict.",
      required: true,
      vague: true,
      minLength: 12,
      autoCapitalize: "sentences",
    },
    {
      key: "scope",
      type: "text",
      question: "Does this apply to everyone the claim covers, or a narrower group?",
      help: "Optional — leave blank if it's the same as the original claim.",
      placeholder: "e.g. specifically people with lactose intolerance",
      required: false,
      autoCapitalize: "sentences",
      defaultFrom: (parent) => parent.scope,
    },
    {
      key: "caveats",
      type: "caveats",
      question: "Any caveats on your reply?",
      help: "Optional.",
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
    return `${cap(a.subjectA)} is ${a.direction} than ${a.subjectB} when it comes to ${a.dimension}, for ${a.scope}${timeframePart}.${caveatSuffix}`;
  }

  if (claimType === "superlative") {
    const scopePart = a.scope ? `, ${a.scope}` : "";
    return `${cap(a.subjectA)} is the ${a.direction} at ${a.dimension} among ${a.subjectB}${scopePart}${timeframePart}.${caveatSuffix}`;
  }

  // assertion
  const verb = a.direction === "normative" ? "should" : "";
  const lead = verb ? `${cap(a.subjectA)} ${verb} — ${a.dimension}` : `${cap(a.subjectA)}: ${a.dimension}`;
  return `${lead}, for ${a.scope}${timeframePart}.${caveatSuffix}`;
}

export function composeReplyText(parent, a) {
  const stanceWord =
    a.stance === "support" ? "Backing this up" : a.stance === "challenge" ? "Pushing back" : "Adding nuance";
  const addressed = getReplyAddressOptions(parent).find((o) => o.value === a.addresses);
  const scopePart = a.scope ? ` This applies to ${a.scope}.` : "";
  const caveatSuffix =
    a.caveats && a.caveats.length ? ` (Doesn't cover: ${a.caveats.join("; ")}.)` : "";
  const addressedLabel = addressed ? addressed.label.split(" — ")[0].toLowerCase() : "this claim";
  return `${stanceWord} on ${addressedLabel}: ${cap(a.dimension)}.${scopePart}${caveatSuffix}`;
}
