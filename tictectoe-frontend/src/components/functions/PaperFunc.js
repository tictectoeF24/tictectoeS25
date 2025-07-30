// Put your IP address here
import axios from "axios";
import { BASE_URL, fetchProfile } from "../../../api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export async function unlikePaper(paperId) {
   const token = await AsyncStorage.getItem("jwtToken");
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 5000);
   const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');

   try {
      const response = await fetch(
         `${BASE_URL}/api/paper/unlike`,
         {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
               "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
               paper_id: paperId,
               timestamp: timestamp,
            }),
            signal: controller.signal,
         }
      );
      clearTimeout(timeoutId);
      return response.ok;
   } catch (error) {
      if (error.name === 'AbortError') return false;
      console.error(error);
      return false;
   }
}

export async function likePaper(paperId) {
   const token = await AsyncStorage.getItem("jwtToken");
   console.log("likePaper: token", token); 
   console.log("likePaper: paperId", paperId); 
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 5000);

   const timestamp = new Date();
   const timestampFormatted = timestamp.toISOString().replace('T', ' ').replace('Z', '');

   try {

      
      const response = await fetch(
         `${BASE_URL}/api/paper/like`,
         {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
               "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
               paper_id: paperId,
               timestamp: timestampFormatted,
            }),
            signal: controller.signal,
         }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
         console.log(response);
         return false;
      }

      return true;

   } catch (error) {
      if (error.name === 'AbortError') {
         return false;
      }
      console.error(error);
      return false;
   }
}
export async function commentPaper(paperId, commentInput) {
   const token = await AsyncStorage.getItem("jwtToken");
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 5000);
   const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');

   try {
      const response = await fetch(
         `${BASE_URL}/api/paper/comment`,
         {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
               "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
               paper_id: paperId,
               timestamp: timestamp,
               content: commentInput,
            }),
            signal: controller.signal,
         }
      );
      clearTimeout(timeoutId);
      return response.ok;
   } catch (error) {
      if (error.name === 'AbortError') return false;
      console.error(error);
      return false;
   }
}

export async function getPaperComments(paperId) {
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 5000);

   try {
      const response = await fetch(
         `${BASE_URL}/api/paper/${paperId}/comments`,
         {
            signal: controller.signal,
         }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
         console.error("Failed to fetch comments, status:", response.status);
         return false;
      }

      const data = await response.json();
      // console.log("Comments fetched successfully:", data);
      return data;

   } catch (error) {
      if (error.name === 'AbortError') {
         console.error("Request aborted while fetching comments");
         return false;
      }
      console.error("Error fetching comments:", error);
      return false;
   }
}

// BOOKMARK
export async function bookmarkPaper(paperId) {
   const token = await AsyncStorage.getItem("jwtToken");
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 5000);
   const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');

   try {
      const response = await fetch(
         `${BASE_URL}/api/paper/bookmark`,
         {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
               "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
               paper_id: paperId,
               timestamp: timestamp,
            }),
            signal: controller.signal,
         }
      );
      clearTimeout(timeoutId);
      return response.ok;
   } catch (error) {
      if (error.name === 'AbortError') return false;
      console.error(error);
      return false;
   }
}

// UNBOOKMARK
export async function unbookmarkPaper(paperId) {
   const token = await AsyncStorage.getItem("jwtToken");
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 5000);

   try {
      const response = await fetch(
         `${BASE_URL}/api/paper/unbookmark`,
         {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
               "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
               paper_id: paperId,
            }),
            signal: controller.signal,
         }
      );
      clearTimeout(timeoutId);
      return response.ok;
   } catch (error) {
      if (error.name === 'AbortError') return false;
      console.error(error);
      return false;
   }
}


// CHECK IF ALREADY LIKED
export async function checkIfAlreadyLiked(paperId) {
   const token = await AsyncStorage.getItem("jwtToken");
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 5000);
   try {
      const response = await fetch(
         `${BASE_URL}/api/paper/${paperId}/like-status`,
         {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
            signal: controller.signal,
         }
      );
      clearTimeout(timeoutId);
      if (!response.ok) return false;
      const data = await response.json();
      // Accept both possible keys for compatibility
      return !!(data.liked || data.hasLiked);
   } catch (error) {
      if (error.name === 'AbortError') return false;
      console.error(error);
      return false;
   }
}

// CHECK IF ALREADY BOOKMARKED
export async function checkIfAlreadyBookmarked(paperId) {
   const token = await AsyncStorage.getItem("jwtToken");
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 5000);

   try {
      const response = await fetch(
         `${BASE_URL}/api/paper/${paperId}/bookmark-status`,
         {
            method: "GET",
            headers: {
               "Authorization": `Bearer ${token}`,
            },
            signal: controller.signal,
         }
      );
      clearTimeout(timeoutId);
      if (!response.ok) return false;
      const result = await response.json();
      return result.hasBookmarked;
   } catch (error) {
      if (error.name === 'AbortError') return false;
      console.error(error);
      return false;
   }
}


export async function getComments(paperId) {
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 5000);

   try {
      const response = await fetch(
          `${BASE_URL}/api/paper/${paperId}/comments`,
         {
            signal: controller.signal,
         }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
         return false;
      }

      const data = await response.json();
      return data;

   } catch (error) {
      if (error.name === 'AbortError') {
         return false;
      }
      console.error(error);
      return false;
   }
}

export const fetchProfileData = async () => {
   try {

      const token = await AsyncStorage.getItem("jwtToken");

      if (token) {

         const data = await fetchProfile(token);
         setProfileData(data);
      } else {
         Alert.alert("Error", "No token found, please log in again.");

      }
   } catch (error) {
      Alert.alert("Error", error.message || "Failed to load profile");
   }
};
