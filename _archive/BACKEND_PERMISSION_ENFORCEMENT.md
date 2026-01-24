# Backend Permission Enforcement - Implementation Summary

## Overview
This document summarizes the backend permission enforcement fix that ensures all API requests are checked against the `role_permissions` table.

## Problem Statement
- Master Admin assigns View/Add/Edit/Delete permissions via the UI
- School Owner was bypassing these permissions - even when View was OFF, modules were visible
- Need strict backend enforcement where `role_permissions` is the FINAL source of truth

## Solution Architecture

### 1. Unified Permission Middleware
**File**: `backend/src/middlewares/unifiedPermissionMiddleware.js`

**Key Functions**:
- `requireAuth` - Verifies user is authenticated via Supabase token
- `checkPermission(moduleSlug, action)` - Checks permission against role_permissions table
- `getUserRoleForSchool(userId, schoolId)` - Gets user's role from school_users table
- `getRolePermissions(roleName, schoolId)` - Fetches all permissions for a role
- `hasPermission(roleName, schoolId, moduleSlug, action)` - Checks specific permission
- `getAllowedModules` - Returns modules where user has can_view=true
- `clearPermissionCache()` - Clears permission cache when permissions change

**Permission Caching**:
- Permissions are cached for 5 minutes to reduce database queries
- Cache key format: `perms:{schoolId}:{roleName}`

### 2. Permission Lookup Flow
```
1. Request arrives at protected route
2. requireAuth verifies the Supabase token
3. checkPermission middleware:
   a. Gets school_id from headers/body/query
   b. Gets user's role from school_users table
   c. Fetches permissions from role_permissions (by school_id + role_name)
   d. Checks if module_slug has required permission (can_view/add/edit/delete)
   e. Returns 403 if permission denied
```

### 3. Database Schema (role_permissions table)
```sql
role_permissions:
  - id: uuid
  - school_id: uuid (FK to schools)
  - role_name: text (e.g., "School Owner", "Admin")
  - module_slug: text (e.g., "academics", "academics.class")
  - can_view: boolean
  - can_add: boolean
  - can_edit: boolean
  - can_delete: boolean
  - role_id: uuid (optional FK)
  - module_id: uuid (optional FK)
```

### 4. Protected Routes

| Route File | Module | Protection |
|------------|--------|------------|
| `academics.routes.js` | academics | checkPermission('academics', action) |
| `student.routes.js` | students | checkPermission('students', action) |
| `fees.routes.js` | fees | checkPermission('fees', action) |
| `staff.routes.js` | staff | checkPermission('staff', action) |
| `dashboard.routes.js` | - | requireAuth only |
| `school.routes.js` | - | requireAuth + /my-modules endpoint |
| `subscription.routes.js` | - | requireAuth for admin operations |
| `email.routes.js` | - | requireAuth |
| `saasBilling.routes.js` | - | Master Admin only |
| `settingsRoutes.js` | - | Master Admin only |

### 5. How Permission Check Works

**Example: POST /api/students (add student)**
```javascript
// In student.routes.js
router.post('/', checkPermission('students', 'add'), studentController.addStudent);

// checkPermission middleware:
1. Verify user is authenticated
2. Get school_id from request
3. Get user's role_name from school_users table
4. Query: SELECT * FROM role_permissions WHERE school_id=X AND role_name='School Owner' AND module_slug='students'
5. Check if can_add = true
6. If false, return 403: "You don't have permission to add in students"
7. If true, proceed to controller
```

### 6. Module Slug Format
- Parent modules: `academics`, `students`, `fees`, `staff`
- Sub-modules: `academics.class`, `academics.sections`, `fees.fee_collection`
- Permission lookup falls back to parent if sub-module not found

### 7. Master Admin Bypass
Master Admin role is detected via:
- `user_metadata.role === 'master_admin'`
- `user_metadata.is_master_admin === true`

When detected, all permission checks are bypassed.

### 8. API Response Format

**Permission Denied (403)**:
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to add in students",
  "details": {
    "role": "School Owner",
    "module": "students",
    "action": "add",
    "required": "can_add = true"
  }
}
```

**Not Authenticated (401)**:
```json
{
  "error": "Unauthorized",
  "message": "No authorization token provided"
}
```

## Testing

### Debug Scripts
- `backend/debug_permission_system.js` - Shows current permission state
- `backend/test_permission_enforcement.js` - Tests permission logic
- `backend/seed_role_permissions.js` - Seeds initial permissions

### Verification Steps
1. Run `node backend/debug_permission_system.js` to see role/permission mappings
2. Run `node backend/test_permission_enforcement.js` to verify permission checks
3. Test API endpoints with School Owner token
4. Verify 403 response when permission is denied

## Notes for Master Admin

### Setting Permissions
1. Go to Master Admin → Role Permissions
2. Select a school and role
3. Toggle View/Add/Edit/Delete for each module
4. Permissions take effect immediately (cache expires in 5 minutes)

### Permission Hierarchy
- If a sub-module (e.g., `academics.class`) has no explicit permission, the parent module (`academics`) permission is used
- If parent has `can_view=true` but sub-module has no entry, user can view the sub-module

## Files Changed
1. `backend/src/middlewares/unifiedPermissionMiddleware.js` - NEW
2. `backend/src/routes/academics.routes.js` - Updated
3. `backend/src/routes/student.routes.js` - Updated  
4. `backend/src/routes/fees.routes.js` - Updated
5. `backend/src/routes/staff.routes.js` - Updated
6. `backend/src/routes/dashboard.routes.js` - Updated
7. `backend/src/routes/school.routes.js` - Updated
8. `backend/src/routes/subscription.routes.js` - Updated
9. `backend/src/routes/email.routes.js` - Updated
10. `backend/debug_permission_system.js` - NEW
11. `backend/test_permission_enforcement.js` - NEW
12. `backend/seed_role_permissions.js` - NEW
