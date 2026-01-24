# Phase‑2: Front‑CMS (Public Website) — Architecture Draft

Date: 2025‑12‑12

## Goal
Move Phase‑1 public website from “seed-only / direct Supabase reads” into a governed **Front‑CMS** system:
- School-owner (and permitted staff) can manage public-site content.
- Public website reads only **published** content.
- Security is enforced at **DB RLS + Backend API permissions + Frontend UI hiding**.

Phase‑1 already ships the public routes and a safe seed fallback. Phase‑2 introduces the persistent data model + API boundary.

## Current State (Phase‑1)
- Public pages are implemented under `/s/:domain/...`.
- Public data fetch uses `cms_settings` by `cms_url_alias` and can fall back to `frontend/src/data/publicSiteSeed.js`.

## Proposed Data Model

### Core tables (minimum)
- `cms_settings` — one row per school
  - URL alias (`cms_url_alias`) + enable flag
  - theme + SEO toggles
  - contact + branding
- `cms_pages` — rich-content pages (About, CBSE Exam, Online Course, etc.)
  - `slug`, `title`, `content_html` (or localized fields)
  - `is_published`, `sort_order`
- `cms_menus` — menu items used by the header
  - label + href + `position`
  - supports dropdown structure via `parent_id`
- `cms_banners` — homepage slider
  - title/subtitle/image/button + `position` + `is_active`

### Optional/next tables (incremental)
- `cms_posts` (news/notices), `cms_events`, `cms_gallery_items`
- `cms_media` (optional registry for uploads)

## Access Patterns

### Public read
Public pages should be able to render without authentication:
- Read *only* published content (and enabled school site)
- Minimal queries to avoid UI latency

Recommended: a single backend aggregator endpoint:
- `GET /api/public/site/:alias`
  - returns `cms_settings` + `menus` + `banners` + published pages summary

Fallback remains:
- If the API is unavailable, use Phase‑1 seed as last resort.

### School-owner edit
School-owner/admin can manage CMS content:
- Uses backend API + `checkPermission`.
- Frontend hides CMS actions using `PermissionComponents`.

## Permissions (Module Slugs)
Recommended module slugs:
- `frontend_cms.settings`
- `frontend_cms.pages`
- `frontend_cms.menus`
- `frontend_cms.banners`
- `frontend_cms.posts` (future)

Actions: `view`, `add`, `edit`, `delete`

## Security Requirements

### Layer 1: Database (RLS)
- Enable RLS on all CMS tables.
- Policies:
  - Public: allow SELECT only for published/active rows.
  - Authenticated school users: allow CRUD only for rows where `school_id` belongs to the user’s school.
  - Use pattern:
    - `exists(select 1 from school_users su where su.user_id = auth.uid() and su.school_id = <table>.school_id)`

### Layer 2: Backend API
- Every write route must use `checkPermission(moduleSlug, action)`.
- Prefer the universal permission model already used in the backend.

### Layer 3: Frontend UI
- Hide edit buttons and CMS navigation when user lacks permission.

## API Draft (Skeleton)

### Authenticated (School-owner/admin)
Base: `/api/front-cms`
- `GET /settings`
- `PUT /settings`
- `GET /pages`
- `POST /pages`
- `PUT /pages/:id`
- `DELETE /pages/:id`
- `GET /menus`
- `POST /menus`
- `PUT /menus/:id`
- `DELETE /menus/:id`
- `GET /banners`
- `POST /banners`
- `PUT /banners/:id`
- `DELETE /banners/:id`

### Public
Base: `/api/public`
- `GET /site/:alias` (aggregated)

## Migration Plan
1) Keep Phase‑1 public site as-is (seed fallback).
2) Add DB tables + RLS + minimal seed.
3) Add backend API skeleton (this phase).
4) Switch public pages to read from backend aggregator, with DB fallback, then seed fallback.
5) Add CMS UI screens incrementally (no new UX in Phase‑2 unless explicitly requested).
