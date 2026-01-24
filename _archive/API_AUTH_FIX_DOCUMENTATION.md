# API Authentication Fix - Documentation

## Problem Analysis

### Root Cause
The error `"No authorization token provided"` occurred because the `AddSubscriptionPlan.jsx` component was making a raw `fetch` request to the backend API without including the required `Authorization` header containing the user's JWT token.

### Error Location
- **Component**: `src/pages/master-admin/subscriptions/AddSubscriptionPlan.jsx`
- **Line**: 87 (inside `handleSubmit`)
- **Issue**: Missing `Authorization: Bearer <token>` header in fetch request

## Solution Implemented

### 1. Created Centralized API Client (`src/lib/apiClient.js`)

A new utility module that automatically:
- Retrieves the current user session from Supabase
- Attaches the `Authorization` header to all requests
- Provides convenient methods: `get()`, `post()`, `put()`, `patch()`, `delete()`
- Handles errors consistently

**Key Features:**
```javascript
import apiClient from '@/lib/apiClient';

// Automatically includes auth token
const data = await apiClient.post('/subscriptions/plans', payload);
```

### 2. Updated AddSubscriptionPlan.jsx

**Before:**
```javascript
const response = await fetch('/api/subscriptions/plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dataToSubmit)
});
```

**After:**
```javascript
import apiClient from '@/lib/apiClient';
// ...
const data = await apiClient.post('/subscriptions/plans', dataToSubmit);
```

## Other Components That Need Fixing

The following components also use raw `fetch` and should be updated to use `apiClient`:

1. `src/pages/ParentDashboard.jsx` (line 21)
2. `src/pages/master-admin/AddNewSchool.jsx` (line 342)
3. `src/pages/ForgotPassword.jsx` (lines 37, 70, 99, 127) - **Note:** These are public endpoints, may not need auth
4. `src/pages/master-admin/MasterAdminDashboard.jsx` (line 32)
5. `src/pages/master-admin/system-settings/EmailSettings.jsx` (lines 38, 73)
6. `src/pages/master-admin/subscriptions/SubscriptionInvoices.jsx` (line 25)

## Testing

To verify the fix:
1. Log in as `master_admin`
2. Navigate to `/master-admin/add-subscription-plan`
3. Fill out the form and submit
4. Verify that the request succeeds and includes the `Authorization` header in the Network tab

## Best Practices Going Forward

- **Always use `apiClient`** for authenticated backend requests
- **Never use raw `fetch`** for protected API endpoints
- If a new endpoint is created, verify it requires authentication and use `apiClient`
- For public endpoints (e.g., login, forgot password), raw `fetch` is acceptable

## Related Files
- `frontend/src/lib/apiClient.js` - New API client
- `frontend/src/pages/master-admin/subscriptions/AddSubscriptionPlan.jsx` - Fixed
- `frontend/src/contexts/SupabaseAuthContext.jsx` - Session management
