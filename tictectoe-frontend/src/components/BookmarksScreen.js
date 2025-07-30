import React, { useEffect, useState } from "react";
import { View, ScrollView, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { fetchBookmarks } from "../../api";
import { checkIfLoggedIn } from "./functions/checkIfLoggedIn";
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
      width: '100%',
      alignSelf: 'stretch',
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
    },
    date: {
      fontSize: 12,
      color: isDarkMode ? '#fff' : '#222',
    }
  });

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
    </TouchableOpacity>
  );
};

export default function BookmarksScreen({ navigation }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
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

    loadBookmarks();
  }, []);

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
          style={tw`absolute top-12 left-5 p-2 rounded-full bg-white`}
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {bookmarks.length > 0 ? (
          bookmarks.map((bookmark) => (
            <SimplePaperListItem
              key={bookmark.paper_id}
              item={bookmark}
              navigation={navigation}
              isDarkMode={isDarkMode}
            />
          ))
        ) : (
          <Text style={styles.noBookmarksText}>No bookmarks yet.</Text>
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
    textAlign: "center",
    flex: 1,
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
  noBookmarksText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginTop: 20,
  },
});
