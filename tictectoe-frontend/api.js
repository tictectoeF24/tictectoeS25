import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL_IN_CONFIG } from "./config";
import { navigationRef } from "./App";
import { isTokenExpired } from "./src/components/functions/handleSignOutOnExpiredToken";

export const BASE_URL = BASE_URL_IN_CONFIG;

const normalizeEmail = (e) => (e || "").trim().toLowerCase();
const looksInstitutional = (e) =>
    /@(?:[a-z0-9.-]+\.)?(dal\.ca|dalhousie\.ca)$/i.test((e || "").trim());

// Axios instance for authenticated API requests
const API = axios.create({ baseURL: BASE_URL });

// Fetch Available Interests (Categories)
export const fetchAvailableInterests = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/utilities/getCategories`);
    return response.data;
  } catch (error) {
    console.error("Fetch Interests Error:", error);
    throw error;
  }
};

// Function to set Authorization header dynamically
export const setAuthToken = (token) => {
  if (token) {
    API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common["Authorization"];
  }
};

export const deleteAuthToken = () => {
  delete API.defaults.headers.common["Authorization"];
};

export const searchUsers = async (query, page = 1, limit = 10) => {
  try {
    const response = await API.get("/api/search-users", {
      params: { query, page, limit },
    });
    return response.data; // Return user data from API response
  } catch (error) {
    if (isTokenExpired(error) === true) {
      await signOut();
    }
    throw new Error(error.response?.data?.error || "Failed to fetch users");
  }
};

// Sign-up function
export const signUp = async (userData) => {
  try {
    const normalized = normalizeEmail(userData.email);

    // quick client-side domain check
    if (!looksInstitutional(normalized)) {
      throw new Error(
          "Please use your institutional email (dal.ca or dalhousie.ca)."
      );
    }

    // backend sends { message } on success (no token on signup)
    const response = await axios.post(`${BASE_URL}/auth/signup`, {
      email: normalized,
      password: userData.password,
      username: userData.userName,
      name: userData.fullName,
      userInterest: userData.userInterest,
      subscribeNewsletter: userData.subscribeNewsletter,
    });

    return response; // you'll navigate to OTP screen on 200
  } catch (error) {
    if (isTokenExpired(error) === true) {
      await signOut();
    }
    if (error.response) {
      console.error("Error Response:", error.response.data);
      console.error("Error Status:", error.response.status);
      console.error("Error Headers:", error.response.headers);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error Message:", error.message);
    }
    throw error; // bubble up to UI
  }
};

// Sign-in function
export const signIn = async (email, password) => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: normalizeEmail(email),
      password,
    });

    const { token } = response.data;
    if (token) {
      await AsyncStorage.setItem("jwtToken", token);
      setAuthToken(token);
    }
    return response.data; // { token, ... }
  } catch (error) {
    const status = error?.response?.status;
    const errMsg = error?.response?.data?.error;

    // surface unverified cleanly
    if (status === 403 && errMsg === "User not verified") {
      // backend also returned { resent: true }
      const resent = !!error?.response?.data?.resent;
      return { unverified: true, resent };
    }

    console.error("Sign in error:", errMsg || error);
    // throw a normalized error for the UI
    throw new Error(errMsg || "Failed to sign in");
  }
};

// Function to verify OTP
export const verifyOtp = async (email, otp) => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/verify-otp`, {
      email: normalizeEmail(email),
      otp,
    });

    return response.data;
  } catch (error) {
    if (isTokenExpired(error) === true) {
      await signOut();
    }
    if (error.response) {
      console.error("OTP verification error:", error.response.data.error);
      throw error.response.data.error;
    } else {
      throw "OTP verification failed";
    }
  }
};

// Function to request password reset
export const requestResetPassword = async (email) => {
  try {
    const response = await axios.post(
        `${BASE_URL}/auth/request-reset-password`,
        {
          email: normalizeEmail(email),
        }
    );

    return response.data;
  } catch (error) {
    if (isTokenExpired(error) === true) {
      await signOut();
    }
    throw new Error(
        error.response?.data?.error || "Failed to request password reset"
    );
  }
};

