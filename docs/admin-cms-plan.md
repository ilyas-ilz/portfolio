# Admin CMS Plan — Portfolio (Next.js 16 + Cloudflare D1 + Cloudflare CDN/R2)

Status: DRAFT — awaiting approval. No code changed yet (only `zod` + `aws4fetch` installed).

## 1. Goal

A private `/admin` panel that controls everything on the home page without touching code:

- **Layout**: reorder sections, show/hide, duplicate, delete, add new sections.
- **Content**: every piece of data now hard-coded in `lib/data.ts` (profile, stats, projects, skills, marquee, jobs, education, certificates, nav links, flight-guide stops, contact copy).
- **New section types** you can add any number of times (text, cards, CTA, media, stats, custom spacer).
- **Site settings**: SEO title/description/keywords/OG image, theme colours (CSS variables), fonts toggle.
- **Media**: upload images/videos to Cloudflare R2, served through Cloudflare CDN.
- **Safety**: login, revision history + one-click restore, draft preview, fallback to built-in defaults if D1 is down or keys are missing.

## 2. Current state (findings)

| Area | Today | Problem for CMS |
|---|---|---|
| Data | `lib/data.ts` static exports | Imported directly by 12 client components |
| Page | `app/page.tsx` fixed order: Hero, Projects, About, Skills, Experience, Contact | No layout control |
| Nav | `spaceNavLinks` hard-coded in `components/Nav.tsx` | Not editable, ignores new sections |
| Guide | `STOPS` hard-coded in `components/SpaceGuide.tsx` | Same |
| Copy | Text inside components (About facts/pillars, Contact mail body, Hero lines) | Not editable |
| Media | `/public/videos`, `/public/shots` via `mediaFor(id)` path convention | Can't upload new media |
| Layout | Root layout loads canvas, cursor, Lenis, site CSS globally | Admin would inherit cursor/scroll effects |

Good news: `lib/sectionTrack.ts` sorts sections by DOM position, so nav + guide already handle reordered sections.

## 3. Architecture

```
Browser ──> Next.js (any host: Vercel / Netlify / Node)
              │
              ├─ (site) home page  ── getSiteContent() ──┐
              │      cached with unstable_cache tag "site"│
              │                                           ▼
              ├─ /admin (client app) ── /api/admin/* ── Cloudflare D1 (REST API)
              │                               │
              │                               └─ presigned PUT ──> Cloudflare R2
              │                                                        │
              └────────────── media URLs ◀── Cloudflare CDN (R2 custom domain)
```

Decisions:

1. **D1 via Cloudflare REST API** (`POST /accounts/{acct}/d1/database/{db}/query`). Works from any host and local dev; no migration to Workers needed. (Could switch to a native binding later if you deploy on Workers via OpenNext — store layer is isolated in one file.)
2. **One JSON document** for the whole site (`site_content` row) + `revisions` table. Atomic saves, simple restore, tiny read cost (1 query, cached).
3. **Validation with zod** on every save — bad data can never break the live page. Missing fields are filled from defaults on read.
4. **Caching**: home page reads through `unstable_cache(['site'], { tags: ['site'] })`. Save/restore call `revalidateTag('site', { expire: 0 })` → change visible on next request. Cloudflare CDN caches media only (HTML stays dynamic-ISR from Next).
5. **R2 uploads via presigned URL** (aws4fetch signs server-side, browser PUTs directly) → bypasses host body-size limits (Vercel 4.5 MB) so videos work.
6. **Auth**: single admin. `ADMIN_PASSWORD` checked with constant-time compare; session = HMAC-SHA256 signed cookie (`httpOnly`, `secure`, `sameSite=strict`, 7-day expiry). Login rate limit (5 tries / 15 min per IP). Every `/api/admin/*` route verifies session + same-origin check (CSRF).

## 4. Data model

### D1 schema (`db/migrations/0001_init.sql`)

```sql
CREATE TABLE IF NOT EXISTS site_content (
  id          TEXT PRIMARY KEY,          -- 'published' | 'draft'
  data        TEXT NOT NULL,             -- JSON SiteContent
  version     INTEGER NOT NULL,          -- optimistic locking
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS revisions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  data        TEXT NOT NULL,
  note        TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_revisions_created ON revisions(created_at DESC);

CREATE TABLE IF NOT EXISTS media (
  id          TEXT PRIMARY KEY,
  key         TEXT NOT NULL UNIQUE,      -- R2 object key
  url         TEXT NOT NULL,             -- CDN URL
  type        TEXT NOT NULL,             -- mime
  size        INTEGER,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

Keep last 50 revisions (prune on save). Optimistic `version` check stops two tabs overwriting each other.

### `SiteContent` (zod schema → TS types)

```ts
SiteContent {
  schemaVersion: 1
  settings: {
    profile: Profile            // name, role, email, phone, location, employer, links, intro, summary, builds[]
    seo: { title, description, keywords[], ogImage, siteUrl }
    theme: { accent, accentSecondary, bg, ink, muted, radius, ... }   // → CSS vars
    nav: NavLink[]              // label + target section anchor, order
    guide: { enabled, stops: GuideStop[] }   // flight-guide text per section
    footer: { tagline, showClock }
  }
  data: { stats[], projects[], skillGroups[], marquee[], jobs[], education[], certificates[] }
  sections: Section[]           // ordered = page order
}

