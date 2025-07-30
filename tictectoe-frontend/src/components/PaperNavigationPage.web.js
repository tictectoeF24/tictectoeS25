import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
  TextInput,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Image,
  Platform
} from "react-native";

import { useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome, MaterialIcons, Entypo } from "@expo/vector-icons";
import { Share } from "react-native";
import { WebView } from "react-native-webview"; // Correct WebView import
import { likePaper, commentPaper, bookmarkPaper, getPaperComments, checkIfAlreadyLiked, checkIfAlreadyBookmarked, unlikePaper, unbookmarkPaper } from "./functions/PaperFunc";
import { handleORCIDLogin } from "./ExplorePage.web";
import tw from "twrnc";
import RenderHTML from 'react-native-render-html';
import FloatingChatbot from './FloatingChatbot';
import { ScreenWidth } from "react-native-elements/dist/helpers";
import { LinearGradient } from "expo-linear-gradient";
import { deleteAuthToken, fetchPaperbyId, signOut } from "../../api";
import { checkIfLoggedIn } from "./functions/checkIfLoggedIn";
import { BASE_URL } from "../../api";
import { fetchProfile } from "../../api";

// Function to clean LaTeX formatting and make it readable
const cleanLatexText = (text) => {
  if (!text) return text;
  
  try {
    let cleanedText = text;
    
    // Remove inline math delimiters like $...$ and \(...\)
    cleanedText = cleanedText.replace(/\$([^$]*)\$/g, '$1');
    cleanedText = cleanedText.replace(/\\[(](.*?)\\[)]/g, '$1');
    
    // Remove display math delimiters like $$...$$ and \[...\]
    cleanedText = cleanedText.replace(/\$\$([^$]*)\$\$/g, '$1');
    cleanedText = cleanedText.replace(/\\[(.*?)\\]/g, '$1');
    
    // Convert fractions to readable format (do this early)
    cleanedText = cleanedText.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');
    
    // Convert square roots
    cleanedText = cleanedText.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');
    cleanedText = cleanedText.replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, '($2)^(1/$1)');
    
    // Convert common LaTeX commands to readable text
    cleanedText = cleanedText.replace(/\\textbf\{([^}]+)\}/g, '$1');
    cleanedText = cleanedText.replace(/\\textit\{([^}]+)\}/g, '$1');
    cleanedText = cleanedText.replace(/\\emph\{([^}]+)\}/g, '$1');
    cleanedText = cleanedText.replace(/\\text\{([^}]+)\}/g, '$1');
    cleanedText = cleanedText.replace(/\\mathrm\{([^}]+)\}/g, '$1');
    cleanedText = cleanedText.replace(/\\mathbf\{([^}]+)\}/g, '$1');
    cleanedText = cleanedText.replace(/\\mathit\{([^}]+)\}/g, '$1');
    cleanedText = cleanedText.replace(/\\mathbb\{([^}]+)\}/g, '$1');
    cleanedText = cleanedText.replace(/\\mathcal\{([^}]+)\}/g, '$1');
    cleanedText = cleanedText.replace(/\\mathfrak\{([^}]+)\}/g, '$1');
    cleanedText = cleanedText.replace(/\\operatorname\{([^}]+)\}/g, '$1');
    
    // Convert superscripts and subscripts with proper Unicode
    cleanedText = cleanedText.replace(/\^{([^}]+)}/g, (match, content) => {
      try {
        // Handle complex superscripts
        if (content.length === 1 && /\d/.test(content)) {
          const superscripts = '⁰¹²³⁴⁵⁶⁷⁸⁹';
          return superscripts[parseInt(content)];
        }
        return '^(' + content + ')';
      } catch (e) {
        return match; // Return original if conversion fails
      }
    });
    
    cleanedText = cleanedText.replace(/\^([a-zA-Z0-9])/g, (match, char) => {
      try {
        if (/\d/.test(char)) {
          const superscripts = '⁰¹²³⁴⁵⁶⁷⁸⁹';
          return superscripts[parseInt(char)] || '^' + char;
        }
        return '^' + char;
      } catch (e) {
        return match;
      }
    });

    cleanedText = cleanedText.replace(/_{([^}]+)}/g, (match, content) => {
      try {
        // Handle complex subscripts
        if (content.length === 1 && /\d/.test(content)) {
          const subscripts = '₀₁₂₃₄₅₆₇₈₉';
          return subscripts[parseInt(content)];
        }
        // For complex subscripts, just return without underscore
        return content; 
      } catch (e) {
        return match;
      }
    });

    cleanedText = cleanedText.replace(/_([a-zA-Z0-9])/g, (match, char) => {
      try {
        if (/\d/.test(char)) {
          const subscripts = '₀₁₂₃₄₅₆₇₈₉';
          return subscripts[parseInt(char)] || char;
        }
        return char; 
      } catch (e) {
        return match;
      }
    });
  
    
    // Convert Greek letters
    const greekLetters = {
      '\\alpha': 'α', '\\Alpha': 'Α',
      '\\beta': 'β', '\\Beta': 'Β',
      '\\gamma': 'γ', '\\Gamma': 'Γ',
      '\\delta': 'δ', '\\Delta': 'Δ',
      '\\epsilon': 'ε', '\\Epsilon': 'Ε',
      '\\varepsilon': 'ε',
      '\\zeta': 'ζ', '\\Zeta': 'Ζ',
      '\\eta': 'η', '\\Eta': 'Η',
      '\\theta': 'θ', '\\Theta': 'Θ',
      '\\vartheta': 'ϑ',
      '\\iota': 'ι', '\\Iota': 'Ι',
      '\\kappa': 'κ', '\\Kappa': 'Κ',
      '\\lambda': 'λ', '\\Lambda': 'Λ',
      '\\mu': 'μ', '\\Mu': 'Μ',
      '\\nu': 'ν', '\\Nu': 'Ν',
      '\\xi': 'ξ', '\\Xi': 'Ξ',
      '\\omicron': 'ο', '\\Omicron': 'Ο',
      '\\pi': 'π', '\\Pi': 'Π',
      '\\varpi': 'ϖ',
      '\\rho': 'ρ', '\\Rho': 'Ρ',
      '\\varrho': 'ϱ',
      '\\sigma': 'σ', '\\Sigma': 'Σ',
      '\\varsigma': 'ς',
      '\\tau': 'τ', '\\Tau': 'Τ',
      '\\upsilon': 'υ', '\\Upsilon': 'Υ',
      '\\phi': 'φ', '\\Phi': 'Φ',
      '\\varphi': 'ϕ',
      '\\chi': 'χ', '\\Chi': 'Χ',
      '\\psi': 'ψ', '\\Psi': 'Ψ',
      '\\omega': 'ω', '\\Omega': 'Ω'
    };
    
    Object.entries(greekLetters).forEach(([latex, unicode]) => {
      try {
        cleanedText = cleanedText.replace(new RegExp(latex.replace('\\', '\\\\'), 'g'), unicode);
      } catch (e) {
      }
    });
    
    // Convert mathematical operators and symbols
    const mathOperators = {
      '\\leq': '≤', '\\le': '≤',
      '\\geq': '≥', '\\ge': '≥',
      '\\neq': '≠', '\\ne': '≠',
      '\\approx': '≈',
      '\\sim': '∼',
      '\\simeq': '≃',
      '\\equiv': '≡',
      '\\cong': '≅',
      '\\propto': '∝',
      '\\infty': '∞',
      '\\pm': '±', '\\mp': '∓',
      '\\times': '×',
      '\\div': '÷',
      '\\cdot': '·',
      '\\bullet': '•',
      '\\star': '⋆',
      '\\circ': '∘',
      '\\bigcirc': '○',
      '\\oplus': '⊕',
      '\\ominus': '⊖',
      '\\otimes': '⊗',
      '\\oslash': '⊘',
      '\\odot': '⊙',
      '\\sum': '∑',
      '\\prod': '∏',
      '\\int': '∫',
      '\\oint': '∮',
      '\\partial': '∂',
      '\\nabla': '∇',
      '\\in': '∈',
      '\\notin': '∉',
      '\\ni': '∋',
      '\\subset': '⊂',
      '\\supset': '⊃',
      '\\subseteq': '⊆',
      '\\supseteq': '⊇',
      '\\cup': '∪',
      '\\cap': '∩',
      '\\setminus': '∖',
      '\\emptyset': '∅',
      '\\forall': '∀',
      '\\exists': '∃',
      '\\nexists': '∄',
      '\\land': '∧',
      '\\lor': '∨',
      '\\lnot': '¬',
      '\\rightarrow': '→', '\\to': '→',
      '\\leftarrow': '←',
      '\\leftrightarrow': '↔',
      '\\Rightarrow': '⇒',
      '\\Leftarrow': '⇐',
      '\\Leftrightarrow': '⇔',
      '\\uparrow': '↑',
      '\\downarrow': '↓',
      '\\updownarrow': '↕',
      '\\mapsto': '↦',
      '\\angle': '∠',
      '\\perp': '⊥',
      '\\parallel': '∥',
      '\\triangle': '△',
      '\\square': '□',
      '\\diamond': '◊'
    };
    
    Object.entries(mathOperators).forEach(([latex, unicode]) => {
      try {
        cleanedText = cleanedText.replace(new RegExp(latex.replace('\\', '\\\\'), 'g'), unicode);
      } catch (e) {
      }
    });
    
    // Handle special cases and formatting
    cleanedText = cleanedText.replace(/\\left\s*([(){}[\]|])/g, '$1');
    cleanedText = cleanedText.replace(/\\right\s*([(){}[\]|])/g, '$1');
    cleanedText = cleanedText.replace(/\\Big[lr]?\s*([(){}[\]|])/g, '$1');
    cleanedText = cleanedText.replace(/\\big[lr]?\s*([(){}[\]|])/g, '$1');
    
    // Remove LaTeX environments
    cleanedText = cleanedText.replace(/\\begin\{[^}]+\}/g, '');
    cleanedText = cleanedText.replace(/\\end\{[^}]+\}/g, '');
    
    // Remove alignment and spacing commands
    cleanedText = cleanedText.replace(/\\[hv]space\{[^}]*\}/g, ' ');
    cleanedText = cleanedText.replace(/\\quad/g, ' ');
    cleanedText = cleanedText.replace(/\\qquad/g, '  ');
    cleanedText = cleanedText.replace(/\\,/g, ' ');
    cleanedText = cleanedText.replace(/\\!/g, '');
    cleanedText = cleanedText.replace(/\\;/g, ' ');
    cleanedText = cleanedText.replace(/\\:/g, ' ');
    
    const commonLatexCommands = [
      '\\\\', '\\section', '\\subsection', '\\subsubsection',
      '\\paragraph', '\\subparagraph', '\\item', '\\label',
      '\\ref', '\\cite', '\\footnote', '\\margin', '\\newline'
    ];
    
    commonLatexCommands.forEach(cmd => {
      try {
        cleanedText = cleanedText.replace(new RegExp(cmd.replace('\\', '\\\\') + '\\s*', 'g'), ' ');
      } catch (e) {
        // Skip problematic patterns
      }
    });

    let prevLength = 0;
    while (cleanedText.length !== prevLength && prevLength < 3) { 
      prevLength = cleanedText.length;
      cleanedText = cleanedText.replace(/\{([^{}]*)\}/g, '$1');
    }
    
    // Basic cleanup
    cleanedText = cleanedText.replace(/\\_/g, '_');
    cleanedText = cleanedText.replace(/\\\$/g, '$');
    cleanedText = cleanedText.replace(/<[^>]*>/g, '');
    cleanedText = cleanedText.replace(/\{[Hh][Tt][Mm][Ll][Tt][Aa][Gg]_[^}]*\}/g, '');
    cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
    
    return cleanedText;
  } catch (error) {
    console.warn('LaTeX cleaning error:', error);
    return text; // Return original text if cleaning fails
  }
};

