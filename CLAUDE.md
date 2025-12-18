# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server with watch mode
pnpm build            # Production build (type-check + bundle)
pnpm lint             # ESLint with auto-fix
```

Output goes to `dist/` (main.js, manifest.json, styles.css).

## Architecture

Obsidian plugin for generating table of contents from headings.

**Entry:** `src/main.ts` - Plugin class, settings tab, command registration

**Core logic:** `src/create-toc.ts` - TOC generation from heading metadata
- `getCurrentHeaderDepth()` - finds heading level at cursor
- `createToc()` - builds TOC string from headings below cursor, respecting depth settings

**Types:** `src/types.ts` - `TableOfContentsPluginSettings` interface

**Build:** `esbuild.config.mjs` - bundles to CommonJS, copies manifest.json and styles.css to dist

## Key Concepts

- Uses Obsidian's `CachedMetadata.headings` (not raw text parsing)
- TOC is scoped: only includes headings under current heading until next same-level heading
- Three format styles: plain, markdown (with optional GitHub-compat via anchor-markdown-header), wiki
- Settings: listStyle, formatStyle, minimumDepth, maximumDepth, title, githubCompat
