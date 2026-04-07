import React, { useState, useEffect, useRef } from "react";
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
  const prevDoiRef = useRef(null);  // Track previous DOI to detect paper changes
 
  const [paperTitle, setPaperTitle] = useState("");
  const [paperAuthor, setPaperAuthor] = useState("");

  const [transcriptSections, setTranscriptSections] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});

  //Helper function which toggles the collapsed/expanded state of each transcript
  const toggleSection = (id) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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
    pause,
  } = useAudio();
 // Add this hook to handle page reload when focused
  useFocusEffect(
    React.useCallback(() => {
   // This runs when the screen comes into focus
      console.log("Screen focused - reloading page data");
      setIsLoading(true);
      setDoi(null);
  // Fetch fresh DOI from localStorage
      const storedDoi = localStorage.getItem("listenDoi");
      setDoi(storedDoi);
    }, [])
  );

  useEffect(() => {
    const storedDoi = localStorage.getItem("listenDoi");
    setDoi(storedDoi);
  }, []);

  useEffect(() => {
    setIsLoading(!doi);
  }, [doi]);

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
          total: response.data.total || 0,
        
          title: response.data.title || "",
          author: response.data.author || "",
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
        total: response.data.total || 0,
       
        title: response.data.title || "",
        author: response.data.author || "",
      };
    } catch (error) {
      console.error("Error polling for segments:", error);
      return null;
    }
  };

  
  const fetchTranscript = async (doi) => {
    try{
      const encodedDoi = encodeURIComponent(doi);
      const response = await axios.get(
        `${BASE_URL}/api/paper/tts-transcript/${encodedDoi}`
      );
      if(response.data && response.data.sections){
        setTranscriptSections(response.data.sections);
      }
    } catch(error){
      console.error("Error fetching transcript", error);
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
        await fetchTranscript(doi);
        console.log("🎵 Initial fetch result:", result);

        if (!mounted) return;

        
        if (result.title) setPaperTitle(result.title);
        if (result.author) setPaperAuthor(result.author);

        if (result.segments && result.segments.length > 0) {
          console.log("🎵 Found existing segments:", result.segments.length);
          setIsLoading(false);
          
          // Preserve segment index if returning to the same paper
          const isSamePaper = prevDoiRef.current === doi;
          const paperInfo = {
            doi: doi,
            title: result.title || "Paper Title",
            author: result.author || "Paper Author",
            userId: localStorage.getItem("userId") || undefined,  // Include userId if available
          };
          setAudioSegments(result.segments, paperInfo, isSamePaper);
          prevDoiRef.current = doi;  // Update previous DOI
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

          // 🆕 Update title and author during polling too
          if (status.title) setPaperTitle(status.title);
          if (status.author) setPaperAuthor(status.author);

          if (status.segments) {
            const newSegments = status.segments;
            if (newSegments.length > 0) {
              const isSamePaper = prevDoiRef.current === doi;
              const paperInfo = {
                doi: doi,
                title: status.title || "Paper Title",
                author: status.author || "Paper Author",
                userId: localStorage.getItem("userId") || undefined,
              };
              setAudioSegments(newSegments, paperInfo, isSamePaper);
              prevDoiRef.current = doi;  // Update previous DOI
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
    <View style={[styles.mainContainer, { backgroundColor: isDarkMode ? "#121212" : "#FFFFFF" }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("Explore")}
        >
          <FontAwesome name="arrow-left" size={24} color="#1DB954" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDarkMode ? "white" : "black" }]}>Now Playing</Text>
        <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
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
          <Text style={[styles.loadingText, { color: isDarkMode ? "white" : "black" }]}>
            Generating audio... ({audioSegments.length} segments ready)
          </Text>
        </View>
      ) : (
        <View style={styles.playerContainer}>
          <View style={styles.blurBackground} />
          <View style={styles.contentContainer}>

            {/* 🆕 Dynamic Title and Author */}
            <View style={styles.infoContainer}>
              <Text style={[styles.paperTitle, { color: isDarkMode ? "white" : "black" }]}>
                {audioSegments.length > 0 ? paperTitle || "Untitled Paper" : "No Audio Available"}
              </Text>
              <Text style={[styles.paperAuthor, { color: isDarkMode ? "#b3b3b3" : "#666666" }]}>
                {paperAuthor || "Unknown Author"}
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
                <Text style={[styles.timeText, { color: isDarkMode ? "#b3b3b3" : "#666666" }]}>
                  {Math.floor(position / 1000)}s
                </Text>
                <Text style={[styles.timeText, { color: isDarkMode ? "#b3b3b3" : "#666666" }]}>
                  {Math.floor(duration / 1000)}s
                </Text>
              </View>
            </View>

            <View style={styles.controlsContainer}>
              <TouchableOpacity
                onPress={skipBackward}
                style={[styles.controlButton, { opacity: audioSegments.length > 0 ? 1 : 0.5 }]}
                disabled={audioSegments.length === 0}
              >
                <FontAwesome name="backward" size={24} color="#1DB954" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={togglePlayPause}
                style={[styles.playPauseButton, { opacity: audioSegments.length > 0 ? 1 : 0.5 }]}
                disabled={audioSegments.length === 0}
              >
                {isPlaying ? (
                  <FontAwesome name="pause" size={32} color="white" />
                ) : (
                  <FontAwesome name="play" size={32} color="white" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={skipForward}
                style={[styles.controlButton, { opacity: audioSegments.length > 0 ? 1 : 0.5 }]}
                disabled={audioSegments.length === 0}
              >
                <FontAwesome name="forward" size={24} color="#1DB954" />
              </TouchableOpacity>
            </View>

              <View style={styles.segmentControls}>
                <TouchableOpacity
                    disabled={currentSegmentIndex === 0}
                    onPress={async () => {
                      // Pause and reset current audio position to start, then switch segment
                      try {
                        await pause();
                      } catch (e) {
                        console.warn('pause failed before previous segment:', e);
                      }

                      try {
                        seekTo(0);
                      } catch (e) {
                        console.warn('seekTo failed before previous segment:', e);
                      }

                      handlePreviousSegment();
                    }}
                    style={[styles.segmentButton, currentSegmentIndex === 0 && styles.disabledButton]}
                >
                  <FontAwesome name="step-backward" size={20} color="white"/>
                  <Text style={styles.segmentButtonText}>Previous</Text>
                </TouchableOpacity>

              <Text style={[styles.segmentInfo, { color: isDarkMode ? "#b3b3b3" : "#666666" }]}>
                {audioSegments.length > 0 ? `${currentSegmentIndex + 1} / ${audioSegments.length}` : "0 / 0"}
              </Text>

                <TouchableOpacity
                    disabled={currentSegmentIndex >= audioSegments.length - 1}
                    onPress={async () => {
                      // Pause and reset current audio position to start, then switch segment
                      try {
                        await pause();
                      } catch (e) {
                        console.warn('pause failed before next segment:', e);
                      }

                      try {
                        seekTo(0);
                      } catch (e) {
                        console.warn('seekTo failed before next segment:', e);
                      }

                      handleNextSegment();
                    }}
                    style={[styles.segmentButton, currentSegmentIndex >= audioSegments.length - 1 && styles.disabledButton]}
                >
                  <Text style={styles.segmentButtonText}>Next</Text>
                  <FontAwesome name="step-forward" size={20} color="white"/>
                </TouchableOpacity>
              </View>
            </View>

          <View style={styles.transcriptContainer}>
            {transcriptSections.map((section) => (
                <View key={section.id} style={styles.transcriptSection}>
                  <TouchableOpacity
                      onPress={() => toggleSection(section.id)}
                      style={styles.transcriptHeader}
                  >
                    <Text style={[styles.transcriptHeaderText, { color: isDarkMode ? "#FFFFFF" : "#000000" }]}>
                      {section.title}
                    </Text>
                    <FontAwesome
                        name={expandedSections[section.id] ? "chevron-up" : "chevron-down"}
                        size={16}
                        color="black"
                    />
                  </TouchableOpacity>
                  {expandedSections[section.id] && (
                      <View style={styles.transcriptContent}>
                        <Text style={[styles.transcriptText, { color: isDarkMode ? "#FFFFFF" : "#000000" }]}>
                          {section.summary}
                        </Text>
                      </View>
                  )}
                </View>
            ))}
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
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 20,
  },
  playerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    position: "relative",
  },

  contentContainer: {
    width: "90%",
    maxWidth: 600,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 1,
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
    maxWidth: 600,
    marginBottom: 20,
  },
  progressBar: {
    width: "100%",
    height: 4,
    backgroundColor: "#535353",
    borderRadius: 2,
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
    position: "absolute",
    right: 20,
    padding: 10,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 20,
    textAlign: "center",
  },

  transcriptContainer: {
  width: "100%",
  maxWidth: 600,
  marginBottom: 30,
},

transcriptSection: {
  marginBottom: 10,
  borderRadius: 10,
  overflow: "hidden",
},

transcriptHeader: {
  backgroundColor: "#1DB954",
  padding: 12,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  borderRadius: 10,
},

transcriptHeaderText: {
  color: "black",
  fontSize: 16,
  fontWeight: "600",
},

transcriptContent: {
  backgroundColor: "rgba(255,255,255,0.08)",
  padding: 12,
},

transcriptText: {
  fontSize: 14,
  lineHeight: 20,
  color: "black",
},
});

export default ListenPage;
