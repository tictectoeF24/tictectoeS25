// SharePopup.native.jsx
import React, { useMemo } from "react";
import {
  Modal,
  Pressable,
  Text,
  StyleSheet,
  Share,
  Linking,
  Platform,
} from "react-native";
import { cleanLatexText } from "./CleanLatexUtils";

function processAuthName(author) {
  if (!author) return "";

  // normalize to string
  const str = Array.isArray(author)
    ? author.filter(Boolean).join(", ")
    : String(author);

  // If there are many authors, keep first 3 and add et al.
  const commaCount = (str.match(/,/g) || []).length;
  if (commaCount > 3) {
    const cutPosition = str.split(",", 3).join(",").length;
    return str.slice(0, Math.max(0, cutPosition)) + ", et al.";
  }
  return str;
}

// Formats a post into a text block with a word limit of 280 characters
export function parseText(title, summary, author, doi, id) {
  const safeTitle = cleanLatexText(title || "").trim();
  if (!safeTitle) return "";

  const safeAuthor = processAuthName(author) || "Unknown Author";

  // Prefer DOI link if present; otherwise deep link
  const parsedDOI = doi.replace("http://arxiv.org/abs/","").trim();
  const paperLink = `http://localhost:8081/paper/${parsedDOI}`;
  /*
    ? String(doi).trim()
    : `https://tictectoe.org/PaperNavigationPage/${id}`;
  */

  const TITLE = `𝐓𝐈𝐓𝐋𝐄:\n${safeTitle}\n\n`;
  const AUTHOR = `𝐀𝐔𝐓𝐇𝐎𝐑(𝐒):\n${safeAuthor}\n\n`;
  const SUMMARY_LABEL = `𝐒𝐔𝐌𝐌𝐀𝐑𝐘:\n`;
  const READ_MORE = `\n\n... 𝐑𝐄𝐀𝐃 𝐌𝐎𝐑𝐄:\n${paperLink}`;

  const MAX_LENGTH = 279;

  // Summary cleaned + normalized whitespace
  const safeSummary = cleanLatexText(summary || "")
    .replace(/\s+/g, " ")
    .trim();

  // Reserve space for READ_MORE, then fit base header + summary into remaining
  const reservedForReadMore = READ_MORE.length;
  const allowed = Math.max(0, MAX_LENGTH - reservedForReadMore);

  const baseText = TITLE + AUTHOR + SUMMARY_LABEL;

  // If header alone doesn't fit, truncate it
  if (baseText.length > allowed) {
    const truncatedBase =
      allowed <= 3 ? "" : baseText.slice(0, allowed - 3) + "...";
    return truncatedBase + READ_MORE;
  }

  const availableForSummary = allowed - baseText.length;

  let clippedSummary = safeSummary;
  if (clippedSummary.length > availableForSummary) {
    clippedSummary =
      availableForSummary <= 3
        ? ""
        : clippedSummary.slice(0, availableForSummary - 3).trim() + "...";
  }

  return baseText + clippedSummary + READ_MORE;
}

export default function SharePopup({
  isOpen,
  onClose,
  url,
  title,
  summary,
  author,
  doi,
  id,
}) {
  const resolvedUrl = useMemo(() => {
    if (url && String(url).trim()) return String(url).trim();

    const d = doi && String(doi).trim();
    if (d) return `https://doi.org/${d}`;

    return `https://tictectoe.org/PaperNavigationPage/${id}`;
  }, [url, doi, id]);

  const shareMessage = useMemo(
    () => parseText(title, summary, author, doi, id),
    [title, summary, author, doi, id]
  );

  const tweetIntentUrl = useMemo(() => {
    // Keep it simple: tweet text already includes the READ MORE link.
    // (So we don't add &url=... and risk duplicate links.)
    const params = new URLSearchParams();
    if (shareMessage) params.set("text", shareMessage);
    return `https://twitter.com/intent/tweet?${params.toString()}`;
  }, [shareMessage]);

  const handlePostOnX = async () => {
    try {
      await Linking.openURL(tweetIntentUrl);
      onClose?.();
    } catch (e) {
      console.error("Failed to open X intent:", e);
    }
  };

  const handleMore = async () => {
    try {
      // Share.share is inconsistent across platforms regarding `url`.
      // Best cross-platform approach: put everything in `message`.
      const message = shareMessage || resolvedUrl;

      await Share.share(
        Platform.OS === "ios"
          ? { title: "Check this paper out", message, url: resolvedUrl }
          : { message }
      );

      onClose?.();
    } catch {
      // user cancel is common; ignore
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.popup} onPress={(e) => e.stopPropagation()}>
          <Pressable style={[styles.btn, styles.btnPrimary]} onPress={handlePostOnX}>
            <Text style={styles.btnPrimaryText}>Post on X</Text>
          </Pressable>

          <Pressable style={[styles.btn, styles.btnSecondary]} onPress={handleMore}>
            <Text style={styles.btnSecondaryText}>More</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  popup: {
    width: "90%",
    maxWidth: 360,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 10, // Android
    shadowColor: "#000", // iOS
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  btn: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.12)",
  },
  btnPrimaryText: { fontWeight: "600" },
  btnSecondary: {},
  btnSecondaryText: { fontWeight: "600" },
});