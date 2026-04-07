// src/components/small-components/SharePopupWeb.jsx
import React, { useEffect, useMemo } from "react";
import "./SharePopupWeb.css";
import { createPortal } from "react-dom";
import { cleanLatexText } from "./CleanLatexUtils";

// Formats a post into a text block with a hard limit of 280 chars.
export function parseText(title, summary, author, doi, id) {
  const safeTitle = cleanLatexText(title || "").trim();
  if (!safeTitle) return "";

  const safeSummary = cleanLatexText(summary || "")
    .replace(/\s+/g, " ")
    .trim();

  const safeAuthor = processAuthName((author || "").trim()) || "Unknown Author";

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
  const RESERVED_CHARS = READ_MORE.length;
  const ALLOWED_LENGTH = Math.max(0, MAX_LENGTH - RESERVED_CHARS);

  const baseText = TITLE + AUTHOR + SUMMARY_LABEL;

  // If even the header doesn't fit, truncate it.
  if (baseText.length > ALLOWED_LENGTH) {
    const truncatedBase =
      ALLOWED_LENGTH <= 3 ? "" : baseText.slice(0, ALLOWED_LENGTH - 3) + "...";
    return truncatedBase + READ_MORE;
  }

  const availableForSummary = ALLOWED_LENGTH - baseText.length;

  let summaryPart = safeSummary;
  if (summaryPart.length > availableForSummary) {
    summaryPart =
      availableForSummary <= 3
        ? ""
        : summaryPart.slice(0, availableForSummary - 3).trim() + "...";
  }

  return baseText + summaryPart + READ_MORE;
}

function processAuthName(author) {
  if (!author) return author;

  // If > 3 commas => many authors, keep first 3 and add et al.
  const commaCount = (author.match(/,/g) || []).length;
  if (commaCount > 3) {
    const cutPosition = author.split(",", 3).join(",").length;
    return author.slice(0, Math.max(0, cutPosition)) + ", et al.";
  }
  return author;
}

function SharePopup({ isOpen, onClose, url, title, summary, author, doi, id }) {
  const hasNavigator = typeof window !== "undefined" && typeof navigator !== "undefined";
  const canShare = hasNavigator && typeof navigator.share === "function";

  const resolvedUrl = useMemo(() => {
    if (url && String(url).trim()) return String(url).trim();

    const d = doi && String(doi).trim();
    if (d) return d;

    // Fallback deep link (matches your parseText fallback)
    return `https://tictectoe.org/PaperNavigationPage/${id}`;
  }, [url, doi, id]);

  const tweetText = useMemo(
    () => parseText(title, summary, author, doi, id),
    [title, summary, author, doi, id]
  );

  const tweetHref = useMemo(() => {
    // Twitter/X intent supports text + url params.
    const params = new URLSearchParams();
    if (tweetText) params.set("text", tweetText);
    // Optional: also pass url separately (not required because link is already in text)
    // if (resolvedUrl) params.set("url", resolvedUrl);
    return `https://twitter.com/intent/tweet?${params.toString()}`;
  }, [tweetText]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const handleMore = async () => {
    if (!canShare) return;

    try {
      const shareTitle = cleanLatexText(title || "").trim() || "Paper";
      await navigator.share({ title: shareTitle, url: resolvedUrl });
      onClose?.();
    } catch {
      // user cancelled or blocked -> ignore
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="share-overlay" onClick={() => onClose?.()}>
      <div
        className="share-popup"
        role="dialog"
        aria-modal="true"
        aria-label="Share"
        onClick={(e) => e.stopPropagation()}
      >
        <a className="share-twitter" href={tweetHref} target="_blank" rel="noreferrer">
          Post on X
        </a>

        {canShare && (
          <button className="share-more" type="button" onClick={handleMore}>
            More
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}

export default SharePopup;