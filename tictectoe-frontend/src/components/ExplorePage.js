import React, { useState, useEffect, useRef } from "react";
import { Dimensions } from "react-native";
import ExpandableChat from "./ExpandableChat";

import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  Share,
  Alert,
  Linking,
  Platform,
  Modal,
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { lightStyles, darkStyles } from "../styles/ExplorePageStyles";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import {
  fetchProfile,
  BASE_URL,
  fetchExploreRecommendationsMobile,
} from "../../api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PaperListItem } from "./small-components/PaperListItem";
import DateTimePicker from "@react-native-community/datetimepicker";

// ORCID Credentials
const ORCID_CLIENT_ID = "APP-H4ASFRRPPQLEYAAD";
const ORCID_REDIRECT_URI = `${BASE_URL}/api/profile/auth/orcid/callback`;

const ExplorePage = () => {
  const [showOrcidLogin, setShowOrcidLogin] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [papers, setPapers] = useState([]);
  const [explorePapers, setExplorePapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigation = useNavigation();
  const styles = isDarkMode ? darkStyles : lightStyles;

  const [profileData, setProfileData] = useState(null);

  // Date filter state
  const [showDateModal, setShowDateModal] = useState(false);
  const [startMonth, setStartMonth] = useState(null);
  const [endMonth, setEndMonth] = useState(null);
  const [showStartMonthPicker, setShowStartMonthPicker] = useState(false);
  const [showEndMonthPicker, setShowEndMonthPicker] = useState(false);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // Chat (kept in case you wire it later)
  const [showChat, setShowChat] = useState(false);

  const searchTimeout = useRef(null);
  const screenHeight = Dimensions.get("window").height;

  const loadPapersData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        setError("No session found. Please sign in again.");
        return;
      }

      const fetchedPapers = await fetchExploreRecommendationsMobile();
      const profile = await fetchProfile();
      setProfileData(profile);

      if (!fetchedPapers || fetchedPapers.length === 0) {
        setError("No papers available at the moment.");
        setExplorePapers([]);
        setPapers([]);
      } else {
        setExplorePapers(fetchedPapers.data || []);
        setPapers(fetchedPapers.data || []);
      }
    } catch (err) {
      console.error("Error fetching papers:", err);
      setError(err.message || "Failed to load papers.");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (
      sourcePapers,
      query = searchQuery,
      start = startMonth,
      end = endMonth
  ) => {
    let filtered = [...sourcePapers];
    const trimmedQuery = query.trim().toLowerCase();

    if (trimmedQuery) {
      filtered = filtered.filter((paper) => {
        const titleMatch = paper.title?.toLowerCase().includes(trimmedQuery);
        const authorMatch = paper.author_names?.toLowerCase().includes(trimmedQuery);
        return titleMatch || authorMatch;
      });
    }

    if (start) {
      filtered = filtered.filter((paper) => {
        if (!paper.published_date) return false;
        return new Date(paper.published_date) >= start;
      });
    }

    if (end) {
      const endOfDay = new Date(end);
      endOfDay.setHours(23, 59, 59, 999);

      filtered = filtered.filter((paper) => {
        if (!paper.published_date) return false;
        return new Date(paper.published_date) <= endOfDay;
      });
    }

    return filtered;
  };

  useEffect(() => {
    const init = async () => {
      setHasActiveFilters(false);

      // Load initial feed
      await loadPapersData();

      // Check ORCID link status
      try {
        const token = await AsyncStorage.getItem("jwtToken");
        if (!token) {
          setShowOrcidLogin(true);
          return;
        }

        const profile = await fetchProfile();
        setProfileData(profile);

        if (profile?.orcid) {
          setShowOrcidLogin(false);
        } else {
          setShowOrcidLogin(true);
        }
      } catch (error) {
        console.error("Error checking ORCID status:", error);
        setShowOrcidLogin(true);
      }
    };

    init();
  }, []);

  const handleSearch = async (queryText = searchQuery) => {
    setLoading(true);
    setError(null);

    try {
      const filtered = applyFilters(
          explorePapers,
          queryText,
          startMonth,
          endMonth
      );

      if (!filtered || filtered.length === 0) {
        setError(
            `No papers found${
                queryText.trim() ? ` for "${queryText.trim()}"` : ""
            }.`
        );
        setPapers([]);
      } else {
        setPapers(filtered);
      }
    } catch (err) {
      console.error("Error filtering papers:", err);
      setError("Failed to filter papers.");
      setPapers([]);
    } finally {
      setLoading(false);
    }
  };

  const displayMonthYear = (date) => {
    if (!date) return null;
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" }); // "January 2024"
  };

  const handleMonthFilter = async () => {
    setLoading(true);
    setError(null);

    try {
      const filtered = applyFilters(
          explorePapers,
          searchQuery,
          startMonth,
          endMonth
      );

      if (!filtered || filtered.length === 0) {
        setError("No papers found for the selected month range.");
        setPapers([]);
      } else {
        setPapers(filtered);
        setHasActiveFilters(!!startMonth || !!endMonth);
      }
    } catch (err) {
      console.error("Error filtering papers by month range:", err);
      setError("Failed to filter papers. Please try again.");
    } finally {
      setLoading(false);
      setShowDateModal(false);
    }
  };

  const clearMonthFilters = async () => {
    setStartMonth(null);
    setEndMonth(null);
    setHasActiveFilters(false);
    setLoading(true);
    setError(null);

    try {
      const filtered = applyFilters(explorePapers, searchQuery, null, null);

      if (!filtered || filtered.length === 0) {
        setError("No papers found.");
        setPapers([]);
      } else {
        setPapers(filtered);
      }
    } catch (err) {
      console.error("Error clearing month filters:", err);
      setError("Failed to clear filters. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleORCIDLogin = () => {
    const orcidAuthURL = `https://orcid.org/oauth/authorize?client_id=${ORCID_CLIENT_ID}&response_type=code&scope=/authenticate&redirect_uri=${encodeURIComponent(
        ORCID_REDIRECT_URI
    )}`;
    Linking.openURL(orcidAuthURL);
  };

  const onSearchQueryChange = (text) => {
    setSearchQuery(text);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // simple debounce
    searchTimeout.current = setTimeout(() => {
      handleSearch(text);
    }, 800);
  };

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  const handleShare = async (paper) => {
    try {
      await Share.share({
        message: `Check out this research paper: ${paper.title} - ${
            paper.category_readable
                ? paper.category_readable
                : paper.categories
                    ? paper.categories.split(",")[0].trim()
                    : "General"
        }. ${paper.description || ""}`,
      });
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
      <LinearGradient
          colors={isDarkMode ? ["#0C1C1A", "#2B5A3E"] : ["#064E41", "#57B360"]}
          style={styles.background}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 15,
                  marginTop: 20,
                }}
            >
              {/* Search */}
              <View style={[styles.searchBar, { flex: 1, marginRight: 10 }]}>
                <FontAwesome
                    name="search"
                    size={20}
                    color={isDarkMode ? "#fff" : "#000"}
                />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by title or author"
                    placeholderTextColor={isDarkMode ? "#888" : "#666"}
                    value={searchQuery}
                    onChangeText={onSearchQueryChange}
                />
                <MaterialIcons
                    name="mic"
                    size={20}
                    color={isDarkMode ? "#fff" : "#000"}
                />
              </View>

              {/* Date Filter Icon */}
              <TouchableOpacity
                  onPress={() => setShowDateModal(true)}
                  style={{
                    backgroundColor: hasActiveFilters
                        ? "rgba(33, 150, 243, 0.3)"
                        : "rgba(255,255,255,0.2)",
                    padding: 8,
                    borderRadius: 8,
                    marginRight: 8,
                    borderWidth: hasActiveFilters ? 2 : 0,
                    borderColor: hasActiveFilters ? "#2196F3" : "transparent",
                  }}
              >
                <FontAwesome
                    name="calendar"
                    size={20}
                    color={hasActiveFilters ? "#2196F3" : "white"}
                />
              </TouchableOpacity>

              {/* Theme Toggle */}
              <TouchableOpacity onPress={toggleTheme} style={{ marginLeft: 2 }}>
                <MaterialIcons
                    name={isDarkMode ? "wb-sunny" : "nightlight-round"}
                    size={24}
                    color="white"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Filter Modal */}
          <Modal
              animationType="slide"
              transparent
              visible={showDateModal}
              onRequestClose={() => setShowDateModal(false)}
          >
            <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  justifyContent: "flex-end",
                }}
                activeOpacity={1}
                onPress={() => setShowDateModal(false)}
            >
              <View
                  style={{
                    backgroundColor: isDarkMode ? "#2B5A3E" : "#57B360",
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    padding: 20,
                    paddingBottom: 40,
                  }}
              >
                <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 20,
                    }}
                >
                  <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "bold",
                        color: "white",
                      }}
                  >
                    Filter by Date Range
                  </Text>
                  <TouchableOpacity onPress={() => setShowDateModal(false)}>
                    <MaterialIcons name="close" size={24} color="white" />
                  </TouchableOpacity>
                </View>

                {/* Start / End pickers */}
                <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 30,
                    }}
                >
                  {/* Start */}
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <TouchableOpacity
                        onPress={() => setShowStartMonthPicker(true)}
                        style={{
                          backgroundColor: "rgba(255,255,255,0.2)",
                          padding: 15,
                          borderRadius: 10,
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                    >
                      <FontAwesome
                          name="calendar"
                          size={16}
                          color="#fff"
                          style={{ marginRight: 10 }}
                      />
                      <Text style={{ color: "white", fontSize: 14 }}>
                        {startMonth ? displayMonthYear(startMonth) : "From Date"}
                      </Text>
                    </TouchableOpacity>
                    {showStartMonthPicker && (
                        <DateTimePicker
                            value={startMonth || new Date()}
                            mode="date"
                            display={Platform.OS === "ios" ? "compact" : "default"}
                            maximumDate={new Date()}
                            onChange={(event, date) => {
                              setShowStartMonthPicker(false);
                              if (event.type === "set" && date) {
                                const firstDayOfMonth = new Date(
                                    date.getFullYear(),
                                    date.getMonth(),
                                    1
                                );
                                setStartMonth(firstDayOfMonth);
                              }
                            }}
                            style={{
                              backgroundColor: "white",
                              borderRadius: 10,
                              marginTop: 10,
                            }}
                        />
                    )}
                  </View>

                  {/* End */}
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <TouchableOpacity
                        onPress={() => setShowEndMonthPicker(true)}
                        style={{
                          backgroundColor: "rgba(255,255,255,0.2)",
                          padding: 15,
                          borderRadius: 10,
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                    >
                      <FontAwesome
                          name="calendar"
                          size={16}
                          color="#fff"
                          style={{ marginRight: 10 }}
                      />
                      <Text style={{ color: "white", fontSize: 14 }}>
                        {endMonth ? displayMonthYear(endMonth) : "To Date"}
                      </Text>
                    </TouchableOpacity>
                    {showEndMonthPicker && (
                        <DateTimePicker
                            value={endMonth || startMonth || new Date()}
                            mode="date"
                            display={Platform.OS === "ios" ? "compact" : "default"}
                            minimumDate={startMonth || new Date("2020-01-01")}
                            maximumDate={new Date()}
                            onChange={(event, date) => {
                              setShowEndMonthPicker(false);
                              if (event.type === "set" && date) {
                                const lastDayOfMonth = new Date(
                                    date.getFullYear(),
                                    date.getMonth() + 1,
                                    0
                                );
                                setEndMonth(lastDayOfMonth);
                              }
                            }}
                            style={{
                              backgroundColor: "white",
                              borderRadius: 10,
                              marginTop: 10,
                            }}
                        />
                    )}
                  </View>
                </View>

                {/* Active filter display */}
                {hasActiveFilters && (
                    <View
                        style={{
                          backgroundColor: "rgba(255,255,255,0.15)",
                          padding: 12,
                          borderRadius: 8,
                          marginBottom: 20,
                        }}
                    >
                      <Text
                          style={{
                            color: "white",
                            fontSize: 14,
                            textAlign: "center",
                            fontWeight: "500",
                          }}
                      >
                        Active Filter:{" "}
                        {startMonth ? displayMonthYear(startMonth) : "All"} -{" "}
                        {endMonth ? displayMonthYear(endMonth) : "All"}
                      </Text>
                    </View>
                )}

                {/* Actions */}
                <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-around",
                    }}
                >
                  <TouchableOpacity
                      onPress={clearMonthFilters}
                      style={{
                        backgroundColor: hasActiveFilters
                            ? "#FF6B6B"
                            : "rgba(255,255,255,0.3)",
                        paddingVertical: 12,
                        paddingHorizontal: 30,
                        borderRadius: 25,
                        minWidth: 120,
                        alignItems: "center",
                        opacity: hasActiveFilters ? 1 : 0.7,
                      }}
                      disabled={loading}
                  >
                    <Text
                        style={{
                          color: "white",
                          fontWeight: "600",
                          fontSize: 16,
                        }}
                    >
                      Clear
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                      onPress={handleMonthFilter}
                      style={{
                        backgroundColor: "#4CAF50",
                        paddingVertical: 12,
                        paddingHorizontal: 30,
                        borderRadius: 25,
                        minWidth: 120,
                        alignItems: "center",
                        opacity: startMonth || endMonth ? 1 : 0.7,
                      }}
                      disabled={loading || (!startMonth && !endMonth)}
                  >
                    <Text
                        style={{
                          color: "white",
                          fontWeight: "600",
                          fontSize: 16,
                        }}
                    >
                      Apply Filter
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Main content */}
          {error ? (
              <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 24,
                  }}
              >
                <Text style={{ color: "red", textAlign: "center" }}>{error}</Text>
              </View>
          ) : loading ? (
              <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
              >
                <Text style={{ color: isDarkMode ? "#fff" : "#000", fontSize: 18 }}>
                  Loading...
                </Text>
              </View>
          ) : (
              <FlatList
                  data={papers}
                  renderItem={({ item }) => (
                      <PaperListItem
                          item={item}
                          navigation={navigation}
                          userId={profileData?.id}
                          onShare={() => handleShare(item)}
                      />
                  )}
                  keyExtractor={(item) => item.paper_id.toString()}
                  contentContainerStyle={{
                    alignItems: "center",
                    paddingBottom: 120,
                  }}
                  showsVerticalScrollIndicator={false}
                  snapToAlignment="start"
                  snapToInterval={screenHeight * 0.7 + 220}
                  decelerationRate="fast"
                  pagingEnabled={false}
                  horizontal={false}
                  showsHorizontalScrollIndicator={false}
              />
          )}
        </View>

        {/* Footer nav */}
        <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: isDarkMode
                  ? "rgba(43, 90, 62, 0.9)"
                  : "rgba(87, 179, 96, 0.9)",
              padding: 15,
              paddingHorizontal: 0,
            }}
        >
          <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                width: "100%",
              }}
          >
            <TouchableOpacity
                onPress={() => navigation.navigate("BookmarksScreen")}
                style={styles.footerButton}
            >
              <FontAwesome name="bookmark" size={24} color="#fff" />
              <Text style={styles.footerText}>Bookmark</Text>
            </TouchableOpacity>

            {showOrcidLogin && (
                <TouchableOpacity
                    onPress={handleORCIDLogin}
                    style={styles.footerButton}
                >
                  <FontAwesome name="id-badge" size={24} color="#fff" />
                  <Text style={styles.footerText}>ORCID Login</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity
                onPress={() => navigation.navigate("ChatHistory")}
                style={styles.footerButton}
            >
              <FontAwesome name="android" size={24} color="#fff" />
              <Text style={styles.footerText}>History</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => navigation.navigate("ProfilePage")}
                style={styles.footerButton}
            >
              <FontAwesome name="user" size={24} color="#fff" />
              <Text style={styles.footerText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ExpandableChat visible={showChat} onClose={() => setShowChat(false)} />
      </LinearGradient>
  );
};

export default ExplorePage;