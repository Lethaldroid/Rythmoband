// Playback clock for the rythmoband.
//
// The video player only reports currentTime a few times per second, and each
// report arrives a little late. Snapping to every report makes the band
// stutter backwards, so between reports we extrapolate from the last anchor and
// blend small drift in gradually. Real jumps (seek, pause, rate change) snap.

const SNAP_THRESHOLD = 0.3; // seconds of drift treated as a seek
const SLEW_MS = 300; // small drift is absorbed over this window

export function createClock() {
  return { t: 0, at: 0, rate: 1, paused: true, err: 0 };
}

export function readClock(clock, now) {
  if (clock.paused) return clock.t;
  const elapsed = now - clock.at;
  return (
    clock.t +
    (elapsed / 1000) * clock.rate +
    clock.err * Math.min(1, elapsed / SLEW_MS)
  );
}

export function syncClock(clock, { time, paused, rate, seeking }, now) {
  const predicted = readClock(clock, now);
  const err = time - predicted;
  const snap =
    paused ||
    clock.paused ||
    seeking ||
    rate !== clock.rate ||
    Math.abs(err) > SNAP_THRESHOLD;

  clock.t = snap ? time : predicted;
  clock.err = snap ? 0 : err;
  clock.at = now;
  clock.rate = rate;
  clock.paused = paused;
}
