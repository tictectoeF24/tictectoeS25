import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

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
      return { ...state, currentSegmentIndex: action.payload };
    case 'SET_SOUND':
      return { ...state, sound: action.payload };
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

  const configureAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Error configuring audio:', error);
    }
  };

  const loadAudio = async (segmentUrl, paperInfo = null) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Clean up existing audio
      if (state.sound) {
        await state.sound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: segmentUrl },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );

      dispatch({ type: 'SET_SOUND', payload: sound });
      if (paperInfo) {
        dispatch({ type: 'SET_PAPER_INFO', payload: paperInfo });
      }
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      dispatch({ type: 'SET_POSITION', payload: status.positionMillis });
      dispatch({ type: 'SET_DURATION', payload: status.durationMillis });
      
      if (status.didJustFinish) {
        handleNextSegment();
      }
    }
  };

  const play = async () => {
    if (state.sound) {
      await state.sound.playAsync();
      dispatch({ type: 'SET_PLAYING', payload: true });
    }
  };

  const pause = async () => {
    if (state.sound) {
      await state.sound.pauseAsync();
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
    if (state.sound) {
      await state.sound.setPositionAsync(position);
    }
  };

  const handleNextSegment = () => {
    if (state.currentSegmentIndex < state.audioSegments.length - 1) {
      const nextIndex = state.currentSegmentIndex + 1;
      dispatch({ type: 'SET_SEGMENT_INDEX', payload: nextIndex });
      loadAudio(state.audioSegments[nextIndex]);
    } else {
      // End of audio
      dispatch({ type: 'SET_PLAYING', payload: false });
    }
  };

  const handlePreviousSegment = () => {
    if (state.currentSegmentIndex > 0) {
      const prevIndex = state.currentSegmentIndex - 1;
      dispatch({ type: 'SET_SEGMENT_INDEX', payload: prevIndex });
      loadAudio(state.audioSegments[prevIndex]);
    }
  };

  const setAudioSegments = (segments, paperInfo = null) => {
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
    if (state.sound) {
      await state.sound.stopAsync();
      await state.sound.unloadAsync();
    }
    dispatch({ type: 'RESET' });
  };

  useEffect(() => {
    configureAudio();
    
    return () => {
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