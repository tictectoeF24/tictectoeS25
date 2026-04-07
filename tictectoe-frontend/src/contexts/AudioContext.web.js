import React, { createContext, useContext, useReducer, useEffect , useRef } from 'react';
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
  audio: null,
  paperInfo: null,
};

const audioReducer = (state, action) => {
  console.log('Audio reducer:', action.type, action.payload);
  
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_AUDIO_SEGMENTS':
      return { ...state, audioSegments: action.payload };
    case 'SET_CURRENT_TRACK':
      return { ...state, currentTrack: action.payload };
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload };
    case 'SET_POSITION':
      return { ...state, position: action.payload };
    case 'SET_DURATION':
      return { ...state, duration: action.payload };
    case 'SET_SEGMENT_INDEX':
      console.log('Setting segment index to:', action.payload);
      return { ...state, currentSegmentIndex: action.payload };
    case 'SET_AUDIO':
      return { ...state, audio: action.payload };
    case 'SET_PAPER_INFO':
      return { ...state, paperInfo: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

export const AudioProvider = ({ children }) => {
  const [state, dispatch] = useReducer(audioReducer, initialState);
  const segmentProgressRef = useRef({});  // Key format: "paperID:segmentIndex"
  const lastPersistRef = useRef({});  

  // Helper function to generate unique progress key for paper + segment
  const getProgressKey = (paperInfo, segmentIndex) => {
    const paperId = paperInfo?.doi ?? paperInfo?.paperId ?? paperInfo?.id ?? "unknown";
    return `${paperId}:${segmentIndex}`;
  };

  const getProgressIds = (paperInfo, segmentIndex) => {
    const userId = paperInfo?.userId ?? "anon";
    
    // Generate a unique paperId using multiple fallbacks
    let paperId = paperInfo?.doi ?? paperInfo?.paperId ?? paperInfo?.id;
    
    // If no ID, create composite from title + author as fallback
    if (!paperId) {
      const title = paperInfo?.title ?? "";
      const author = paperInfo?.author ?? "";
      
      if (title || author) {
        // Create a stable identifier from title and author
        paperId = `${title}|${author}`.substring(0, 100); // Limit length
        console.warn(`[TTS Progress] No paper ID provided. Using composite ID: ${paperId}`);
      } else {
        // Ultimate fallback - warn that tracking will be unreliable
        const timestamp = Math.floor(Date.now() / 1000);
        paperId = `unknown_${timestamp}`;
        console.error(`[TTS Progress] No paper ID, title, or author. Using timestamped fallback: ${paperId}. Progress tracking may be unreliable.`);
      }
    }
    
    const segmentId = segmentIndex;

    return {userId, paperId, segmentId};
  };

  useEffect(() => {
    const handler = () => {
      const ids = getProgressIds(state.paperInfo, state.currentSegmentIndex);
      saveProgress(ids.userId, ids.paperId, ids.segmentId, state.position);
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [state.paperInfo, state.currentSegmentIndex, state.position]);

  const loadAudio = async (segmentUrl, paperInfo = null, segmentIndex = 0) => {
    try {
      console.log('Loading audio segment:', segmentUrl);
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Clean up existing audio
      const prevAudio = state.audio;
      if (prevAudio) {
        prevAudio.pause();
        prevAudio.currentTime = 0;
        // Remove all event listeners
        prevAudio.removeEventListener('timeupdate', prevAudio._handleTimeUpdate);
        prevAudio.removeEventListener('ended', prevAudio._handleAudioEnded);
        prevAudio.removeEventListener('loadedmetadata', prevAudio._handleLoadedMetadata);
        prevAudio.removeEventListener('play', prevAudio._handlePlay);
        prevAudio.removeEventListener('pause', prevAudio._handlePause);
      }

      const audio = new Audio(segmentUrl);

      const progressKey = getProgressKey(paperInfo, segmentIndex);
      let savedPosition = segmentProgressRef.current[progressKey];

      if (savedPosition == null) {
        const ids = getProgressIds(paperInfo, segmentIndex);
        savedPosition = await loadProgress(ids.userId, ids.paperId, ids.segmentId);
      }

      savedPosition = savedPosition ?? 0;

      audio.currentTime = savedPosition / 1000;
      dispatch({ type: "SET_POSITION", payload: savedPosition })
      
      // Create event handler functions
      const handleTimeUpdate = () => {
        const pos = audio.currentTime * 1000;
        dispatch({ type: "SET_POSITION", payload: pos});

        segmentProgressRef.current[progressKey] = pos;

        const now = Date.now();
        const last = lastPersistRef.current[progressKey] ?? 0;

        if (now - last >= 1000) {
          lastPersistRef.current[progressKey] = now;
          const ids = getProgressIds(paperInfo, segmentIndex);
          saveProgress(ids.userId, ids.paperId, ids.segmentId, pos);
        }
      };

      const handleAudioEnded = () => {
        handleNextSegment();
      };

      const handleLoadedMetadata = () => {
        dispatch({ type: 'SET_DURATION', payload: audio.duration * 1000 });
        dispatch({ type: 'SET_LOADING', payload: false });
      };

      const handlePlay = () => {
        dispatch({ type: 'SET_PLAYING', payload: true });
      };

      const handlePause = () => {
        dispatch({ type: 'SET_PLAYING', payload: false });
      };

      // Store references to handlers on the audio object for cleanup
      audio._handleTimeUpdate = handleTimeUpdate;
      audio._handleAudioEnded = handleAudioEnded;
      audio._handleLoadedMetadata = handleLoadedMetadata;
      audio._handlePlay = handlePlay;
      audio._handlePause = handlePause;

      // Add event listeners
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleAudioEnded);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);

      dispatch({ type: 'SET_AUDIO', payload: audio });
      if (paperInfo) {
        dispatch({ type: 'SET_PAPER_INFO', payload: paperInfo });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const play = async () => {
    if (state.audio) {
      try {
        await state.audio.play();
        dispatch({ type: 'SET_PLAYING', payload: true });
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    }
  };

  const pause = async () => {
    if (state.audio) {
      state.audio.pause();
      const ids = getProgressIds(state.paperInfo, state.currentSegmentIndex);
      saveProgress(ids.userId, ids.paperId, ids.segmentId, state.position);
      dispatch({ type: 'SET_PLAYING', payload: false });
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
     if (state.audio) {
      state.audio.currentTime = position / 1000;
      dispatch({ type: 'SET_POSITION', payload: position });

      const progressKey = getProgressKey(state.paperInfo, state.currentSegmentIndex);
      segmentProgressRef.current[progressKey] = position;
      const ids = getProgressIds(state.paperInfo, state.currentSegmentIndex);
      saveProgress(ids.userId, ids.paperId, ids.segmentId, position);
    }
  };

 
  const handleNextSegment = () => {
    const currentIndex = state.currentSegmentIndex;
    const segments = state.audioSegments;

    const progressKey = getProgressKey(state.paperInfo, currentIndex);
    segmentProgressRef.current[progressKey] = state.position;
    const ids = getProgressIds(state.paperInfo, currentIndex);
    saveProgress(ids.userId, ids.paperId, ids.segmentId, state.position);
    
    if (currentIndex < segments.length - 1) {
      const nextIndex = currentIndex + 1;
      console.log('Moving to next segment:', nextIndex, 'of', segments.length);
      dispatch({ type: 'SET_SEGMENT_INDEX', payload: nextIndex });
      loadAudio(segments[nextIndex], state.paperInfo, nextIndex);
    } else {
      // End of audio
      console.log('Reached end of audio segments');
      dispatch({ type: 'SET_PLAYING', payload: false });
    }
  };

  const handlePreviousSegment = async () => {
    const currentIndex = state.currentSegmentIndex;
    const segments = state.audioSegments;

    const progressKey = getProgressKey(state.paperInfo, currentIndex);
    segmentProgressRef.current[progressKey] = state.position;
    const ids = getProgressIds(state.paperInfo, currentIndex);
    saveProgress(ids.userId, ids.paperId, ids.segmentId, state.position);
    
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      console.log('Moving to previous segment:', prevIndex, 'of', segments.length);
      dispatch({ type: 'SET_SEGMENT_INDEX', payload: prevIndex });
      loadAudio(segments[prevIndex], state.paperInfo, prevIndex);
    }
  };

  const setAudioSegments = (segments, paperInfo = null, preserveSegmentIndex = false) => {
    console.log('Setting audio segments:', segments.length, 'segments, preserveSegmentIndex:', preserveSegmentIndex);
    dispatch({ type: 'SET_AUDIO_SEGMENTS', payload: segments });
    
    // Only reset segment index if not preserving it (i.e., loading a new paper)
    if (!preserveSegmentIndex) {
      dispatch({ type: 'SET_SEGMENT_INDEX', payload: 0 });
    }
    
    if (paperInfo) {
      dispatch({ type: 'SET_PAPER_INFO', payload: paperInfo });
    }
    
    if (segments.length > 0) {
      // Use current segment index if preserving, otherwise start at 0
      const segmentIndexToLoad = preserveSegmentIndex ? state.currentSegmentIndex : 0;
      const validIndex = Math.min(segmentIndexToLoad, segments.length - 1);
      segmentIndexRef.current = validIndex;
      loadAudio(segments[validIndex], paperInfo, validIndex);
    }
  };

  const stop = async () => {
    if (state.audio) {
      state.audio.pause();
      state.audio.currentTime = 0;
      // Remove all event listeners
      state.audio.removeEventListener('timeupdate', state.audio._handleTimeUpdate);
      state.audio.removeEventListener('ended', state.audio._handleAudioEnded);
      state.audio.removeEventListener('loadedmetadata', state.audio._handleLoadedMetadata);
      state.audio.removeEventListener('play', state.audio._handlePlay);
      state.audio.removeEventListener('pause', state.audio._handlePause);
    }
    dispatch({ type: 'RESET' });
  };

  useEffect(() => {
    return () => {
      if (state.audio) {
        state.audio.pause();
        state.audio.currentTime = 0;
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

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}; 
