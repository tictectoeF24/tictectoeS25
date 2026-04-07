import {react} from React;
import { useEffect, useMemo, useState } from "react";
import{cleanLatexText} from "tictectoe-frontend\src\components\small-components\PaperListItem.jsx";

 
//Formats a post into a text block of a word limit of 280 characters  
export function parseText(post){
    if(!post) return "";

    const paperLink = post?.doi
      ? `https://doi.org/${post.doi}`
      : `https://tictectoe.org/PaperNavigationPage/${post.paper_id}`;

    const TITLE = `𝐓𝐈𝐓𝐋𝐄:\n${cleanLatexText(post.title)}\n\n`;
    const AUTHOR = `𝐀𝐔𝐓𝐇𝐎𝐑(𝐒):\n${post.author_names || "Unknown Author"}\n\n`;
    const SUMMARY_LABEL = `𝐒𝐔𝐌𝐌𝐀𝐑𝐘:\n`;
    const READ_MORE=  `\n\n... 𝐑𝐄𝐀𝐃 𝐌𝐎𝐑𝐄:\n${paperLink}`;

    const MAX_LENGTH = 280;
    const RESERVED_CHARS = READ_MORE.length; //remaining character space reserved for READ MORE
    const ALLOWED_LENGTH = MAX_LENGTH - RESERVED_CHARS;

    let summaryText = cleanLatexText(post.summary || "").replace(/\s+/g, " ").trim();
    let baseText = TITLE + AUTHOR + SUMMARY_LABEL;
    let availableForSummary = ALLOWED_LENGTH - baseText.length;

    if(availableForSummary < 0){
        return(
            (baseText.slice(0, ALLOWED_LENGTH - 3) + "...") +
            READ_MORE
        );
    }
    if(summaryText.length > availableForSummary){
        summaryText = summaryText.slice(0, availableForSummary - 3).trim() + "...";
    
    }
    return baseText + summaryText + READ_MORE;

}

export default function SharePopup(postText, encodedUrl){
    return(
        <div className="share-popup">
            <section className = "premade-text">
                <p>
                    {postText}
                </p>
            </section>
            <section className="share-links">
                <ul>
                    <li>
                        <a
                            href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${postText}`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            X (Twitter)
                        </a>
                    </li>
                </ul>
            </section>
        </div>
    );
};

const style = StyleSheet.create({

})