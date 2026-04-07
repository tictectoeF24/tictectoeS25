const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get note history for a paper
const getNoteHistory = async (req, res) => {
  try {
    const { paperId } = req.params;
    const { userId } = req.query; // Get userId from query params for private notes

    console.log(
      "Getting note history for paper:",
      paperId,
      "and user:",
      userId
    );

    let query = supabase
      .from("note_history")
      .select("note_id, created_at, title, body, user_id")
      .eq("paper_id", paperId)
      .order("created_at", { ascending: true });

    // Filter by user if userId is provided (for private notes)
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: noteHistory, error } = await query;

    if (error) {
      console.error("Error getting note history:", error);
      throw error;
    }

    console.log(
      `Found ${noteHistory?.length ||
        0} note entries for paper ${paperId} and user ${userId || "all users"}`
    );
    res.json({ noteHistory: noteHistory || [] });
  } catch (error) {
    console.error("Error getting note history:", error);
    res
      .status(500)
      .json({ error: "Failed to get note history", details: error.message });
  }
};

// Save a complete note (title + body)
const saveNote = async (req, res) => {
  try {
    const { paper_id, title, body, user_id } = req.body;

    console.log("Saving note exchange for paper:", paper_id);
    console.log("User:", user_id);

    const { data: noteEntry, error } = await supabase
      .from("note_history")
      .insert({
        paper_id: paper_id,
        title: title,
        body: body,
        user_id: user_id
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ noteEntry });
  } catch (error) {
    res.status(500).json({
      error: "Failed to save note exchange",
      details: error.message
    });
  }
};

// Get all note entries for a user (if you have user tracking)
const getAllNoteHistory = async (req, res) => {
  try {
    const { userId } = req.query;
    console.log(
      "Getting all note history",
      userId ? `for user: ${userId}` : ""
    );

    let query = supabase
      .from("note_history")
      .select("note_id, created_at, title, body, paper_id, user_id")
      .order("created_at", { ascending: false })
      .limit(100); // Limit to recent 100 entries

    // Filter by user if userId is provided
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: noteHistory, error } = await query;

    if (error) {
      console.error("Error getting all note history:", error);
      throw error;
    }

    console.log(`Found ${noteHistory.length} total note entries`);
    res.json({ noteHistory });
  } catch (error) {
    console.error("Error getting all note history:", error);
    res
      .status(500)
      .json({ error: "Failed to get note history", details: error.message });
  }
};

// Get some sample paper IDs for testing
const getSamplePapers = async (req, res) => {
  try {
    console.log("Getting sample papers for testing");

    // Try different possible column names
    const { data: papers, error } = await supabase
      .from("paper")
      .select("paper_id, title")
      .limit(5);

    if (error) {
      console.error("Error getting sample papers:", error);
      throw error;
    }

    console.log(`Found ${papers.length} sample papers`);
    res.json({ papers });
  } catch (error) {
    console.error("Error getting sample papers:", error);
    res
      .status(500)
      .json({ error: "Failed to get sample papers", details: error.message });
  }
};

// Get noteHistory by user ID
const getNoteHistoryByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get note history with paper information by joining with paper table
    const { data: noteHistory, error } = await supabase
      .from("note_history")
      .select(
        `
        note_id,
        paper_id,
        created_at,
        title,
        body,
        user_id,
        paper (
          paper_id,
          title,
          doi,
          summary,
          author_names
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error getting noteHistory by user:", error);
      throw error;
    }

    // Transform the data to include paper information from the join
    const formattedNoteHistory = noteHistory.map((conv) => ({
      ...conv,
      paper_title: conv.paper?.title || `Research Paper ${conv.paper_id}`,
      paper_doi: conv.paper?.doi,
      paper_summary: conv.paper?.summary,
      paper_authors: conv.paper?.author_names
    }));

    console.log(`Found ${noteHistory.length} noteHistory for user ${userId}`);

    res.json({ noteHistory: formattedNoteHistory });
  } catch (error) {
    console.error("Error getting noteHistory by user:", error);
    res
      .status(500)
      .json({ error: "Failed to get noteHistory", details: error.message });
  }
};

const getNotesByPaperAndUser = async (req, res) => {
  try {
    const { paperId, userId } = req.params;

    console.log("Getting notes for paper:", paperId, "and user:", userId);

    const { data: noteHistory, error } = await supabase
      .from("note_history")
      .select("note_id, created_at, title, body, user_id, paper_id")
      .eq("paper_id", paperId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error getting notes:", error);
      throw error;
    }

    console.log(
      `Found ${noteHistory.length} notes for paper ${paperId} and user ${userId}`
    );

    res.json({ noteHistory });
  } catch (error) {
    console.error("Error getting notes:", error);
    res.status(500).json({
      error: "Failed to get notes",
      details: error.message
    });
  }
};

// Delete note history for a paper (if needed)
const deleteNoteHistory = async (req, res) => {
  try {
    const { paperId } = req.params;

    console.log("Deleting note history for paper:", paperId);

    const { error } = await supabase
      .from("note_history")
      .delete()
      .eq("paper_id", paperId);

    if (error) {
      console.error("Error deleting note history:", error);
      throw error;
    }

    console.log("Note history deleted successfully for paper:", paperId);
    res.json({ message: "Note history deleted successfully" });
  } catch (error) {
    console.error("Error deleting note history:", error);
    res
      .status(500)
      .json({ error: "Failed to delete note history", details: error.message });
  }
};

module.exports = {
  getNoteHistory,
  saveNote,
  getAllNoteHistory,
  getSamplePapers,
  deleteNoteHistory,
  getNoteHistoryByUser,
  getNotesByPaperAndUser
};
