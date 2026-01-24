# 🛡️ Jashchar ERP - Enterprise Security Architecture

This document outlines the "World-Class" security measures implemented in the Jashchar ERP system to protect sensitive school and student data.

## 🔒 Layer 1: Application Security (The Firewall)
Located in: `backend/src/app.js`

We have implemented a military-grade middleware stack to stop hackers before they even reach your logic.

| Protection | Technology | What it does |
|------------|------------|--------------|
| **DDoS Protection** | `express-rate-limit` | Limits repeated requests (100 per 10 mins) to prevent crashing the server. |
| **Anti-XSS** | `xss-clean` | Sanitizes all incoming data. If a hacker tries to send malicious scripts `<script>alert('hack')</script>`, it is neutralized. |
| **Parameter Pollution** | `hpp` | Prevents hackers from confusing the server by sending multiple parameters with the same name. |
| **Secure Headers** | `helmet` | Sets 15+ HTTP headers to prevent Clickjacking, Sniffing, and other browser-based attacks. |
| **Strict CORS** | `cors` | Controls exactly which websites are allowed to talk to your backend. |

## 🔐 Layer 2: Database Security (The Vault)
Located in: `database/ENTERPRISE_SECURITY_SHIELD_v2.sql`

Even if a hacker gets past the firewall, the database protects itself using **Row Level Security (RLS)**.

1.  **Role-Based Access**:
    *   `Master Admin`: Can see everything.
    *   `School Owner`: Can ONLY see data related to their `school_id`.
    *   `Staff/Student`: Can ONLY see their own profile.

2.  **Secure Functions**:
    *   We use `auth.uid()` to identify users, which cannot be faked by the frontend.

## 🚀 How to Activate
1.  **Backend**: The security is already active in your Node.js server.
2.  **Database**: Copy the content of `database/ENTERPRISE_SECURITY_SHIELD_v2.sql` and run it in your Supabase SQL Editor.

---
*Security implemented on: March 12, 2025*
