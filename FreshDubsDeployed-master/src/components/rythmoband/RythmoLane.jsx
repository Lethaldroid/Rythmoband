import React, { forwardRef, memo } from "react";
import styles from "./rythmoband.module.css";
import { cuesInRange } from "./cueLayout";

const Cue = memo(function Cue({ cue, left }) {
  const { text, width, fontSize, letterSpacing, scaleX } = cue;
  return (
    <div
      data-cue={cue.id}
      data-start={cue.start}
      className={styles.cue}
      style={{ left, width, fontSize }}
    >
      <span
        className={styles.cueText}
        style={{
          letterSpacing: letterSpacing || undefined,
          marginRight: letterSpacing ? -letterSpacing : undefined,
          transform: scaleX !== 1 ? `scaleX(${scaleX})` : undefined,
        }}
      >
        {text}
      </span>
    </div>
  );
});

// Renders only the cues inside [from, to). Positions are relative to `from`
// so pixel offsets stay small no matter how long the video is.
const RythmoLane = memo(
  forwardRef(function RythmoLane({ track, from, to, pps, top, height, color }, ref) {
    const visible = cuesInRange(track, from, to);
    return (
      <div
        ref={ref}
        className={styles.lane}
        style={{ top, height, "--track-color": color }}
      >
        {visible.map((cue) => (
          <Cue key={cue.id} cue={cue} left={(cue.start - from) * pps} />
        ))}
      </div>
    );
  })
);

export default RythmoLane;
