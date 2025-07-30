const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Follow a user
 */
exports.followUser = async (req, res) => {
  try {
    const { followingId } = req.body;
    const followerId = req?.user?.id;
    if (!followerId) {
      console.error("Follower ID is missing");
      return res.status(400).json({ error: "Follower ID is required" });
    }

    console.log("Follow Request Received - Follower:", followerId, "Following:", followingId);

    if (!followingId || !followerId) {
      console.error("Missing parameters - Follower:", followerId, "Following:", followingId);
      return res.status(400).json({ error: "Invalid request parameters" });
    }

    const { data: existingFollow, error: checkError } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .maybeSingle();

    if (checkError) {
      console.error("Follow check error:", checkError);
      return res.status(500).json({ error: "Database error", details: checkError });
    }

    if (existingFollow) {
      console.log("Already following:", followingId);
      return res.status(400).json({ error: "Already following this user" });
    }

    const { data, error } = await supabase
      .from("follows")
      .insert([{ follower_id: followerId, following_id: followingId }]);

    if (error) {
      console.error("Follow insert error:", error);
      return res.status(500).json({ error: "Database error", details: error });
    }

    console.log("Follow successful:", data);
    return res.status(200).json({ message: "Followed successfully", data });
  } catch (error) {
    console.error("Follow Error:", error);
    return res.status(500).json({ error: "Failed to follow user" });
  }
};


/**
 * Unfollow a user
 */
exports.unfollowUser = async (req, res) => {
  try {
    const followerId = req?.user?.id;
    const { followingId } = req.body;

    if (!followingId) {
      return res.status(400).json({ error: "User ID to unfollow is required." });
    }

    // Delete from followers table
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);

    if (error) {
      return res.status(500).json({ error: "Failed to unfollow user", details: error });
    }

    return res.status(200).json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error("Unfollow Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Check if a user is following another user
 */
exports.checkIfFollowing = async (req, res) => {
  try {
    const followerId = req?.user?.id; // Authenticated user
    const { userId: followingId } = req.params; // User being checked

    if (!followerId || !followingId) {
      return res.status(400).json({ error: "Invalid request parameters" });
    }

    // Query follows table
    const { data, error } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .maybeSingle();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: "Database error", details: error });
    }

    return res.status(200).json({ isFollowing: !!data });
  } catch (error) {
    console.error("Error checking follow status:", error);
    return res.status(500).json({ error: "Failed to check following status" });
  }
};

/**
 * Get the list of followers of a user
 */
// exports.getUserFollowers = async (req, res) => {  // farhans code
//     try {
//         const { userId } = req.params;

//         const { data, error } = await supabase
//             .from("follows")
//             .select("follower_id")
//             .eq("following_id", userId);

//         if (error) {
//             return res.status(500).json({ error: "Failed to fetch followers", details: error });
//         }

//         return res.json({ followers: data });
//     } catch (error) {
//         console.error("Get Followers Error:", error);
//         return res.status(500).json({ error: "Internal server error" });
//     }
// };

exports.getUserFollowers = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: follows, error: followError } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("following_id", userId);

    if (followError) return res.status(500).json({ error: "Failed to fetch followers", details: followError });

    const followerIds = follows.map(f => f.follower_id);

    const { data: users, error: userError } = await supabase
      .from("users")
      .select("id, name")
      .in("id", followerIds);

    if (userError) return res.status(500).json({ error: "Failed to fetch user details", details: userError });

    return res.json({ followers: users });
  } catch (error) {
    console.error("Get Followers Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get the list of users a specific user is following
 */
// exports.getUserFollowing = async (req, res) => {
//     try {
//         const { userId } = req.params;

//         const { data, error } = await supabase
//             .from("follows")
//             .select("following_id")
//             .eq("follower_id", userId);

//         if (error) {
//             return res.status(500).json({ error: "Failed to fetch following users", details: error });
//         }

//         return res.json({ following: data });
//     } catch (error) {
//         console.error("Get Following Error:", error);
//         return res.status(500).json({ error: "Internal server error" });
//     }
// };
exports.getUserFollowing = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: follows, error: followError } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId);

    if (followError) return res.status(500).json({ error: "Failed to fetch following users", details: followError });

    const followingIds = follows.map(f => f.following_id);

    const { data: users, error: userError } = await supabase
      .from("users")
      .select("id, name")
      .in("id", followingIds);

    if (userError) return res.status(500).json({ error: "Failed to fetch user details", details: userError });

    return res.json({ following: users });
  } catch (error) {
    console.error("Get Following Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/users/:id
exports.getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, username, name") // add more fields as needed
      .eq("id", id)
      .single();
    console.log("Incoming ID:", req.params.id);

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: "Failed to fetch user", details: error });
    }

    if (!data) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(data);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


