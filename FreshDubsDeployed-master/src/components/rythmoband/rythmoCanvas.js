// Canvas version of the rythmoband, burned into generated videos so the
// export matches what the actor sees in the editor.
import {
  TRACK_COLORS,
  buildCues,
  cuesInRange,
  activeCueId,
  laneFontSize,
  loadedTracks,
} from "./cueLayout";

const FONT_FAMILY = "Arial, Helvetica, sans-serif";
const PADDING = 10;
const GAP = 6;
const SYNC_LINE = 0.25;

// Studio-dark palette (mirrors rythmoband.module.css).
const BAND_TOP = "#18181c";
const BAND_BOTTOM = "#111114";
const CUE_BG = "#26262d";
const CUE_TEXT = "#f4f4f5";
const CUE_ACTIVE_TEXT = "#0b0b0d";
const PLAYHEAD = "#ff5a36";

export function prepareCanvasLanes(app, { height, pps }) {
  const tracks = loadedTracks(app);
  const count = tracks.length;
  if (!count) return [];
  const laneHeight = (height - 2 * PADDING - GAP * (count - 1)) / count;
  return tracks.map((track, i) => ({
    number: track.number,
    color: TRACK_COLORS[track.number - 1],
    top: PADDING + i * (laneHeight + GAP),
    height: laneHeight,
    cues: buildCues(track.dialogue, track.times, {
      fontFamily: FONT_FAMILY,
      pps,
      baseFont: laneFontSize(laneHeight, 72),
    }),
  }));
}

function box(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
  ctx.fill();
}

export function drawRythmoband(ctx, lanes, t, { x, y, width, height, pps }) {
  const lineX = x + width * SYNC_LINE;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();

  const bg = ctx.createLinearGradient(0, y, 0, y + height);
  bg.addColorStop(0, BAND_TOP);
  bg.addColorStop(1, BAND_BOTTOM);
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, width, height);

  const from = t - (lineX - x) / pps;
  const to = t + (x + width - lineX) / pps;
  ctx.textBaseline = "middle";

  for (const lane of lanes) {
    const active = activeCueId(lane.cues, t);
    const laneY = y + lane.top;
    for (const cue of cuesInRange(lane.cues, from, to)) {
      const cueX = lineX + (cue.start - t) * pps;
      const isActive = cue.id === active;

      ctx.fillStyle = isActive ? lane.color : CUE_BG;
      box(ctx, cueX, laneY, cue.width, lane.height, 6);
      ctx.fillStyle = lane.color;
      ctx.fillRect(cueX, laneY + 2, 3, lane.height - 4);

      ctx.save();
      ctx.beginPath();
      ctx.rect(cueX, laneY, cue.width, lane.height);
      ctx.clip();
      ctx.font = `700 ${cue.fontSize}px ${FONT_FAMILY}`;
      if ("letterSpacing" in ctx) ctx.letterSpacing = `${cue.letterSpacing}px`;
      ctx.fillStyle = isActive ? CUE_ACTIVE_TEXT : CUE_TEXT;
      ctx.translate(cueX + cue.fontSize * 0.2 + 5, laneY + lane.height / 2);
      if (cue.scaleX !== 1) ctx.scale(cue.scaleX, 1);
      ctx.fillText(cue.text, 0, 0);
      ctx.restore();
    }
  }

  ctx.fillStyle = PLAYHEAD;
  ctx.fillRect(lineX - 3, y, 6, height);
  ctx.restore();
}
