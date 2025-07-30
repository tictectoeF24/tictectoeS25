const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Get chat history for a paper
const getChatHistory = async (req, res) => {
  try {
    const { paperId } = req.params;
    const { userId } = req.query; // Get userId from query params for private chats

    console.log('Getting chat history for paper:', paperId, 'and user:', userId);

    let query = supabase
      .from('chat_history')
      .select('chat_id, question, answer, created_at, user_id, username, question_timestamp')
      .eq('paper_id', paperId)
      .order('created_at', { ascending: true });

    // Filter by user if userId is provided (for private chats)
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: chatHistory, error } = await query;

    if (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }

    console.log(`Found ${chatHistory?.length || 0} chat entries for paper ${paperId} and user ${userId || 'all users'}`);
    res.json({ chatHistory: chatHistory || [] });
  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({ error: 'Failed to get chat history', details: error.message });
  }
};

// Save a complete chat exchange (question + answer)
const saveChatExchange = async (req, res) => {
  try {
    const { paperId, question, answer, userId, username } = req.body;

    console.log('Saving chat exchange for paper:', paperId);
    console.log('User:', userId, username);
    console.log('Question:', question.substring(0, 50) + '...');
    console.log('Answer:', answer.substring(0, 50) + '...');

    const { data: chatEntry, error } = await supabase
      .from('chat_history')
      .insert({
        paper_id: paperId,
        question: question,
        answer: answer,
        user_id: userId,
        username: username,
        question_timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving chat exchange:', error);
      throw error;
    }

    console.log('Chat exchange saved successfully:', chatEntry.chat_id);
    res.json({ chatEntry });
  } catch (error) {
    console.error('Error saving chat exchange:', error);
    res.status(500).json({ error: 'Failed to save chat exchange', details: error.message });
  }
};

// Get all chat entries for a user (if you have user tracking)
const getAllChatHistory = async (req, res) => {
  try {
    const { userId } = req.query;
    console.log('Getting all chat history', userId ? `for user: ${userId}` : '');

    let query = supabase
      .from('chat_history')
      .select('chat_id, question, answer, created_at, user_id, username, question_timestamp, paper_id')
      .order('created_at', { ascending: false })
      .limit(100); // Limit to recent 100 entries

    // Filter by user if userId is provided
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: chatHistory, error } = await query;

    if (error) {
      console.error('Error getting all chat history:', error);
      throw error;
    }

    console.log(`Found ${chatHistory.length} total chat entries`);
    res.json({ chatHistory });
  } catch (error) {
    console.error('Error getting all chat history:', error);
    res.status(500).json({ error: 'Failed to get chat history', details: error.message });
  }
};

// Get some sample paper IDs for testing
const getSamplePapers = async (req, res) => {
  try {
    console.log('Getting sample papers for testing');

    // Try different possible column names
    const { data: papers, error } = await supabase
      .from('paper')
      .select('paper_id, title')
      .limit(5);

    if (error) {
      console.error('Error getting sample papers:', error);
      throw error;
    }

    console.log(`Found ${papers.length} sample papers`);
    res.json({ papers });
  } catch (error) {
    console.error('Error getting sample papers:', error);
    res.status(500).json({ error: 'Failed to get sample papers', details: error.message });
  }
};

// Get conversations by user ID
const getConversationsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get chat history with paper information by joining with paper table
    const { data: conversations, error } = await supabase
      .from('chat_history')
      .select(`
        chat_id,
        paper_id,
        question,
        answer,
        created_at,
        user_id,
        username,
        question_timestamp,
        paper (
          paper_id,
          title,
          doi,
          summary,
          author_names
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting conversations by user:', error);
      throw error;
    }

    // Transform the data to include paper information from the join
    const formattedConversations = conversations.map(conv => ({
      ...conv,
      paper_title: conv.paper?.title || `Research Paper ${conv.paper_id}`,
      paper_doi: conv.paper?.doi,
      paper_summary: conv.paper?.summary,
      paper_authors: conv.paper?.author_names
    }));

    console.log(`Found ${conversations.length} conversations for user ${userId}`);
    
    res.json({ conversations: formattedConversations });
  } catch (error) {
    console.error('Error getting conversations by user:', error);
    res.status(500).json({ error: 'Failed to get conversations', details: error.message });
  }
};

// Delete chat history for a paper (if needed)
const deleteChatHistory = async (req, res) => {
  try {
    const { paperId } = req.params;

    console.log('Deleting chat history for paper:', paperId);

    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('paper_id', paperId);

    if (error) {
      console.error('Error deleting chat history:', error);
      throw error;
    }

    console.log('Chat history deleted successfully for paper:', paperId);
    res.json({ message: 'Chat history deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat history:', error);
    res.status(500).json({ error: 'Failed to delete chat history', details: error.message });
  }
};

module.exports = {
  getChatHistory,
  saveChatExchange,
  getAllChatHistory,
  getSamplePapers,
  deleteChatHistory,
  getConversationsByUser
};