// Function to verify reset OTP
export const verifyResetOtp = async (email, otp) => {
  const url = `${BASE_URL}/auth/verify-reset-otp`;
  const payload = {
    email: normalizeEmail(email),
    otp: (otp || "").trim(),
  };

  try {
    const response = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error(
        "verifyResetOtp error:",
        error?.response?.status,
        error?.response?.data
    );
    throw new Error(error.response?.data?.error || "Failed to verify OTP");
  }
};

// Function to set a new password
export const setNewPassword1 = async (email, newPassword) => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/set-new-password`, {
      email: normalizeEmail(email),
      newPassword,
    });
    return response.data;
  } catch (error) {
    if (isTokenExpired(error) === true) {
      await signOut();
    }

    throw new Error(error.response?.data?.error || "Failed to reset password");
  }
};

// Function to retrieve profile data
export const fetchProfile = async () => {
  try {
    const token = await AsyncStorage.getItem("jwtToken");
    setAuthToken(token);

    const response = await API.get("/auth/user-profile");
    return response.data;
  } catch (error) {
    if (isTokenExpired(error) === true) {
      await signOut();
    }

    throw new Error(
        error.response?.data?.error || "Failed to fetch user profile"
    );
  }
};

export const signOut = async () => {
  try {
    await AsyncStorage.removeItem("jwtToken");
    await AsyncStorage.setItem("currentRoute", "GuestExplorePage");
    deleteAuthToken();

    if (navigationRef.isReady()) {
      navigationRef.navigate("GuestExplorePage");
    }

    return true;
  } catch (error) {
    console.error("Logout error:", error);
    return false;
  }
};

// Function to update profile information
export const updateProfile = async (profileData) => {
  try {
    const token = await AsyncStorage.getItem("jwtToken");

    const response = await axios.put(
        `${BASE_URL}/api/profile/update-profile`,
        profileData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
    );

    return response.data;
  } catch (error) {
    if (isTokenExpired(error) === true) {
      await signOut();
    }

    console.error("Error updating profile:", error);
    throw error;
  }
};

export const updateInterests = async (interests) => {
  try {
    const token = await AsyncStorage.getItem("jwtToken");

    const response = await axios.put(
        `${BASE_URL}/api/profile/update-interests`, // Corrected API endpoint
        { interests },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
    );

    return response.data;
  } catch (error) {
    if (error?.message === "Invalid token") {
      await signOut(); // Handling token expiration or invalid token by signing out
    }
    console.error("Error updating interests:", error);
    throw error; // Rethrow the error to be handled by the caller
  }
};

export const fetchPapers = async () => {
  try {
    // Retrieve the token from AsyncStorage
    const token = await AsyncStorage.getItem("jwtToken");

    // Set the Authorization header with the token
    setAuthToken(token);

    // Make the API call to fetch papers with the full URL
    const response = await API.get(`/api/paper/papers`);
    // Return the data from the response
    return response.data.data;
  } catch (error) {
    if (isTokenExpired(error) === true) {
      await signOut();
    }
    throw new Error(error.response?.data?.message || "Failed to fetch papers");
  }
};

export const fetchPapersByClickCount = async () => {
  try {
    const response = await API.get("/api/paper/papers-by-click-count");
    return response.data;
  } catch (error) {
    if (isTokenExpired(error) === true) {
      await signOut();
    }
    console.error("Error fetching papers by click count:", error);
    if (error.response) {
      // Log the response to see what the server actually sent
      console.error("Response data:", error.response.data);
    }
    throw error;
  }
};

export const fetchPaperbyId = async (paperId) => {
  try {
    // Retrieve the token from AsyncStorage
    const token = await AsyncStorage.getItem("jwtToken");
    setAuthToken(token);
    const response = await API.get(`/api/paper/paper/${paperId}`);
    return response.data.data;
  } catch (error) {
    if (isTokenExpired(error) === true) {
      await signOut();
    }

    throw new Error(error.response?.data?.message || "Failed to fetch paper");
  }
};

export const fetchPaperbyDOI = async (doi) => {
  try {
    // Retrieve the token from AsyncStorage
    const token = await AsyncStorage.getItem("jwtToken");
    setAuthToken(token);

    // Fetch all papers
    const papers = await fetchPapersByClickCount();

    // Find the paper with matching DOI
    const parsedDOIUrl = `http://arxiv.org/abs/${doi}`;
    const paper = papers.data.find((p) => p.doi === parsedDOIUrl);

    if (!paper) {
      throw new Error(`Paper with DOI "${doi}" not found`);
    }

    return paper;
  } catch (error) {
    if (isTokenExpired(error) === true) {
      await signOut();
    }

    throw new Error(
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch paper by DOI"
    );
  }
};

