import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Image, Alert, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // For gradient background
import { CheckBox } from 'react-native-elements'; // Import the CheckBox component
import { useNavigation } from '@react-navigation/native';
import tw from 'twrnc'; // Tailwind CSS for React Native
import { updateUserInterests } from '../../api'; // Import functions from api.js
import { styles } from '../styles/TagSelectionStyles';
import { checkIfLoggedIn } from './functions/checkIfLoggedIn';

const TagSelection = () => {
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const username = "abhinav20";
  const navigation = useNavigation();
  useEffect(() => {
    setTimeout(async () => {
      const isLoggedIn = await checkIfLoggedIn();
    }, 100);
  }, [])
  useEffect(() => {
    const url = "http://192.168.4.26:3001/tag/categories";
    const loadCategories = async () => {
      try {
        const response = await fetch(url, {
          method: "GET", // Specify the method as POST
          headers: {
            "Content-Type": "application/json", // Indicate the content type
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Parse the response data as JSON
        const data = await response;
        setAvailableTags(data)

      } catch (error) {
        console.error('Error fetching categories:', error.message);
      }
    };

    loadCategories();
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleTagChange = (tag) => {
    setSelectedTags((prevTags) =>
      prevTags.includes(tag)
        ? prevTags.filter((t) => t !== tag)
        : [...prevTags, tag]
    );
  };

  const submitTags = async () => {
    if (selectedTags.length < 2) {
      Alert.alert("Selection Error", "Please select at least 2 interests.");
      return;
    }

    try {
      const response = await updateUserInterests(username, selectedTags);
      console.log("API Response:", response);
      Alert.alert("Success", "Interests updated successfully.");
      navigation.navigate("Explore");
    } catch (error) {
      console.error('Error updating interests:', error.message);
      Alert.alert("Error", error.message);
    }
  };

  return (
    <LinearGradient
      colors={isDarkMode ? ["#064E41", "#57B360"] : ["#064E41", "#57B360"]}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        {/* Header Section with Logo, Title, and Toggle */}
        <View style={tw`flex-row justify-between items-center mt-5 px-5`}>
          <View style={tw`flex-row items-center`}>
            <Image
              source={require('../../assets/Logo-Transparent.png')}
              style={tw`w-20 h-25 mr-3`}
            />
            <Text style={[tw`font-bold text-3xl`, { color: "white" }]}>
              Tic Tec Toe
            </Text>
          </View>

          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={isDarkMode ? "#57B360" : "#f4f3f4"}
            onValueChange={toggleDarkMode}
            value={isDarkMode}
            style={tw`ml-4`}
          />
        </View>

        {/* Subtitle Section */}
        <Text style={[tw` text-5l text-center mt-5 mb-5`, { color: "white" }]}>
          Select Your Interests
        </Text>

        {/* Scrollable Tags Section */}
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={tw`flex-row flex-wrap justify-center`}>
            {availableTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                onPress={() => handleTagChange(tag)}
                style={[tw`m-2 px-4 py-3 rounded-full items-center flex-row`, {
                  backgroundColor: isDarkMode ? "#2a2a2a" : "#ffffff",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 5,
                  minWidth: 100,
                }]}
              >
                <CheckBox
                  checked={selectedTags.includes(tag)}
                  onPress={() => handleTagChange(tag)}
                  containerStyle={tw`bg-transparent border-0 p-0`}
                  checkedColor="#57B360"
                />
                <Text style={[{ color: isDarkMode ? "#ffffff" : "#000000", fontSize: 16 }, tw`ml--2`]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Fixed Submit Button */}
        <TouchableOpacity
          style={tw`mt-5 bg-[#57B360] shadow-lg py-3 px-10 rounded-lg self-center mb-10`}
          onPress={submitTags}
        >
          <Text style={tw`font-bold text-white text-center text-lg`}>Submit</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

export default TagSelection;
