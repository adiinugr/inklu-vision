"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface MarkdownLatexProps {
  content: string;
  className?: string;
}

/**
 * remark-math@6 only recognizes $$ as block math when it appears at the
 * start of a line. This normalizes all $$ ... $$ occurrences so they are
 * surrounded by blank lines, regardless of where the guru placed them.
 */
function normalizeMathBlocks(content: string): string {
  const result = content.replace(/\$\$([\s\S]*?)\$\$/g, (_, inner) => {
    const trimmed = inner.trim();
    return `\n\n$$\n${trimmed}\n$$\n\n`;
  });
  // Collapse runs of 3+ newlines back to 2
  return result.replace(/\n{3,}/g, "\n\n");
}

export default function MarkdownLatex({
  content,
  className = "",
}: MarkdownLatexProps) {
  const normalized = normalizeMathBlocks(content);

  return (
    <div className={`prose max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Wrap display math in accessible container
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          div: ({ node, className: cls, children, ...props }: any) => {
            if (cls?.includes("math-display")) {
              return (
                <div
                  role="math"
                  aria-label="Persamaan matematika"
                  className={cls}
                  {...props}
                >
                  {children}
                </div>
              );
            }
            return (
              <div className={cls} {...props}>
                {children}
              </div>
            );
          },
        }}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
}
