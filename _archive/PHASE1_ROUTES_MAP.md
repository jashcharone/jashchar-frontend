# Phase 1 — Public Site Routes Map

Base URL (local): http://localhost:3005/s/jashcharerp

## Public (Phase 1)
- `/s/:domain` → `frontend/src/pages/public/SchoolHomepage.jsx`
- `/s/:domain/login` → `frontend/src/pages/public/PublicSchoolLogin.jsx`

### Required reference subpages (implemented as templates)
- `/s/:domain/online_course` → `frontend/src/pages/public/SchoolSubpage.jsx` (`variant="online_course"`)
- `/s/:domain/online_admission` → `frontend/src/pages/public/SchoolSubpage.jsx` (`variant="online_admission"`)
- `/s/:domain/cbseexam` → `frontend/src/pages/public/SchoolSubpage.jsx` (`variant="cbseexam"`)
- `/s/:domain/examresult` → `frontend/src/pages/public/SchoolSubpage.jsx` (`variant="examresult"`)
- `/s/:domain/annual_calendar` → `frontend/src/pages/public/SchoolSubpage.jsx` (`variant="annual_calendar"`)

### CMS-like pages (Phase 1 templates)
- `/s/:domain/page/:pageSlug` → `frontend/src/pages/public/SchoolSubpage.jsx` (`variant="page"`)
  - `about-us`
  - `facilities`
  - `annual-sports-day`
  - `course`
  - `school-uniform`
  - `principal-message`
  - `school-management`
  - `know-us`
  - `approach`
  - `pre-primary`
  - `teacher`
  - `houses-mentoring`
  - `student-council`
  - `career-counselling`
  - `gallery` (special template)
  - `events` (special template)
  - `news` (special template)
  - `contact-us` (special template)

## Seed Content (Phase 1)
- `frontend/src/data/publicSiteSeed.js`
  - Used automatically when `cms_settings` is missing or Supabase env is unavailable.