Section {
  id: string          // stable uuid
  type: SectionType
  anchor: string      // DOM id, used by nav/guide (#work, #about…)
  enabled: boolean
  props: per-type object (validated by discriminated union)
}
```

### Section types

| Type | Kind | Editable props |
|---|---|---|
| `hero` | built-in | headline lines, rotating words, CTA labels, show stats/marquee, CV link |
| `projects` | built-in | title image/text, categories, which projects (all/featured/picked ids) |
| `about` | built-in | facts[], pillars[], intro override |
| `skills` | built-in | title, which skill groups |
| `experience` | built-in | title, show education/certificates |
| `contact` | built-in | heading, text, mail subject/body, button labels |
| `richText` | new | eyebrow, heading, body (markdown subset, sanitized), align, width |
| `cards` | new | heading, columns 2–4, items[{icon, title, text, image, link}] |
| `cta` | new | heading, text, primary/secondary button, background style |
| `media` | new | image or video (R2), caption, aspect, autoplay |
| `statsBand` | new | items[{value, suffix, label}] with count-up animation |
| `spacer` | new | height |

Built-ins may appear once each; new types unlimited. All new sections reuse existing space theme classes (`section space-section`, `data-reveal`) so they look native, with micro animations.

No raw-HTML section (stored-XSS risk). Markdown is rendered with a tiny allow-list renderer, no `dangerouslySetInnerHTML` of user input.

## 5. Front-end refactor (site)

1. **Route groups**
   - `app/layout.tsx` → minimal `<html><body>` + fonts.
   - `app/(site)/layout.tsx` → BackgroundCanvas, CustomCursor, Motion, site CSS, JSON-LD, `generateMetadata` from content SEO.
   - `app/(site)/page.tsx` → `const content = await getSiteContent()` → `<SiteProvider content>` + `<SectionRenderer sections>`.
   - `app/admin/...` → own layout + `admin.css`, no cursor/Lenis.
2. **`SiteProvider` + `useSite()`** (client context). Replace every `import { profile… } from "@/lib/data"` with `useSite()`. Module-level constants (About `facts`, Contact `mailto`) move inside components.
3. **Components receive section `props`** for their copy; fall back to current hard-coded text when a prop is empty → page looks identical after migration.
4. **Nav + SpaceGuide** read `settings.nav` / `settings.guide.stops`; entries whose anchor is missing/disabled are hidden automatically.
5. **Theme**: `<style>` injecting `:root{--accent:…}` from `settings.theme` (values validated as colours).
6. **Media helper** `mediaUrl(path)`: absolute URLs pass through; `/videos/...` paths get `NEXT_PUBLIC_CDN_URL` prefix when set (so you can move `/public/videos` to R2 later). Projects get optional `desktopVideo/mobileVideo/poster` overrides; empty → current `mediaFor()` convention.
7. `lib/data.ts` stays as the **default content seed** (`lib/content/defaults.ts` builds `SiteContent` from it).
8. Optional: `assetPrefix` from `CDN_ASSET_PREFIX` for `_next/static` through Cloudflare CDN.

## 6. Admin panel (`/admin`)

Layout: left sidebar tabs, centre editor, right live preview (iframe of `/?preview=draft`), top bar with Save draft / Publish / status.

| Tab | Features |
|---|---|
| **Layout** | Drag-and-drop section list (native HTML5 DnD + up/down buttons for keyboard), toggle visibility, duplicate, delete (confirm), "Add section" picker with type previews, edit section props |
| **Profile** | All profile fields, social links, rotating words |
| **Projects** | List with add/remove/reorder, all fields, accent colour picker, media upload per project, featured toggle, category |
| **Skills / Marquee** | Groups + chips editor |
| **Experience** | Jobs, education, certificates |
| **Navigation & Guide** | Nav links (anchor dropdown from current sections), guide stop texts |
| **SEO** | Title, description, keywords, OG image upload, Google preview card |
| **Theme** | Colour pickers for CSS vars + reset to default |
| **Media** | Upload (drag-drop, progress), grid library, copy URL, delete |
| **History** | Revisions list with time/note, preview, restore |
| **Advanced** | Raw JSON editor (validated), export/import JSON backup, reset to defaults |

Implementation: one generic **schema-driven form renderer** (`FieldText`, `FieldTextarea`, `FieldColor`, `FieldMedia`, `FieldList<string>`, `FieldObjectList`, `FieldSelect`, `FieldToggle`) driven by a field-definition map per section type — new section types only need a definition, not new UI code.

UX details: unsaved-changes warning, Ctrl+S save, toast feedback, validation errors shown at field level, mobile-usable sidebar collapse. Built with `design-taste-frontend` app-screen rules, dark UI matching site.

**Draft vs published**: Save writes `draft`; Publish copies draft → `published` + creates revision + revalidates. Preview iframe uses `?preview=draft` (allowed only with valid admin cookie).

## 7. API routes (`app/api/admin/*`)

| Route | Method | Purpose |
|---|---|---|
| `/login` | POST | password → session cookie (rate-limited) |
| `/logout` | POST | clear cookie |
| `/session` | GET | logged-in? + which env keys are configured |
| `/content` | GET | draft (or published if no draft) |
| `/content` | PUT | save draft `{data, version}` → zod validate → 409 on version conflict |
| `/publish` | POST | draft → published, revision, `revalidateTag` |
| `/revisions` | GET | list (id, note, date) |
| `/revisions/[id]` | GET / POST | view / restore into draft |
| `/media/sign` | POST | `{filename, type, size}` → presigned R2 PUT URL + final CDN URL (type allow-list: jpg/png/webp/avif/gif/svg?/mp4/webm, max 200 MB) |
| `/media` | GET / POST / DELETE | library list / register uploaded file / delete R2 object |
| `/setup` | POST | run migrations on D1 (idempotent) |

All JSON responses `{ ok, data | error }`. Errors never leak tokens.

## 8. Environment variables (`.env` + `.env.example`)

```bash
# Site
NEXT_PUBLIC_SITE_URL=

# Admin auth
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=          # 32+ random chars

# Cloudflare account
CLOUDFLARE_ACCOUNT_ID=

# Cloudflare D1 (API token with D1:Edit)
CLOUDFLARE_D1_DATABASE_ID=
CLOUDFLARE_D1_API_TOKEN=

# Cloudflare R2 (S3 API token)
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=

# Cloudflare CDN (R2 custom domain, e.g. https://cdn.example.com)
NEXT_PUBLIC_CDN_URL=
# Optional: serve /_next/static via CDN
CDN_ASSET_PREFIX=
```

`.env` added to `.gitignore`. When keys are empty: site renders defaults, admin shows a "Cloudflare not configured" banner and disables Save/Upload instead of crashing.

R2 bucket needs a CORS rule allowing `PUT` from your site origin — included in README setup steps.

## 9. File plan

```
app/layout.tsx                      (slimmed)
app/(site)/layout.tsx               (new: site chrome + metadata)
app/(site)/page.tsx                 (moved, dynamic sections)
app/admin/layout.tsx, page.tsx, admin.css
app/api/admin/**/route.ts           (routes above)
components/site/SiteProvider.tsx
components/site/SectionRenderer.tsx
components/sections/{RichText,Cards,Cta,Media,StatsBand,Spacer}.tsx + sections-custom.css
components/admin/**                 (AdminApp, Sidebar, LayoutEditor, forms/fields, MediaLibrary, History, Login)
lib/content/schema.ts               (zod)
lib/content/defaults.ts             (from lib/data.ts)
lib/content/store.ts                (get/save/publish/revisions + cache)
lib/content/sectionFields.ts        (field definitions per section type)
lib/cloudflare/d1.ts, r2.ts
lib/auth/session.ts, rateLimit.ts
lib/markdown.ts                     (safe mini renderer)
db/migrations/0001_init.sql
docs/admin-setup.md                 (Cloudflare setup guide)
+ edits: Hero, Projects, ProjectModal, About, Skills, Experience, Contact, Nav, Footer, HoloDossier, SpaceGuide
```

## 10. Phases

| # | Phase | Output | Check |
|---|---|---|---|
| 1 | Content schema + defaults + store with fallback | `getSiteContent()` returns defaults | unit tests: schema accepts defaults, rejects bad data |
| 2 | Site refactor (route groups, provider, components → `useSite`, SectionRenderer) | Page visually identical | `next build`, Playwright screenshot diff vs current |
| 3 | New section types + theme + SEO from content | Extra sections render | screenshots desktop/mobile |
| 4 | Auth + API routes + D1 client + migrations | Working API | route tests (auth required, validation, 409) |
| 5 | Admin UI (layout editor, forms, preview, history, advanced) | Usable panel | e2e: login → reorder → publish → home changed |
| 6 | R2 media upload + library | Uploads via CDN | e2e with keys (after you add them) |
| 7 | Security review + docs | `docs/admin-setup.md` | security-reviewer pass |

Phases 1–5 fully testable without keys (fallback + local mock of D1). Phase 6 final test needs your keys.

## 11. Risks

- **Heavy built-in components** (Hero 3D, Projects stacking cards) have lots of inline copy; making 100% of strings editable is long — plan exposes the meaningful copy, rest stays as designed defaults.
- **Reordering built-ins** may change scroll-driven animations (astronaut flight path tuned to current order). Guide reads order dynamically, but visuals need a check after reorder.
- **D1 REST latency** (~50–150 ms) only on cache miss; cached otherwise.
- **Single password admin** — fine for personal portfolio; can swap for Cloudflare Access later.

## 12. Questions for you

1. Hosting target? (Vercel / Netlify / Cloudflare Workers) — affects whether D1 uses REST (any host) or binding (Workers).
2. Need draft + preview, or is direct publish enough?
3. Single admin password OK, or protect `/admin` with Cloudflare Access instead?
4. Move existing `/public/videos` + `/shots` to R2/CDN now, or only new uploads?
