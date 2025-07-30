import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import axios from "axios";
import { BASE_URL_IN_CONFIG } from "../../config";
import { getCurrentUserInfo } from "./functions/userUtils";

const MobileChatbot = ({ visible, onClose, context, pdfUrl, paperId, paperTitle, paperDoi }) => {
  const [messages, setMessages] = useState([
    { content: "Hi there! How can I help you with this paper?", from: "ai" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfContext, setPdfContext] = useState("");
  const [fetchingPdf, setFetchingPdf] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Pre-typed question suggestions
  const questionSuggestions = [
    "What is the main contribution of this paper?",
    "Can you summarize the key findings?",
    "What methodology was used in this research?",
    "What are the limitations of this study?",
    "How does this relate to previous work?",
    "What are the practical applications?",
  ];

  // Load user info on component mount (non-blocking)
  useEffect(() => {
    getCurrentUserInfo().then(userInfo => {
      console.log('MobileChatbot - User info loaded:', userInfo);
      setCurrentUser(userInfo);
    }).catch(error => {
      console.warn('MobileChatbot - User info failed (non-critical):', error.message);
      // Don't block anything if user info fails
    });
  }, []);

  // Load chat history when component becomes visible (non-blocking)
  useEffect(() => {
    if (visible && paperId) {
      loadChatHistory();
    } else if (visible) {
      // Reset suggestions when opening a new chat
      setShowSuggestions(true);
    }
  }, [visible, paperId]);

  // Fetch PDF text for context if pdfUrl is provided
  useEffect(() => {
    if (!pdfUrl) {
      console.log("Mobile Chatbot - No PDF URL provided");
      return;
    }
    console.log("Mobile Chatbot - Fetching PDF text from:", pdfUrl);
    setFetchingPdf(true);
    axios
      .post(`${BASE_URL_IN_CONFIG}/utilities/extract-pdf-text`, { url: pdfUrl })
      .then((res) => {
        console.log("Mobile Chatbot - PDF text extracted, length:", res.data?.text?.length || 0);
        setPdfContext(res.data.text || "");
      })
      .catch((err) => {
        console.error("Mobile Chatbot - PDF extraction failed:", err.message);
        setPdfContext("");
      })
      .finally(() => setFetchingPdf(false));
  }, [pdfUrl]);

  const loadChatHistory = async () => {
    try {
      setLoadingHistory(true);
      
      console.log('Mobile Chatbot - Loading chat history for paper:', paperId);

      // Get current user's ID for private chat filtering
      const userInfo = await getCurrentUserInfo();
      const userId = userInfo?.userId;
      
      console.log('Mobile Chatbot - Loading private chat history for user:', userId);

      // Load existing chat history with user filtering for private chats
      const url = userId 
        ? `${BASE_URL_IN_CONFIG}/api/conversations/paper/${paperId}?userId=${userId}`
        : `${BASE_URL_IN_CONFIG}/api/conversations/paper/${paperId}`;
      
      const response = await axios.get(url);
      const chatHistory = response.data.chatHistory;

      if (chatHistory.length > 0) {
        // Convert chat history to message format (question/answer pairs)
        const formattedMessages = [];
        
        chatHistory.forEach(chat => {
          // Add user question with user info and timestamp
          formattedMessages.push({
            content: chat.question,
            from: "user",
            username: chat.username || 'Unknown User',
            timestamp: chat.question_timestamp || chat.created_at,
            userId: chat.user_id
          });
          // Add AI answer
          formattedMessages.push({
            content: chat.answer,
            from: "ai",
            timestamp: chat.created_at
          });
        });
        
        console.log(`Mobile Chatbot - Loaded ${formattedMessages.length} private messages from ${chatHistory.length} chat exchanges`);
        setMessages(formattedMessages);
        setShowSuggestions(false); // Hide suggestions if there's existing chat history
      } else {
        // Keep the default welcome message if no existing history
        console.log('Mobile Chatbot - No existing private chat history, keeping welcome message');
        setShowSuggestions(true); // Show suggestions for new chats
      }

    } catch (error) {
      console.warn('Mobile Chatbot - Chat history loading failed (non-critical):', error.message);
      
      // If it's a 404, it might just mean no chat history exists yet
      if (error.response?.status === 404) {
        console.log('Mobile Chatbot - No existing private chat history found (404), keeping welcome message');
        setShowSuggestions(true); // Show suggestions for new chats
      } else {
        console.log('Mobile Chatbot - Chat history error, showing suggestions anyway');
        setShowSuggestions(true); // Show suggestions even if there's an error
      }
      // Don't block the UI - just keep the welcome message
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setShowSuggestions(false); // Hide suggestions once user starts chatting
    
    const userMessage = input;
    setInput("");

    // Get current user info (use cached if available)
    const userInfo = currentUser || { username: 'You' };

    // Add user message to conversation with user info and timestamp
    setMessages((prev) => [
      ...prev,
      { 
        content: userMessage, 
        from: "user",
        username: userInfo.username || userInfo.email?.split('@')[0] || 'You',
        timestamp: new Date().toISOString(),
        userId: userInfo.userId
      },
    ]);

    try {
      const chatContext = pdfContext || context || "General academic paper discussion";

      console.log("Mobile Chatbot - Sending request to:", `${BASE_URL_IN_CONFIG}/api/chatbot`);
      console.log("Mobile Chatbot - Request payload:", {
        question: userMessage,
        context: chatContext ? chatContext.substring(0, 100) + "..." : "No context"
      });

      const res = await axios.post(`${BASE_URL_IN_CONFIG}/api/chatbot`, {
        question: userMessage,
        context: chatContext,
      });

      console.log("Mobile Chatbot - Response received:", res.data);
      
      const aiResponse = res.data.answer || "Sorry, I couldn't generate a response.";
      
      // Add AI response to conversation
      setMessages((prev) => [
        ...prev,
        { 
          content: aiResponse, 
          from: "ai",
          timestamp: new Date().toISOString()
        },
      ]);

      // Optional: Save chat exchange in background (non-blocking)
      if (paperId) {
        saveChatExchangeBackground(userMessage, aiResponse);
      }

    } catch (err) {
      console.error("Mobile Chatbot error:", err);
      console.error("Mobile Chatbot error response:", err.response?.data);
      console.error("Mobile Chatbot error message:", err.message);

      let errorMessage = "Error: Could not get response from Gemini.";
      if (err.response?.data?.error) {
        errorMessage = `Error: ${err.response.data.error}`;
      } else if (err.message) {
        errorMessage = `Error: ${err.message}`;
      }

      setMessages((prev) => [...prev, { content: errorMessage, from: "ai" }]);
    }
    setLoading(false);
  };

  // Background save function that won't block the UI
  const saveChatExchangeBackground = async (question, answer) => {
    try {
      console.log('Mobile Chatbot - Saving chat exchange in background');
      
      // Use current user info if available, fallback to anonymous
      const userInfo = currentUser || { userId: null, username: 'Anonymous User' };
      
      await axios.post(`${BASE_URL_IN_CONFIG}/api/conversations/save-exchange`, {
        paperId,
        question,
        answer,
        userId: userInfo.userId,
        username: userInfo.username || userInfo.email?.split('@')[0] || 'Anonymous User'
      });
      console.log('Mobile Chatbot - Chat saved successfully');
    } catch (error) {
      console.error('Mobile Chatbot - Background save failed (non-critical):', error.message);
    }
  };

  // Handle suggestion tap
  const handleSuggestionTap = (suggestion) => {
    setInput(suggestion);
    setShowSuggestions(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior="height"
        keyboardVerticalOffset={0}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Chat with AI ✨</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
                <FontAwesome name="times" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

          {/* Messages */}
          <ScrollView 
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {fetchingPdf && (
              <View style={styles.pdfIndicator}>
                <Text style={styles.pdfIndicatorText}>
                  📄 Parsing PDF for context...
                </Text>
              </View>
            )}
            {loadingHistory && (
              <View style={styles.pdfIndicator}>
                <Text style={styles.pdfIndicatorText}>
                  💬 Loading chat history...
                </Text>
              </View>
            )}
            {messages.map((msg, index) => (
              <View
                key={index}
                style={[
                  styles.messageBubble,
                  msg.from === "user" ? styles.userMessage : styles.aiMessage
                ]}
              >
                {/* Username and timestamp header */}
                {msg.from === "user" && msg.username && (
                  <View style={{ marginBottom: 4 }}>
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: "bold",
                        opacity: 0.9,
                      }}
                    >
                      {msg.username}
                    </Text>
                    {msg.timestamp && (
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 10,
                          opacity: 0.7,
                        }}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    )}
                  </View>
                )}
                
                {/* AI timestamp */}
                {msg.from === "ai" && msg.timestamp && (
                  <View style={{ marginBottom: 4 }}>
                    <Text
                      style={{
                        color: "#666",
                        fontSize: 10,
                        opacity: 0.7,
                      }}
                    >
                      AI • {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                )}

                <Text
                  style={[
                    styles.messageText,
                    msg.from === "user" ? styles.userText : styles.aiText
                  ]}
                >
                  {msg.content}
                </Text>
              </View>
            ))}
            {loading && (
              <View style={[styles.messageBubble, styles.aiMessage]}>
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#333" />
                  <Text style={[styles.messageText, styles.aiText, { marginLeft: 8 }]}>
                    AI is thinking...
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Question Suggestions */}
          {(() => {
            console.log('MobileChatbot - Suggestions debug:', {
              showSuggestions,
              messagesLength: messages.length,
              visible,
              paperId
            });
            return showSuggestions;
          })() && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>💡 Quick Questions</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsScrollContent}
              >
                {questionSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionChip}
                    onPress={() => handleSuggestionTap(suggestion)}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={(text) => {
                setInput(text);
                // Show suggestions again if input is cleared and showSuggestions is not explicitly false
                if (!text.trim() && messages.length <= 3) {
                  setShowSuggestions(true);
                }
              }}
              placeholder="Ask about this paper..."
              onSubmitEditing={handleSend}
              editable={!loading && !fetchingPdf}
              multiline={false}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (loading || fetchingPdf || !input.trim()) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={loading || fetchingPdf || !input.trim()}
            >
              <FontAwesome name="send" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "95%",
    height: "75%",
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  header: {
    backgroundColor: "#064E41",
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  closeIcon: {
    padding: 5,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  messagesContent: {
    padding: 15,
    paddingBottom: 10,
  },
  pdfIndicator: {
    alignItems: "center",
    marginVertical: 10,
    padding: 12,
    backgroundColor: "#e3f2fd",
    borderRadius: 10,
  },
  pdfIndicatorText: {
    color: "#1976d2",
    fontSize: 14,
    fontWeight: "500",
  },
  messageBubble: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 15,
    maxWidth: "85%",
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#00A54B",
  },
  aiMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#e0e0e0",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: "#fff",
  },
  aiText: {
    color: "#333",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  suggestionsContainer: {
    backgroundColor: "#f9f9f9",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  suggestionsScrollContent: {
    paddingRight: 15,
  },
  suggestionChip: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#bbdefb",
  },
  suggestionText: {
    color: "#1976d2",
    fontSize: 13,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  input: {
    flex: 1,
    height: 45,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#064E41",
    width: 45,
    height: 45,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#aaa",
  },
});

export default MobileChatbot;
