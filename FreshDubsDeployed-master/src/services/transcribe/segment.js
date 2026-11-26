// Turns word-level timestamps from speech recognition into dubbing lines:
// short enough to read on the rythmoband, split where the speaker pauses or
// finishes a sentence.

export const DEFAULT_LINE_OPTIONS = {
  pauseGap: 0.5, // seconds of silence that always starts a new line
  maxDuration: 6, // seconds
  maxChars: 80,
  minDuration: 0.6, // stretch very short lines so they stay readable
};

const SENTENCE_END = /[.!?。！？…]["'”’)\]]*$/;
const CLAUSE_END = /[,;:，、；：]["'”’)\]]*$/;
// Whisper emits sound tags like "[Music]" or "(laughs)" for non-speech.
const SOUND_TAG = /^\s*[[(（【♪].*[\])）】♪]\s*$/;
// Scripts written without spaces between words.
const NO_SPACE_SCRIPT = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\u0e00-\u0e7f]/;

export function cleanWords(words) {
  return words
    .map((w) => {
      const start = w.start == null ? NaN : Number(w.start);
      // Whisper sometimes leaves the final word's end open.
      const end = w.end == null ? start + 0.3 : Number(w.end);
      return { text: String(w.text || ""), start, end };
    })
    .filter(
      (w) =>
        w.text.trim() &&
        !SOUND_TAG.test(w.text) &&
        Number.isFinite(w.start) &&
        Number.isFinite(w.end)
    )
    .map((w) => ({ ...w, end: Math.max(w.end, w.start) }))
    .sort((a, b) => a.start - b.start);
}

const PUNCTUATION = /[\s.,!?;:"'“”‘’()[\]。！？，、；：…-]/g;
const normalize = (w) => w.text.replace(PUNCTUATION, "").toLowerCase();

// Whisper can get stuck repeating a phrase, usually over music. Collapse a
// run of the same phrase to its first occurrence. A single repeated word is
// only treated as a loop after five in a row ("no, no, no" is real speech).
export function collapseRepeats(words, maxPhrase = 16) {
  const keys = words.map(normalize);
  const sameAt = (i, r, k) => {
    for (let j = 0; j < k; j++) if (keys[i + r * k + j] !== keys[i + j]) return false;
    return true;
  };
  const out = [];
  let i = 0;
  while (i < words.length) {
    let phrase = 0;
    let reps = 1;
    for (let k = 1; k <= maxPhrase && i + k * 2 <= words.length && keys[i]; k++) {
      reps = 1;
      while (i + (reps + 1) * k <= words.length && sameAt(i, reps, k)) reps++;
      if (reps >= (k === 1 ? 5 : 3)) {
        phrase = k;
        break;
      }
    }
    if (phrase) {
      out.push(...words.slice(i, i + phrase));
      i += phrase * reps;
    } else {
      out.push(words[i]);
      i++;
    }
  }
  return out;
}

// Commas and full stops that belong to the end of the previous line.
const LEADING_PUNCTUATION = /^[\s,.;:、，。；：！？!?]+/;

function joinText(words) {
  const raw = words.map((w) => w.text).join("");
  // Whisper prefixes words with a space where the language uses spaces.
  return raw.replace(/\s+/g, " ").trim().replace(LEADING_PUNCTUATION, "");
}

function textLength(words) {
  const text = joinText(words);
  return NO_SPACE_SCRIPT.test(text) ? text.replace(/\s/g, "").length * 2 : text.length;
}

export function wordsToLines(words, options = {}) {
  const opts = { ...DEFAULT_LINE_OPTIONS, ...options };
  const clean = collapseRepeats(cleanWords(words));
  const lines = [];
  let current = [];

  const flush = () => {
    if (!current.length) return;
    lines.push({
      start: current[0].start,
      end: current[current.length - 1].end,
      text: joinText(current),
    });
    current = [];
  };

  for (const word of clean) {
    if (current.length) {
      const last = current[current.length - 1];
      const lineStart = current[0].start;
      const gap = word.start - last.end;
      const duration = word.end - lineStart;
      const tooLong =
        duration > opts.maxDuration || textLength([...current, word]) > opts.maxChars;
      const sentenceDone = SENTENCE_END.test(last.text.trim()) && last.end - lineStart >= 1;
      // A comma is a fine place to break once the line is already well filled.
      const clauseBreak =
        CLAUSE_END.test(last.text.trim()) &&
        (last.end - lineStart > opts.maxDuration * 0.6 ||
          textLength(current) > opts.maxChars * 0.6);

      if (gap >= opts.pauseGap || tooLong || sentenceDone || clauseBreak) flush();
    }
    current.push(word);
  }
  flush();

  // Give very short lines a minimum duration without overlapping the next one.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.end - line.start < opts.minDuration) {
      const limit = i + 1 < lines.length ? lines[i + 1].start : Infinity;
      line.end = Math.min(line.start + opts.minDuration, limit);
    }
  }
  return lines.filter((line) => line.text);
}
