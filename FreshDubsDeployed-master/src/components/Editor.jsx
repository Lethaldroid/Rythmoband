import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Collapse,
  Divider,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import PauseRounded from "@mui/icons-material/PauseRounded";
import Replay5Rounded from "@mui/icons-material/Replay5Rounded";
import Forward5Rounded from "@mui/icons-material/Forward5Rounded";
import FiberManualRecord from "@mui/icons-material/FiberManualRecord";
import StopRounded from "@mui/icons-material/StopRounded";
import ContentCutRounded from "@mui/icons-material/ContentCutRounded";
import UndoRounded from "@mui/icons-material/UndoRounded";
import RedoRounded from "@mui/icons-material/RedoRounded";
import SaveRounded from "@mui/icons-material/SaveRounded";
import VolumeDownRounded from "@mui/icons-material/VolumeDownRounded";
import VolumeUpRounded from "@mui/icons-material/VolumeUpRounded";
import ZoomInRounded from "@mui/icons-material/ZoomInRounded";
import ZoomOutRounded from "@mui/icons-material/ZoomOutRounded";
import RecordRTC from "recordrtc";
import { useDispatch, useSelector } from "react-redux";
import { notify } from "reapop";
import Rythmoband from "./rythmoband/rythmoband";
import TimeSlider from "./TimeSlider";
import { mainContext } from "../services/context";
import useTakes from "./editor/useTakes";
import {
  blobToDataUrl,
  downloadBlob,
  makeTake,
  mixdown,
  splitTake,
  takeFrom,
  takeTo,
} from "./editor/audioEdit";

const BAND_ZOOM = [100, 140, 200, 280, 400]; // rythmoband pixels per second
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5];

