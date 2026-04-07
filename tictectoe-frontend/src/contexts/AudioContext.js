import React, { createContext, useContext, useReducer, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { saveProgress, loadProgress } from "./progressService";

const AudioContext = createContext();

const initialState = {
  isPlaying: false,
  currentTrack: null,
  currentSegmentIndex: 0,
  audioSegments: [],
  position: 0,
  duration: 0,
  isLoading: false,
  error: null,
  sound: null,
  paperInfo: null,
};

const audioReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_AUDIO_SEGMENTS":
      return { ...state, audioSegments: action.payload };
    case "SET_CURRENT_TRACK":
      return { ...state, currentTrack: action.payload };
    case "SET_PLAYING":
      return { ...state, isPlaying: action.payload };
    case "SET_POSITION":
      return { ...state, position: action.payload };
    case "SET_DURATION":
      return { ...state, duration: action.payload };
    case "SET_SEGMENT_INDEX":
      return { ...state, currentSegmentIndex: action.payload };
    case "SET_SOUND":
      return { ...state, sound: action.payload };
    case "SET_PAPER_INFO":
      return { ...state, paperInfo: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
};

export const AudioProvider = ({ children }) => {
  const [state, dispatch] = useReducer(audioReducer, initialState);

  // --- refs to avoid stale state in callbacks ---
  const soundRef = useRef(null);
  const segmentsRef = useRef([]);
  const isPlayingRef = useRef(false);
  const segmentIndexRef = useRef(0);
  const paperInfoRef = useRef(null);
  const activeSegmentRef = useRef(0);

  // progress per segment per paper (in memory) in milliseconds
  // Key format: "paperID:segmentIndex"
  const segmentProgressRef = useRef({});

  // throttle writes to progressRef
  const lastWriteRef = useRef(0);

  // Helper function to generate unique progress key for paper + segment
  const getProgressKey = (paperInfo, segmentIndex) => {
    const paperId =
        paperInfo?.paper_id ??
        paperInfo?.doi ??
        paperInfo?.id ??
        paperInfo?.paperId ??
        "unknown";
    return `${paperId}:${segmentIndex}`;
  };

  const getProgressIds = (paperInfo, segmentIndex) => {
    const userId = paperInfo?.userId ?? paperInfo?.user_id ?? "anon";

    const paperId =
        paperInfo?.paper_id ??
        paperInfo?.doi ??
        paperInfo?.id ??
        paperInfo?.paperId ??
        "unknown";

    return { userId, paperId, segmentId: segmentIndex };
  };

  const flushCurrentProgress = async () => {
    const sound = soundRef.current;
    if (!sound) return;

    try {
      const status = await sound.getStatusAsync();
      if (!status?.isLoaded) return;

      const idx = activeSegmentRef.current ?? segmentIndexRef.current ?? 0;
      const progressKey = getProgressKey(paperInfoRef.current, idx);

      const pos = Number(
          status.positionMillis ?? segmentProgressRef.current[progressKey] ?? 0
      );
      segmentProgressRef.current[progressKey] = pos;

      const ids = getProgressIds(paperInfoRef.current, idx);
      await saveProgress(ids.userId, ids.paperId, ids.segmentId, pos);
    } catch {}
  };

  const detachAndStop = async () => {
    if (!soundRef.current) return;

    try {
      await soundRef.current.setOnPlaybackStatusUpdate(null);
    } catch (e) {}

    try {
      await soundRef.current.stopAsync();
    } catch (e) {}
  };

  const configureAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error("Error configuring audio:", error);
    }
  };

  useEffect(() => {
    soundRef.current = state.sound;
  }, [state.sound]);
  useEffect(() => {
    segmentsRef.current = state.audioSegments;
  }, [state.audioSegments]);
  useEffect(() => {
    isPlayingRef.current = state.isPlaying;
  }, [state.isPlaying]);
  useEffect(() => {
    segmentIndexRef.current = state.currentSegmentIndex;
  }, [state.currentSegmentIndex]);
  useEffect(() => {
    paperInfoRef.current = state.paperInfo;
  }, [state.paperInfo]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "inactive" || nextState === "background") {
        void flushCurrentProgress();
      }
    });

    return () => sub.remove();
  }, []);

  const loadAudio = async (
      segmentUrl,
      paperInfo = null,
      segmentIndex = 0,
      skipPositionReset = false
  ) => {
    try {
      activeSegmentRef.current = segmentIndex;
      segmentIndexRef.current = segmentIndex;

      paperInfoRef.current = paperInfo;
      if (paperInfo) dispatch({ type: "SET_PAPER_INFO", payload: paperInfo });

      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });
      const progressKey = getProgressKey(paperInfo, segmentIndex);

      let savedPos = segmentProgressRef.current[progressKey];
      if (savedPos == null) {
        const ids = getProgressIds(paperInfo, segmentIndex);
        savedPos = await loadProgress(ids.userId, ids.paperId, ids.segmentId);
      }
      savedPos = savedPos ?? 0;
      segmentProgressRef.current[progressKey] = savedPos;
      dispatch({ type: "SET_POSITION", payload: savedPos });

      // Clean up existing audio
      if (soundRef.current) {
        try {
          await soundRef.current.setOnPlaybackStatusUpdate(null);
        } catch (e) {}
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
          { uri: segmentUrl },
          { shouldPlay: false },
          onPlaybackStatusUpdate
      );

      await sound.setProgressUpdateIntervalAsync(250);
      await sound.setPositionAsync(savedPos);
      dispatch({ type: "SET_SOUND", payload: sound });
      soundRef.current = sound;
      dispatch({ type: "SET_LOADING", payload: false });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (!status.isLoaded) return;
    dispatch({ type: "SET_POSITION", payload: status.positionMillis });

    if (status.durationMillis != null) {
      dispatch({ type: "SET_DURATION", payload: status.durationMillis });
    }

    // save progress for the current segment
    const idx = activeSegmentRef.current;
    const progressKey = getProgressKey(paperInfoRef.current, idx);
    segmentProgressRef.current[progressKey] = status.positionMillis;

    const now = Date.now();
    if (now - lastWriteRef.current >= 1000) {
      lastWriteRef.current = now;
      const ids = getProgressIds(paperInfoRef.current, idx);
      saveProgress(ids.userId, ids.paperId, ids.segmentId, status.positionMillis);
    }

    if (status.didJustFinish) {
      handleNextSegment();
    }
  };

  const play = async () => {
    if (soundRef.current) {
      await soundRef.current.playAsync();
      dispatch({ type: "SET_PLAYING", payload: true });
    }
  };

  const pause = async () => {
    if (soundRef.current) {
      const idx = segmentIndexRef.current;

      try {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          const progressKey = getProgressKey(paperInfoRef.current, idx);
          segmentProgressRef.current[progressKey] = status.positionMillis;
          const ids = getProgressIds(paperInfoRef.current, idx);
          await saveProgress(ids.userId, ids.paperId, ids.segmentId, status.positionMillis);
        }
      } catch {}

      await soundRef.current.pauseAsync();
      dispatch({ type: "SET_PLAYING", payload: false });
    }
  };

  const togglePlayPause = async () => {
    if (state.isPlaying) {
      await pause();
    } else {
      await play();
    }
  };

  const seekTo = async (position) => {
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(position);
      dispatch({ type: "SET_POSITION", payload: position });
      const progressKey = getProgressKey(
          paperInfoRef.current,
          segmentIndexRef.current
      );
      segmentProgressRef.current[progressKey] = position;
    }
  };

  const handleNextSegment = async () => {
    try {
      const idx = segmentIndexRef.current;
      const segments = segmentsRef.current;

      if (idx < segments.length - 1) {
        // save the current segment progress before leaving
        const progressKey = getProgressKey(paperInfoRef.current, idx);
        segmentProgressRef.current[progressKey] =
            segmentProgressRef.current[progressKey] ?? state.position;

        const ids = getProgressIds(paperInfoRef.current, idx);
        saveProgress(
            ids.userId,
            ids.paperId,
            ids.segmentId,
            segmentProgressRef.current[progressKey]
        );

        const wasPlaying = isPlayingRef.current;
        const nextIndex = idx + 1;

        await detachAndStop();

        dispatch({ type: "SET_PLAYING", payload: false });
        dispatch({ type: "SET_SEGMENT_INDEX", payload: nextIndex });

        activeSegmentRef.current = nextIndex;
        segmentIndexRef.current = nextIndex;

        await loadAudio(segments[nextIndex], paperInfoRef.current, nextIndex);

        if (wasPlaying) {
          setTimeout(() => play(), 100);
        }
      } else {
        dispatch({ type: "SET_PLAYING", payload: false });
      }
    } catch (error) {
      console.error("Error in handleNextSegment:", error);
    }
  };

  const handlePreviousSegment = async () => {
    try {
      const idx = segmentIndexRef.current;
      const segments = segmentsRef.current;

      if (idx > 0) {
        const progressKey = getProgressKey(paperInfoRef.current, idx);
        segmentProgressRef.current[progressKey] = state.position;

        const ids = getProgressIds(paperInfoRef.current, idx);
        saveProgress(
            ids.userId,
            ids.paperId,
            ids.segmentId,
            segmentProgressRef.current[progressKey]
        );

        const wasPlaying = isPlayingRef.current;
        const prevIndex = idx - 1;

        await detachAndStop();

        dispatch({ type: "SET_PLAYING", payload: false });
        dispatch({ type: "SET_SEGMENT_INDEX", payload: prevIndex });

        activeSegmentRef.current = prevIndex;
        segmentIndexRef.current = prevIndex;

        await loadAudio(segments[prevIndex], paperInfoRef.current, prevIndex);

        if (wasPlaying) {
          setTimeout(() => play(), 100);
        }
      }
    } catch (error) {
      console.error("Error in handlePreviousSegment:", error);
    }
  };

  const setAudioSegments = (segments, paperInfo = null, preserveSegmentIndex = false) => {
    dispatch({ type: "SET_AUDIO_SEGMENTS", payload: segments });

    // Only reset segment index if not preserving it (i.e., loading a new paper)
    if (!preserveSegmentIndex) {
      dispatch({ type: "SET_SEGMENT_INDEX", payload: 0 });
    }

    if (paperInfo) {
      dispatch({ type: "SET_PAPER_INFO", payload: paperInfo });
    }

    if (segments.length > 0) {
      const segmentIndexToLoad = preserveSegmentIndex ? state.currentSegmentIndex : 0;
      const validIndex = Math.min(segmentIndexToLoad, segments.length - 1);
      loadAudio(segments[validIndex], paperInfo, validIndex);
    }
  };

  const stop = async () => {
    await flushCurrentProgress();
    await detachAndStop();

    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch (e) {}
      soundRef.current = null;
    }
    dispatch({ type: "RESET" });
  };

  useEffect(() => {
    configureAudio();

    return () => {
      void flushCurrentProgress();
      if (state.sound) {
        state.sound.unloadAsync();
      }
    };
  }, []);

  const value = {
    ...state,
    play,
    pause,
    togglePlayPause,
    seekTo,
    loadAudio,
    setAudioSegments,
    handleNextSegment,
    handlePreviousSegment,
    stop,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
};