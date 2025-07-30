import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BASE_URL_IN_CONFIG } from "../../../config";

// Decode JWT token to get user information
export const decodeJWTToken = (token) => {
  try {
    if (!token) return null;
    
    // JWT tokens have three parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode the payload (second part)
    const payload = parts[1];
    
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Decode base64
    const decodedPayload = atob(paddedPayload);
    
    // Parse JSON
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};

// Get current user information from stored JWT token and fetch additional details from existing profile API
export const getCurrentUserInfo = async () => {
  try {
    console.log('getCurrentUserInfo - Starting...');
    const token = await AsyncStorage.getItem("jwtToken");
    console.log('getCurrentUserInfo - JWT token found:', token ? 'Yes' : 'No');
    
    if (!token) {
      console.log('getCurrentUserInfo - No token found, returning null');
      return null;
    }
    
    const decoded = decodeJWTToken(token);
    console.log('getCurrentUserInfo - JWT decoded successfully:', decoded ? 'Yes' : 'No');
    
    if (!decoded) {
      console.log('getCurrentUserInfo - JWT decode failed, returning null');
      return null;
    }
    
    const userId = decoded.userId || decoded.user_id || decoded.id;
    if (!userId) {
      console.log('getCurrentUserInfo - No userId found in JWT, returning null');
      return null;
    }
    
    // Try to fetch user profile from the existing profile API with timeout
    try {
      console.log('getCurrentUserInfo - Fetching user profile from /auth/user-profile');
      
      // Add timeout to prevent hanging
      const response = await Promise.race([
        axios.get(`${BASE_URL_IN_CONFIG}/auth/user-profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile API timeout')), 5000)
        )
      ]);
      
      const profileData = response.data;
      console.log('getCurrentUserInfo - Profile data received successfully');
      
      return {
        userId: profileData.id || userId,
        username: profileData.username || profileData.name || profileData.email?.split('@')[0] || `User-${userId.slice(-8)}`,
        email: profileData.email,
        name: profileData.name,
        bio: profileData.bio,
        fullPayload: decoded,
        profileData: profileData
      };
    } catch (profileError) {
      console.warn('getCurrentUserInfo - Profile API failed/timeout, using fallback:', profileError.message);
      
      // Fallback to JWT-only info if profile API fails or times out
      const fallbackUserInfo = {
        userId: userId,
        username: decoded.username || decoded.name || decoded.email?.split('@')[0] || `User-${userId.slice(-8)}`,
        email: decoded.email,
        fullPayload: decoded
      };
      
      console.log('getCurrentUserInfo - Using fallback user info');
      return fallbackUserInfo;
    }
  } catch (error) {
    console.error('Error getting current user info:', error);
    return null;
  }
};
