import React, { useState, useCallback, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import tw from "twrnc";
import debounce from "lodash.debounce";
import { searchUsers, followUser, unfollowUser, checkIfFollowing } from "../../api";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { checkIfGobackInfoAvailable } from "./functions/routeGoBackHandler";
export default function SearchUsersPage() {
  // State Variables
  const navigation = useNavigation();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [followingStatus, setFollowingStatus] = useState({}); // Follow status

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Search Users Function
  const handleSearch = async (term) => {
    if (!term.trim()) {
      setUsers([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await searchUsers(term, 1, 20);
      setUsers(data.users);

      // Check follow status for each user
      const statusPromises = data.users.map(async (user) => {
        try {
          const status = await checkIfFollowing(user.id);
          return { userId: user.id, isFollowing: status.isFollowing };
        } catch (err) {
          console.error("Error checking following status:", err);
          return { userId: user.id, isFollowing: false };
        }
      });

      const statuses = await Promise.all(statusPromises);
      const statusMap = statuses.reduce((acc, { userId, isFollowing }) => {
        acc[userId] = isFollowing;
        return acc;
      }, {});

      setFollowingStatus(statusMap);
    } catch (error) {
      Alert.alert("Error", error.message || "An error occurred during search.");
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce Search to Optimize API Calls
  const debouncedHandleSearch = useCallback(debounce(handleSearch, 500), []);

  const onChangeText = (text) => {
    setSearchTerm(text);
    debouncedHandleSearch(text);
  };

  // Follow/Unfollow Functionality
  const handleFollowToggle = async (userId) => {
    try {
      if (followingStatus[userId]) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }

      setFollowingStatus((prevStatus) => ({
        ...prevStatus,
        [userId]: !prevStatus[userId],
      }));
    } catch (error) {
      Alert.alert("Error", "Failed to update follow status.");
    }
  };

  return (
    <SafeAreaView style={tw`flex flex-1 h-full w-full`}>
      <LinearGradient
        colors={isDarkMode ? ["#0C1C1A", "#2B5A3E"] : ["#064E41", "#3D8C45"]}
        style={tw`flex flex-1 items-center justify-center py-14`}
      >

        {/* Back Button */}
        <TouchableOpacity
          onPress={() => {
            checkIfGobackInfoAvailable(navigation) ?
              navigation.goBack() :
              navigation.navigate("Explore")
          }}
          style={tw`absolute top-5 left-5 p-2 rounded-full bg-white`}
        >
          <Ionicons name="arrow-back" size={24} color="#064E41" />
        </TouchableOpacity>

        {/* ✅ Centered the heading */}
        <View style={tw`items-center mb-10`}>
          <Text style={tw`text-white text-4xl font-bold`}>Search Users</Text>
        </View>

        {/* Dark Mode Toggle */}
        <View style={tw`absolute top-5 right-5`}>
          <TouchableOpacity onPress={toggleTheme} style={{ marginLeft: 2 }}>
            <MaterialIcons
              name={isDarkMode ? "wb-sunny" : "nightlight-round"}
              size={24}
              color="white"
            />
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <TextInput
          style={tw`w-96 h-16 text-lg bg-white rounded-md p-4 text-black ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"
            }`}
          onChangeText={onChangeText}
          value={searchTerm}
          placeholder="Search users by username or email"
          placeholderTextColor={isDarkMode ? "#999" : "#666"}
        />

        {/* Search Button */}
        <TouchableOpacity
          style={[
            tw`mt-6 w-80 h-16 rounded-lg flex items-center justify-center shadow-lg`,
            { backgroundColor: "#57B360" },
          ]}
          onPress={() => handleSearch(searchTerm)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={tw`text-white font-bold text-2xl`}>Search</Text>
          )}
        </TouchableOpacity>

        {/* Search Results */}
        <View style={tw`mt-10 w-96`}>
          {isLoading ? (
            <ActivityIndicator size="large" color="white" />
          ) : users.length > 0 ? (
            users.map((user) => (
              <View
                key={user.id}
                style={tw`w-full bg-gray-200 rounded-lg p-6 mb-4 shadow-lg flex-row justify-between`}
              >
                <View>
                  <Text style={tw`text-black text-2xl font-semibold`}>
                    {user.username}
                  </Text>
                  <Text style={tw`text-black text-lg`}>{user.email}</Text>
                </View>

                {/* Follow/Unfollow Button */}
                <TouchableOpacity
                  onPress={() => handleFollowToggle(user.id)}
                  style={{
                    backgroundColor: followingStatus[user.id] ? "red" : "green",
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
                    {followingStatus[user.id] ? "Unfollow" : "Follow"}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={tw`flex-1 items-center justify-center`}>
              <Text style={tw`text-white text-2xl`}>No users found.</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
