import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckBox } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import tw from 'twrnc';
import { fetchInterests, updateInterests } from '../../api';
import { checkIfGobackInfoAvailable } from './functions/routeGoBackHandler';

export default function TagScreen() {
    const [interests, setInterests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showExtraTags, setShowExtraTags] = useState(false);
    const navigation = useNavigation();
    const availableTags = [
        'Science', 'Sports', 'Ethics', 'Arts', 'Business', 'Physics', 'Mathematics', 'Health', 'Chemistry',
        'Technology', 'Economics', 'Literature', 'Engineering', 'Political Science', 'Music',
        'Fashion', 'Photography', 'Nutrition', 'Fitness', 'Travel', 'Film Studies', 'Public Speaking', 'Gaming'
    ];

    useEffect(() => {
        const loadInterests = async () => {
            console.log("Calling fetchInterests...");
            setLoading(true);
            try {
                const interestsData = await fetchInterests();
                console.log("Interests data fetched:", interestsData);
                console.log("Data Type:", Array.isArray(interestsData) ? "Array" : typeof interestsData);
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
            const updatedInterests = currentInterests.includes(tag) ?
                currentInterests.filter(interest => interest !== tag) :
                [...currentInterests, tag];
            console.log("Updated interests:", updatedInterests); // Log to see what the new interests array looks like
            return updatedInterests;
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
                        style={styles.backButton}>
                        <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.header}>Your Tags</Text>
                </View>
                {interests.map((interest, index) => (
                    <View key={index} style={styles.tagContainer}>
                        <Text style={styles.tagText}>{interest}</Text>
                    </View>
                ))}
                <View style={tw`mt-3 mb-3 p-2 bg-gray-100 rounded-lg`}>
                    <Button title="Modify Tags" color="#4CAF50" onPress={() => setShowExtraTags(!showExtraTags)} />
                </View>
                {showExtraTags && availableTags.map((tag, index) => (
                    <View key={index} style={styles.tagContainer}>
                        <Text style={styles.tagText}>{tag}</Text>
                        <CheckBox
                            checked={interests.includes(tag)}
                            onPress={() => toggleInterest(tag)}  // Using onPress here
                            checkedColor='black'
                            uncheckedColor='white' // Optional: color when unchecked
                            containerStyle={styles.checkboxContainer}
                        />
                    </View>
                ))}
                <View style={tw`p-2 bg-gray-100 rounded-lg`}>
                    <Button title="Save Changes" color="#4CAF50" onPress={handleSave} />
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        padding: 10,
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
});

