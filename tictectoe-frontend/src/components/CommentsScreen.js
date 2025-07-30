import React, { useEffect, useState } from "react";
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { fetchComments } from "../../api";
import { checkIfGobackInfoAvailable } from "./functions/routeGoBackHandler";
import tw from "twrnc";
import { Ionicons } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";

const SimplePaperListItem = ({ item, navigation, isDarkMode }) => {
  const styles = StyleSheet.create({
    paperItem: {
      backgroundColor: isDarkMode ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.85)',
      padding: 15,
      marginVertical: 5,
      borderRadius: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      color: isDarkMode ? '#fff' : '#222',
      marginBottom: 5,
      textAlign: 'left',
    },
    author: {
      fontSize: 14,
      color: isDarkMode ? '#fff' : '#222',
      marginBottom: 3,
      textAlign: 'left',
    },
    date: {
      fontSize: 12,
      color: isDarkMode ? '#fff' : '#222',
      marginBottom: 10,
    },
    commentContainer: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(34,34,34,0.2)',
    },
    commentText: {
      fontSize: 14,
      color: isDarkMode ? '#fff' : '#222',
      marginBottom: 5,
    },
    commentTime: {
      fontSize: 12,
      color: isDarkMode ? '#fff' : '#222',
    }
  });

  const formatTimestamp = (timestamp) => {
    try {
      const timePart = timestamp.split(".")[0];
      const [hours, minutes, seconds] = timePart.split(":");
      const hours12 = hours % 12 || 12;
      const period = hours >= 12 ? "PM" : "AM";
      return `${hours12}:${minutes}:${seconds} ${period}`;
    } catch (error) {
      return "Invalid Timestamp";
    }
  };

  const handlePaperClick = () => {
    navigation.navigate("PaperNavigationPage", {
      title: item.title,
      author: item.author_names,
      genre: item.categories,
      date: item.published_date,
      paper_id: item.paper_id,
      summary: item.summary,
      doi: item.doi,
    });
  };

  return (
    <TouchableOpacity style={styles.paperItem} onPress={handlePaperClick}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.author}>{item.author_names}</Text>
      <Text style={styles.date}>
        {new Date(item.published_date).toLocaleDateString()}
      </Text>
      <View style={styles.commentContainer}>
        {item.comments.map((comment, index) => (
          <View key={index}>
            <Text style={styles.commentText}>{comment.content}</Text>
            <Text style={styles.commentTime}>{formatTimestamp(comment.timestamp)}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};

export default function CommentsScreen({ navigation }) {
  const [commentsData, setCommentsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const loadComments = async () => {
      try {
        const data = await fetchComments();
        setCommentsData(data);
      } catch (error) {
        console.error("Error loading comments:", error.message);
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, []);

  if (loading) {
    return (
      <LinearGradient
        colors={["#064E41", "#3D8C45"]}
        style={styles.gradientBackground}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading comments...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={isDarkMode ? ["#064E41", "#1E3A34"] : ["#064E41", "#3D8C45"]}
      style={styles.gradientBackground}
    >
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => {
            checkIfGobackInfoAvailable(navigation) ?
              navigation.goBack() :
              navigation.navigate("Explore")
          }}
          style={tw`absolute top-12 left-5 p-2 rounded-full bg-white`}
        >
          <Ionicons name="arrow-back" size={24} color="#064E41" />
        </TouchableOpacity>
        <Text style={styles.headerText}>My Comments</Text>
        <View style={styles.darkModeContainer}>
          <TouchableOpacity onPress={() => setIsDarkMode((prev) => !prev)} style={{ marginLeft: 2 }}>
            <MaterialIcons
              name={isDarkMode ? "wb-sunny" : "nightlight-round"}
              size={24}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {commentsData.length > 0 ? (
          commentsData.map((paper) => (
            <SimplePaperListItem
              key={paper.paper_id}
              item={paper}
              navigation={navigation}
              isDarkMode={isDarkMode}
            />
          ))
        ) : (
          <Text style={styles.noCommentsText}>No comments yet.</Text>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: 50,
    paddingBottom: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  darkModeContainer: {
    position: 'absolute',
    right: 20,
    top: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#fff",
  },
  noCommentsText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginTop: 20,
  },
});
