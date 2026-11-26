import styled from "styled-components";
import { t, Translate } from "react-i18nify";
import React, { useState, useCallback, memo } from "react";
import { getExt, download, decodeAudioFile } from "../utils";
import { file2sub, sub2vtt, sub2srt, sub2txt } from "../libs/readSub";
import sub2ass from "../libs/readSub/sub2ass";
import FFmpeg from "@ffmpeg/ffmpeg";
import SimpleFS from "@forlagshuset/simple-fs";
import AutoSubtitles from "./AutoSubtitles";

const Style = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 20px;
  position: relative;
  overflow: hidden auto;
  background-color: var(--bg-surface);
  border-left: 1px solid var(--border);

  .import,
  .burn,
  .export,
  .operate {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 12px;
    border-bottom: 1px solid var(--border);
  }

  /* Shared button look (secondary by default) */
  .btn {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1 1 0;
    min-width: 0;
    min-height: 40px;
    padding: 0 8px;
    margin: 0;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-strong);
    color: var(--text-main);
    background-color: var(--bg-raised);
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color var(--transition-fast), border-color var(--transition-fast);

    &:hover {
      background-color: var(--bg-hover);
      border-color: rgba(255, 255, 255, 0.24);
    }

    &:focus-visible,
    &:focus-within {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }
  }

  /* Primary actions: open files, burn video */
  .import .btn,
  .burn .btn {
    color: var(--on-primary);
    background-color: var(--primary);
    border-color: var(--primary);

    &:hover {
      background-color: var(--primary-hover);
      border-color: var(--primary-hover);
    }
  }

  .import .file {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }

  .hotkey {
    display: flex;
    justify-content: space-between;
    padding: 12px;

    span {
      width: 100%;
      font-family: var(--font-mono);
      font-size: 12px;
      padding: 6px 0;
      border-radius: var(--radius-sm);
      text-align: center;
      color: var(--text-muted);
      background-color: var(--bg-raised);
      border: 1px solid var(--border);
    }
  }

  .bottom {
    padding: 12px;
    a {
      display: flex;
      flex-direction: column;
      border: 1px solid var(--border-strong);
      text-decoration: none;

      .title {
        color: var(--amber);
        padding: 5px 10px;
        border-bottom: 1px solid var(--border-strong);
      }

      img {
        max-width: 100%;
      }
    }
  }

  .progress {
    position: fixed;
    left: 0;
    top: 0;
    right: 0;
    z-index: 9;
    height: 2px;
    background-color: rgb(0 0 0 / 50%);

    span {
      display: inline-block;
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 0;
      height: 100%;
      background-color: var(--primary);
      transition: all 0.2s ease 0s;
    }
  }
