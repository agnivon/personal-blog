# 🖊️ Personal Blog

An AI-powered, auto-publishing personal blog built with **Next.js 15**, **Sanity CMS**, **Convex**, and **Google Gemini**. The platform autonomously generates and publishes blog articles on a daily schedule — complete with AI-written content, cover images, source citations, and structured metadata — while also supporting traditional manual authoring through Sanity Studio.

## ✨ Features

### 🤖 AI-Powered Content Generation
- **Automated daily article publishing** via Convex cron jobs that trigger at a configurable schedule
- **Topic-driven generation** — schedule topics in advance via the Convex dashboard with optional custom instructions
- **Google Gemini 2.5 Flash** for article content generation with Google Search grounding for factual accuracy and inline source citations
- **AI-generated cover images** using Gemini's image generation capabilities
- **Automatic title & excerpt extraction** from generated content using structured JSON output
- **Source attribution** — grounding chunks from Google Search are stored and displayed alongside each post

### 📝 Content Management
- **Sanity Studio** embedded at `/studio` for a native, customizable authoring experience
- **Real-time visual editing** with Sanity Presentation Tool for side-by-side live preview
- **Draft Mode** with seamless toggling for content preview before publishing
- **Block content** support via Portable Text with Markdown-to-block conversion for AI-generated content
- **Unsplash integration** for easy image sourcing and hotspot/crop controls
- **Sanity AI Assist** preconfigured for image alt text generation

### 🎨 Frontend & Design
- **Dark/Light/System theme** toggle using `next-themes` with smooth transitions
- **Responsive design** with Tailwind CSS v4 and Inter font from Google Fonts
- **Paginated post listing** with "See More" progressive loading
- **Hero post layout** with cover image, author avatar, date, and excerpt
- **Typography** powered by `@tailwindcss/typography` and `shadcn-prose` with full dark mode support
- **shadcn/ui components** (Button, Dropdown Menu) for polished, accessible UI elements

### ⚡ Performance & SEO
- **Static generation** with Incremental Static Revalidation (ISR) — no rebuild delays for new content
- **Vercel Speed Insights** integrated for performance monitoring
- **Dynamic Open Graph metadata** per post with cover image support
- **Structured SEO metadata** generation from Sanity settings (title, description, author, OG images)
- **Next.js Turbopack** enabled for fast local development

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js 15    │────▶│   Sanity CMS    │◀────│  Convex Backend │
│   (Frontend)    │     │ (Content Lake)  │     │  (Serverless)   │
│                 │     │                 │     │                 │
│  • App Router   │     │  • Posts        │     │  • Cron Jobs    │
│  • SSG + ISR    │     │  • Authors      │     │  • Actions      │
│  • Draft Mode   │     │  • Settings     │     │  • Queries      │
│  • Sanity Studio│     │  • Images       │     │  • Scheduler    │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │  Google Gemini  │
                                                │     (AI)        │
                                                │                 │
                                                │  • Content Gen  │
                                                │  • Image Gen    │
                                                │  • Grounding    │
                                                │  • Extraction   │
                                                └─────────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router, Turbopack) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) 5.6 |
