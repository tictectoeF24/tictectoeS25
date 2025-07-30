import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckBox } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import tw from 'twrnc';
import { fetchInterests, updateInterests, fetchAvailableInterests } from '../../api';
import { checkIfGobackInfoAvailable } from './functions/routeGoBackHandler';
import { AntDesign, Ionicons } from "@expo/vector-icons";


export default function TagScreen() {
    const [interests, setInterests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showExtraTags, setShowExtraTags] = useState(false);
    const navigation = useNavigation();
    const [availableInterests, setAvailableInterests] = useState({});
    const [expandedCategories, setExpandedCategories] = useState({});

    const toggleCategory = (category) => {
        setExpandedCategories((prev) => ({
            ...prev,
            [category]: !prev[category],
        }));
    };


    const getInterests = async () => {
        try {
            const interestArray = await fetchAvailableInterests(); // No need to access `response.data`
            const formattedData = {};
            interestArray.forEach((item) => {
                const subcategories = JSON.parse(item.SubCategory);
                formattedData[item.PrimaryCategory] = subcategories;
            });
            setAvailableInterests(formattedData);
        } catch (error) {
            console.error("Error fetching interests:", error);
        }
    };
    useEffect(() => {
        getInterests();
    }, []);

    useEffect(() => {
        const loadInterests = async () => {
            setLoading(true);
            try {
                const interestsData = await fetchInterests();
                if (interestsData && Array.isArray(interestsData.interests)) {
                    setInterests(interestsData.interests || []);
                } else {
                    console.log("No interests data returned");
                }
            } catch (error) {
                console.error('Error loading interests:', error);
            } finally {
                setLoading(false);
                console.log("Finished fetching interests.");
            }
        };

        loadInterests();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateInterests(interests);
            alert('Interests updated successfully!');
        } catch (error) {
            console.error('Error saving interests:', error);
            alert('Failed to update interests.');
        } finally {
            setLoading(false);
        }
    };

    const toggleInterest = (tag) => {
        setInterests(currentInterests => {
            if (currentInterests.includes(tag)) {
                if (currentInterests.length <= 2) {
                    alert("At least two interests are required!");
                    return currentInterests;
                }
                return currentInterests.filter(interest => interest !== tag);
            } else {
                return [...currentInterests, tag];
            }
        });
    };

    if (loading) {
        return (
            <LinearGradient
                colors={['#064E41', '#3D8C45']}
                style={styles.gradientBackground}
            >
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading interests...</Text>
                </View>
            </LinearGradient>
        );
    }

    if (!Array.isArray(interests)) {
        return <Text>Interests data is not available or not in the correct format.</Text>;
    }

    return (
        <LinearGradient
            colors={['#064E41', '#3D8C45']}
            style={styles.gradientBackground}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.headerContainer}>
                    <TouchableOpacity
                        onPress={() => {
                            checkIfGobackInfoAvailable(navigation) ?
                                navigation.goBack() :
                                navigation.navigate("Explore")
                        }}
                        style={[
                            tw`absolute top-5 left-5 p-2 rounded-full bg-white`,
                            { zIndex: 10 }, // Ensure the back button is on top
                          ]}
                    >
                        <Ionicons name="arrow-back" size={24} color="#064E41" />
                    </TouchableOpacity>
                    <Text style={styles.header}>Your Tags</Text>
                </View>
                <View style={styles.tagSection}>
                    {interests.map((interest, index) => (
                        <View key={index} style={styles.tagContainer}>
                            <Text style={styles.tagText}>{interest}</Text>
                        </View>
                    ))}
                    <View style={styles.Button}>
                        <Button title="Modify Tags" onPress={() => setShowExtraTags(!showExtraTags)} />
                    </View>
                    {showExtraTags &&
                        Object.entries(availableInterests).map(([primaryCategory, subcategories], index) => (
                            <View key={index} style={styles.modifyTagContainer}>
                                {/* Dropdown Header */}
                                <TouchableOpacity
                                    style={styles.dropdownHeader}
                                    onPress={() => toggleCategory(primaryCategory)}
                                >
                                    <Text style={styles.tagText}>{primaryCategory}</Text>
                                    <AntDesign
                                        name={expandedCategories[primaryCategory] ? "up" : "down"}
                                        size={20}
                                        color="white"
                                    />
                                </TouchableOpacity>

                                {/* Subcategories with Checkboxes (Only show when expanded) */}
                                {expandedCategories[primaryCategory] && (
                                    <View style={styles.subCategoryContainer}>
                                        {subcategories.map((sub, subIndex) => (
                                            <View key={subIndex} style={styles.subCategoryItem}>
                                                <CheckBox
                                                    title={sub}
                                                    checked={interests.includes(sub)}
                                                    onPress={() => toggleInterest(sub)}
                                                    checkedColor="white"
                                                    uncheckedColor="gray"
                                                    containerStyle={styles.checkboxContainer}
                                                    textStyle={styles.subCategoryText}
                                                />
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        ))}

                    <View style={styles.Button}>
                        <Button title="Save Changes" onPress={handleSave} />
                    </View>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradientBackground: {
        flex: 1,
    },
    scrollContent: {
        padding: 10,
    },
    tagSection: {
        paddingLeft: "15rem",
        paddingRight: "15rem",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 18,
        color: '#fff',
    },
    tagContainer: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'left',
        marginBottom: 10,
        padding: 10,
        marginLeft: 50,
        marginRight: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    modifyTagContainer: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'left',
        marginBottom: 10,
        padding: 10,
        marginLeft: 50,
        marginRight: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    tagText: {
        fontSize: 20,
        color: 'white',
        fontStyle: 'italic',

    },
    title: {
        fontSize: 20,
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    checkboxContainer: {
        backgroundColor: 'transparent',
        borderWidth: 0,
    },
    header: {
        fontSize: 30,
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 40,
        textAlign: 'center',
        marginTop: 10,
    },
    backButton: {
        marginTop: 40,
        marginLeft: 10,
    },
    backButtonText: {
        color: 'white',
        fontSize: 16,
    },
    Button: {
        marginTop: 10,
        marginLeft: 50,
        marginRight: 50,
    },
    dropdownHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 10,
        borderRadius: 5,
    },
    subCategoryContainer: {
        marginTop: 5,
        paddingLeft: 20,
    },
    subCategoryItem: {
        flexDirection: "column",
        alignItems: "left",
        paddingVertical: 5,
    },
    checkboxContainer: {
        backgroundColor: "transparent",
        borderWidth: 0,
        padding: 0,
        margin: 0,
    },
    subCategoryText: {
        color: "white",
        fontSize: 16,
    },
});


