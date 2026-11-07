# Math & KaTeX Equation Reference Guide

This reference provides exact guidelines, syntactic rules, and troubleshooting procedures for mathematical equations and KaTeX rendering in the personal blog platform.

---

## 1. Architectural Overview of Math Rendering

Mathematical equations are rendered on the frontend via [`components/portable-text.tsx`](../../../../components/portable-text.tsx) using the `katex` package (`^0.19.1`).

There are two primary modes:

| Mode | Format in Markdown | Frontend Component / Handling |
| :--- | :--- | :--- |
| **Display Math** | Standalone `$$...$$` or `\[...\]` block | Rendered inside [`DisplayMathCard`](../../../../components/portable-text.tsx) with high-aesthetic card framing, subtle border, horizontal overflow scrolling, and `displayMode: true`. |
| **Inline Math** | `$variable$` or `\(formula\)` | Parsed within text runs via `renderMathString` and rendered with `displayMode: false`. Plain currency strings (e.g., `$100`, `$3.5 million`) are automatically excluded from math parsing. |

---

## 2. The Red Error Text Bug & Currency Escaping

### Root Cause
When raw dollar signs (`$`) appear inside LaTeX math mode (for instance, in economic or valuation formulas like `\frac{$100}{\frac{1}{100,000}} = $10,000,000`), KaTeX fails to parse:
```
ParseError: KaTeX parse error: Can't use function '$' in math mode at position 40: ...} = \frac{[31m$[0m100}{\frac{1}{1...
```
Because KaTeX runs with `throwOnError: false`, it catches the exception and outputs the unparsed equation wrapped in `<span class="katex-error" style="color:#cc0000">...</span>`, displaying bright red raw LaTeX code to readers.

### Escaping Rule
All literal dollar / currency symbols in LaTeX equations **must be escaped with a backslash**: `\$`.

```latex
<!-- INCORRECT (Triggers red error text in KaTeX) -->
$$
\text{VSL} = \frac{\Delta \text{WTP}}{\Delta p} = \frac{$100}{\frac{1}{100,000}} = $10,000,000
$$

<!-- CORRECT -->
$$
\text{VSL} = \frac{\Delta \text{WTP}}{\Delta p} = \frac{\$100}{\frac{1}{100{,}000}} = \$10{,}000{,}000
$$
```

### Double Escaping & Markdown Hazard
Markdown parsers (such as `marked.parse` used in `markdownToPortableText`) treat `\$` as an escaped character and unescape it to a raw `$`.
To ensure robustness:
1. [`components/portable-text.tsx`](../../../../components/portable-text.tsx) includes a defensive regex inside `DisplayMathCard`:
   ```typescript
   const sanitizedMath = cleanMath.replace(/(?<!\\)\$/g, "\\$");
   ```
2. In markdown files and transformation scripts, always write `\$` to prevent parse failures across tooling.

---

## 3. Formatting Numbers and Thousands Separators

In LaTeX math mode, commas are standard list/coordinate punctuation and add extra typographic whitespace (e.g., `$100,000$` renders as $100\text{ }000$).

To render thousands separators correctly without unwanted spacing, wrap commas in curly braces:
- Write `100{,}000` instead of `100,000`
- Write `10{,}000{,}000` instead of `10,000,000`

---

## 4. Spacing, Soft-Breaks & Block Recognition

The frontend block parser checks if a Portable Text block qualifies as display math:
```typescript
const isDisplayMath =
  (text.startsWith("$$") && text.endsWith("$$") && text.length > 4) ||
  (text.startsWith("\\[") && text.endsWith("\\]")) ||
  /^(?:\\text\{|HLV\s*=|Total Award\s*=|Hedonic Value\s*=|DALY\s*=)/.test(text);
```

### Soft-Break Pitfall
If the line immediately preceding `$$` has two trailing spaces (`  \n`), markdown treats the following line as an inline line break (`<br>`) inside the preceding `<p>` tag rather than an independent block element. This collapses the formula into the previous paragraph and prevents `DisplayMathCard` from activating.

**Rule**: Always ensure a completely clean blank line before and after display math blocks:

```markdown
<!-- INCORRECT: Trailing spaces on preceding line break block recognition -->
calculated as follows:<sup>49</sup>  
$$
\text{VSL} = \frac{\Delta \text{WTP}}{\Delta p}
$$

<!-- CORRECT: Clean double newline with no trailing spaces -->
calculated as follows:<sup>49</sup>

$$
\text{VSL} = \frac{\Delta \text{WTP}}{\Delta p} = \frac{\$100}{\frac{1}{100{,}000}} = \$10{,}000{,}000
$$

Subsequent paragraph text begins here.
```

---

## 5. Standard Equation Templates

### Value of a Statistical Life (VSL)
```latex
$$
\text{VSL} = \frac{\Delta \text{WTP}}{\Delta p} = \frac{\$100}{\frac{1}{100{,}000}} = \$10{,}000{,}000
$$
```

### Human Life Value (HLV)
```latex
$$
\text{HLV} = \sum_{t=1}^{T} \frac{E_t - C_t}{(1 + r)^t}
$$
```

### Total Damage Award (Forensic Economics)
```latex
$$
\text{Total Award} = \text{Economic Damages} + \text{Hedonic Damages}
$$
```

### Disability-Adjusted Life Years (DALY)
```latex
$$
\text{DALY} = \text{YLL} + \text{YLD}
$$
```

### Hamilton's Rule (Kin Selection)
```latex
$$
r \times B > C
$$
```
Inline form: `$r \times B > C$` or `$c < br$`.
