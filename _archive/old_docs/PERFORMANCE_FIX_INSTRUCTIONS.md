# Performance Fix Instructions

## ⚠️ CRITICAL STEP: Database Updates
The code changes have been applied, but the database needs indexes and function updates to be fast.
Since I cannot access your production database directly, you must run these scripts manually.

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard.
2. Navigate to the **SQL Editor** tab.
3. Click **New Query**.

### Step 2: Run Optimization Script
Copy the content of `OPTIMIZE_DATABASE.sql` (found in your project root) and paste it into the SQL Editor.
**Click RUN.**

### Step 3: Run Dashboard Fix
Copy the content of `FIX_DASHBOARD_RPC_V2.sql` (found in your project root) and paste it into the SQL Editor.
**Click RUN.**

---

## Verification
After running the scripts:
1. Restart your backend server:
   ```bash
   cd backend
   npm restart
   ```
2. Check the Dashboard load time. It should be significantly faster.
3. Check the Student List API response time.

## Troubleshooting
- If you see "relation does not exist" errors, ensure your table names match (e.g., `student_profiles` vs `students`). The scripts use the standard names found in your codebase.
