# Master Admin Workflow & System Logic (Pin-to-Pin Guide)

This document serves as the **comprehensive manual** for the Master Admin of the Jashchar ERP SaaS system. It details every module, workflow, and system logic available to the super-user who manages the entire platform.

---

## 1. Access & Dashboard
**Role:** `master_admin`
**Login URL:** `/login` (or `/master-admin/login` if configured)

### 1.1. Login Process
1.  Enter Master Admin credentials (e.g., `admin@jashchar.com`).
2.  System validates credentials against `public.users`.
3.  System checks `user_roles` for `master_admin` role.
4.  **Redirect:** Upon success, redirected to `/master-admin/dashboard`.

### 1.2. Dashboard Overview
**Location:** `Master Admin Dashboard`
*   **Key Metrics:**
    *   Total Schools (Active vs Inactive).
    *   Total Revenue (Monthly/Yearly).
    *   Pending School Requests.
    *   System Health Status.
*   **Charts:**
    *   Registration Trends (New schools per month).
    *   Subscription Revenue Graph.

---

## 2. School Management (Core Workflow)

### 2.1. School Requests (New Registrations)
**Location:** `School Requests`
**Workflow:**
1.  **Public Registration:** A user fills the form at `/register-school`.
2.  **Pending State:** A record is created in `school_requests` table. User is created in Auth but has `guest` role.
3.  **Admin Review:**
    *   Navigate to **School Requests**.
    *   View details: School Name, Owner Name, Email, Mobile, Requested Slug.
4.  **Action: Approve:**
    *   Click **Approve**.
    *   **System Logic:**
        *   Creates new `schools` record.
        *   Links Owner ID to School.
        *   Updates User Role to `school_owner`.
        *   Creates `school_owner_profile`.
        *   Sends "Welcome/Approval" email (if configured).
5.  **Action: Reject:**
    *   Click **Reject**.
    *   Deletes request and optionally the user account.

### 2.2. Managing Active Schools
**Location:** `Schools`
*   **List View:** See all registered schools with status (Active/Inactive), Plan, and Expiry Date.
*   **Actions:**
    *   **Login as School:** "God Mode" access to enter any school's dashboard to debug/assist.
    *   **Edit Details:** Change School Name, Address, Contact Info.
    *   **Deactivate:** Temporarily suspend a school (users cannot log in).
    *   **Delete:** Permanently remove school data (Use with caution).

### 2.3. School Diagnostics
**Location:** `System Settings` -> `School Diagnostics`
*   **Purpose:** Fix data inconsistencies for a specific school.
*   **Tools:**
    *   Check RLS Policies.
    *   Verify Owner Role.
    *   Fix Missing Profiles.

---

## 3. Subscription & Billing System

### 3.1. Creating Subscription Plans
**Location:** `Subscriptions` -> `Plans`
1.  Click **Add New Plan**.
2.  **Details:**
    *   **Name:** e.g., "Gold Plan", "Starter".
    *   **Price:** Monthly/Yearly cost.
    *   **Duration:** Days (365 for yearly).
    *   **Trial Days:** Optional free period.
3.  **Module Selection:**
    *   Check the boxes for modules included (e.g., Academics, Fees, Transport).
    *   *Crucial:* Only checked modules will appear in the School Owner's sidebar.
4.  **Save:** Plan becomes available for assignment.

### 3.2. Assigning Plans to Schools
**Location:** `Schools` -> `Assign Plan` (or via `Subscriptions` list)
1.  Select School.
2.  Select Plan (e.g., "Gold Plan").
3.  **System Logic:**
    *   Updates `schools.plan_id`.
    *   Sets `subscription_start_date` and `subscription_end_date`.
    *   Populates `school_modules` based on the plan.

### 3.3. Invoices & Transactions
**Location:** `Subscriptions` -> `Invoices` / `Transactions`
*   **Invoices:** Generated when a plan is assigned or renewed. Can be downloaded as PDF.
*   **Transactions:** Logs of payments (Razorpay/Stripe).
*   **Manual Entry:** Admin can manually record an offline payment (Cash/Cheque) to activate a plan.

---

## 4. System Settings & Configuration

### 4.1. Role & Permission Management
**Location:** `System Settings` -> `Role Permission`
*   **Global Roles:** Define permissions for standard roles (Teacher, Accountant, Librarian).
*   **Logic:** These serve as templates. When a school is created, they inherit these (or use them directly depending on architecture).
*   **Edit Permissions:** Toggle `can_view`, `can_add`, `can_edit`, `can_delete` for each module.

### 4.2. Custom Domains
**Location:** `System Settings` -> `Custom Domain`
*   **Workflow:**
    1.  School Owner requests a domain (e.g., `school.com` instead of `app.jashchar.com/school`).
    2.  Master Admin views request.
    3.  **Configuration:** Admin updates DNS mapping in the hosting provider (Hostinger/Vercel).
    4.  **Approval:** Admin marks domain as "Active" in the system.

### 4.3. Payment Settings
**Location:** `System Settings` -> `Payment Settings`
*   **Gateways:** Configure API Keys for Razorpay, Stripe, PayPal.
*   **Context:** These keys are used for *SaaS Subscription payments* (School paying Jashchar), NOT for school fee collection (Schools set their own keys).

### 4.4. Communication Settings
**Location:** `System Settings` -> `Communication Settings`
*   **Email:** Configure SMTP (SendGrid, AWS SES, Gmail).
*   **SMS:** Configure SMS Gateway (Twilio, MSG91).
*   **Templates:** Edit "Welcome Email", "Password Reset", "Invoice" templates.

---

## 5. Frontend CMS (SaaS Website)
**Location:** `Frontend CMS`
*   **SaaS Website:** Manage the landing page (`www.jashchar.com`).
    *   Edit Hero Section, Features, Pricing Table, Testimonials.
*   **School Website Master:** Define templates available for schools to use for their own public websites.

---

## 6. Technical Maintenance & Health

### 6.1. Module Health
**Location:** `System Settings` -> `Module Health`
*   **Status:** Shows if all system modules are loaded and active.
*   **Version:** Displays current API version and Frontend build version.

### 6.2. Queries Finder
**Location:** `System Settings` -> `Queries Finder`
*   **Purpose:** Advanced tool to run read-only SQL queries or check specific database states without accessing the database console directly.

### 6.3. Enterprise Health Monitor
**Location:** `System Settings` -> `Enterprise Health`
*   **Metrics:** CPU Usage, Memory, Database Connections, API Latency.

---

## 7. Troubleshooting Common Issues

### 7.1. "User Cannot Login"
*   **Check:** Is the School Active? (Go to `Schools`).
*   **Check:** Is the Plan Expired? (Go to `Schools` -> `Subscription`).
*   **Check:** Does the user have a Role? (Go to `Users` or use `check_user_role.js`).

### 7.2. "Module Not Visible in Sidebar"
*   **Check:** Does the assigned Subscription Plan include this module?
*   **Check:** Does the User's Role have `can_view` permission for this module?
*   **Action:** Update Plan or Role Permissions.

### 7.3. "Permission Denied" API Error
*   **Cause:** RLS Policy failure or Middleware check failure.
*   **Fix:** Run `debug_rls_check.js` in backend to diagnose. Ensure `school_id` is passed in headers.

---

## 8. Deployment & Updates
*   **Frontend:** React/Vite. Build using `npm run build`. Output in `dist/`.
*   **Backend:** Node.js/Express. Start using `npm start`.
*   **Database:** PostgreSQL (Supabase). Managed via Migrations in `database/` folder.

---
*This document is the "Bible" for the Master Admin operations. Keep it updated as new features are added.*
