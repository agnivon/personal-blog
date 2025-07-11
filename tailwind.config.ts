import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

export default {
  content: ["./app/**/*.{ts,tsx}", "./sanity/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)"],
      },
      typography: {
        DEFAULT: {
          css: {
            "--tw-prose-body": "hsl(var(--foreground))",
            "--tw-prose-headings": "hsl(var(--foreground))",
            "--tw-prose-lead": "hsl(var(--foreground))",
            "--tw-prose-links": "hsl(var(--foreground))",
            "--tw-prose-bold": "hsl(var(--foreground))",
            "--tw-prose-counters": "hsl(var(--foreground))",
            "--tw-prose-bullets": "hsl(var(--foreground))",
            "--tw-prose-hr": "hsl(var(--border))",
            "--tw-prose-quotes": "hsl(var(--foreground))",
            "--tw-prose-quote-borders": "hsl(var(--border))",
            "--tw-prose-captions": "hsl(var(--foreground))",
            "--tw-prose-code": "hsl(var(--foreground))",
            "--tw-prose-pre-code": "hsl(var(--foreground))",
            "--tw-prose-pre-bg": "hsl(var(--foreground))",
            "--tw-prose-th-borders": "hsl(var(--border))",
            "--tw-prose-td-borders": "hsl(var(--border))",
          },
          invert: {
            css: {
              // Dark mode (for use with dark:prose-invert)
              "--tw-prose-invert-body": "hsl(var(--foreground))",
              "--tw-prose-invert-headings": "hsl(var(--foreground))",
              "--tw-prose-invert-lead": "hsl(var(--foreground))",
              "--tw-prose-invert-links": "hsl(var(--foreground))",
              "--tw-prose-invert-bold": "hsl(var(--foreground))",
              "--tw-prose-invert-counters": "hsl(var(--foreground))",
              "--tw-prose-invert-bullets": "hsl(var(--foreground))",
              "--tw-prose-invert-hr": "hsl(var(--border))",
              "--tw-prose-invert-quotes": "hsl(var(--foreground))",
              "--tw-prose-invert-quote-borders": "hsl(var(--border))",
              "--tw-prose-invert-captions": "hsl(var(--foreground))",
              "--tw-prose-invert-code": "hsl(var(--foreground))",
              "--tw-prose-invert-pre-code": "hsl(var(--foreground))",
              "--tw-prose-invert-pre-bg": "rgb(0 0 0 / 50%)",
              "--tw-prose-invert-th-borders": "hsl(var(--border))",
              "--tw-prose-invert-td-borders": "hsl(var(--border))",
            },
          },
        },
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [typography],
} satisfies Config;
