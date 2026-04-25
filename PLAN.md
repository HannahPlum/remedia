# Remedia — Physical Media Tracker: Build Plan

## Overview
A browser-based app that lets a user create named collections, add physical media items to them (with category-aware fields), and browse their library. Data persists in `localStorage`. External APIs provide search/autofill; manual entry is always available as a fallback.

Deployed on **Vercel**. All third-party API keys are stored as **Vercel environment variables** and are never exposed to the browser. The client only calls internal `/api/*` Vercel serverless functions, which proxy requests to TMDB and MusicBrainz server-side.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Markup | HTML5 | Already present |
| Styles | CSS3 (custom) | Already present; we'll build a clean component system |
| Logic | Vanilla JavaScript (ES modules) | Zero build-step, easy to run locally |
| Persistence | `localStorage` (JSON) | No server required, works offline |
| Movie search | [TMDB API](https://www.themoviedb.org/documentation/api) (free key) | Rich metadata: poster, year, overview, runtime |
| Music search | [MusicBrainz API](https://musicbrainz.org/doc/MusicBrainz_API) (free, no key) | Artist, album, year, track list, cover art |
| Icons | [Lucide Icons](https://lucide.dev/) (CDN) | Lightweight SVG icon set |

---

## Data Model

```
localStorage key: "remedia_data"

{
  "collections": [
    {
      "id": "uuid",
      "name": "My Blu-rays",
      "category": "movies" | "music" | "custom",
      "customCategoryLabel": "Comic Books",   // only when category === "custom"
      "createdAt": "ISO date"
    }
  ],
  "items": [
    {
      "id": "uuid",
      "collectionId": "uuid",
      "title": "...",
      "coverUrl": "...",
      "notes": "...",

      // Movies
      "mediaFormat": "dvd" | "blu-ray" | "vhs" | "4k-uhd" | "laserdisc",
      "year": 1994,
      "director": "...",
      "runtime": 142,
      "overview": "...",
      "tmdbId": 12345,

      // Music
      "mediaFormat": "cd" | "vinyl" | "cassette" | "8-track" | "minidisc",
      "artist": "...",
      "year": 1991,
      "genre": "...",
      "trackCount": 12,
      "mbid": "...",

      // Custom (free-form)
      "customFields": { "key": "value" },

      "addedAt": "ISO date"
    }
  ]
}
```

---

## Pages / Views

The app is a **single-page application (SPA)** — one `index.html` with JavaScript swapping content inside a `<main>` container.

| View | Description |
|---|---|
| **Home / Dashboard** | Lists all collections as cards. "New Collection" button in top-right. |
| **Collection View** | Shows all media items in a selected collection as cards. Filter/sort bar. "Add Item" button. |
| **Add/Edit Item Modal** | Overlay with category-aware form. Search bar at top for API lookup. |
| **Item Detail Modal** | Read-only card with full metadata and cover art. Edit / Delete buttons. |
| **New Collection Modal** | Name field, category selector (Movies / Music / Custom). |

---

## Feature Breakdown

### 1. Collection Management
- Create a collection with a name and category
- Edit a collection's name
- Delete a collection (with confirmation; deletes all its items)
- Collections displayed as cards on the Home view with item count badges

### 2. Category-Aware Item Forms

**Movies**
- Search TMDB (autofills title, year, director, runtime, overview, poster)
- Manual entry fallback if search skipped or no result found
- Format selector: DVD / Blu-ray / 4K UHD / VHS / Laserdisc
- Notes field

**Music**
- Search MusicBrainz by album or artist (autofills album, artist, year, genre, track count, cover art)
- Manual entry fallback
- Format selector: CD / Vinyl / Cassette / 8-Track / MiniDisc
- Notes field

**Custom**
- Free-form title + notes only
- No API search
- Optional custom fields (user can add key/value pairs)

### 3. Search & Autofill
- Debounced search input (300 ms) triggers API call
- Results shown as a dropdown list (cover thumbnail + title + year)
- Selecting a result populates the form; all fields remain editable
- "Skip / Enter Manually" link always visible below search bar

### 4. Collection View & Filtering
- Grid of media cards (cover art, title, format badge, year)
- Sort by: Date Added / Title (A–Z) / Year
- Filter by format (checkbox group dynamically built from formats present in the collection)
- Text search/filter on title

### 5. Item Detail & Edit
- Click any card to open a read-only detail modal
- Edit button opens the same Add/Edit form pre-populated
- Delete button (with confirmation dialog)

---

## File Structure (target)

```
remedia/
├── index.html
├── style.css
├── PLAN.md
└── js/
    ├── main.js          # Entry point — router, event delegation
    ├── store.js         # localStorage read/write helpers
    ├── router.js        # View switching logic
    ├── ui.js            # Shared render helpers (cards, modals, badges)
    ├── views/
    │   ├── home.js      # Dashboard — collection list
    │   └── collection.js# Collection view — item grid + filters
    ├── modals/
    │   ├── newCollection.js
    │   ├── addEditItem.js
    │   └── itemDetail.js
    └── api/
        ├── tmdb.js      # TMDB search wrapper
        └── musicbrainz.js # MusicBrainz search wrapper
```

---

## Build Steps

### Phase 1 — Foundation
- [ ] 1.1 Set up `index.html` shell (nav bar, `<main>` mount point, modal container)
- [ ] 1.2 Write `store.js` (load/save collections & items, CRUD helpers, UUID generator)
- [ ] 1.3 Write `router.js` (view switching — home ↔ collection)
- [ ] 1.4 Write base CSS (variables, reset, grid, card, modal, button, badge styles)

### Phase 2 — Collections
- [ ] 2.1 Render Home view: collection cards with item count
- [ ] 2.2 New Collection modal (name + category, form validation)
- [ ] 2.3 Delete collection (confirmation, cascade-delete items)

### Phase 3 — Items (manual entry)
- [ ] 3.1 Add Item modal — static form skeleton
- [ ] 3.2 Dynamic field rendering based on collection category
- [ ] 3.3 Save item to store; re-render collection grid
- [ ] 3.4 Item Detail modal (read-only, edit, delete)
- [ ] 3.5 Edit Item — pre-populate form, update store

### Phase 4 — API Search
- [ ] 4.1 TMDB API module (search by title, map response to item fields)
- [ ] 4.2 MusicBrainz API module (search releases, map response to item fields)
- [ ] 4.3 Search input + dropdown in Add/Edit modal
- [ ] 4.4 "Enter Manually" fallback path

### Phase 5 — Filtering & Polish
- [ ] 5.1 Sort controls in Collection view
- [ ] 5.2 Format filter checkboxes
- [ ] 5.3 Title text search in Collection view
- [ ] 5.4 Responsive layout (mobile-friendly grid)
- [ ] 5.5 Empty state illustrations (no collections, empty collection)
- [ ] 5.6 Toast notifications (item saved, collection deleted, etc.)

### Phase 6 — Quality of Life (stretch)
- [ ] 6.1 Import / Export collections as JSON
- [ ] 6.2 Duplicate item across collections
- [ ] 6.3 Bulk delete items
- [ ] 6.4 Dark / Light mode toggle

---

## API Notes

### TMDB
- Register for a free API key at https://www.themoviedb.org/settings/api
- Key is stored in a `config.js` file (not committed if using git)
- Search endpoint: `GET https://api.themoviedb.org/3/search/movie?query=<title>&api_key=<key>`
- Image base URL: `https://image.tmdb.org/t/p/w200<poster_path>`

### MusicBrainz
- No API key required
- Search endpoint: `GET https://musicbrainz.org/ws/2/release/?query=<album>&fmt=json`
- Cover art: `GET https://coverartarchive.org/release/<mbid>/front-250`
- Rate limit: 1 request/second — implement a queue or debounce ≥ 1 000 ms

---

## Open Questions (to resolve before coding)
1. Should collections support **multiple categories** (e.g., one shelf for movies AND music) or stay single-category? → Current plan: single-category per collection.
2. TMDB key storage — hardcode in `config.js` (simplest) or prompt the user to enter it in a settings screen?
3. Should custom collections support **sub-categories** or just be free-form?
