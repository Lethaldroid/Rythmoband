// In-browser transcription: decode the video's audio, cut it into windows
// Whisper can handle, run them through the worker and return timed lines.
import { collapseRepeats, wordsToLines } from "./segment";

export const SAMPLE_RATE = 16000;

export const QUALITIES = {
  fast: {
    label: "Fast",
    model: "onnx-community/whisper-base_timestamped",
    size: { webgpu: "about 150 MB", wasm: "about 80 MB" },
  },
  accurate: {
    label: "Accurate",
    model: "onnx-community/whisper-small_timestamped",
    size: { webgpu: "about 490 MB", wasm: "about 250 MB" },
  },
  best: {
    label: "Best",
    model: "onnx-community/whisper-large-v3-turbo_timestamped",
    size: { webgpu: "about 560 MB" },
    webgpuOnly: true,
  },
};

// Languages Whisper handles well, by ISO code.
export const LANGUAGES = [
  ["", "Auto-detect"],
  ["en", "English"],
  ["es", "Spanish"],
  ["fr", "French"],
  ["de", "German"],
  ["it", "Italian"],
  ["pt", "Portuguese"],
  ["nl", "Dutch"],
  ["pl", "Polish"],
  ["ru", "Russian"],
  ["uk", "Ukrainian"],
  ["tr", "Turkish"],
  ["ar", "Arabic"],
  ["he", "Hebrew"],
  ["fa", "Persian"],
  ["hi", "Hindi"],
  ["ur", "Urdu"],
  ["bn", "Bengali"],
  ["id", "Indonesian"],
  ["vi", "Vietnamese"],
  ["th", "Thai"],
  ["ja", "Japanese"],
  ["ko", "Korean"],
  ["zh", "Chinese"],
  ["sv", "Swedish"],
  ["fi", "Finnish"],
];

export async function detectDevice() {
  try {
    const adapter = await navigator.gpu?.requestAdapter();
    if (adapter) return { device: "webgpu", fp16: adapter.features.has("shader-f16") };
  } catch {
    // fall through to WebAssembly
  }
  return { device: "wasm", fp16: false };
}

// On WebGPU the 4-bit decoders are about 3x slower than fp16 (measured on
// whisper-base), so the small models use fp16 throughout.
function dtypeFor(quality, { device, fp16 }) {
  if (device !== "webgpu") return { encoder_model: "q8", decoder_model_merged: "q8" };
  if (quality === "best") {
    const q = fp16 ? "q4f16" : "q4";
    return { encoder_model: q, decoder_model_merged: q };
  }
  const precision = fp16 ? "fp16" : "fp32";
  return { encoder_model: precision, decoder_model_merged: precision };
}

// Decode the media's audio track to 16 kHz mono, which is what Whisper expects.
export async function decodeAudio(src) {
  const buffer = await fetch(src).then((res) => {
    if (!res.ok) throw new Error(`Could not read the video (${res.status})`);
    return res.arrayBuffer();
  });
  const Ctx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const audio = await new Ctx(1, 1, SAMPLE_RATE).decodeAudioData(buffer);
  if (audio.numberOfChannels === 1) return audio.getChannelData(0);
  const mono = new Float32Array(audio.length);
  for (let c = 0; c < audio.numberOfChannels; c++) {
    const data = audio.getChannelData(c);
    for (let i = 0; i < data.length; i++) mono[i] += data[i] / audio.numberOfChannels;
  }
  return mono;
}

function rms(samples, from, to) {
  let sum = 0;
  for (let i = from; i < to; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / Math.max(1, to - from));
}

// Cut the audio into windows of at most `maxSeconds`, ending each at the
// quietest moment near the limit so words aren't chopped in half.
export function planWindows(samples, { maxSeconds = 28, searchSeconds = 4, silence = 0.004 } = {}) {
  const sr = SAMPLE_RATE;
  const frame = Math.round(sr * 0.02);
  const windows = [];
  let start = 0;
  while (start < samples.length) {
    let end = Math.min(samples.length, start + maxSeconds * sr);
    if (end < samples.length) {
      let best = end;
      let bestEnergy = Infinity;
      for (let pos = end - searchSeconds * sr; pos + frame <= end; pos += frame) {
        const energy = rms(samples, pos, pos + frame);
        if (energy < bestEnergy) {
          bestEnergy = energy;
          best = pos + Math.round(frame / 2);
        }
      }
      end = best;
    }
    windows.push({ start, end, silent: rms(samples, start, end) < silence });
    start = end;
  }
  return windows;
}

