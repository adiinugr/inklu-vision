function convertMath(latex: string): string {
  let text = latex;

  // Step 0a: Protect \commands with tokens so letter-splitting doesn't break them
  const tokens: string[] = [];
  text = text.replace(/\\[a-zA-Z]+/g, (match) => {
    const idx = tokens.length;
    tokens.push(match);
    return `__CMD${idx}__`;
  });

  // Step 0b: Split adjacent letters (implicit multiplication in math), and digit+letter
  // Run twice to handle chains like abc → a bc → a b c
  text = text.replace(/([a-zA-Z])([a-zA-Z])/g, "$1 $2");
  text = text.replace(/([a-zA-Z])([a-zA-Z])/g, "$1 $2");
  text = text.replace(/([0-9])([a-zA-Z])/g, "$1 $2");

  // Step 0c: Restore tokens
  text = text.replace(/__CMD(\d+)__/g, (_, i) => tokens[Number(i)]);

  // Fractions: \frac{a}{b}
  text = text.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1 dibagi $2");

  // Nth root: \sqrt[n]{x}
  text = text.replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, "akar $1 dari $2");

  // Square root: \sqrt{x}
  text = text.replace(/\\sqrt\{([^}]+)\}/g, "akar dari $1");

  // Powers: x^2, x^3, x^{n}
  text = text.replace(/\^2/g, " kuadrat");
  text = text.replace(/\^3/g, " kubik");
  text = text.replace(/\^\{([^}]+)\}/g, " pangkat $1");
  text = text.replace(/\^(\w)/g, " pangkat $1");

  // Subscripts: _{x} or _x — just read the subscript value, no "subskrip" word
  text = text.replace(/\_\{([^}]+)\}/g, " $1");
  text = text.replace(/\_(\w)/g, " $1");

  // Operators
  text = text.replace(/\\pm/g, "plus minus");
  text = text.replace(/\\times/g, "dikali");
  text = text.replace(/\\div/g, "dibagi");
  text = text.replace(/\\leq/g, "lebih kecil sama dengan");
  text = text.replace(/\\geq/g, "lebih besar sama dengan");
  text = text.replace(/\\neq/g, "tidak sama dengan");
  text = text.replace(/\\approx/g, "kira-kira sama dengan");
  text = text.replace(/\\infty/g, "tak hingga");

  // Constants and symbols
  text = text.replace(/\\pi/g, "pi");
  text = text.replace(/\\alpha/g, "alfa");
  text = text.replace(/\\beta/g, "beta");
  text = text.replace(/\\gamma/g, "gamma");
  text = text.replace(/\\delta/g, "delta");
  text = text.replace(/\\theta/g, "teta");
  text = text.replace(/\\sigma/g, "sigma");
  text = text.replace(/\\lambda/g, "lambda");
  text = text.replace(/\\mu/g, "mu");

  // Calculus
  text = text.replace(/\\sum/g, "jumlah");
  text = text.replace(/\\int/g, "integral");
  text = text.replace(/\\lim/g, "limit");

  // Strip remaining LaTeX artifacts
  text = text.replace(/\\[a-zA-Z]+/g, "");
  text = text.replace(/[{}\\]/g, "");

  // Add spoken words for minus, plus, equals
  // Match digit/letter before operator with optional spaces (LaTeX often has no spaces)
  text = text.replace(/([a-zA-Z0-9])\s*-\s*/g, "$1 minus ");
  text = text.replace(/([a-zA-Z0-9])\s*\+\s*/g, "$1 plus ");
  text = text.replace(/([a-zA-Z0-9])\s*=\s*/g, "$1 sama dengan ");

  return text.trim();
}

export function latexToSpeech(text: string): string {
  let result = text;

  // Remove fenced code blocks
  result = result.replace(/```[\s\S]*?```/g, "");
  result = result.replace(/`[^`]+`/g, "");

  // Convert display math $$...$$
  result = result.replace(/\$\$([^$]+)\$\$/g, (_, math) => convertMath(math));

  // Convert inline math $...$
  result = result.replace(/\$([^$\n]+)\$/g, (_, math) => convertMath(math));

  // Strip Markdown formatting
  result = result.replace(/^#{1,6}\s+/gm, ""); // headings
  result = result.replace(/\*\*([^*]+)\*\*/g, "$1"); // bold
  result = result.replace(/\*([^*]+)\*/g, "$1"); // italic
  result = result.replace(/_{2}([^_]+)_{2}/g, "$1"); // bold underscore
  result = result.replace(/^>\s+/gm, ""); // blockquotes
  result = result.replace(/^---+$/gm, ""); // horizontal rules
  result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // links
  result = result.replace(/^[-*+]\s+/gm, ""); // unordered list items
  result = result.replace(/^\d+\.\s+/gm, ""); // ordered list items
  result = result.replace(/^[|].*$/gm, ""); // table rows

  // Collapse extra whitespace
  result = result.replace(/\n{3,}/g, "\n\n");
  result = result.replace(/[ \t]+/g, " ");
  result = result.trim();

  return result;
}
