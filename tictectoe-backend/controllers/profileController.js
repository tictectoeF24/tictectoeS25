const supabase = require('@supabase/supabase-js').createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const jwt = require('jsonwebtoken');
const { generateEmbeddingForUserInterest } = require('./paperController');
require('dotenv').config();

exports.updateProfile = async (req, res) => {
  try {
    const userId = req?.user?.id;
    if (!userId) {
      console.error("userId is missing");
      return res.status(400).json({ error: "userId is required" });
    }
    const { username, name, email, bio } = req.body;

    // Perform the update
    const { error: updateError } = await supabase
      .from('users')
      .update({ username, name, email, bio })
      .eq('id', userId);

    if (updateError) {
      return res.status(500).json({ message: 'Error updating profile', error: updateError });
    }

    // Fetch the updated profile
    const { data: updatedProfile, error: fetchError } = await supabase
      .from('users')
      .select('username, name, email, bio')
      .eq('id', userId)
      .single();

    if (fetchError) {
      return res.status(500).json({ message: 'Error fetching updated profile', error: fetchError });
    }

    return res.status(200).json({ message: 'Profile updated successfully', data: updatedProfile });
  } catch (error) {
    res.status(500).json({ message: 'Unexpected error updating profile', error });
  }
};

exports.updateInterests = async (req, res) => {

  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "Unauthorized: User ID not found" });
  }
  const user_id = req.user.id;
  const { interests } = req.body;

  if (!interests || interests.length < 2) {
    return res.status(400).json({ message: "At least two interests are required." });
  }

  try {
    const interestsJson = JSON.stringify(interests);

    const { data, error } = await supabase
      .from('users')
      .update({ user_interest: interestsJson })
      .eq('id', user_id);

    if (error) {
      throw error;
    }

    // Call to generate embeddings after updating interests
    try {
      await generateEmbeddingForUserInterest(user_id);
    } catch (embeddingError) {
      console.error('Failed to generate interest embeddings:', embeddingError);
      // Handle embedding errors appropriately, maybe roll back the interest update?
    }

    res.status(200).json({ message: "Interests updated successfully", data });
  } catch (error) {
    console.error('Failed to update interests:', error);
    res.status(500).json({ message: 'Failed to update interests', error: error.message });
  }
};


///////// ORCID authentication fucntion
const axios = require("axios");

// ORCID API credentials from .env file
const ORCID_CLIENT_ID = process.env.ORCID_CLIENT_ID;
const ORCID_CLIENT_SECRET = process.env.ORCID_CLIENT_SECRET;
const ORCID_REDIRECT_URI = process.env.ORCID_REDIRECT_URI;



exports.handleOrcidCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    console.log("No authorization code received");
    return res.status(400).json({ error: "Authorization code is missing" });
  }

  try {
    console.log("Received ORCID Authorization Code:", code);

    // Exchange Authorization Code for Access Token
    const tokenResponse = await axios.post("https://orcid.org/oauth/token", null, {
      params: {
        client_id: ORCID_CLIENT_ID,
        client_secret: ORCID_CLIENT_SECRET,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: ORCID_REDIRECT_URI,
      },
      headers: {
        Accept: "application/json",
      },
    });

    console.log("ORCID Token Response:", tokenResponse.data);
    const { access_token, refresh_token, orcid, name } = tokenResponse.data;

    if (!orcid) {
      console.log("ORCID ID is missing in response!");
      return res.status(500).json({ error: "Failed to obtain ORCID ID from ORCID" });
    }

    // Step 1: Check if a user with this ORCID ID already exists
    let { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("orcid", orcid)
      .single();

    if (fetchError) {
      console.log("🟡 No existing ORCID user found, checking by name/email...");
    }

    // Step 2: If ORCID user does NOT exist, check by name or email
    if (!existingUser) {
      const { data: matchedUser, error: matchError } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("name", name) // Match by name (or change to email if needed)
        .single();

      if (!matchError && matchedUser) {
        existingUser = matchedUser; // Use the matched user
      }
    }

    if (existingUser) {
      console.log(`Matching user found: ${existingUser.name} (${existingUser.email})`);

      // Update the existing user with ORCID info
      const { error: updateError } = await supabase
        .from("users")
        .update({
          orcid: orcid,
          orcid_access_token: access_token,
          orcid_refresh_token: refresh_token,
          orcid_linked_at: new Date(),
        })
        .eq("id", existingUser.id);

      if (updateError) {
        console.error("Error updating user with ORCID:", updateError);
        return res.status(500).json({ error: "Failed to update user with ORCID info" });
      }

      return res.redirect(`http://localhost:8081/explore?userId=${existingUser.id}`);
    } else {
      console.log("No matching user found!");
      return res.status(400).json({ error: "No matching user found. Please ensure your name matches the ORCID record." });
    }

  } catch (error) {
    console.error("ORCID API Error Response:", error.response?.data || error.message);
    return res.status(500).json({
      error: "Failed to authenticate with ORCID",
      details: error.response?.data || error.message
    });
  }
};




