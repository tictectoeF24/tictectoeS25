import { useState, useEffect, useRef } from "react"
import { View, TextInput, TouchableOpacity, Text, Share, Alert, Image, Dimensions, ScrollView } from "react-native"
import { FontAwesome, MaterialIcons } from "@expo/vector-icons"
import { lightStyles, darkStyles } from "../styles/ExplorePageStyles"
import { useNavigation, useRoute } from "@react-navigation/native"
import { LinearGradient } from "expo-linear-gradient"
import { searchPapers, fetchProfile, signOut, BASE_URL, fetchPapersByClickCount } from "../../api"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { checkIfLoggedIn } from "./functions/checkIfLoggedIn"
import PaperListItemWeb from "./small-components/PaperListItemWeb";

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
    
    // Handle subscripts more carefully - simplified to avoid HTML tag artifacts
    cleanedText = cleanedText.replace(/_{([^}]+)}/g, (match, content) => {
      try {
        // Handle complex subscripts
        if (content.length === 1 && /\d/.test(content)) {
          const subscripts = '₀₁₂₃₄₅₆₇₈₉';
          return subscripts[parseInt(content)];
        }
        return content; // Just return the content without extra formatting
      } catch (e) {
        return match;
      }
    });
    
    // Handle simple subscripts more carefully
    cleanedText = cleanedText.replace(/_([a-zA-Z0-9])/g, (match, char) => {
      try {
        if (/\d/.test(char)) {
          const subscripts = '₀₁₂₃₄₅₆₇₈₉';
          return subscripts[parseInt(char)] || char;
        }
        return char; // Just return the character without underscore
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
        // Skip problematic patterns
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

// ORCID Credentials
// const BASE_URL = process.env.REACT_APP_API_URL || "https://tictectoe.org"
const ORCID_CLIENT_ID = "APP-H4ASFRRPPQLEYAAD"
const ORCID_REDIRECT_URI = `${BASE_URL}/api/profile/auth/orcid/callback`

const ExplorePage = () => {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeComments, setActiveComments] = useState(null)
  const [commentsData, setCommentsData] = useState({})
  const [newComment, setNewComment] = useState("")
  const [showOrcidLogin, setShowOrcidLogin] = useState(true)
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigation = useNavigation()
  const route = useRoute()
  const datePickerRef = useRef(null)
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
  const [windowWidth, setWindowWidth] = useState(Dimensions.get("window").width)
  const [windowHeight, setWindowHeight] = useState(Dimensions.get("window").height)
  const [hasActiveFilters, setHasActiveFilters] = useState(false)
  const [showDateRangePicker, setShowDateRangePicker] = useState(false)
  const flatListRef = useRef(null)
  const [focusedPaper, setFocusedPaper] = useState(null)

  // Handle ORCID login
  const handleORCIDLogin = () => {
    const orcidAuthURL = `https://orcid.org/oauth/authorize?client_id=${ORCID_CLIENT_ID}&response_type=code&scope=/authenticate&redirect_uri=${encodeURIComponent(ORCID_REDIRECT_URI)}`
    window.location.href = orcidAuthURL
  }

  useEffect(() => {
    setTimeout(async () => {
      const isLoggedIn = await checkIfLoggedIn()
    }, 100)
  }, [])

  useEffect(() => {
    const handleOrcidCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const orcidAuthCode = urlParams.get("code")
      if (orcidAuthCode) {
        try {
          console.log("ORCID Authorization Code received:", orcidAuthCode)
          const response = await fetch(`${BASE_URL}/api/profile/auth/orcid/callback?code=${orcidAuthCode}`)
          const data = await response.json()
          if (data.userId) {
            navigation.navigate("Explore")
            window.history.replaceState({}, document.title, window.location.pathname)
          } else {
            console.error("ORCID Login Failed: No userId received.")
          }
        } catch (error) {
          console.error("Error processing ORCID callback:", error)
        }
      }
    }
    handleOrcidCallback()
  }, [])

  useEffect(() => {
    const checkOrcidStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("jwtToken")
        if (!token) {
          console.log("No token found, assuming user is logged out.")
          setShowOrcidLogin(true)
          return
        }
        const profileData = await fetchProfile(token)
        if (!profileData) {
          console.log("Profile data not found.")
          setShowOrcidLogin(true)
          return
        }
        setProfileData(profileData)
        if (profileData.orcid) {
          setShowOrcidLogin(false)
        } else {
          setShowOrcidLogin(true)
        }
      } catch (err) {
        console.error("Error fetching profile:", err)
        setShowOrcidLogin(true)
      }
    }
    checkOrcidStatus()
  }, [])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(Dimensions.get("window").width)
      setWindowHeight(Dimensions.get("window").height)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
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
      setHoverBookmarks(true)
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
      setPressedBookmarks(true)
    }
  }

  const searchTimeout = useRef(null)

  useEffect(() => {
    const fetchData = async () => {
      await loadPapersData()
    }

    fetchData()
  }, [])

  const loadPapersData = async () => {
    setLoading(true)
    setError(null)

    try {
      // The data source
      const response = await fetchPapersByClickCount()
      if (!response?.data || response.data.length === 0) {
        console.log("No papers found")
        setError("No papers available at the moment.")
      } else {
        console.log("Setting papers:", response.data)

        //debugging to check if the response is valid (categories is null)
        console.log("Paper data:", response.data[0])
        console.log("Categories:", response.data[0]?.categories)
        console.log("All fields in paper:", Object.keys(response.data[0]))

        setPapers(response.data)
      }

      // Fetch profile data for authenticated features
      const token = await AsyncStorage.getItem("jwtToken")
      if (token) {
        const profileData = await fetchProfile(token)
        setProfileData(profileData)
      }
    } catch (err) {
      console.error("Error fetching papers:", err)
      setError("Failed to load papers. Please check your network connection.")
    } finally {
      setLoading(false)
    }
  }

  const handleDateFilter = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = await AsyncStorage.getItem("jwtToken")
      if (!token) {
        throw new Error("Session expired. Please log in again.")
      }

      // const formattedStartDate = startDate ? startDate.toLocaleDateString("en-CA") : null
      // const formattedEndDate = endDate ? endDate.toLocaleDateString("en-CA") : null

      // Always use the first day for startDate
      let formattedStartDate = startDate
        ? new Date(startDate.getFullYear(), startDate.getMonth(), 1).toLocaleDateString("en-CA")
        : null

      // If endDate is set, use the last day of that month
      let formattedEndDate = endDate
        ? new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).toLocaleDateString("en-CA")
        : null

      //   
      const data = await searchPapers("", formattedStartDate, formattedEndDate)
      if (data.length === 0) {
        setError("No results found for the selected date range.")
      } else {
        setPapers(data)
        setHasActiveFilters(true)
      }
    } catch (err) {
      console.error("Error filtering by date range:", err)
      if (err.message.includes("Session expired")) {
        Alert.alert("Session Expired", "Please log in again.")
        navigation.navigate("Login")
      } else {
        setError("Failed to filter by date range. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const clearDateFilters = async () => {
    setStartDate(null)
    setEndDate(null)
    setHasActiveFilters(false)
    await loadPapersData()
  }

  const handleSearch = async () => {
    setLoading(true)
    setError(null)

    try {
      const query = searchQuery.trim()
      if (query === "") {
        await loadPapersData()
        return
      }

      console.log("Searching for:", query)
      const data = await searchPapers(query)

      if (data && data.length === 0) {
        setError(`No results found for "${query}". Try different keywords.`)
        setPapers([])
      } else if (data) {
        setPapers(data)
        setError(null)
      } else {
        setError("Search failed. Please try again.")
        setPapers([])
      }
    } catch (err) {
      console.error("Error fetching search results:", err)
      setError("Failed to load search results. Please check your network connection.")
      setPapers([])
    } finally {
      setLoading(false)
    }
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
    setSearchQuery(text)

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    // Clear search if empty
    if (text.trim() === "") {
      searchTimeout.current = setTimeout(() => {
        loadPapersData()
      }, 300)
      return
    }

    // Search with improved debouncing (needs improvements)
    searchTimeout.current = setTimeout(() => {
      handleSearch()
    }, 800)
  }

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode)
  }

  const handleShare = async (paper) => {
    try {
      await Share.share({
        message: `Check out this research paper: ${paper.title} - ${paper.genre}. ${paper.description}`,
      })
    } catch (error) {
      if (error?.message == "Invalid token") {
        signOut()
      }
      alert(error.message)
    }
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
    return "Select Date Range"
  }

  const renderPaperItem = ({ item, index }) => (
    <View style={gridStyles.paperWrapper}>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("PaperNavigationPage", {
            title: cleanLatexText(item.title),
            author: item.author_names,
            genre: item.genre,
            date: item.published_date,
            summary: cleanLatexText(item.summary),
            doi: item.doi,
            userId: item.userId,
            paper_id: item.paper_id,
          })
        }
        style={[gridStyles.card, { backgroundColor: isDarkMode ? "#2C2C2C" : "#ffffff" }]}
      >
        <Text
          style={[
            gridStyles.title,
            { color: isDarkMode ? "#fff" : "#064E41", maxHeight: undefined, overflow: "visible", whiteSpace: "normal" },
          ]}
        >
          {cleanLatexText(item.title)}
        </Text>
        <Text style={[gridStyles.author, { color: isDarkMode ? "#ccc" : "#555" }]} numberOfLines={1}>
          {item.author_names || "Unknown Author"}
        </Text>
        <Text style={[gridStyles.date, { color: isDarkMode ? "#aaa" : "#888" }]}>
          {formatDate(item.published_date)}
        </Text>
        <View
          style={{
            maxHeight: 140,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <ScrollView
            style={{
              maxHeight: 140,
            }}
            contentContainerStyle={{
              paddingRight: 8,
            }}
            showsVerticalScrollIndicator={true}
            persistentScrollbar={true}
          >
            <Text style={[gridStyles.summary, { color: isDarkMode ? "#ddd" : "#666", minHeight: undefined }]}>
              {cleanLatexText(item.summary)}
            </Text>
          </ScrollView>
        </View>

      </TouchableOpacity>

      <View style={gridStyles.iconRow}>
        <TouchableOpacity onPress={() => handleShare(item)}>
          <FontAwesome name="share" size={20} color={isDarkMode ? "#fff" : "#333333"} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            setLikedMap((prev) => ({
              ...prev,
              [item.paper_id]: !prev[item.paper_id],
            }))
          }
        >
          <FontAwesome
            name={likedMap[item.paper_id] ? "heart" : "heart-o"}
            size={20}
            color={likedMap[item.paper_id] ? "red" : isDarkMode ? "#fff" : "#333333"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            setBookmarkedMap((prev) => ({
              ...prev,
              [item.paper_id]: !prev[item.paper_id],
            }))
          }
        >
          <FontAwesome
            name={bookmarkedMap[item.paper_id] ? "bookmark" : "bookmark-o"}
            size={20}
            color={bookmarkedMap[item.paper_id] ? "#2196F3" : isDarkMode ? "#fff" : "#333333"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            localStorage.setItem("paperId", item.paper_id)
            navigation.navigate("PaperNavigationPage", {
              title: cleanLatexText(item.title),
              author: item.author_names,
              genre: item.genre,
              date: item.published_date,
              summary: cleanLatexText(item.summary),
              doi: item.doi,
              userId: item.userId,
              paper_id: item.paper_id,
            })
          }}
        >
          <FontAwesome name="info-circle" size={20} color={isDarkMode ? "#fff" : "#333333"} />
        </TouchableOpacity>
      </View>
    </View>
  )

  const isMobile = windowWidth < 768

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showDateRangePicker &&
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target)
      ) {
        setShowDateRangePicker(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showDateRangePicker])

  return (
    <>
      <View
        style={{
          msOverflowStyle: "none",
          scrollbarWidth: "none",
          height: "100vh",
          width: "100%",
        }}
      >
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
                    onChangeText={onSearchQueryChange}
                  />
                </View>

                {/* Date Picker */}
                <View style={{ position: "relative" }} ref={datePickerRef}>
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
                    onPress={() => setShowDateRangePicker(!showDateRangePicker)}
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

                  {showDateRangePicker && (
                    <div
                      ref={datePickerRef}
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        backgroundColor: isDarkMode ? "#2C2C2C" : "#fff",
                        borderRadius: 8,
                        padding: 16,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                        zIndex: 10000,
                        border: `1px solid ${isDarkMode ? "#444" : "#e0e0e0"}`,
                        marginTop: 4,
                        width: 260,
                      }}
                    >
                      {/* Start Month */}
                      <div style={{ marginBottom: 16 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 8,
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.8rem",
                              fontWeight: "600",
                              color: isDarkMode ? "#fff" : "#333",
                            }}
                          >
                            Start Month
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <TouchableOpacity
                              onPress={() => {
                                const currentYear = startDate ? startDate.getFullYear() : new Date().getFullYear()
                                const month = startDate ? startDate.getMonth() : 0
                                setStartDate(new Date(currentYear - 1, month, 1))
                              }}
                              style={{ padding: 4 }}
                            >
                              <Text style={{ color: isDarkMode ? "#fff" : "#333", fontSize: "1rem" }}>◀</Text>
                            </TouchableOpacity>
                            <span style={{ fontSize: "0.85rem", color: isDarkMode ? "#fff" : "#333" }}>
                              {startDate ? startDate.getFullYear() : new Date().getFullYear()}
                            </span>
                            <TouchableOpacity
                              onPress={() => {
                                const currentYear = startDate ? startDate.getFullYear() : new Date().getFullYear()
                                const month = startDate ? startDate.getMonth() : 0
                                setStartDate(new Date(currentYear + 1, month, 1))
                              }}
                              style={{ padding: 4 }}
                            >
                              <Text style={{ color: isDarkMode ? "#fff" : "#333", fontSize: "1rem" }}>▶</Text>
                            </TouchableOpacity>
                          </div>
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: 4,
                          }}
                        >
                          {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
                            (month, index) => (
                              <TouchableOpacity
                                key={month}
                                onPress={() => {
                                  const year = startDate ? startDate.getFullYear() : new Date().getFullYear()
                                  setStartDate(new Date(year, index, 1))
                                }}
                                style={{
                                  padding: 6,
                                  borderRadius: 4,
                                  borderWidth: 1,
                                  borderColor: isDarkMode ? "#555" : "#ddd",
                                  backgroundColor:
                                    startDate && startDate.getMonth() === index ? "#00A54B" : "transparent",
                                }}
                              >
                                <Text
                                  style={{
                                    color:
                                      startDate && startDate.getMonth() === index
                                        ? "#fff"
                                        : isDarkMode
                                          ? "#fff"
                                          : "#333",
                                    fontSize: 11,
                                    textAlign: "center",
                                    fontWeight: startDate && startDate.getMonth() === index ? "600" : "400",
                                  }}
                                >
                                  {month}
                                </Text>
                              </TouchableOpacity>
                            )
                          )}
                        </div>
                      </div>

                      {/* End Month */}
                      <div style={{ marginBottom: 16 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 8,
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.8rem",
                              fontWeight: "600",
                              color: isDarkMode ? "#fff" : "#333",
                            }}
                          >
                            End Month
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <TouchableOpacity
                              onPress={() => {
                                const currentYear = endDate ? endDate.getFullYear() : new Date().getFullYear()
                                const month = endDate ? endDate.getMonth() : 0
                                setEndDate(new Date(currentYear - 1, month, 1))
                              }}
                              style={{ padding: 4 }}
                            >
                              <Text style={{ color: isDarkMode ? "#fff" : "#333", fontSize: "1rem" }}>◀</Text>
                            </TouchableOpacity>
                            <span style={{ fontSize: "0.85rem", color: isDarkMode ? "#fff" : "#333" }}>
                              {endDate ? endDate.getFullYear() : new Date().getFullYear()}
                            </span>
                            <TouchableOpacity
                              onPress={() => {
                                const currentYear = endDate ? endDate.getFullYear() : new Date().getFullYear()
                                const month = endDate ? endDate.getMonth() : 0
                                setEndDate(new Date(currentYear + 1, month, 1))
                              }}
                              style={{ padding: 4 }}
                            >
                              <Text style={{ color: isDarkMode ? "#fff" : "#333", fontSize: "1rem" }}>▶</Text>
                            </TouchableOpacity>
                          </div>
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: 4,
                          }}
                        >
                          {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
                            (month, index) => (
                              <TouchableOpacity
                                key={month}
                                onPress={() => {
                                  const year = endDate ? endDate.getFullYear() : new Date().getFullYear()
                                  setEndDate(new Date(year, index, 1))
                                }}
                                style={{
                                  padding: 6,
                                  borderRadius: 4,
                                  borderWidth: 1,
                                  borderColor: isDarkMode ? "#555" : "#ddd",
                                  backgroundColor:
                                    endDate && endDate.getMonth() === index ? "#2196F3" : "transparent",
                                }}
                              >
                                <Text
                                  style={{
                                    color:
                                      endDate && endDate.getMonth() === index
                                        ? "#fff"
                                        : isDarkMode
                                          ? "#fff"
                                          : "#333",
                                    fontSize: 11,
                                    textAlign: "center",
                                    fontWeight: endDate && endDate.getMonth() === index ? "600" : "400",
                                  }}
                                >
                                  {month}
                                </Text>
                              </TouchableOpacity>
                            )
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: "flex", gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => {
                            setStartDate(null)
                            setEndDate(null)
                            setShowDateRangePicker(false)
                            clearDateFilters()
                          }}
                          style={{
                            flex: 1,
                            padding: 8,
                            backgroundColor: "#6c757d",
                            borderRadius: 6,
                            alignItems: "center",
                          }}
                        >
                          <Text style={{ color: "#fff", fontSize: 12, fontWeight: "500" }}>Clear</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={async () => {
                            setShowDateRangePicker(false)
                            await handleDateFilter()
                          }}
                          style={{
                            flex: 1,
                            padding: 8,
                            backgroundColor: "#00A54B",
                            borderRadius: 6,
                            alignItems: "center",
                          }}
                        >
                          <Text style={{ color: "#fff", fontSize: 12, fontWeight: "500" }}>Done</Text>
                        </TouchableOpacity>
                      </div>
                    </div>
                  )}
                </View>

                {/* Apply Button
                <TouchableOpacity
                  style={{
                    backgroundColor: hasActiveFilters ? "#2196F3" : "#00A54B",
                    borderRadius: 20,
                    height: 40,
                    paddingHorizontal: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: 20,
                  }}
                  onPress={hasActiveFilters ? clearDateFilters : handleDateFilter}
                >
                  <Text style={{ color: "#fff", fontSize: "0.85rem", fontWeight: "500" }}>
                    {hasActiveFilters ? "Clear" : "Apply"}
                  </Text>
                </TouchableOpacity> */}

                {/* ORCID Login */}
                {showOrcidLogin && (
                  <TouchableOpacity
                    onPress={handleORCIDLogin}
                    style={{
                      backgroundColor: "#00A54B",
                      borderRadius: 20,
                      height: 40,
                      paddingHorizontal: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Image
                      source={{ uri: "https://info.orcid.org/wp-content/uploads/2019/11/orcid_16x16.png" }}
                      style={{ width: 14, height: 14 }}
                    />
                    <Text style={{ color: "white", fontSize: "0.85rem", fontWeight: "500" }}>ORCID Login</Text>
                  </TouchableOpacity>
                )}
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
                <TouchableOpacity onPress={() => navigation.navigate('ChatHistoryPage')}>
                  <FontAwesome name="android" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleTheme}>
                  <MaterialIcons name={isDarkMode ? "wb-sunny" : "nightlight-round"} size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate("ProfilePage")}>
                  <FontAwesome name="user" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleLogout}>
                  <FontAwesome name="sign-out" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {error ? (
              <Text
                style={{
                  color: "red",
                  textAlign: "center",
                  marginTop: "0.5rem",
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
            ) : null}

            <ScrollView
              style={gridStyles.scrollContainer}
              contentContainerStyle={gridStyles.scrollContent}
              showsVerticalScrollIndicator={false}
              onScroll={({ nativeEvent }) => {
                const { layoutMeasurement, contentOffset, contentSize } = nativeEvent
                const paddingToBottom = 20
                if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
                }
              }}
              scrollEventThrottle={400}
            >
              <View style={gridStyles.papersContainer}>
                {papers.map((item, index) => {
                  console.log("Rendering paper:", item);
                  return (
                    <View key={item.paper_id} style={gridStyles.paperWrapper}>
                      <PaperListItemWeb
                        item={item}
                        navigation={navigation}
                        userId={profileData?.id}
                        isDarkMode={isDarkMode}
                        showAuthModal={() => alert("Please log in to use this feature.")}
                        setFocusedPaper={setFocusedPaper} // So the summary modal works
                        gridStyles={gridStyles}
                      />
                    </View>
                  );
                })}

              </View>

              {papers.length === 0 && !loading && (
                <Text style={{ textAlign: "center", padding: "2rem", color: "white", fontSize: "1.2rem" }}>
                  No papers found
                </Text>
              )}
            </ScrollView>
          </View>
        </LinearGradient>
      </View>

      {focusedPaper && (
        <View
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
            width: '100vw',
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(6px)',
          }}
        >
          <View
            style={{
              backgroundColor: isDarkMode ? '#1f1f1f' : '#fff',
              padding: 24,
              borderRadius: 16,
              width: '90%',
              maxWidth: 500,
              minWidth: 300,
              height: 400,
              maxHeight: 400,
              minHeight: 300,
              shadowColor: '#000',
              shadowOpacity: 0.3,
              shadowRadius: 8,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                marginBottom: 16,
                color: isDarkMode ? '#fff' : '#000',
                textAlign: 'left',
                lineHeight: 24,
                paddingBottom: 12,
                borderBottom: `1px solid ${isDarkMode ? '#333' : '#e0e0e0'}`,
                wordBreak: 'break-word',
                whiteSpace: 'normal',
                display: 'block',
              }}
            >
              {cleanLatexText(focusedPaper.title)}
            </Text>
            <View style={{ flex: 1, minHeight: 0, marginTop: 8 }}>
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1, padding: 4 }}
                showsVerticalScrollIndicator={false}
              >
                <Text style={[gridStyles.summary, { 
                  color: isDarkMode ? '#fff' : '#000',
                  lineHeight: 22,
                  fontSize: 15,
                }]}>
                  {cleanLatexText(focusedPaper.summary)}
                </Text>
              </ScrollView>
            </View>
            <TouchableOpacity
              onPress={() => setFocusedPaper(null)}
              style={{
                marginTop: 20,
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 8,
                backgroundColor: '#2196F3',
                alignSelf: 'center',
                minWidth: 80,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  )
}

const gridStyles = {
  scrollContainer: {
    flex: 1,
    paddingTop: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  papersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 20,
  },
  paperWrapper: {
    flexgrow: 1,
    flexBasis: "30%",
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
    height: 440,
    maxHeight: 440,
    minHeight: 400,


  },
  cardContent: {
    padding: 24,
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#064E41",
    marginBottom: 12,
    lineHeight: 24,
    whiteSpace: "normal",
    wordBreak: "break-word",
  },
  author: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    height: 20,
    overflow: "hidden",
    fontWeight: "500",
  },
  date: {
    fontSize: 12,
    color: "#999",
    marginBottom: 12,
    height: 16,
    fontWeight: "400",
  },
  summary: {
    // fontSize: 14,
    // color: "#555",
    // lineHeight: 20,
    // flex: 1,
    // overflow: "hidden",
    // fontWeight: "400",
    // minHeight: 140,]
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

export default ExplorePage
