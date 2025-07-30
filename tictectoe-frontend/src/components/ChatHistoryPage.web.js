import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  ActivityIndicator,
  Dimensions
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { BASE_URL_IN_CONFIG } from "../../config";
import { getCurrentUserInfo } from "./functions/userUtils";
import FloatingChatbot from './FloatingChatbot';

const ChatHistoryPage = () => {
  const navigation = useNavigation();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [chatbotVisible, setChatbotVisible] = useState(false);

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
      console.error('ChatHistoryPage - Failed to load user info:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async (userId) => {
    try {
      console.log('ChatHistoryPage - Loading conversations for user:', userId);
      
      const response = await axios.get(`${BASE_URL_IN_CONFIG}/api/conversations/user/${userId}`);
      const conversationsData = response.data.conversations || [];
      
      // Group conversations by paper and sort by most recent
      const groupedConversations = conversationsData.reduce((acc, conv) => {
        const paperId = conv.paper_id;
        if (!acc[paperId]) {
          acc[paperId] = {
            paperId: paperId,
            paperTitle: conv.paper_title || `Research Paper ${paperId}`,
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
      
      // Auto-select the first conversation if available
      if (sortedConversations.length > 0) {
        setSelectedConversation(sortedConversations[0]);
        setChatbotVisible(true);
      }
      
      console.log(`ChatHistoryPage - Loaded ${sortedConversations.length} conversation groups`);
      
    } catch (error) {
      console.error('ChatHistoryPage - Failed to load conversations:', error);
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

  const selectConversation = (conversation) => {
    console.log('ChatHistoryPage - Selecting conversation:', conversation.paperTitle);
    setSelectedConversation(conversation);
    setChatbotVisible(true);
  };

  const handleBackToExplore = () => {
    navigation.navigate('Explore');
  };

  const renderSidebar = () => (
    <View style={styles.sidebar}>
      {/* Header - Fixed at top */}
      <View style={styles.sidebarHeader}>
        <TouchableOpacity 
          onPress={handleBackToExplore}
          style={styles.backButton}
        >
          <FontAwesome name="arrow-left" size={20} color="#333" />
          <Text style={styles.backButtonText}>
            Back to Explore
          </Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <View style={styles.sidebarScrollContainer}>
        <View style={styles.sidebarTitleContainer}>
          <Text style={styles.sidebarTitle}>
            Chat History
          </Text>
          <Text style={styles.conversationCount}>
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#057B34" />
            <Text style={styles.loadingText}>
              Loading...
            </Text>
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome name="comments-o" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>
              No Chat History
            </Text>
            <Text style={styles.emptyText}>
              Start a conversation with a paper to see your chat history here.
            </Text>
          </View>
        ) : (
          <View style={styles.conversationsContainer}>
            <ScrollView 
              style={styles.conversationsList} 
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.conversationsListContent}
              nestedScrollEnabled={true}
              bounces={true}
              scrollEventThrottle={16}
            >
              {conversations.map((conversation) => (
                <TouchableOpacity
                  key={conversation.paperId.toString()}
                  style={[
                    styles.conversationItem,
                    selectedConversation?.paperId === conversation.paperId && styles.selectedConversationItem
                  ]}
                  onPress={() => selectConversation(conversation)}
                >
                  <Text 
                    style={[
                      styles.conversationTitle, 
                      selectedConversation?.paperId === conversation.paperId && styles.selectedText
                    ]} 
                    numberOfLines={2}
                  >
                    {conversation.paperTitle}
                  </Text>
                  <View style={styles.conversationMeta}>
                    <Text style={[
                      styles.messageCount, 
                      selectedConversation?.paperId === conversation.paperId && styles.selectedSecondaryText
                    ]}>
                      {conversation.totalMessages} messages
                    </Text>
                    <Text style={[
                      styles.lastActivity, 
                      selectedConversation?.paperId === conversation.paperId && styles.selectedSecondaryText
                    ]}>
                      {formatDate(conversation.lastActivity)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );

  const renderChatArea = () => (
    <View style={styles.chatArea}>
      {selectedConversation && chatbotVisible ? (
        <View style={styles.fullChatContainer}>
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <View style={styles.chatHeaderContent}>
              <Text style={styles.chatPaperTitle} numberOfLines={1}>
                {selectedConversation.paperTitle}
              </Text>
              <Text style={styles.chatPaperMeta}>
                {selectedConversation.totalMessages} messages • {formatDate(selectedConversation.lastActivity)}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => setChatbotVisible(false)}
              style={styles.closeChatButton}
            >
              <FontAwesome name="times" size={20} color="#333" />
            </TouchableOpacity>
          </View>
          
          {/* Chat Content */}
          <View style={styles.chatContentContainer}>
            <FloatingChatbot
              visible={true}
              onClose={() => {
                setChatbotVisible(false);
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
              isEmbedded={true}
            />
          </View>
        </View>
      ) : (
        <View style={styles.noChatSelected}>
          <FontAwesome name="comments" size={64} color="#ccc" />
          <Text style={styles.noChatTitle}>
            Select a Conversation
          </Text>
          <Text style={styles.noChatText}>
            Choose a chat from the sidebar to continue your conversation with AI about research papers.
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <LinearGradient
      colors={["#064E41", "#3D8C45"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {renderSidebar()}
          {renderChatArea()}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100vh',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  sidebar: {
    width: 400,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    flexDirection: 'column',
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexShrink: 0,
  },
  sidebarScrollContainer: {
    flex: 1,
    flexDirection: 'column',
    height: 'calc(100vh - 80px)', 
    maxHeight: 'calc(100vh - 80px)',
    overflow: 'hidden', 
  },
  sidebarTitleContainer: {
    padding: 20,
    paddingBottom: 0,
    flexShrink: 0,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  themeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  sidebarContent: {
    flex: 1,
    padding: 20,
  },
  sidebarTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  conversationCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  conversationsContainer: {
    flex: 1,
    maxHeight: 'calc(100vh - 200px)', 
    minHeight: 300, 
  },
  conversationsList: {
    flex: 1,
    paddingHorizontal: 20,
    maxHeight: '100%', 
  },
  conversationsListContent: {
    paddingBottom: 20,
    flexGrow: 1, 
  },
  conversationItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    transition: 'all 0.2s ease',
    flexShrink: 0,
    minHeight: 80, 
  },
  selectedConversationItem: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976d2',
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  selectedText: {
    color: '#1976d2',
  },
  conversationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageCount: {
    fontSize: 12,
    color: '#666',
  },
  lastActivity: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  selectedSecondaryText: {
    color: '#1565c0',
  },
  chatArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    position: 'relative',
    height: '100vh',
    overflow: 'hidden',
  },
  fullChatContainer: {
    flex: 1,
    flexDirection: 'column',
    height: '100%',
  },
  chatHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  chatContentContainer: {
    flex: 1,
    height: 'calc(100vh - 100px)', 
    minHeight: 0, 
  },
  chatHeaderContent: {
    flex: 1,
  },
  chatPaperTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  chatPaperMeta: {
    fontSize: 14,
    color: '#666',
  },
  closeChatButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginLeft: 12,
  },
  noChatSelected: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noChatTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  noChatText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 400,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});

export default ChatHistoryPage;
