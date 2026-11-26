import styled from "styled-components";
import DT from "duration-time-conversion";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  memo,
} from "react";
import WFPlayer from "wfplayer";
import clamp from "lodash/clamp";
import Timeline from "./Timeline";
import Metronome from "./Metronome";

const Style = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;

  .progress {
    position: absolute;
    left: 0;
    right: 0;
    top: -12px;
    z-index: 11;
    width: 100%;
    height: 12px;
    user-select: none;
    border-top: 1px solid var(--border-strong);
    background-color: rgb(11 11 13 / 70%);

    .bar {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 0%;
      height: 100%;
      display: inline-block;
      background-color: rgba(255, 90, 54, 0.35);
      overflow: hidden;

      .handle {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 10px;
        cursor: ew-resize;
        background-color: var(--primary);
      }
    }

    .subtitle {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      right: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;

      span {
        position: absolute;
        top: 0;
        bottom: 0;
        height: 100%;
        background-color: rgb(255 255 255 / 20%);
      }
    }
  }

  .duration {
    position: absolute;
    left: 0;
    right: 0;
    top: -40px;
    z-index: 12;
    width: 100%;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 16px;
    color: var(--amber);
    text-shadow: 0 1px 2px rgb(0 0 0 / 75%);
    text-align: center;
    user-select: none;
    pointer-events: none;
  }

  .waveform {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    z-index: 1;
    user-select: none;
    pointer-events: none;
  }

  .grab {
    position: relative;
    z-index: 11;
    cursor: grab;
    height: 20%;
    user-select: none;
    background-color: rgb(255 255 255 / 6%);
    border-top: 1px solid var(--border-strong);
    border-bottom: 1px solid var(--border-strong);

    &.grabbing {
      cursor: grabbing;
    }
  }