export function formatTime(seconds, withTenths = false) {
  const s = Math.max(0, Number(seconds) || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const pad = (n) => String(n).padStart(2, "0");
  const base = h ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
  return withTenths ? `${base}.${Math.floor((s % 1) * 10)}` : base;
}

const groupSx = { display: "flex", alignItems: "center", gap: 0.5 };
const timecodeSx = { fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" };

// Runs `fn` whenever `value` changes, but not on mount. Hotkeys are toggles,
// so the first render must not fire them.
function useOnToggle(value, fn) {
  const first = useRef(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    fnRef.current();
  }, [value]);
}

function Tool({ title, shortcut, keys, children, sx, ...props }) {
  return (
    <Tooltip title={shortcut ? `${title} (${shortcut})` : title} arrow>
      <span>
        <IconButton
          // keep focus off toolbar buttons so Space stays the play hotkey
          onMouseDown={(e) => e.preventDefault()}
          aria-label={title}
          aria-keyshortcuts={keys}
          sx={{ width: 40, height: 40, ...sx }}
          {...props}
        >
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}

function Editor(props) {
  const { player, vidHot, generating, pauseRender, renderProgress, renderFast, hasVideo } = props;
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const projectName = useSelector((state) => state.app.projectName);
  const { channels, setChannels, showExport } = useContext(mainContext);
  const { takes, commit, undo, redo, canUndo, canRedo } = useTakes();

  const [isRecording, setIsRecording] = useState(false);
  const [busy, setBusy] = useState(""); // "", "split", "export"
  const [bandZoom, setBandZoom] = useState(2);
  const [format, setFormat] = useState(user?.membership === "Expert" ? "wav" : "mp3");
  const recordRef = useRef(null); // { recorder, from }
  const streamRef = useRef(null);

  const paused = player?.paused !== false;
  const currentTime = Number(player?.currentTime) || 0;
  const duration = Number(player?.duration) || 0;
  const rate = Number(player?.playbackRate) || 1;

  const toast = (message, status = "info") => dispatch(notify({ message, status }));

  // Release the microphone when leaving the editor or switching mono/stereo.
  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    },
    [channels]
  );

  const getStream = async () => {
    if (!streamRef.current) {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: channels, echoCancellation: false, noiseSuppression: false },
        video: false,
      });
    }
    return streamRef.current;
  };

  const startRecording = async () => {
    if (!hasVideo) return toast("Upload a video before recording", "warning");
    try {
      const stream = await getStream();
      const recorder = new RecordRTC(stream, {
        type: "audio",
        numberOfAudioChannels: channels,
      });
      recorder.startRecording();
      recordRef.current = { recorder, from: props.getCurrentTime() };
      setIsRecording(true);
      props.play(); // recording without the picture moving is never useful
    } catch (error) {
      toast("Microphone unavailable. Check the browser's permission.", "error");
    }
  };

  const stopRecording = () => {
    const session = recordRef.current;
    recordRef.current = null;
    setIsRecording(false);
    if (!session) return;
    const to = props.getCurrentTime();
    props.pause();
    session.recorder.stopRecording(async () => {
      const blob = session.recorder.getBlob();
      session.recorder.destroy();
      if (to - session.from < 0.2) {
        toast("Take too short, discarded. Make sure the video is playing.", "warning");
        return;
      }
      const sourceAudio = await blobToDataUrl(blob);
      commit((prev) => [...prev, makeTake({ sourceAudio, from: session.from, to })]);
    });
  };

  const toggleRecording = () => (recordRef.current ? stopRecording() : startRecording());

  const splitAtPlayhead = async () => {
    if (busy) return;
    const t = props.getCurrentTime();
    const take = takes.find((x) => takeFrom(x) + 0.05 < t && takeTo(x) - 0.05 > t);
    if (!take) return toast("Move the playhead over a take to split it", "info");
    setBusy("split");
    try {
      const parts = await splitTake({ ...take, from: takeFrom(take), to: takeTo(take) }, t);
      commit((prev) => prev.filter((x) => x !== take).concat(parts));
    } catch {
      toast("Could not split this take", "error");
    } finally {
      setBusy("");
    }
  };

  const exportAudio = async () => {
    if (!takes.length) return toast("Record a take before exporting audio", "info");
    setBusy("export");
    try {
      const { blob, ext } = await mixdown(takes, format);
      if (ext !== format) toast("MP3 encoding failed, exported WAV instead", "warning");
      downloadBlob(blob, `${(projectName || "dubmaster").trim()}-dub.${ext}`);
    } catch {
      toast("Audio export failed", "error");
    } finally {
      setBusy("");
    }
  };

  const lastTake = takes.reduce((a, b) => (!a || takeTo(b) > takeTo(a) ? b : a), null);

  useOnToggle(vidHot.record, toggleRecording);
  useOnToggle(vidHot.trim, splitAtPlayhead);
  useOnToggle(vidHot.undo, undo);
  useOnToggle(vidHot.redo, redo);
  useOnToggle(vidHot.f, () => props.seekBy(5));
  useOnToggle(vidHot.b, () => props.seekBy(-5));
  useOnToggle(vidHot.ff, () => props.seekBy(10));
  useOnToggle(vidHot.bb, () => props.seekBy(-10));
  useOnToggle(vidHot.G, () => lastTake && props.seekTo(takeFrom(lastTake)));

  const disabled = generating;

  return (
    <Box sx={{ px: { xs: 1, md: 3 }, pb: { xs: 10, sm: 3 }, display: "flex", flexDirection: "column", gap: 1.5 }}>
      {/* Transport + tools */}
      <Paper
        variant="outlined"
        sx={{
          mt: 1.5,
          px: 1,
          py: 0.75,
          borderRadius: 3,
          bgcolor: "var(--bg-surface)",
          borderColor: "var(--border)",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr auto 1fr" },
          alignItems: "center",
          gap: 0.5,
          "& .MuiIconButton-root:not(.play-btn)": {
            color: "var(--text-muted)",
            "&:hover": { color: "var(--text-main)", bgcolor: "var(--bg-hover)" },
          },
          "& .MuiIconButton-root.Mui-disabled:not(.play-btn)": { color: "rgba(244,244,245,0.3)" },
        }}
      >
        <Box role="group" aria-label="Recording and editing" sx={{ ...groupSx, justifyContent: { xs: "center", md: "flex-start" }, flexWrap: "wrap" }}>
          <Tooltip title={isRecording ? "Stop recording (Shift+Space)" : "Record a take (Shift+Space)"} arrow>
            <span>
              <Button
                onMouseDown={(e) => e.preventDefault()}
                onClick={toggleRecording}
                disabled={disabled}
                variant={isRecording ? "contained" : "outlined"}
                color="error"
                aria-keyshortcuts="Shift+Space"
                aria-label={isRecording ? "Stop recording" : "Record a take"}
                startIcon={isRecording ? <StopRounded /> : <FiberManualRecord />}
                sx={{
                  borderRadius: 5,
                  minWidth: 96,
                  minHeight: 40,
                  mr: 0.5,
                  ...timecodeSx,
                  ...(!isRecording && {
                    color: "var(--text-main)",
                    borderColor: "var(--border-strong)",
                    "& .MuiButton-startIcon": { color: "var(--danger)" },
                    "&:hover": { borderColor: "var(--danger)", bgcolor: "rgba(255,92,108,0.08)" },
                  }),
                  ...(isRecording && {
                    bgcolor: "var(--danger)",
                    color: "#1a0507",
                    fontWeight: 700,
                    animation: "recPulse 1.2s ease-in-out infinite",
                    "&:hover": { bgcolor: "var(--danger)" },
                  }),
                  "@keyframes recPulse": {
                    "0%, 100%": { boxShadow: "0 0 0 0 rgba(255,92,108,0.55)" },
                    "50%": { boxShadow: "0 0 0 6px rgba(255,92,108,0)" },
                  },
                }}
              >
                {isRecording ? formatTime(currentTime - (recordRef.current?.from || 0)) : "Rec"}
              </Button>
            </span>
          </Tooltip>
          <span className="visually-hidden" role="status">
            {isRecording ? "Recording" : ""}
          </span>
          <Tool title="Split take at playhead" shortcut="C" keys="C" onClick={splitAtPlayhead} disabled={disabled || !!busy || !takes.length}>
            <ContentCutRounded />
          </Tool>
          <Tool title="Undo" shortcut="Ctrl+Z" keys="Control+Z" onClick={undo} disabled={disabled || !canUndo}>
            <UndoRounded />
          </Tool>
          <Tool title="Redo" shortcut="Ctrl+Y" keys="Control+Y" onClick={redo} disabled={disabled || !canRedo}>
            <RedoRounded />
          </Tool>
          <Tool title="Save project" shortcut="S or Ctrl+S" keys="S Control+S" onClick={props.save} disabled={disabled}>
            <SaveRounded />
          </Tool>
        </Box>

        <Box role="group" aria-label="Transport" sx={{ ...groupSx, justifyContent: "center" }}>
          <Tool title="Back 5 seconds" shortcut="←, Shift+← for 10 s" keys="ArrowLeft" onClick={() => props.seekBy(-5)} disabled={!hasVideo}>
            <Replay5Rounded />
          </Tool>
          <Tool
            title={paused ? "Play" : "Pause"}
            shortcut="Space"
            keys="Space"
            className="play-btn"
            onClick={paused ? props.play : props.pause}
            disabled={!hasVideo || disabled}
            sx={{
              width: 48,
              height: 48,
              bgcolor: "primary.main",
              color: "var(--on-primary) !important",
              "&:hover": { bgcolor: "primary.light" },
              "&.Mui-disabled": { bgcolor: "var(--bg-raised)", color: "var(--text-subtle) !important" },
            }}
          >
            {paused ? <PlayArrowRounded fontSize="large" /> : <PauseRounded fontSize="large" />}
          </Tool>
          <Tool title="Forward 5 seconds" shortcut="→, Shift+→ for 10 s" keys="ArrowRight" onClick={() => props.seekBy(5)} disabled={!hasVideo}>
            <Forward5Rounded />
          </Tool>
          <Typography
            sx={{ ...timecodeSx, fontSize: 14, ml: 1, minWidth: 128, color: "text.secondary", whiteSpace: "nowrap" }}
          >
            <Box component="span" sx={{ color: "var(--amber)", fontWeight: 600 }}>
              {formatTime(currentTime, true)}
            </Box>{" "}
            / {formatTime(duration)}
          </Typography>
        </Box>

        <Box role="group" aria-label="Playback and view" sx={{ ...groupSx, justifyContent: { xs: "center", md: "flex-end" }, flexWrap: "wrap" }}>
          <Tooltip title="Playback speed" arrow>
            <Select
              size="small"
              value={SPEEDS.includes(rate) ? rate : 1}
              onChange={(e) => props.changePlaybackRate(e.target.value)}
              inputProps={{ "aria-label": "Playback speed" }}
              sx={{ height: 40, fontSize: 13, ...timecodeSx, "& .MuiSelect-select": { py: 0.5 } }}
            >
              {SPEEDS.map((s) => (
                <MenuItem key={s} value={s}>{`${s}×`}</MenuItem>
              ))}
            </Select>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tool title="Volume down" onClick={() => props.changeVolume(-0.1)}>
            <VolumeDownRounded />
          </Tool>
          <Tool title="Volume up" onClick={() => props.changeVolume(0.1)}>
            <VolumeUpRounded />
          </Tool>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tool title="Rythmoband: less detail" onClick={() => setBandZoom((z) => Math.max(0, z - 1))} disabled={bandZoom === 0}>
            <ZoomOutRounded />
          </Tool>
          <Tool title="Rythmoband: more detail" onClick={() => setBandZoom((z) => Math.min(BAND_ZOOM.length - 1, z + 1))} disabled={bandZoom === BAND_ZOOM.length - 1}>
            <ZoomInRounded />
          </Tool>
        </Box>
      </Paper>

      {/* Export & settings, toggled from the top bar */}
      <Collapse in={showExport} unmountOnExit id="export-panel" role="region" aria-label="Export and settings">
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: "var(--bg-surface)", borderColor: "var(--border)", "& .MuiToggleButton-root": { minHeight: 40, px: 2 }, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" } }}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>Dubbed audio</Typography>
            <ToggleButtonGroup size="small" exclusive aria-label="Audio format" value={format} onChange={(_, v) => v && setFormat(v)} sx={{ mb: 1 }}>
              <ToggleButton value="mp3">MP3</ToggleButton>
              <ToggleButton value="wav" disabled={user?.membership !== "Expert"}>WAV</ToggleButton>
            </ToggleButtonGroup>
            {user?.membership !== "Expert" && (
              <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 1 }}>
                WAV export is part of the Expert plan.
              </Typography>
            )}
            <Box>
              <Button variant="contained" onClick={exportAudio} disabled={busy === "export" || !takes.length}>
                {busy === "export" ? "Exporting…" : "Download audio"}
              </Button>
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>Rehearsal video (picture + rythmoband)</Typography>
            {generating && (
              <Box sx={{ mb: 1 }}>
                <LinearProgress variant="determinate" value={Math.round(renderProgress * 100)} aria-label="Video render progress" />
                <Typography variant="caption" color="text.secondary">
                  {pauseRender ? "Paused" : "Rendering"} · {Math.round(renderProgress * 100)}%
                </Typography>
              </Box>
            )}
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {(!generating || pauseRender) && (
                <Button variant="contained" onClick={props.startRender} disabled={!hasVideo}>
                  {generating ? "Resume" : "Generate video"}
                </Button>
              )}
              {generating && !pauseRender && (
                <Button variant="outlined" onClick={props.pauseRenderVideo}>Pause</Button>
              )}
              {generating && (
                <Button variant="outlined" color="error" onClick={props.stopRender}>
                  {renderFast ? "Cancel" : "Stop & download"}
                </Button>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
              {generating && !renderFast
                ? "Rendering in real time; keep this tab open."
                : "Renders faster than real time with hardware encoding; keep this tab open."}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>Recording input</Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={Number(channels)}
              onChange={(_, v) => v && setChannels(v)}
              disabled={isRecording}
              aria-label="Recording input"
            >
              <ToggleButton value={1}>Mono</ToggleButton>
              <ToggleButton value={2}>Stereo</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Paper>
      </Collapse>

      <Rythmoband
        player={player}
        onSeek={props.seekTo}
        pixelsPerSecond={BAND_ZOOM[bandZoom]}
      />

      <TimeSlider
        player={player}
        takes={takes}
        commit={commit}
        seekTo={props.seekTo}
        disabled={disabled}
        isRecording={isRecording}
      />
    </Box>
  );
}

export default Editor;
