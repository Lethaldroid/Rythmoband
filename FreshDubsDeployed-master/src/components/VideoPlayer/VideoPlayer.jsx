import React, { Component } from "react";
import { Player, ControlBar } from "video-react";
import RecordRTC from "recordrtc";
import { Box } from "@mui/material";
import { notify } from "reapop";
import { getSub_Seconds, MakeJson, ToSrtTime } from "../../services/srtreader";
import { convertToSecInt } from "../../services/timeFunctions";
import { mainContext } from "../../services/context";
import store from "../../store/store";
import Editor from "../Editor";
import {
  drawRythmoband,
  prepareCanvasLanes,
} from "../rythmoband/rythmoCanvas";
import { canRenderFast, startFastRender } from "../rythmoband/fastRender";

// Generated video: the picture on top, the rythmoband underneath.
const RENDER_WIDTH = 1280;
const VIDEO_HEIGHT = 720;
const BAND_HEIGHT = 200;
const RENDER_PPS = 200;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function pickVideoMime() {
  const candidates = ["video/webm;codecs=vp9", "video/webm", "video/mp4"];
  if (typeof MediaRecorder === "undefined") return "video/webm";
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "video/webm";
}

class VideoPlayer extends Component {
  static contextType = mainContext;

  constructor(props, context) {
    super(props, context);
    this.state = {
      player: { currentTime: 0, playbackRate: 1, paused: true, duration: 0 },
      generating: false,
      pauseRender: true,
      renderProgress: 0,
      renderFast: false,
    };
    this.vidd = React.createRef();
    this.vidCanva = React.createRef();
    this.recorder = React.createRef();
    this.renderMode = "idle"; // idle | running | paused | stopping
    this.initialPlay = true;
  }

  componentDidMount() {
    this.unsubscribe = this.player.subscribeToStateChange(this.handleStateChange);

    const video = this.vidd.current;
    video.addEventListener("loadedmetadata", this.setupRenderer);
    video.addEventListener("play", this.handleRenderPlay);
    video.addEventListener("pause", this.handleRenderPause);
    video.addEventListener("ended", this.finishRender);
    video.addEventListener("timeupdate", this.handleRenderProgress);
  }

  componentDidUpdate(prevProps) {
    const { vidHot, setVidHot } = this.props;
    if (vidHot.play !== prevProps.vidHot.play) {
      const { player } = this.player.getState();
      if (vidHot.play && player.paused) this.startPlayback();
      if (!vidHot.play && !player.paused) this.player.pause();
    }
    if (vidHot.save && !prevProps.vidHot.save) {
      this.save();
      setVidHot((v) => ({ ...v, save: false }));
    }
  }

  componentWillUnmount() {
    this.unsubscribe?.();
    const video = this.vidd.current;
    if (video) {
      video.removeEventListener("loadedmetadata", this.setupRenderer);
      video.removeEventListener("play", this.handleRenderPlay);
      video.removeEventListener("pause", this.handleRenderPause);
      video.removeEventListener("ended", this.finishRender);
      video.removeEventListener("timeupdate", this.handleRenderProgress);
    }
    cancelAnimationFrame(this.renderFrame);
    this.audioCtx?.close();
    if (this.fastJob) {
      this.fastCanceled = true;
      this.fastJob.cancel();
    }
  }

  handleStateChange = (state, prevState) => {
    this.setState({ player: state });
    // Keep the play hotkey flag in step when playback changes elsewhere
    // (video controls, end of video), so Space always toggles correctly.
    if (!prevState || state.paused !== prevState.paused) {
      this.props.setVidHot((v) =>
        v.play === !state.paused ? v : { ...v, play: !state.paused }
      );
    }
  };

  startPlayback() {
    if (this.initialPlay) {
      this.initialPlay = false;
      const start = getSub_Seconds(this.props.initialTime || 0);
      if (start > 0 && this.player.getState().player.currentTime < 0.01) {
        this.player.seek(start);
      }
    }
    // If the browser refuses to play (autoplay policy, no source yet), put the
    // flag back so the next Play press or Space is not swallowed.
    const result = this.player.video?.video?.play();
    if (result?.catch) {
      result.catch(() => this.props.setVidHot((v) => ({ ...v, play: false })));
    }
  }

  // The flag can disagree with the element (e.g. a refused play); act directly
  // in that case instead of waiting for a flag change that never comes.
  play = () => {
    if (this.props.vidHot.play) this.startPlayback();
    else this.props.setVidHot((v) => ({ ...v, play: true }));
  };

  pause = () => {
    if (!this.props.vidHot.play) this.player.pause();
    else this.props.setVidHot((v) => ({ ...v, play: false }));
  };

  getCurrentTime = () => this.player.getState().player.currentTime;

  seekTo = (seconds) => {
    if (!this.player) return;
    const { duration } = this.player.getState().player;
    const max = isFinite(duration) && duration > 0 ? duration : Infinity;
    this.player.seek(clamp(seconds, 0, max));
  };

