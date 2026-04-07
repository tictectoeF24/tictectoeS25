import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import tw from "twrnc";
import { searchUsers, followUser, unfollowUser, checkIfFollowing } from "../../api";
import debounce from "lodash.debounce";
import { LinearGradient } from "expo-linear-gradient";
import { checkIfGobackInfoAvailable } from "./functions/routeGoBackHandler";

export default function SearchUsersPage({ navigation }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [total, setTotal] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [followingStatus, setFollowingStatus] = useState({});

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  const theme = {
    backgroundColors: isDarkMode ? ["#0C1C1A", "#2B5A3E"] : ["#064E41", "#57B360"],
    textColor: "#FFFFFF",
    inputBackgroundColor: isDarkMode ? "#2A2A2A" : "#FFFFFF",
    buttonColor: "#57B360",
    buttonTextColor: "#FFFFFF",
    placeholderTextColor: isDarkMode ? "#AAAAAA" : "#777777",
    borderColor: isDarkMode ? "#555555" : "#D1D5DB",
  };

  const handleSearch = async (term) => {
    if (!term.trim()) {
      setUsers([]);
      setTotal(0);
      return;
    }

    setIsLoading(true);
    setPage(1);

    try {
      const data = await searchUsers(term, 1, limit);
      setUsers(data.users);
      setTotal(data.total);

      if (typeof checkIfFollowing === "function") {
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
      } else {
        console.error("checkIfFollowing is not defined");
      }
    } catch (error) {
      Alert.alert("Error", error.message || "An error occurred during search.");
    } finally {
      setIsLoading(false);
    }
  };

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

  const debouncedHandleSearch = useCallback(debounce(handleSearch, 500), []);

  const onChangeText = (text) => {
    setSearchTerm(text);
    debouncedHandleSearch(text);
  };

  const loadMore = async () => {
    if (users.length >= total || isLoading) return;

    const nextPage = page + 1;
    setIsLoading(true);

    try {
      const data = await searchUsers(searchTerm, nextPage, limit);
      setUsers([...users, ...data.users]);
      setPage(nextPage);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to load more users.");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsRefreshing(true);
    setPage(1);

    try {
      const data = await searchUsers(searchTerm, 1, limit);
      setUsers(data.users);
      setTotal(data.total);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to refresh users.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderUserItem = ({ item }) => (
      <View
          style={[
            tw`flex-row items-center justify-between p-3 border-b`,
            { borderColor: theme.borderColor },
          ]}
      >
        <View style={tw`flex-row items-center`}>
          <Ionicons name="person-circle-outline" size={40} color={theme.textColor} style={tw`mr-3`} />
          <View>
            <Text style={[tw`text-lg font-bold`, { color: theme.textColor }]}>
              {item.username}
            </Text>
            <Text style={[tw`text-gray-500`, { color: theme.textColor }]}>
              {item.email}
            </Text>
          </View>
        </View>

        <TouchableOpacity
            onPress={() => handleFollowToggle(item.id)}
            style={{
              backgroundColor: followingStatus[item.id] ? "red" : "green",
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 5,
            }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>
            {followingStatus[item.id] ? "Unfollow" : "Follow"}
          </Text>
        </TouchableOpacity>
      </View>
  );

  return (
      <LinearGradient colors={theme.backgroundColors} style={tw`flex-1`}>
        <SafeAreaView style={tw`flex-1 p-4`}>
          <TouchableOpacity
              onPress={() => {
                checkIfGobackInfoAvailable(navigation)
                    ? navigation.goBack()
                    : navigation.navigate("Explore");
              }}
              style={tw`absolute top-5 left-5 p-2 mt-10 rounded-full bg-white`}
          >
            <Ionicons name="arrow-back" size={24} color="#064E41" />
          </TouchableOpacity>

          <View style={tw`flex-row justify-between items-center ml-7 mt-20 mb-5 mr-7`}>
            <Text style={[tw`text-2xl font-bold`, { color: theme.textColor }]}>
              Search Users
            </Text>

            <TouchableOpacity onPress={toggleTheme} style={{ marginLeft: 2 }}>
              <MaterialIcons
                  name={isDarkMode ? "wb-sunny" : "nightlight-round"}
                  size={24}
                  color="white"
              />
            </TouchableOpacity>
          </View>

          <View
              style={[
                tw`flex-row items-center p-4 ml-4 mr-4 rounded-full mb-7`,
                {
                  backgroundColor: theme.inputBackgroundColor,
                  borderColor: theme.borderColor,
                  borderWidth: 1,
                },
              ]}
          >
            <Ionicons name="search" size={24} color={isDarkMode ? "#FFFFFF" : "#888"} />
            <TextInput
                style={[
                  tw`flex-1 ml-3`,
                  { color: isDarkMode ? "#FFFFFF" : "#000000" },
                ]}
                placeholder="Search users by username or email"
                placeholderTextColor={theme.placeholderTextColor}
                value={searchTerm}
                onChangeText={onChangeText}
                returnKeyType="search"
            />
          </View>

          <TouchableOpacity
              style={[
                tw`p-3 rounded-lg ml-6 mr-6 mb-6`,
                { backgroundColor: theme.buttonColor },
              ]}
              onPress={() => handleSearch(searchTerm)}
          >
            <Text style={[tw`text-center font-bold`, { color: theme.buttonTextColor }]}>
              Search
            </Text>
          </TouchableOpacity>

          {isLoading && page === 1 ? (
              <ActivityIndicator size="large" color={theme.textColor} style={tw`mt-10`} />
          ) : (
              <FlatList
                  data={users}
                  keyExtractor={(item) => item.id}
                  renderItem={renderUserItem}
                  onEndReached={loadMore}
                  onEndReachedThreshold={0.5}
                  ListFooterComponent={
                    isLoading && page > 1 ? (
                        <ActivityIndicator size="small" color={theme.textColor} style={tw`my-4`} />
                    ) : null
                  }
                  refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={refreshSearch}
                        tintColor={theme.textColor}
                    />
                  }
                  ListEmptyComponent={
                      !isLoading && (
                          <View style={tw`flex-1 items-center justify-center mt-10`}>
                            <Text style={{ color: theme.textColor }}>No users found.</Text>
                          </View>
                      )
                  }
              />
          )}
        </SafeAreaView>
      </LinearGradient>
  );
}