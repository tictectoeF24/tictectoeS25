import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  checkIfAlreadyLiked,
  likePaper,
  unlikePaper,
  bookmarkPaper,
  unbookmarkPaper,
  checkIfAlreadyBookmarked,
} from "../functions/PaperFunc";
import { fetchComments } from "../../../api";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Function to clean LaTeX formatting and make it readable
const cleanLatexText = (text) => {
  if (!text) return text;
  
  try {
    let cleanedText = text;
    
    // Remove inline math delimiters like $...$ and \(...\) but be more careful
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
        return match; 
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

// This is the shared grid/card layout object, inject as a prop if you want to reuse ExplorePage's exact card sizes/colors.
const defaultGridStyles = {
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
  summary: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    fontWeight: "400",
    wordBreak: "break-word",
    whiteSpace: "normal",
    textAlign: "left", 
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
};

function formatGenre(categories) {
  if (!categories) return "General";
  const firstCategory = categories.split(",")[0].trim();
  return firstCategory.length > 20
    ? firstCategory.substring(0, 20) + "..."
    : firstCategory;
}
function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  } catch (error) {
    return dateString;
  }
}
function formatCount(count) {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return count;
}

const PaperListItemWeb = ({
  item,
  navigation,
  userId,
  showAuthModal,
  isDarkMode = false,
  setFocusedPaper,
  gridStyles = defaultGridStyles,
}) => {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.like_count || 0);
  const [bookmarkCount, setBookmarkCount] = useState(item.bookmark_count || 0);

  const paperId = item.paper_id;
  const user_id = userId;

  function toggleLike(paperId) {
    if (!user_id) return showAuthModal && showAuthModal();
    if (liked) {
      unlikePaper(paperId, user_id).then((res) => {
        setLiked(false);
        setLikeCount((prev) => Math.max(prev - 1, 0));
      });
    } else {
      likePaper(paperId, user_id).then((res) => {
        setLiked(true);
        setLikeCount((prev) => prev + 1);
      });
    }
  }

  function toggleBookmark(paperId) {
    if (!user_id) return showAuthModal && showAuthModal();
    if (bookmarked) {
      unbookmarkPaper(paperId, user_id).then((res) => {
        setBookmarked(false);
        setBookmarkCount((prev) => Math.max(prev - 1, 0));
      });
    } else {
      bookmarkPaper(paperId, user_id).then((res) => {
        setBookmarked(true);
        setBookmarkCount((prev) => prev + 1);
      });
    }
  }

 function handleShare() {
  if (!user_id) return showAuthModal && showAuthModal();
  
  // Create the paper link based on your navigation structure
  const paperLink = `${window.location.origin}/PaperNavigationPage/${item.paper_id}`;
  
  // Better formatted text with bold Unicode characters starting with "Latest Hit"
  const shareText = `🔥 𝐋𝐚𝐭𝐞𝐬𝐭 𝐇𝐢𝐭 📄 𝐑𝐄𝐒𝐄𝐀𝐑𝐂𝐇 𝐏𝐀𝐏𝐄𝐑\r\n\r\n` +
  `𝐓𝐈𝐓𝐋𝐄:\r\n${cleanLatexText(item.title)}\r\n\r\n` +
  `𝐀𝐔𝐓𝐇𝐎𝐑(𝐒):\r\n${item.author_names || 'Unknown Author'}\r\n\r\n` +
  `𝐒𝐔𝐌𝐌𝐀𝐑𝐘:\r\n${cleanLatexText(item.summary)}\r\n\r\n` +
  `𝐑𝐄𝐀𝐃 𝐌𝐎𝐑𝐄:\r\n${paperLink}\r\n\r\n` +
  `━━━━━━━━━━━━━━━━━━━━━━\r\n` +
  `𝐒𝐡𝐚𝐫𝐞𝐝 𝐯𝐢𝐚 𝐓𝐢𝐜 𝐓𝐞𝐜 𝐓𝐨𝐞 𝐑𝐞𝐬𝐞𝐚𝐫𝐜𝐡 𝐏𝐥𝐚𝐭𝐟𝐨𝐫𝐦`;

  // Create mailto link with proper subject
  const subject = encodeURIComponent("Check the Interesting Paper out");
  const body = encodeURIComponent(shareText);
  const mailtoLink = `mailto:?subject=${subject}&body=${body}`;

  const shareData = {
    title: "Check the Interesting Paper out",
    text: shareText
  };

  // Check if Web Share API is supported
  if (navigator.share) {
    navigator.share(shareData)
      .then(() => console.log('Paper shared successfully'))
      .catch((error) => {
        console.log('Error sharing:', error);
        // Fallback to mailto link
        window.open(mailtoLink);
      });
  } else {
    // Use mailto link for better subject line control
    try {
      window.open(mailtoLink);
    } catch (error) {
      // Final fallback: Copy to clipboard
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText)
          .then(() => alert('Paper details copied to clipboard! You can now paste and share.'))
          .catch(() => {
            fallbackCopyToClipboard(shareText);
          });
      } else {
        fallbackCopyToClipboard(shareText);
      }
    }
  }
}

  
  function handleInfo() {
    if (!user_id) return showAuthModal && showAuthModal();
    localStorage.setItem("paperId", item.paper_id);
    localStorage.setItem("listenDoi", item.doi); // Add this line
    navigation.navigate("PaperNavigationPage", {
      title: cleanLatexText(item.title),
      author: item.author_names,
      genre: item.categories,
      date: item.published_date,
      paper_id: item.paper_id,
      userId: userId,
      summary: cleanLatexText(item.summary),
      doi: item.doi,
    });
  }

  useEffect(() => {
    if (user_id) {
      checkIfAlreadyLiked(paperId, user_id).then((res) => setLiked(res));
      checkIfAlreadyBookmarked(paperId, user_id).then((res) =>
        setBookmarked(res)
      );
    }
    // eslint-disable-next-line
  }, [user_id, paperId]);

  return (
    <View
      style={[
        gridStyles.card,
        {
          backgroundColor: isDarkMode ? "#2C2C2C" : "#fff",
          border: isDarkMode
            ? "1px solid #242424"
            : "1px solid rgba(0,0,0,0.06)",
        },
      ]}
    >
      {/* Green Gradient Header Row */}
      <LinearGradient
        colors={["#064E41", "#3D8C45"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={gridStyles.headerGradient}
      >
        <View style={gridStyles.headerRow}>
          <View style={gridStyles.genreTag}>
            <Text style={gridStyles.genreText}>
              {item.category_readable
                ? item.category_readable
                : item.categories
                ? item.categories.split(",")[0].trim()
                : "General"}
            </Text>
          </View>
          <Text style={gridStyles.dateText}>
            {formatDate(item.published_date)}
          </Text>
        </View>
      </LinearGradient>
      {/* Main Content (title, author, summary, open summary as modal) */}
      <View style={gridStyles.cardContent}>
        <Text
          style={[gridStyles.title, { color: isDarkMode ? "#fff" : "#064E41" }]}
          numberOfLines={3}
        >
          {cleanLatexText(item.title)}
        </Text>
        <Text
          style={[gridStyles.author, { color: isDarkMode ? "#ccc" : "#555" }]}
          numberOfLines={1}
        >
          {item.author_names || "Unknown Author"}
        </Text>
        <TouchableOpacity
          onPress={() => setFocusedPaper && setFocusedPaper(item)}
          activeOpacity={0.9}
          style={{ flex: 1, minHeight: 0 }}
        >
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
                  textAlign: "left", 
                },
              ]}
              numberOfLines={8}
              ellipsizeMode="tail"
            >
              {cleanLatexText(item.summary)}
            </Text>
          </ScrollView>
        </TouchableOpacity>
      </View>
      {/* Action row */}
      <View
        style={[
          gridStyles.iconRow,
          {
            backgroundColor: isDarkMode ? "#3C3C3C" : "#ffffff",
            borderTop: `1px solid ${
              isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
            }`,
          },
        ]}
      >
        <View style={{ alignItems: "center" }}>
          <TouchableOpacity onPress={() => toggleLike(paperId)}>
            <FontAwesome
              name={liked ? "heart" : "heart-o"}
              size={20}
              color={liked ? "#ff6b6b" : isDarkMode ? "#fff" : "#333333"}
            />
          </TouchableOpacity>
          <Text
            style={{
              color: isDarkMode ? "#fff" : "#333",
              fontSize: 9,
              fontWeight: "bold",
            }}
          >
            {likeCount}
          </Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <TouchableOpacity onPress={() => toggleBookmark(paperId)}>
            <FontAwesome
              name={bookmarked ? "bookmark" : "bookmark-o"}
              size={20}
              color={bookmarked ? "#4fc3f7" : isDarkMode ? "#fff" : "#333333"}
            />
          </TouchableOpacity>
          <Text
            style={{
              color: isDarkMode ? "#fff" : "#333",
              fontSize: 9,
              fontWeight: "bold",
            }}
          >
            {bookmarkCount}
          </Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <TouchableOpacity onPress={handleShare}>
            <FontAwesome
              name="share"
              size={20}
              color={isDarkMode ? "#fff" : "#333333"}
            />
          </TouchableOpacity>
        </View>
        <View style={{ alignItems: "center" }}>
          <TouchableOpacity onPress={handleInfo}>
            <FontAwesome
              name="info-circle"
              size={20}
              color={isDarkMode ? "#fff" : "#333333"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default PaperListItemWeb;
