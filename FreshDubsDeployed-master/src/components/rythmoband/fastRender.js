// Offline rehearsal-video render. Instead of playing the video in real time
// and recording a canvas, this decodes each frame with WebCodecs, draws the
// picture + rythmoband, and re-encodes as fast as the hardware allows. The
// audio track is copied over untouched when the container supports it.
import {
  ALL_FORMATS,
  BufferTarget,
  Conversion,
  Input,
  Mp4OutputFormat,
  Output,
  UrlSource,
} from "mediabunny";
import { drawRythmoband } from "./rythmoCanvas";

export function canRenderFast() {
  return (
    typeof window !== "undefined" &&
    typeof window.VideoEncoder === "function" &&
    typeof window.VideoDecoder === "function"
  );
}

function makeCanvas(width, height) {
  if (typeof OffscreenCanvas === "function") {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Render the rehearsal video. Resolves with an MP4 Blob.
 *
 * - `onProgress(ratio)` reports 0..1.
 * - `pauseSignal` (AbortSignal) pauses; call `resume()` on the returned
 *   controller to continue.
 * - `cancel()` stops and rejects with a ConversionCanceledError.
 */
export function startFastRender({
  src,
  lanes,
  width,
  videoHeight,
  bandHeight,
  pps,
  onProgress,
}) {
  const height = videoHeight + bandHeight;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext("2d", { alpha: false });
  const input = new Input({
    formats: ALL_FORMATS,
    source: new UrlSource(new URL(src, window.location.href).href),
  });
  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: "in-memory" }),
    target: new BufferTarget(),
  });

  let conversion = null;
  let pauseController = null;
  let canceled = false;

  const drawFrame = (sample) => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, videoHeight);
    // Letterbox the picture instead of stretching it.
    const sw = sample.displayWidth || width;
    const sh = sample.displayHeight || videoHeight;
    const scale = Math.min(width / sw, videoHeight / sh);
    const w = sw * scale;
    const h = sh * scale;
    sample.draw(ctx, (width - w) / 2, (videoHeight - h) / 2, w, h);
    drawRythmoband(ctx, lanes, sample.timestamp, {
      x: 0,
      y: videoHeight,
      width,
      height: bandHeight,
      pps,
    });
    return canvas;
  };

  const run = async () => {
    conversion = await Conversion.init({
      input,
      output,
      video: {
        forceTranscode: true,
        processedWidth: width,
        processedHeight: height,
        hardwareAcceleration: "prefer-hardware",
        process: drawFrame,
      },
    });
    if (!conversion.isValid) {
      const reasons = conversion.discardedTracks
        .map((t) => t.reason)
        .join(", ");
      throw new Error(`Can't render this video in fast mode (${reasons})`);
    }
    if (canceled) throw new Error("canceled");
    conversion.onProgress = (progress) => onProgress?.(progress);

    // Execution returns early when paused; loop until it is done.
    while (conversion.state !== "done") {
      const controller = new AbortController();
      pauseController = controller;
      await conversion.execute({ pauseSignal: controller.signal });
      if (conversion.state !== "done") {
        await new Promise((resolve) => {
          controller.resume = resolve;
        });
      }
    }
    return new Blob([output.target.buffer], { type: "video/mp4" });
  };

  const promise = run().finally(() => input.dispose());

  return {
    promise,
    pause: () => pauseController?.abort(),
    resume: () => pauseController?.resume?.(),
    cancel: async () => {
      canceled = true;
      pauseController?.resume?.();
      await conversion?.cancel();
    },
  };
}
