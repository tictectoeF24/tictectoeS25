import React, { useState, useRef, useEffect, useMemo } from "react";
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
  Linking,
  Alert,
} from "react-native";
import { BASE_URL } from "../../api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchProfile } from "../../api";
import { useRoute, useNavigation } from "@react-navigation/native";
import { FontAwesome, MaterialIcons, Entypo } from "@expo/vector-icons";
import { Share } from "react-native";
import { WebView } from "react-native-webview"; // Correct WebView import
import RenderHTML from 'react-native-render-html';
import { likePaper, commentPaper, bookmarkPaper, checkIfAlreadyLiked, checkIfAlreadyBookmarked, getPaperComments, unlikePaper, unbookmarkPaper } from "./functions/PaperFunc";
import tw from 'twrnc';
import MobileChatbot from './MobileChatbot';

import { signOut } from "../../api";

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
    
    // Convert fractions to readable format
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
    
    // Handle subscripts more carefully
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
        // Skip problematic patterns
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
  const [profileData, setProfileData] = useState(null);
  const [isClaimed, setIsClaimed] = useState(false);
  const navigation = useNavigation();
  const [selectedTab, setSelectedTab] = useState("Abstract");
  const [liked, setLiked] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [bookmarked, setBookmarked] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [chatbotVisible, setChatbotVisible] = useState(false);

  // Screen dimensions for responsive footer
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  // Update screen dimensions on change
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  const { title, author, genre, date, summary, doi, paper_id, userId } = route.params;

  // Generate PDF URL more robustly
  const generatePdfUrl = () => {
    if (doi) {
      // Extract arXiv ID from DOI (e.g., "10.48550/arXiv.2301.00001" -> "2301.00001")
      const arxivMatch = doi.match(/arXiv\.(\d+\.\d+)/);
      if (arxivMatch) {
        return `https://arxiv.org/pdf/${arxivMatch[1]}.pdf`;
      }
      // Fallback: use the last part of DOI
      const documentId = doi.split("/").pop();
      if (documentId) {
        return `https://arxiv.org/pdf/${documentId}.pdf`;
      }
    }
    return null;
  };

  const pdfUrl = generatePdfUrl();
  
  // Debug PDF URL generation
  useEffect(() => {
    console.log("Mobile PaperNavigationPage - DOI:", doi);
    console.log("Mobile PaperNavigationPage - Generated PDF URL:", pdfUrl);
  }, [doi, pdfUrl]);
  const user_id = userId;
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short"
  });
  const slideAnim = useRef(
    new Animated.Value(Dimensions.get("window").height)
  ).current;

  const [contentError, setContentError] = useState({ abstract: false, pdf: false });
  const windowWidth = useMemo(() => Dimensions.get("window").width, []);

  const memoizedSource = useMemo(() => {
    const cleanedSummary = cleanLatexText(summary) || "<p>No abstract available.</p>";
    // Ensure proper HTML structure
    const htmlContent = cleanedSummary.startsWith('<') ? cleanedSummary : `<p>${cleanedSummary}</p>`;
    return { html: htmlContent };
  }, [summary]);

  const memoizedBaseStyle = useMemo(() => ({
    color: isDarkMode ? "#FFFFFF" : "#000000",
    fontSize: 16,
    lineHeight: 24,
  }), [isDarkMode]);

  const [reloadKey, setReloadKey] = useState({ abstract: 0, pdf: 0 }); // Separate keys for each content type


  // Reload PDF function
  const handleReload = (contentType) => {
    setContentError((prevErrors) => ({ ...prevErrors, [contentType]: false }));
    setReloadKey((prevKeys) => ({ ...prevKeys, [contentType]: prevKeys[contentType] + 1 }));
  };

  const toggleTheme = () => setIsDarkMode((prevMode) => !prevMode);


  useEffect(() => {
    checkIfAlreadyLiked(paper_id, userId).then((res) => setLiked(res));

    checkIfAlreadyBookmarked(paper_id, userId).then((res) => setBookmarked(res));

    getPaperComments(paper_id).then((res) => {
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

    const checkAuthorship = async () => {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token || !paper_id) return;

      const storedStatus = await AsyncStorage.getItem(`claimed_${paper_id}`);
      if (storedStatus === "true") {
        setIsClaimed(true);
        return;
      }

      const response = await fetch(
        `${BASE_URL}/api/profile/auth/orcid/check?paperId=${paper_id}`,
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
        setIsClaimed(true);
        await AsyncStorage.setItem(`claimed_${paper_id}`, "true");
      }
    };

    const fetchProfileData = async () => {
      const token = await AsyncStorage.getItem("jwtToken");
      const profile = await fetchProfile(token);
      setProfileData(profile);
    };

    fetchProfileData();
    checkAuthorship();
    incrementClickCount();

  }, []);

  function toggleLike(paperId) {
    if (liked) {
      unlikePaper(paperId, user_id).then((res) => setLiked(!res));
    } else {
      likePaper(paperId, user_id).then((res) => setLiked(res));
    }
  }

  function toggleBookmark(paperId) {
    if (bookmarked) {
      unbookmarkPaper(paperId, user_id).then((res) => setBookmarked(!res));
    } else {
      bookmarkPaper(paperId, user_id).then((res) => setBookmarked(res));
    }
  }

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
      commentPaper(paper_id, newComment, user_id).then((res) => {
        if (!res) {
          alert("Failed to comment on paper. Please try again.");
        } else {
          // Refresh comments after adding a new one
          getPaperComments(paper_id).then((res) => {
            if (res && res.comments) {
              setComments(res.comments);
            }
          });
          setNewComment("");
        }
      });
    }
  };

  const handleClaimAuthorship = async () => {
    try {
      const token = await AsyncStorage.getItem("jwtToken");

      if (!profileData?.orcid) {
        alert("You need to log in with ORCID before claiming authorship.");
        const ORCID_CLIENT_ID = "APP-H4ASFRRPPQLEYAAD";
        const ORCID_REDIRECT_URI = `${BASE_URL}/api/profile/auth/orcid/callback`;
        const orcidAuthURL = `https://orcid.org/oauth/authorize?client_id=${ORCID_CLIENT_ID}&response_type=code&scope=/authenticate&redirect_uri=${encodeURIComponent(ORCID_REDIRECT_URI)}`;
        Linking.openURL(orcidAuthURL);
        return;
      }

      const response = await fetch(`${BASE_URL}/api/profile/auth/orcid/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paperId: paper_id }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(`Claim failed: ${result.error || "Something went wrong"}`);
        return;
      }

      setIsClaimed(true);
      await AsyncStorage.setItem(`claimed_${paper_id}`, "true");
      alert("You are now listed as the author!");
    } catch (err) {
      console.error("Error claiming authorship:", err);
      alert("Something went wrong while claiming authorship.");
    }
  };

  const incrementClickCount = async () => {
    try {
      const token = await AsyncStorage.getItem("jwtToken");

      if (!paper_id) {
        console.error("Missing paper_id");
        return;
      }

      if (!token) {
        console.error("Missing token");
        return;
      }

      const response = await fetch(`${BASE_URL}/api/paper/increment-click`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ paper_id }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to increment click count:", error);
      } else {
        console.log("Click count incremented successfully");
      }
    } catch (error) {
      console.error("Error incrementing click count:", error);
    }
  };

  const onShare = async () => {
    try {
      const result = await Share.share({
        message: `Check out this paper: ${title} by ${author}, Category: ${genre}, Published on ${formattedDate}`,
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared with activity
        } else {
          // Shared without activity
        }
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
      }
    } catch (error) {
      alert(error.message);
    }
  };

const handleLogout = async () => {
  // Show confirmation dialog
  Alert.alert(
    "Logout Confirmation",
    "Are you sure you want to logout?",
    [
      {
        text: "No",
        onPress: () => {
          console.log("Logout canceled");
          // User stays on current page - no navigation needed
        },
        style: "cancel"
      },
      {
        text: "Yes",
        onPress: async () => {
          try {
            // Clear all authentication data
            await AsyncStorage.multiRemove([
              "jwtToken", 
              "userId", 
              "profileData",
              // Add any other keys you want to clear
            ]);
            
            // Navigate to GuestExplorePage and clear navigation history
            navigation.reset({
              index: 0,
              routes: [{ name: "GuestExplorePage" }],
            });
            
            console.log("Successfully logged out to GuestExplorePage");
          } catch (error) {
            console.error("Logout error:", error);
            // Fallback navigation
            navigation.navigate("GuestExplorePage");
          }
        }
      }
    ],
    { cancelable: false } // Prevents dismissing by tapping outside
  );
};
  return (
    <SafeAreaView
      style={[
        styles.container,
        isDarkMode ? styles.darkContainer : styles.lightContainer,
      ]}
    >

      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.navigate("ProfilePage")}>
          <FontAwesome name="user" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Explore")}>
          <FontAwesome name="compass" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleTheme}>
          <MaterialIcons
            name={isDarkMode ? "wb-sunny" : "nightlight-round"}
            size={24}
            color="white"
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="white" />
        </TouchableOpacity>
      </View>

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
              flexWrap: 'wrap',
              textBreakStrategy: 'balanced',
              borderBottomColor: isDarkMode ? '#444' : '#e0e0e0',
            }
          ]}
        >
          {cleanLatexText(title)}
        </Text>
        <View style={styles.categoryContainer}>
          <Text
            style={[
              styles.category,
              isDarkMode ? styles.darkText : styles.lightText,
            ]}
          >
            {genre}
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
          {author}
        </Text>

        {isClaimed ? (
          <View style={{ backgroundColor: "#C6F6D5", padding: 10, borderRadius: 8, marginBottom: 10 }}>
            <Text style={{ color: "#2F855A", fontWeight: "bold" }}>
              ✅ You are the verified author of this paper
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={{ backgroundColor: "#057B34", padding: 10, borderRadius: 8, marginBottom: 10 }}
            onPress={handleClaimAuthorship}
          >
            <Text style={{ color: "white", fontWeight: "bold", textAlign: "center" }}>
              Claim Authorship
            </Text>
          </TouchableOpacity>
        )}


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


          <RenderHTML
            key={reloadKey.abstract}
            contentWidth={windowWidth}
            source={memoizedSource}
            baseStyle={memoizedBaseStyle}
            onError={() =>
              setContentError((prevErrors) => ({ ...prevErrors, abstract: true }))
            }
          />

        )}


        {selectedTab === "FullText" && (
          contentError.pdf ? (
            <View style={tw`p-5`}>
              <Text style={tw`text-center text-red-500 text-lg font-bold`}>
                Network Error
              </Text>
              <Text style={tw`text-center text-gray-700 mb-5`}>
                Failed to load the PDF. Please check your connection and try again.
              </Text>
              <TouchableOpacity
                style={tw`bg-blue-500 py-2 rounded-lg`}
                onPress={() => handleReload("pdf")}
              >
                <Text style={tw`text-white text-center font-bold`}>Reload PDF</Text>
              </TouchableOpacity>
            </View>
          ) : pdfUrl ? (
            <WebView
              key={reloadKey.pdf} // Use reload key for PDF
              source={{ uri: pdfUrl }}
              style={{ height: Dimensions.get("window").height - 200 }}
              originWhitelist={["*"]}
              onError={() => setContentError((prevErrors) => ({ ...prevErrors, pdf: true }))}
            />
          ) : (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: 'gray', fontSize: 16 }}>
                PDF not available for this paper
              </Text>
            </View>
          )
        )}
      </ScrollView>

      <View style={[styles.bottomNav, { 
        height: screenData.width < 400 ? 70 : screenData.width < 600 ? 80 : 90,
        paddingVertical: screenData.width < 400 ? 10 : screenData.width < 600 ? 15 : 20,
        paddingHorizontal: screenData.width < 400 ? 10 : 15
      }]}>
        <TouchableOpacity style={[styles.navButton, {
          minWidth: screenData.width < 400 ? 55 : screenData.width < 600 ? 60 : 70,
          paddingHorizontal: screenData.width < 400 ? 8 : screenData.width < 600 ? 10 : 15,
          paddingVertical: screenData.width < 400 ? 8 : screenData.width < 600 ? 10 : 12
        }]} onPress={() => toggleLike(paper_id)}>
          <FontAwesome name="heart" size={screenData.width < 400 ? 20 : 24} color={liked ? 'red' : 'white'} />
          <Text style={[styles.navButtonText, { 
            fontSize: screenData.width < 400 ? 10 : screenData.width < 600 ? 11 : 12,
            marginTop: screenData.width < 400 ? 4 : 6
          }]}>Like</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navButton, {
          minWidth: screenData.width < 400 ? 55 : screenData.width < 600 ? 60 : 70,
          paddingHorizontal: screenData.width < 400 ? 8 : screenData.width < 600 ? 10 : 15,
          paddingVertical: screenData.width < 400 ? 8 : screenData.width < 600 ? 10 : 12
        }]} onPress={() => toggleBookmark(paper_id)}>
          <FontAwesome name="bookmark" size={screenData.width < 400 ? 20 : 24} color={bookmarked ? 'blue' : 'white'} />
          <Text style={[styles.navButtonText, { 
            fontSize: screenData.width < 400 ? 10 : screenData.width < 600 ? 11 : 12,
            marginTop: screenData.width < 400 ? 4 : 6
          }]}>Bookmark</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navButton, {
          minWidth: screenData.width < 400 ? 55 : screenData.width < 600 ? 60 : 70,
          paddingHorizontal: screenData.width < 400 ? 8 : screenData.width < 600 ? 10 : 15,
          paddingVertical: screenData.width < 400 ? 8 : screenData.width < 600 ? 10 : 12
        }]} onPress={() => setChatbotVisible(true)}>
          <FontAwesome name="android" size={screenData.width < 400 ? 20 : 24} color="white" />
          <Text style={[styles.navButtonText, { 
            fontSize: screenData.width < 400 ? 10 : screenData.width < 600 ? 11 : 12,
            marginTop: screenData.width < 400 ? 4 : 6
          }]}>Chat AI</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navButton, {
          minWidth: screenData.width < 400 ? 55 : screenData.width < 600 ? 60 : 70,
          paddingHorizontal: screenData.width < 400 ? 8 : screenData.width < 600 ? 10 : 15,
          paddingVertical: screenData.width < 400 ? 8 : screenData.width < 600 ? 10 : 12
        }]} onPress={showComments}>
          <FontAwesome name="comment" size={screenData.width < 400 ? 20 : 24} color="white" />
          <Text style={[styles.navButtonText, { 
            fontSize: screenData.width < 400 ? 10 : screenData.width < 600 ? 11 : 12,
            marginTop: screenData.width < 400 ? 4 : 6
          }]}>Comment</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, {
            minWidth: screenData.width < 400 ? 55 : screenData.width < 600 ? 60 : 70,
            paddingHorizontal: screenData.width < 400 ? 8 : screenData.width < 600 ? 10 : 15,
            paddingVertical: screenData.width < 400 ? 8 : screenData.width < 600 ? 10 : 12
          }]}
          onPress={() => navigation.navigate("ListenPage", { doi })}
        >
          <FontAwesome name="headphones" size={screenData.width < 400 ? 20 : 24} color="white" />
          <Text style={[styles.navButtonText, { 
            fontSize: screenData.width < 400 ? 10 : screenData.width < 600 ? 11 : 12,
            marginTop: screenData.width < 400 ? 4 : 6
          }]}>Listen</Text>
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
          <ScrollView style={styles.commentsContent}>{Array.isArray(comments) && comments.length > 0 ? (
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
                    {/* UserName + Author Tag in One Line */}
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
            <TouchableOpacity
              style={styles.addCommentButton}
              onPress={addComment}
            >
              <Text style={styles.addCommentButtonText}>Post</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>

      <MobileChatbot
        visible={chatbotVisible}
        onClose={() => setChatbotVisible(false)}
        context={summary || title || "No context available"}
        pdfUrl={pdfUrl}
        paperId={paper_id}
        paperTitle={title}
        paperDoi={doi}
      />
    </SafeAreaView>
  );
};


export default PaperNavigationPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  darkContainer: {
    backgroundColor: "#1E1E1E",
  },
  lightContainer: {
    backgroundColor: "#057B34",
  },
  topNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    height: 50,
    backgroundColor: "#057B34",
  },
  content: {
    flex: 1,
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
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    lineHeight: 28,
    textAlign: "left",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
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
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 15,
    paddingLeft: 10,
    height: 90,
    backgroundColor: "#057B34",
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
    fontSize: 12,
  },
  myCommentAuthor: {
    color: "#FFFFFF", 
  },
  otherCommentAuthor: {
    color: "#000000", 
  },
  commentText: {
    marginBottom: 5,
    fontSize: 16,
    lineHeight: 20,
  },
  myCommentText: {
    color: "#FFFFFF",
  },
  otherCommentText: {
    color: "#000000",
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
