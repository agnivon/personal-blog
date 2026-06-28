---
version: "alpha"
name: Sleek Neo-Minimalist
description: A modern, sleek, and highly readable design system for personal blogs. Focuses on content-first layouts, high-end typography, and subtle micro-interactions.
colors:
  background: "oklch(0.99 0.002 240)"
  foreground: "oklch(0.12 0.005 240)"
  primary: "oklch(0.12 0.005 240)"
  secondary: "oklch(0.96 0.003 240)"
  accent: "oklch(0.95 0.005 240)"
  border: "oklch(0.92 0.003 240)"
  ring: "oklch(0.5 0.15 250)"
  blue-accent: "#2563EB"
  
  # Dark Mode overrides
  background-dark: "oklch(0.09 0.002 240)"
  foreground-dark: "oklch(0.95 0.002 240)"
  primary-dark: "oklch(0.95 0.002 240)"
  secondary-dark: "oklch(0.16 0.003 240)"
  border-dark: "oklch(0.18 0.003 240)"
  ring-dark: "oklch(0.6 0.12 250)"
  blue-accent-dark: "#818cf8"
  
typography:
  sans:
    fontFamily: "Plus Jakarta Sans"
    fontWeight: "400"
  serif:
    fontFamily: "Playfair Display"
    fontWeight: "700"
  h1:
    fontFamily: "Playfair Display"
    fontSize: "3rem"
    fontWeight: "700"
    lineHeight: "1.1"
  body:
    fontFamily: "Plus Jakarta Sans"
    fontSize: "1rem"
    lineHeight: "1.6"
  meta:
    fontFamily: "Plus Jakarta Sans"
    fontSize: "0.75rem"
    fontWeight: "600"
    letterSpacing: "0.05em"

rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"

spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"

components:
  header:
    backgroundColor: "rgba(255, 255, 255, 0.7)"
    height: "64px"
  button-primary:
    backgroundColor: "{colors.foreground}"
    textColor: "{colors.background}"
    rounded: "{rounded.lg}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "rgba(0, 0, 0, 0.9)"
  article-card:
    rounded: "{rounded.lg}"
  progress-bar:
    height: "2.5px"
    backgroundColor: "{colors.blue-accent}"
---

## Overview

The Sleek Neo-Minimalist design system bridges high-end editorial typography with a stark, modern user interface. It is built to focus heavily on readability and content presentation, employing generous whitespace, subtle border separations, and rich micro-interactions (like image scaling on card hover and slide animations on arrows).

The interface utilizes a paper-like ivory canvas in light mode and an obsidian ink depth in dark mode, both unified by an electric blue/indigo interactive accent color.

## Colors

The design system operates with a high-contrast minimalist palette that supports automatic light/dark switching:

- **Background (`#FAFAFA` / `oklch(0.99 0.002 240)`):** Soft off-white to give a paper feel and reduce eye strain compared to pure white. In dark mode, this flips to a deep charcoal obsidian (`oklch(0.09 0.002 240)`).
- **Foreground/Primary (`#121212` / `oklch(0.12 0.005 240)`):** Dark ink for headlines and core body text. Becomes soft white in dark mode.
- **Border (`oklch(0.92 0.003 240)`):** Extremely thin, subtle separations. Flips to `oklch(0.18 0.003 240)` in dark mode to retain a flat, borderless card look.
- **Blue Accent (`#2563EB` / `#818cf8`):** The primary brand accent, used for statuses, hover indicators, reading progress tracking, and key highlights.

## Typography

Typography establishes an editorial feel:
- **Headings (Playfair Display):** A high-character Serif font used exclusively for main headlines, headers, and post titles.
- **Body & UI (Plus Jakarta Sans):** A clean, modern geometric Sans font used for readability in body paragraphs, metadata, nav elements, and input controls.
- **Line Heights:** Generous leading (`leading-relaxed` or `line-height: 1.6`) is used in body text to facilitate reading.

## Layout

- **Grid and Alignment:** All main page layouts reside in a centered container with a maximum width of `6xl` (`1152px`) and responsive side padding (`px-5`).
- **Sticky Frosted Header:** The header stays at `top-0` with `backdrop-blur-md` and `bg-background/70` to maintain constant navigation.
- **Grid Lists:** Blog stories are shown in a two-column responsive grid on desktop with card items separated by balanced gaps (`gap-8 md:gap-12`).

## Elevation & Depth

The visual model is flat and layered. Elevation is represented by borders and backdrop-blurs rather than heavy shadows:
- **Level 0 (Base):** Soft paper background.
- **Level 1 (Cards/Menus):** Transparent cards (`bg-card/40` or `bg-background/70`) with frosted border blurs.
- **Interactions:** Subtle vertical translation (`-translate-y-1`) and light hover shadows (`hover:shadow-lg`) apply to interactive cards.

## Shapes

- **Card Corners (`rounded.lg` / `12px`):** Cards, inputs, and button controls utilize a soft rounded corner to offset the stark layout grids.
- **Hero Corner (`rounded.xl` / `16px`):** Large components such as the homepage hero image or article details image use a larger corner radius to frame the photography.

## Components

- **Sticky Header:** Sticky bar with height `64px` and a frosted glass panel (`glass-nav`).
- **Reading Progress Bar:** A thin bar (`h-[2.5px]`) fixed to the top viewport edge that fills width dynamically based on reading scroll progress.
- **Article card (`components/article.tsx`):** Grid items featuring aspect-ratio bounds (`aspect-[16/10]`) with hover-based image scale transitions (`scale-100 group-hover:scale-[1.03]`).
- **Sources block:** Flat link cards at the bottom of articles providing search citations.

## Do's and Don'ts

### Do's
- Do use `aspect-[16/10]` or `aspect-[16/9]` containers on images with `object-cover` styling to prevent black bar letterboxing.
- Do use smooth transitions (`transition-all duration-300 ease-out` or `duration-150`) for hover scaling and text coloring.
- Do keep borders thin and semi-transparent (`border-border/40`).

### Don'ts
- Don't use emoji icons for UI elements; instead, use Lucide SVG icons.
- Don't use drop shadows on non-interactive panels. Keep elements flat and layered.
