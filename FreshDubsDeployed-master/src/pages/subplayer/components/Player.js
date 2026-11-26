import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
} from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Translate } from "react-i18nify";
import styled from "styled-components";
import backlight from "../libs/backlight";
import { isPlaying } from "../utils";

const Style = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  min-height: 0;
  overflow: hidden;
  padding: 24px;

  .video {
    display: flex;
    align-items: center;
    justify-content: center;
    max-height: 100%;
    max-width: 100%;
    position: relative;

    video {
      display: block;
      position: relative;
      z-index: 10;
      outline: none;
      /* viewport minus navbar (64), footer (200) and this padding (48) */
      max-height: calc(100vh - 312px);
      max-width: 100%;
      box-shadow: 0px 5px 25px 5px rgb(0 0 0 / 80%);
      background-color: #000;
      cursor: pointer;
    }

    .subtitle {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      position: absolute;
      z-index: 20;
      left: 0;
      right: 0;
      bottom: 5%;
      width: 100%;
      padding: 0 20px;
      user-select: none;
      pointer-events: none;

      .operate {
        padding: 5px 15px;
        color: #fff;
        font-size: 13px;
        border-radius: var(--radius-full);
        margin-bottom: 6px;
        font-weight: 600;
        color: var(--on-primary);
        background-color: var(--primary);
        border: 1px solid var(--primary);
        cursor: pointer;
        pointer-events: all;
      }

      .textarea {
        width: 100%;
        outline: none;
        resize: none;
        text-align: center;
        line-height: 1.2;
        border: none;
        color: #fff;
        font-size: clamp(16px, 2.2vw, 24px);
        font-weight: 500;
        padding: 6px 12px;
        border-radius: var(--radius-sm);
        pointer-events: all;
        background-color: rgb(0 0 0 / 0);
        text-shadow: rgb(0 0 0) 1px 0px 1px, rgb(0 0 0) 0px 1px 1px,
          rgb(0 0 0) -1px 0px 1px, rgb(0 0 0) 0px -1px 1px;

        &.pause {
          background-color: rgb(0 0 0 / 50%);
        }

        &:focus-visible {
          outline: 2px solid var(--primary);
        }
      }
    }
  }
`;

const VideoWrap = memo(
  ({ setPlayer, setCurrentTime, setPlaying }) => {
    const $video = useRef(null);

    useEffect(() => {
      const video = $video.current;
      setPlayer(video);
      let frame;
      (function loop() {
        frame = window.requestAnimationFrame(() => {
          setPlaying(isPlaying(video));
          setCurrentTime(video.currentTime || 0);
          loop();
        });
      })();
      return () => window.cancelAnimationFrame(frame);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onClick = useCallback(() => {
      if ($video.current) {
        if (isPlaying($video.current)) {
          $video.current.pause();
        } else {
          $video.current.play();
        }
      }
    }, [$video]);

    return <video
        onClick={onClick}
        src="sample.mp4"
        ref={$video}
        preload="auto"
        aria-label="Video preview. Click to play or pause."
      />;
  },
  () => true
);

export default function Player(props) {
  const [focusing, setFocusing] = useState(false);
  const [inputItemCursor, setInputItemCursor] = useState(0);
  const $player = useRef(null);

  useEffect(() => {
    if ($player.current && props.player && !backlight.state) {
      backlight.state = true;
      backlight($player.current, props.player);
    }
  }, [$player, props.player]);

  const currentSub = props.subtitle[props.currentIndex] || null;

  const onChange = useCallback(
    (event) => {
      props.player.pause();
      props.updateSub(currentSub, { text: event.target.value });
      if (event.target.selectionStart) {
        setInputItemCursor(event.target.selectionStart);
      }
    },
    [props, currentSub]
  );

  const onClick = useCallback(
    (event) => {
      props.player.pause();
      if (event.target.selectionStart) {
        setInputItemCursor(event.target.selectionStart);
      }
    },
    [props]
  );

  const onFocus = useCallback((event) => {
    setFocusing(true);
    if (event.target.selectionStart) {
      setInputItemCursor(event.target.selectionStart);
    }
  }, []);

  const onBlur = useCallback(() => {
    setTimeout(() => setFocusing(false), 500);
  }, []);

  const onSplit = useCallback(() => {
    props.splitSub(currentSub, inputItemCursor);
  }, [props, currentSub, inputItemCursor]);

  return (
    <Style className="player">
      <div className="video" ref={$player}>
        <VideoWrap {...props} />
        {props.player && currentSub ? (
          <div className="subtitle">
            {focusing ? (
              <div className="operate" onClick={onSplit}>
                <Translate value="SPLIT" />
              </div>
            ) : null}
            <TextareaAutosize
              className={`textarea ${!props.playing ? "pause" : ""}`}
              value={currentSub.text}
              onChange={onChange}
              onClick={onClick}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyDown={onFocus}
              spellCheck={false}
              aria-label="Current subtitle text"
            />
          </div>
        ) : null}
      </div>
    </Style>
  );
}
