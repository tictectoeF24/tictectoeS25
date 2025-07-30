import React, { useState, useRef } from "react";
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Modal,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";


const ExpandableChatApp = ({ visible, onClose }) => {
  const [messages, setMessages] = useState([
    { content: "Hi there! How can I help you?", from: "ai" },
  ]);
  const [input, setInput] = useState("");

  const heightAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const animateOpen = () => {
    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: 400,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const animateClose = () => {
    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => {
      onClose && onClose();
    });
  };

  React.useEffect(() => {
    if (visible) {
      animateOpen();
    } else {
      animateClose();
    }
  }, [visible]);

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages([
      ...messages,
      { content: input, from: "user" },
      { content: `Echo from AI: ${input}`, from: "ai" },
    ]);
    setInput("");
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.chatContainer,
            {
              height: heightAnim,
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerText}>Chat with AI ✨</Text>
            <TouchableOpacity onPress={animateClose}>
              <FontAwesome name="times" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView
            style={styles.messagesContainer}
            contentContainerStyle={{ paddingBottom: 60 }}
          >
            {messages.map((msg, index) => (
              <View
                key={index}
                style={[
                  styles.messageBubble,
                  msg.from === "user" ? styles.userBubble : styles.aiBubble,
                ]}
              >
                <Text
                  style={{
                    color: msg.from === "user" ? "#fff" : "#333",
                  }}
                >
                  {msg.content}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Type your message..."
              style={styles.input}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              onPress={handleSend}
              style={styles.sendButton}
            >
              <FontAwesome name="send" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default ExpandableChatApp;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  chatContainer: {
    backgroundColor: "#fff",
    width: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#064E41",
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f5f5f5",
  },
  messageBubble: {
    borderRadius: 10,
    marginBottom: 8,
    padding: 8,
    maxWidth: "80%",
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#00A54B",
  },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#ddd",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: "#064E41",
    padding: 10,
    borderRadius: 20,
  },
});
