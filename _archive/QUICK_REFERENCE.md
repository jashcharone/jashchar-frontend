# 🚀 Quick Reference Guide

## 📍 Finding Files Quickly

### Backend Files

| What You Need | Where to Look |
|--------------|---------------|
| **Authentication Logic** | `backend/src/controllers/authController.js` |
| **School Management** | `backend/src/controllers/school.controller.js` |
| **Student Management** | `backend/src/controllers/student.controller.js` |
| **Fees Management** | `backend/src/controllers/fees.controller.js` |
| **Billing/Subscriptions** | `backend/src/controllers/subscription.controller.js` |
| **Master Admin** | `backend/src/controllers/admin.controller.js` |
| **API Routes** | `backend/src/routes/routes.index.js` |
| **Database Queries** | `backend/src/database/` |
| **Debug Scripts** | `backend/scripts/debug/` |
| **Migration Scripts** | `backend/scripts/migration/` |

### Frontend Files

| What You Need | Where to Look |
|--------------|---------------|
| **Master Admin Pages** | `frontend/src/pages/master-admin/` |
| **School Owner Pages** | `frontend/src/pages/school-owner/` |
| **Student Pages** | `frontend/src/pages/student/` |
| **Public Pages** | `frontend/src/pages/public/` |
| **Login Page** | `frontend/src/pages/Login.jsx` |
| **Homepage** | `frontend/src/pages/Homepage.jsx` |
| **UI Components** | `frontend/src/components/ui/` |
| **CMS Components** | `frontend/src/components/front-cms-editor/` |
| **API Services** | `frontend/src/services/` |
| **Routes** | `frontend/src/routes/routeRegistry.js` |

### Database Files

| What You Need | Where to Look |
|--------------|---------------|
| **Migrations** | `database/migrations/` |
| **Seed Data** | `database/01_seed_data.sql` |
| **Table Scripts** | `database/scripts/create_tables/` |
| **Function Scripts** | `database/scripts/create_functions/` |

---

## 🔧 Common Tasks

### Adding a New API Endpoint

1. **Create Controller**: `backend/src/controllers/[feature].controller.js`
2. **Create Route**: `backend/src/routes/[feature].routes.js`
3. **Register Route**: Add to `backend/src/routes/routes.index.js`
4. **Add Service** (if needed): `backend/src/services/[feature]Service.js`

### Adding a New Frontend Page

1. **Create Page**: `frontend/src/pages/[role]/[feature]/[Page].jsx`
2. **Add Route**: Update `frontend/src/routes/routeRegistry.js`
3. **Add Service** (if needed): `frontend/src/services/[feature]Service.js`
4. **Add to Sidebar** (if needed): Update `frontend/src/config/sidebarConfig.js`

### Debugging Issues

1. **Check Backend Logs**: `backend/backend.log` or `backend/server_startup.log`
2. **Check Frontend Logs**: Browser console
3. **Run Debug Scripts**: `backend/scripts/debug/`
4. **Check Database**: Use Supabase dashboard or debug scripts

### Running Migrations

1. **Check Migration Files**: `database/migrations/`
2. **Run in Order**: Execute migrations sequentially
3. **Verify**: Use verification scripts in `backend/scripts/test/`

---

## 📂 Key Folders

### Backend
- `backend/src/controllers/` - All controllers
- `backend/src/routes/` - All routes
- `backend/src/services/` - Business logic
- `backend/src/database/` - Database queries
- `backend/scripts/` - Organized scripts

### Frontend
- `frontend/src/pages/` - All pages
- `frontend/src/components/` - All components
- `frontend/src/services/` - API services
- `frontend/src/utils/` - Utility functions

### Database
- `database/migrations/` - Versioned migrations
- `database/scripts/` - Database utility scripts

---

## 🎯 Feature Locations

### Master Admin Features
- **Pages**: `frontend/src/pages/master-admin/`
- **API**: `backend/src/controllers/admin.controller.js`
- **Routes**: `backend/src/routes/admin.routes.js`

### School Owner Features
- **Pages**: `frontend/src/pages/school-owner/`
- **API**: Various controllers in `backend/src/controllers/`
- **Routes**: Various routes in `backend/src/routes/`

### Student Features
- **Pages**: `frontend/src/pages/student/`
- **API**: `backend/src/controllers/student.controller.js`
- **Routes**: `backend/src/routes/student.routes.js`

### Front CMS
- **Components**: `frontend/src/components/front-cms-editor/`
- **Pages**: `frontend/src/pages/master-admin/front-cms/` and `frontend/src/pages/school-owner/front-cms/`
- **API**: `backend/src/controllers/frontCms.controller.js`
- **Routes**: `backend/src/routes/frontCms.routes.js`

---

## 📝 Naming Conventions

### Backend
- Controllers: `[feature].controller.js`
- Routes: `[feature].routes.js`
- Services: `[feature]Service.js`
- Queries: `[feature].queries.js`

### Frontend
- Pages: `[Feature]Page.jsx` or `[Feature].jsx`
- Components: `[Feature]Component.jsx`
- Services: `[feature]Service.js`
- Hooks: `use[Feature].js`

---

## 🚨 Important Notes

1. **Always check existing structure** before adding new files
2. **Follow naming conventions** for consistency
3. **Update route registries** when adding new routes
4. **Document new features** in appropriate README files
5. **Use organized script folders** for any utility scripts

---

**Need more details?** Check the detailed README files:
- [Frontend README](./frontend/src/README.md)
- [Backend README](./backend/src/README.md)
- [Database README](./database/README.md)
- [Backend Scripts README](./backend/scripts/README.md)

