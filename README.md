# 🖊️ Personal Blog

An AI-powered, auto-publishing personal blog built with **Next.js 16**, **React 19**, **Sanity CMS**, **Convex**, and **Google Gemini**. The platform autonomously generates and publishes deep, long-form articles on a daily schedule — complete with factual Google Search grounding, AI-generated cover images, source citations, and structured metadata — while also supporting traditional manual authoring through Sanity Studio.

The frontend is crafted around a **Sleek Neo-Minimalist** editorial aesthetic ([DESIGN.md](DESIGN.md)), pairing high-character serif headlines with geometric sans-serif typography, paper/obsidian dark mode palettes, and smooth, hardware-accelerated reading interactions.

## ✨ Features

### 🤖 AI-Powered Content Generation (Google ADK 2.0)
- **Multi-Agent Orchestration with Google ADK 2.0**: Replaces brittle, monolithic single-shot prompts with a deterministic graph & dynamic workflow runtime (`@google/adk`).
- **Arbitrary Length Generation**: Hierarchical decomposition into dynamically planned sections with rolling context bridges — reliably generates articles of any length (`brief` ~1.2k words, `standard` ~3k words, `deep_dive` ~6k words, or `monograph` ~15k-25k words).
- **Specialized Multi-Agent Roles**:
  - `Researcher Agent`: Conducts deep factual grounding with `GoogleSearchTool` to unearth verified statistics, counterarguments, and source citations.
  - `Architect Agent`: Formulates the structured outline and allocates word budgets per section with strict Zod schemas.
  - `Section Writer Agent`: Drafts deep, high-fidelity prose per section utilizing the previous section's concluding tail for seamless narrative transitions.
  - `Editor Agent`: Unifies tone, eliminates cross-section redundancy, crafts the introductory hook, and synthesizes the conclusion.
  - `SEO Specialist Agent`: Extracts high-CTR titles, URL-safe slugs, meta descriptions, keywords, and reading time.
  - `Image Director Agent`: Synthesizes evocative visual metaphors without text for editorial cover art.
- **Automated Daily Article Publishing**: Orchestrated via Convex cron jobs with full fault isolation via ADK's `RetryConfig`.
- **Database-Indexed Topic Lookup**: Scheduled topic lookups in Convex query against a dedicated `by_generationDate` database index for $O(1)$ retrieval.
- **Standalone CLI Generator**: Local command-line test runner (`scripts/test-adk-blog.ts`) supporting `--dry-run`, customizable length presets, and target word counts.

### 📝 Content Management & Publishing
- **Sanity Studio** embedded at `/studio` for a native, customizable authoring experience.
- **Real-time visual editing** with Sanity Presentation Tool for side-by-side live preview.
- **Draft Mode** with seamless toggling for content preview before publishing.
- **Portable Text with GFM Parsing**: Converts GitHub Flavored Markdown into structured Sanity Portable Text blocks using high-performance `marked` parsing.
- **Flexible Post Ingestion**: The Convex `uploadArticle` action accepts markdown content, cover images as either base64 data or direct HTTP/HTTPS URLs, auto-extracted excerpt fallbacks with clean word-boundary truncation, and automatic source parsing.
- **Content Visibility Control**: Posts support an optional `hide` boolean flag to hide draft or archived articles from all public queries and feeds without deletion.
- **Unsplash Integration** for easy image sourcing and hotspot/crop controls.
- **Sanity AI Assist** preconfigured for image alt text generation.

### 🎨 Frontend & Design (Sleek Neo-Minimalist)
- **Sleek Neo-Minimalist Design System**: Documented in [DESIGN.md](DESIGN.md) — focused on content-first layouts, generous whitespace, subtle border separations, and understated micro-interactions.
- **High-End Typography**: Editorial headlines powered by **Playfair Display** (Serif) paired with crisp, highly legible body and UI prose powered by **Plus Jakarta Sans** (Geometric Sans).
- **Dark/Light/System Theme Toggle**: Seamless switching between paper-like ivory canvas (`#FAFAFA`) in light mode and deep obsidian ink in dark mode via `next-themes`.
- **Hardware-Accelerated Reading Progress**: Ref-driven `ScrollProgressBar` on article pages powered by `requestAnimationFrame` and CSS `scaleX` transforms, eliminating scroll-induced React re-renders.
- **Sticky Navigation Header**: Polished header with brand title, stories link, and quick theme toggle.
- **Responsive Layout**: Fluid layouts styled with **Tailwind CSS v4** and `@tailwindcss/typography` / `shadcn-prose`.
- **Paginated Post Listing**: Infinite-style progressive loading with "See More" pagination and defensive bounds checking.
- **Hero Post Layout**: Striking feature presentation with cover image, author avatar, date, and excerpt.
- **shadcn/ui Components**: Accessible, polished primitives (Button, Dropdown Menu).

