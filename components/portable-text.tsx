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
import { ArrowDown, Brain, Eye, Filter, TrendingUp } from "lucide-react";
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

  // Decode common HTML entities from serializers/markdown before rendering
  const decodedContent = cellContent
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  const tagRegex = /<(strong|b|em|i|sup|sub|code)>([\s\S]*?)<\/\1>/gi;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(decodedContent)) !== null) {
    if (match.index > lastIndex) {
      parts.push(renderMathString(decodedContent.slice(lastIndex, match.index)));
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

  if (lastIndex < decodedContent.length) {
    parts.push(renderMathString(decodedContent.slice(lastIndex)));
  }

  return parts.length === 1 ? parts[0] : parts;
}

function DevelopmentalFlowchart() {
  return (
    <div className="my-12 not-prose rounded-2xl border border-border/80 bg-gradient-to-b from-card/80 to-card/40 p-6 sm:p-10 shadow-sm backdrop-blur-xs">
      {/* Framework Header */}
      <div className="mb-8 border-b border-border/60 pb-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          <span>Developmental Model</span>
          <span className="h-1 w-1 rounded-full bg-blue-600 dark:bg-blue-400" />
          <span>Bigler & Liben (DIT)</span>
          <span className="h-1 w-1 rounded-full bg-blue-600 dark:bg-blue-400" />
          <span className="text-muted-foreground font-mono">Sequential Cognitive Pipeline</span>
        </div>
        <h4 className="mt-2 font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Ontogeny of Social Category Formation & Intergroup Attitudes
        </h4>
        <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          How structural environmental exposures interact with constructivist cognitive heuristics to produce age-graded expressions of racial prejudice.
        </p>
      </div>

      {/* Stage 1: Environmental Structural Filters */}
      <div className="space-y-6">
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 sm:p-6 transition-all hover:border-blue-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-blue-500/15 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 font-mono font-bold text-sm">
                01
              </div>
              <div>
                <h5 className="font-semibold text-foreground text-base sm:text-lg">
                  Environmental Structural Filters
                </h5>
                <p className="text-xs text-muted-foreground">
                  Societal inputs and perceptual boundaries in the child&apos;s daily environment
                </p>
              </div>
            </div>
            <span className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Filter className="h-3.5 w-3.5" />
              External Inputs
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/50 bg-background/70 p-3.5">
              <span className="text-xs font-bold text-foreground block mb-1">
                Perceptual Discriminability
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Salient physical variations (skin pigmentation, facial morphology, hair texture) offer visual targets for nascent categorization.
              </p>
            </div>
            <div className="rounded-lg border border-border/50 bg-background/70 p-3.5">
              <span className="text-xs font-bold text-foreground block mb-1">
                Proportional Group Size
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Numerical rarity and distinctiveness draw attentional capture, making minority cohorts highly perceptually salient.
              </p>
            </div>
            <div className="rounded-lg border border-border/50 bg-background/70 p-3.5">
              <span className="text-xs font-bold text-foreground block mb-1">
                Explicit Adult Labeling
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Adults using category labels to organize environments signals to children that the dimension carries functional social importance.
              </p>
            </div>
            <div className="rounded-lg border border-border/50 bg-background/70 p-3.5">
              <span className="text-xs font-bold text-foreground block mb-1">
                De Facto Environmental Segregation
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Spatial isolation in neighborhoods, schools, and social circles reinforces that group boundaries are rigid and naturally divided.
              </p>
            </div>
          </div>
        </div>

        {/* Downward Connector */}
        <div className="flex flex-col items-center my-1">
          <div className="h-4 w-px bg-border" />
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-muted/60 text-muted-foreground shadow-xs">
            <ArrowDown className="h-4 w-4" />
          </div>
          <div className="h-4 w-px bg-border" />
        </div>

        {/* Stage 2: Psychological Salience */}
        <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/5 p-5 sm:p-6 transition-all hover:border-indigo-500/35">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-indigo-500/15 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-sm">
                02
              </div>
              <div>
                <h5 className="font-semibold text-foreground text-base sm:text-lg">
                  Psychological Salience
                </h5>
                <p className="text-xs text-muted-foreground">
                  Cognitive establishment of category boundaries
                </p>
              </div>
            </div>
            <span className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Eye className="h-3.5 w-3.5" />
              Cognitive Threshold
            </span>
          </div>
          <div className="mt-4 rounded-lg border border-border/50 bg-background/80 p-4">
            <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed">
              Social category established as a meaningful heuristic boundary: Continuous biological variation is discretized into meaningful in-group versus out-group distinctions.
            </p>
          </div>
        </div>

        {/* Downward Connector */}
        <div className="flex flex-col items-center my-1">
          <div className="h-4 w-px bg-border" />
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-muted/60 text-muted-foreground shadow-xs">
            <ArrowDown className="h-4 w-4" />
          </div>
          <div className="h-4 w-px bg-border" />
        </div>

        {/* Stage 3: Constructivist Heuristics */}
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-5 sm:p-6 transition-all hover:border-amber-500/35">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-amber-500/15 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono font-bold text-sm">
                03
              </div>
              <div>
                <h5 className="font-semibold text-foreground text-base sm:text-lg">
                  Constructivist Heuristics
                </h5>
                <p className="text-xs text-muted-foreground">
                  Internal cognitive schemas explaining observed social stratification
                </p>
              </div>
            </div>
            <span className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Brain className="h-3.5 w-3.5" />
              Causal Attribution
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/50 bg-background/80 p-4">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block mb-1">
                The Inherence Heuristic
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Observed socioeconomic disparities, occupational hierarchies, and status differences are inferred as stemming from innate, intrinsic properties of group members rather than historical or structural causes.
              </p>
            </div>
            <div className="rounded-lg border border-border/50 bg-background/80 p-4">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block mb-1">
                Social Essentialism
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Social categories are conceptualized as immutable, natural kinds: groups are perceived as sharing a hidden, biologically transmitted &quot;essence&quot; that dictates capabilities and behavior.
              </p>
            </div>
          </div>
        </div>

        {/* Downward Connector */}
        <div className="flex flex-col items-center my-1">
          <div className="h-4 w-px bg-border" />
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-muted/60 text-muted-foreground shadow-xs">
            <ArrowDown className="h-4 w-4" />
          </div>
          <div className="h-4 w-px bg-border" />
        </div>

        {/* Stage 4: Age-Dependent Phenotypic Outputs */}
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-5 sm:p-6 transition-all hover:border-emerald-500/35">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-emerald-500/15 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-sm">
                04
              </div>
              <div>
                <h5 className="font-semibold text-foreground text-base sm:text-lg">
                  Age-Dependent Phenotypic Outputs
                </h5>
                <p className="text-xs text-muted-foreground">
                  Developmental trajectory of explicit and implicit intergroup attitudes
                </p>
              </div>
            </div>
            <span className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="h-3.5 w-3.5" />
              Phenotypic Expression
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border/50 bg-background/80 p-4 flex flex-col justify-between">
              <div>
                <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-[11px] font-mono font-bold text-foreground mb-2">
                  Ages 3–5
                </span>
                <span className="text-xs font-bold text-foreground block mb-1">
                  Category Salience & Ingroup Favoritism
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Spontaneous in-group favoritism and affective preference emerge. Outgroup derogation is typically absent at this baseline phase.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border/50 bg-background/80 p-4 flex flex-col justify-between">
              <div>
                <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-[11px] font-mono font-bold text-foreground mb-2">
                  Ages 5–7
                </span>
                <span className="text-xs font-bold text-foreground block mb-1">
                  Peak Explicit Prejudice
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Rigid category boundary adherence, peak endorsement of explicit stereotyping, and maximal willingness to justify exclusionary peer choices.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border/50 bg-background/80 p-4 flex flex-col justify-between">
              <div>
                <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-[11px] font-mono font-bold text-foreground mb-2">
                  Ages 8–11+
                </span>
                <span className="text-xs font-bold text-foreground block mb-1">
                  Normative Suppression
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Explicit bias declines sharply as children internalize egalitarian social norms and develop executive inhibitory control. However, automatic implicit associations remain intact.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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

        const isFlowchart =
          text.includes("ENVIRONMENTAL STRUCTURAL FILTERS") &&
          text.includes("PSYCHOLOGICAL SALIENCE");

        if (isFlowchart) {
          return <DevelopmentalFlowchart />;
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
