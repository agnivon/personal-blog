/**
 * This component uses Portable Text to render a post body.
 *
 * You can learn more about Portable Text on:
 * https://www.sanity.io/docs/block-content
 * https://github.com/portabletext/react-portabletext
 * https://portabletext.org/
 */

import React from "react";
import katex from "katex";
import {
  PortableText,
  type PortableTextComponents,
  type PortableTextBlock,
} from "next-sanity";

function DisplayMathCard({ math }: { math: string }) {
  const cleanMath = math.replace(/^(\$\$|\\\[)|(\$\$|\\\])$/g, "").trim();
  // In LaTeX math mode, literal currency $ must be escaped as \$
  const sanitizedMath = cleanMath.replace(/(?<!\\)\$/g, "\\$");
  let html = "";
  try {
    html = katex.renderToString(sanitizedMath, {
      displayMode: true,
      throwOnError: false,
    });
  } catch {
    html = cleanMath;
  }

  return (
    <div className="my-8 not-prose flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card/60 p-6 text-card-foreground shadow-xs backdrop-blur-xs transition-colors hover:border-border">
      <div
        className="w-full overflow-x-auto text-center py-2 text-lg sm:text-xl [&_.katex]:text-lg sm:[&_.katex]:text-xl [&_.katex-display]:my-0"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

function renderTextWithBreaks(rawText: string, keyPrefix: string): React.ReactNode[] {
  if (!rawText.includes("\n")) return [rawText];
  const lines = rawText.split("\n");
  const nodes: React.ReactNode[] = [];
  lines.forEach((line, i) => {
    if (i > 0) {
      nodes.push(<br key={`${keyPrefix}-br-${i}`} />);
    }
    if (line) {
      nodes.push(line);
    }
  });
  return nodes;
}

const inlineMathRegex = /\$(?!\s)([^\$\n]+?)(?<!\s)\$|\\\(([\s\S]+?)\\\)/g;

function renderMathString(text: string): React.ReactNode {
  if (!text.includes("$") && !text.includes("\\(") && !text.includes("\\text{")) {
    if (text.includes("\n")) {
      const parts = renderTextWithBreaks(text, "txt");
      return parts.length === 1 ? parts[0] : parts;
    }
    return text;
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  inlineMathRegex.lastIndex = 0;

  while ((match = inlineMathRegex.exec(text)) !== null) {
    const rawMatch = match[0];
    const mathContent = (match[1] || match[2] || "").trim();

    // Check if this looks like currency rather than math: e.g. "$100", "$3.5 million", "$250,000"
    const isCurrency =
      /^\d+(?:,\d+)*(?:\.\d+)?(?:\s*(?:million|billion|trillion|thousand))?$/i.test(
        mathContent
      );
    const hasMathIndicators =
      /[\\=<>_\^×±÷]|\b(times|frac|sum|text)\b/.test(mathContent);
    const isMath =
      !isCurrency &&
      (hasMathIndicators || !/\b(to|and|or|in|is|of|for)\b/.test(mathContent));

    if (match.index > lastIndex) {
      parts.push(
        ...renderTextWithBreaks(
          text.slice(lastIndex, match.index),
          `txt-${lastIndex}`
        )
      );
    }

    if (isMath) {
      try {
        const html = katex.renderToString(mathContent, {
          displayMode: false,
          throwOnError: false,
        });
        parts.push(
          <span
            key={`math-${match.index}`}
            className="inline-block px-1 align-baseline text-foreground [&_.katex]:text-[1.05em]"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      } catch {
        parts.push(rawMatch);
      }
    } else {
      parts.push(rawMatch);
    }

    lastIndex = match.index + rawMatch.length;
  }

  if (lastIndex < text.length) {
    parts.push(
      ...renderTextWithBreaks(text.slice(lastIndex), `end-${lastIndex}`)
    );
  }

  return parts.length === 1 ? parts[0] : parts;
}

function renderMathInNodes(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child === "string") {
      return renderMathString(child);
    }
    if (
      React.isValidElement(child) &&
      (child.props as { children?: React.ReactNode })?.children
    ) {
      return React.cloneElement(
        child as React.ReactElement<{ children?: React.ReactNode }>,
        undefined,
        renderMathInNodes(
          (child.props as { children?: React.ReactNode }).children
        )
      );
    }
    return child;
  });
}

function renderCellHtml(cellContent: string): React.ReactNode {
  if (!cellContent) return "";

  const tagRegex = /<(strong|b|em|i|sup|sub|code)>([\s\S]*?)<\/\1>/gi;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(cellContent)) !== null) {
    if (match.index > lastIndex) {
      parts.push(renderMathString(cellContent.slice(lastIndex, match.index)));
    }
    const tag = match[1].toLowerCase();
    const innerText = match[2];
    const key = `cell-${match.index}`;

    if (tag === "sup") {
      parts.push(
        <sup
          key={key}
          className="text-[0.7em] font-semibold text-blue-600 dark:text-blue-400 ml-0.5 leading-none align-super"
        >
          {innerText}
        </sup>
      );
    } else if (tag === "sub") {
      parts.push(
        <sub
          key={key}
          className="text-[0.7em] font-semibold text-muted-foreground ml-0.5 leading-none align-sub"
        >
          {innerText}
        </sub>
      );
    } else if (tag === "strong" || tag === "b") {
      parts.push(
        <strong key={key} className="font-semibold text-foreground">
          {renderMathString(innerText)}
        </strong>
      );
    } else if (tag === "em" || tag === "i") {
      parts.push(
        <em key={key} className="italic text-foreground">
          {renderMathString(innerText)}
        </em>
      );
    } else if (tag === "code") {
      parts.push(
        <code key={key} className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
          {innerText}
        </code>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < cellContent.length) {
    parts.push(renderMathString(cellContent.slice(lastIndex)));
  }

  return parts.length === 1 ? parts[0] : parts;
}

export default function CustomPortableText({
  className,
  value,
}: {
  className?: string;
  value: PortableTextBlock[];
}) {
  const components: PortableTextComponents = {
    types: {
      table: ({
        value: tableVal,
      }: {
        value?: { rows?: { _key: string; cells: string[] }[] };
      }) => {
        const rows = tableVal?.rows || [];
        if (!rows.length) return null;
        const headerRow = rows[0]?.cells || [];
        const bodyRows = rows.slice(1);
        return (
          <div className="my-8 not-prose overflow-x-auto rounded-2xl border border-border/60 bg-card/60 shadow-xs backdrop-blur-xs">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-border/60 bg-muted/50 font-serif font-bold text-foreground">
                <tr>
                  {headerRow.map((cell: string, idx: number) => (
                    <th key={idx} className="px-4 py-3.5 tracking-tight font-semibold">
                      {renderCellHtml(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {bodyRows.map((r, rIdx) => (
                  <tr
                    key={r._key || rIdx}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    {(r.cells || []).map((cell: string, cIdx: number) => (
                      <td
                        key={cIdx}
                        className="px-4 py-3.5 align-top leading-relaxed text-muted-foreground"
                      >
                        {renderCellHtml(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      },
    },
    block: {
      normal: ({ children, value }) => {
        const text =
          value.children
            ?.map((c) =>
              "text" in c && typeof c.text === "string" ? c.text : ""
            )
            .join("")
            .trim() || "";

        const isDisplayMath =
          (text.startsWith("$$") && text.endsWith("$$") && text.length > 4) ||
          (text.startsWith("\\[") && text.endsWith("\\]")) ||
          /^(?:\\text\{|HLV\s*=|Total Award\s*=|Hedonic Value\s*=|DALY\s*=)/.test(
            text
          );

        if (isDisplayMath) {
          return <DisplayMathCard math={text} />;
        }

        return (
          <p className="mb-4 leading-relaxed">{renderMathInNodes(children)}</p>
        );
      },
      h5: ({ children }) => (
        <h5 className="mb-2 text-sm font-semibold">{renderMathInNodes(children)}</h5>
      ),
      h6: ({ children }) => (
        <h6 className="mb-1 text-xs font-semibold">{renderMathInNodes(children)}</h6>
      ),
      blockquote: ({ children }) => (
        <blockquote className="border-l-4 border-primary/40 pl-4 my-4 italic text-muted-foreground">
          {renderMathInNodes(children)}
        </blockquote>
      ),
    },
    marks: {
      sup: ({ children }) => (
        <sup className="text-[0.7em] font-semibold text-blue-600 dark:text-blue-400 ml-0.5 leading-none align-super">
          {children}
        </sup>
      ),
      sub: ({ children }) => (
        <sub className="text-[0.7em] font-semibold text-muted-foreground ml-0.5 leading-none align-sub">
          {children}
        </sub>
      ),
      link: ({ children, value }) => {
        return (
          <a href={value?.href} rel="noreferrer noopener">
            {children}
          </a>
        );
      },
    },
  };

  return (
    <div className={["prose", className].filter(Boolean).join(" ")}>
      <PortableText components={components} value={value} />
    </div>
  );
}