// function to fetch publication
exports.fetchOrcidPublications = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "Missing user ID" });
  }

  // Get ORCID and token from database
  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("orcid, orcid_access_token")
    .eq("id", userId)
    .single();

  if (fetchError || !user.orcid) {
    return res.status(400).json({ error: "User ORCID not found" });
  }

  try {
    const response = await axios.get(`https://pub.orcid.org/v3.0/${user.orcid}/works`, {
      headers: {
        Authorization: `Bearer ${user.orcid_access_token}`,
        Accept: "application/json",
      },
    });

    return res.status(200).json({
      message: "Publications fetched successfully",
      publications: response.data.group || [],
    });

  } catch (error) {
    console.error("Error fetching ORCID publications:", error.response?.data || error.message);
    return res.status(500).json({ error: "Failed to fetch ORCID publications" });
  }
};

exports.claimAuthorship = async (req, res) => {
  console.log("🔹 Received Authorship Claim Request");

  // **Check if user ID is correctly extracted**
  if (!req.user || !req.user.id) {
    console.error("No user ID found in token");
    return res.status(403).json({ error: "Unauthorized: User ID missing" });
  }

  const userId = req?.user?.id;
  if (!userId) {
    console.error("User Id is missing");
    return res.status(400).json({ error: "User Id is required" });
  }
  console.log("Extracted User ID:", userId); // Debugging

  const { paperId } = req.body;
  if (!paperId) {
    return res.status(400).json({ error: "Missing paper ID" });
  }

  try {
    // Step 1: Get ORCID info for the user
    const { data: user, error: userFetchError } = await supabase
      .from("users")
      .select("orcid, orcid_access_token")
      .eq("id", userId)
      .single();

    if (userFetchError || !user?.orcid || !user?.orcid_access_token) {
      console.error("User ORCID details not found in database");
      return res.status(400).json({ error: "User ORCID details not found" });
    }

    // Step 2: Get user’s ORCID publications
    const pubResponse = await axios.get(`https://pub.orcid.org/v3.0/${user.orcid}/works`, {
      headers: {
        Authorization: `Bearer ${user.orcid_access_token}`,
        Accept: "application/json",
      },
    });

    const orcidPublications = pubResponse.data.group || [];

    // Step 3: Get the paper title from your DB
    const { data: paper, error: paperError } = await supabase
      .from("paper")
      .select("title")
      .eq("paper_id", paperId)
      .single();

    if (paperError || !paper) {
      return res.status(404).json({ error: "Paper not found in database" });
    }

    const paperTitle = paper.title.toLowerCase().trim();

    // Step 4: Match the title with ORCID publications
    const matchFound = orcidPublications.some((pub) => {
      const orcidTitle = pub["work-summary"]?.[0]?.title?.title?.value?.toLowerCase()?.trim();
      return orcidTitle && orcidTitle.includes(paperTitle);
    });

    if (!matchFound) {
      return res.status(403).json({
        error: "You are not listed as an author of this paper on ORCID.",
      });
    }

    // Ensure author_ids is an array (handle null case)
    let currentAuthors = paper.author_ids || [];

    if (!Array.isArray(currentAuthors)) {
      currentAuthors = []; // Initialize as an empty array if it's not an array
    }

    // Check if the user is already an author
    if (currentAuthors.includes(userId)) {
      return res.status(400).json({ error: "You have already claimed authorship" });
    }

    // Append the new userId to the author_ids array
    const updatedAuthors = [...currentAuthors, userId];

    // Update the database with the new array
    const { error: updateError } = await supabase
      .from("paper")
      .update({ author_ids: updatedAuthors })
      .eq("paper_id", paperId);

    if (updateError) {
      return res.status(500).json({ error: "Failed to assign authorship" });
    }

    return res.status(200).json({ message: "Authorship verified and assigned successfully." });

  } catch (error) {
    console.error("Error verifying authorship:", error.response?.data || error.message);
    return res.status(500).json({ error: "An unexpected error occurred during authorship verification." });
  }
};

exports.checkAuthorship = async (req, res) => {
  console.log("🔹 Received Authorship Check Request");
  console.log("🔹 Request Query:", req.query);
  console.log("🔹 Request User:", req.user);

  const userId = req.user.id;
  const { paperId } = req.query;

  if (!userId || !paperId) {
    console.log("Missing user ID or paper ID in request");
    return res.status(400).json({ error: "Missing user ID or paper ID" });
  }

  try {
    const { data: paper, error } = await supabase
      .from("paper")
      .select("author_ids")
      .eq("paper_id", paperId)
      .single();

    if (error || !paper) {
      console.log("Paper not found in database");
      return res.status(404).json({ error: "Paper not found" });
    }

    const isAuthor = paper.author_ids?.includes(userId) || false;
    console.log(`🔹 DEBUG: User ${userId} isAuthor: ${isAuthor}`);

    return res.status(200).json({ isAuthor });
  } catch (error) {
    console.error("Error checking authorship:", error);
    return res.status(500).json({ error: "Unexpected error occurred" });
  }
};

