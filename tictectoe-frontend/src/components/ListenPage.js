import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions
} from "react-native";
import Slider from "@react-native-community/slider";
import { Audio } from "expo-av";
import axios from "axios";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { BASE_URL } from "../../api";
import { FontAwesome } from "@expo/vector-icons";

const { width } = Dimensions.get('window');

const ListenPage = ({ route }) => {
  const [doi, setDoi] = useState(null);
  useEffect(() => {
    const getDoi = async () => {
      const storedDoi = await AsyncStorage.getItem("listenDoi");
      setDoi(storedDoi);
    };
    getDoi();
  }, []);
  const [audioSegments, setAudioSegments] = useState([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigation = useNavigation();

  const fetchAudioSegments = async (doi) => {
    if (!doi) {
      console.error("DOI not found");
      return { segments: [], status: "error" };
    }

    try {
      console.log("Fetching audio segments for DOI:", doi);
      const response = await axios.post(`${BASE_URL}/api/paper/audio`, { doi });
      console.log("Raw API response:", response.data);

      if (response.data) {
        return {
          segments: response.data.segments || [],
          status: response.data.status || "completed",
          progress: response.data.progress || 0,
          total: response.data.total || 0
        };
      }
      throw new Error("Invalid response");
    } catch (error) {
      console.error("Error fetching audio segments:", error);
      return { segments: [], status: "error" };
    }
  };

  const pollForNewSegments = async (doi) => {
    try {
      console.log("Polling for new segments...");
      const encodedDoi = encodeURIComponent(doi);
      const response = await axios.get(`${BASE_URL}/api/paper/audio-status/${encodedDoi}`);
      console.log("Poll response:", response.data);
      return {
        segments: response.data.segments || [],
        status: response.data.status || "completed",
        progress: response.data.progress || 0,
        total: response.data.total || 0
      };
    } catch (error) {
      console.error("Error polling for segments:", error);
      return null;
    }
  };

  const retryFetchAudioSegments = async (doi, retries = 3, delay = 5000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const segments = await fetchAudioSegments(doi);
        if (segments && segments.length > 0) {
          return segments;
        }
        throw new Error("No segments available");
      } catch (error) {
        if (attempt === retries) {
          console.error("Failed to fetch audio segments after retries:", error);
          setIsLoading(false);
          return [];
        }
        console.log(`Retrying fetch... (${attempt}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    return [];
  };

  const configureAudioMode = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true
      });
    } catch (error) {
      console.error("Error configuring audio mode:", error);
    }
  };

  const handleNextSegment = async () => {
    console.log("Next button pressed:", {
      currentSegmentIndex,
      audioSegmentsLength: audioSegments.length,
      canGoNext: currentSegmentIndex < audioSegments.length - 1
    });
    
    if (currentSegmentIndex < audioSegments.length - 1) {
      const nextIndex = currentSegmentIndex + 1;
      console.log("Moving to next segment:", nextIndex);
      setCurrentSegmentIndex(nextIndex);
      setIsPlaying(false);
    } else {
      console.log("Already at last segment");
      Alert.alert("End of Audio", "No more segments to play.");
    }
  };

  const loadAudioSegment = async (segmentUrl) => {
    try {
      setIsLoading(true);
      console.log("Loading segment URL:", segmentUrl);
      console.log("Current segment index:", currentSegmentIndex);

      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: segmentUrl },
        { shouldPlay: false }
      );

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPositionMillis(status.positionMillis);
          setDurationMillis(status.durationMillis);
        }
        if (
          status.didJustFinish &&
          currentSegmentIndex < audioSegments.length - 1
        ) {
          handleNextSegment();
        }
      });

      setSound(newSound);
      setPositionMillis(0);
      setDurationMillis(0);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading audio segment:", error);
      Alert.alert(
        "Error Loading Audio",
        "Failed to load audio segment. Please try again later."
      );
      setIsLoading(false);
    }
  };

  const togglePlayPause = async () => {
    if (!sound) return;

    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  const handlePreviousSegment = async () => {
    if (currentSegmentIndex > 0) {
      const previousIndex = currentSegmentIndex - 1;
      setCurrentSegmentIndex(previousIndex);
      setIsPlaying(false);
    }
  };

  const skipBackward = async () => {
    if (sound) {
      const newPosition = Math.max(positionMillis - 10000, 0);
      await sound.setPositionAsync(newPosition);
      setPositionMillis(newPosition);
    }
  };

  const skipForward = async () => {
    if (sound) {
      const newPosition = Math.min(positionMillis + 10000, durationMillis);
      await sound.setPositionAsync(newPosition);
      setPositionMillis(newPosition);
    }
  };

  const onSliderValueChange = async (value) => {
    if (sound) {
      await sound.setPositionAsync(value);
      setPositionMillis(value);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    if (!doi) {
      console.log("No DOI, skipping initialization");
      return;
    }

    let pollInterval = null;
    let mounted = true;

    const initializeAudio = async () => {
      await configureAudioMode();
      console.log("🎵 Starting audio initialization for DOI:", doi);
      try {
        const result = await fetchAudioSegments(doi);
        console.log("🎵 Initial fetch result:", result);

        if (!mounted) return;

        if (result.segments && result.segments.length > 0) {
          console.log("🎵 Found existing segments:", result.segments.length);
          setIsLoading(false);
          setAudioSegments(result.segments);
          if (result.segments[0]) {
            await loadAudioSegment(result.segments[0]);
          }
        } else if (result.status === "generating") {
          console.log("🎵 No segments yet, but generation in progress");
          setIsLoading(true);
          startPolling();
        } else {
          console.log("🎵 No segments and no generation");
          setIsLoading(false);
          Alert.alert("No Audio", "No audio segments available for this paper.");
        }
      } catch (error) {
        console.error("🎵 Error initializing audio:", error);
        if (mounted) {
          setIsLoading(false);
          Alert.alert("Error", "Failed to fetch audio segments.");
        }
      }
    };

    const startPolling = () => {
      console.log("🔄 Starting polling interval...");
      pollInterval = setInterval(async () => {
        if (!mounted) return;

        try {
          const status = await pollForNewSegments(doi);
          console.log("🔄 Poll result:", status);

          if (!mounted || !status) return;

          if (status.segments && status.segments.length > audioSegments.length) {
            const newSegments = status.segments;
            setAudioSegments(newSegments);

            // If this is the first segment and we haven't started playing yet
            if (audioSegments.length === 0 && newSegments.length > 0) {
              await loadAudioSegment(newSegments[0]);
              setIsLoading(false);
            }
          }

          if (status.status === "completed") {
            console.log("🔄 Generation completed, stopping polling");
            clearInterval(pollInterval);
            if (mounted) setIsLoading(false);
          }
        } catch (error) {
          console.error("🔄 Polling error:", error);
        }
      }, 2000); // Poll every 2 seconds
    };

    initializeAudio();

    return () => {
      console.log("🧹 Cleaning up");
      mounted = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [doi]);

  useEffect(() => {
    console.log("Segment change effect triggered:", {
      currentSegmentIndex,
      audioSegmentsLength: audioSegments.length,
      hasSegment: audioSegments[currentSegmentIndex]
    });

    if (audioSegments[currentSegmentIndex]) {
      loadAudioSegment(audioSegments[currentSegmentIndex]);
    } else {
      console.log("No segment found at index:", currentSegmentIndex);
    }
  }, [currentSegmentIndex]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        if (sound) {
          sound.stopAsync();
          sound.unloadAsync();
        }
      };
    }, [sound])
  );

  return (
    <View style={[styles.mainContainer, { backgroundColor: isDarkMode ? "#121212" : "#FFFFFF" }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <FontAwesome name="arrow-left" size={24} color={isDarkMode ? "#1DB954" : "#1DB954"} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDarkMode ? "white" : "black" }]}>Now Playing</Text>
        <TouchableOpacity 
          style={styles.themeToggle} 
          onPress={toggleTheme}
        >
          <FontAwesome 
            name={isDarkMode ? "sun-o" : "moon-o"} 
            size={24} 
            color={isDarkMode ? "white" : "black"} 
          />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DB954" />
        </View>
      ) : (
        <View style={styles.playerContainer}>
          <View style={[styles.contentContainer, { backgroundColor: isDarkMode ? "#19381F" : "#E0F2F1" }]}>
            <View style={styles.artworkContainer}>
              <Image
                source={require("../../assets/music_img.jpg")}
                style={styles.artwork}
              />
            </View>

            <View style={styles.infoContainer}>
              <Text style={[styles.paperTitle, { color: isDarkMode ? "white" : "black" }]}>Paper Title</Text>
              <Text style={[styles.paperAuthor, { color: isDarkMode ? "#b3b3b3" : "#666666" }]}>Paper Author</Text>
            </View>

            <View style={styles.progressContainer}>
              <Slider
                style={styles.progressBar}
                value={positionMillis}
                maximumValue={durationMillis}
                minimumValue={0}
                onSlidingComplete={onSliderValueChange}
                minimumTrackTintColor={isDarkMode ? "#1DB954" : "#1DB954"}
                maximumTrackTintColor={isDarkMode ? "#535353" : "#CCCCCC"}
                thumbTintColor={isDarkMode ? "#1DB954" : "#1DB954"}
              />
              <View style={styles.timeContainer}>
                <Text style={[styles.timeText, { color: isDarkMode ? "#b3b3b3" : "#666666" }]}>{Math.floor(positionMillis / 1000)}s</Text>
                <Text style={[styles.timeText, { color: isDarkMode ? "#b3b3b3" : "#666666" }]}>{Math.floor(durationMillis / 1000)}s</Text>
              </View>
            </View>

            <View style={styles.controlsContainer}>
              <TouchableOpacity 
                onPress={skipBackward} 
                style={styles.controlButton}
              >
                <FontAwesome name="backward" size={24} color={isDarkMode ? "#1DB954" : "#1DB954"} />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={togglePlayPause} 
                style={styles.playPauseButton}
              >
                {isPlaying ? (
                  <FontAwesome name="pause" size={32} color="white" />
                ) : (
                  <FontAwesome name="play" size={32} color="white" />
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={skipForward} 
                style={styles.controlButton}
              >
                <FontAwesome name="forward" size={24} color={isDarkMode ? "#1DB954" : "#1DB954"} />
              </TouchableOpacity>
            </View>

            <View style={styles.segmentControls}>
              <TouchableOpacity
                disabled={currentSegmentIndex === 0}
                onPress={handlePreviousSegment}
                style={[styles.segmentButton, currentSegmentIndex === 0 && styles.disabledButton]}
              >
                <FontAwesome name="step-backward" size={20} color="white" />
                <Text style={styles.segmentButtonText}>Previous</Text>
              </TouchableOpacity>

              <Text style={[styles.segmentInfo, { color: isDarkMode ? "#b3b3b3" : "#666666" }]}>
                {currentSegmentIndex + 1} / {audioSegments.length}
              </Text>
              <Text style={[styles.segmentInfo, { color: isDarkMode ? "#b3b3b3" : "#666666", fontSize: 12 }]}>
                Debug: {currentSegmentIndex} &lt; {audioSegments.length - 1}
              </Text>

              <TouchableOpacity
                disabled={currentSegmentIndex === audioSegments.length - 1}
                onPress={handleNextSegment}
                style={[styles.segmentButton, currentSegmentIndex === audioSegments.length - 1 && styles.disabledButton]}
              >
                <Text style={styles.segmentButtonText}>Next</Text>
                <FontAwesome name="step-forward" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
    justifyContent: "space-between",
    width: "100%",
    position: "relative",
  },
  backButton: {
    padding: 10,
    position: "absolute",
    left: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  themeToggle: {
    padding: 10,
    position: "absolute",
    right: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  playerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  contentContainer: {
    width: width * 0.9,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 1,
    backgroundColor: "#19381F",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 10,
  },
  artworkContainer: {
    width: width * 0.8,
    height: width * 0.8,
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  artwork: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  infoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  paperTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  paperAuthor: {
    fontSize: 16,
    textAlign: "center",
  },
  progressContainer: {
    width: "100%",
    marginBottom: 20,
  },
  progressBar: {
    width: "100%",
    height: 40,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  controlButton: {
    padding: 15,
    marginHorizontal: 20,
  },
  playPauseButton: {
    backgroundColor: "#1DB954",
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  segmentControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
  },
  segmentButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1DB954",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 10,
  },
  disabledButton: {
    backgroundColor: "#535353",
    opacity: 0.5,
  },
  segmentButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginHorizontal: 8,
  },
  segmentInfo: {
    fontSize: 14,
  },
});

export default ListenPage;