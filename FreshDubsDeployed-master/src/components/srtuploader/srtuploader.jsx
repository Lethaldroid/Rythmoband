import * as React from "react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { notify } from "reapop";
import { Box, Button, Card, IconButton, Tooltip, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MovieIcon from "@mui/icons-material/Movie";
import SubtitlesIcon from "@mui/icons-material/Subtitles";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { loadFile } from "../../services/srtreader";
import {
  clearTrack,
  setTrackName,
  uploadSrt1,
  uploadSrt2,
  uploadSrt3,
  uploadTime1,
  uploadTime2,
  uploadTime3,
  uploadVideo,
} from "../../store/features/appSlice";
import { TRACK_COLORS, loadedTracks } from "../rythmoband/cueLayout";

const uploadSrt = [uploadSrt1, uploadSrt2, uploadSrt3];
const uploadTime = [uploadTime1, uploadTime2, uploadTime3];

function Row({ icon, color, title, status, error, accept, onFile, onRemove, loaded }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        p: 1.5,
        borderRadius: 2,
        border: "1px solid",
        borderColor: error ? "error.light" : "divider",
        borderLeft: `4px solid ${color}`,
        bgcolor: "background.paper",
      }}
    >
      <Box sx={{ color, display: "flex" }}>{icon}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ lineHeight: 1.3 }}>
          {title}
        </Typography>
        <Typography
          variant="caption"
          color={error ? "error" : "text.secondary"}
          noWrap
          component="div"
          title={error || status}
        >
          {error || status}
        </Typography>
      </Box>
      <Button size="small" variant={loaded ? "outlined" : "contained"} component="label">
        {loaded ? "Replace" : "Upload"}
        <input
          type="file"
          accept={accept}
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = ""; // allow picking the same file again
            if (file) onFile(file);
          }}
        />
      </Button>
      {onRemove && (
        <Tooltip title="Remove track">
          <span>
            <IconButton size="small" onClick={onRemove} disabled={!loaded}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}
    </Box>
  );
}

export default function SrtUploader({ className, onClose }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const app = useSelector((state) => state.app);
  const [videoName, setVideoName] = useState("");
  const [errors, setErrors] = useState({});

  const tracks = loadedTracks(app);
  const trackByNumber = Object.fromEntries(tracks.map((t) => [t.number, t]));
  const setError = (key, message) => setErrors((prev) => ({ ...prev, [key]: message }));

  const handleVideo = (file) => {
    if (!file.type.startsWith("video/")) {
      setError("video", "That file is not a video.");
      return;
    }
    setError("video", "");
    if (app.vidSource?.startsWith("blob:")) URL.revokeObjectURL(app.vidSource);
    const url = URL.createObjectURL(file);
    setVideoName(file.name);
    dispatch(uploadVideo(url));

    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      if (probe.duration > 90 && user?.membership === "Basic") {
        dispatch(
          notify({
            message: `Hey ${user.userName}, videos longer than 1:30 need an upgraded membership.`,
            status: "warning",
            dismissAfter: 6000,
          })
        );
      }
    };
    probe.onerror = () => setError("video", "This video format can't be played by your browser.");
    probe.src = url;
  };

  const handleSubtitles = async (n, file) => {
    try {
      const { time, dialogue } = await loadFile(file);
      if (!dialogue.some((line) => line.trim())) {
        setError(n, "No subtitles found. Is this an .srt file?");
        return;
      }
      dispatch(uploadSrt[n - 1](dialogue));
      dispatch(uploadTime[n - 1](time));
      dispatch(setTrackName({ track: n, name: file.name }));
      setError(n, "");
    } catch {
      setError(n, "Could not read this file.");
    }
  };

  return (
    <Card
      className={className}
      elevation={8}
      sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.25, borderRadius: 3 }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h6" sx={{ fontSize: 17 }}>
          Project media
        </Typography>
        {onClose && (
          <IconButton size="small" onClick={onClose} aria-label="Close">
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Row
        icon={<MovieIcon />}
        color="#334155"
        title="Video"
        loaded={!!app.vidSource}
        status={app.vidSource ? videoName || "Video loaded" : "No video yet"}
        error={errors.video}
        accept="video/*"
        onFile={handleVideo}
      />

      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
        Subtitle tracks. Each loaded track gets its own lane on the rythmoband.
      </Typography>
      {[1, 2, 3].map((n) => {
        const track = trackByNumber[n];
        const lines = track ? track.dialogue.filter((l) => l && l.trim()).length : 0;
        return (
          <Row
            key={n}
            icon={<SubtitlesIcon />}
            color={TRACK_COLORS[n - 1]}
            title={`Track ${n}`}
            loaded={!!track}
            status={track ? `${track.name} · ${lines} lines` : "Empty"}
            error={errors[n]}
            accept=".srt,text/plain"
            onFile={(file) => handleSubtitles(n, file)}
            onRemove={() => dispatch(clearTrack(n))}
          />
        );
      })}
    </Card>
  );
}
