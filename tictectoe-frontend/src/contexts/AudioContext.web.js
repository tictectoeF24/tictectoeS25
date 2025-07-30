import React, { createContext, useContext, useReducer, useEffect } from 'react';

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

  const loadAudio = async (segmentUrl, paperInfo = null) => {
    try {
      console.log('Loading audio segment:', segmentUrl);
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Clean up existing audio
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

      const audio = new Audio(segmentUrl);
      
      // Create event handler functions
      const handleTimeUpdate = () => {
        dispatch({ type: 'SET_POSITION', payload: audio.currentTime * 1000 });
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
    }
  };

  const handleNextSegment = () => {
    const currentIndex = state.currentSegmentIndex;
    const segments = state.audioSegments;
    
    if (currentIndex < segments.length - 1) {
      const nextIndex = currentIndex + 1;
      console.log('Moving to next segment:', nextIndex, 'of', segments.length);
      dispatch({ type: 'SET_SEGMENT_INDEX', payload: nextIndex });
      loadAudio(segments[nextIndex]);
    } else {
      // End of audio
      console.log('Reached end of audio segments');
      dispatch({ type: 'SET_PLAYING', payload: false });
    }
  };

  const handlePreviousSegment = () => {
    const currentIndex = state.currentSegmentIndex;
    const segments = state.audioSegments;
    
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      console.log('Moving to previous segment:', prevIndex, 'of', segments.length);
      dispatch({ type: 'SET_SEGMENT_INDEX', payload: prevIndex });
      loadAudio(segments[prevIndex]);
    }
  };

  const setAudioSegments = (segments, paperInfo = null) => {
    console.log('Setting audio segments:', segments.length, 'segments');
    dispatch({ type: 'SET_AUDIO_SEGMENTS', payload: segments });
    dispatch({ type: 'SET_SEGMENT_INDEX', payload: 0 });
    if (paperInfo) {
      dispatch({ type: 'SET_PAPER_INFO', payload: paperInfo });
    }
    if (segments.length > 0) {
      loadAudio(segments[0], paperInfo);
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