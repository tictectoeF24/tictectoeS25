import React, { useState, useRef, useEffect } from "react";
import { Animated, View, Text, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL_IN_CONFIG } from "../../config";
import { getCurrentUserInfo } from "./functions/userUtils";

// Debug: Log the backend URL to verify config is loaded
console.log("FloatingChatbot - Backend URL:", BASE_URL_IN_CONFIG);

const FloatingChatbot = ({ context, pdfUrl, paperId, paperTitle, paperDoi, visible, onClose, isEmbedded = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfContext, setPdfContext] = useState("");
  const [fetchingPdf, setFetchingPdf] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);
  const scrollViewRef = useRef(null);

  // Pre-typed question suggestions
  const allQuestionSuggestions = [
    "What is the main contribution of this paper?",
    "Can you summarize the key findings?",
    "What methodology was used in this research?",
    "What are the limitations of this study?",
    "Who are the authors?",
    "What is the significance of this research?",
  ];
  
  const [availableQuestions, setAvailableQuestions] = useState(allQuestionSuggestions);

  const widthAnim = useRef(new Animated.Value(56)).current;
  const heightAnim = useRef(new Animated.Value(56)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Load user info on component mount
  useEffect(() => {
    getCurrentUserInfo().then(userInfo => {
      console.log('FloatingChatbot - User info loaded:', userInfo);
      setCurrentUser(userInfo);
    }).catch(error => {
      console.error('FloatingChatbot - Error loading user info:', error);
    });
  }, []);

  // Load chat history when component mounts
  useEffect(() => {
    if ((paperId && isOpen) || (paperId && visible)) {
      loadChatHistory();
    }
  }, [paperId, isOpen, visible]);

  // Fetch PDF text for context if pdfUrl is provided
  useEffect(() => {
    if (!pdfUrl) return;
    setFetchingPdf(true);
    axios.post(`${BASE_URL_IN_CONFIG}/utilities/extract-pdf-text`, { url: pdfUrl })
      .then(res => setPdfContext(res.data.text || ""))
      .catch(() => setPdfContext(""))
      .finally(() => setFetchingPdf(false));
  }, [pdfUrl]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      setLoadingHistory(true);
      
      console.log('Loading chat history for paper:', paperId);

      // Get current user's ID for private chat filtering
      const userInfo = await getCurrentUserInfo();
      const userId = userInfo?.userId;
      
      console.log('Loading private chat history for user:', userId);

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
        
        console.log(`Loaded ${formattedMessages.length} private messages from ${chatHistory.length} chat exchanges`);
        setMessages(formattedMessages);
        setShowWelcomeMessage(false); // Hide welcome message if there's existing chat history
        setAvailableQuestions(allQuestionSuggestions); // Reset questions for existing chats
      } else {
        // Keep the default welcome message if no existing history
        console.log('No existing private chat history, keeping welcome message');
        setShowWelcomeMessage(true); // Show welcome message for new chats
        setAvailableQuestions(allQuestionSuggestions); // Reset questions for new chats
      }

    } catch (error) {
      console.error('Error loading chat history:', error);
      setShowWelcomeMessage(true); // Show welcome message even if there's an error
      setAvailableQuestions(allQuestionSuggestions); // Reset questions even if there's an error
    } finally {
      setLoadingHistory(false);
    }
  };

  const saveChatExchange = async (question, answer) => {
    if (!paperId) {
      console.log('No paper ID, skipping chat save');
      return;
    }

    try {
      console.log('Saving chat exchange for paper:', paperId);
      
      // Get current user info for saving
      const userInfo = currentUser || await getCurrentUserInfo();
      console.log('FloatingChatbot - User info for saving:', userInfo);
      
      const requestData = {
        paperId,
        question,
        answer,
        userId: userInfo?.userId,
        username: userInfo?.username || userInfo?.email?.split('@')[0] || `User-${userInfo?.userId?.slice(-8)}` || 'Anonymous User'
      };
      
      console.log('FloatingChatbot - Request data:', requestData);
      
      await axios.post(`${BASE_URL_IN_CONFIG}/api/conversations/save-exchange`, requestData);
      console.log('Chat exchange saved successfully');
    } catch (error) {
      console.error('Error saving chat exchange:', error);
    }
  };

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

  // Handle visibility from props (for modal usage) or embedded mode
  useEffect(() => {
    if (visible !== undefined || isEmbedded) {
      const newState = isEmbedded ? true : visible;
      setIsOpen(newState);
      if (!isEmbedded) {
        animateChat(newState);
      }
    }
  }, [visible, isEmbedded]);

  const toggleChat = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    animateChat(newState);
    
    // Call onClose if provided and we're closing
    if (!newState && onClose) {
      onClose();
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setShowWelcomeMessage(false); // Hide welcome message once user starts chatting
    
    const userMessage = input;
    setInput("");

    // Get current user info
    const userInfo = currentUser || await getCurrentUserInfo();

    // Add user message to conversation with user info and timestamp
    setMessages((prev) => [
      ...prev,
      { 
        content: userMessage, 
        from: "user",
        username: userInfo?.username || userInfo?.email?.split('@')[0] || 'You',
        timestamp: new Date().toISOString(),
        userId: userInfo?.userId
      },
    ]);

    // Retry logic for handling overloaded model
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    while (retryCount < maxRetries) {
      try {
        // Use PDF text as context if available, else fallback to prop context
        const chatContext = pdfContext || context || "General academic paper discussion";
        
        console.log(`Attempt ${retryCount + 1}: Sending request to:`, `${BASE_URL_IN_CONFIG}/api/chatbot`);
        console.log("Request payload:", {
          question: userMessage,
          context: chatContext ? chatContext.substring(0, 100) + "..." : "No context"
        });
        
        const res = await axios.post(`${BASE_URL_IN_CONFIG}/api/chatbot`, {
          question: userMessage,
          context: chatContext,
        });
        
        console.log("Response received:", res.data);
        
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

        // Save the complete chat exchange to database
        await saveChatExchange(userMessage, aiResponse);
        break;

      } catch (err) {
        console.error(`Chatbot error (attempt ${retryCount + 1}):`, err);
        console.error("Error response:", err.response?.data);
        console.error("Error message:", err.message);
        
        retryCount++;
        
        // Check if it's a 503 overloaded error
        const is503Error = err.response?.status === 503 || 
                           err.response?.data?.error?.includes('overloaded') ||
                           err.message?.includes('overloaded');
        
        if (is503Error && retryCount < maxRetries) {
          // Add retry message
          setMessages((prev) => [
            ...prev,
            { 
              content: `⏳ AI service is busy (attempt ${retryCount}/${maxRetries}). Retrying in ${retryDelay/1000} seconds...`, 
              from: "ai",
              timestamp: new Date().toISOString(),
              isRetryMessage: true
            },
          ]);
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          
          // Remove retry message before next attempt
          setMessages((prev) => prev.filter(msg => !msg.isRetryMessage));
          
          continue; // Try again
        }
        
        // If not a 503 error or max retries reached, handle the error
        let errorMessage = "I'm sorry, but I'm having trouble connecting to the AI service right now. ";
        
        if (is503Error) {
          errorMessage = "🚦 The AI service is currently overloaded. This is a temporary issue on Google's end. Please try again in a few minutes, or try asking a simpler question.";
        } else if (err.response?.data?.error) {
          errorMessage = `Error: ${err.response.data.error}`;
        } else if (err.message) {
          errorMessage = `Error: ${err.message}`;
        } else {
          errorMessage += "Please try again later.";
        }
        
        setMessages((prev) => [
          ...prev,
          { 
            content: errorMessage, 
            from: "ai",
            timestamp: new Date().toISOString()
          },
        ]);

        // Save error exchange too
        await saveChatExchange(userMessage, errorMessage);
        break; // Exit retry loop on non-503 errors or max retries reached
      }
    }
    
    setLoading(false);
  };

  // Handle suggestion tap
  const handleSuggestionTap = (suggestion) => {
    setInput(suggestion);
    setShowWelcomeMessage(false); // Hide welcome message when suggestion is tapped
    // Remove the selected question from available questions
    setAvailableQuestions(prev => prev.filter(q => q !== suggestion));
  };

  return (
    <Animated.View
      style={isEmbedded ? styles.embeddedContainer : {
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
      {!isOpen && !isEmbedded ? (
        <TouchableOpacity
          style={{
            width: 56,
            height: 56,
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={toggleChat}
        >
          <FontAwesome name="android" size={24} color="#fff" />
        </TouchableOpacity>
      ) : (
        <Animated.View style={isEmbedded ? styles.embeddedContent : { flex: 1, opacity: opacityAnim }}>
          {/* Header */}
          {!isEmbedded && (
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
          )}

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={isEmbedded ? {
              flex: 1,
              padding: 10,
              backgroundColor: "#f5f5f5",
            } : {
              flex: 1,
              padding: 10,
              backgroundColor: "#f5f5f5",
            }}
            contentContainerStyle={{ paddingBottom: 60 }}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            onContentSizeChange={() => {
              if (scrollViewRef.current) {
                scrollViewRef.current.scrollToEnd({ animated: true });
              }
            }}
          >
            {fetchingPdf && (
              <View
                style={{
                  alignItems: "center",
                  marginVertical: 10,
                  padding: 8,
                  backgroundColor: "#e3f2fd",
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "#1976d2", fontSize: 12 }}>
                  📄 Parsing PDF for context...
                </Text>
              </View>
            )}
            {loadingHistory && (
              <View
                style={{
                  alignItems: "center",
                  marginVertical: 10,
                  padding: 8,
                  backgroundColor: "#fff3cd",
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "#856404", fontSize: 12 }}>
                  💬 Loading chat history...
                </Text>
              </View>
            )}
            {/* Welcome Message with Question Suggestions */}
            {showWelcomeMessage && messages.length === 0 && !loadingHistory && availableQuestions.length > 0 && (
              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: "#ddd",
                  borderRadius: 10,
                  marginBottom: 8,
                  padding: 12,
                  maxWidth: "85%",
                }}
              >
                <Text style={{ color: "#333", fontSize: 14, marginBottom: 8 }}>
                  Hi there! 👋 I'm here to help you understand this research paper. You can ask me anything, or try one of these questions:
                </Text>
                {availableQuestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={suggestion}
                    style={{
                      backgroundColor: "#e3f2fd",
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderRadius: 6,
                      marginVertical: 3,
                      borderWidth: 1,
                      borderColor: "#bbdefb",
                    }}
                    onPress={() => handleSuggestionTap(suggestion)}
                  >
                    <Text
                      style={{
                        color: "#1976d2",
                        fontSize: 13,
                        fontWeight: "500",
                      }}
                    >
                       {suggestion}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {messages.map((msg, index) => (
              <View
                key={index}
                style={{
                  alignSelf: msg.from === "user" ? "flex-end" : "flex-start",
                  backgroundColor: msg.from === "user" ? "#00A54B" : "#ddd",
                  borderRadius: 10,
                  marginBottom: 8,
                  padding: 8,
                  maxWidth: "80%",
                }}
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
                  style={{
                    color: msg.from === "user" ? "#fff" : "#333",
                    fontSize: 14,
                  }}
                >
                  {msg.content}
                </Text>
              </View>
            ))}
            {loading && (
              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: "#ddd",
                  borderRadius: 10,
                  marginBottom: 8,
                  padding: 8,
                  maxWidth: "80%",
                }}
              >
                <Text style={{ color: "#333", fontSize: 14 }}>
                  AI is thinking...
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View
            style={isEmbedded ? styles.embeddedInputContainer : {
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
              onChangeText={(text) => {
                setInput(text);
                // Show welcome message again if input is cleared and there are available questions and no existing messages
                if (!text.trim() && availableQuestions.length > 0 && messages.length === 0) {
                  setShowWelcomeMessage(true);
                }
              }}
              placeholder="Ask about this paper..."
              style={{
                flex: 1,
                height: 40,
                borderColor: "#ccc",
                borderWidth: 1,
                borderRadius: 20,
                paddingHorizontal: 12,
                fontSize: 14,
              }}
              onSubmitEditing={handleSend}
              editable={!loading && !fetchingPdf && !loadingHistory}
              multiline={false}
            />
            <TouchableOpacity
              onPress={handleSend}
              style={{
                marginLeft: 8,
                backgroundColor: (loading || fetchingPdf || loadingHistory) ? "#aaa" : "#064E41",
                padding: 10,
                borderRadius: 20,
              }}
              disabled={loading || fetchingPdf || loadingHistory || !input.trim()}
            >
              <FontAwesome name="send" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = {
  embeddedContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    flexDirection: "column",
    height: '100%',
  },
  embeddedContent: {
    flex: 1,
    flexDirection: "column",
    height: '100%',
  },
  embeddedInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    backgroundColor: "#fff",
    flexShrink: 0,
  },
};

export default FloatingChatbot;