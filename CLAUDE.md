# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server at http://localhost:3000
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test runner is configured yet.

## Tech Stack

- **Next.js 16** with App Router (`app/` directory)
- **React 19**
- **TypeScript** (strict mode, `@/*` path alias maps to project root)
- **Tailwind CSS v4** (via `@tailwindcss/postcss`)
- **ESLint** with `eslint-config-next` core-web-vitals + TypeScript rules

## Architecture

This is a freshly scaffolded Next.js App Router project. The entry point is `app/page.tsx` and the root layout is `app/layout.tsx`. Global styles are in `app/globals.css`. The `@/*` path alias resolves to the project root.

# InkluVision Development Rules

==================================================
CORE PHILOSOPHY
==================================================

Accessibility-first educational platform for inclusive learning.

Target:
Visually impaired students.

Accessibility is always more important than visual complexity.

==================================================
LANGUAGE RULE
==================================================

- Semua UI dalam Bahasa Indonesia
- Semua pesan sistem dalam Bahasa Indonesia
- Semua output AI dalam Bahasa Indonesia
- Hindari istilah teknis rumit di UI

==================================================
DESIGN SYSTEM
==================================================

Inspired by Airbnb UI.

Characteristics:

- Clean
- Minimal
- rounded-2xl
- Soft shadow
- Neutral colors (zinc/slate)
- Subtle accent
- Generous whitespace
- Mobile-first
- Large readable fonts

TailwindCSS only.

==================================================
ACCESSIBILITY RULES
==================================================

Mandatory:

- Semantic HTML
- Proper heading hierarchy
- aria-label when needed
- Keyboard navigable
- Visible focus states
- High contrast ratio
- No icon-only buttons without sr-only label
- Large tap targets
- No hover-only interaction

==================================================
ARCHITECTURE
==================================================

- Next.js App Router
- TypeScript strict
- TailwindCSS
- Prisma ORM
- Neon PostgreSQL
- NextAuth (guru only)
- OpenAI server-side only
- KaTeX for LaTeX rendering

No API key exposure.
No heavy UI frameworks.

==================================================
MATHEMATICS SUPPORT
==================================================

- Support Markdown + LaTeX
- $ inline math
- $$ block math
- Use KaTeX
- Do not render as image
- Must include aria-label for math blocks
- Store raw LaTeX in database

==================================================
UX RULES
==================================================

- Siswa tidak perlu login
- Navigasi sederhana
- Minim distraksi
- Layout ramah screen reader
- Fokus pada kemudahan penggunaan

==================================================
AI TONE
==================================================

- Ramah
- Mendukung
- Sederhana
- Tidak menghakimi
- Inklusif

==================================================
DEVELOPMENT PRINCIPLE
==================================================

Do not over-engineer.
Keep MVP clean.
Readable code.
Scalable structure.
Ready for innovation judges.
