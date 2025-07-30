import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  ActivityIndicator,
  FlatList,
  Alert 
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import { BASE_URL_IN_CONFIG } from "../../config";
import { getCurrentUserInfo } from "./functions/userUtils";
import MobileChatbot from './MobileChatbot';

const ChatHistory = () => {
  const navigation = useNavigation();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [chatbotVisible, setChatbotVisible] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    loadUserAndConversations();
  }, []);

  const loadUserAndConversations = async () => {
    try {
      setLoading(true);
      
      // Get current user info
      const userInfo = await getCurrentUserInfo();
      setCurrentUser(userInfo);
      
      // Load user's conversations
      if (userInfo?.userId) {
        await loadConversations(userInfo.userId);
      }
    } catch (error) {
      console.error('ChatHistory - Failed to load user info:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async (userId) => {
    try {
      console.log('ChatHistory - Loading conversations for user:', userId);
      
      const response = await axios.get(`${BASE_URL_IN_CONFIG}/api/conversations/user/${userId}`);
      const conversationsData = response.data.conversations || [];
      
      // Group conversations by paper and sort by most recent
      const groupedConversations = conversationsData.reduce((acc, conv) => {
        const paperId = conv.paper_id;
        if (!acc[paperId]) {
          acc[paperId] = {
            paperId: paperId,
            paperTitle: conv.paper_title || `Paper ${paperId}`,
            paperDoi: conv.paper_doi,
            pdfUrl: generatePdfUrl(conv.paper_doi),
            conversations: [],
            lastActivity: conv.created_at,
            totalMessages: 0
          };
        }
        acc[paperId].conversations.push(conv);
        acc[paperId].totalMessages += 1;
        
        // Update last activity if this conversation is more recent
        if (new Date(conv.created_at) > new Date(acc[paperId].lastActivity)) {
          acc[paperId].lastActivity = conv.created_at;
        }
        
        return acc;
      }, {});

      // Convert to array and sort by last activity
      const sortedConversations = Object.values(groupedConversations)
        .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

      setConversations(sortedConversations);
      console.log(`ChatHistory - Loaded ${sortedConversations.length} conversation groups`);
      
    } catch (error) {
      console.error('ChatHistory - Failed to load conversations:', error);
      setConversations([]);
    }
  };

  const generatePdfUrl = (doi) => {
    if (doi) {
      const arxivMatch = doi.match(/arXiv\.(\d+\.\d+)/);
      if (arxivMatch) {
        return `https://arxiv.org/pdf/${arxivMatch[1]}.pdf`;
      }
      const documentId = doi.split("/").pop();
      if (documentId) {
        return `https://arxiv.org/pdf/${documentId}.pdf`;
      }
    }
    return null;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const openChatForPaper = (conversation) => {
    console.log('ChatHistory - Opening chat for paper:', conversation.paperTitle);
    setSelectedConversation(conversation);
    setChatbotVisible(true);
  };

  const renderConversationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => openChatForPaper(item)}
    >
      <View style={styles.conversationHeader}>
        <Text style={styles.paperTitle} numberOfLines={2}>
          {item.paperTitle}
        </Text>
        <Text style={styles.lastActivity}>
          {formatDate(item.lastActivity)}
        </Text>
      </View>
      <View style={styles.conversationMeta}>
        <Text style={styles.messageCount}>
          {item.totalMessages} messages
        </Text>
        <MaterialIcons name="chat" size={16} color="#666" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <FontAwesome name="comments-o" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Chat History</Text>
      <Text style={styles.emptyText}>
        Start a conversation with a paper to see your chat history here.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#057B34" />
          <Text style={styles.loadingText}>Loading chat history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chat History</Text>
        <Text style={styles.subtitle}>
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {conversations.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.paperId.toString()}
          style={styles.conversationsList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.conversationsContent}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => navigation.navigate("Explore")}
        >
          <FontAwesome name="compass" size={20} color="white" />
          <Text style={styles.exploreButtonText}>Explore</Text>
        </TouchableOpacity>
      </View>

      {/* Chat Modal */}
      {chatbotVisible && selectedConversation && (
        <MobileChatbot
          visible={chatbotVisible}
          onClose={() => {
            setChatbotVisible(false);
            setSelectedConversation(null);
            // Refresh conversations after chat
            if (currentUser?.userId) {
              loadConversations(currentUser.userId);
            }
          }}
          context=""
          pdfUrl={selectedConversation.pdfUrl}
          paperId={selectedConversation.paperId}
          paperTitle={selectedConversation.paperTitle}
          paperDoi={selectedConversation.paperDoi}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  conversationsList: {
    flex: 1,
  },
  conversationsContent: {
    paddingBottom: 100, // Space for footer button
  },
  conversationItem: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  paperTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },
  lastActivity: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  conversationMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  messageCount: {
    fontSize: 12,
    color: "#888",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 100, // Space for footer
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  exploreButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#057B34",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  exploreButtonText: {
    color: "white",
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "600",
  },
});

export default ChatHistory;