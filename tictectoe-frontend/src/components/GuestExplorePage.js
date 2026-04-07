import React, { useState, useEffect, useRef } from "react";
import {
    View,
    TextInput,
    FlatList,
    TouchableOpacity,
    Text,
    Modal,
    Dimensions,
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { lightStyles, darkStyles } from "../styles/ExplorePageStyles";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { fetchPapersByClickCount, searchPapers } from "../../api";
import { PaperListItem } from "./small-components/PaperListItem";

const GuestExplorePage = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [papers, setPapers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigation = useNavigation();
    const styles = isDarkMode ? darkStyles : lightStyles;
    const screenHeight = Dimensions.get("window").height;
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
                                onFocus={handleAuthRequired}
                            />
                            <MaterialIcons
                                name="mic"
                                size={20}
                                color={isDarkMode ? "#fff" : "#000"}
                                onPress={handleAuthRequired}
                            />
                        </View>

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

                        <TouchableOpacity onPress={toggleTheme} style={{ marginLeft: 2 }}>
                            <MaterialIcons
                                name={isDarkMode ? "wb-sunny" : "nightlight-round"}
                                size={24}
                                color="white"
                            />
                        </TouchableOpacity>
                    </View>
                </View>

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
                                userId={undefined}
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
};

export default GuestExplorePage;