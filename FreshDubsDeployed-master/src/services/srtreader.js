import { notify } from "reapop";
import { saveProject, uploadProject } from "../store/features/appSlice";
import store from "../store/store";
import { convertToSecInt } from "./timeFunctions";


export const loadFile = async (file) => {
  const dialogue = [];
  const time = [];

  let text = await file.text();
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const lines = text.split("\n");
  const timeRegex = /(\d{1,2}:\d{2}:\d{2}[,\.:]\d{2,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,\.:]\d{2,3})/;

  let currentStart = null;
  let currentEnd = null;
  let currentLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const match = line.match(timeRegex);

    if (match) {
      if (currentStart && currentEnd && currentLines.length > 0) {
        time.push([currentStart, currentEnd]);
        dialogue.push(currentLines.join(" ").trim());
        currentLines = [];
      }
      // Normalize to HH:MM:SS:mmm
      currentStart = match[1].replace(",", ":").replace(".", ":");
      currentEnd = match[2].replace(",", ":").replace(".", ":");
    } else if (currentStart && currentEnd) {
      if (line === "" || /^\d+$/.test(line)) {
        if (i + 1 < lines.length && timeRegex.test(lines[i + 1].trim())) {
          time.push([currentStart, currentEnd]);
          dialogue.push(currentLines.join(" ").trim());
          currentStart = null;
          currentEnd = null;
          currentLines = [];
        }
      } else {
        currentLines.push(line);
      }
    }
  }

  if (currentStart && currentEnd && currentLines.length > 0) {
    time.push([currentStart, currentEnd]);
    dialogue.push(currentLines.join(" ").trim());
  }

  for (var i = 0; i < time.length - 1; i++) {
    const diff = getSub_Millis(time[i + 1][0]) - getSub_Millis(time[i][1]);
    if (diff < 50) {
      const timeToAdd = Math.ceil((50 - diff) / 2);
      time[i][1] = adjustTime(time[i][1], -timeToAdd);
      time[i + 1][0] = adjustTime(time[i + 1][0], timeToAdd);
    }
  }

  return { time, dialogue };
};

function adjustTime(timeStr, milliseconds) {
  const timeInMillis = getSub_Millis(timeStr);
  const adjustedTimeInMillis = Math.max(0, timeInMillis + milliseconds);

  const hours = Math.floor(adjustedTimeInMillis / 3600000);
  const minutes = Math.floor((adjustedTimeInMillis % 3600000) / 60000);
  const seconds = Math.floor((adjustedTimeInMillis % 60000) / 1000);
  const millis = adjustedTimeInMillis % 1000;

  return `${formatTimeComponent(hours)}:${formatTimeComponent(
    minutes
  )}:${formatTimeComponent(seconds)}:${formatTimeComponent(millis)}`;
}

function formatTimeComponent(component) {
  return component.toString().padStart(2, "0");
}

export const makeSubs = () => {
  const time = [];
};

export const getSub_Seconds = (param) => {
  return convertToSecInt(param);
};

export const getSub_Millis = (param) => {
  return Math.round(convertToSecInt(param) * 1000);
};

export const loadJson = async (file) => {
  // var loaded_Json_data = await file.text();
  var encodedData = file.split(",")[1];

  // Decode the URI component
  var decodedData = decodeURIComponent(encodedData);

  // Parse the JSON data
  // var loadedData = JSON.parse(decodedData);
  var decoded = JSON.parse(decodedData);

  //Old Structure
  // dial_number = decoded["number"];
  // rythmo_position = decoded["position"];
  return decoded;
};


// Fields of a recording worth persisting (buffers and derived layout are not).
const SAVED_RECORD_FIELDS = [
  "audioNumber",
  "sourceAudio",
  "color",
  "from",
  "to",
  "startTime",
  "endTime",
  "recordingDuration",
];

// Serialises the project: the recordings, then one meta entry holding the
// playhead position and the subtitle tracks so a reopened project is complete.
export const MakeJson = async (currentTime, savedRecords, app = {}) => {
  const records = (savedRecords || []).map((record) => {
    const out = {};
    SAVED_RECORD_FIELDS.forEach((key) => {
      if (record[key] !== undefined) out[key] = record[key];
    });
    return out;
  });
  const meta = {
    currentTime,
    tracks: {
      srt1: app.srt1,
      srt2: app.srt2,
      srt3: app.srt3,
      time1: app.time1,
      time2: app.time2,
      time3: app.time3,
      trackNames: app.trackNames,
    },
  };
  const data =
    "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify([...records, meta]));

  store.dispatch(saveProject(data));
  try {
    await store.dispatch(uploadProject(data)).unwrap();
    store.dispatch(notify({ message: "Project saved", status: "success" }));
  } catch (error) {
    store.dispatch(
      notify({
        message: `Saving failed${typeof error === "string" ? `: ${error}` : ". Check your connection."}`,
        status: "error",
      })
    );
  }
};
// Seconds -> "H:MM:SS:mmm", the format convertToSecInt reads back.
export const ToSrtTime = (value) => {
  const totalMs = Math.max(0, Math.round((Number(value) || 0) * 1000));
  const hours = Math.floor(totalMs / 3600000);
  const mins = Math.floor((totalMs % 3600000) / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  const millis = totalMs % 1000;
  const pad = (n, len = 2) => String(n).padStart(len, "0");
  return `${hours}:${pad(mins)}:${pad(secs)}:${pad(millis, 3)}`;
};
