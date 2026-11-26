import React, { useState, useContext, useRef } from "react";
import { Progress } from "antd";
import { red, green } from "@ant-design/colors";
// vsmg;
// import { Scrubber, ScrubberProps } from "react-scrubber";
import Button from "@mui/material/Button";
import { v4 } from "uuid";

// import "react-voice-recorder/dist/index.css";
// import "react-scrubber/lib/scrubber.css";
import "./AudioPlayer.css";
import { useEffect } from "react";
import TimeSlider from "./TimeSlider";
import Buffer from "Buffer";
import { mainContext, DialoguesContext } from "../services/context";
import audioBufferToWav, { encodeWAV } from "audiobuffer-to-wav";

import RecordRTC from "recordrtc";

// mainContext
// const recorder = new vsmg.Recorder({
//   wasmURL: "https://unpkg.com/vmsg@0.3.0/vmsg.wasm",
// });

const AudioPlayer = (props) => {
  const {
    muteVideo,
    getCurrentTime,
    voiceList,
    videoCurrentTime,
    videoMuteState,
    videoPause,
    videoPlay,
    player,
    getJsonData,
    generating,
    ...rest
  } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState("");
  const [recordingEndTime, setRecordingEndTime] = useState("");
  const [receivedVoices, setReceivedVoices] = useState([]);
  const [currentVoiceToPlay, setCurrentVoiceToPlay] = useState({});
  const [exportStatus, setExportStatus] = useState("null");
  const [link, setLink] = useState("");
  const [wav, setWav] = useState(true);
  const [recorder, setRecorder] = useState({}); //recorder obj
  const bufferRef = useRef(null);
  const aud = useRef(null);

  const {
    recordingData,
    setRecordingData,
    jsonData,
    setJsonData,
    recordings,
    setRecordings,
    statusArray,
    setStatusArray,
    vidDuration,
    channels,
    setChannels,
  } = useContext(mainContext);
  useEffect(() => {
    const instantiateRecorder = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        //MONO Stereo feat
        audio: { channelCount: channels },
        video: false,
      });
      const recorder = new RecordRTC(stream, {
        type: "audio",

        numberOfAudioChannels: channels,
      });

      setRecorder(recorder);
    };
    instantiateRecorder();
  }, [channels]);

  //////////////////////////
  const [selectedInterval, setSelectedInterval] = useState([
    { start: 0, end: 100 },
  ]);
  function random(number) {
    return Math.floor(Math.random() * number);
  }

  const [scrubberValue, setScrubberValue] = useState(50);
  const handleScrubStart = () => {};
  const handleScrubEnd = () => {};

  const handleScrubChange = (value) => {
    setScrubberValue(value);
  };

  const handleFileType = (event) => {
    // console.log(event.target.value);
    setWav(event.target.value);
  };

  const handleRecordingType = (event) => {
    // console.log(event.target.value);
    setChannels(event.target.value);
  };

  // function wavToMp3(channels, sampleRate, samples) {
  //   var buffer = [];
  //   var mp3enc = new lamejs.Mp3Encoder(channels, sampleRate, 224);
  //   var remaining = samples.length;
  //   var samplesPerFrame = 1152;
  //   for (var i = 0; remaining >= samplesPerFrame; i += samplesPerFrame) {
  //     var mono = samples.subarray(i, i + samplesPerFrame);
  //     var mp3buf = mp3enc.encodeBuffer(mono);
  //     if (mp3buf.length > 0) {
  //       buffer.push(new Int8Array(mp3buf));
  //     }
  //     remaining -= samplesPerFrame;
  //   }
  //   var d = mp3enc.flush();
  //   if (d.length > 0) {
  //     buffer.push(new Int8Array(d));
  //   }

  //   var mp3Blob = new Blob(buffer, { type: "audio/mp3" });
  //   var bUrl = window.URL.createObjectURL(mp3Blob);

  //   // send the download link to the console
  //   // console.log("mp3 download:", bUrl);
  // }

  const handleExport = async () => {
    if (exportStatus === "exported") {
      const downloadLink = document.createElement("a");
      // aud.current.src = URL.createObjectURL(link);

      // aud.current.play();
      // if (wav === "true") {
      downloadLink.href = URL.createObjectURL(link);
      // } else {
      //   wavToMp3();
      // }

      // setLink(URL.createObjectURL(audioBlob));
      // console.log("DOWNLOAD LINK", downloadLink.href);

      downloadLink.download = wav === "true" ? "audio.wav" : "audio.mp3";
      // console.log("UEEE", `${wav === "true" ? "audio/wav" : "audio/mp3"}`, wav);
      document.body.appendChild(downloadLink);

      downloadLink.click();
      setExportStatus("null");
    } else if (exportStatus === "loading") {
      return;
    } else {
      setExportStatus("loading");
      try {
        //Creation of context

        const audioContext = new AudioContext();
        const len = recordingData.length;
        const offlineContext = new OfflineAudioContext(
          2,
          44100 * recordingData[len - 1].endTime,
          44100
        );

        //loop
        const gainNode = offlineContext.createGain();
        gainNode.gain.value = 1;

        gainNode.connect(offlineContext.destination);
        for (let i = 0; i < recordingData.length; i++) {
          const gg = await fetch(recordingData[i].sourceAudio);
          const response = await gg.arrayBuffer();
          const decoded = await audioContext.decodeAudioData(response);
          const source = offlineContext.createBufferSource();
          source.buffer = decoded;
          source.connect(gainNode);
          source.start(recordingData[i].startTime);
        }

        const renderedBuffer = await offlineContext.startRendering();
        // console.log("renderedBuffer", renderedBuffer);
        const renderedBuffer2 = audioBufferToWav(renderedBuffer);
        const audioBlob = new Blob([renderedBuffer2], {
          type: `${wav === "true" ? "audio/mp3" : "audio/wav"}`,
        });

        setLink(audioBlob);
        setExportStatus("exported");
      } catch (err) {
        setExportStatus("null");
        console.error(err);
      }
    }
  };
  useEffect(() => {
    setReceivedVoices([...props.voiceList]);
    // setRecordingData([...props.voiceList]);
  }, [props.voiceList]);

  // console.log("Buffer...", recordingData);

  // const data =
  //   "blob:http://localhost:3000/134f0add-62c0-44da-b314-c23d52658683";

  const record = async () => {
    setIsLoading(true);
    if (isRecording) {
      let endTime = props.getCurrentTime();
      setRecordingEndTime(endTime);

      setIsLoading(false);
      setIsRecording(false);
      //OLD recorder
      // const blob = await recorder.stopRecording();
      // blob.arrayBuffer().then(async (arrayBuffer) => {
      //   const buffer = Buffer(arrayBuffer);
      //   bufferRef.current = buffer;
      //   // await removeLast_N_SecondsFromAudio(5, buffer);
      //   await removeFirst_N_SecondsFromAudio(5, buffer);
      // });

      // const base64 = await blobToBase64(blob);
      const time = recordingStartTime;
      //NEW recorder
      await recorder.stopRecording(async () => {
        const gg = recorder.getBlob();

        // console.log(recorder.mimeType);
        const base64 = await blobToBase64(gg);

        // console.log(recorder.buffer);
        const buff = await gg.arrayBuffer();
        const buffer = Buffer(buff);
        setRecordingData([
          ...recordingData,
          {
            sourceAudio: base64,
            color:
              "rgb(" +
              random(255) +
              "," +
              random(255) +
              "," +
              random(255) +
              ")",
            width:
              (endTime / player.duration) * 100 -
              (recordingStartTime / player.duration) * 100,
            widthFrom: (recordingStartTime / player.duration) * 100,
            widthTo: (endTime / player.duration) * 100,
            durtion: player.duration,
            from: recordingStartTime,
            to: endTime,
            recordingDuration: endTime - time,
            audioNumber: jsonData.length + 1 + time,
            buffer: buffer,
            // bufferAddress: bufferRef.current[0],
            url: base64,
            base64,
            startTime: recordingStartTime,
            endTime: endTime,
          },
        ]);
        setStatusArray([
          ...statusArray,
          {
            status: "created",
            originalObj: {
              sourceAudio: base64,
              color:
                "rgb(" +
                random(255) +
                "," +
                random(255) +
                "," +
                random(255) +
                ")",
              width:
                (endTime / player.duration) * 100 -
                (recordingStartTime / player.duration) * 100,
              widthFrom: (recordingStartTime / player.duration) * 100,
              widthTo: (endTime / player.duration) * 100,
              durtion: player.duration,
              from: recordingStartTime,
              to: endTime,
              recordingDuration: endTime - recordingStartTime,
              audioNumber: jsonData.length + 1 + time,
              buffer: buffer,
              // blob: blobRef.current,
              // bufferAddress: bufferRef.current[0],
              url: base64,
              base64,
              startTime: recordingStartTime,
              endTime: endTime,
            },
          },
        ]);
        getJsonData([
          ...jsonData,
          {
            audioNumber: jsonData.length + 1,
            startTime: recordingStartTime,
            endTime: endTime,
            base64,
            buffer: buffer,
          },
        ]);
      });

      setRecordingStartTime("");
      setRecordingEndTime("");
    } else {
      try {
        setRecordingStartTime(props.getCurrentTime());
        //new recorder
        recorder.startRecording();
        //old recorder
        // await recorder.initAudio();
        // await recorder.initWorker();
        // recorder.startRecording();
        setIsLoading(false);
        setIsRecording(true);
      } catch (e) {
        setIsLoading(false);
        console.error(e);
        setIsRecording(false);
      }
    }
  };
  useEffect(() => {
    if (props.vidHot.record) {
      record();
      setIsRecording(true);
    } else if (isRecording && props.vidHot.record === false) {
      setIsRecording(false);
      record();
    } else {
      setIsRecording(false);
    }
  }, [props.vidHot.record]);
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        resolve(reader.result);
      };
    });
  };
  async function removeFirst_N_SecondsFromAudio(seconds, arrayBuffer) {
    const originalArrayBuffer = arrayBuffer; // your original ArrayBuffer
    const bytesPerSecond = 4410 * 2; // sample rate * channels * bytes per sample
    const bytesToRemove = seconds * bytesPerSecond;
    const newArrayBuffer = arrayBuffer.slice(bytesToRemove);
    const totalBytes = originalArrayBuffer.byteLength;
    const newBlob = new Blob([newArrayBuffer], { type: "audio/mpeg" });
    const updated = await blobToBase64(newBlob);
    return updated;
  }
  async function removeLast_N_SecondsFromAudio(seconds, arrayBuffer) {
    const originalArrayBuffer = arrayBuffer; // your original ArrayBuffer
    const secondsToRemove = seconds; // number of seconds to remove
    const bytesPerSecond = 4410 * 2; // sample rate * channels * bytes per sample
    const bytesToRemove = seconds * bytesPerSecond;
    const totalBytes = originalArrayBuffer.byteLength;
    const newArrayBuffer = await originalArrayBuffer.slice(
      0,
      totalBytes - bytesToRemove
    );
    const newBlob = new Blob([newArrayBuffer], { type: "audio/mpeg" });
    const lastRemoved = await blobToBase64(newBlob);
    return lastRemoved;
  }
  async function divideAudio(breakPoint, totalSeconds, arrayBuffer) {
    const removeSeconds = totalSeconds - breakPoint;
    const firstPart = await removeLast_N_SecondsFromAudio(
      removeSeconds,
      arrayBuffer
    );
    const secondPart = await removeFirst_N_SecondsFromAudio(
      breakPoint,
      arrayBuffer
    );
    return {
      firstPart,
      secondPart,
    };
  }
  const downloadJsonFile = async () => {
    // console.log("json Data...", recordingData);
    const jsonString = await `data:text/json;chatset=utf-8,${encodeURIComponent(
      JSON.stringify(recordingData)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "data.json";
    link.click();
  };
  const muteCurrentVideo = () => {
    props.muteVideo(true);
  };
  ////

  useEffect(() => {
    muteCurrentVideo();
    for (let i = 0; i < props.voiceList.length; i++) {
      if (
        props.videoCurrentTime >= props.voiceList[i].startTime &&
        props.videoCurrentTime <= props.voiceList[i].endTime
      ) {
        if (currentVoiceToPlay.audioNumber !== props.voiceList[i].audioNumber) {
          setCurrentVoiceToPlay({ ...props.voiceList[i] });
        }
      }
    }
  }, [props.videoCurrentTime]);
  const onChangeCallback = (selectedInterval) => {};
  return (
    <div>
      <div style={{ marginTop: "50px" }}>
        <React.Fragment>
          <Button
            onClick={muteCurrentVideo}
            variant="contained"
            component="label"
            color="primary"
            style={{ marginLeft: "10px" }}
          >
            Mute video
          </Button>
          <Button
            disabled={isLoading || generating}
            onClick={record}
            variant="contained"
            component="label"
            color="primary"
            style={{ marginLeft: "10px" }}
            onKeyUp={(e) => {
              if (e.code === "Space") {
                e.preventDefault();
              }
            }}
            disableFocusRipple={true}
            disableElevation={true}
            disableRipple={true}
            blurOnSelect
            // disabled={generating}
          >
            {isRecording ? "Stop" : "Record"}
          </Button>
          {/* <ul style={{ listStyle: "none", padding: 0, display: "none" }}>
            {recordingData?.map(({ sourceAudio }) => (
              <li key={v4()}>
                <audio src={sourceAudio} autoplay controls></audio>
              </li>
            ))}
          </ul> */}
        </React.Fragment>
        {/* OldStructure */}

        <Button
          onClick={handleExport}
          variant="contained"
          component="label"
          color="primary"
          style={{ marginLeft: "10px" }}
        >
          {exportStatus === "null" && "Export audio"}
          {exportStatus === "loading" && "Exporting…"}
          {exportStatus === "exported" && "Download audio"}
        </Button>
      </div>
      <div onChange={(e) => handleFileType(e)}>
        <span>Export as:</span>
        {/* can be changed to have more file formats, for now true or false represents wav or mp3 respectively */}
        <input type="radio" name="fileType" id="mp3" value={false} />
        <label htmlFor="mp3">MP3</label>
        <input type="radio" name="fileType" id="wav" value={true} />
        <label htmlFor="wav">WAV</label>
      </div>
      {/* mono stereo switch */}
      <div onChange={(e) => handleRecordingType(e)}>
        <span>Recording input:</span>
        {/* can be changed to have more file formats, for now true or false represents wav or mp3 respectively */}
        <input type="radio" name="recordingType" id="mono" value={1} />
        <label htmlFor="mono">Mono</label>
        <input type="radio" name="recordingType" id="stereo" value={2} />
        <label htmlFor="stereo">Stereo</label>
      </div>
    </div>
  );
};
export default AudioPlayer;
