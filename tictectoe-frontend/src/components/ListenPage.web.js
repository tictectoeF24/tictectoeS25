import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from "react-native";
import axios from "axios";
import { BASE_URL } from "../../api";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import { useAudio } from "../contexts/AudioContext.web";

const ListenPage = ({ route }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [doi, setDoi] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigation = useNavigation();
  
  const {
    isPlaying,
    audioSegments,
    currentSegmentIndex,
    position,
    duration,
    togglePlayPause,
    seekTo,
    handleNextSegment,
    handlePreviousSegment,
    setAudioSegments,
  } = useAudio();

  // Add this hook to handle page reload when focused
  useFocusEffect(
    React.useCallback(() => {
      // This runs when the screen comes into focus
      console.log("Screen focused - reloading page data");
      
      // Reset states
      setIsLoading(true);
      setDoi(null);
      
      // Fetch fresh DOI from localStorage
      const storedDoi = localStorage.getItem("listenDoi");
      setDoi(storedDoi);
      
      // You could also force a complete reload by calling window.location.reload()
      // But that would be more disruptive to the user experience
      
    }, [])
  );

  useEffect(() => {
    const fetchDoi = () => {
      const storedDoi = localStorage.getItem("listenDoi");
      setDoi(storedDoi);
    };

    fetchDoi();
  }, []);

  useEffect(() => {
    setIsLoading(!doi);
  }, [doi]);

  const fetchAudioSegments = async (doi) => {
    if (!doi) {
      console.error("DOI not found");
      return {segments: [], status: "error"};
    }

    try {
      console.log("Fetching audio segments for DOI:", doi);
      const response = await axios.post(`${BASE_URL}/api/paper/audio`, {doi});
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
      return {segments: [], status: "error"};
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

  const skipForward = () => {
    const newPosition = Math.min(position + 10000, duration);
    seekTo(newPosition);
  };

  const skipBackward = () => {
    const newPosition = Math.max(position - 10000, 0);
    seekTo(newPosition);
  };

  const onSliderValueChange = (value) => {
    seekTo(value * 1000);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    console.log("Main useEffect triggered, DOI:", doi);

    if (!doi) {
      console.log("No DOI, skipping initialization");
      return;
    }

    let pollInterval = null;
    let mounted = true;

    const initializeAudio = async () => {
      console.log("🎵 Starting audio initialization for DOI:", doi);
      try {
        const result = await fetchAudioSegments(doi);
        console.log("🎵 Initial fetch result:", result);

        if (!mounted) return;

        if (result.segments && result.segments.length > 0) {
          console.log("🎵 Found existing segments:", result.segments.length);
          setIsLoading(false);
          setAudioSegments(result.segments, {
            doi: doi,
            title: result.title || "Paper Title",
            author: "Paper Author"
          });
        } else if (result.status === "generating") {
          console.log("🎵 No segments yet, but generation in progress");
          setIsLoading(true);
          startPolling();
        } else {
          console.log("🎵 No segments and no generation");
          setIsLoading(false);
        }

        if (result.status === "generating" && result.segments.length === 0) {
          startPolling();
        }
      } catch (error) {
        console.error("🎵 Error initializing audio:", error);
        if (mounted) {
          setIsLoading(false);
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

          if (status.segments) {
            const newSegments = status.segments;

            if (newSegments.length > 0) {
              setAudioSegments(newSegments, {
                doi: doi,
                title: status.title || "Paper Title",
                author: "Paper Author"
              });
              setIsLoading(false);
            }

            if (status.status === "completed") {
              console.log("🔄 Generation completed, stopping polling");
              clearInterval(pollInterval);
              if (mounted) setIsLoading(false);
            }
          }
        } catch (error) {
          console.error("🔄 Polling error:", error);
        }
      }, 1000);
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

  return (
      <View style={[styles.mainContainer, {backgroundColor: isDarkMode ? "#121212" : "#FFFFFF"}]}>
        <View style={styles.header}>
          <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate("Explore")}
          >
            <FontAwesome name="arrow-left" size={24} color="#1DB954"/>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: isDarkMode ? "white" : "black"}]}>Now Playing</Text>
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
            <Text style={[styles.loadingText, {color: isDarkMode ? "white" : "black"}]}>
              Generating audio... ({audioSegments.length} segments ready)
            </Text>
          </View>
        ) : (
          <View style={styles.playerContainer}>
            <View style={styles.blurBackground}/>
            <View style={styles.contentContainer}>
              <View style={styles.artworkContainer}>
                <Image
                    source={require("../../assets/music_img.jpg")}
                    style={styles.artwork}
                />
              </View>

              <View style={styles.infoContainer}>
                <Text style={[styles.paperTitle, {color: isDarkMode ? "white" : "black"}]}>
                  {audioSegments.length > 0 ? "Paper Title" : "No Audio Available"}
                </Text>
                <Text style={[styles.paperAuthor, {color: isDarkMode ? "#b3b3b3" : "#666666"}]}>
                  Paper Author
                </Text>
              </View>

              <View style={styles.progressContainer}>
                <input
                    type="range"
                    min={0}
                    max={duration / 1000}
                    value={position / 1000}
                    onChange={(e) => onSliderValueChange(e.target.value)}
                    style={styles.progressBar}
                    disabled={audioSegments.length === 0}
                />
                <View style={styles.timeContainer}>
                  <Text
                      style={[styles.timeText, {color: isDarkMode ? "#b3b3b3" : "#666666"}]}>
                    {Math.floor(position / 1000)}s
                  </Text>
                  <Text
                      style={[styles.timeText, {color: isDarkMode ? "#b3b3b3" : "#666666"}]}>
                    {Math.floor(duration / 1000)}s
                  </Text>
                </View>
              </View>

              <View style={styles.controlsContainer}>
                <TouchableOpacity
                    onPress={skipBackward}
                    style={[styles.controlButton, {opacity: audioSegments.length > 0 ? 1 : 0.5}]}
                    disabled={audioSegments.length === 0}
                >
                  <FontAwesome name="backward" size={24} color="#1DB954"/>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={togglePlayPause}
                    style={[styles.playPauseButton, {opacity: audioSegments.length > 0 ? 1 : 0.5}]}
                    disabled={audioSegments.length === 0}
                >
                  {isPlaying ? (
                      <FontAwesome name="pause" size={32} color="white"/>
                  ) : (
                      <FontAwesome name="play" size={32} color="white"/>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={skipForward}
                    style={[styles.controlButton, {opacity: audioSegments.length > 0 ? 1 : 0.5}]}
                    disabled={audioSegments.length === 0}
                >
                  <FontAwesome name="forward" size={24} color="#1DB954"/>
                </TouchableOpacity>
              </View>

              <View style={styles.segmentControls}>
                <TouchableOpacity
                    disabled={currentSegmentIndex === 0}
                    onPress={handlePreviousSegment}
                    style={[styles.segmentButton, currentSegmentIndex === 0 && styles.disabledButton]}
                >
                  <FontAwesome name="step-backward" size={20} color="white"/>
                  <Text style={styles.segmentButtonText}>Previous</Text>
                </TouchableOpacity>

                <Text style={[styles.segmentInfo, {color: isDarkMode ? "#b3b3b3" : "#666666"}]}>
                  {audioSegments.length > 0 ? `${currentSegmentIndex + 1} / ${audioSegments.length}` : "0 / 0"}
                </Text>

                <TouchableOpacity
                    disabled={currentSegmentIndex >= audioSegments.length - 1}
                    onPress={handleNextSegment}
                    style={[styles.segmentButton, currentSegmentIndex >= audioSegments.length - 1 && styles.disabledButton]}
                >
                  <Text style={styles.segmentButtonText}>Next</Text>
                  <FontAwesome name="step-forward" size={20} color="white"/>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: 20,
  },
    statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    justifyContent: "center",
  },
  statusText: {
    fontSize: 14,
    marginLeft: 8,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 20,
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
    padding: 20,
    position: "relative",
  },
  blurBackground: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "90%",
    maxWidth: 1000,
    height: "auto",
    minHeight: 700,
    backgroundColor: "rgba(39, 187, 91, 0.32)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  contentContainer: {
    width: "90%",
    maxWidth: 600,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 1,
  },
  artworkContainer: {
    width: 300,
    height: 300,
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
    color: "#767676",
    marginBottom: 8,
    textAlign: "center",
  },
  paperAuthor: {
    fontSize: 16,
    color: "#767676",
    textAlign: "center",
  },
  progressContainer: {
    width: "100%",
    maxWidth: 600,
    marginBottom: 20,
  },
  progressBar: {
    width: "100%",
    height: 4,
    backgroundColor: "#535353",
    borderRadius: 2,
    outline: "none",
    WebkitAppearance: "none",
    "&::-webkit-slider-thumb": {
      WebkitAppearance: "none",
      width: 12,
      height: 12,
      backgroundColor: "#1DB954",
      borderRadius: "50%",
      cursor: "pointer",
    },
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
    justifyContent: "center",
    width: "100%",
    maxWidth: 400,
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
    color: "#b3b3b3",
    fontSize: 14,
    marginHorizontal: 20,
  },
  themeToggle: {
    position: 'absolute',
    right: 20,
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 20,
    textAlign: "center",
  },
});

export default ListenPage;