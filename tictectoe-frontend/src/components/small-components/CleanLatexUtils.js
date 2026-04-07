// cleanLatexUtils.js
export function cleanLatexText(text) {
  if (!text) return text;

  try {
    let cleanedText = text;

    // Remove inline math delimiters
    cleanedText = cleanedText.replace(/\$([^$]*)\$/g, "$1");
    cleanedText = cleanedText.replace(/\\[(](.*?)\\[)]/g, "$1");

    // Remove display math delimiters
    cleanedText = cleanedText.replace(/\$\$([^$]*)\$\$/g, "$1");
    cleanedText = cleanedText.replace(/\\[(.*?)\\]/g, "$1");

    // Fractions
    cleanedText = cleanedText.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)");

    // Square roots
    cleanedText = cleanedText.replace(/\\sqrt\{([^}]+)\}/g, "√($1)");
    cleanedText = cleanedText.replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, "($2)^(1/$1)");

    // Common LaTeX formatting commands
    cleanedText = cleanedText.replace(/\\textbf\{([^}]+)\}/g, "$1");
    cleanedText = cleanedText.replace(/\\textit\{([^}]+)\}/g, "$1");
    cleanedText = cleanedText.replace(/\\emph\{([^}]+)\}/g, "$1");
    cleanedText = cleanedText.replace(/\\text\{([^}]+)\}/g, "$1");
    cleanedText = cleanedText.replace(/\\mathrm\{([^}]+)\}/g, "$1");
    cleanedText = cleanedText.replace(/\\mathbf\{([^}]+)\}/g, "$1");
    cleanedText = cleanedText.replace(/\\mathit\{([^}]+)\}/g, "$1");
    cleanedText = cleanedText.replace(/\\mathbb\{([^}]+)\}/g, "$1");
    cleanedText = cleanedText.replace(/\\mathcal\{([^}]+)\}/g, "$1");
    cleanedText = cleanedText.replace(/\\mathfrak\{([^}]+)\}/g, "$1");
    cleanedText = cleanedText.replace(/\\operatorname\{([^}]+)\}/g, "$1");

    // Superscripts
    cleanedText = cleanedText.replace(/\^{([^}]+)}/g, (match, content) => {
      if (content.length === 1 && /\d/.test(content)) {
        const superscripts = "⁰¹²³⁴⁵⁶⁷⁸⁹";
        return superscripts[parseInt(content, 10)];
      }
      return "^(" + content + ")";
    });

    cleanedText = cleanedText.replace(/\^([a-zA-Z0-9])/g, (match, char) => {
      if (/\d/.test(char)) {
        const superscripts = "⁰¹²³⁴⁵⁶⁷⁸⁹";
        return superscripts[parseInt(char, 10)] || "^" + char;
      }
      return "^" + char;
    });

    // Subscripts
    cleanedText = cleanedText.replace(/_{([^}]+)}/g, (match, content) => {
      if (content.length === 1 && /\d/.test(content)) {
        const subscripts = "₀₁₂₃₄₅₆₇₈₉";
        return subscripts[parseInt(content, 10)];
      }
      return content;
    });

    cleanedText = cleanedText.replace(/_([a-zA-Z0-9])/g, (match, char) => {
      if (/\d/.test(char)) {
        const subscripts = "₀₁₂₃₄₅₆₇₈₉";
        return subscripts[parseInt(char, 10)] || char;
      }
      return char;
    });

    // Greek letters
    const greek = {
      "\\alpha": "α", "\\Alpha": "Α",
      "\\beta": "β", "\\Beta": "Β",
      "\\gamma": "γ", "\\Gamma": "Γ",
      "\\delta": "δ", "\\Delta": "Δ",
      "\\epsilon": "ε", "\\Epsilon": "Ε",
      "\\varepsilon": "ε",
      "\\zeta": "ζ", "\\Zeta": "Ζ",
      "\\eta": "η", "\\Eta": "Η",
      "\\theta": "θ", "\\Theta": "Θ",
      "\\vartheta": "ϑ",
      "\\iota": "ι", "\\Iota": "Ι",
      "\\kappa": "κ", "\\Kappa": "Κ",
      "\\lambda": "λ", "\\Lambda": "Λ",
      "\\mu": "μ", "\\Mu": "Μ",
      "\\nu": "ν", "\\Nu": "Ν",
      "\\xi": "ξ", "\\Xi": "Ξ",
      "\\omicron": "ο", "\\Omicron": "Ο",
      "\\pi": "π", "\\Pi": "Π",
      "\\varpi": "ϖ",
      "\\rho": "ρ", "\\Rho": "Ρ",
      "\\varrho": "ϱ",
      "\\sigma": "σ", "\\Sigma": "Σ",
      "\\varsigma": "ς",
      "\\tau": "τ", "\\Tau": "Τ",
      "\\upsilon": "υ", "\\Upsilon": "Υ",
      "\\phi": "φ", "\\Phi": "Φ",
      "\\varphi": "ϕ",
      "\\chi": "χ", "\\Chi": "Χ",
      "\\psi": "ψ", "\\Psi": "Ψ",
      "\\omega": "ω", "\\Omega": "Ω",
    };

    for (const [latex, unicode] of Object.entries(greek)) {
      cleanedText = cleanedText.replace(new RegExp(latex.replace("\\", "\\\\"), "g"), unicode);
    }

    // Operators
    const ops = {
      "\\leq": "≤", "\\le": "≤",
      "\\geq": "≥", "\\ge": "≥",
      "\\neq": "≠", "\\ne": "≠",
      "\\approx": "≈",
      "\\sim": "∼",
      "\\simeq": "≃",
      "\\equiv": "≡",
      "\\cong": "≅",
      "\\propto": "∝",
      "\\infty": "∞",
      "\\pm": "±", "\\mp": "∓",
      "\\times": "×",
      "\\div": "÷",
      "\\cdot": "·",
      "\\sum": "∑",
      "\\prod": "∏",
      "\\int": "∫",
      "\\partial": "∂",
      "\\nabla": "∇",
      "\\in": "∈",
      "\\notin": "∉",
      "\\subset": "⊂",
      "\\supset": "⊃",
      "\\subseteq": "⊆",
      "\\supseteq": "⊇",
      "\\cup": "∪",
      "\\cap": "∩",
      "\\emptyset": "∅",
      "\\forall": "∀",
      "\\exists": "∃",
      "\\rightarrow": "→", "\\to": "→",
      "\\leftarrow": "←",
      "\\leftrightarrow": "↔",
      "\\Rightarrow": "⇒",
      "\\Leftarrow": "⇐",
      "\\Leftrightarrow": "⇔",
    };

    for (const [latex, unicode] of Object.entries(ops)) {
      cleanedText = cleanedText.replace(new RegExp(latex.replace("\\", "\\\\"), "g"), unicode);
    }

    // Final cleanup of leftover backslashes/braces (optional)
    cleanedText = cleanedText.replace(/[{}]/g, "");
    cleanedText = cleanedText.replace(/\\+/g, "");

    return cleanedText;
  } catch {
    return text;
  }
}