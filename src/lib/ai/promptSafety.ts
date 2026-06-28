/**
 * Lightweight prompt-injection / abuse detection.
 * Not a substitute for upstream moderation, but blocks the common cheap attacks
 * before we spend Gemini tokens on them.
 */

const INJECTION_PATTERNS: RegExp[] = [
  // Classic instruction overrides
  /ignore (all |the |any )?(previous|prior|above) (instructions?|prompts?|rules?)/i,
  /disregard (all |the |any )?(previous|prior|above)/i,
  /forget (all |the |any )?(previous|prior|above|everything)/i,
  // Role hijacking
  /you are (now |an? )?(?:dan|jailbroken|unrestricted|uncensored|developer mode)/i,
  /act as (?:dan|an? (?:unrestricted|uncensored|jailbroken))/i,
  /pretend to be (?:dan|an? (?:unrestricted|uncensored|jailbroken))/i,
  // System-prompt extraction
  /reveal (?:the |your )?(?:system |initial )?(?:prompt|instructions?)/i,
  /print (?:the |your )?(?:system|initial)(?: prompt| instructions?)?/i,
  // Output coercion
  /output the (?:above|prior|previous) (?:text|prompt|instructions?) verbatim/i,
];

const HARMFUL_INTENT_PATTERNS: RegExp[] = [
  /how (do|can) i (make|build|create) (a |an )?(bomb|explosive|weapon|gun)/i,
  /child (porn|sexual|abuse)/i,
  /self[- ]?harm methods?/i,
  /(how to|ways to) (commit suicide|kill myself)/i,
];

export type PromptCheckResult =
  | { ok: true }
  | { ok: false; reason: "injection" | "harmful" | "length" | "empty" };

export function checkPromptSafety(
  prompt: string,
  maxLength: number,
): PromptCheckResult {
  const trimmed = prompt.trim();

  if (trimmed.length === 0) return { ok: false, reason: "empty" };
  if (trimmed.length > maxLength) return { ok: false, reason: "length" };

  for (const pattern of HARMFUL_INTENT_PATTERNS) {
    if (pattern.test(trimmed)) return { ok: false, reason: "harmful" };
  }

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) return { ok: false, reason: "injection" };
  }

  return { ok: true };
}
