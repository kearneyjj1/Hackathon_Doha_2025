// src/engine/interpreter.js
import { ACTION_ALIASES } from "./aliases.js";

const STOP_WORDS = new Set([
  "to", "toward", "towards", "the", "an", "at", "in", "into", "on", "onto",
]);

const DIR_ALIASES = {
  n: "north", north: "north",
  s: "south", south: "south",
  e: "east",  east:  "east",
  w: "west",  west:  "west",

  ne: "northeast", northeast: "northeast",
  nw: "northwest", northwest: "northwest",
  se: "southeast", southeast: "southeast",
  sw: "southwest", southwest: "southwest",
};

// Reverse map: alias -> canonical
const ALIAS_TO_COMMAND = Object.entries(ACTION_ALIASES)
  .flatMap(([cmd, aliases]) => aliases.map((a) => [a.toLowerCase(), cmd]))
  .reduce((acc, [alias, cmd]) => {
    acc[alias] = cmd;
    return acc;
  }, {});

// Candidates for fuzzy matching: include every alias phrase + canonical command names.
// Example: "head" -> "go", "say again" -> "repeat"
const ALL_VERB_PHRASES = Array.from(
  new Set([
    ...Object.keys(ALIAS_TO_COMMAND),
    ...Object.keys(ACTION_ALIASES).map((k) => k.toLowerCase()),
    "help",
  ])
);

const ALL_DIR_WORDS = Array.from(new Set(Object.keys(DIR_ALIASES)));

function normaliseText(input) {
  return (input ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^\w\s?]/g, " ")
    .replace(/\s+/g, " ");
}

function tokenize(input) {
  return normaliseText(input)
    .split(" ")
    .filter(Boolean)
    .filter((t) => !STOP_WORDS.has(t));
}

/* ---------------- Fuzzy matching ---------------- */

// Levenshtein distance (iterative, fast enough for small vocab)
function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;

  const m = a.length, n = b.length;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;

  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(
        dp[j] + 1,       // deletion
        dp[j - 1] + 1,   // insertion
        prev + cost      // substitution
      );
      prev = temp;
    }
  }
  return dp[n];
}

// Conservative threshold: allow 1 typo for short words, 2 for longer.
function maxDistanceFor(word) {
  const L = word.length;
  if (L <= 4) return 1;
  if (L <= 7) return 2;
  return 2;
}

function bestFuzzyMatch(input, candidates) {
  const maxD = maxDistanceFor(input);
  let best = null;
  let bestD = Infinity;

  for (const c of candidates) {
    const d = levenshtein(input, c);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }

  // Require it to be within threshold and also “clearly best”
  if (bestD <= maxD) return { match: best, distance: bestD };
  return null;
}

/* ------------- Verb resolution (supports multi-word + fuzzy) ------------- */

function resolveVerb(tokens) {
  const t0 = tokens[0] ?? "";
  const t1 = tokens[1] ?? "";
  const t2 = tokens[2] ?? "";

  const three = t2 ? `${t0} ${t1} ${t2}` : "";
  const two = t1 ? `${t0} ${t1}` : "";

  // Exact multi-word aliases
  if (three && ALIAS_TO_COMMAND[three]) return { cmd: ALIAS_TO_COMMAND[three], consumed: 3, rawVerb: three };
  if (two && ALIAS_TO_COMMAND[two]) return { cmd: ALIAS_TO_COMMAND[two], consumed: 2, rawVerb: two };
  if (ALIAS_TO_COMMAND[t0]) return { cmd: ALIAS_TO_COMMAND[t0], consumed: 1, rawVerb: t0 };

  // Fuzzy match the verb phrase (try 3-word, then 2-word, then 1-word)
  if (three) {
    const fm = bestFuzzyMatch(three, ALL_VERB_PHRASES);
    if (fm) return { cmd: ALIAS_TO_COMMAND[fm.match] ?? fm.match, consumed: 3, rawVerb: three, fuzzy: fm };
  }
  if (two) {
    const fm = bestFuzzyMatch(two, ALL_VERB_PHRASES);
    if (fm) return { cmd: ALIAS_TO_COMMAND[fm.match] ?? fm.match, consumed: 2, rawVerb: two, fuzzy: fm };
  }
  {
    const fm = bestFuzzyMatch(t0, ALL_VERB_PHRASES);
    if (fm) return { cmd: ALIAS_TO_COMMAND[fm.match] ?? fm.match, consumed: 1, rawVerb: t0, fuzzy: fm };
  }

  // Fall back to literal first token
  return { cmd: t0, consumed: 1, rawVerb: t0 };
}

/* ---------------- Main interpret ---------------- */

function isSingleLetterAnswer(tokens) {
  return tokens.length === 1 && /^[a-z]$/.test(tokens[0]);
}

export function interpret(raw) {
  const input = raw ?? "";
  const tokens = tokenize(input);
  if (tokens.length === 0) return { cmd: "", arg: "", input };

  // help
  if (tokens[0] === "?" || tokens[0] === "help") {
    return { cmd: "help", arg: "", input };
  }

  // single-letter quiz answer
  if (isSingleLetterAnswer(tokens)) {
    return { cmd: "answer", arg: tokens[0], input };
  }

  // direction-only, with fuzzy (e.g. "nroth")
  if (tokens.length === 1) {
    const t = tokens[0];
    if (DIR_ALIASES[t]) return { cmd: "go", arg: DIR_ALIASES[t], input };

    const fm = bestFuzzyMatch(t, ALL_DIR_WORDS);
    if (fm && DIR_ALIASES[fm.match]) return { cmd: "go", arg: DIR_ALIASES[fm.match], input };
  }

  // resolve verb (exact + fuzzy)
  const { cmd: resolvedCmd, consumed } = resolveVerb(tokens);
  const rest = tokens.slice(consumed);

  // go <direction> (direction fuzzy too)
  if (resolvedCmd === "go" && rest.length > 0) {
    const rawDir = rest[0];
    const dir = DIR_ALIASES[rawDir]
      ?? (bestFuzzyMatch(rawDir, ALL_DIR_WORDS)?.match ? DIR_ALIASES[bestFuzzyMatch(rawDir, ALL_DIR_WORDS).match] : null)
      ?? rawDir;

    return { cmd: "go", arg: dir, input };
  }

  // answer <letter>
  if (resolvedCmd === "answer" && rest.length > 0) {
    return { cmd: "answer", arg: rest[0], input };
  }

  // default
  return { cmd: resolvedCmd, arg: rest.join(" "), input };
}
