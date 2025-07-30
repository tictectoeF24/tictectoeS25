import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAudio } from '../contexts/AudioContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const MiniPlayer = () => {
  const {
    isPlaying,
    paperInfo,
    position,
    duration,
    togglePlayPause,
    seekTo,
    currentSegmentIndex,
    audioSegments,
  } = useAudio();
  
  const navigation = useNavigation();

  if (!paperInfo || audioSegments.length === 0) {
    return null;
  }

  const formatTime = (millis) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  const handlePress = () => {
    navigation.navigate('ListenPage', { doi: paperInfo.doi });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.progressBar} onPress={handlePress}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </TouchableOpacity>
      
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
          <TouchableOpacity style={styles.controlButton} onPress={togglePlayPause}>
            <FontAwesome 
              name={isPlaying ? 'pause' : 'play'} 
              size={20} 
              color="#1DB954" 
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  progressBar: {
    height: 2,
    backgroundColor: '#e0e0e0',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1DB954',
  },
  playerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
  },
  infoContainer: {
    flex: 1,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  author: {
    fontSize: 12,
    color: '#666',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
});

export default MiniPlayer; 