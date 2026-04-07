// src/components/small-components/PaperListItemWeb.jsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
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
import SharePopup from "./SharePopupWeb";
import { cleanLatexText } from "./CleanLatexUtils";

// Shared grid/card layout object
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

function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  } catch {
    return dateString;
  }
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

  const [likeCount, setLikeCount] = useState(item?.like_count || 0);
  const [bookmarkCount, setBookmarkCount] = useState(item?.bookmark_count || 0);

  const [likeInFlight, setLikeInFlight] = useState(false);
  const [bookmarkInFlight, setBookmarkInFlight] = useState(false);

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(null);

  const paperId = item?.paper_id;
  const user_id = userId;

  const cleanedTitle = useMemo(
    () => cleanLatexText(item?.title || ""),
    [item?.title]
  );
  const cleanedSummary = useMemo(
    () => cleanLatexText(item?.summary || ""),
    [item?.summary]
  );

  const paperLink = useMemo(() => {
    try {
      return `${window.location.origin}/PaperNavigationPage/${item?.paper_id}`;
    } catch {
      return item?.url || "";
    }
  }, [item?.paper_id, item?.url]);

  // This keeps your richer share text feature
  const formattedShareText = useMemo(() => {
    return (
      `🔥 𝐋𝐚𝐭𝐞𝐬𝐭 𝐇𝐢𝐭 📄 𝐑𝐄𝐒𝐄𝐀𝐑𝐂𝐇 𝐏𝐀𝐏𝐄𝐑\r\n\r\n` +
      `𝐓𝐈𝐓𝐋𝐄:\r\n${cleanedTitle}\r\n\r\n` +
      `𝐀𝐔𝐓𝐇𝐎𝐑(𝐒):\r\n${item?.author_names || "Unknown Author"}\r\n\r\n` +
      `𝐒𝐔𝐌𝐌𝐀𝐑𝐘:\r\n${cleanedSummary}\r\n\r\n` +
      `𝐑𝐄𝐀𝐃 𝐌𝐎𝐑𝐄:\r\n${paperLink}\r\n\r\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\r\n` +
      `𝐒𝐡𝐚𝐫𝐞𝐝 𝐯𝐢𝐚 𝐓𝐢𝐜 𝐓𝐞𝐜 𝐓𝐨𝐞 𝐑𝐞𝐬𝐞𝐚𝐫𝐜𝐡 𝐏𝐥𝐚𝐭𝐟𝐨𝐫𝐦`
    );
  }, [cleanedTitle, cleanedSummary, item?.author_names, paperLink]);

  const sharePayload = useMemo(
    () => ({
      url: paperLink || item?.url,
      title: cleanedTitle,
      summary: cleanedSummary,
      author: item?.author_names,
      doi: item?.doi,
      id: item?.paper_id,
      formattedText: formattedShareText,
    }),
    [
      paperLink,
      item?.url,
      cleanedTitle,
      cleanedSummary,
      item?.author_names,
      item?.doi,
      item?.paper_id,
      formattedShareText,
    ]
  );

  function requireAuthOrShowModal() {
    if (!user_id) {
      if (typeof showAuthModal === "function") showAuthModal();
      return true;
    }
    return false;
  }

  async function toggleLike(paperId) {
    if (requireAuthOrShowModal()) return;
    if (likeInFlight) return;

    setLikeInFlight(true);
    try {
      if (liked) {
        await unlikePaper(paperId, user_id);
        setLiked(false);
        setLikeCount((prev) => Math.max(prev - 1, 0));
      } else {
        await likePaper(paperId, user_id);
        setLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } finally {
      setLikeInFlight(false);
    }
  }

  async function toggleBookmark(paperId) {
    if (requireAuthOrShowModal()) return;
    if (bookmarkInFlight) return;

    setBookmarkInFlight(true);
    try {
      if (bookmarked) {
        await unbookmarkPaper(paperId, user_id);
        setBookmarked(false);
        setBookmarkCount((prev) => Math.max(prev - 1, 0));
      } else {
        await bookmarkPaper(paperId, user_id);
        setBookmarked(true);
        setBookmarkCount((prev) => prev + 1);
      }
    } finally {
      setBookmarkInFlight(false);
    }
  }

  function handleInfo() {
    if (requireAuthOrShowModal()) return;

    try {
      localStorage.setItem("paperId", String(item?.paper_id ?? ""));
      localStorage.setItem("listenDoi", String(item?.doi ?? ""));
    } catch {
      // ignore storage failures
    }

    navigation?.navigate?.("PaperNavigationPage", {
      title: cleanedTitle,
      author: item?.author_names,
      genre: item?.categories,
      date: item?.published_date,
      paper_id: item?.paper_id,
      userId: userId,
      summary: cleanedSummary,
      doi: item?.doi,
    });
  }

  // Keeps your friend's SharePopup feature
  function handleShare() {
    if (requireAuthOrShowModal()) return;
    setIsShareOpen(true);
  }

  // Optional extra share method from your version
  async function handleDirectShare() {
    if (requireAuthOrShowModal()) return;

    const subject = encodeURIComponent("Check the Interesting Paper out");
    const body = encodeURIComponent(formattedShareText);
    const mailtoLink = `mailto:?subject=${subject}&body=${body}`;

    const shareData = {
      title: "Check the Interesting Paper out",
      text: formattedShareText,
      url: paperLink,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        window.open(mailtoLink, "_blank");
      }
    } catch (error) {
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(formattedShareText);
          alert("Paper details copied to clipboard!");
        } else {
          window.open(mailtoLink, "_blank");
        }
      } catch {
        window.open(mailtoLink, "_blank");
      }
    }
  }

  useEffect(() => {
    if (!user_id || !paperId) return;

    checkIfAlreadyLiked(paperId, user_id).then((res) => setLiked(!!res));
    checkIfAlreadyBookmarked(paperId, user_id).then((res) =>
      setBookmarked(!!res)
    );
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
      <LinearGradient
        colors={["#064E41", "#3D8C45"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={gridStyles.headerGradient}
      >
        <View style={gridStyles.headerRow}>
          <View style={gridStyles.genreTag}>
            <Text style={gridStyles.genreText}>
              {item?.category_readable
                ? item.category_readable
                : item?.categories
                ? item.categories.split(",")[0].trim()
                : "General"}
            </Text>
          </View>
          <Text style={gridStyles.dateText}>
            {formatDate(item?.published_date)}
          </Text>
        </View>
      </LinearGradient>

      <View style={gridStyles.cardContent}>
        <TouchableOpacity
          onPress={handleInfo}
          activeOpacity={0.8}
          style={{ cursor: "pointer" }}
        >
          <Text
            style={[gridStyles.title, { color: isDarkMode ? "#fff" : "#064E41" }]}
            numberOfLines={3}
          >
            {cleanedTitle}
          </Text>
        </TouchableOpacity>

        <Text
          style={[gridStyles.author, { color: isDarkMode ? "#ccc" : "#555" }]}
          numberOfLines={1}
        >
          {item?.author_names || "Unknown Author"}
        </Text>

        <TouchableOpacity
          onPress={() => setFocusedPaper && setFocusedPaper(item)}
          activeOpacity={0.9}
          style={{ flex: 1, minHeight: 0 }}
        >
          <ScrollView
            nestedScrollEnabled
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
              {cleanedSummary}
            </Text>
          </ScrollView>
        </TouchableOpacity>
      </View>

      <View
        style={[
          gridStyles.iconRow,
          {
            backgroundColor: isDarkMode ? "#3C3C3C" : "#ffffff",
            borderTop: `1px solid ${
              isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
            }`,
          },
        ]}
      >
        {/* Like */}
        <View style={{ alignItems: "center", position: "relative" }}>
          <TouchableOpacity
            onPress={() => toggleLike(paperId)}
            disabled={likeInFlight}
            onMouseEnter={() => !likeInFlight && setHoveredButton("like")}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              padding: 8,
              borderRadius: 8,
              opacity: likeInFlight ? 0.6 : 1,
              backgroundColor:
                hoveredButton === "like"
                  ? isDarkMode
                    ? "rgba(255, 107, 107, 0.15)"
                    : "rgba(255, 107, 107, 0.1)"
                  : "transparent",
              transition: "background-color 0.2s ease, transform 0.2s ease",
              transform: hoveredButton === "like" ? "scale(1.1)" : "scale(1)",
              cursor: likeInFlight ? "not-allowed" : "pointer",
            }}
          >
            <FontAwesome
              name={liked ? "heart" : "heart-o"}
              size={20}
              color={
                hoveredButton === "like"
                  ? "#ff6b6b"
                  : liked
                  ? "#ff6b6b"
                  : isDarkMode
                  ? "#fff"
                  : "#333333"
              }
            />
          </TouchableOpacity>

          {hoveredButton === "like" && (
            <View
              style={{
                position: "absolute",
                top: -32,
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "rgba(0, 0, 0, 0.85)",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 4,
                zIndex: 1000,
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              <Text style={{ color: "white", fontSize: 11 }}>
                {liked ? "Remove like" : "Like"}
              </Text>
            </View>
          )}

          <Text
            style={{
              color: isDarkMode ? "#fff" : "#333",
              fontSize: 9,
              fontWeight: "bold",
              marginTop: 4,
            }}
          >
            {likeCount}
          </Text>
        </View>

        {/* Bookmark */}
        <View style={{ alignItems: "center", position: "relative" }}>
          <TouchableOpacity
            onPress={() => toggleBookmark(paperId)}
            disabled={bookmarkInFlight}
            onMouseEnter={() =>
              !bookmarkInFlight && setHoveredButton("bookmark")
            }
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              padding: 8,
              borderRadius: 8,
              opacity: bookmarkInFlight ? 0.6 : 1,
              backgroundColor:
                hoveredButton === "bookmark"
                  ? isDarkMode
                    ? "rgba(79, 195, 247, 0.15)"
                    : "rgba(79, 195, 247, 0.1)"
                  : "transparent",
              transition: "background-color 0.2s ease, transform 0.2s ease",
              transform:
                hoveredButton === "bookmark" ? "scale(1.1)" : "scale(1)",
              cursor: bookmarkInFlight ? "not-allowed" : "pointer",
            }}
          >
            <FontAwesome
              name={bookmarked ? "bookmark" : "bookmark-o"}
              size={20}
              color={
                hoveredButton === "bookmark"
                  ? "#4fc3f7"
                  : bookmarked
                  ? "#4fc3f7"
                  : isDarkMode
                  ? "#fff"
                  : "#333333"
              }
            />
          </TouchableOpacity>

          {hoveredButton === "bookmark" && (
            <View
              style={{
                position: "absolute",
                top: -32,
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "rgba(0, 0, 0, 0.85)",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 4,
                zIndex: 1000,
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              <Text style={{ color: "white", fontSize: 11 }}>
                {bookmarked ? "Remove bookmark" : "Bookmark"}
              </Text>
            </View>
          )}

          <Text
            style={{
              color: isDarkMode ? "#fff" : "#333",
              fontSize: 9,
              fontWeight: "bold",
              marginTop: 4,
            }}
          >
            {bookmarkCount}
          </Text>
        </View>

        {/* Share */}
        <View style={{ alignItems: "center", position: "relative" }}>
          <TouchableOpacity
            onPress={handleShare}
            onDoubleClick={handleDirectShare}
            onMouseEnter={() => setHoveredButton("share")}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor:
                hoveredButton === "share"
                  ? isDarkMode
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.05)"
                  : "transparent",
              transition: "background-color 0.2s ease, transform 0.2s ease",
              transform: hoveredButton === "share" ? "scale(1.1)" : "scale(1)",
              cursor: "pointer",
            }}
          >
            <FontAwesome
              name="share"
              size={20}
              color={
                hoveredButton === "share"
                  ? isDarkMode
                    ? "#4fc3f7"
                    : "#2196F3"
                  : isDarkMode
                  ? "#fff"
                  : "#333333"
              }
            />
          </TouchableOpacity>

          {hoveredButton === "share" && (
            <View
              style={{
                position: "absolute",
                top: -32,
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "rgba(0, 0, 0, 0.85)",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 4,
                zIndex: 1000,
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              <Text style={{ color: "white", fontSize: 11 }}>Share paper</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={{ alignItems: "center", position: "relative" }}>
          <TouchableOpacity
            onPress={handleInfo}
            onMouseEnter={() => setHoveredButton("info")}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor:
                hoveredButton === "info"
                  ? isDarkMode
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.05)"
                  : "transparent",
              transition: "background-color 0.2s ease, transform 0.2s ease",
              transform: hoveredButton === "info" ? "scale(1.1)" : "scale(1)",
              cursor: "pointer",
            }}
          >
            <FontAwesome
              name="info-circle"
              size={20}
              color={
                hoveredButton === "info"
                  ? isDarkMode
                    ? "#4fc3f7"
                    : "#2196F3"
                  : isDarkMode
                  ? "#fff"
                  : "#333333"
              }
            />
          </TouchableOpacity>

          {hoveredButton === "info" && (
            <View
              style={{
                position: "absolute",
                top: -32,
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "rgba(0, 0, 0, 0.85)",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 4,
                zIndex: 1000,
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              <Text style={{ color: "white", fontSize: 11 }}>View details</Text>
            </View>
          )}
        </View>
      </View>

      {isShareOpen && (
        <SharePopup
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          url={sharePayload.url}
          title={sharePayload.title}
          summary={sharePayload.summary}
          author={sharePayload.author}
          doi={sharePayload.doi}
          id={sharePayload.id}
        />
      )}
    </View>
  );
};

export default PaperListItemWeb;