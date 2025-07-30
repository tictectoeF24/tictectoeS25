import { useState, useEffect, useRef } from "react"
import { View, TextInput, TouchableOpacity, Text, Dimensions, ScrollView, Image} from "react-native"
import { FontAwesome, MaterialIcons } from "@expo/vector-icons"
import { lightStyles, darkStyles } from "../styles/ExplorePageStyles"
import { useNavigation } from "@react-navigation/native"
import { LinearGradient } from "expo-linear-gradient"
import { signOut } from "../../api"
import { fetchPapersByClickCount } from "../../api"
import ExpandableChat from "./ExpandableChat.web";


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
    
    // Clean up braces more carefully - only remove outermost unnecessary braces
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

const GuestExplorePage = () => {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeComments, setActiveComments] = useState(null)
  const [commentsData, setCommentsData] = useState({})
  const [newComment, setNewComment] = useState("")
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [error, setError] = useState(null)
  const navigation = useNavigation()
  const styles = isDarkMode ? darkStyles : lightStyles
  const [hoverExplore, setHoverExplore] = useState(false)
  const [hoverBookmarks, setHoverBookmarks] = useState(false)
  const [pressedExplore, setPressedExplore] = useState(false)
  const [pressedBookmarks, setPressedBookmarks] = useState(false)
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)
  const [profileData, setProfileData] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [windowWidth, setWindowWidth] = useState(Dimensions.get("window").width)
  const [windowHeight, setWindowHeight] = useState(Dimensions.get("window").height)
  const [showDateRangePicker, setShowDateRangePicker] = useState(false)
  const flatListRef = useRef(null)

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(Dimensions.get("window").width)
      setWindowHeight(Dimensions.get("window").height)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    const loadPapersData = async () => {
      setLoading(true)
      try {
        const response = await fetchPapersByClickCount()
        if (!response?.data || response.data.length === 0) {
          console.log("No papers found")
          setError("No papers available at the moment.")
        } else {
          console.log("Setting papers:", response.data)
          setPapers(response.data)
        }
      } catch (err) {
        console.error("Error fetching papers:", err)
        setError("Failed to load papers. Please check your network connection.")
      } finally {
        setLoading(false)
      }
    }

    loadPapersData()
  }, [])

  const handleMouseEnter = (button) => {
    if (button === "explore") {
      setHoverExplore(true)
    } else {
      setHoverBookmarks(true)
    }
  }

  const handleMouseLeave = (button) => {
    if (button === "explore") {
      setHoverExplore(false)
    } else {
      setHoverBookmarks(false)
    }
  }

  const handlePressIn = (button) => {
    if (button === "explore") {
      setPressedExplore(true)
    } else {
      setPressedBookmarks(true)
    }
  }

  const handlePressOut = (button) => {
    if (button === "explore") {
      setPressedExplore(false)
    } else {
      setPressedBookmarks(false)
    }
  }

  const searchTimeout = useRef(null)

  // Handle interactions that need authentication - central function to show modal
  const handleAuthRequired = () => {
    setShowModal(true)
  }

  const handleDateFilter = async () => {
    handleAuthRequired()
  }

  const handleSearch = async () => {
    handleAuthRequired()
  }

  const handleLogout = async () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?")

    if (confirmLogout) {
      const success = await signOut()
      if (success) {
        navigation.navigate("AuthenticationSignInPage")
      }
    } else {
      console.log("Logout canceled")
    }
  }

  const onSearchQueryChange = (text) => {
    handleAuthRequired()
  }

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode)
  }

  const handleModalClose = () => {
    setShowModal(false)
  }

  const handleSignIn = () => {
    setShowModal(false)
    navigation.navigate("AuthenticationSignInPage")
  }

  const handleSignUp = () => {
    setShowModal(false)
    navigation.navigate("AuthenticationSignUpPage")
  }

  const handleShare = async (paper) => {
    handleAuthRequired()
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    })
  }

  const formatDateRange = () => {
    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`
    } else if (startDate) {
      return `From ${formatDate(startDate)}`
    } else if (endDate) {
      return `Until ${formatDate(endDate)}`
    }
    return "Select Month Range"
  }

  const isMobile = windowWidth < 768

  return (
    <View style={{ flex: 1, width: "100%", height: "100vh" }}>
      <LinearGradient colors={isDarkMode ? ["#0C1C1A", "#2B5A3E"] : ["#064E41", "#3D8C45"]} style={styles.background}>
        <View style={styles.contentWrapper}>
          {/* Header Bar */}
          <View
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 20px",
              height: 70,
              position: "sticky",
              top: 0,
              zIndex: 1000,
              backgroundColor: isDarkMode ? "rgba(12, 28, 26, 0.95)" : "rgba(6, 78, 65, 0.95)",
              backdropFilter: "blur(10px)",
              borderBottom: `1px solid ${isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.2)"}`,
            }}
          >
            {/* Logo */}
            <Text
              style={{
                color: "white",
                fontSize: 24,
                fontWeight: "bold",
                marginRight: 20,
              }}
            >
              Tic Tec Toe
            </Text>

            {/* Search and Controls */}
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                flex: 1,
                justifyContent: "center",
              }}
            >
              {/* Search Bar */}
              <View
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  borderRadius: 20,
                  height: 40,
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  flex: 1,
                  maxWidth: 400,
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                <FontAwesome name="search" size={16} color="#fff" style={{ marginRight: 10 }} />
                <TextInput
                  style={{
                    backgroundColor: "transparent",
                    color: "#fff",
                    flex: 1,
                    height: "100%",
                    outline: "none",
                    fontSize: "0.9rem",
                  }}
                  placeholder="Search by title or author"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  value={searchQuery}
                  onFocus={handleAuthRequired}
                  onChangeText={onSearchQueryChange}
                />
              </View>

              {/* Date Picker */}
              <TouchableOpacity
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  borderRadius: 20,
                  height: 40,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 14,
                  minWidth: 180,
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
                onPress={handleAuthRequired}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: "0.85rem",
                    maxWidth: 140,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatDateRange()}
                </Text>
                <FontAwesome name="calendar" size={14} color="#fff" />
              </TouchableOpacity>

              {/* Apply Button */}
              
              <TouchableOpacity
                style={{
                  backgroundColor: "#00A54B",
                      borderRadius: 20,
                      height: 40,
                      paddingHorizontal: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                }}
                onPress={handleAuthRequired}
              >
                <Image
                      source={{ uri: "https://info.orcid.org/wp-content/uploads/2019/11/orcid_16x16.png" }}
                      style={{ width: 14, height: 14 }}
                    />
                <Text style={{ color: "#fff", fontSize: "0.85rem", fontWeight: "500" }}>ORCID Login</Text>
              </TouchableOpacity>
            </View>

            {/* Right Icons */}
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 16,
                marginLeft: 20,
              }}
            >
              <TouchableOpacity
                onPress={() => navigation.navigate("AuthenticationSignUpPage")}
                style={{
                  backgroundColor: "#2196F3",
                  borderRadius: 20,
                  height: 40,
                  paddingHorizontal: 16,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "white", fontSize: "0.85rem", fontWeight: "500" }}>Sign Up</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate("AuthenticationSignInPage")}
                style={{
                  backgroundColor: "#4CAF50",
                  borderRadius: 20,
                  height: 40,
                  paddingHorizontal: 16,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "white", fontSize: "0.85rem", fontWeight: "500" }}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleTheme}>
                <MaterialIcons name={isDarkMode ? "wb-sunny" : "nightlight-round"} size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {error ? (
            <Text
              style={{
                color: "red",
                textAlign: "center",
                padding: "0.5rem",
                position: "absolute",
                width: "100%",
                zIndex: 1,
              }}
            >
              {error}
            </Text>
          ) : loading ? (
            <View style={{ height: "100vh", justifyContent: "center", alignItems: "center" }}>
              <Text style={{ color: "white", fontSize: "30px", fontWeight: "bold" }}>Loading...</Text>
            </View>
          ) : papers.length === 0 ? (
            <Text style={{ textAlign: "center", padding: "0.5rem", position: "absolute", width: "100%", zIndex: 1 }}>
              No papers found
            </Text>
          ) : null}

          <ScrollView
            style={gridStyles.scrollContainer}
            contentContainerStyle={gridStyles.scrollContent}
            showsVerticalScrollIndicator={false}
            onScroll={({ nativeEvent }) => {
              const { layoutMeasurement, contentOffset, contentSize } = nativeEvent
              const paddingToBottom = 20
              if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
                // Load more papers here if needed
              }
            }}
            scrollEventThrottle={400}
          >
            <View style={gridStyles.papersContainer}>
              {papers.map((item, index) => (
                <TouchableOpacity
                  key={item.paper_id}
                  onPress={handleAuthRequired}
                  style={gridStyles.paperWrapper}
                  activeOpacity={0.8}
                >
                  <View style={[gridStyles.card, { backgroundColor: isDarkMode ? "#2C2C2C" : "#ffffff" }]}>
                    {/* Main content area (genre and date added) */}
                      <LinearGradient
                        colors={["#064E41", "#3D8C45"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={gridStyles.headerGradient}
                      >
                       <View style={gridStyles.headerRow}>
                         <View style={gridStyles.genreTag}>
                           <Text style={gridStyles.genreText}>
                             {item.category_readable ? item.category_readable : (item.categories ? item.categories.split(",")[0].trim() : "General")}
                           </Text>
                         </View>
                       <Text style={gridStyles.dateText}>{formatDate(item.published_date)}</Text>
                     </View>
                     </LinearGradient>
                     
                    <View style={gridStyles.cardContent}>
                      <Text style={[gridStyles.title, { color: isDarkMode ? "#fff" : "#064E41" }]} numberOfLines={3}>
                        {cleanLatexText(item.title)}
                      </Text>
                      <Text style={[gridStyles.author, { color: isDarkMode ? "#ccc" : "#555" }]} numberOfLines={1}>
                        {item.author_names || "Unknown Author"}
                      </Text>
                      {/* <Text style={[gridStyles.date, { color: isDarkMode ? "#aaa" : "#888" }]}>
                        {formatDate(item.published_date)}
                      </Text> */}
                      <TouchableOpacity onPress={handleAuthRequired} activeOpacity={0.9} style={{ flex: 1, minHeight: 0 }}>
                        <ScrollView
                          nestedScrollEnabled={true}
                          showsVerticalScrollIndicator={false}
                          style={{ flexGrow: 1 }}
                          contentContainerStyle={{ flexGrow: 1 }}
                        >
                          <Text
                            style={[
                              gridStyles.summary,
                              {
                                color: isDarkMode ? "#ddd" : "#666",
                                display: "block",
                                whiteSpace: "normal",
                                wordBreak: "break-word",
                                textAlign: "left", // Changed from justify to left for better spacing
                              },
                            ]}
                          >
                            {cleanLatexText(item.summary)}
                          </Text>
                        </ScrollView>
                      </TouchableOpacity>

                    </View>

                    {/* Integrated icon row */}
                    <View
                      style={[
                        gridStyles.iconRow,
                        {
                          backgroundColor: isDarkMode ? "#3C3C3C" : "#ffffff",
                          borderTop: `1px solid ${isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                        },
                      ]}
                    >
                      <View style={{ alignItems: "center" }}>
                        <TouchableOpacity onPress={handleAuthRequired}>
                          <FontAwesome
                            name="heart-o"
                            size={20}
                            color={isDarkMode ? "#fff" : "#333333"}
                          />
                        </TouchableOpacity>
                        <Text
                          style={{
                            color: isDarkMode ? "#fff" : "#333",
                            fontSize: 9,
                            fontWeight: "bold",
                          }}
                        >
                          {item.like_count || 0}
                        </Text>
                      </View>
                      <View style={{ alignItems: "center" }}>
                        <TouchableOpacity onPress={handleAuthRequired}>
                          <FontAwesome
                            name="bookmark-o"
                            size={20}
                            color={isDarkMode ? "#fff" : "#333333"}
                          />
                        </TouchableOpacity>
                        <Text
                          style={{
                            color: isDarkMode ? "#fff" : "#333",
                            fontSize: 9,
                            fontWeight: "bold",
                          }}
                        >
                          {item.bookmark_count || 0}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={handleAuthRequired}>
                        <FontAwesome name="share" size={20} color={isDarkMode ? "#fff" : "#333333"} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleAuthRequired}>
                        <FontAwesome name="info-circle" size={20} color={isDarkMode ? "#fff" : "#333333"} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {papers.length === 0 && !loading && (
              <Text style={{ textAlign: "center", padding: "2rem", color: "white", fontSize: "1.2rem" }}>
                No papers found
              </Text>
            )}
          </ScrollView>
        </View>
      </LinearGradient>

      {showModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sign In Required</Text>
            <Text style={styles.modalText}>Please sign in or create an account to access this feature.</Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                onPress={handleSignIn}
                style={{
                  ...styles.modalButton,
                  backgroundColor: "#4CAF50",
                }}
              >
                <Text style={styles.modalButtonText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSignUp}
                style={{
                  ...styles.modalButton,
                  backgroundColor: "#2196F3",
                }}
              >
                <Text style={styles.modalButtonText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleModalClose} style={styles.modalCancelButton}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  )
}

const gridStyles = {
  scrollContainer: {
    flex: 1,
    paddingTop: 20,
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  papersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 15,
  },
  paperWrapper: {
    flexgrow:1,
    flexBasis:"30%",
    maxWidth: "32%",
    marginBottom: 24,
    minWidth: 320,
    display: "flex",
    flexDirection: "column",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    display: "flex",
    flexDirection: "column",
    border: "1px solid rgba(0,0,0,0.06)",
    overflow: "hidden",
    minHeight: 400, //card height
    maxHeight: 440,
    height: 440,
  },
  cardContent: {
    padding: 24,
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  title: {
    // fontSize: 18,
    // fontWeight: "600",
    // color: "#064E41",
    // marginBottom: 12,
    // lineHeight: 24,
    // maxHeight: 48,
    // overflow: "hidden",
    fontSize: 18,
    fontWeight: "600",
    color: "#064E41",
    marginBottom: 12,
    lineHeight: 24,
    whiteSpace: "normal",
    wordBreak: "break-word",
    textAlign: "left",
  },
  author: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
    height: 20,
    overflow: "hidden",
  },
  date: {
    fontSize: 12,
    color: "#888",
    marginBottom: 12,
    height: 16,
  },
  summary: {
    // fontSize: 14,
    // color: "#555",
    // lineHeight: 20,
    // flex: 1,
    // overflow: "hidden",
    // fontWeight: "400",
    // minHeight: 140,
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    fontWeight: "400",
    wordBreak: "break-word",
    whiteSpace: "normal",
    textAlign: "left", // Changed from justify to left for better spacing
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#ffffff",
    borderTop: "1px solid rgba(0,0,0,0.1)",
    marginTop: 0,
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  genreTag: {
    backgroundColor: "#3D8C45",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: "60%",
  },
  genreText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  dateText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
  },
}

export default GuestExplorePage
