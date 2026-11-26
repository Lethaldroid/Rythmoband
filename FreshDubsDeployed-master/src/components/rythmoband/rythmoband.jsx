import "../../../node_modules/video-react/dist/video-react.css";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { shallowEqual, useSelector } from "react-redux";
import styles from "./rythmoband.module.css";
import RythmoLane from "./RythmoLane";
import { createClock, readClock, syncClock } from "./rythmoClock";
import {
  PIXELS_PER_SECOND,
  TRACK_COLORS,
  activeCueId,
  buildCues,
  clearMeasureCache,
  laneFontSize,
  loadedTracks,
} from "./cueLayout";

const BAND_HEIGHT = 120;
const BAND_PADDING = 6;
const LANE_GAP = 4;
const SYNC_LINE = 0.25; // sync line position as a fraction of the band width
const CHUNK = 4; // seconds; the rendered window moves in steps of this size
const DRAG_THRESHOLD = 4; // px before a press becomes a scrub instead of a click

const toNumber = (value, fallback) => {
  const n = typeof value === "number" ? value : parseFloat(value);
  return isFinite(n) ? n : fallback;
};

const selectTracks = (state) => ({
  srt1: state.app.srt1,
  srt2: state.app.srt2,
  srt3: state.app.srt3,
  time1: state.app.time1,
  time2: state.app.time2,
  time3: state.app.time3,
  trackNames: state.app.trackNames,
});

// Lanes share the band height: one track fills it, two or three split it.
function laneLayout(count) {
  if (!count) return [];
  const height =
    (BAND_HEIGHT - 2 * BAND_PADDING - LANE_GAP * (count - 1)) / count;
  return Array.from({ length: count }, (_, i) => ({
    top: BAND_PADDING + i * (height + LANE_GAP),
    height,
  }));
}