export const searchPapers = async (
    searchTerm = "",
    startDate = null,
    endDate = null
) => {
  try {
    const token = await AsyncStorage.getItem("jwtToken");

    if (!token) {
      throw new Error("Token not found. Please log in again.");
    }

    setAuthToken(token); // Ensure the token is added to headers

    const payload = {
      searchTerm: searchTerm.trim(), // Trim whitespace from searchTerm
      start_date: startDate, // Send null if not provided
      end_date: endDate, // Send null if not provided
    };

    const response = await API.post("/api/paper/search", payload);
    return response.data.data;
  } catch (error) {
    if (isTokenExpired(error) === true) {
      await signOut();
    }

    console.error("Error in searchPapers API:", error);

    if (error.response?.status === 401) {
      throw new Error("Unauthorized. Please log in again.");
    }

    throw new Error(
        error.response?.data?.message || "Failed to perform search"
    );
  }
};

export const fetchBookmarks = async () => {
  try {
    const token = await AsyncStorage.getItem("jwtToken");
    setAuthToken(token);

    const response = await API.get("/api/profile/bookmarks");

    // Return the bookmarks data
    return response.data.data;
  } catch (error) {
    if (isTokenExpired(error) === true) {
      await signOut();
    }

    console.error("Error fetching bookmarks:", error);
    throw new Error(
        error.response?.data?.message || "Failed to fetch bookmarks"
    );
  }
};

export const fetchRecommendedPapers = async () => {
  try {
    const token = await AsyncStorage.getItem("jwtToken");
    setAuthToken(token);

    const response = await API.get("/api/profile/recommendations");

    return response.data.data;
  } catch (error) {
    if (isTokenExpired(error) === true) {
      await signOut();
    }

    console.error("Error fetching recommendations:", error);
    throw new Error(
        error.response?.data?.message || "Failed to fetch recommendations"
    );
  }
};

export const fetchExploreRecommendations = async (offset = 0) => {
  try {
    const token = await AsyncStorage.getItem("jwtToken");
    setAuthToken(token);

    const response = await API.get(
        `/api/profile/explore-recommendations?offset=${offset}&limit=21`
    );
    return response.data;
  } catch (error) {
    if (isTokenExpired(error) === true) {
      await signOut();
    }

    console.error("Error fetching explore papers:", error);
    throw new Error(
        error.response?.data?.message || "Failed to fetch explore papers"
    );
  }
};

export const fetchExploreRecommendationsMobile = async () => {
  try {
    const token = await AsyncStorage.getItem("jwtToken");
    setAuthToken(token);

    const response = await API.get(`/api/profile/explore-recommendations`);
    return response.data;
  } catch (error) {
    if (isTokenExpired(error) === true) {
      await signOut();
    }

    console.error("Error fetching explore papers:", error);
    throw new Error(
        error.response?.data?.message || "Failed to fetch explore papers"
    );
  }
};

export const fetchPapersByClickCountByLimit = async (offset = 0) => {
  try {
    const response = await API.get(
        `/api/paper/papers-by-click-count-limit?offset=${offset}&limit=21`
    );
    return response.data;
  } catch (error) {
    if (isTokenExpired(error) === true) {
      await signOut();
    }
    console.error("Error fetching papers by click count:", error);
    if (error.response) {
      // Log the response to see what the server actually sent
      console.error("Response data:", error.response.data);
    }
    throw error;
  }
};

