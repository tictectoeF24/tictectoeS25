import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAudio } from '../contexts/AudioContext.web';
import { useNavigation } from '@react-navigation/native';

const MiniPlayer = () => {
  const {
    isPlaying,
    paperInfo,
    position: audioPosition,
    duration,
    togglePlayPause,
    seekTo,
    currentSegmentIndex,
    audioSegments,
    handleNextSegment,
    handlePreviousSegment,
  } = useAudio();
  
  const navigation = useNavigation();
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 80 });
  const playerRef = useRef(null);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // Early return after all hooks
  if (!paperInfo || audioSegments.length === 0) {
    return null;
  }

  const formatTime = (millis) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const progress = duration > 0 ? (audioPosition / duration) * 100 : 0;

  const handlePress = () => {
    localStorage.setItem("listenDoi", paperInfo.doi);
    navigation.navigate('ListenPage');
  };

  const handleProgressClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newPosition = percentage * duration;
    seekTo(newPosition);
  };

  // Dragging functionality
  const handleMouseDown = (e) => {
    // Don't drag if clicking on controls or progress bar
    const target = e.target;
    if (target.closest('[data-control]') || target.closest('[data-progress]')) {
      return;
    }
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = Math.max(0, Math.min(window.innerWidth - 300, e.clientX - 150));
    const newY = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - 30));
    
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <View 
      ref={playerRef}
      style={[
        styles.container, 
        { 
          left: position.x, 
          top: position.y,
          cursor: isDragging ? 'grabbing' : 'grab'
        }
      ]}
      onMouseDown={handleMouseDown}
    >
      <View style={styles.progressBar} onPress={handleProgressClick} data-progress="true">
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      
      <View style={styles.playerContainer}>
        <TouchableOpacity style={styles.infoContainer} onPress={handlePress}>
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {paperInfo.title || 'Paper Title'}
            </Text>
            <Text style={styles.author} numberOfLines={1}>
              {paperInfo.author || 'Author'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={[styles.controlButton, styles.segmentButton]} 
            onPress={handlePreviousSegment}
            disabled={currentSegmentIndex === 0}
            data-control="true"
          >
            <FontAwesome 
              name="step-backward" 
              size={14} 
              color={currentSegmentIndex === 0 ? "#ccc" : "#1DB954"} 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlButton, styles.playButton]} 
            onPress={togglePlayPause}
            data-control="true"
          >
            <FontAwesome 
              name={isPlaying ? 'pause' : 'play'} 
              size={16} 
              color="#1DB954" 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlButton, styles.segmentButton]} 
            onPress={handleNextSegment}
            disabled={currentSegmentIndex >= audioSegments.length - 1}
            data-control="true"
          >
            <FontAwesome 
              name="step-forward" 
              size={14} 
              color={currentSegmentIndex >= audioSegments.length - 1 ? "#ccc" : "#1DB954"} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.segmentInfo}>
          <Text style={styles.segmentText}>
            {currentSegmentIndex + 1} / {audioSegments.length}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'fixed',
    width: 280,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 1000,
    userSelect: 'none',
  },
  progressBar: {
    height: 2,
    backgroundColor: '#e0e0e0',
    cursor: 'pointer',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1DB954',
    transition: 'width 0.1s ease',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  playerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 48,
  },
  infoContainer: {
    flex: 1,
    marginRight: 8,
    cursor: 'pointer',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 1,
  },
  author: {
    fontSize: 10,
    color: '#666',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  controlButton: {
    padding: 6,
    borderRadius: 4,
    marginHorizontal: 2,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  playButton: {
    backgroundColor: '#f5f5f5',
  },
  segmentButton: {
    backgroundColor: 'transparent',
  },
  segmentInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 30,
  },
  segmentText: {
    fontSize: 10,
    color: '#999',
    fontWeight: '500',
  },
});

export default MiniPlayer; 