`;

const fs = new SimpleFS.FileSystem();

function Header({
  player,
  waveform,
  newSub,
  undoSubs,
  clearSubs,
  subtitle,
  setLoading,
  setSubtitle,
  setProcessing,
  notify,
}) {
  const [videoFile, setVideoFile] = useState(null);

  const decodeWithFFmpeg = useCallback(
    async (file) => {
      const { createFFmpeg, fetchFile } = FFmpeg;
      const ffmpeg = createFFmpeg({ log: true });
      ffmpeg.setProgress(({ ratio }) => setProcessing(ratio * 100));
      setLoading(t("LOADING_FFMPEG"));
      await ffmpeg.load();
      ffmpeg.FS("writeFile", file.name, await fetchFile(file));
      setLoading("");
      const output = `${Date.now()}.mp3`;
      await ffmpeg.run("-i", file.name, "-ac", "1", "-ar", "8000", output);
      const uint8 = ffmpeg.FS("readFile", output);
      await waveform.decoder.decodeAudioData(uint8);
      ffmpeg.setProgress(() => null);
    },
    [waveform, setProcessing, setLoading]
  );

  const decodeAudioData = useCallback(
    async (file) => {
      notify({
        message: t("DECODE_START"),
        level: "info",
      });
      try {
        // The browser can decode the audio track of most videos directly,
        // which is much faster than ffmpeg.wasm and needs no SharedArrayBuffer.
        const audiobuffer = await decodeAudioFile(file);
        waveform.decoder.decodeSuccess(audiobuffer);
      } catch (nativeError) {
        try {
          if (!window.SharedArrayBuffer) throw nativeError;
          await decodeWithFFmpeg(file);
        } catch (error) {
          setLoading("");
          setProcessing(0);
          notify({
            message: t("DECODE_ERROR"),
            level: "error",
          });
          return;
        }
      }
      waveform.drawer.update();
      setProcessing(0);
      notify({
        message: t("DECODE_SUCCESS"),
        level: "success",
      });
    },
    [waveform, notify, setProcessing, setLoading, decodeWithFFmpeg]
  );

  const burnSubtitles = useCallback(async () => {
    try {
      const { createFFmpeg, fetchFile } = FFmpeg;
      const ffmpeg = createFFmpeg({ log: true });
      ffmpeg.setProgress(({ ratio }) => setProcessing(ratio * 100));
      setLoading(t("LOADING_FFMPEG"));
      await ffmpeg.load();
      setLoading(t("LOADING_FONT"));

      await fs.mkdir("/fonts");
      const fontExist = await fs.exists("/fonts/Microsoft-YaHei.ttf");
      if (fontExist) {
        const fontBlob = await fs.readFile("/fonts/Microsoft-YaHei.ttf");
        ffmpeg.FS(
          "writeFile",
          `tmp/Microsoft-YaHei.ttf`,
          await fetchFile(fontBlob)
        );
      } else {
        const fontUrl =
          "https://cdn.jsdelivr.net/gh/zhw2590582/SubPlayer/docs/Microsoft-YaHei.ttf";
        const fontBlob = await fetch(fontUrl).then((res) => res.blob());
        await fs.writeFile("/fonts/Microsoft-YaHei.ttf", fontBlob);
        ffmpeg.FS(
          "writeFile",
          `tmp/Microsoft-YaHei.ttf`,
          await fetchFile(fontBlob)
        );
      }
      setLoading(t("LOADING_VIDEO"));
      ffmpeg.FS(
        "writeFile",
        videoFile ? videoFile.name : "sample.mp4",
        await fetchFile(videoFile || "sample.mp4")
      );
      setLoading(t("LOADING_SUB"));
      const subtitleFile = new File(
        [new Blob([sub2ass(subtitle)])],
        "subtitle.ass"
      );
      ffmpeg.FS("writeFile", subtitleFile.name, await fetchFile(subtitleFile));
      setLoading("");
      notify({
        message: t("BURN_START"),
        level: "info",
      });
      const output = `${Date.now()}.mp4`;
      await ffmpeg.run(
        "-i",
        videoFile ? videoFile.name : "sample.mp4",
        "-vf",
        `ass=${subtitleFile.name}:fontsdir=/tmp`,
        "-preset",
        videoFile ? "fast" : "ultrafast",
        output
      );
      const uint8 = ffmpeg.FS("readFile", output);
      download(URL.createObjectURL(new Blob([uint8])), `${output}`);
      setProcessing(0);
      ffmpeg.setProgress(() => null);
      notify({
        message: t("BURN_SUCCESS"),
        level: "success",
      });
    } catch (error) {
      setLoading("");
      setProcessing(0);
      notify({
        message: t("BURN_ERROR"),
        level: "error",
      });
    }
  }, [notify, setProcessing, setLoading, videoFile, subtitle]);

  const onVideoChange = useCallback(
    (event) => {
      const file = event.target.files[0];
      if (file) {
        const ext = getExt(file.name);
        const canPlayType = player.canPlayType(file.type);
        if (canPlayType === "maybe" || canPlayType === "probably") {
          setVideoFile(file);
          const url = URL.createObjectURL(new Blob([file]));
          waveform.decoder.destroy();
          waveform.drawer.update();
          waveform.seek(0);
          decodeAudioData(file);
          player.currentTime = 0;
          clearSubs();
          setSubtitle([
            newSub({
              start: "00:00:00.000",
              end: "00:00:01.000",
              text: t("SUB_TEXT"),
            }),
          ]);
          player.src = url;
        } else {
          notify({
            message: `${t("VIDEO_EXT_ERR")}: ${file.type || ext}`,
            level: "error",
          });
        }
      }
    },
    [newSub, notify, player, setSubtitle, waveform, clearSubs, decodeAudioData]
  );

  const onSubtitleChange = useCallback(
    (event) => {
      const file = event.target.files[0];
      if (file) {
        const ext = getExt(file.name);
        if (["ass", "vtt", "srt", "json"].includes(ext)) {
          file2sub(file)
            .then((res) => {
              clearSubs();
              setSubtitle(res);
            })
            .catch((err) => {
              notify({
                message: err.message,
                level: "error",
              });
            });
        } else {
          notify({
            message: `${t("SUB_EXT_ERR")}: ${ext}`,
            level: "error",
          });
        }
      }
    },
    [notify, setSubtitle, clearSubs]
  );

  const onInputClick = useCallback((event) => {
    event.target.value = "";
  }, []);

  const downloadSub = useCallback(
    (type) => {
      let text = "";
      const name = `${Date.now()}.${type}`;
      switch (type) {
        case "vtt":
          text = sub2vtt(subtitle);
          break;
        case "srt":
          text = sub2srt(subtitle);
          break;
        case "ass":
          text = sub2ass(subtitle);
          break;
        case "txt":
          text = sub2txt(subtitle);
          break;
        case "json":
          text = JSON.stringify(subtitle);
          break;
        default:
          break;
      }
      const url = URL.createObjectURL(new Blob([text]));
      download(url, name);
    },
    [subtitle]
  );

  return (
    <Style className="tool">
      <div className="top">
        <div className="import">
          <div className="btn">
            <Translate value="OPEN_VIDEO" />
            <input
              className="file"
              type="file"
              aria-label={t("OPEN_VIDEO")}
              onChange={onVideoChange}
              onClick={onInputClick}
            />
          </div>
          <div className="btn">
            <Translate value="OPEN_SUB" />
            <input
              className="file"
              type="file"
              aria-label={t("OPEN_SUB")}
              onChange={onSubtitleChange}
              onClick={onInputClick}
            />
          </div>
        </div>
        <AutoSubtitles
          player={player}
          subtitle={subtitle}
          setSubtitle={setSubtitle}
          newSub={newSub}
          notify={notify}
        />
        {window.crossOriginIsolated ? (
          <div className="burn" onClick={burnSubtitles}>
            <button type="button" className="btn">
              <Translate value="EXPORT_VIDEO" />
            </button>
          </div>
        ) : null}
        <div className="export">
          <button type="button" className="btn" onClick={() => downloadSub("ass")}>
            <Translate value="EXPORT_ASS" />
          </button>
          <button type="button" className="btn" onClick={() => downloadSub("vtt")}>
            <Translate value="EXPORT_VTT" />
          </button>
        </div>
        <div className="operate">
          <button
            type="button"
            className="btn"
            onClick={() => {
              if (window.confirm(t("CLEAR_TIP")) === true) {
                clearSubs();
                window.location.reload();
              }
            }}
          >
            <Translate value="CLEAR" />
          </button>
          <button type="button" className="btn" onClick={undoSubs}>
            <Translate value="UNDO" />
          </button>
        </div>
        <div className="hotkey">
          <span>
            <Translate value="Space:Play/Pause" />
          </span>
        </div>
      </div>
    </Style>
  );
}

// Tool doesn't show the playhead, so skip the per-frame re-renders that
// currentTime/playing would otherwise cause.
export default memo(Header, (prev, next) =>
  Object.keys(next).every(
    (key) => key === "currentTime" || key === "playing" || prev[key] === next[key]
  )
);
