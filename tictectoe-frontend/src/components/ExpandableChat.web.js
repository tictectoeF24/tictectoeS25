import React, { useState, useRef } from "react";
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";

const ExpandableChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { content: "Hi there! How can I help you?", from: "ai" },
  ]);
  const [input, setInput] = useState("");

  const widthAnim = useRef(new Animated.Value(56)).current;
  const heightAnim = useRef(new Animated.Value(56)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const animateChat = (open) => {
    Animated.parallel([
      Animated.timing(widthAnim, {
        toValue: open ? 300 : 56,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(heightAnim, {
        toValue: open ? 400 : 56,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: open ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const toggleChat = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    animateChat(newState);
  };

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
    <Animated.View
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        width: widthAnim,
        height: heightAnim,
        borderRadius: 28,
        backgroundColor: isOpen ? "#ffffff" : "#064E41",
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
        overflow: "hidden",
        zIndex: 10000,
      }}
    >
      {!isOpen ? (
        <TouchableOpacity
          style={{
            width: 56,
            height: 56,
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={toggleChat}
        >
          <FontAwesome name="comments" size={24} color="#fff" />
        </TouchableOpacity>
      ) : (
        <Animated.View style={{ flex: 1, opacity: opacityAnim }}>
          {/* Header */}
          <View
            style={{
              backgroundColor: "#064E41",
              padding: 12,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
              Chat with AI ✨
            </Text>
            <TouchableOpacity onPress={toggleChat}>
              <FontAwesome name="times" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView
            style={{
              flex: 1,
              padding: 10,
              backgroundColor: "#f5f5f5",
            }}
            contentContainerStyle={{ paddingBottom: 60 }}
          >
            {messages.map((msg, index) => (
              <View
                key={index}
                style={{
                  alignSelf:
                    msg.from === "user" ? "flex-end" : "flex-start",
                  backgroundColor:
                    msg.from === "user" ? "#00A54B" : "#ddd",
                  borderRadius: 10,
                  marginBottom: 8,
                  padding: 8,
                  maxWidth: "80%",
                }}
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
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              flexDirection: "row",
              alignItems: "center",
              padding: 8,
              borderTopWidth: 1,
              borderTopColor: "#ccc",
              backgroundColor: "#fff",
            }}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Type your message..."
              style={{
                flex: 1,
                height: 40,
                borderColor: "#ccc",
                borderWidth: 1,
                borderRadius: 20,
                paddingHorizontal: 12,
              }}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              onPress={handleSend}
              style={{
                marginLeft: 8,
                backgroundColor: "#064E41",
                padding: 10,
                borderRadius: 20,
              }}
            >
              <FontAwesome name="send" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
};

export default ExpandableChat;
