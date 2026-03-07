# StorageManager.js Documentation

[![Built with Starlight](https://astro.badg.es/v2/built-with-starlight/tiny.svg)](https://starlight.astro.build)

This directory contains the documentation for StorageManager.js, built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build).

## 🚀 Project Structure

```
docs/
├── public/                  # Static assets (favicons, images)
│   └── favicon.svg
├── src/
│   ├── assets/              # Images referenced in content (auto-optimized)
│   ├── components/          # Custom Astro components
│   │   └── CodePenButton.astro
│   ├── content/
│   │   └── docs/            # All documentation content
│   │       ├── index.mdx    # Landing page (splash template)
│   │       ├── getting-started/
│   │       ├── api/
│   │       └── examples/
│   └── content.config.ts    # Content collection config
├── astro.config.mjs         # Starlight configuration (sidebar, meta, etc.)
├── package.json
└── tsconfig.json
```

## 📚 Documentation Structure

### Getting Started
- **Introduction** — Overview and key features
- **Installation** — How to install via npm or CDN
- **Quick Start** — Basic usage examples

### API Reference
- **Constructor** — Creating and configuring instances
- **Storage Methods** — Core CRUD operations
- **Batch Operations** — Efficient multi-item handling
- **Event Listeners** — Cross-tab synchronization

### Examples
- **Basic Usage** — Simple examples with CodePen
- **Advanced Features** — Complex scenarios

## 🧞 Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |

## 📝 Adding Content

All pages are written in MDX (Markdown + JSX). Create a new file in `src/content/docs/`:

\`\`\`mdx
---
title: Page Title
description: Brief description for SEO.
---

# Your content here
\`\`\`

Then add it to the sidebar in `astro.config.mjs`.

## 🌐 Deployment

Deployed to Vercel automatically. The root `vercel.json` configures:
- Build: `cd docs && npm install && npm run build`
- Output: `docs/dist/`

## 👀 Learn More

- [Starlight Documentation](https://starlight.astro.build/)
- [Astro Documentation](https://docs.astro.build)
- [StorageManager.js Repository](https://github.com/peterbenoit/StorageManager.js)