  seekBy = (seconds) => this.seekTo(this.getCurrentTime() + seconds);

  changeVolume = (step) => {
    const { volume } = this.player.getState().player;
    this.player.volume = clamp(Math.round((volume + step) * 10) / 10, 0, 1);
  };

  changePlaybackRate = (rate) => {
    this.player.playbackRate = clamp(rate, 0.25, 2);
  };

  save = () => {
    if (!this.player) return;
    MakeJson(
      ToSrtTime(this.getCurrentTime()),
      this.context.recordingData,
      store.getState().app
    );
  };

  // ---- Video generation (picture + rythmoband) --------------------------

  setupRenderer = () => {
    this.context.setVidDuration?.(this.vidd.current.duration);
    if (this.recorder.current) return;

    const canvas = this.vidCanva.current;
    canvas.width = RENDER_WIDTH;
    canvas.height = VIDEO_HEIGHT + BAND_HEIGHT;
    const stream = canvas.captureStream(30);

    // A media element can only be wired into Web Audio once.
    this.audioCtx = new AudioContext();
    const source = this.audioCtx.createMediaElementSource(this.vidd.current);
    const destination = this.audioCtx.createMediaStreamDestination();
    source.connect(destination);
    destination.stream.getAudioTracks().forEach((t) => stream.addTrack(t));

    this.mimeType = pickVideoMime();
    this.recorder.current = RecordRTC(stream, {
      type: "video",
      mimeType: this.mimeType,
      frameRate: 30,
    });
  };

  // Fast path: offline WebCodecs encode, typically several times faster than
  // real time. Falls back to the real-time recorder if the browser or the
  // video's codec isn't supported.
  startRender = async () => {
    if (this.fastJob) {
      this.fastJob.resume();
      this.setState({ pauseRender: false });
      return;
    }
    if (this.renderMode !== "paused" && canRenderFast() && this.props.source) {
      this.startFastRender();
      return;
    }
    this.startRealtimeRender();
  };

  startFastRender = () => {
    this.pause();
    const lanes = prepareCanvasLanes(store.getState().app, {
      height: BAND_HEIGHT,
      pps: RENDER_PPS,
    });
    let lastPaint = 0;
    const job = startFastRender({
      src: this.props.source,
      lanes,
      width: RENDER_WIDTH,
      videoHeight: VIDEO_HEIGHT,
      bandHeight: BAND_HEIGHT,
      pps: RENDER_PPS,
      onProgress: (ratio) => {
        // Progress fires per frame; repaint the bar a few times a second.
        const now = performance.now();
        if (now - lastPaint > 150 || ratio >= 1) {
          lastPaint = now;
          this.setState({ renderProgress: ratio });
        }
      },
    });
    this.fastJob = job;
    this.renderStartedAt = performance.now();
    this.setState({ generating: true, pauseRender: false, renderFast: true, renderProgress: 0 });

    job.promise
      .then((blob) => {
        const name = (store.getState().app.projectName || "dubmaster").trim();
        this.downloadBlob(blob, `${name}-rythmoband.mp4`);
        const seconds = Math.round((performance.now() - this.renderStartedAt) / 1000);
        store.dispatch(notify({ message: `Rehearsal video ready in ${seconds}s`, status: "success" }));
      })
      .catch((error) => {
        if (error?.name === "ConversionCanceledError" || this.fastCanceled) return;
        console.warn("Fast render failed, using real-time render", error);
        store.dispatch(
          notify({ message: "Fast render isn't supported for this video; rendering in real time", status: "info" })
        );
        this.fastJob = null;
        this.startRealtimeRender();
      })
      .finally(() => {
        if (this.fastJob === job) {
          this.fastJob = null;
          this.fastCanceled = false;
          this.setState({ generating: false, pauseRender: true, renderProgress: 0, renderFast: false });
        }
      });
  };

  startRealtimeRender = async () => {
    const video = this.vidd.current;
    const recorder = this.recorder.current;
    if (!recorder) {
      store.dispatch(notify({ message: "Load a video before generating", status: "warning" }));
      return;
    }
    await this.audioCtx?.resume();
    this.pause();
    if (this.renderMode === "paused") {
      recorder.resumeRecording();
    } else {
      this.lanes = prepareCanvasLanes(store.getState().app, {
        height: BAND_HEIGHT,
        pps: RENDER_PPS,
      });
      video.currentTime = 0;
      recorder.startRecording();
    }
    this.renderMode = "running";
    this.setState({ generating: true, pauseRender: false, renderFast: false });
    video.play();
  };

  pauseRender = () => {
    if (this.fastJob) {
      this.fastJob.pause();
      this.setState({ pauseRender: true });
      return;
    }
    this.renderMode = "paused";
    this.setState({ pauseRender: true });
    this.vidd.current.pause();
  };