// Whisper sometimes loops on one phrase. Like the reference implementation,
// retry such a window with sampling at rising temperatures and keep the
// least repetitive result.
const RETRY_TEMPERATURES = [0.3, 0.6];
const loopiness = (words) => (words.length ? 1 - collapseRepeats(words).length / words.length : 0);

// One worker is kept around so a second run doesn't reload the model.
let worker = null;
let nextId = 0;
const pending = new Map();
let onDownload = null;

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL("./whisper.worker.js", import.meta.url), { type: "module" });
  worker.onmessage = ({ data }) => {
    if (data.type === "download") {
      onDownload?.(data);
      return;
    }
    const request = pending.get(data.id);
    if (!request) return;
    pending.delete(data.id);
    if (data.type === "error") request.reject(new Error(data.message));
    else request.resolve(data);
  };
  worker.onerror = (event) => {
    const error = new Error(event.message || "The transcription worker crashed");
    pending.forEach((request) => request.reject(error));
    pending.clear();
    worker = null;
  };
  return worker;
}

function call(message, transfer = []) {
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ ...message, id }, transfer);
  });
}

function stopWorker() {
  worker?.terminate();
  worker = null;
  const error = new Error("canceled");
  error.name = "AbortError";
  pending.forEach((request) => request.reject(error));
  pending.clear();
}

/**
 * Transcribe a video or audio URL. Returns { promise, cancel }.
 * `onProgress` receives { stage: "audio" | "download" | "transcribe", ratio, ... }.
 * The promise resolves to { lines: [{ start, end, text }], language }.
 */
export function transcribeMedia({ src, quality = "fast", language = "", onProgress }) {
  let canceled = false;
  const checkCanceled = () => {
    if (canceled) {
      const error = new Error("canceled");
      error.name = "AbortError";
      throw error;
    }
  };

  const run = async () => {
    onProgress?.({ stage: "audio", ratio: 0 });
    const samples = await decodeAudio(src);
    checkCanceled();

    const target = await detectDevice();
    const config = QUALITIES[quality] || QUALITIES.fast;
    if (config.webgpuOnly && target.device !== "webgpu") {
      throw new Error("Best quality needs a browser with WebGPU. Choose Fast or Accurate instead.");
    }

    // Model download progress, summed over the model's files.
    const files = {};
    onDownload = (p) => {
      files[p.file] = { loaded: p.status === "done" ? p.total || 1 : p.loaded, total: p.total || 1 };
      const all = Object.values(files);
      const loaded = all.reduce((sum, f) => sum + f.loaded, 0);
      const total = all.reduce((sum, f) => sum + f.total, 0);
      onProgress?.({ stage: "download", ratio: total ? loaded / total : 0, loaded, total });
    };
    onProgress?.({ stage: "download", ratio: 0 });
    await call({ type: "load", model: config.model, device: target.device, dtype: dtypeFor(quality, target) });
    onDownload = null;
    checkCanceled();

    const windows = planWindows(samples);
    const duration = samples.length / SAMPLE_RATE;

    // Pick the language by majority over the first few windows with speech.
    let spoken = language;
    if (!spoken) {
      onProgress?.({ stage: "detect", ratio: 0 });
      const votes = {};
      for (const win of windows.filter((w) => !w.silent).slice(0, 3)) {
        const audio = samples.slice(win.start, win.end);
        const { language: found } = await call({ type: "detect", audio }, [audio.buffer]);
        checkCanceled();
        votes[found] = (votes[found] || 0) + 1;
      }
      spoken = Object.keys(votes).sort((a, b) => votes[b] - votes[a])[0] || "en";
    }

    const words = [];
    onProgress?.({ stage: "transcribe", ratio: 0, done: 0, duration, device: target.device });
    for (const win of windows) {
      checkCanceled();
      if (!win.silent) {
        const offset = win.start / SAMPLE_RATE;
        let best = null;
        for (const temperature of [0, ...RETRY_TEMPERATURES]) {
          const audio = samples.slice(win.start, win.end);
          const { words: found } = await call(
            { type: "transcribe", audio, offset, language: spoken, temperature },
            [audio.buffer]
          );
          checkCanceled();
          const score = loopiness(found);
          if (!best || score < best.score) best = { words: found, score };
          if (score < 0.25) break;
        }
        words.push(...best.words);
      }
      const done = win.end / SAMPLE_RATE;
      onProgress?.({ stage: "transcribe", ratio: done / duration, done, duration, device: target.device });
    }
    return { lines: wordsToLines(words), language: spoken };
  };

  return {
    promise: run(),
    cancel: () => {
      canceled = true;
      onDownload = null;
      stopWorker();
    },
  };
}
