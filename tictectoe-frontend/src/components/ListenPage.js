import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  ScrollView,
} from "react-native";
import Slider from "@react-native-community/slider";
import axios from "axios";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { BASE_URL } from "../../api";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudio } from "../contexts/AudioContext";

const { width } = Dimensions.get("window");

const ListenPage = ({ route }) => {
  const [paperTitle, setPaperTitle] = useState("");
  const [paperAuthor, setPaperAuthor] = useState("");
  const [doi, setDoi] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [transcriptSections, setTranscriptSections] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});

  const pollIntervalRef = useRef(null);
  const mountedRef = useRef(false);
  const audioSegmentsLenRef = useRef(0);
  const prevDoiRef = useRef(null);

  const navigation = useNavigation();

  const {
    audioSegments,
    currentSegmentIndex,
    isPlaying,
    position,
    duration,
    togglePlayPause,
    seekTo,
    handleNextSegment,
    handlePreviousSegment,
    setAudioSegments,
    pause,
  } = useAudio();

  useEffect(() => {
    const getDoi = async () => {
      const storedDoi = await AsyncStorage.getItem("listenDoi");
      setDoi(storedDoi);
    };
    getDoi();
  }, []);

  const toggleSection = (id) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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
    try {
      const encodedDoi = encodeURIComponent(doi);
      const response = await axios.get(`${BASE_URL}/api/paper/tts-transcript/${encodedDoi}`);

      if (response.data && response.data.sections) {
        setTranscriptSections(response.data.sections);
      } else {
        setTranscriptSections([]);
      }
    } catch (error) {
      console.error("Error fetching transcript:", error);
      setTranscriptSections([]);
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

  const skipBackward = async () => {
    const newPos = Math.max(position - 10000, 0);
    await seekTo(newPos);
  };

  const skipForward = async () => {
    const newPos = Math.min(position + 10000, duration);
    await seekTo(newPos);
  };

  const onSliderValueChange = async (value) => {
    await seekTo(value);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    audioSegmentsLenRef.current = audioSegments.length;
  }, [audioSegments.length]);

  useFocusEffect(
      useCallback(() => {
        if (!doi) return;

        mountedRef.current = true;

        const stopPolling = () => {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        };

        const startPolling = () => {
          stopPolling();

          pollIntervalRef.current = setInterval(async () => {
            if (!mountedRef.current) return;

            const status = await pollForNewSegments(doi);
            if (!status) return;

            if (status.title) setPaperTitle(status.title);
            if (status.author) setPaperAuthor(status.author);

            if (status.segments?.length > audioSegmentsLenRef.current) {
              const isSamePaper = prevDoiRef.current === doi;
              const paperInfo = {
                doi: doi,
                userId: undefined,
              };
              setAudioSegments(status.segments, paperInfo, isSamePaper);
              prevDoiRef.current = doi;
              setIsLoading(false);
            }

            if (status.status === "completed") {
              stopPolling();
              if (mountedRef.current) setIsLoading(false);
            }
          }, 2000);
        };

        const initialize = async () => {
          setIsLoading(true);
          stopPolling();

          const result = await fetchAudioSegments(doi);
          await fetchTranscript(doi);

          if (!mountedRef.current) return;

          if (result.title) setPaperTitle(result.title);
          if (result.author) setPaperAuthor(result.author);

          if (result.segments?.length > 0) {
            const isSamePaper = prevDoiRef.current === doi;
            const paperInfo = {
              doi: doi,
              userId: undefined,
            };
            setAudioSegments(result.segments, paperInfo, isSamePaper);
            prevDoiRef.current = doi;
            setIsLoading(false);
            stopPolling();
          } else if (result.status === "generating") {
            setIsLoading(true);
            startPolling();
          } else {
            setIsLoading(false);
            Alert.alert("No Audio", "No audio segments available for this paper.");
          }
        };

        initialize();

        return () => {
          mountedRef.current = false;
          stopPolling();
        };
      }, [doi])
  );

  return (
      <View
          style={[
            styles.mainContainer,
            { backgroundColor: isDarkMode ? "#121212" : "#FFFFFF" },
          ]}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <FontAwesome name="arrow-left" size={24} color="#1DB954" />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: isDarkMode ? "white" : "black" }]}>
            Now Playing
          </Text>

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
            </View>
        ) : (
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
              <View style={styles.playerContainer}>
                <View
                    style={[
                      styles.contentContainer,
                      { backgroundColor: isDarkMode ? "#19381F" : "#E0F2F1" },
                    ]}
                >
                  <View style={styles.artworkContainer}>
                    <Image
                        source={require("../../assets/music_img.jpg")}
                        style={styles.artwork}
                    />
                  </View>

                  <View style={styles.infoContainer}>
                    <Text style={[styles.paperTitle, { color: isDarkMode ? "white" : "black" }]}>
                      {audioSegments.length > 0 ? paperTitle || "Untitled Paper" : "No Audio Available"}
                    </Text>
                    <Text
                        style={[
                          styles.paperAuthor,
                          { color: isDarkMode ? "#b3b3b3" : "#666666" },
                        ]}
                    >
                      {paperAuthor || "Unknown Author"}
                    </Text>
                  </View>

                  <View style={styles.progressContainer}>
                    <Slider
                        style={styles.progressBar}
                        value={position}
                        maximumValue={duration}
                        minimumValue={0}
                        onSlidingComplete={onSliderValueChange}
                        minimumTrackTintColor="#1DB954"
                        maximumTrackTintColor={isDarkMode ? "#535353" : "#CCCCCC"}
                        thumbTintColor="#1DB954"
                    />
                    <View style={styles.timeContainer}>
                      <Text
                          style={[styles.timeText, { color: isDarkMode ? "#b3b3b3" : "#666666" }]}
                      >
                        {Math.floor(position / 1000)}s
                      </Text>
                      <Text
                          style={[styles.timeText, { color: isDarkMode ? "#b3b3b3" : "#666666" }]}
                      >
                        {Math.floor(duration / 1000)}s
                      </Text>
                    </View>
                  </View>

                  <View style={styles.controlsContainer}>
                    <TouchableOpacity onPress={skipBackward} style={styles.controlButton}>
                      <FontAwesome name="backward" size={24} color="#1DB954" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={togglePlayPause} style={styles.playPauseButton}>
                      {isPlaying ? (
                          <FontAwesome name="pause" size={32} color="white" />
                      ) : (
                          <FontAwesome name="play" size={32} color="white" />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={skipForward} style={styles.controlButton}>
                      <FontAwesome name="forward" size={24} color="#1DB954" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.segmentControls}>
                    <TouchableOpacity
                        disabled={currentSegmentIndex === 0}
                        onPress={handlePreviousSegment}
                        style={[
                          styles.segmentButton,
                          currentSegmentIndex === 0 && styles.disabledButton,
                        ]}
                    >
                      <FontAwesome name="step-backward" size={20} color="white" />
                      <Text style={styles.segmentButtonText}>Previous</Text>
                    </TouchableOpacity>

                    <Text
                        style={[styles.segmentInfo, { color: isDarkMode ? "#b3b3b3" : "#666666" }]}
                    >
                      {currentSegmentIndex + 1} / {audioSegments.length}
                    </Text>

                    <TouchableOpacity
                        disabled={currentSegmentIndex === audioSegments.length - 1}
                        onPress={handleNextSegment}
                        style={[
                          styles.segmentButton,
                          currentSegmentIndex === audioSegments.length - 1 &&
                          styles.disabledButton,
                        ]}
                    >
                      <Text style={styles.segmentButtonText}>Next</Text>
                      <FontAwesome name="step-forward" size={20} color="white" />
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
                          <Text
                              style={[
                                styles.transcriptHeaderText,
                                { color: isDarkMode ? "#FFFFFF" : "#000000" },
                              ]}
                          >
                            {section.title}
                          </Text>

                          <FontAwesome
                              name={expandedSections[section.id] ? "chevron-up" : "chevron-down"}
                              size={16}
                              color={isDarkMode ? "#FFFFFF" : "#000000"}
                          />
                        </TouchableOpacity>

                        {expandedSections[section.id] && (
                            <View style={styles.transcriptContent}>
                              <Text
                                  style={[
                                    styles.transcriptText,
                                    { color: isDarkMode ? "#FFFFFF" : "#000000" },
                                  ]}
                              >
                                {section.summary}
                              </Text>
                            </View>
                        )}
                      </View>
                  ))}
                </View>
              </View>
            </ScrollView>
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
  scrollContainer: {
    paddingBottom: 40,
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
    justifyContent: "center",
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
  transcriptContainer: {
    width: width * 0.9,
    marginTop: 20,
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
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 10,
  },
  transcriptContent: {
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 12,
  },
  transcriptText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default ListenPage;