import React, { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Box, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import ZoomInRounded from "@mui/icons-material/ZoomInRounded";
import ZoomOutRounded from "@mui/icons-material/ZoomOutRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import Waveclip from "./waveform/Waveclip";
import { takeFrom, takeTo } from "./editor/audioEdit";

const ZOOMS = [1, 2, 4, 8, 16];
const TICK_STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1800];
const MIN_TICK_PX = 70;
const DRAG_THRESHOLD = 4;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

function tickLabel(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

// Plays the take under the playhead in sync with the video.
function useTakePreview(takes, player, muted) {
  const audios = useRef(new Map()); // take id -> HTMLAudioElement
  const current = useRef(null);
  const time = Number(player?.currentTime) || 0;
  const playing = player?.paused === false && !muted;
  const rate = Number(player?.playbackRate) || 1;

  useEffect(() => {
    const live = new Set(takes.map((t) => t.audioNumber));
    audios.current.forEach((audio, id) => {
      if (!live.has(id)) {
        audio.pause();
        audios.current.delete(id);
      }
    });
  }, [takes]);

  useEffect(() => {
    const take = playing
      ? takes.find((t) => takeFrom(t) <= time && takeTo(t) > time)
      : null;
    const prev = current.current;
    if (prev && prev !== take?.audioNumber) audios.current.get(prev)?.pause();
    current.current = take?.audioNumber ?? null;
    if (!take) return;

    let audio = audios.current.get(take.audioNumber);
    if (!audio) {
      audio = new Audio(take.sourceAudio);
      audio.preload = "auto";
      audios.current.set(take.audioNumber, audio);
    }
    audio.playbackRate = rate;
    const offset = time - takeFrom(take);
    if (prev !== take.audioNumber || Math.abs(audio.currentTime - offset) > 0.25) {
      audio.currentTime = offset;
    }
    if (audio.paused) audio.play().catch(() => {});
  }, [takes, time, playing, rate]);

  useEffect(
    () => () => {
      audios.current.forEach((audio) => audio.pause());
      audios.current.clear();
    },
    []
  );
}

const Take = memo(function Take({ take, duration, offsetPx, onPointerDown, onDelete, disabled }) {
  const from = takeFrom(take);
  const to = takeTo(take);
  return (
    <Box
      data-take={take.audioNumber}
      onPointerDown={disabled ? undefined : (e) => onPointerDown(e, take)}
      sx={{
        position: "absolute",
        top: 8,
        bottom: 8,
        left: `${(from / duration) * 100}%`,
        width: `${(Math.max(0.05, to - from) / duration) * 100}%`,
        transform: offsetPx ? `translateX(${offsetPx}px)` : undefined,
        bgcolor: take.color,
        borderRadius: 1.5,
        overflow: "hidden",
        cursor: disabled ? "default" : "grab",
        boxShadow: offsetPx ? 6 : 1,
        zIndex: offsetPx ? 3 : 1,
        touchAction: "none",
        display: "flex",
        alignItems: "center",
        "&:hover .take-delete": { opacity: 1 },
      }}
    >
      <Waveclip sourceAudio={take.sourceAudio} />
      {!disabled && (
        <IconButton
          className="take-delete"
          size="small"
          aria-label="Delete take"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onDelete(take)}
          sx={{
            position: "absolute",
            top: 2,
            right: 2,
            p: 0.25,
            opacity: 0,
            transition: "opacity 120ms",
            color: "#fff",
            bgcolor: "rgba(0,0,0,0.55)",
            "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
            "&:focus-visible": { opacity: 1 },
          }}
        >
          <CloseRounded sx={{ fontSize: 14 }} />
        </IconButton>
      )}
    </Box>
  );
});

