import { useColorScheme, Dimensions } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import {
  checkIfAlreadyLiked,
  likePaper,
  unlikePaper,
  bookmarkPaper,
  unbookmarkPaper,
  checkIfAlreadyBookmarked,
} from "../functions/PaperFunc"
import { useEffect, useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from "react-native"
import { FontAwesome } from "@expo/vector-icons"
import { fetchComments } from "../../../api"
import AsyncStorage from "@react-native-async-storage/async-storage"

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
        return content; // Just return the content without extra formatting
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
        // Skip problematic patterns
      }
    });

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

export function PaperListItem({ item, navigation, userId, showAuthModal }) {
  const isDarkMode = useColorScheme() === "dark" //check!!!
  const screenWidth = Dimensions.get("window").width
  const screenHeight = Dimensions.get("window").height

  // Keep original card dimensions for one-page scroll functionality
  const cardWidth = screenWidth - 60
  const cardHeight = screenHeight * 0.7

  const topMargin = 20
  const bottomMargin = 200

  const paperId = item.paper_id
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [likeCount, setLikeCount] = useState(item.like_count ?? 0)
  const [bookmarkCount, setBookmarkCount] = useState(item.bookmark_count ?? 0)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [modalVisible, setModalVisible] = useState(false);

  const user_id = userId

  function toggleLike(paperId) {
    if (!user_id) {
      if (showAuthModal) showAuthModal();
      return;
    }
    if (liked) {
      unlikePaper(paperId, user_id).then((res) => {
        setLiked(!res);
        setLikeCount((prev) => Math.max(prev - 1, 0));
      });
    } else {
      likePaper(paperId, user_id).then((res) => {
        setLiked(res);
        setLikeCount((prev) => prev + 1);
      });
    }
  }

  function toggleBookmark(paperId) {
    if (!user_id) {
      if (showAuthModal) showAuthModal()
      return
    }

    if (bookmarked) {
      unbookmarkPaper(paperId, user_id).then((res) => {
        setBookmarked(!res)
        setBookmarkCount((prev) => Math.max(prev - 1, 0));
      })
    } else {
      bookmarkPaper(paperId, user_id).then((res) => {
        setBookmarked(res)
        setBookmarkCount((prev) => prev + 1);
      })
    }
  }

  function handleShare() {
    if (!user_id) {
      if (showAuthModal) showAuthModal()
      return
    }
  }

  const toggleComments = async () => {
    if (!user_id) {
      if (showAuthModal) showAuthModal()
      return
    }

    if (!showComments) {
      try {
        const fetched = await fetchComments(paperId)
        setComments(fetched)
      } catch (e) {
        console.error("Failed to load comments", e)
      }
    }
    setShowComments(!showComments)
  }

  const handlePaperClick = async () => {
    if (!user_id) {
      if (showAuthModal) showAuthModal()
      return
    }

    await AsyncStorage.setItem("paperId", item.paper_id)
    await AsyncStorage.setItem("listenDoi", item.doi) // Add this line
    navigation.navigate("PaperNavigationPage", {
      title: cleanLatexText(item.title),
      author: item.author_names,
      genre: item.category_readable || item.categories,
      date: item.published_date,
      paper_id: item.paper_id,
      userId: userId,
      summary: cleanLatexText(item.summary),
      doi: item.doi,
    })
  }
  useEffect(() => {
    if (user_id) {
      checkIfAlreadyLiked(paperId, user_id).then((res) => {
        setLiked(res)
      })
      checkIfAlreadyBookmarked(paperId, user_id).then((res) => {
        setBookmarked(res)
      })
    }
  }, [user_id, paperId])

  const authorsArray = (item.author_names || "").split(", ")
  const displayedAuthors = authorsArray.slice(0, 3).join(", ") + (authorsArray.length > 3 ? ", ..." : "")

  // Format the genre/categories for display
  const formatGenre = (categories) => {
    if (!categories) return "General"
    const firstCategory = categories.split(",")[0].trim()
    return firstCategory.length > 20 ? firstCategory.substring(0, 20) + "..." : firstCategory
  }

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      })
    } catch (error) {
      return dateString
    }
  }

  const styles = StyleSheet.create({
    card: {
      width: cardWidth,
      height: cardHeight,
      marginTop: topMargin,
      marginBottom: bottomMargin,
      backgroundColor: "#fff",
      borderRadius: 15,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 5,
      elevation: 6,
      alignSelf: "center",
    },
    headerGradient: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 14,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    genreTag: {
      backgroundColor: "#3D8C45",
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 15,
      maxWidth: screenWidth * 0.5,
    },
    genreText: {
      color: "#fff",
      fontSize: 11.8,
      fontWeight: "600",
      textAlign: "center",
    },
    dateText: {
      fontSize: 14,
      color: "#fff",
      fontWeight: "500",
    },
    cardContent: {
      flex: 1,
      width: "100%",
      padding: 20,
      paddingTop: 16,
      //justifyContent: "space-between",
      justifyContent: "flex-start",
      backgroundColor: "#fff",
    },
    title: {
      fontSize: 17,
      color: "#333",
      fontWeight: "bold",
      marginBottom: 12,
      lineHeight: 20,
    },
    authors: {
      fontSize: 13,
      color: "#555",
      marginBottom: 8,
    },
    titleText: {
      fontSize: 18,
      fontWeight: "600",
      color: "#064E41",
      marginBottom: 12,
      lineHeight: 24,
      textAlign: "left", 
      includeFontPadding: false,
      textAlignVertical: "top",
    },
    summaryContainer: {
      flex: 1,
      marginBottom: 10,
    },
    summaryText: {
      fontSize: 14,
      color: "#555",
      lineHeight: 20,
      fontWeight: "400",
      textAlign: "left", // Changed from justify to left for better spacing
      includeFontPadding: false,
      textAlignVertical: "top",
      paddingTop: 2,
      paddingBottom: 2,
    },
    summary: {
      fontSize: 14,
      color: "#666",
      lineHeight: 17,
    },
    iconContainer: {
      borderTopWidth: 1,
      borderColor: "#DDD",
      flexDirection: "row",
      justifyContent: "space-around",
      paddingVertical: 15,
      backgroundColor: "#fff",
    },
    iconButton: {
      alignItems: "center",
      justifyContent: "center",
      padding: 8,
      borderRadius: 25,
      minWidth: 50,
    },
    commentBox: {
      padding: 10,
      backgroundColor: "#f9f9f9",
      borderTopWidth: 1,
      borderColor: "#eee",
      maxHeight: 200,
    },
    commentItem: {
      marginBottom: 8,
      padding: 8,
      backgroundColor: "#eef",
      borderRadius: 5,
    },
    commentText: {
      fontSize: 14,
      color: "#333",
    },
    commentTime: {
      fontSize: 12,
      color: "#777",
      marginTop: 4,
    },
    noCommentsText: {
      fontSize: 14,
      color: "#999",
      textAlign: "center",
      fontStyle: "italic",
      padding: 10,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    modalCard: {
      width: "100%",
      maxHeight: "70%",
      borderRadius: 16,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 10,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 10,
      textAlign: "left",
    },
    modalSummaryText: {
      fontSize: 15,
      lineHeight: 22,
      textAlign: "left", 
      fontWeight: "400",
      includeFontPadding: false,
      textAlignVertical: "top",
      paddingTop: 4,
      paddingBottom: 4,
    },
    modalCloseButton: {
      marginTop: 20,
      backgroundColor: "#064E41",
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: "center",
    },
    modalCloseText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 16,
    },

  })

  return (
    <View style={styles.card}>
      {/* Header with Green Gradient Background (matching reference image) */}
      <LinearGradient
        colors={["#064E41", "#3D8C45"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerRow}>
          <View style={styles.genreTag}>
            <Text style={styles.genreText}>
              {item.category_readable
                ? item.category_readable
                : (item.categories ? formatGenre(item.categories) : "General")}
            </Text>
          </View>
          <Text style={styles.dateText}>{formatDate(item.published_date)}</Text>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <View style={styles.cardContent}>
        <Text style={styles.titleText}>
          {cleanLatexText(item.title)?.replace(/\s+/g, " ").trim()}
        </Text>
        <Text style={styles.authors}>{displayedAuthors}</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.summaryText}>
            {cleanLatexText(item.summary)?.replace(/\s+/g, " ").trim()}
          </Text>
        </TouchableOpacity>
      </View>
     

      {/* Action Buttons */}
      <View style={styles.iconContainer}>
        <View style={{ alignItems: "center" }}>
          <TouchableOpacity style={styles.iconButton} onPress={() => toggleLike(paperId)}>
            <FontAwesome
              name={liked ? "heart" : "heart-o"}
              size={24}
              color={liked ? "red" : isDarkMode ? "#333" : "#777"}
            />
          </TouchableOpacity>
          <Text style={{ color: isDarkMode ? "#fff" : "#333", fontSize: 10, fontWeight: "bold" }}>{likeCount}</Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <TouchableOpacity style={styles.iconButton} onPress={() => toggleBookmark(paperId)}>
            <FontAwesome
              name={bookmarked ? "bookmark" : "bookmark-o"}
              size={24}
              color={bookmarked ? "#2196F3" : isDarkMode ? "#333" : "#777"}
            />
          </TouchableOpacity>
          <Text style={{ color: isDarkMode ? "#fff" : "#333", fontSize: 10, fontWeight: "bold" }}>{bookmarkCount}</Text>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
          <FontAwesome name="share" size={24} color={isDarkMode ? "#333" : "#777"} />
        </TouchableOpacity>
         <TouchableOpacity style={styles.iconButton} onPress={handlePaperClick}>
          <FontAwesome name="info-circle" size={24} color={isDarkMode ? "#fff" : "#333"} />
        </TouchableOpacity>
        
      </View>
      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isDarkMode ? "#1E1E1E" : "#fff" }]}>
            <Text style={[styles.modalTitle, { color: isDarkMode ? "#fff" : "#000" }]}>
              {cleanLatexText(item.title)?.replace(/\s+/g, " ").trim()}
            </Text>
            <ScrollView>
              <Text style={[styles.modalSummaryText, { color: isDarkMode ? "#ccc" : "#333" }]}>
                {cleanLatexText(item.summary)?.replace(/\s+/g, " ").trim()}
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Comments Section */}
      {showComments && (
        <View style={styles.commentBox}>
          {comments.length > 0 ? (
            comments.map((comment, index) => (
              <View key={index} style={styles.commentItem}>
                <Text style={styles.commentText}>{comment.content}</Text>
                <Text style={styles.commentTime}>{comment.timestamp}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noCommentsText}>No comments yet.</Text>
          )}
        </View>
      )}
    </View>
  )
}
