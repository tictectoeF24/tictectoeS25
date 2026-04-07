import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import axios from "axios";
import { BASE_URL_IN_CONFIG } from "../../config";
import { getCurrentUserInfo } from "./functions/userUtils";

const NotesScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();

  const paperId = localStorage.getItem("paperId");
  const paperTitle = route.params?.paperTitle;
  const selectedText = route.params?.selectedText;

  const [heading, setHeading] = useState(selectedText || "");
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Load user and notes for that user
  useEffect(() => {
    const validSession = async () => {
      const user = await getCurrentUserInfo();
      setCurrentUser(user);
      if (user?.userId) {
        loadNotes(user.userId);
      }
    };
    validSession();
  }, []);

  const loadNotes = async (userId) => {
    try {
      const res = await axios.get(
        `${BASE_URL_IN_CONFIG}/api/notes/paper/${paperId}/user/${userId}`
      );
      setNotes(res.data.noteHistory || []);
    } catch (err) {
      console.error("Error loading notes:", err);
    } finally {
      setLoading(false);
    }
  };

  // Save note
  const handleSave = async () => {
    if (!note.trim()) {
      return;
    }
    setSaving(true);

    try {
      console.log(`PaperID: ${paperId}`);
      console.log(`UserID: ${currentUser.userId}`);
      const res = await axios.post(
        `${BASE_URL_IN_CONFIG}/api/notes/save-note`,
        {
          title: heading,
          body: note,
          paper_id: paperId,
          user_id: currentUser.userId
        }
      );
      setNotes((prev) => [...prev, res.data.noteEntry]);
      setNote("");
    } catch (err) {
      console.error("Error while saving note:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <FontAwesome name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>

          <View style={{ marginLeft: 10 }}>
            <Text style={styles.title} numberOfLines={1}>
              {paperTitle}
            </Text>
            <Text style={styles.subtitle}>Your Notes</Text>
          </View>
        </View>
      </View>

      {/* Notes List */}
      {loading ? (
        <ActivityIndicator size="large" color="#057B34" />
      ) : notes.length === 0 ? (
        <View style={styles.emptyState}>
          <FontAwesome name="sticky-note-o" size={50} color="#ccc" />
          <Text style={styles.emptyText}>No notes yet</Text>
        </View>
      ) : (
        <ScrollView style={styles.notesList}>
          {notes.map((n) => (
            <View key={n.note_id} style={styles.noteCard}>
              <Text style={styles.noteHeading}>{`"${n.title}"`}</Text>
              <Text style={styles.noteBody}>{n.body}</Text>
            </View>
          ))}
        </ScrollView>
      )}

            {/* Input */}
            <View style={styles.inputContainer}>
                {heading ? (
                    <View style={styles.selectedTextBox}>
                        <Text style={styles.selectedTextLabel}>Selected Text</Text>
                        <Text style={styles.selectedText}>{heading}</Text>
                    </View>
                ) : null}

                <View style={styles.noteRow}>
                    <TextInput
                        placeholder="Write your note..."
                        value={note}
                        onChangeText={setNote}
                        style={styles.noteInput}
                        multiline
                    />

                    <TouchableOpacity
                        onPress={handleSave}
                        style={styles.sendButton}
                        disabled={saving}
                    >
                        <FontAwesome name="send" size={16} color="#fff" />
                    </TouchableOpacity>
                </View>

            </View>

        </SafeAreaView>
    );
};

export default NotesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#064E41"
  },

  header: {
    padding: 20,
    backgroundColor: "transparent"
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff"
  },

    subtitle: {
        fontSize: 13,
        color: "#f6fbf8",
        marginTop: 4,
    },

  notesList: {
    flex: 1,
    paddingHorizontal: 16
  },

  noteCard: {
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    maxWidth: "85%"
  },

  noteBody: {
    flex: 1,
    color: "#222",
    fontSize: 14,
    lineHeight: 20
  },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },

  emptyText: {
    marginTop: 10,
    color: "#cbd5e1"
  },

   inputContainer: {
    padding: 14,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
    },

    sendButton: {
    marginLeft: 8,
    backgroundColor: "#057B34",
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    },

  noteHeading: {
    flex: 1,
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 6,
    color: "#333",
    },

    selectedTextBox: {
    backgroundColor: "#E6F4EA",
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    },

    selectedTextLabel: {
    fontSize: 11,
    color: "#057B34",
    fontWeight: "600",
    marginBottom: 4,
},

selectedText: {
    fontSize: 13,
    color: "#064E41",
},

noteRow: {
  flexDirection: "row",
  alignItems: "center",
},

noteInput: {
  flex: 1,                 
  backgroundColor: "#f1f5f9",
  borderRadius: 18,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 14,
  maxHeight: 120,
},

});
