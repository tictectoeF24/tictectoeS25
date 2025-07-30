import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { fetchUserFollowing } from "../../api";

const FollowingList = ({ route }) => {
  const { userId } = route.params;
  const [following, setFollowing] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    fetchFollowing();
  }, [userId]);

  const fetchFollowing = async () => {
    try {
      const followingData = await fetchUserFollowing(userId);
      setFollowing(followingData);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching following:", error);
      Alert.alert("Error", "Failed to fetch following.");
      setIsLoading(false);
    }
  };

  const renderFollowing = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => navigation.navigate("ProfilePage", { userId: item.id })}
    >
      <Text style={styles.username}>{item.username}</Text>
      <Text style={styles.name}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#057B34" />
      </View>
    );
  }

  if (following.length === 0) {
    return (
      <View style={styles.container}>
        <Text>No following records found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={following}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderFollowing}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  userItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  username: { fontSize: 18 },
  name: { fontSize: 16, color: "gray" },
});

export default FollowingList;
