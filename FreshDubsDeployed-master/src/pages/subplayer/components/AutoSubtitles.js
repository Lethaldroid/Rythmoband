import styled from "styled-components";
import React, { useEffect, useRef, useState } from "react";
import DT from "duration-time-conversion";
import { download } from "../utils";
import { sub2srt } from "../libs/readSub";
import { API_BASE_URL } from "../../../config";
import { getCookie } from "../../../utils/cookies";
import {
  LANGUAGES,
  QUALITIES,
  detectDevice,
  transcribeMedia,
} from "../../../services/transcribe/transcribe";

const Style = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-bottom: 1px solid var(--border);

  h2 {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: var(--text-main);
  }

  .fields {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 8px;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    font-size: 11px;
    color: var(--text-muted);
  }

  select {
    min-width: 0;
    min-height: 36px;
    padding: 0 6px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-strong);
    color: var(--text-main);
    background-color: var(--bg-raised);
    font-family: var(--font-sans);
    font-size: 13px;

    &:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }
  }

  .actions {
    display: flex;
    gap: 8px;
  }

  .translate {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: end;
    gap: 8px;
  }

  .btn.primary {
    color: var(--on-primary);
    background-color: var(--primary);
    border-color: var(--primary);

    &:hover {
      background-color: var(--primary-hover);
      border-color: var(--primary-hover);
    }
  }

  .btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .bar {
    height: 4px;
    border-radius: 2px;
    overflow: hidden;
    background-color: var(--bg-raised);

    span {
      display: block;
      height: 100%;
      background-color: var(--primary);
      transition: width 0.2s ease;
    }
  }

  .note {
    margin: 0;
    font-size: 11px;
    line-height: 1.45;
    color: var(--text-muted);

    &.error {
      color: var(--danger, #f87171);
    }
  }
`;

const languageName = (code) => LANGUAGES.find(([c]) => c === code)?.[1] || code;

const formatClock = (seconds) => {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const formatMB = (bytes) => `${Math.round(bytes / 1e6)} MB`;

function stageText(progress) {
  if (progress.stage === "audio") return "Reading the audio…";
  if (progress.stage === "detect") return "Detecting the language…";
  if (progress.stage === "download") {
    return progress.total
      ? `Downloading the speech model · ${formatMB(progress.loaded)} of ${formatMB(progress.total)}`
      : "Loading the speech model…";
  }
  return `Transcribing · ${formatClock(progress.done)} of ${formatClock(progress.duration)}`;
}

/**
 * Subtitle generation for the editor: transcribe the loaded video in the
 * browser (only the speech model is downloaded; the audio stays here),
 * download the result as .srt, and translate it. Translation runs through
 * our server (which holds the Gemini key); only the subtitle text is sent.
 */
export default function AutoSubtitles({ player, subtitle, setSubtitle, newSub, notify }) {
  const [language, setLanguage] = useState("");
  const [quality, setQuality] = useState("fast");
  const [device, setDevice] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const [target, setTarget] = useState("en");
  const [translating, setTranslating] = useState(false);
  const [spokenLanguage, setSpokenLanguage] = useState("");
  const job = useRef(null);

  useEffect(() => {
    let alive = true;
    detectDevice().then((d) => alive && setDevice(d.device));
    return () => {
      alive = false;
      job.current?.cancel();
    };
  }, []);

  useEffect(() => {
    if (device === "wasm" && QUALITIES[quality].webgpuOnly) setQuality("accurate");
  }, [device, quality]);

  const start = async () => {
    const src = player?.currentSrc;
    if (!src) return;
    setError("");
    setProgress({ stage: "audio", ratio: 0 });
    const current = transcribeMedia({ src, quality, language, onProgress: setProgress });
    job.current = current;
    try {
      const { lines, language: spoken } = await current.promise;
      if (job.current !== current) return;
      if (!lines.length) {
        setError("No speech was found in this video.");
        return;
      }
      // Goes through the editor's history, so Ctrl+Z brings back the old subtitles.
      setSubtitle(
        lines.map((line) =>
          newSub({ start: DT.d2t(line.start), end: DT.d2t(line.end), text: line.text })
        )
      );
      setSpokenLanguage(spoken);
      const name = languageName(spoken);
      notify({
        message: `Transcribed ${lines.length} lines (${name}). Press Ctrl+Z to undo.`,
        level: "success",
      });
    } catch (err) {
      if (err?.name !== "AbortError" && job.current === current) {
        setError(err?.message || "Transcription failed.");
      }
    } finally {
      if (job.current === current) {
        job.current = null;
        setProgress(null);
      }
    }
  };

  const cancel = () => {
    job.current?.cancel();
    job.current = null;
    setProgress(null);
  };

  const downloadSrt = () => {
    // BOM so Windows players read non-Latin scripts correctly.
    const url = URL.createObjectURL(
      new Blob(["﻿", sub2srt(subtitle)], { type: "application/x-subrip" })
    );
    download(url, "subtitles.srt");
  };

  const translate = async () => {
    const token = getCookie("jwt_Token");
    if (!token) {
      setError("Log in to translate subtitles.");
      return;
    }
    const source = subtitle;
    setError("");
    setTranslating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          targetLanguage: languageName(target),
          sourceLanguage: spokenLanguage ? languageName(spokenLanguage) : undefined,
          lines: source.map((sub) => ({ text: sub.text, duration: sub.duration })),
        }),
      });
      if (res.status === 401) throw new Error("Log in to translate subtitles.");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Translation failed (${res.status}).`);
      if (data.translations?.length !== source.length) {
        throw new Error("The translation came back incomplete. Please try again.");
      }
      // Through the editor's history, so Ctrl+Z restores the original text.
      setSubtitle(
        source.map((sub, i) => newSub({ start: sub.start, end: sub.end, text: data.translations[i] }))
      );
      setSpokenLanguage(target);
      notify({
        message: `Translated ${source.length} lines to ${languageName(target)}. Press Ctrl+Z to undo.`,
        level: "success",
      });
    } catch (err) {
      setError(
        err instanceof TypeError ? "Could not reach the server to translate." : err.message
      );
    } finally {
      setTranslating(false);
    }
  };

  const qualityOptions = Object.entries(QUALITIES).filter(
    ([, q]) => !(q.webgpuOnly && device === "wasm")
  );
  const size = QUALITIES[quality].size[device === "wasm" ? "wasm" : "webgpu"];

  return (
    <Style aria-labelledby="auto-subtitles-title">
      <h2 id="auto-subtitles-title">Auto subtitles</h2>
      <div className="fields">
        <label>
          Spoken language
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={!!progress}
          >
            {LANGUAGES.map(([code, name]) => (
              <option key={code || "auto"} value={code}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Quality
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            disabled={!!progress}
          >
            {qualityOptions.map(([key, q]) => (
              <option key={key} value={key}>
                {q.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {progress || translating ? (
        <>
          {translating ? (
            <p className="note" aria-live="polite">
              Translating {subtitle.length} lines to {languageName(target)}…
            </p>
          ) : (
            <>
              <div
                className="bar"
                role="progressbar"
                aria-label="Transcription progress"
                aria-valuenow={Math.round((progress.ratio || 0) * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: `${Math.min(100, (progress.ratio || 0) * 100)}%` }} />
              </div>
              <p className="note" aria-live="polite">
                {stageText(progress)}
              </p>
              <div className="actions">
                <button type="button" className="btn" onClick={cancel}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="actions">
            <button
              type="button"
              className="btn primary"
              onClick={start}
              disabled={!player || !device}
            >
              Transcribe
            </button>
          </div>
          <div className="actions">
            <button
              type="button"
              className="btn"
              onClick={downloadSrt}
              disabled={!subtitle.length}
            >
              Download .srt
            </button>
          </div>
          <div className="translate">
            <label>
              Translate to
              <select value={target} onChange={(e) => setTarget(e.target.value)}>
                {LANGUAGES.filter(([code]) => code).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn"
              onClick={translate}
              disabled={!subtitle.length}
              title="Translate the subtitle text, keeping each line short enough for its timing"
            >
              Translate
            </button>
          </div>
          <p className={error ? "note error" : "note"}>
            {error ||
              `Transcribing runs on this computer; the audio is never uploaded. The model (${size}) downloads once. Translating sends only the subtitle text.`}
          </p>
        </>
      )}
    </Style>
  );
}