| **CMS** | [Sanity](https://www.sanity.io/) v3 (Content Lake, Studio, Presentation Tool) |
| **Backend** | [Convex](https://www.convex.dev/) (Serverless functions, cron jobs, database) |
| **AI** | [Google Gemini](https://ai.google.dev/) (`@google/genai`) — 2.5 Flash + Image Gen |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), `shadcn-prose` |
| **Theming** | [next-themes](https://github.com/pacocoursey/next-themes) |
| **Validation** | [Zod v4](https://zod.dev/) |
| **Testing** | [Vitest](https://vitest.dev/), [convex-test](https://docs.convex.dev/testing) |
| **Deployment** | [Vercel](https://vercel.com/) |
| **Package Manager** | [Yarn 4](https://yarnpkg.com/) (Berry) |

## 📁 Project Structure

```
personal-blog/
├── app/
│   ├── (blog)/                  # Blog route group
│   │   ├── layout.tsx           # Root blog layout (theme, footer, draft mode)
│   │   ├── page.tsx             # Home page (hero post + more stories)
│   │   ├── posts/
│   │   │   ├── page.tsx         # Paginated "All Stories" listing
│   │   │   └── [slug]/          # Individual post pages
│   │   └── actions.ts           # Server actions (draft mode toggle)
│   ├── (sanity)/                # Sanity Studio route group
│   │   └── studio/              # Embedded Sanity Studio at /studio
│   ├── api/
│   │   └── draft-mode/          # Draft mode API routes
│   ├── globals.css              # Global styles, CSS variables, dark mode
│   └── icon.tsx                 # Dynamic favicon generation
│
├── components/
│   ├── alert-banner.tsx         # Draft mode notification banner
│   ├── article.tsx              # Post card component
│   ├── avatar.tsx               # Author avatar
│   ├── cover-image.tsx          # Post cover image with Sanity CDN
│   ├── date.tsx                 # Date formatting component
│   ├── footer.tsx               # Site footer with Portable Text
│   ├── mode-toggle.tsx          # Dark/Light/System theme switcher
│   ├── more-stories.tsx         # Additional posts grid
│   ├── onboarding.tsx           # First-run onboarding guide
│   ├── paginated-stories.tsx    # Paginated post listing with "See More"
│   ├── portable-text.tsx        # Portable Text renderer
│   ├── providers/
│   │   ├── convex-client-provider.tsx
│   │   └── theme-provider.tsx
│   └── ui/                      # shadcn/ui primitives (Button, Dropdown)
│
├── config/
│   └── metadata.config.ts       # Dynamic SEO metadata generation
│
├── convex/                      # Convex backend
│   ├── _config/
│   │   └── env.config.ts        # Environment variable exports
│   ├── _constants/
│   │   └── prompts.ts           # AI system prompts & response schemas
│   ├── _lib/
│   │   ├── google.genai.ts      # Gemini AI integration (content, images, extraction)
│   │   ├── sanity.ts            # Sanity write client (create/update posts)
│   │   └── sanity.test.ts       # Sanity integration tests
│   ├── actions.ts               # Convex actions (generate article, upload, etc.)
│   ├── crons.ts                 # Daily article generation cron job
│   ├── jobs.ts                  # Job orchestration (topic lookup → scheduled generation)
│   ├── queries.ts               # Convex queries (get today's topics)
│   └── schema.ts                # Convex database schema (topics table)
│
├── sanity/
│   ├── lib/
│   │   ├── api.ts               # Sanity project config (projectId, dataset, etc.)
│   │   ├── client.ts            # Sanity client instance
│   │   ├── demo.ts              # Demo/fallback content
│   │   ├── fetch.ts             # Sanity fetch wrapper with caching
│   │   ├── queries.ts           # GROQ queries (hero, posts, pagination, etc.)
│   │   ├── token.ts             # Read token access
│   │   └── utils.ts             # URL resolvers, OG image helpers
│   ├── plugins/
│   │   ├── assist.ts            # AI Assist plugin with preset prompts
│   │   └── settings.tsx         # Singleton document structure plugin
│   └── schemas/
│       ├── documents/
│       │   ├── author.ts        # Author document schema
│       │   └── post.ts          # Post document schema (with sources field)
│       └── singletons/
│           └── settings.tsx     # Site-wide settings singleton
│
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

Fill in all the required values in `.env.local`:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Your Sanity project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity dataset name (e.g., `production`) |
| `SANITY_API_READ_TOKEN` | Sanity API token with **Viewer** permissions |
| `SANITY_API_DEVELOPER_TOKEN` | Sanity API token with **Editor/Admin** permissions (for Convex write operations) |
| `SANITY_BLOG_AUTHOR_ID` | Sanity document `_id` of the default blog author |
| `CONVEX_DEPLOYMENT` | Your Convex deployment identifier |
| `NEXT_PUBLIC_CONVEX_URL` | Your Convex deployment URL |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `TIMEZONE` | Timezone for date operations (default: `Asia/Kolkata`) |
| `DATE_FORMAT_STRING` | Date format string (default: `dd/MM/yyyy`) |
| `CONVEX_ENV` | `development` or `production` (controls cron activation) |

#### Creating Sanity Tokens

1. Go to [manage.sanity.io](https://manage.sanity.io/) and select your project.
2. Navigate to the **🔌 API** tab.
3. Click **+ Add API token**.
4. Create a **Viewer** token for `SANITY_API_READ_TOKEN` (used for live preview).
5. Create a **Developer/Editor** token for `SANITY_API_DEVELOPER_TOKEN` (used by Convex to create posts).

### 4. Initialize Sanity (First-time Setup Only)

If you're setting up a brand new Sanity project:

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
- **Convex dev server** syncing functions to your development deployment

Access Sanity Studio at [http://localhost:3000/studio](http://localhost:3000/studio).

## 📖 Usage

### Manual Content Authoring

1. Open Sanity Studio at `/studio`
2. Click **+ Create** → **Post**
3. Fill in the title, generate a slug, write content, add a cover image, and select an author
4. Click **Publish** to make the post live

### AI-Powered Auto-Publishing

1. Open your [Convex Dashboard](https://dashboard.convex.dev/)
2. Navigate to the **Data** tab and open the `topics` table
3. Add a document with:
   - `topic` — the subject for the article (e.g., *"The Future of WebAssembly"*)
   - `instructions` — (optional) custom instructions for the AI
   - `generationDate` — the date to generate in `dd/MM/yyyy` format
4. The daily cron job (at 05:30 UTC / 11:00 AM IST) will:
   - Query topics scheduled for today
   - Generate article content using Gemini with Google Search grounding
   - Extract the title and excerpt
   - Generate a cover image
   - Upload the complete post to Sanity

> **Note**: The cron job only runs when `CONVEX_ENV=production`. In development, you can manually trigger article generation via the Convex dashboard.

### Draft Mode

- In development, content is shown immediately
- In production, new content uses **Time-based Revalidation** (up to ~60 seconds delay)
- Toggle draft mode at `/api/draft-mode/enable` or via the Vercel Toolbar

## 🧪 Testing

Run the test suite with [Vitest](https://vitest.dev/):

```bash
# Run tests in watch mode
yarn test

# Run tests once
yarn test:once

# Run tests with coverage
yarn test:coverage

# Debug tests
yarn test:debug
```

## 📜 Available Scripts

| Script | Description |
|---|---|
| `yarn dev` | Start Next.js + Convex dev servers concurrently |
| `yarn next-dev` | Start only the Next.js dev server (with Turbopack) |
| `yarn convex-dev` | Start only the Convex dev server |
| `yarn build` | Build the Next.js production bundle |
| `yarn start` | Start the Next.js production server |
| `yarn lint` | Run ESLint |
| `yarn typegen` | Extract Sanity schema & generate TypeScript types |
| `yarn setup` | Initialize Sanity project configuration |
| `yarn test` | Run Vitest in watch mode |
| `yarn test:once` | Run tests once |
| `yarn test:coverage` | Run tests with coverage report |
| `yarn convex-deploy` | Deploy Convex functions to production |

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. [Import the project on Vercel](https://vercel.com/new)
3. Add all environment variables from `.env.local` to the Vercel project settings
4. Deploy

After deployment, link your local project:

```bash
npx vercel link
```

### Convex

Deploy your Convex functions to production:

```bash
yarn convex-deploy
```

Make sure `CONVEX_ENV` is set to `production` on your Convex deployment for the daily cron job to activate.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