// The band scrolls via a single compositor transform driven by one
// requestAnimationFrame loop that runs only while playing. React re-renders
// only when subtitles change or the visible window moves to a new chunk.
export default function Rythmoband({
  player,
  onSeek,
  pixelsPerSecond = PIXELS_PER_SECOND,
}) {
  const app = useSelector(selectTracks, shallowEqual);
  const pps = pixelsPerSecond;

  const bandRef = useRef(null);
  const trackRef = useRef(null);
  const laneRefs = useRef([]);
  const clockRef = useRef(createClock());
  const widthRef = useRef(0);
  const renderedFromRef = useRef(0);
  const activeRef = useRef([]);
  const lanesRef = useRef([]);
  const dragRef = useRef(null);
  const laneRefSetters = useMemo(
    () => TRACK_COLORS.map((_, i) => (node) => (laneRefs.current[i] = node)),
    []
  );

  const [fontFamily, setFontFamily] = useState(null);
  const [fontVersion, setFontVersion] = useState(0);
  const [range, setRange] = useState({ from: 0, to: 0 });
  const rangeRef = useRef(range);

  useLayoutEffect(() => {
    setFontFamily(getComputedStyle(bandRef.current).fontFamily);
    let alive = true;
    document.fonts?.ready.then(() => {
      if (!alive) return;
      clearMeasureCache();
      setFontVersion((v) => v + 1);
    });
    return () => {
      alive = false;
    };
  }, []);

  const lanes = useMemo(() => {
    if (!fontFamily) return [];
    const tracks = loadedTracks(app);
    const layout = laneLayout(tracks.length);
    return tracks.map((track, i) => {
      const { top, height } = layout[i];
      return {
        ...track,
        top,
        height,
        color: TRACK_COLORS[track.number - 1],
        cues: buildCues(track.dialogue, track.times, {
          fontFamily,
          pps,
          baseFont: laneFontSize(height),
        }),
      };
    });
    // fontVersion re-measures once web fonts have loaded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app, fontFamily, fontVersion, pps]);

  const setActive = (lane, id) => {
    const current = activeRef.current[lane];
    if (current && current.id === id && (id === null || current.node?.isConnected)) {
      return;
    }
    current?.node?.classList.remove(styles.active);
    const node =
      id === null
        ? null
        : laneRefs.current[lane]?.querySelector(`[data-cue="${id}"]`);
    node?.classList.add(styles.active);
    activeRef.current[lane] = { id, node };
  };

  // Writes the current frame straight to the DOM; no React render involved.
  const paint = useCallback(
    (now) => {
      const track = trackRef.current;
      if (!track) return;

      const t = readClock(clockRef.current, now);
      const width = widthRef.current;
      const needFrom = t - (width * SYNC_LINE) / pps;
      const needTo = t + (width * (1 - SYNC_LINE)) / pps;
      const { from, to } = rangeRef.current;
      if (needFrom < from || needTo > to) {
        const next = {
          from: Math.floor(needFrom / CHUNK) * CHUNK - CHUNK,
          to: Math.ceil(needTo / CHUNK) * CHUNK + CHUNK,
        };
        rangeRef.current = next;
        setRange(next);
      }

      // Offset against the window that is actually in the DOM, so a pending
      // window change never shows cues at the wrong place for a frame.
      const x = -(t - renderedFromRef.current) * pps;
      track.style.transform = `translate3d(${x}px,0,0)`;

      const current = lanesRef.current;
      for (let i = 0; i < current.length; i++) {
        setActive(i, activeCueId(current[i].cues, t));
      }
    },
    [pps]
  );

  // After every commit of a new window or new subtitles, re-place the track
  // before the browser paints.
  useLayoutEffect(() => {
    if (lanesRef.current !== lanes) {
      activeRef.current.forEach((entry) => entry?.node?.classList.remove(styles.active));
      activeRef.current = [];
    }
    lanesRef.current = lanes;
    renderedFromRef.current = range.from;
    paint(performance.now());
  }, [lanes, range, paint]);

  useLayoutEffect(() => {
    const band = bandRef.current;
    widthRef.current = band.clientWidth;
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      widthRef.current = entry.contentRect.width;
      paint(performance.now());
    });
    observer.observe(band);
    return () => observer.disconnect();
  }, [paint]);

  const time = Math.max(0, toNumber(player?.currentTime, 0));
  const duration = toNumber(player?.duration, 0);
  const paused = player?.paused !== false;
  const rate = Math.max(0, toNumber(player?.playbackRate, 1)) || 1;
  const seeking = !!player?.seeking;

  useLayoutEffect(() => {
    if (dragRef.current?.moved) return; // the scrub owns the clock
    const now = performance.now();
    syncClock(clockRef.current, { time, paused, rate, seeking }, now);
    if (paused) paint(now);
  }, [time, paused, rate, seeking, paint]);

  useEffect(() => {
    if (paused || !lanes.length) return;
    let frame = requestAnimationFrame(function loop(now) {
      paint(now);
      frame = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(frame);
  }, [paused, lanes, paint]);

  // Drag the band to scrub, click a line (or anywhere) to jump there.
  const clampTime = (t) => Math.max(0, duration > 0 ? Math.min(t, duration) : t);

  const handlePointerDown = (e) => {
    if (!onSeek || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      x: e.clientX,
      startT: readClock(clockRef.current, performance.now()),
      moved: false,
      frame: 0,
      pendingT: null,
      // pointer capture retargets later events to the band, so remember the cue now
      cue: e.target.closest?.("[data-start]") || null,
    };
  };

  const handlePointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) < DRAG_THRESHOLD) return;
    drag.moved = true;
    const t = clampTime(drag.startT - dx / pps);
    const now = performance.now();
    syncClock(clockRef.current, { time: t, paused: true, rate, seeking: true }, now);
    paint(now);
    drag.pendingT = t;
    if (!drag.frame) {
      drag.frame = requestAnimationFrame(() => {
        drag.frame = 0;
        onSeek(drag.pendingT);
      });
    }
  };

  const handlePointerUp = (e) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;
    if (drag.frame) cancelAnimationFrame(drag.frame);
    if (drag.moved) {
      onSeek(drag.pendingT);
      return;
    }
    if (drag.cue) {
      onSeek(clampTime(parseFloat(drag.cue.dataset.start)));
      return;
    }
    const band = bandRef.current;
    const rect = band.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * band.clientWidth) / (rect.width || 1);
    onSeek(clampTime(drag.startT + (x - band.clientWidth * SYNC_LINE) / pps));
  };

  const handlePointerCancel = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (drag?.frame) cancelAnimationFrame(drag.frame);
  };

  const layout = laneLayout(lanes.length);

  return (
    <div
      id="mainContainer"
      ref={bandRef}
      className={`${styles.mainContainer} ${onSeek ? styles.scrubbable : ""}`}
      style={{ height: BAND_HEIGHT }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      role="presentation"
    >
      {layout.slice(1).map(({ top }, i) => (
        <div
          key={i}
          className={styles.laneDivider}
          style={{ top: top - LANE_GAP / 2 }}
        />
      ))}

      <div ref={trackRef} className={styles.track}>
        <div
          className={styles.ruler}
          style={{
            width: Math.max(0, (range.to - range.from) * pps),
            backgroundSize: `${pps}px 100%`,
          }}
        />
        {lanes.map((lane, i) => (
          <RythmoLane
            key={lane.number}
            ref={laneRefSetters[i]}
            track={lane.cues}
            from={range.from}
            to={range.to}
            pps={pps}
            top={lane.top}
            height={lane.height}
            color={lane.color}
          />
        ))}
      </div>

      {lanes.map((lane) => (
        <div
          key={lane.number}
          className={styles.laneLabel}
          style={{ top: lane.top, height: lane.height, "--track-color": lane.color }}
          title={lane.name}
        >
          {lane.number}
        </div>
      ))}

      {!lanes.length && fontFamily && (
        <div className={styles.empty}>
          <span>
            No subtitles loaded. Use <strong>Upload</strong> to add up to three
            subtitle tracks.
          </span>
        </div>
      )}

      <div className={styles.redLineContainer}>
        <div className={styles.redMarkerTriangle} />
        <div className={styles.redLine} />
      </div>
    </div>
  );
}
