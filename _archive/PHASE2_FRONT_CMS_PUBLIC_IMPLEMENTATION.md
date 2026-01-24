# Phase 2: Front CMS - Public Website Implementation

## Overview
This document details the implementation of the public-facing website for schools using the Front CMS module. The system allows schools to have their own public website accessible via `/:schoolSlug`.

## Architecture
- **Base Route**: `/:schoolSlug` (e.g., `/myschool`, `/demo-school`)
- **Layout**: Shared `PublicHeader` and `PublicFooter` components.
- **Data Fetching**: `publicCmsService.js` fetches data from `frontCms.controller.js`.
- **SEO**: `react-helmet` manages dynamic titles and meta tags.

## Implemented Pages

### 1. Home Page (`/`)
- **Component**: `SchoolPublicHome.jsx`
- **Features**:
  - Dynamic Banner Slider
  - Welcome Message
  - Latest News (Top 3)
  - Upcoming Events (Top 3)
  - Quick Links

### 2. Generic Pages (`/:pageSlug`)
- **Component**: `SchoolPublicPage.jsx`
- **Features**:
  - Renders dynamic content from `cms_pages` table.
  - Supports rich text content.

### 3. News Module
- **List**: `/news` -> `SchoolPublicNewsList.jsx`
- **Detail**: `/news/:id` -> `SchoolPublicNewsDetail.jsx`
- **Features**: List view with summaries, detailed view with full content and author info.

### 4. Events Module
- **List**: `/events` -> `SchoolPublicEventsList.jsx`
- **Detail**: `/events/:id` -> `SchoolPublicEventDetail.jsx`
- **Features**: Calendar dates, location, descriptions.

### 5. Gallery Module
- **List**: `/gallery` -> `SchoolPublicGallery.jsx`
- **Detail**: `/gallery/:id` -> `SchoolPublicGalleryDetail.jsx`
- **Features**: Album covers, lightbox for viewing images.

### 6. Notices Module
- **List**: `/notices` -> `SchoolPublicNotices.jsx`
- **Features**: Placeholder for school notices.

## Backend API Endpoints
- `GET /api/public/site/:slug` - Global settings and menus
- `GET /api/public/page/:slug/:pageSlug` - Single page content
- `GET /api/public/news/:slug` - List of news
- `GET /api/public/news/:slug/:id` - Single news item
- `GET /api/public/events/:slug` - List of events
- `GET /api/public/events/:slug/:id` - Single event
- `GET /api/public/gallery/:slug` - List of galleries
- `GET /api/public/gallery/:slug/:id` - Single gallery with images

## Usage
1. **School Owner** configures settings, menus, pages, news, etc., in the Admin Panel.
2. **Public Users** visit `http://domain.com/:schoolSlug` to view the site.

## Next Steps
- Implement "Contact Us" form submission.
- Add "Admission Enquiry" form integration.
- Enhance "Notices" with backend support.