### ⚡ Performance, SEO & Tooling
- **Static Site Generation (SSG) with ISR**: Incremental Static Revalidation ensures instant page delivery without rebuild delays for newly published content.
- **Dynamic Site URL Resolution**: Dynamically resolves canonical URLs across Vercel environments (`VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_URL`) and custom overrides (`NEXT_PUBLIC_SITE_URL`).
- **Dynamic Open Graph & SEO Metadata**: Automatic per-post OG image, author attribution, and structured metadata generated from Sanity settings.
- **Vercel Speed Insights**: Built-in monitoring for Core Web Vitals (LCP, FID/INP, CLS).
- **ESLint 9 Flat Config**: Modernized linting architecture (`eslint.config.mjs`) integrating `typescript-eslint` and Next.js Core Web Vitals rules.
- **Next.js Turbopack**: Accelerated local compilation and Hot Module Replacement (HMR).

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js 16    │────▶│   Sanity CMS    │◀────│  Convex Backend │
│   (Frontend)    │     │ (Content Lake)  │     │  (Serverless)   │
│                 │     │                 │     │                 │
│  • App Router   │     │  • Posts & Hide │     │  • Daily Crons  │
│  • React 19     │     │  • Authors      │     │  • Indexed DB   │
│  • SSG + ISR    │     │  • Settings     │     │  • Actions      │
│  • Draft Mode   │     │  • Media Assets │     │  • ADK Engine   │
│  • Sanity Studio│     │  • Portable Text│     │  • Scheduler    │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │ Google ADK 2.0  │
                                                │  (Gemini AI)    │
                                                │                 │
                                                │  • Gemini 3.8 Fl│
                                                │  • Flash Image  │
                                                │  • Grounding    │
                                                │  • Multi-Agent  │
                                                └─────────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| **UI Runtime** | [React 19](https://react.dev/) |
| **Language** | [TypeScript 5.6](https://www.typescriptlang.org/) |
| **CMS** | [Sanity v3](https://www.sanity.io/) (Content Lake, Studio, Presentation Tool) |
| **Backend & Database** | [Convex](https://www.convex.dev/) (Serverless functions, database indexing, cron scheduler) |
| **AI & Multi-Agent** | [Google ADK 2.0](https://adk.dev/) (`@google/adk`), [Google Gen AI SDK](https://ai.google.dev/) (`@google/genai`) — Gemini 3.8 Flash + Gemini 2.5 Flash Image |
| **Markdown & Portable Text** | [Marked](https://marked.js.org/) (`marked` v18), [@portabletext/block-tools](https://github.com/portabletext/block-tools) |
| **Design System** | Sleek Neo-Minimalist ([DESIGN.md](DESIGN.md)) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), `shadcn-prose` |
| **Typography** | [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) (Serif) + [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) (Sans) |
| **Theming** | [next-themes](https://github.com/pacocoursey/next-themes) |
| **Validation** | [Zod v4](https://zod.dev/) |
| **Tooling & Linting** | [ESLint 9](https://eslint.org/) (Flat Config `eslint.config.mjs`), Prettier |
| **Testing** | [Vitest](https://vitest.dev/), [convex-test](https://docs.convex.dev/testing) |
| **Deployment** | [Vercel](https://vercel.com/) |
| **Package Manager** | [Yarn 4.6](https://yarnpkg.com/) (Berry) |

## 📁 Project Structure

```
personal-blog/
├── app/
│   ├── (blog)/                  # Blog route group
│   │   ├── layout.tsx           # Root blog layout (theme, header, footer, draft mode)
│   │   ├── page.tsx             # Home page (hero post + more stories)
│   │   ├── posts/
│   │   │   ├── page.tsx         # Paginated "All Stories" listing
│   │   │   └── [slug]/          # Individual post pages with reading progress bar
│   │   └── actions.ts           # Server actions (draft mode toggle)
│   ├── (sanity)/                # Sanity Studio route group
│   │   ├── layout.tsx           # Studio root layout
│   │   └── studio/              # Embedded Sanity Studio at /studio
│   ├── api/
│   │   └── draft-mode/          # Draft mode API routes
│   ├── globals.css              # Global styles, CSS variables, dark mode palette
│   └── icon.tsx                 # Dynamic favicon generation
│
├── components/
│   ├── alert-banner.tsx         # Draft mode notification banner
│   ├── article.tsx              # Post card component with micro-interactions
│   ├── avatar.tsx               # Author avatar
│   ├── cover-image.tsx          # Post cover image with responsive Sanity CDN sizing
│   ├── date.tsx                 # Date formatting component
│   ├── footer.tsx               # Site footer with Portable Text
│   ├── header.tsx               # Sticky navigation header with site branding and theme switcher
│   ├── mode-toggle.tsx          # Dark/Light/System theme switcher
│   ├── more-stories.tsx         # Additional posts grid
│   ├── onboarding.tsx           # First-run onboarding guide
│   ├── paginated-stories.tsx    # Paginated post listing with bounds-checked "See More"
│   ├── portable-text.tsx        # Portable Text renderer
│   ├── providers/
│   │   └── theme-provider.tsx   # next-themes wrapper provider
│   ├── scroll-progress-bar.tsx  # rAF-accelerated reading progress bar
│   └── ui/                      # shadcn/ui primitives (Button, Dropdown)
│
├── config/
│   └── metadata.config.ts       # Dynamic SEO metadata & Open Graph generation
│
├── convex/                      # Convex backend
│   ├── _config/
│   │   └── env.config.ts        # Environment variable exports
│   ├── _constants/
│   │   └── prompts.ts           # Legacy prompts & schemas
│   ├── _lib/
│   │   ├── adk/                 # Google ADK 2.0 Multi-Agent Blog Generation Engine
│   │   │   ├── models.ts        # Gemini model registry (gemini-3.8-flash & gemini-2.5-flash-image)
│   │   │   ├── prompts.ts       # Centralized agent instructions and dynamic runtime prompt templates
│   │   │   ├── types.ts         # Zod schemas, presets, and length budgets
│   │   │   ├── agents.ts        # Specialized ADK LlmAgents with retry configurations
│   │   │   ├── workflow.ts      # Deterministic graph & dynamic section drafting workflow
│   │   │   ├── image.ts         # Cover image generation with Gemini native image model
│   │   │   ├── sanity_publisher.ts # GFM parsing (marked), Portable Text conversion & Sanity publishing
│   │   │   ├── adk.test.ts      # Vitest test suite for ADK pipeline
│   │   │   └── index.ts         # Public barrel export
│   │   ├── google.genai.ts      # Legacy Gemini AI integration helpers
│   │   ├── sanity.ts            # Sanity write client (create/update posts, image upload, excerpt extraction)
│   │   └── sanity.test.ts       # Sanity integration tests (slugs, markdown stripping, excerpts)
│   ├── actions.ts               # Convex actions (generate article, upload article with URL/b64 image, etc.)
│   ├── crons.ts                 # Daily article generation cron job
│   ├── jobs.ts                  # Job orchestration (indexed topic lookup → scheduled generation)
│   ├── queries.ts               # Convex queries (indexed getTodaysTopics)
│   └── schema.ts                # Convex database schema (topics table with by_generationDate index)
│
├── lib/
│   ├── site.ts                  # Dynamic site URL resolution (Vercel env vars & fallbacks)
│   └── utils.ts                 # shadcn/ui Tailwind class merge utility (cn)
│
├── sanity/
│   ├── lib/
│   │   ├── api.ts               # Sanity project config (projectId, dataset, etc.)
│   │   ├── client.ts            # Sanity client instance
│   │   ├── demo.ts              # Demo/fallback content
│   │   ├── fetch.ts             # Sanity fetch wrapper with caching
│   │   ├── queries.ts           # GROQ queries (filtered by hide != true, hero, posts, pagination)
│   │   ├── token.ts             # Read token access
│   │   └── utils.ts             # URL resolvers, OG image helpers
│   ├── plugins/
│   │   ├── assist.ts            # AI Assist plugin with preset prompts
│   │   └── settings.tsx         # Singleton document structure plugin
│   └── schemas/
│       ├── documents/
│       │   ├── author.ts        # Author document schema
│       │   └── post.ts          # Post document schema (with sources and hide fields)
│       └── singletons/
│           └── settings.tsx     # Site-wide settings singleton
│
├── scripts/
│   └── test-adk-blog.ts         # Standalone CLI test runner and generator for ADK pipeline
│
├── DESIGN.md                    # Sleek Neo-Minimalist design system architecture specification
├── eslint.config.mjs            # ESLint 9 flat configuration
├── sanity.config.ts             # Sanity Studio configuration
├── tailwind.config.ts           # Tailwind CSS v4 configuration
├── next.config.ts               # Next.js configuration
├── vitest.config.mts            # Vitest test configuration
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Yarn** 4 (Berry) — managed via `corepack`
- A [Sanity](https://www.sanity.io/) account and project
- A [Convex](https://www.convex.dev/) account and project
- A [Google AI Studio](https://aistudio.google.com/) API key

### 1. Clone the Repository

```bash
git clone git@github.com:agnivon/personal-blog.git
cd personal-blog
```

### 2. Install Dependencies

```bash
corepack enable
yarn install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Fill in the required values in `.env.local`:

| Variable | Description | Required |
|---|---|:---:|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Your Sanity project ID | Yes |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity dataset name (e.g., `production`) | Yes |
| `SANITY_API_READ_TOKEN` | Sanity API token with **Viewer** permissions | Yes |
| `SANITY_API_DEVELOPER_TOKEN` | Sanity API token with **Editor/Admin** permissions (for Convex write operations) | Yes |
| `SANITY_BLOG_AUTHOR_ID` | Sanity document `_id` of the default blog author | Yes |
| `CONVEX_DEPLOYMENT` | Your Convex deployment identifier | Yes |
| `NEXT_PUBLIC_CONVEX_URL` | Your Convex deployment URL | Yes |
| `GEMINI_API_KEY` | Google AI Studio API key | Yes |
| `TIMEZONE` | Timezone for date operations (default: `Asia/Kolkata`) | No |
| `DATE_FORMAT_STRING` | Date format string (default: `dd/MM/yyyy`) | No |
| `CONVEX_ENV` | `development` or `production` (controls cron activation) | No |
| `NEXT_PUBLIC_SITE_URL` | Explicit site URL override (falls back to Vercel system env vars or `localhost:3000`) | No |

#### Creating Sanity Tokens

1. Go to [manage.sanity.io](https://manage.sanity.io/) and select your project.
2. Navigate to the **🔌 API** tab.
3. Click **+ Add API token**.
4. Create a **Viewer** token for `SANITY_API_READ_TOKEN` (used for live preview).
5. Create a **Developer/Editor** token for `SANITY_API_DEVELOPER_TOKEN` (used by Convex to create posts).

### 4. Initialize Sanity (First-time Setup Only)

If you are configuring a brand new Sanity project:

```bash
yarn setup
```

> **Note**: When asked *"Would you like to add configuration files for a Sanity project in this Next.js folder?"*, answer **No** — the configuration files are already included.

### 5. Run the Development Server

```bash
yarn dev
```

This concurrently starts:
- **Next.js** (with Turbopack) at [http://localhost:3000](http://localhost:3000)
- **Convex dev server** syncing backend functions to your development deployment

Access the embedded Sanity Studio at [http://localhost:3000/studio](http://localhost:3000/studio).

## 📖 Usage

### Manual Content Authoring

1. Open Sanity Studio at `/studio`.
2. Click **+ Create** → **Post**.
3. Fill in the title, generate a slug, write content, add a cover image, and select an author.
4. *(Optional)* Toggle the **Hide** switch if you want to save or preview the post without displaying it on public story lists.
5. Click **Publish** to make the post live.

### AI-Powered Auto-Publishing

1. Open your [Convex Dashboard](https://dashboard.convex.dev/).
2. Navigate to the **Data** tab and open the `topics` table.
3. Add a document with:
   - `topic` — the subject for the article (e.g., *"Autonomous AI Agent Workflows and Graph-Based Architectures"*)
   - `instructions` — *(optional)* custom editorial instructions or points to cover
   - `generationDate` — the date to generate in `dd/MM/yyyy` format (e.g., matching today's date in your configured timezone)
4. The daily cron job (at 05:30 UTC / 11:00 AM IST) will:
   - Perform an indexed query (`by_generationDate`) for today's scheduled topics
   - Run the Google ADK 2.0 multi-agent generation pipeline
   - Extract SEO metadata, reading time, and source citations
   - Generate an editorial cover image with Gemini
   - Convert markdown content to Portable Text and publish directly to Sanity CMS

> **Note**: The daily cron job only triggers when `CONVEX_ENV=production`. In development, you can manually trigger article generation via the Convex dashboard actions.

### Standalone CLI Article Generator

You can run the ADK blog generator locally using the bundled CLI script:

```bash
# Run a dry run (generates article and writes markdown to test_adk_article.md without publishing)
npx tsx scripts/test-adk-blog.ts --topic "The Future of WebAssembly" --length brief --dry-run

# Run and publish directly to Sanity CMS
npx tsx scripts/test-adk-blog.ts --topic "Agentic AI in Production" --length standard --publish

# Custom word count target
npx tsx scripts/test-adk-blog.ts --topic "Quantum Computing Basics" --words 4500 --publish
```

**Available CLI Flags**:
- `--topic "<topic>"`: Topic string for the article.
- `--instructions "<instructions>"`: Custom instructions for the generation agents.
- `--length <brief|standard|deep_dive|monograph>`: Length preset (`brief` ~1.2k, `standard` ~3k, `deep_dive` ~6k, `monograph` ~15k-25k words).
- `--words <number>`: Target custom word count (automatically sets preset to `custom`).
- `--model <model>`: Gemini model ID (defaults to `gemini-3.8-flash`).
- `--dry-run`: Skips Sanity CMS publishing and outputs markdown locally (default).
- `--publish`: Publishes the generated article and cover art to Sanity CMS.
- `--output <filename>`: Path for writing markdown output (default: `test_adk_article.md`).

### Direct Article Ingestion (Convex Action)

The `uploadArticle` Convex action allows programmatic post publishing from any external script or workflow:

```typescript
await ctx.runAction(internal.actions.uploadArticle, {
  title: "My Custom Article",
  content: "# Full markdown content...",
  excerpt: "Optional custom excerpt (auto-extracted from markdown if omitted)",
  coverImage: {
    url: "https://example.com/cover.jpg", // Supports direct URL or { data: "<base64>", mimeType: "image/png" }
  },
  hide: false,
});
```

### Draft Mode & Live Previews

- In development, content updates appear immediately.
- In production, new published content uses **Incremental Static Revalidation** (ISR).
- Live preview with draft content can be toggled via `/api/draft-mode/enable` or using the Vercel Toolbar.

## 🧪 Testing

The project includes unit and integration tests powered by [Vitest](https://vitest.dev/) and [convex-test](https://docs.convex.dev/testing):

```bash
# Run tests in watch mode
yarn test

# Run tests once
yarn test:once

# Run tests with coverage report
yarn test:coverage

# Debug tests with Node inspector
yarn test:debug
```

Test coverage includes:
- ADK multi-agent workflow graph initialization and Zod schema validation
- Length presets and dynamic word budget calculations
- Sanity publisher Portable Text conversion (`marked`), slug sanitization, and excerpt extraction
- Cover image MIME detection and URL asset handling
- Convex schema indexing and queries

## 📜 Available Scripts

| Script | Description |
|---|---|
| `yarn dev` | Start Next.js (Turbopack) and Convex dev servers concurrently |
| `yarn next-dev` | Start only the Next.js dev server with Turbopack |
| `yarn convex-dev` | Start only the Convex dev server |
| `yarn build` | Build the Next.js production bundle |
| `yarn start` | Start the Next.js production server |
| `yarn lint` | Run ESLint 9 flat configuration across the project |
| `yarn typegen` | Extract Sanity schema and generate TypeScript types |
| `yarn setup` | Initialize Sanity project configuration interactively |
| `yarn test` | Run Vitest in interactive watch mode |
| `yarn test:once` | Run Vitest test suite once |
| `yarn test:coverage` | Run Vitest with coverage report |
| `yarn test:debug` | Debug tests with Node inspector enabled |
| `yarn convex-deploy` | Deploy Convex functions and database schema to production |

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to your GitHub repository.
2. [Import the project on Vercel](https://vercel.com/new).
3. Add all environment variables from `.env.local` to the Vercel project settings.
4. Deploy the project.

After deployment, link your local project:

```bash
npx vercel link
```

### Convex

Deploy your Convex functions and schemas to production:

```bash
yarn convex-deploy
```

Ensure `CONVEX_ENV` is set to `production` in your Convex deployment environment variables for the scheduled daily cron job to activate.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
