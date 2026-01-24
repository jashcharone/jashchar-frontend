# Alumni Module Setup Instructions
## ಪೂರ್ಣ Alumni Module ಸೆಟಪ್ ಮಾಡಿ (Complete Alumni Module Setup)

### 1. Database Setup (Database ಸೆಟಪ್)
**Execute SQL in Supabase:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy entire content from `database/03_alumni_module.sql`
3. Run the SQL script
4. This creates:
   - ✅ `alumni_students` table (Alumni student details)
   - ✅ `alumni_events` table (Alumni events calendar)
   - ✅ RLS policies for security
   - ✅ Helper functions and triggers
   - ✅ Performance indexes

### 2. Backend API (Backend API ಸೆಟಪ್)
**Files Created:**
- ✅ `backend/src/controllers/alumniController.js` - Alumni management API
- ✅ `backend/src/controllers/alumniEventsController.js` - Events management API
- ✅ `backend/src/routes/alumniRoutes.js` - Alumni routes
- ✅ `backend/src/routes/alumniEventsRoutes.js` - Events routes
- ✅ Routes registered in `backend/src/routes/routes.index.js`

**API Endpoints:**
- `GET /api/alumni` - Get alumni list with filters
- `GET /api/alumni/:enroll_id` - Get alumni details
- `POST /api/alumni` - Create alumni record
- `PUT /api/alumni/:id` - Update alumni record
- `DELETE /api/alumni/:id` - Delete alumni record
- `POST /api/alumni/mark-as-alumni` - Mark student as alumni

- `GET /api/alumni-events` - Get all events
- `GET /api/alumni-events/calendar` - Get events for calendar
- `GET /api/alumni-events/:id` - Get event details
- `POST /api/alumni-events` - Create event
- `PUT /api/alumni-events/:id` - Update event
- `DELETE /api/alumni-events/:id` - Delete event

### 3. Frontend Pages (Frontend Pages ಸೆಟಪ್)
**Files Created:**
- ✅ `frontend/src/pages/school-owner/alumni/AlumniList.jsx` - Alumni management page
- ✅ `frontend/src/pages/school-owner/alumni/AlumniEvents.jsx` - Events calendar page
- ✅ Routes added to `frontend/src/App.jsx`
- ✅ Routes registered in `frontend/src/registry/routeRegistry.js`

**Routes:**
- `/school-owner/alumni/list` - Alumni List & Management
- `/school-owner/alumni/events` - Alumni Events Calendar

### 4. Install FullCalendar (FullCalendar Install ಮಾಡಿ)
**Required for Events Calendar:**
```bash
cd frontend
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/interaction
```

### 5. Module Registration & Permissions
**Add to modules table in database:**
```sql
INSERT INTO modules (name, slug, parent_id, icon, display_order, description)
VALUES 
  ('Alumni', 'alumni', NULL, 'Users', 90, 'Alumni management and events'),
  ('Alumni Events', 'alumni.events', (SELECT id FROM modules WHERE slug = 'alumni'), 'Calendar', 1, 'Alumni events calendar');
```

**Add permissions for each module:**
```sql
-- Add permissions for alumni module
INSERT INTO permissions (module_id, permission_name, permission_slug)
SELECT 
  m.id,
  unnest(ARRAY['View', 'Add', 'Edit', 'Delete']),
  unnest(ARRAY['view', 'add', 'edit', 'delete'])
FROM modules m
WHERE m.slug IN ('alumni', 'alumni.events');
```

**Grant permissions to school_owner role:**
```sql
-- Grant all alumni permissions to school_owner role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM roles r
CROSS JOIN permissions p
INNER JOIN modules m ON p.module_id = m.id
WHERE r.name = 'school_owner' 
  AND m.slug IN ('alumni', 'alumni.events');
```

### 6. Add to Sidebar Navigation
**Update sidebar configuration to include Alumni menu:**
```javascript
// In your sidebar component or navigation config
{
  label: 'Alumni',
  icon: 'Users',
  children: [
    {
      label: 'Alumni List',
      path: '/school-owner/alumni/list',
      icon: 'UserCheck'
    },
    {
      label: 'Events Calendar',
      path: '/school-owner/alumni/events',
      icon: 'Calendar'
    }
  ]
}
```

### 7. Restart Servers (Servers ಮತ್ತೆ Start ಮಾಡಿ)
```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run dev
```

### 8. Test Functionality (Test ಮಾಡಿ)
1. ✅ Login as school_owner
2. ✅ Navigate to Alumni → Alumni List
3. ✅ Test filtering by class/section/session
4. ✅ Add/Edit/Delete alumni records
5. ✅ Navigate to Alumni → Events Calendar
6. ✅ Create an event by clicking on a date
7. ✅ Click on existing events to view/edit
8. ✅ Test audience selection (Everybody/Class/Section)
9. ✅ Verify calendar displays events correctly

## Features Included:
### Alumni Management:
- ✅ List all alumni with advanced filters
- ✅ Filter by branch, session, class, section
- ✅ Search by name, mobile, email
- ✅ Add/Edit alumni contact details
- ✅ Delete alumni records
- ✅ Photo management (placeholder ready)
- ✅ Mark students as alumni

### Alumni Events:
- ✅ Full calendar view with FullCalendar
- ✅ Add events by clicking dates
- ✅ View/Edit/Delete events
- ✅ Audience targeting (Everybody/Class/Section)
- ✅ Session-based filtering
- ✅ Active/Inactive status
- ✅ Show on website option
- ✅ Branch-specific events
- ✅ Event descriptions and notes

## Optional Enhancements:
1. **Photo Upload:** Implement file upload for alumni photos
2. **SMS Notifications:** Integrate SMS service for event notifications
3. **Email Invitations:** Send email invitations for events
4. **Statistics Dashboard:** Add alumni statistics to dashboard
5. **Export Data:** Add CSV/PDF export functionality
6. **Public Alumni Directory:** Show alumni list on school website

## ಟಿಪ್ಪಣಿ (Notes):
- All routes are protected with authentication
- Permission system is fully integrated
- RLS policies ensure school-level data isolation
- Database functions optimize complex queries
- Ready for production use!
