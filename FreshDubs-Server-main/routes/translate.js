const express = require("express");
const passport = require("passport");
const tryCatch = require("../utils/tryCatch");
const router = express.Router();

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const BATCH_SIZE = 50;
const MAX_LINES = 2000;

const httpError = (status, message) => Object.assign(new Error(message), { statusCode: status });

// Ask Gemini to translate one batch of lines. Each line carries its on-screen
// duration so the translation can be kept short enough to dub over it.
async function translateBatch(lines, targetLanguage, sourceLanguage) {
  const numbered = lines
    .map((line, i) => `${i + 1}. [${Number(line.duration || 0).toFixed(1)}s] ${line.text}`)
    .join("\n");
  const prompt =
    `Translate these ${lines.length} subtitle lines ` +
    (sourceLanguage ? `from ${sourceLanguage} ` : "") +
    `into ${targetLanguage} for dubbing.\n` +
    "Each line shows how many seconds it is on screen. Keep each translation natural, " +
    "and short enough to be spoken comfortably in that time. Use the surrounding lines " +
    "for context, but translate every line on its own: never merge, split, skip or reorder lines. " +
    `Return a JSON array of exactly ${lines.length} strings, one per line, without the numbers or durations.\n\n` +
    numbered;

  const request = () =>
    fetch(`${GEMINI_URL}/${process.env.GEMINI_MODEL || "gemini-flash-latest"}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
          responseSchema: { type: "ARRAY", items: { type: "STRING" } },
        },
      }),
    });
  // Rate limits, overloads and (on a newly enabled project) sporadic 403s
  // usually clear on a retry.
  let res = await request();
  for (let attempt = 1; attempt <= 3 && [403, 429, 500, 503].includes(res.status); attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    res = await request();
  }
  if (!res.ok) {
    const detail = await res.text();
    console.error("Gemini error", res.status, detail.slice(0, 500));
    throw httpError(502, `The translation service failed (${res.status}).`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  let out;
  try {
    out = JSON.parse(text);
  } catch {
    out = null;
  }
  return Array.isArray(out) ? out.map((t) => String(t ?? "")) : null;
}

const translate = async (req, res) => {
  if (!process.env.GEMINI_API_KEY) throw httpError(503, "Translation is not set up on the server.");
  const { lines, targetLanguage, sourceLanguage } = req.body || {};
  if (!Array.isArray(lines) || !lines.length || typeof targetLanguage !== "string" || !targetLanguage) {
    throw httpError(400, "Send lines and a targetLanguage.");
  }
  if (lines.length > MAX_LINES) throw httpError(400, `At most ${MAX_LINES} lines can be translated at once.`);

  const batches = [];
  for (let i = 0; i < lines.length; i += BATCH_SIZE) batches.push(lines.slice(i, i + BATCH_SIZE));

  const results = await Promise.all(
    batches.map(async (batch) => {
      // Retry once if the model returns the wrong number of lines.
      for (let attempt = 0; attempt < 2; attempt++) {
        const out = await translateBatch(batch, targetLanguage, sourceLanguage);
        if (out && out.length === batch.length) return out;
      }
      throw httpError(502, "The translation came back with the wrong number of lines. Please try again.");
    })
  );
  res.json({ translations: results.flat() });
};

router.post("/", passport.authenticate("jwt", { session: false }), tryCatch(translate));

module.exports = router;
