import { convertToSecInt } from "../../services/timeFunctions";

export const PIXELS_PER_SECOND = 200;
export const MAX_TRACKS = 3;

// Accent per subtitle track (by track number, so a track keeps its colour when
// another one is removed). Bright, colour-blind-friendly hues (Okabe-Ito
// family, lifted for a dark band): each is >= 8:1 against the band and takes
// dark text when filled.
export const TRACK_COLORS = ["#6cb8ff", "#ffb547", "#3ddc97"];

const MIN_WIDTH = 24;

let measureCtx = null;
const widthCache = new Map();

function measureText(text, font) {
  const key = font + "|" + text;
  let width = widthCache.get(key);
  if (width === undefined) {
    if (!measureCtx) measureCtx = document.createElement("canvas").getContext("2d");
    measureCtx.font = font;
    width = measureCtx.measureText(text).width;
    widthCache.set(key, width);
  }
  return width;
}

// Web fonts can finish loading after the first measurement.
export function clearMeasureCache() {
  widthCache.clear();
}

// Font size that fills a lane of the given height.
export function laneFontSize(laneHeight, max = 40) {
  return Math.max(16, Math.min(max, Math.round(laneHeight * 0.5)));
}

// Collects the subtitle tracks that actually contain dialogue.
export function loadedTracks(app) {
  const tracks = [];
  for (let n = 1; n <= MAX_TRACKS; n++) {
    const dialogue = app[`srt${n}`];
    const times = app[`time${n}`];
    const hasText =
      Array.isArray(dialogue) &&
      Array.isArray(times) &&
      dialogue.some((line) => typeof line === "string" && line.trim());
    if (hasText) {
      tracks.push({
        number: n,
        name: (app.trackNames && app.trackNames[n - 1]) || `Track ${n}`,
        dialogue,
        times,
      });
    }
  }
  return tracks;
}

// Turns one SRT track into positioned cues, sorted by start time.
// Text is stretched across its duration with letter-spacing (one DOM node per
// cue instead of one per letter); text too long for its slot shrinks, then
// gets squeezed horizontally so it never spills into the next line.
export function buildCues(dialogue, times, { fontFamily, pps, baseFont }) {
  const cues = [];
  let maxDuration = 0;
  if (!Array.isArray(dialogue) || !Array.isArray(times)) {
    return { cues, maxDuration };
  }
  const font = `700 ${baseFont}px ${fontFamily}`;
  const minFont = Math.round(baseFont * 0.6);
  const hPadding = Math.round(baseFont * 0.4) + 4; // padding + borders
  const maxLetterSpacing = baseFont * 0.8; // beyond this a word stops reading as one

  for (let i = 0; i < dialogue.length; i++) {
    const text = typeof dialogue[i] === "string" ? dialogue[i].trim() : "";
    const pair = times[i];
    if (!text || !Array.isArray(pair)) continue;

    const start = convertToSecInt(pair[0]);
    const end = convertToSecInt(pair[1]);
    if (!isFinite(start) || !isFinite(end) || end < start) continue;

    const width = Math.max((end - start) * pps, MIN_WIDTH);
    const inner = Math.max(width - hPadding, 1);
    const textWidth = measureText(text, font);
    const chars = Array.from(text).length;

    let fontSize = baseFont;
    let letterSpacing = 0;
    let scaleX = 1;
    if (textWidth <= inner) {
      if (chars > 1) {
        letterSpacing = Math.min(maxLetterSpacing, (inner - textWidth) / (chars - 1));
      }
    } else {
      fontSize = Math.max(minFont, (baseFont * inner) / textWidth);
      const scaledWidth = (textWidth * fontSize) / baseFont;
      if (scaledWidth > inner) scaleX = inner / scaledWidth;
    }

    maxDuration = Math.max(maxDuration, end - start);
    cues.push({ id: i, text, start, end, width, fontSize, letterSpacing, scaleX });
  }

  cues.sort((a, b) => a.start - b.start);
  return { cues, maxDuration };
}

// First index whose start >= t (or > t when `inclusive`).
function lowerBound(cues, t, inclusive = false) {
  let lo = 0;
  let hi = cues.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cues[mid].start < t || (inclusive && cues[mid].start === t)) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function cuesInRange({ cues, maxDuration }, from, to) {
  const out = [];
  for (let i = lowerBound(cues, from - maxDuration); i < cues.length; i++) {
    const cue = cues[i];
    if (cue.start >= to) break;
    if (cue.end > from) out.push(cue);
  }
  return out;
}

// The cue under the sync line at time t, or null.
export function activeCueId({ cues, maxDuration }, t) {
  for (let i = lowerBound(cues, t, true) - 1; i >= 0; i--) {
    const cue = cues[i];
    if (cue.start < t - maxDuration) break;
    if (cue.start <= t && cue.end > t) return cue.id;
  }
  return null;
}
