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
import { fetchUserFollowers } from "../../api";

const FollowersList = ({ route }) => {
  const { userId } = route.params;
  const [followers, setFollowers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    fetchFollowers();
  }, [userId]);

  const fetchFollowers = async () => {
    try {
      const followersData = await fetchUserFollowers(userId);
      setFollowers(followersData);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching followers:", error);
      Alert.alert("Error", "Failed to fetch followers.");
      setIsLoading(false);
    }
  };

  const renderFollower = ({ item }) => (
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

  if (followers.length === 0) {
    return (
      <View style={styles.container}>
        <Text>No followers found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={followers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderFollower}
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

export default FollowersList;