`;

const Waveform = memo(
  ({ player, setWaveform, setRender }) => {
    const $waveform = useRef(null);

    useEffect(() => {
      const container = $waveform.current;
      let observer;

      const create = () => {
        [...WFPlayer.instances].forEach((item) => item.destroy());
        const waveform = new WFPlayer({
          scrollable: true,
          useWorker: false,
          duration: 10,
          padding: 1,
          wave: true,
          pixelRatio: 2,
          container,
          mediaElement: player,
          backgroundColor: "rgba(0, 0, 0, 0)",
          waveColor: "rgba(255, 255, 255, 0.2)",
          progressColor: "rgba(255, 90, 54, 0.6)",
          gridColor: "rgba(255, 255, 255, 0.05)",
          rulerColor: "rgba(255, 255, 255, 0.5)",
          paddingColor: "rgba(0, 0, 0, 0)",
        });
        setWaveform(waveform);
        waveform.on("update", setRender);
        waveform.load("/sample.mp3");
      };

      // wfplayer recurses forever when drawn at zero width (e.g. in a hidden
      // tab), so wait until the container has been laid out.
      if (container.clientWidth > 0) {
        create();
      } else {
        observer = new ResizeObserver(() => {
          if (container.clientWidth > 0) {
            observer.disconnect();
            create();
          }
        });
        observer.observe(container);
      }
      return () => observer && observer.disconnect();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div className="waveform" ref={$waveform} />;
  },
  () => true
);

const Grab = (props) => {
  const [grabStartX, setGrabStartX] = useState(0);
  const [grabStartTime, setGrabStartTime] = useState(0);
  const [grabbing, setGrabbing] = useState(false);

  const onGrabDown = useCallback(
    (event) => {
      if (event.button !== 0) return;
      setGrabStartX(event.pageX);
      setGrabStartTime(props.player.currentTime);
      setGrabbing(true);
    },
    [props.player]
  );

  const onGrabUp = () => {
    setGrabStartX(0);
    setGrabStartTime(0);
    setGrabbing(false);
  };

  const onGrabMove = useCallback(
    (event) => {
      if (grabbing && props.player && props.waveform) {
        const currentTime = clamp(
          grabStartTime -
            ((event.pageX - grabStartX) / document.body.clientWidth) * 10,
          0,
          props.player.duration
        );
        props.player.currentTime = currentTime;
        props.waveform.seek(currentTime);
      }
    },
    [grabbing, props.player, props.waveform, grabStartX, grabStartTime]
  );

  useEffect(() => {
    document.addEventListener("mouseup", onGrabUp);
    return () => document.removeEventListener("mouseup", onGrabUp);
  }, []);

  return (
    <div
      className={`grab ${grabbing ? "grabbing" : ""}`}
      onMouseDown={onGrabDown}
      onMouseMove={onGrabMove}
    ></div>
  );
};

const Progress = (props) => {
  const [grabbing, setGrabbing] = useState(false);

  const onProgressClick = useCallback(
    (event) => {
      if (event.button !== 0) return;
      const currentTime =
        (event.pageX / document.body.clientWidth) * props.player.duration;
      props.player.currentTime = currentTime;
      props.waveform.seek(currentTime);
    },
    [props]
  );

  const onGrabDown = useCallback(
    (event) => {
      if (event.button !== 0) return;
      setGrabbing(true);
    },
    [setGrabbing]
  );

  const onGrabMove = useCallback(
    (event) => {
      if (grabbing) {
        const currentTime =
          (event.pageX / document.body.clientWidth) * props.player.duration;
        props.player.currentTime = currentTime;
      }
    },
    [grabbing, props.player]
  );

  const onDocumentMouseUp = useCallback(() => {
    if (grabbing) {
      setGrabbing(false);
      props.waveform.seek(props.player.currentTime);
    }
  }, [grabbing, props.waveform, props.player.currentTime]);

  useEffect(() => {
    document.addEventListener("mouseup", onDocumentMouseUp);
    document.addEventListener("mousemove", onGrabMove);
    return () => {
      document.removeEventListener("mouseup", onDocumentMouseUp);
      document.removeEventListener("mousemove", onGrabMove);
    };
  }, [onDocumentMouseUp, onGrabMove]);

  const { duration } = props.player;
  const markers = useMemo(
    () =>
      duration && props.subtitle.length <= 200
        ? props.subtitle.map((item, index) => (
            <span
              key={index}
              className="item"
              style={{
                left: `${(item.startTime / duration) * 100}%`,
                width: `${(item.duration / duration) * 100}%`,
              }}
            ></span>
          ))
        : null,
    [props.subtitle, duration]
  );

  return (
    <div className="progress" onClick={onProgressClick}>
      <div
        className="bar"
        style={{
          width: `${
            props.player.duration
              ? (props.currentTime / props.player.duration) * 100
              : 0
          }%`,
        }}
      >
        <div className="handle" onMouseDown={onGrabDown}></div>
      </div>
      <div className="subtitle">{markers}</div>
    </div>
  );
};

const Duration = (props) => {
  const getDuration = useCallback((time) => {
    time = time === Infinity ? 0 : time;
    return DT.d2t(time).split(".")[0];
  }, []);

  return (
    <div className="duration">
      <span>
        {getDuration(props.currentTime)} /{" "}
        {getDuration(props.player.duration || 0)}
      </span>
    </div>
  );
};

export default function Footer(props) {
  const $footer = useRef(null);
  const [render, setRender] = useState({
    padding: 2,
    duration: 10,
    gridGap: 10,
    gridNum: 110,
    beginTime: -5,
  });

  // Smooth wheel scrubbing: wheel deltas move a target time and a rAF loop
  // eases the playhead towards it, instead of jumping in throttled steps.
  const wheel = useRef({ target: null, frame: 0 });
  const { player, waveform } = props;

  useEffect(() => {
    const $el = $footer.current;
    if (!$el || !player || !waveform) return undefined;
    const state = wheel.current;

    const step = () => {
      const current = player.currentTime;
      const diff = state.target - current;
      if (Math.abs(diff) < 0.01) {
        waveform.seek(state.target);
        state.target = null;
        state.frame = 0;
        return;
      }
      waveform.seek(current + diff * 0.35);
      state.frame = requestAnimationFrame(step);
    };

    const onWheel = (event) => {
      if (!player.paused || !player.duration) return;
      event.preventDefault();
      // Trackpads scroll sideways, mouse wheels vertically: use whichever moved more
      let delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
      if (event.deltaMode === 1) delta *= 16; // lines -> pixels
      if (event.deltaMode === 2) delta *= $el.clientWidth; // pages -> pixels
      // One pixel of scroll moves the timeline by one pixel (10s per width).
      const seconds = (delta / $el.clientWidth) * 10;
      const from = state.target === null ? player.currentTime : state.target;
      state.target = clamp(from + seconds, 0, player.duration);
      if (!state.frame) state.frame = requestAnimationFrame(step);
    };

    $el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      $el.removeEventListener("wheel", onWheel);
      cancelAnimationFrame(state.frame);
      state.frame = 0;
      state.target = null;
    };
  }, [$footer, player, waveform]);

  return (
    <Style className="footer" ref={$footer}>
      {props.player ? (
        <React.Fragment>
          <Progress {...props} />
          <Duration {...props} />
          <Waveform {...props} setRender={setRender} />
          <Grab {...props} render={render} />
          <Metronome {...props} render={render} />
          <Timeline {...props} render={render} />
        </React.Fragment>
      ) : null}
    </Style>
  );
}
