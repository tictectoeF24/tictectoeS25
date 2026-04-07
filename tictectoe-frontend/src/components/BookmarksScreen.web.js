import { useEffect, useState } from "react";
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { fetchBookmarks } from "../../api";
import { checkIfLoggedIn } from "./functions/checkIfLoggedIn";
import { checkIfGobackInfoAvailable } from "./functions/routeGoBackHandler";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import { MaterialIcons } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";
import { unbookmarkPaper } from "./functions/PaperFunc";

export default function BookmarksScreen({ navigation }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setTimeout(async () => {
      const isLoggedIn = await checkIfLoggedIn();
    }, 100);
  }, [])
  const loadBookmarks = async () => {
    try {
      const data = await fetchBookmarks();
      setBookmarks(data);
    } catch (error) {
      console.error("Error loading bookmarks:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookmarks();
  }, []);

  const handleRemoveBookmark = async (paperId) => {
    try {
      const success = await unbookmarkPaper(paperId);
      if (success) {
        // Reload bookmarks after successful removal
        await loadBookmarks();
      } else {
        console.error("Failed to remove bookmark - API returned false");
        alert("Failed to remove bookmark. Please try again.");
      }
    } catch (error) {
      console.error("Error removing bookmark:", error);
      alert(`Error removing bookmark: ${error.message || "Please try again."}`);
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={["#064E41", "#3D8C45"]}
        style={styles.gradientBackground}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading bookmarks...</Text>
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
              navigation.navigate("ProfilePage")
          }}
          style={tw`absolute top-5 left-5 p-2 rounded-full bg-white`}
        >
          <Ionicons name="arrow-back" size={24} color="#064E41" />
        </TouchableOpacity>
        <Text style={styles.headerText}>My Bookmarks</Text>
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
      {bookmarks.length > 0 ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.bookmarksContainer}>
            {bookmarks.map((bookmark) => (
              <View key={bookmark.paper_id} style={styles.bookmarkWrapper}>
                <View style={[styles.card, isDarkMode && styles.darkCard]}>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("PaperNavigationPage", {
                        title: bookmark.title,
                        author: bookmark.author_names,
                        paper_id: bookmark.paper_id,
                        summary: bookmark.summary,
                        doi: bookmark.doi,
                        published_date: bookmark.published_date,
                      })
                    }
                    style={styles.cardContent}
                  >
                    <Text style={[styles.title, isDarkMode && styles.darkText]} numberOfLines={2}>{bookmark.title}</Text>
                    <Text style={[styles.author, isDarkMode && styles.darkText]} numberOfLines={1}>{bookmark.author_names}</Text>
                    <Text style={[styles.date, isDarkMode && styles.darkText]}>
                      {new Date(bookmark.published_date).toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemoveBookmark(bookmark.paper_id)}
                    style={[styles.removeButton, isDarkMode && styles.darkRemoveButton]}
                  >
                    <FontAwesome name="bookmark" size={18} color={isDarkMode ? "#4fc3f7" : "#2196F3"} />
                    <Text style={[styles.removeButtonText, isDarkMode && styles.darkRemoveButtonText]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.noBookmarksContainer}>
          <Text style={styles.noBookmarksText}>No bookmarks yet.</Text>
        </View>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#fff",
  },
  noBookmarksContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noBookmarksText: {
    fontSize: 20,
    color: "#fff",
    textAlign: "center",
  },
  bookmarksContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    height: "100%",
    paddingHorizontal: 15,
  },
  bookmarkWrapper: {
    width: "49%",
    marginBottom: 15,
  },
  card: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 8,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 120,
    justifyContent: "space-between",
    display: "flex",
    flexDirection: "column",
  },
  cardContent: {
    flex: 1,
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    backgroundColor: "rgba(33, 150, 243, 0.1)",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(33, 150, 243, 0.3)",
    gap: 6,
  },
  removeButtonText: {
    color: "#2196F3",
    fontSize: 12,
    fontWeight: "600",
  },
  darkRemoveButton: {
    backgroundColor: "rgba(79, 195, 247, 0.15)",
    borderColor: "rgba(79, 195, 247, 0.4)",
  },
  darkRemoveButtonText: {
    color: "#4fc3f7",
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
