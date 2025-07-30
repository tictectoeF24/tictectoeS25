import React, { useState, useEffect, useRef } from "react";

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
    Modal,
    Dimensions,
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { lightStyles, darkStyles } from "../styles/ExplorePageStyles";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { fetchPapersByClickCount, searchPapers } from "../../api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PaperListItem } from "./small-components/PaperListItem";
import { fetchProfile } from '../../api';
import { BASE_URL } from "../../api";
import DateTimePicker from "@react-native-community/datetimepicker";

const GuestExplorePage = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeComments, setActiveComments] = useState(null);
    const [commentsData, setCommentsData] = useState({});
    const [newComment, setNewComment] = useState("");
    const [papers, setPapers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const [error, setError] = useState(null);
    const navigation = useNavigation();
    const styles = isDarkMode ? darkStyles : lightStyles;
    const screenHeight = Dimensions.get('window').height;
    const [hoverExplore, setHoverExplore] = useState(false);
    const [hoverBookmarks, setHoverBookmarks] = useState(false);
    const [pressedExplore, setPressedExplore] = useState(false);
    const [pressedBookmarks, setPressedBookmarks] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);


    const searchTimeout = useRef(null);

    useEffect(() => {
        const loadPapersData = async () => {
            setLoading(true);
            try {
                const response = await fetchPapersByClickCount();
                if (!response?.data || response.data.length === 0) {
                    console.log("No papers found");
                    setError("No papers available at the moment.");
                } else {
                    console.log("Setting papers:", response.data);
                    setPapers(response.data);
                }
            } catch (err) {
                console.error("Error fetching papers:", err);
                setError("Failed to load papers. Please check your network connection.");
            } finally {
                setLoading(false);
            }
        };

        loadPapersData();
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

    const signOut = async () => {
        try {

            await AsyncStorage.removeItem("jwtToken");
            await AsyncStorage.removeItem("currentRoute");

            deleteAuthToken();
            // navigation.navigate("LandingPage");
            return true;
        } catch (error) {
            console.error("Logout error:", error);
            return false;
        }
    };


    const handleDateFilter = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = await AsyncStorage.getItem("jwtToken");
            if (!token) {
                throw new Error("Session expired. Please log in again.");
            }

            const formattedStartDate = startDate
                ? startDate.toLocaleDateString("en-CA")
                : null;
            const formattedEndDate = endDate
                ? endDate.toLocaleDateString("en-CA")
                : null;

            const data = await searchPapers("", formattedStartDate, formattedEndDate); // Empty searchQuery to filter only by date range
            if (data.length === 0) {
                setError("No results found for the selected date range.");
            } else {
                setPapers(data);
            }
        } catch (err) {
            console.error("Error filtering by date range:", err);
            if (err.message.includes("Session expired")) {
                Alert.alert("Session Expired", "Please log in again.");
                navigation.navigate("Login");
            } else {
                setError("Failed to filter by date range. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const onSearchQueryChange = (text) => {
        setSearchQuery(text);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        // Debounce the search function
        searchTimeout.current = setTimeout(() => {
            handleSearch();
        }, 1200);
    };

    const toggleTheme = () => {
        setIsDarkMode((prevMode) => !prevMode);
    };

    const handleAuthRequired = () => {
        setShowAuthModal(true);
    };

    const handleModalClose = () => {
        setShowAuthModal(false);
    };

    const handleSignIn = () => {
        setShowAuthModal(false);
        navigation.navigate("AuthenticationSignInPage");
    };

    const handleSignUp = () => {
        setShowAuthModal(false);
        navigation.navigate("AuthenticationSignUpPage");
    };

    const toggleLike = (paperId) => {
        setLikedPapers((prevLiked) => ({
            ...prevLiked,
            [paperId]: !prevLiked[paperId],
        }));
    };

    const toggleBookmark = (paperId) => {
        setBookmarkedPapers((prevBookmarked) => ({
            ...prevBookmarked,
            [paperId]: !prevBookmarked[paperId],
        }));
    };

    const handleShare = async (paper) => {
        try {
            await Share.share({
                message: `Check out this research paper: ${paper.title} - ${paper.genre}. ${paper.description}`,
            });
        } catch (error) {
            alert(error.message);
        }
    };

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
                        marginBottom: 20,
                        marginTop: 20,
                    }}>
                        <View style={[styles.searchBar, {flex: 1, marginRight: 10 }]}>
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
                                onFocus={handleAuthRequired}
                            />
                            <MaterialIcons
                                name="mic"
                                size={20}
                                color={isDarkMode ? "#fff" : "#000"}
                                onPress={handleAuthRequired}
                            />
                        </View>


                        {/* //new code  */}
                        <TouchableOpacity 
        onPress={handleAuthRequired} 
        style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            padding: 8,
            borderRadius: 8,
            marginRight: 8,
        }}
    >
        <FontAwesome name="calendar" size={20} color="white" />
    </TouchableOpacity>
    {/* //end of new code */}

                        <TouchableOpacity onPress={toggleTheme} style={{ marginLeft: 2 }}>
                            <MaterialIcons 
                                name={isDarkMode ? "wb-sunny" : "nightlight-round"} 
                                size={24} 
                                color="white" 
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* <View style={[styles.dateRangeContainer, { marginTop: -5, marginBottom: 15 }]}>
                    Start Date Picker
                    <View style={styles.datePickerWrapper}>
                        <TouchableOpacity onPress={handleAuthRequired} style={styles.smallDatePicker}>
                            <FontAwesome name="calendar" size={20} color="#fff" />
                            <Text style={styles.dateText}>
                                {startDate ? startDate.toDateString() : "Start Date"}
                            </Text>
                        </TouchableOpacity>
                        {showStartPicker && (
                            <DateTimePicker
                                value={startDate || new Date()}
                                mode="date"
                                display="default"
                                onChange={(event, date) => {
                                    setShowStartPicker(false);
                                    if (date) setStartDate(date);
                                }}
                            />
                        )}
                    </View>

                    End Date Picker
                    <View style={styles.datePickerWrapper}>
                        <TouchableOpacity onPress={handleAuthRequired} style={styles.smallDatePicker}>
                            <FontAwesome name="calendar" size={20} color="#fff" />
                            <Text style={styles.dateText}>
                                {endDate ? endDate.toDateString() : "End Date"}
                            </Text>
                        </TouchableOpacity>
                        {showEndPicker && (
                            <DateTimePicker
                                value={endDate || new Date()}
                                mode="date"
                                display="default"
                                onChange={(event, date) => {
                                    setShowEndPicker(false);
                                    if (date) setEndDate(date);
                                }}
                            />
                        )}
                    </View>

                    Apply Filter Button
                    <TouchableOpacity
                        onPress={handleAuthRequired}
                        style={styles.applyButton}
                    >
                        <Text style={styles.applyButtonText}>Apply</Text>
                    </TouchableOpacity>
                </View> */}

                {error ? (
                    <Text style={{ color: "red", textAlign: "center" }}>{error}</Text>
                ) : loading ? (
                    <Text style={{ textAlign: "center" }}>Loading...</Text>
                ) : (
                    <FlatList
                        data={papers}
                        renderItem={({ item }) => (
                            <PaperListItem
                                item={item}
                                navigation={navigation}
                                userId={profileData?.id}
                                showAuthModal={handleAuthRequired}
                            />
                        )}
                        keyExtractor={(item) => item.paper_id.toString()}
                        contentContainerStyle={{
                            alignItems: 'center',
                        }}
                        showsVerticalScrollIndicator={false}
                        scrollEnabled={true}
                        snapToAlignment="start"
                        snapToInterval={screenHeight * 0.7 + 220} 
                        decelerationRate="fast"
                        pagingEnabled={false}
                        horizontal={false}
                        showsHorizontalScrollIndicator={false}
                    />
                )}

                {/* Sign Up/Sign In buttons at bottom */}
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
                        justifyContent: 'center',
                        width: '100%',
                        paddingHorizontal: 0,
                    }}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate("AuthenticationSignUpPage")}
                            style={{
                                backgroundColor: '#2196F3',
                                padding: 10,
                                borderRadius: 6,
                                width: 150,
                                marginRight: 20,
                            }}
                        >
                            <Text style={{
                                color: 'white',
                                textAlign: 'center',
                                fontSize: 14,
                                fontWeight: '600'
                            }}>Sign Up</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => navigation.navigate("AuthenticationSignInPage")}
                            style={{
                                backgroundColor: '#4CAF50',
                                padding: 10,
                                borderRadius: 6,
                                width: 150,
                            }}
                        >
                            <Text style={{
                                color: 'white',
                                textAlign: 'center',
                                fontSize: 14,
                                fontWeight: '600'
                            }}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Authentication Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={showAuthModal}
                onRequestClose={handleModalClose}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    activeOpacity={1}
                    onPress={handleModalClose}
                >
                    <View style={{
                        width: '80%',
                        backgroundColor: 'white',
                        borderRadius: 10,
                        padding: 20,
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 4,
                        elevation: 5,
                    }}>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: 'bold',
                            marginBottom: 15,
                            textAlign: 'center',
                        }}>
                            Sign In Required
                        </Text>
                        <Text style={{
                            marginBottom: 20,
                            textAlign: 'center',
                            color: '#666',
                        }}>
                            Please sign in or create an account to access this feature.
                        </Text>
                        <View style={{
                            flexDirection: 'row',
                            width: '100%',
                            justifyContent: 'space-around',
                            marginTop: 10,
                        }}>
                            <TouchableOpacity
                                onPress={handleSignIn}
                                style={{
                                    backgroundColor: '#4CAF50',
                                    paddingVertical: 10,
                                    paddingHorizontal: 20,
                                    borderRadius: 5,
                                    minWidth: 100,
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{ color: 'white', fontWeight: '600' }}>Sign In</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSignUp}
                                style={{
                                    backgroundColor: '#2196F3',
                                    paddingVertical: 10,
                                    paddingHorizontal: 20,
                                    borderRadius: 5,
                                    minWidth: 100,
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{ color: 'white', fontWeight: '600' }}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            onPress={handleModalClose}
                            style={{
                                marginTop: 20,
                            }}
                        >
                            <Text style={{ color: '#999' }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </LinearGradient>
    );
}


export default GuestExplorePage;
