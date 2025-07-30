import React, { useState, useEffect, useRef } from "react";
import { Dimensions } from "react-native";
import ExpandableChat from "./ExpandableChat";
//import { FontAwesome } from "@expo/vector-icons";


import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  Switch,
  Share,
  Alert,
  Linking,
  Platform,
  Modal, //added for date filter modal
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { lightStyles, darkStyles } from "../styles/ExplorePageStyles";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import {
  fetchPapers,
  fetchPapersByClickCount,
  searchPapers,
  deleteAuthToken,
  fetchProfile,
  signOut
} from "../../api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PaperListItem } from "./small-components/PaperListItem";
import { BASE_URL } from "../../api";
import DateTimePicker from "@react-native-community/datetimepicker";

// ORCID Credentials
const ORCID_CLIENT_ID = "APP-H4ASFRRPPQLEYAAD";
const ORCID_REDIRECT_URI = `${BASE_URL}/api/profile/auth/orcid/callback`;

const ExplorePage = () => {
  const [showOrcidLogin, setShowOrcidLogin] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  const styles = isDarkMode ? darkStyles : lightStyles;
  const [profileData, setProfileData] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);

  const [startMonth, setStartMonth] = useState(null);
  const [endMonth, setEndMonth] = useState(null);
  const [showStartMonthPicker, setShowStartMonthPicker] = useState(false);
  const [showEndMonthPicker, setShowEndMonthPicker] = useState(false);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [activePaper, setActivePaper] = useState(null);



  const searchTimeout = useRef(null);

  const loadPapersData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (token) {
        const response = await fetchPapersByClickCount();
        const profileData = await fetchProfile();
        setProfileData(profileData);

        if (!response?.data || response.data.length === 0) {
          setError("No Paper available")
        } else {
          setPapers(response.data);
        }

      } else {
        Alert.alert("Error", "No token found, please log in again.");
      }
    } catch (err) {
      console.error("Error fetching papers:", err);
      setError(err.message || "Failed to load papers");

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      await loadPapersData();
    };

    const checkOrcidStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("jwtToken");
        if (!token) {
          setShowOrcidLogin(true);
          return;
        }

        const profile = await fetchProfile();
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

    setHasActiveFilters(false);
    checkOrcidStatus();
    fetchData();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      if (searchQuery.trim() === "") {
        loadPapersData();
        return;
      }

      const data = await searchPapers(searchQuery);
      if (data.length === 0) {
        setError(`No results found for "${searchQuery}"`);
      } else {
        setPapers(data);
      }
    } catch (err) {
      console.error("Error fetching search results:", err);
      setError(
        "Failed to load search results. Please check your network connection."
      );
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format month/year
  const formatMonthYear = (date) => {
    if (!date) return null;
    return date.toLocaleDateString("en-CA", { year: 'numeric', month: '2-digit' }); // Returns YYYY-MM format
  };

  // Helper function to display month/year
  const displayMonthYear = (date) => {
    if (!date) return null;
    return date.toLocaleDateString("en-US", { year: 'numeric', month: 'long' }); // Returns "January 2024" format
  };

  // Updated date filter function
  const handleMonthFilter = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        throw new Error("Session expired. Please log in again.");
      }

      // Format dates to include full month range
      const formattedStartDate = startMonth
        ? `${formatMonthYear(startMonth)}-01` // First day of start month
        : null;
      
      const formattedEndDate = endMonth
        ? (() => {
            const year = endMonth.getFullYear();
            const month = endMonth.getMonth();
            const lastDay = new Date(year, month + 1, 0).getDate(); // Last day of end month
            return `${formatMonthYear(endMonth)}-${lastDay.toString().padStart(2, '0')}`;
          })()
        : null;

      console.log('Filtering by date range:', formattedStartDate, 'to', formattedEndDate);

      const data = await searchPapers("", formattedStartDate, formattedEndDate);
      if (data.length === 0) {
        setError("No results found for the selected month range.");
      } else {
        setPapers(data);
        setHasActiveFilters(true);
      }
    } catch (err) {
      console.error("Error filtering by month range:", err);
      if (err.message.includes("Session expired")) {
        Alert.alert("Session Expired", "Please log in again.");
        navigation.navigate("Login");
      } else {
        setError("Failed to filter by month range. Please try again.");
      }
    } finally {
      setLoading(false);
      setShowDateModal(false);
    }
  };

  // Updated clear filters function
  const clearMonthFilters = async () => {
    setStartMonth(null);
    setEndMonth(null);
    setHasActiveFilters(false);
    setLoading(true);
    setError(null);

    try {
      await loadPapersData();
    } catch (err) {
      console.error("Error clearing month filters:", err);
      setError("Failed to clear filters. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleORCIDLogin = () => {
    const orcidAuthURL = `https://orcid.org/oauth/authorize?client_id=${ORCID_CLIENT_ID}&response_type=code&scope=/authenticate&redirect_uri=${encodeURIComponent(ORCID_REDIRECT_URI)}`;
    Linking.openURL(orcidAuthURL);
  };

  const onSearchQueryChange = (text) => {
    setSearchQuery(text);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      handleSearch();
    }, 1200);
  };

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  const handleShare = async (paper) => {
    try {
      await Share.share({
        message: `Check out this research paper: ${paper.title} - ${paper.category_readable ? paper.category_readable : (paper.categories ? paper.categories.split(",")[0].trim() : "General")}. ${paper.description}`,
      });
    } catch (error) {
      alert(error.message);
    }
  };

  const screenHeight = Dimensions.get('window').height;

  return (
    <LinearGradient
      colors={isDarkMode ? ["#0C1C1A", "#2B5A3E"] : ["#064E41", "#57B360"]}
      style={styles.background}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 15,
            marginTop: 20,
          }}>

            {/* changed to flex for better allignment */}
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

            <TouchableOpacity
              onPress={() => setShowDateModal(true)}
              style={{
                backgroundColor: hasActiveFilters ? 'rgba(33, 150, 243, 0.3)' : 'rgba(255,255,255,0.2)',
                padding: 8,
                borderRadius: 8,
                marginRight: 8,
                borderWidth: hasActiveFilters ? 2 : 0,
                borderColor: hasActiveFilters ? '#2196F3' : 'transparent',
              }}
            >
              <FontAwesome name="calendar" size={20} color={hasActiveFilters ? '#2196F3' : 'white'} />
            </TouchableOpacity>

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
          transparent={true}
          visible={showDateModal}
          onRequestClose={() => setShowDateModal(false)}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'flex-end',
            }}
            activeOpacity={1}
            onPress={() => setShowDateModal(false)}
          >
            <View style={{
              backgroundColor: isDarkMode ? '#2B5A3E' : '#57B360',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              paddingBottom: 40,
            }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: 'white',
                }}>
                  Filter by Date Range
                </Text>
                <TouchableOpacity onPress={() => setShowDateModal(false)}>
                  <MaterialIcons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>

              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 30,
              }}>
                {/* Start Date Picker */}
                <View style={{ flex: 1, marginRight: 10 }}>
                  <TouchableOpacity
                    onPress={() => setShowStartMonthPicker(true)}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      padding: 15,
                      borderRadius: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <FontAwesome name="calendar" size={16} color="#fff" style={{ marginRight: 10 }} />
                    <Text style={{ color: 'white', fontSize: 14 }}>
                      {startMonth ? displayMonthYear(startMonth) : 'From Date'}
                    </Text>
                  </TouchableOpacity>
                  {showStartMonthPicker && (
                    <DateTimePicker
                      value={startMonth || new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'compact' : 'default'}
                      maximumDate={new Date()}
                      onChange={(event, date) => {
                        setShowStartMonthPicker(false);
                        if (event.type === 'set' && date) {
                          // Set to first day of selected month
                          const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
                          setStartMonth(firstDayOfMonth);
                        }
                      }}
                      style={{
                        backgroundColor: 'white',
                        borderRadius: 10,
                        marginTop: 10,
                      }}
                    />
                  )}
                </View>

                {/* End Date Picker */}
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <TouchableOpacity
                    onPress={() => setShowEndMonthPicker(true)}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      padding: 15,
                      borderRadius: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <FontAwesome name="calendar" size={16} color="#fff" style={{ marginRight: 10 }} />
                    <Text style={{ color: 'white', fontSize: 14 }}>
                      {endMonth ? displayMonthYear(endMonth) : 'To Date'}
                    </Text>
                  </TouchableOpacity>
                  {showEndMonthPicker && (
                    <DateTimePicker
                      value={endMonth || startMonth || new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'compact' : 'default'}
                      minimumDate={startMonth || new Date('2020-01-01')}
                      maximumDate={new Date()}
                      onChange={(event, date) => {
                        setShowEndMonthPicker(false);
                        if (event.type === 'set' && date) {
                          // Set to last day of selected month
                          const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                          setEndMonth(lastDayOfMonth);
                        }
                      }}
                      style={{
                        backgroundColor: 'white',
                        borderRadius: 10,
                        marginTop: 10,
                      }}
                    />
                  )}
                </View>
              </View>

              {/* Active Filter Display */}
              {hasActiveFilters && (
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 20,
                }}>
                  <Text style={{
                    color: 'white',
                    fontSize: 14,
                    textAlign: 'center',
                    fontWeight: '500',
                  }}>
                    Active Filter: {startMonth ? displayMonthYear(startMonth) : 'All'} - {endMonth ? displayMonthYear(endMonth) : 'All'}
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
              }}>
                <TouchableOpacity
                  onPress={clearMonthFilters}
                  style={{
                    backgroundColor: hasActiveFilters ? '#FF6B6B' : 'rgba(255,255,255,0.3)',
                    paddingVertical: 12,
                    paddingHorizontal: 30,
                    borderRadius: 25,
                    minWidth: 120,
                    alignItems: 'center',
                    opacity: hasActiveFilters ? 1 : 0.7,
                  }}
                  disabled={loading}
                >
                  <Text style={{
                    color: 'white',
                    fontWeight: '600',
                    fontSize: 16,
                  }}>
                    Clear
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleMonthFilter}
                  style={{
                    backgroundColor: '#4CAF50',
                    paddingVertical: 12,
                    paddingHorizontal: 30,
                    borderRadius: 25,
                    minWidth: 120,
                    alignItems: 'center',
                    opacity: (startMonth || endMonth) ? 1 : 0.7,
                  }}
                  disabled={loading || (!startMonth && !endMonth)}
                >
                  <Text style={{
                    color: 'white',
                    fontWeight: '600',
                    fontSize: 16,
                  }}>
                    Apply Filter
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {error ? (
          <Text style={{ color: "red", textAlign: "center" }}>{error}</Text>
        ) : loading ? (
          <View style={{ height: "100vh", justifyContent: "center", alignItems: "center" }}>
            <Text>Loading...</Text>
          </View>
        ) : (
          <FlatList
            data={papers}
            renderItem={({ item }) => (
              <PaperListItem item={item} navigation={navigation} userId={profileData?.id} />
            )}
            keyExtractor={(item) => item.paper_id.toString()}
            contentContainerStyle={{
              alignItems: 'center',
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
      {/* Footer navigation */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100vw',
        marginLeft: -15,
        marginRight: -15,
        backgroundColor: isDarkMode ? 'rgba(43, 90, 62, 0.9)' : 'rgba(87, 179, 96, 0.9)',
        padding: 15,
        paddingHorizontal: 0,
      }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          width: '100%',
        }}>
          <TouchableOpacity
            onPress={() => navigation.navigate("BookmarksScreen")}
            style={styles.footerButton}
          >
            <FontAwesome
              name="bookmark"
              size={24}
              color={isDarkMode ? "#fff" : "#fff"}
            />
            <Text style={styles.footerText}>Bookmark</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              const orcidAuthURL = `https://orcid.org/oauth/authorize?client_id=${ORCID_CLIENT_ID}&response_type=code&scope=/authenticate&redirect_uri=${encodeURIComponent(ORCID_REDIRECT_URI)}`;
              Linking.openURL(orcidAuthURL);
            }}
            style={styles.footerButton}
          >
            <FontAwesome
              name="id-badge"
              size={24}
              color={isDarkMode ? "#fff" : "#fff"}
            />
            <Text style={styles.footerText}>ORCID Login</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("ChatHistory")} style={styles.footerButton}>
            <FontAwesome name="android" size={24} color="white" />
            <Text style={styles.footerText}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("ProfilePage")}
            style={styles.footerButton}
          >
            <FontAwesome
              name="user"
              size={24}
              color={isDarkMode ? "#fff" : "#fff"}
            />
            <Text style={styles.footerText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ExpandableChat visible={showChat}
  onClose={() => setShowChat(false)}/>
    </LinearGradient>
  );
};

export default ExplorePage;
