import audioBufferToWav from "audiobuffer-to-wav";

// One shared AudioContext, created on first use (browsers block contexts made
// before a user gesture, and every context holds an audio thread).
let sharedCtx = null;
export function audioContext() {
  if (!sharedCtx) sharedCtx = new AudioContext();
  return sharedCtx;
}

export const newTakeId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// Readable, distinct take colours (random RGB often produced near-white or
// muddy blocks that hid the waveform).
export const takeColor = () => `hsl(${Math.floor(Math.random() * 360)}, 55%, 45%)`;

export const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

export async function decodeSource(sourceAudio) {
  const data = await (await fetch(sourceAudio)).arrayBuffer();
  return audioContext().decodeAudioData(data);
}

function sliceBuffer(buffer, startSec, endSec) {
  const start = Math.max(0, Math.floor(startSec * buffer.sampleRate));
  const end = Math.min(buffer.length, Math.ceil(endSec * buffer.sampleRate));
  const length = Math.max(1, end - start);
  const out = audioContext().createBuffer(buffer.numberOfChannels, length, buffer.sampleRate);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    out.getChannelData(ch).set(buffer.getChannelData(ch).subarray(start, start + length));
  }
  return out;
}

const bufferToDataUrl = (buffer) =>
  blobToDataUrl(new Blob([audioBufferToWav(buffer)], { type: "audio/wav" }));

// Splits a take at `atTime` (timeline seconds) into two takes.
export async function splitTake(take, atTime) {
  const buffer = await decodeSource(take.sourceAudio);
  const offset = atTime - take.from;
  const [first, second] = await Promise.all([
    bufferToDataUrl(sliceBuffer(buffer, 0, offset)),
    bufferToDataUrl(sliceBuffer(buffer, offset, buffer.duration)),
  ]);
  const base = { color: take.color };
  return [
    makeTake({ ...base, sourceAudio: first, from: take.from, to: atTime }),
    makeTake({ ...base, sourceAudio: second, from: atTime, to: take.to, color: takeColor() }),
  ];
}

export function makeTake({ sourceAudio, from, to, color, audioNumber }) {
  return {
    audioNumber: audioNumber ?? newTakeId(),
    sourceAudio,
    color: color || takeColor(),
    from,
    to,
    startTime: from,
    endTime: to,
    recordingDuration: to - from,
  };
}

// Older saved projects may lack from/to; derive them from start/end.
export const takeFrom = (t) => Number(t.from ?? t.startTime) || 0;
export const takeTo = (t) => Number(t.to ?? t.endTime) || takeFrom(t);

// Mixes every take onto one timeline and returns a WAV or MP3 blob.
export async function mixdown(takes, format = "wav") {
  const sampleRate = 44100;
  const end = Math.max(...takes.map(takeTo));
  const offline = new OfflineAudioContext(2, Math.ceil(sampleRate * (end + 0.5)), sampleRate);
  const buffers = await Promise.all(takes.map((t) => decodeSource(t.sourceAudio)));
  buffers.forEach((buffer, i) => {
    const source = offline.createBufferSource();
    source.buffer = buffer;
    source.connect(offline.destination);
    source.start(takeFrom(takes[i]));
  });
  const rendered = await offline.startRendering();
  if (format === "mp3") {
    const mp3 = await encodeMp3(rendered).catch(() => null);
    if (mp3) return { blob: mp3, ext: "mp3" };
  }
  return { blob: new Blob([audioBufferToWav(rendered)], { type: "audio/wav" }), ext: "wav" };
}

// lamejs's npm entry breaks under webpack (it relies on sloppy-mode globals),
// so its self-contained build is served from /vendor and loaded on first use.
let lameLoading = null;
function loadLame() {
  if (window.lamejs?.Mp3Encoder) return Promise.resolve(window.lamejs);
  if (!lameLoading) {
    lameLoading = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `${process.env.PUBLIC_URL || ""}/vendor/lame.min.js`;
      script.onload = () =>
        window.lamejs?.Mp3Encoder ? resolve(window.lamejs) : reject(new Error("lamejs missing"));
      script.onerror = reject;
      document.head.appendChild(script);
    }).catch((error) => {
      lameLoading = null;
      throw error;
    });
  }
  return lameLoading;
}

async function encodeMp3(buffer) {
  const lamejs = await loadLame();
  const channels = Math.min(2, buffer.numberOfChannels);
  const encoder = new lamejs.Mp3Encoder(channels, buffer.sampleRate, 192);
  const toInt16 = (data) => {
    const out = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) {
      const s = Math.max(-1, Math.min(1, data[i]));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
  };
  const left = toInt16(buffer.getChannelData(0));
  const right = channels > 1 ? toInt16(buffer.getChannelData(1)) : null;
  const chunks = [];
  const block = 1152;
  for (let i = 0; i < left.length; i += block) {
    const l = left.subarray(i, i + block);
    const chunk = right ? encoder.encodeBuffer(l, right.subarray(i, i + block)) : encoder.encodeBuffer(l);
    if (chunk.length) chunks.push(chunk);
  }
  const tail = encoder.flush();
  if (tail.length) chunks.push(tail);
  return new Blob(chunks, { type: "audio/mpeg" });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