const PaperNavigationPage = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [selectedTab, setSelectedTab] = useState("Abstract");
  const [isLiked, setIsLiked] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isBookmark, setIsBookmark] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const scrollViewElement = useRef(null);
  const [isClaimed, setIsClaimed] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [paperDetails, setPaperDetails] = useState({
    title: "",
    author: "",
    genre: "",
    date: new Date(),
    summary: "",
    doi: "",
    userId: "",
    paper_id: ""
  });

  // This will kick user out if not logged in
  useEffect(() => {
    const timeout = setTimeout(async () => {
      const isLoggedIn = await checkIfLoggedIn();
    }, 100);
    return () => clearTimeout(timeout);
  }, [])

  // This will ensure if paperId is not in localStorage it will redirect to explore
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!AsyncStorage.getItem("paperId")) {
        localStorage.setItem("currentRoute", "Explore");
        navigation.navigate("Explore");
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [localStorage])

  const incrementClickCount = async () => {
    try {
      const paperId = paperDetails.paper_id;
      const token = await AsyncStorage.getItem("jwtToken"); //Fetch the JWT token

      if (!paperId) {
        console.error("Error: Missing paper ID for click count increment.");
        return;
      }

      if (!token) {
        console.error("Error: No authentication token found.");
        return;
      }


      const response = await fetch(`${BASE_URL}/api/paper/increment-click`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ paper_id: paperId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to increment click count:", errorData);
        return;
      }

      console.log("Click count incremented successfully");
    } catch (error) {
      console.error("Error incrementing click count:", error);
    }
  };


  // This is to load the paper details
  useEffect(() => {
    if (route.params) {
      loadPapersDetails(route.params);
      setComments([]);
    }

    if (paperDetails.paper_id) {
      incrementClickCount(); // Increment click count when a paper is opened
    }
  }, [route.params, paperDetails.paper_id]);

  // Fetch comments when paper details are available
  useEffect(() => {
    if (paperDetails.paper_id) {
      getPaperComments(paperDetails.paper_id).then((res) => {
        console.log("Comments response:", res);
        if (res && res.comments) {
          console.log("Setting comments:", res.comments);
          setComments(res.comments);
        } else {
          console.log("No comments found or error occurred");
          setComments([]);
        }
      }).catch((error) => {
        console.error("Error in getPaperComments:", error);
        setComments([]);
      });
    }
  }, [paperDetails.paper_id]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = await AsyncStorage.getItem("jwtToken");
        if (!token) {
          console.log("🔹 No token found. User might be logged out.");
          return;
        }

        const userProfile = await fetchProfile(token);
        // Fetch user profile from backend
        setProfileData(userProfile);  // Store the profile data in state
      } catch (err) {
        console.error("Error fetching profile data:", err);
      }
    };

    fetchUserProfile();
  }, []);



  useEffect(() => {
    const checkAuthorship = async () => {

      try {
        const token = await AsyncStorage.getItem("jwtToken");

        if (!token || !paperDetails?.paper_id) {
          console.log("Missing token or paper ID:", paperDetails?.paper_id);
          return;
        }


        // First, check AsyncStorage before making a network request
        const storedClaimedStatus = await AsyncStorage.getItem(`claimed_${paperDetails.paper_id}`);

        if (storedClaimedStatus === "true") {
          setIsClaimed(true);
          return;
        }


        const response = await fetch(
          `${BASE_URL}/api/profile/auth/orcid/check?paperId=${paperDetails.paper_id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const result = await response.json();

        if (response.ok && result.isAuthor) {
          console.log("Found authorship in database");
          setIsClaimed(true);
          await AsyncStorage.setItem(`claimed_${paperDetails.paper_id}`, "true"); // Store in AsyncStorage
        } else {
          console.log("No authorship found");
          setIsClaimed(false);
          await AsyncStorage.removeItem(`claimed_${paperDetails.paper_id}`);
        }
      } catch (err) {
        console.error("Error checking authorship:", err);
      }
    };

    if (paperDetails?.paper_id) {
      checkAuthorship();
    }
  }, [paperDetails.paper_id]);


  const loadPapersDetails = (details) => {
     const { title, author, genre, date, summary, doi, userId, paper_id, author_names, category_readable, categories } = details;

    // Always prefer category_readable if available, otherwise fallback to original category
    let displayGenre = category_readable || "";
    if (!displayGenre && genre) displayGenre = genre;
    if (!displayGenre && categories) displayGenre = categories;

    // Use author_names if author is not available
    const displayAuthor = author || author_names || "";

    // Create an updated object with new values
    const updatedDetails = {
      title: title || "",
      author: displayAuthor,
      genre: displayGenre,
      date: date || new Date(),
      summary: summary || "",
      doi: doi || "",
      userId: userId || "",
      paper_id: paper_id || ""
    };
    setPaperDetails(updatedDetails);
  }

  useEffect(() => {

    // This will load paperDetails after reloading the page
    const timeout = setTimeout(async () => {
      const paperId = localStorage.getItem("paperId");
      const paperDetails = await fetchPaperbyId(paperId);
      loadPapersDetails(paperDetails);
    }, 200);
    return () => clearTimeout(timeout);
  }, [])


  const documentId = paperDetails.doi.split("/").pop();
  const pdfUrl = `https://arxiv.org/pdf/${documentId}.pdf`;
  const formattedDate = new Date(paperDetails.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short"
  });
  const slideAnim = useRef(
    new Animated.Value(Dimensions.get("window").height)
  ).current;

  const [contentError, setContentError] = useState({ abstract: false, pdf: false });
  const [reloadKey, setReloadKey] = useState({ abstract: 0, pdf: 0 }); // Separate keys for each content type

  useEffect(() => {
    scrollViewElement.current?.scrollToEnd()
  })

  const handleLogout = async () => {

    const confirmLogout = window.confirm("Are you sure you want to log out?");

    if (confirmLogout) {
      signOut();

    } else {
      console.log("Logout canceled");
    }
  };




  // Reload PDF function
  const handleReload = (contentType) => {
    setContentError((prevErrors) => ({ ...prevErrors, [contentType]: false }));
    setReloadKey((prevKeys) => ({ ...prevKeys, [contentType]: prevKeys[contentType] + 1 }));
  };

  const toggleTheme = () => setIsDarkMode((prevMode) => !prevMode);

  // 状态初始化
  useEffect(() => {
    async function initLikeBookmarkStatus() {
      if (profileData && paperDetails.paper_id) {
        const liked = await checkIfAlreadyLiked(paperDetails.paper_id, profileData.id);
        setIsLiked(liked);
        const bookmarked = await checkIfAlreadyBookmarked(paperDetails.paper_id, profileData.id);
        setIsBookmark(!!bookmarked);
      }
    }
    initLikeBookmarkStatus();
  }, [profileData, paperDetails.paper_id]);

  const toggleLike = async () => {
    if (!profileData || !profileData.id) {
      console.error("Cannot like: userId is missing.");
      alert("You must be logged in to like a paper.");
      return;
    }
    if (isLiked) {
      await unlikePaper(paperDetails.paper_id, profileData.id);
      setIsLiked(false);
    } else {
      await likePaper(paperDetails.paper_id, profileData.id);
      setIsLiked(true);
    }
  };

  const showComments = () => {
    setCommentsVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const hideComments = () => {
    Animated.timing(slideAnim, {
      toValue: Dimensions.get("window").height,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setCommentsVisible(false);
    });
  };

  const addComment = async () => {
    if (!profileData || !profileData.id) {
      console.error("Cannot comment: userId is missing.");
      alert("You must be logged in to comment on a paper.");
      return;
    }

    if (newComment.trim()) {
      const commentStatus = await commentPaper(paperDetails.paper_id, newComment, profileData.id);
      console.log("Comment Status:", commentStatus);

      if (commentStatus) {
        // Refresh comments after adding a new one
        getPaperComments(paperDetails.paper_id).then((res) => {
          if (res && res.comments) {
            setComments(res.comments);
          }
        });
        setNewComment("");
      } else {
        alert("Failed to comment on paper. Please try again.");
      }
    }
  };

  const toggleBookmark = async () => {
    if (!profileData || !profileData.id) {
      console.error("Cannot bookmark: userId is missing.");
      alert("You must be logged in to bookmark a paper.");
      return;
    }
    if (isBookmark) {
      await unbookmarkPaper(paperDetails.paper_id, profileData.id);
      setIsBookmark(false);
    } else {
      await bookmarkPaper(paperDetails.paper_id, profileData.id);
      setIsBookmark(true);
    }
  };

  const handleClaimAuthorship = async () => {
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      const paperId = paperDetails.paper_id;  // Use directly from paperDetails


      if (!token || !paperId) {
        alert("Missing token or paper ID");
        return;
      }
      // Step 1: Check if ORCID is stored in profileData
      if (!profileData || !profileData.orcid) {

        console.log("ORCID not found in profile, redirecting to ORCID login...");
        alert("You need to log in with ORCID before claiming authorship.");

        handleORCIDLogin(); // Redirect to ORCID login
        return;
      }

      const response = await fetch(`${BASE_URL}/api/profile/auth/orcid/claim`, {

        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paperId }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(`Claim failed: ${result.error || "Something went wrong"}`);
        return;
      }

      console.log("Claim success! Storing in AsyncStorage and updating UI...");
      alert("You are now listed as the author!");

      setIsClaimed(true);

      //  Store permanently in database
      await AsyncStorage.setItem(`claimed_${paperId}`, "true");
    } catch (err) {
      console.error(" Error claiming authorship:", err);
      alert("Something went wrong while claiming authorship.");
    }
  };




  return (

    <SafeAreaView
      style={[
        styles.container,
        isDarkMode ? styles.darkContainer : styles.lightContainer,
      ]}
    >
      {/* Top title bar */}
      <LinearGradient
        colors={isDarkMode ? ["#1E1E1E", "#1E1E1E"] : ['rgba(6,78,65,1)', 'rgba(61,140,69,1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.titleBar}
      >
        <Image style={styles.logoStyle} source={require("../../assets/Logo-Transparent.png")}></Image>
        <Text style={tw`text-white font-bold text-3xl`}>Tic Tec Toe</Text>
      </LinearGradient>


      {/* Side navigation bar */}
      <View style={[styles.topNav, isDarkMode ? { backgroundColor: "#1f2020ff" } : { backgroundColor: "white" }]}>
        <TouchableOpacity onPress={() => navigation.navigate("ProfilePage")}>
          <View style={tw`flex-row items-center p-5 border-b border-gray-500 w-50`}>
            <FontAwesome name="user" size={24} color={isDarkMode ? "white" : "black"} ></FontAwesome>
            <Text style={tw`ml-3 ${isDarkMode ? "text-white" : "text-black"}`}>Profile Page</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Explore")}>
          <View style={tw`flex-row items-center p-5 border-b border-gray-500 w-50`}>
            <FontAwesome name="compass" size={24} color={isDarkMode ? "white" : "black"}></FontAwesome>
            <Text style={tw`ml-3 ${isDarkMode ? "text-white" : "text-black"}`}>Explore Page</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleTheme}>
          <View style={tw`flex-row items-center p-5 border-b border-gray-500 w-50`}>
            <MaterialIcons
              name={isDarkMode ? "wb-sunny" : "nightlight-round"}
              size={24}
              color={isDarkMode ? "white" : "black"}
            />
            <Text style={tw`ml-3 ${isDarkMode ? "text-white" : "text-black"}`}>Light/Dark Mode</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleLogout()}>
          <View style={tw`flex-row items-center p-5 border-b border-gray-500 w-50`}>
            <MaterialIcons name="logout" size={24} color={isDarkMode ? "white" : "black"} />
            <Text style={tw`ml-3 ${isDarkMode ? "text-white" : "text-black"}`}>Logout</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Main page content */}
      <ScrollView
        style={[
          styles.content,
          isDarkMode ? styles.darkContent : styles.lightContent,
        ]}
      >

        <Text
          style={[
            styles.heading,
            isDarkMode ? styles.darkText : styles.lightText,
            {
              width: '100%',
              display: 'inline',
              whiteSpace: 'normal',
              wordBreak: 'normal',
              hyphens: 'none',
              WebkitHyphens: 'none',
              MozHyphens: 'none',
              msHyphens: 'none',
              fontSize: 28,
              lineHeight: 36,
              fontWeight: '600',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }
          ]}
        >
          {cleanLatexText(paperDetails.title)}
        </Text>

        <View style={styles.categoryContainer}>
          <Text
            style={[
              styles.category,
              isDarkMode ? styles.darkText : styles.lightText,
            ]}
          >
            {paperDetails.genre}
          </Text>

          <Text
            style={[
              styles.date,
              isDarkMode ? styles.darkText : styles.lightText,
            ]}
          >
            {formattedDate}
          </Text>

        </View>


        <Text
          style={[
            styles.author,
            isDarkMode ? styles.darkText : styles.lightText,
          ]}
          onPress={() => navigation.navigate("ViewAuthorPage")}
        >
          {paperDetails.author}
        </Text>

        {/* Claim authorship */}
        {isClaimed ? (
          <View style={tw`bg-green-100 px-4 py-3 rounded-lg mb-4 flex-row items-center`}>
            <MaterialIcons name="verified" size={24} color="green" />
            <Text style={tw`text-green-800 font-bold text-lg ml-2`}>
              You are the verified author of this paper
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleClaimAuthorship}
            style={tw`bg-green-700 py-2 px-4 rounded mb-4 self-start`}
          >
            <Text style={tw`text-white font-bold`}>Claim Authorship</Text>
          </TouchableOpacity>
        )}


        {/* Abstract & full text navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === "Abstract" && styles.activeTab,
            ]}
            onPress={() => setSelectedTab("Abstract")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "Abstract" && styles.activeTabText,
              ]}
            >
              Abstract
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === "FullText" && styles.activeTab,
            ]}
            onPress={() => setSelectedTab("FullText")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "FullText" && styles.activeTabText,
              ]}
            >
              Full Text
            </Text>
          </TouchableOpacity>
        </View>

        {selectedTab === "Abstract" && (
          <ScrollView
            style={{ height: 300, marginBottom: 10 }}
            nestedScrollEnabled={false}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            <RenderHTML
              key={reloadKey.abstract}
              contentWidth={Dimensions.get("window").width - 40}
              source={{ html: (cleanLatexText(paperDetails.summary) || "<p>No abstract available.</p>").startsWith('<') ? cleanLatexText(paperDetails.summary) : `<p>${cleanLatexText(paperDetails.summary)}</p>` }}
              baseStyle={{
                color: isDarkMode ? "#FFFFFF" : "#000000",
                fontSize: 16,
                lineHeight: 24,
              }}
              onError={() => setContentError((prevErrors) => ({ ...prevErrors, abstract: true }))}
            />
          </ScrollView>
        )}

        {selectedTab === "FullText" && (
          Platform.OS === "web" ? (

            <ScrollView 
              style={{ 
                height: Dimensions.get("window").height - 300,
                width: "100%",
              }} 
              ref={scrollViewElement} 
              showsVerticalScrollIndicator={false}
            >
              <iframe
                key={reloadKey.pdf}
                src={pdfUrl + "#view=FitH"}
                style={{ 
                  width: "100%", 
                  height: "100vh", 
                  border: "2px solid gray",
                }}
                onError={() => setContentError((prevErrors) => ({ ...prevErrors, pdf: true }))}>

              </iframe>
            </ScrollView>

          ) : (
            <WebView
              key={reloadKey.pdf} // Use reload key for PDF
              source={{ uri: pdfUrl }}
              style={{ height: Dimensions.get("window").height - 200 }}
              originWhitelist={["*"]}
              onError={() => setContentError((prevErrors) => ({ ...prevErrors, pdf: true }))}
            />
          )
        )}

      </ScrollView>


      {/* Bottom navigation (like, comment, bookmark etc)*/}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton} onPress={toggleLike} disabled={!paperDetails.paper_id}>
          <FontAwesome name="heart" size={24} color={isLiked ? "red" : "white"} />
          <Text style={styles.navButtonText}>Like</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={toggleBookmark}>
          <FontAwesome
            name="bookmark"
            size={24}
            color={isBookmark ? "blue" : "white"}
          />
          <Text style={styles.navButtonText}>Bookmark</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={showComments}>
          <FontAwesome name="comment" size={24} color="white" />
          <Text style={styles.navButtonText}>Comment</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => {
            localStorage.setItem("listenDoi", paperDetails.doi);
            navigation.navigate("ListenPage");
          }}
        >
          <FontAwesome name="headphones" size={24} color="white" />
          <Text style={styles.navButtonText}>Listen</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={commentsVisible} transparent animationType="none">
        <Animated.View
          style={[
            styles.commentsContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Comments</Text>
            <TouchableOpacity onPress={hideComments}>
              <Entypo name="cross" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.commentsContent}>
            {Array.isArray(comments) && comments.length > 0 ? (
              comments
                .sort((a, b) => {
                  // Use comment ID for chronological sorting
                  const commentIdA = a.commentId || a.comment_id || 0;
                  const commentIdB = b.commentId || b.comment_id || 0;
                  
                  return commentIdA - commentIdB; // Sort by comment ID: oldest first, newest at bottom
                })
                .map((comment, index) => {
                const isMyComment = comment.userHandle === profileData?.username;
                const isAuthorComment = isClaimed && isMyComment;
                
                return (
                  <View 
                    key={index} 
                    style={[
                      styles.commentItemContainer,
                      isMyComment ? styles.myCommentContainer : styles.otherCommentContainer
                    ]}
                  >
                    <View style={[
                      styles.commentItem,
                      isMyComment ? styles.myCommentItem : styles.otherCommentItem
                    ]}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={[
                          styles.commentAuthor,
                          isMyComment ? styles.myCommentAuthor : styles.otherCommentAuthor
                        ]}>
                          {comment.userName}
                        </Text>
                        {/* Show author tag only if this comment is from the current user who is the author */}
                        {isAuthorComment && (
                          <View style={styles.authorTag}>
                            <Text style={styles.authorTagText}>Author</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[
                        styles.commentText,
                        isMyComment ? styles.myCommentText : styles.otherCommentText
                      ]}>
                        {comment.content}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.noCommentsText}>No comments yet.</Text>
            )}
          </ScrollView>
          <View style={styles.newCommentContainer}>
            <TextInput
              style={[
                styles.commentInput,
                isDarkMode ? styles.darkInput : styles.lightInput,
              ]}
              placeholder="Write a comment..."
              placeholderTextColor="#888"
              value={newComment}
              onChangeText={setNewComment}
            />
            <TouchableOpacity style={styles.addCommentButton} onPress={addComment} disabled={!paperDetails.paper_id}>
              <Text style={styles.addCommentButtonText}>Post</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </Modal>

      <FloatingChatbot 
        context={paperDetails?.summary || "Research paper discussion"} 
        pdfUrl={pdfUrl}
        paperId={paperDetails?.paper_id || paperDetails?.id || paperDetails?.doi || route.params?.paperId}
        paperTitle={paperDetails?.title}
        paperDoi={paperDetails?.doi}
      />

    </SafeAreaView>
  );
};

export default PaperNavigationPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row"
  },
  darkContainer: {
    backgroundColor: "#1E1E1E",
  },
  lightContainer: {
    backgroundColor: "#ebebeb",
  },
  topNav: {
    marginTop: 50,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingVertical: 10,
    paddingHorizontal: 20,
    height: "100%",
    width: 300,
    backgroundColor: "white",
    border: "1px solid gray",
  }
  ,
  content: {
    flex: 1,
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  darkContent: {
    backgroundColor: "#2C2C2C",
  },
  lightContent: {
    backgroundColor: "white",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  darkText: {
    color: "#FFFFFF",
  },
  lightText: {
    color: "#000000",
  },
  categoryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  author: {
    fontSize: 18,
    marginBottom: 15,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#E0E0E0",
  },
  activeTab: {
    backgroundColor: "#057B34",
  },
  tabText: {
    fontSize: 16,
  },
  activeTabText: {
    color: "white",
  },
  bottomNav: {
    position: "fixed",
    bottom: 0,
    right: 0,
    left: 300,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 15,
    paddingLeft: 10,
    height: 90,
    backgroundColor: "#116e21ff",
    zIndex: 50
  },
  navButton: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 70,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  navButtonText: {
    color: "white",
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
    fontWeight: "500",
  },
  commentsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "70%",
    backgroundColor: "#2A2A2A",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  commentsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  commentsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  commentsContent: {
    flex: 1,
  },
  commentItemContainer: {
    width: '100%',
    marginBottom: 10,
  },
  myCommentContainer: {
    alignItems: 'flex-end',
  },
  otherCommentContainer: {
    alignItems: 'flex-start',
  },
  commentItem: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 10,
  },
  myCommentItem: {
    backgroundColor: "#4CAF50",
  },
  otherCommentItem: {
    backgroundColor: "#FFFFFF",
  },
  commentAuthor: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  myCommentAuthor: {
    color: "#FFFFFF", 
  },
  otherCommentAuthor: {
    color: "#333", 
  },
  commentText: {
    marginBottom: 5,
  },
  myCommentText: {
    color: "#FFFFFF",
  },
  otherCommentText: {
    color: "#333",
  },
  noCommentsText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 16,
    marginTop: 20,
  },
  newCommentContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  commentInput: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#888",
    borderRadius: 5,
  },
  darkInput: {
    backgroundColor: "#333",
    color: "#fff",
  },
  lightInput: {
    backgroundColor: "#FFF",
    color: "#000",
  },
  addCommentButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#057B34",
    borderRadius: 5,
  },
  addCommentButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  titleBar: {
    backgroundColor: "red",
    flexDirection: "row",
    width: "100%",
    zIndex: "1",
    height: 60,
    position: "absolute",
    justifyContent: "center",
    alignItems: "center"
  },
  logoStyle: {
    width: "7vw",
    height: "7vh"
  },

  authorTag: {
    backgroundColor: "#ffcc00",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
    alignSelf: "center",
    justifyContent: "center",
    height: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  authorTagText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 12,
    textAlignVertical: "center",
  },
});
