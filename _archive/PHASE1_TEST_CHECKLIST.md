# Phase 1 — Test Checklist (Smoke)

## A. Boot / Routing
- [ ] `npm install` in `frontend/` completes
- [ ] `npm run dev` starts without errors
- [ ] Open `http://localhost:3005/s/jashcharerp` loads homepage

## B. Header / Navigation (Desktop)
- [ ] Top bar renders + social icons present
- [ ] Dropdowns open on hover **and** keyboard focus (Tab)
- [ ] Each menu item navigates to correct route:
  - [ ] Home
  - [ ] Online Course
  - [ ] Online Admission
  - [ ] Cbse Exam Result
  - [ ] Exam Result
  - [ ] Annual Calendar
  - [ ] About Us dropdown items
  - [ ] Academics dropdown items
  - [ ] Gallery, Events, News, Contact
- [ ] Login button goes to `/s/jashcharerp/login`

## C. Header / Navigation (Mobile)
- [ ] Hamburger opens/closes
- [ ] Dropdown items expand/collapse
- [ ] Links navigate correctly

## D. Required Pages Load
Open each URL and confirm no console errors:
- [ ] `/s/jashcharerp/online_course`
- [ ] `/s/jashcharerp/online_admission`
- [ ] `/s/jashcharerp/cbseexam`
- [ ] `/s/jashcharerp/examresult`
- [ ] `/s/jashcharerp/annual_calendar`
- [ ] `/s/jashcharerp/page/about-us`
- [ ] `/s/jashcharerp/page/facilities`
- [ ] `/s/jashcharerp/page/annual-sports-day`
- [ ] `/s/jashcharerp/page/course`
- [ ] `/s/jashcharerp/page/school-uniform`
- [ ] `/s/jashcharerp/page/principal-message`
- [ ] `/s/jashcharerp/page/school-management`
- [ ] `/s/jashcharerp/page/know-us`
- [ ] `/s/jashcharerp/page/approach`
- [ ] `/s/jashcharerp/page/pre-primary`
- [ ] `/s/jashcharerp/page/teacher`
- [ ] `/s/jashcharerp/page/houses-mentoring`
- [ ] `/s/jashcharerp/page/student-council`
- [ ] `/s/jashcharerp/page/career-counselling`
- [ ] `/s/jashcharerp/page/gallery`
- [ ] `/s/jashcharerp/page/events`
- [ ] `/s/jashcharerp/page/news`
- [ ] `/s/jashcharerp/page/contact-us`

## E. SEO Meta (Phase 1)
- [ ] Verify `<title>` changes per page
- [ ] Verify `<meta name="description">` exists

## F. Resilience
- [ ] Disable network images → pages still render with placeholders