export const fetchLikes = async () => {
  try {
    const token = await AsyncStorage.getItem("jwtToken");
    setAuthToken(token); // Set the token for authenticated requests

    const response = await API.get("/api/profile/likes");

    // Return the likes data
    return response.data.data;
  } catch (error) {
    if (isTokenExpired(error) === true) {
      await signOut();
    }

    console.error("Error fetching likes:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch likes");
  }
};

export const fetchComments = async () => {
  try {
    const token = await AsyncStorage.getItem("jwtToken");
    setAuthToken(token); // Set the token for authenticated requests

    const response = await API.get("/api/profile/comments");

    // Return the comments data
    return response.data.data;
  } catch (error) {
    if (isTokenExpired(error) === true) {
      await signOut();
    }

    console.error("Error fetching comments:", error);
    throw new Error(
        error.response?.data?.message || "Failed to fetch comments"
    );
  }
};

// ✅ Fetch followers
export const fetchFollowers = async (userId) => {
  try {
    const token = await AsyncStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    const response = await API.get(`/api/follow/followers/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data.followers;
  } catch (error) {
    if (isTokenExpired(error) === true) {
      await signOut();
    }
    console.error(
        "Fetch Followers Error:",
        error.response?.data || error.message
    );
    throw new Error(error.response?.data?.error || "Failed to fetch followers");
  }
};

// ✅ Fetch following
export const fetchFollowing = async (userId) => {
  try {
    const token = await AsyncStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    const response = await API.get(`/api/follow/following/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data.following;
  } catch (error) {
    if (isTokenExpired(error) === true) {
      await signOut();
    }
    console.error(
        "Fetch Following Error:",
        error.response?.data || error.message
    );
    throw new Error(error.response?.data?.error || "Failed to fetch following");
  }
};

export const followUser = async (followingId) => {
  try {
    const token = await AsyncStorage.getItem("jwtToken");
    setAuthToken(token);

    const response = await API.post("/api/follow/follow", { followingId }, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    console.error("Follow User Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error || "Failed to follow user");
  }
};

export const unfollowUser = async (followingId) => {
  try {
    const token = await AsyncStorage.getItem("jwtToken");
    setAuthToken(token);

    const response = await API.delete("/api/follow/unfollow", {
      data: { followingId },
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    console.error(
        "Unfollow User Error:",
        error.response?.data || error.message
    );
    throw new Error(error.response?.data?.error || "Failed to unfollow user");
  }
};

export const fetchInterests = async () => {
  try {
    const token = await AsyncStorage.getItem("jwtToken");
    if (!token) {
      console.error("JWT token is missing");
      return;
    }
    setAuthToken(token); // Set the token for authenticated requests

    const response = await API.get("/api/profile/interests");

    return response.data;
  } catch (error) {
    if (isTokenExpired(error) === true) {
      await signOut();
    }
    console.error("Error fetching interests:", error);
    if (error.response) {
      console.error("Detailed error response:", error.response.data);
    }
    throw new Error(
        error.response?.data?.message || "Failed to fetch interests"
    );
  }
};

export const checkIfFollowing = async (userId) => {
  try {
    const token = await AsyncStorage.getItem("jwtToken");
    setAuthToken(token);

    const response = await API.get(`/api/follow/check-following/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    if (isTokenExpired(error) === true) {
      await signOut();
    }
    throw new Error(
        error.response?.data?.error || "Failed to check following status"
    );
  }
};

// Check if email is valid and available
export const checkEmailAvailability = async (email) => {
  const params = { email: (email || "").trim().toLowerCase() };
  try {
    const res = await axios.get(`${BASE_URL}/auth/check-email`, { params });
    // 200 can be either available:true OR available:false (reason: "unverified")
    return res.data; // { available: true } OR { available: false, reason: "unverified" }
  } catch (err) {
    const status = err?.response?.status;
    if (status === 409) return { available: false, reason: "verified" }; // truly taken
    if (status === 400) {
      const e = new Error(err.response?.data?.error || "Invalid email address");
      e.status = 400;
      throw e;
    }
    const e = new Error("Failed to validate email");
    e.status = status ?? 0;
    throw e;
  }
};