  stopRender = () => {
    if (this.fastJob) {
      this.fastCanceled = true;
      this.fastJob.cancel();
      return;
    }
    this.renderMode = "stopping";
    this.vidd.current.pause();
  };

  handleRenderPlay = () => {
    this.drawFrame();
  };

  handleRenderPause = () => {
    cancelAnimationFrame(this.renderFrame);
    if (this.renderMode === "paused") this.recorder.current?.pauseRecording();
    if (this.renderMode === "stopping") this.finishRender();
  };

  handleRenderProgress = () => {
    const video = this.vidd.current;
    if (this.renderMode === "running" && video.duration) {
      this.setState({ renderProgress: video.currentTime / video.duration });
    }
  };

  finishRender = () => {
    const recorder = this.recorder.current;
    if (!recorder || this.renderMode === "idle") return;
    this.renderMode = "idle";
    cancelAnimationFrame(this.renderFrame);
    recorder.stopRecording(() => {
      const ext = this.mimeType.includes("mp4") ? "mp4" : "webm";
      const name = (store.getState().app.projectName || "dubmaster").trim();
      this.downloadBlob(recorder.getBlob(), `${name}-rythmoband.${ext}`);
      recorder.reset();
    });
    this.vidd.current.currentTime = 0;
    this.setState({ generating: false, pauseRender: true, renderProgress: 0 });
  };

  drawFrame = () => {
    const video = this.vidd.current;
    const ctx = this.vidCanva.current.getContext("2d");
    if (video.paused || video.ended) return;

    // Letterbox the picture instead of stretching it.
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, RENDER_WIDTH, VIDEO_HEIGHT);
    const scale = Math.min(
      RENDER_WIDTH / (video.videoWidth || RENDER_WIDTH),
      VIDEO_HEIGHT / (video.videoHeight || VIDEO_HEIGHT)
    );
    const w = (video.videoWidth || RENDER_WIDTH) * scale;
    const h = (video.videoHeight || VIDEO_HEIGHT) * scale;
    ctx.drawImage(video, (RENDER_WIDTH - w) / 2, (VIDEO_HEIGHT - h) / 2, w, h);

    drawRythmoband(ctx, this.lanes || [], video.currentTime, {
      x: 0,
      y: VIDEO_HEIGHT,
      width: RENDER_WIDTH,
      height: BAND_HEIGHT,
      pps: RENDER_PPS,
    });
    this.renderFrame = requestAnimationFrame(this.drawFrame);
  };

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  render() {
    const { player, generating, pauseRender, renderProgress, renderFast } = this.state;
    return (
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
        <canvas ref={this.vidCanva} hidden />
        <Box
          sx={{
            height: { xs: "34vh", md: "46vh" },
            minHeight: 220,
            px: { xs: 1, md: 3 },
            pt: { xs: 1, md: 2 },
            "& .video-react": {
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
              bgcolor: "#000",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-sans)",
            },
            // brand the video-react controls: accent progress, mono time display
            "& .video-react .video-react-play-progress, & .video-react .video-react-volume-level":
              { backgroundColor: "var(--primary)" },
            "& .video-react .video-react-control-bar": { backgroundColor: "rgba(11,11,13,0.85)" },
            "& .video-react .video-react-time-control": {
              fontFamily: "var(--font-mono)",
              fontVariantNumeric: "tabular-nums",
            },
            "& .video-react .video-react-big-play-button": {
              borderColor: "var(--primary)",
              backgroundColor: "rgba(11,11,13,0.6)",
            },
            "& video": { width: "100%", height: "100%", objectFit: "contain" },
          }}
        >
          <Player
            fluid={false}
            width="100%"
            height="100%"
            src={this.props.source || undefined}
            startTime={convertToSecInt(this.props.initialTime)}
            ref={(p) => {
              this.player = p;
            }}
          >
            <source src={this.props.source || undefined} />
            <video
              ref={this.vidd}
              style={{ display: "none" }}
              src={this.props.source || undefined}
            />
            <ControlBar autoHide={false} />
          </Player>
        </Box>
        <Editor
          player={player}
          plyr={this.player}
          hasVideo={!!this.props.source}
          vidHot={this.props.vidHot}
          setVidHot={this.props.setVidHot}
          play={this.play}
          pause={this.pause}
          seekTo={this.seekTo}
          seekBy={this.seekBy}
          changeVolume={this.changeVolume}
          changePlaybackRate={this.changePlaybackRate}
          getCurrentTime={this.getCurrentTime}
          save={this.save}
          generating={generating}
          pauseRender={pauseRender}
          renderProgress={renderProgress}
          renderFast={renderFast}
          startRender={this.startRender}
          pauseRenderVideo={this.pauseRender}
          stopRender={this.stopRender}
        />
      </Box>
    );
  }
}

export default VideoPlayer;
