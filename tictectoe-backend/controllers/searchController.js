const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Search users by username or email
 */
exports.searchUsers = async (req, res) => {
  try {
    const { query, page, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Search query is required." });
    }

    const offset = (page - 1) * limit; // Pagination logic

    // Search in the "users" table where "username" or "email" matches the query
    const { data, error } = await supabase
      .from("users")
      .select("id, username, email, name, bio") // Fetch only required fields
      .or(`username.ilike.%${query}%, email.ilike.%${query}%`) // Case-insensitive search
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ error: "Database error", details: error });
    }

    return res.status(200).json({ users: data, total: data.length });
  } catch (error) {
    console.error("Search API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};