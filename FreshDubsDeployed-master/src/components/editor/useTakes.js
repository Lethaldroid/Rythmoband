import { useCallback, useContext, useRef } from "react";
import { mainContext } from "../../services/context";

const HISTORY_LIMIT = 50;

// Recorded takes plus snapshot-based undo/redo. Takes are immutable, so a
// snapshot is just the previous array; the audio data is shared, not copied.
// Refs mirror state so async callbacks (recorder stop, trimming) never commit
// against a stale list.
export default function useTakes() {
  const {
    recordingData,
    setRecordingData,
    statusArray,
    setStatusArray,
    redoArray,
    setRedoArray,
  } = useContext(mainContext);

  const takesRef = useRef(recordingData);
  const undoRef = useRef(statusArray);
  const redoRef = useRef(redoArray);
  takesRef.current = recordingData;
  undoRef.current = statusArray;
  redoRef.current = redoArray;

  const apply = useCallback(
    (takes, undo, redo) => {
      takesRef.current = takes;
      undoRef.current = undo;
      redoRef.current = redo;
      setRecordingData(takes);
      setStatusArray(undo);
      setRedoArray(redo);
    },
    [setRecordingData, setStatusArray, setRedoArray]
  );

  const commit = useCallback(
    (updater) => {
      const prev = takesRef.current;
      const next = updater(prev);
      if (next === prev) return;
      apply(next, [...undoRef.current, prev].slice(-HISTORY_LIMIT), []);
    },
    [apply]
  );

  const undo = useCallback(() => {
    const history = undoRef.current;
    if (!history.length) return;
    apply(history[history.length - 1], history.slice(0, -1), [
      ...redoRef.current,
      takesRef.current,
    ]);
  }, [apply]);

  const redo = useCallback(() => {
    const future = redoRef.current;
    if (!future.length) return;
    apply(future[future.length - 1], [...undoRef.current, takesRef.current], future.slice(0, -1));
  }, [apply]);

  return {
    takes: recordingData,
    commit,
    undo,
    redo,
    canUndo: statusArray.length > 0,
    canRedo: redoArray.length > 0,
  };
}
