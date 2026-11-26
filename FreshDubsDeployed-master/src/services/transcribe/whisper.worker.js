/* eslint-disable no-restricted-globals */
/* global BigInt, BigInt64Array */
// Runs Whisper in a Web Worker so the page stays responsive. Audio never
// leaves the browser; only the model weights are downloaded (once, then
// cached by the browser).
import { pipeline, env, Tensor } from "@huggingface/transformers";

env.allowLocalModels = false;

let transcriber = null;
let loadedKey = "";

async function load({ model, device, dtype }) {
  const key = JSON.stringify([model, device, dtype]);
  if (transcriber && loadedKey === key) return;
  if (transcriber) {
    await transcriber.dispose?.();
    transcriber = null;
  }
  transcriber = await pipeline("automatic-speech-recognition", model, {
    device,
    dtype,
    progress_callback: (p) => {
      if (p.status === "progress" || p.status === "initiate" || p.status === "done") {
        self.postMessage({
          type: "download",
          file: p.file,
          loaded: p.loaded || 0,
          total: p.total || 0,
          status: p.status,
        });
      }
    },
  });
  loadedKey = key;
}

async function transcribe({ audio, offset, language, temperature = 0 }) {
  const output = await transcriber(audio, {
    return_timestamps: "word",
    language: language || null,
    task: "transcribe",
    // A light penalty stops most loops ("A A A A…") without changing normal output.
    repetition_penalty: 1.1,
    ...(temperature > 0 ? { do_sample: true, temperature } : {}),
  });
  return (output.chunks || []).map((chunk) => ({
    text: chunk.text,
    start: chunk.timestamp[0] == null ? null : chunk.timestamp[0] + offset,
    end: chunk.timestamp[1] == null ? null : chunk.timestamp[1] + offset,
  }));
}

// transformers.js doesn't detect the language yet (it falls back to English),
// so do what Whisper does: one decoder step after <|startoftranscript|> and
// take the most likely language token.
async function detectLanguage({ audio }) {
  const { processor, model } = transcriber;
  const { input_features } = await processor(audio);
  const start = model.generation_config.decoder_start_token_id;
  const decoder_input_ids = new Tensor("int64", BigInt64Array.from([BigInt(start)]), [1, 1]);
  const { logits } = await model({ input_features, decoder_input_ids });
  const scores = (logits.type === "float32" ? logits : logits.to("float32")).data;
  let best = "en";
  let bestScore = -Infinity;
  for (const [token, id] of Object.entries(model.generation_config.lang_to_id)) {
    if (scores[id] > bestScore) {
      bestScore = scores[id];
      best = token.slice(2, -2); // "<|zh|>" -> "zh"
    }
  }
  return best;
}

self.onmessage = async ({ data }) => {
  const { id, type } = data;
  try {
    if (type === "load") {
      await load(data);
      self.postMessage({ id, type: "done" });
    } else if (type === "transcribe") {
      const words = await transcribe(data);
      self.postMessage({ id, type: "done", words });
    } else if (type === "detect") {
      self.postMessage({ id, type: "done", language: await detectLanguage(data) });
    }
  } catch (error) {
    self.postMessage({ id, type: "error", message: error?.message || String(error) });
  }
};
