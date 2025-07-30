import React, { useEffect, useState } from "react";
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { PaperListItem } from "../components/small-components/PaperListItem";
import { fetchComments } from "../../api";
import { checkIfLoggedIn } from "./functions/checkIfLoggedIn";
import { checkIfGobackInfoAvailable } from "./functions/routeGoBackHandler";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import tw from "twrnc";
import { MaterialIcons } from "@expo/vector-icons";

export default function CommentsScreen({ navigation }) {
  const [commentsData, setCommentsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setTimeout(async () => {
      const isLoggedIn = await checkIfLoggedIn();
    }, 100);
  }, [])
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

  const formatTimestamp = (timestamp) => {
    try {
      const timePart = timestamp.split(".")[0];
      const [hours, minutes, seconds] = timePart.split(":");

      // Convert to 12-hour format
      const hours12 = hours % 12 || 12;
      const period = hours >= 12 ? "PM" : "AM";

      return `${hours12}:${minutes}:${seconds} ${period}`;
    } catch (error) {
      console.error("Error formatting timestamp:", error.message);
      return "Invalid Timestamp";
    }
  };

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
            navigation.navigate("ProfilePage")
          }}
          style={tw`absolute top-5 left-5 p-2 rounded-full bg-white`}
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
        <View style={styles.rowContainer}>
          {commentsData.length > 0 ? (
            commentsData.map((paper, index) => (
              <View key={paper.paper_id} style={styles.paperContainer}>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("PaperNavigationPage", {
                      title: paper.title,
                      author: paper.author_names,
                      paper_id: paper.paper_id,
                      summary: paper.summary,
                      doi: paper.doi,
                      published_date: paper.published_date,
                    })
                  }
                  style={[styles.card, isDarkMode && styles.darkCard]}
                >
                  <Text style={[styles.title, isDarkMode && styles.darkText]} numberOfLines={2}>{paper.title}</Text>
                  <Text style={[styles.author, isDarkMode && styles.darkText]} numberOfLines={1}>{paper.author_names}</Text>
                  <Text style={[styles.date, isDarkMode && styles.darkText]}>
                    {new Date(paper.published_date).toLocaleDateString()}
                  </Text>
                  {paper.comments && paper.comments.length > 0 && (
                    <View style={{ marginTop: 10 }}>
                      {paper.comments.map((comment, idx) => (
                        <View key={idx} style={[styles.commentItem, isDarkMode && styles.darkCommentItem]}>
                          <Text style={[styles.commentContent, isDarkMode && styles.darkText]}>{comment.content}</Text>
                          <Text style={[styles.commentTimestamp, isDarkMode && styles.darkText]}>
                            {formatTimestamp(comment.timestamp)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.noCommentsText}>No comments yet.</Text>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    paddingTop: 30,
    paddingBottom: 20,
    alignItems: "center",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    position: "absolute",
    left: "48%",
    transform: [{ translateX: -50 }],
    top: "50%",
    textAlign: "center",
  },
  darkModeContainer: {
    position: 'absolute',
    right: 20,
    top: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingBottom: 20,
    paddingTop: 25,
  },
  rowContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },
  paperContainer: {
    width: "49.0%",
    marginBottom: 16,
    borderRadius: 8,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  commentItem: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 5,
  },
  darkCommentItem: {
    backgroundColor: "rgba(30,30,30,0.85)",
  },
  commentContent: {
    fontSize: 14,
    color: "#333",
  },
  commentTimestamp: {
    fontSize: 12,
    color: "#777",
    marginTop: 5,
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
    color: "fff",
    textAlign: "center",
    marginTop: 20,
  },
  card: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 8,
    padding: 10,
    minHeight: 120,
    justifyContent: "space-between",
    marginBottom: 8,
  },
  darkCard: {
    backgroundColor: "rgba(30,30,30,0.85)",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 4,
    width: '100%',
    textAlign: 'left',
    flexWrap: 'wrap',
    display: 'flex',
    whiteSpace: 'normal',
    wordBreak: 'break-word',
  },
  darkText: {
    color: "#fff",
  },
  author: {
    fontSize: 14,
    color: "#222",
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: "#222",
  },
});
