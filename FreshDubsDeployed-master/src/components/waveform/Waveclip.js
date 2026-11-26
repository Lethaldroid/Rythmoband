import React, { memo, useEffect, useRef } from "react";
import Wavesurfer from "wavesurfer.js";
import stylez from "./Waveform.module.css";

// Static waveform of one take. Re-created only when its audio changes and
// destroyed on unmount (each instance holds decoded audio and a canvas).
function Waveclip({ sourceAudio, height = 44 }) {
  const container = useRef(null);

  useEffect(() => {
    if (!sourceAudio) return;
    const wave = Wavesurfer.create({
      container: container.current,
      waveColor: "rgba(255,255,255,0.9)",
      cursorColor: "transparent",
      barGap: 1,
      barWidth: 2,
      barRadius: 2,
      barMinHeight: 2,
      height,
      interact: false,
      hideScrollbar: true,
      fillParent: true,
      responsive: true,
      normalize: true,
    });
    wave.load(sourceAudio);
    return () => wave.destroy();
  }, [sourceAudio, height]);

  return <div ref={container} className={stylez.omo} />;
}

export default memo(Waveclip);