// Overview timeline: ruler, playhead and the recorded takes. Takes can be
// dragged to re-time them; click anywhere to seek.
function TimeSlider({ player, takes, commit, seekTo, disabled, isRecording }) {
  const duration = Number(player?.duration) || 0;
  const time = Number(player?.currentTime) || 0;
  const [zoom, setZoom] = useState(0);
  const [drag, setDrag] = useState(null); // { id, dx }
  const [innerWidth, setInnerWidth] = useState(0);
  const scrollRef = useRef(null);
  const innerRef = useRef(null);
  const gesture = useRef(null);
  const dragRef = useRef(null);
  const updateDrag = (next) => {
    dragRef.current = next;
    setDrag(next);
  };

  useTakePreview(takes, player, isRecording);

  useLayoutEffect(() => {
    const node = innerRef.current;
    if (!node) return;
    setInnerWidth(node.clientWidth);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setInnerWidth(entry.contentRect.width));
    observer.observe(node);
    return () => observer.disconnect();
  }, [duration]);

  const ticks = useMemo(() => {
    if (!duration || !innerWidth) return [];
    const pxPerSec = innerWidth / duration;
    const step = TICK_STEPS.find((s) => s * pxPerSec >= MIN_TICK_PX) || 3600;
    const out = [];
    for (let s = 0; s <= duration; s += step) out.push(s);
    return out;
  }, [duration, innerWidth]);

  // Keep the playhead in view while playing on a zoomed timeline.
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller || !duration || player?.paused !== false || gesture.current) return;
    const x = (time / duration) * innerWidth;
    const { scrollLeft, clientWidth } = scroller;
    if (x < scrollLeft || x > scrollLeft + clientWidth - 40) {
      scroller.scrollLeft = Math.max(0, x - clientWidth * 0.2);
    }
  }, [time, duration, innerWidth, player?.paused]);

  const timeAt = (clientX) => {
    const rect = innerRef.current.getBoundingClientRect();
    return clamp(((clientX - rect.left) / rect.width) * duration, 0, duration);
  };

  // Seek / scrub on the background.
  const handleBackgroundDown = (e) => {
    if (!duration || e.button !== 0 || e.target.closest("[data-take]")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current = { type: "scrub" };
    seekTo(timeAt(e.clientX));
  };

  const handleTakeDown = (e, take) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    innerRef.current.setPointerCapture(e.pointerId);
    gesture.current = { type: "take", take, x: e.clientX, moved: false };
  };

  const handleMove = (e) => {
    const g = gesture.current;
    if (!g) return;
    if (g.type === "scrub") {
      seekTo(timeAt(e.clientX));
      return;
    }
    const dx = e.clientX - g.x;
    if (!g.moved && Math.abs(dx) < DRAG_THRESHOLD) return;
    g.moved = true;
    // Clamp so the take stays inside the video.
    const pxPerSec = innerWidth / duration;
    const from = takeFrom(g.take);
    const len = takeTo(g.take) - from;
    const minDx = -from * pxPerSec;
    const maxDx = (duration - len - from) * pxPerSec;
    updateDrag({ id: g.take.audioNumber, dx: clamp(dx, minDx, Math.max(minDx, maxDx)) });
  };

  const handleUp = () => {
    const g = gesture.current;
    gesture.current = null;
    if (!g || g.type !== "take") return;
    if (!g.moved) {
      seekTo(takeFrom(g.take));
      return;
    }
    const current = dragRef.current;
    updateDrag(null);
    if (!current) return;
    const shift = (current.dx / innerWidth) * duration;
    const from = takeFrom(g.take) + shift;
    const to = takeTo(g.take) + shift;
    const moved = { ...g.take, from, to, startTime: from, endTime: to };
    commit((prev) => prev.map((t) => (t === g.take ? moved : t)));
  };

  const deleteTake = (take) => commit((prev) => prev.filter((t) => t !== take));

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden", bgcolor: "var(--bg-surface)", borderColor: "var(--border)" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 1.5, py: 0.5, borderBottom: "1px solid", borderColor: "divider" }}>
        <Typography variant="subtitle2" color="text.secondary">
          Takes{" "}
          {takes.length ? (
            <Box component="span" sx={{ fontFamily: "var(--font-mono)", color: "text.primary" }}>
              · {takes.length}
            </Box>
          ) : null}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Tooltip title="Zoom out timeline" arrow>
            <span>
              <IconButton
                aria-label="Zoom out timeline"
                onClick={() => setZoom((z) => Math.max(0, z - 1))}
                disabled={zoom === 0}
                sx={{ width: 40, height: 40 }}
              >
                <ZoomOutRounded fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Zoom in timeline" arrow>
            <span>
              <IconButton
                aria-label="Zoom in timeline"
                onClick={() => setZoom((z) => Math.min(ZOOMS.length - 1, z + 1))}
                disabled={zoom === ZOOMS.length - 1}
                sx={{ width: 40, height: 40 }}
              >
                <ZoomInRounded fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {!duration ? (
        <Typography sx={{ p: 3, textAlign: "center" }} color="text.secondary" variant="body2">
          Upload a video to start dubbing.
        </Typography>
      ) : (
        <Box ref={scrollRef} sx={{ overflowX: "auto", overflowY: "hidden" }}>
          <Box
            ref={innerRef}
            onPointerDown={handleBackgroundDown}
            onPointerMove={handleMove}
            onPointerUp={handleUp}
            onPointerCancel={() => {
              gesture.current = null;
              updateDrag(null);
            }}
            sx={{
              position: "relative",
              width: `${ZOOMS[zoom] * 100}%`,
              minWidth: "100%",
              height: 112,
              userSelect: "none",
              touchAction: "pan-y",
              cursor: "pointer",
              bgcolor: "var(--bg-main)",
            }}
          >
            {/* Ruler */}
            <Box sx={{ position: "absolute", inset: "0 0 auto 0", height: 22, borderBottom: "1px solid", borderColor: "divider", bgcolor: "var(--bg-raised)" }}>
              {ticks.map((s) => (
                <Box
                  key={s}
                  sx={{
                    position: "absolute",
                    left: `${(s / duration) * 100}%`,
                    top: 0,
                    bottom: 0,
                    borderLeft: "1px solid var(--border-strong)",
                    pl: 0.5,
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    lineHeight: "22px",
                    color: "text.secondary",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tickLabel(s)}
                </Box>
              ))}
            </Box>

            {/* Takes lane */}
            <Box sx={{ position: "absolute", left: 0, right: 0, top: 22, bottom: 0 }}>
              {takes.map((take) => (
                <Take
                  key={take.audioNumber}
                  take={take}
                  duration={duration}
                  offsetPx={drag?.id === take.audioNumber ? drag.dx : 0}
                  onPointerDown={handleTakeDown}
                  onDelete={deleteTake}
                  disabled={disabled}
                />
              ))}
              {!takes.length && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ position: "sticky", left: 0, display: "inline-block", p: 3, pointerEvents: "none" }}
                >
                  No takes yet. Press Rec (Shift+Space) and speak along with the rythmoband.
                </Typography>
              )}
            </Box>

            {/* Playhead */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${(clamp(time, 0, duration) / duration) * 100}%`,
                width: 2,
                ml: "-1px",
                bgcolor: isRecording ? "var(--danger)" : "var(--primary)",
                pointerEvents: "none",
                zIndex: 4,
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: -5,
                  borderLeft: "6px solid transparent",
                  borderRight: "6px solid transparent",
                  borderTop: `8px solid ${isRecording ? "var(--danger)" : "var(--primary)"}`,
                },
              }}
            />
          </Box>
        </Box>
      )}
    </Paper>
  );
}

export default TimeSlider;
