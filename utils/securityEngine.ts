// utils/securityEngine.ts
//
// Client-side tokenization engine for Schiddle.
// Runs entirely in the browser BEFORE any text is sent to the server/LLM.
// Replaces likely-identifying substrings (proper nouns, school names,
// cities, team/sport names) with stable structural tokens like
// [LOCATION_EDUCATIONAL_1], so the LLM only ever sees abstracted schedule
// structure, never real names, schools, or places.

export interface MaskMap {
  [token: string]: string;
}

interface Category {
  key: string; // token family, e.g. LOCATION_EDUCATIONAL
  regex: RegExp;
}

// Category patterns, ordered so more specific matches win before generic
// "capitalized word" catch-alls run.
const CATEGORY_PATTERNS: Category[] = [
  // Schools / educational institutions
  {
    key: "LOCATION_EDUCATIONAL",
    regex:
      /\b([A-Z][a-zA-Z'’-]*(?:\s+[A-Z][a-zA-Z'’-]*){0,3}\s+(?:High School|Middle School|Elementary|Academy|University|College|Prep|Institute))\b/g,
  },
  // Cities / geographic places (word(s) followed by common state abbreviations,
  // or a small list of directionals + "City"/"County")
  {
    key: "LOCATION_GEOGRAPHIC",
    regex:
      /\b([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?,\s?[A-Z]{2})\b/g,
  },
  // Sports / athletic activities
  {
    key: "ACTIVITY_ATHLETIC",
    regex:
      /\b(Varsity\s+)?(Tennis|Basketball|Soccer|Football|Baseball|Softball|Track(?:\s*&\s*Field)?|Cross\s*Country|Swim(?:ming)?|Volleyball|Lacrosse|Wrestling|Golf|Hockey|Rowing|Crew|Gymnastics|Cheer(?:leading)?)\b/gi,
  },
  // Academic subjects / exams
  {
    key: "ACTIVITY_ACADEMIC",
    regex:
      /\b(AP\s+[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?|Calculus|Chemistry|Biology|Physics|Algebra|Geometry|English|History|SAT|ACT|Finals?|Midterms?)\b/g,
  },
  // Generic person names: "Coach X", "Coach Firstname Lastname", or two
  // consecutive capitalized words not already caught above (heuristic).
  {
    key: "PERSON_NAME",
    regex:
      /\b(Coach\s+[A-Z][a-zA-Z'’-]+(?:\s+[A-Z][a-zA-Z'’-]+)?|Dr\.\s+[A-Z][a-zA-Z'’-]+|Mr\.\s+[A-Z][a-zA-Z'’-]+|Mrs\.\s+[A-Z][a-zA-Z'’-]+|Ms\.\s+[A-Z][a-zA-Z'’-]+)\b/g,
  },
  // Fallback: standalone city/place names that are simple capitalized
  // words known to be common city names (kept intentionally small —
  // avoids over-masking every capitalized word, e.g. "Monday").
  {
    key: "LOCATION_GEOGRAPHIC",
    regex:
      /\b(San Diego|San Francisco|Los Angeles|New York|Chicago|Houston|Phoenix|Philadelphia|San Antonio|Dallas|Austin|Seattle|Denver|Boston|Miami|Atlanta|Portland|Sacramento|San Jose)\b/g,
  },
];

/**
 * Scans raw text and replaces identifiable substrings with stable tokens.
 * Returns the masked text plus a reverse map so the tokens can later be
 * swapped back to their original values entirely client-side.
 */
export function maskSensitiveData(rawText: string): {
  maskedText: string;
  reverseMap: MaskMap;
} {
  let maskedText = rawText;
  const reverseMap: MaskMap = {};
  const counters: { [key: string]: number } = {};

  for (const category of CATEGORY_PATTERNS) {
    // Reset lastIndex since these regexes are reused across calls.
    category.regex.lastIndex = 0;
    maskedText = maskedText.replace(category.regex, (match) => {
      // Avoid re-masking something that's already a token (defensive).
      if (/^\[[A-Z_]+_\d+\]$/.test(match)) return match;

      counters[category.key] = (counters[category.key] || 0) + 1;
      const token = `[${category.key}_${counters[category.key]}]`;
      reverseMap[token] = match;
      return token;
    });
  }

  return { maskedText, reverseMap };
}

/**
 * Swaps tokens in AI output back to their original real-world values.
 * Works on any string (including a JSON string), since it's a plain
 * text find/replace — done natively in-browser, never on the server.
 * Any bracketed token that looks like our scheme but has no matching
 * entry in reverseMap (i.e. the model invented it rather than us
 * having masked it) is stripped out entirely as a safety net, rather
 * than being shown to the user as raw `[SOME_TAG_1]` text.
 */
export function unmaskData(aiOutput: string, reverseMap: MaskMap): string {
  let result = aiOutput;
  for (const [token, originalValue] of Object.entries(reverseMap)) {
    result = result.split(token).join(originalValue);
  }
  // Strip any leftover tokens that match our tagging convention but were
  // never in the reverse map — these are hallucinated by the model, not
  // real masked data, so showing them raw would be a bug, not a feature.
  result = result.replace(/\[[A-Z]+(?:_[A-Z]+)*_\d+\]/g, "").replace(/\s{2,}/g, " ").trim();
  return result;
}

/**
 * Deep-unmasks every string field inside a parsed JSON structure
 * (object or array), rather than doing a single flat string replace.
 * Useful once the AI response has already been JSON.parse()'d.
 */
export function unmaskObject<T>(obj: T, reverseMap: MaskMap): T {
  if (typeof obj === "string") {
    return unmaskData(obj, reverseMap) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => unmaskObject(item, reverseMap)) as unknown as T;
  }
  if (obj && typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[k] = unmaskObject(v, reverseMap);
    }
    return out as T;
  }
  return obj;
}
