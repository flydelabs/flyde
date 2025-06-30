# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server (runs on port 3003)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Deploy to production (from parent directory)
npm run deploy:prod
```

## Architecture Overview

This is a Next.js 15 website for Flyde - a visual, flow-based programming toolkit. The site includes documentation, blog, and an embedded playground.

### Key Directories

- `app/` - Next.js 15 app router structure
  - `blog/` - Dynamic blog pages with MDX support
  - `docs/` - Documentation pages with dynamic routing
  - `playground/` - Interactive Flyde editor playground
  - `api/subscribe/` - Newsletter subscription endpoint
- `components/` - Shared React components
- `content/` - Markdown/MDX content files
  - `blog/` - Blog post content
  - `docs/` - Documentation content
- `flyde/` - Flyde example flows and resolved TypeScript versions
- `lib/` - Utility functions for content parsing
- `hooks/` - Custom React hooks

### Core Technologies

- **Next.js 15** with App Router
- **MDX** for content with gray-matter frontmatter
- **Tailwind CSS** with dark mode support
- **TypeScript** throughout
- **Flyde packages** - workspace dependencies for the visual editor

### Content System

The site uses a file-based content system:

- Blog posts in `content/blog/` (`.md`/`.mdx`)
- Documentation in `content/docs/` (`.md`/`.mdx`) 
- Frontmatter for metadata (title, description, sidebar_position, draft status)
- Automatic sorting by sidebar_position for docs, date for blog

### Flyde Integration

- Embedded Flyde editor in playground using `@flyde/flow-editor`
- Example flows in `flyde/` directory (`.flyde` files)
- Build script (`scripts/sync-examples.ts`) converts .flyde files to TypeScript
- EmbeddedFlyde component loads and displays flows

### Styling

- Dark-mode first design with Tailwind CSS
- CSS custom properties for theming
- Geist fonts (sans and mono)
- Responsive design with container queries

## Important Rules

- Never run the dev server - assume it's already running
- Always use pnpm instead of npm
- Never add new .md documentation files unless explicitly asked
- Content files support both `.md` and `.mdx` extensions
- All Flyde workspace packages must be listed in transpilePackages for proper bundling