# JASHCHAR ERP - AI COPILOT INSTRUCTIONS
# ═══════════════════════════════════════════════════════════════════════════════
# ಈ file ಅನ್ನು GitHub Copilot ಪ್ರತಿ session ನಲ್ಲಿ automatically read ಮಾಡುತ್ತದೆ
# ═══════════════════════════════════════════════════════════════════════════════

## 🔒 PROJECT IDENTITY

**Jashchar ERP** - Multi-tenant School & College ERP SaaS Platform
- India-centric, Global-ready
- White-label capable
- Subscription-based
- Role & Permission driven
- **Built to last 100+ years**

---

## 🧠 AI THINKING MODE (MANDATORY)

❌ Ordinary developer ಹಾಗೆ think ಮಾಡಬಾರದು
❌ "Just make it work" mindset ಬಳಸಬಾರದು

✅ System Architect ಹಾಗೆ think ಮಾಡಬೇಕು
✅ SaaS Platform Designer ಹಾಗೆ think ಮಾಡಬೇಕು
✅ 100 years later user ಹೇಗೆ ಬಳಸುತ್ತಾರೆ ಅನ್ನೋದನ್ನು imagine ಮಾಡಿ implement ಮಾಡಬೇಕು

---

## 🏗️ CORE ARCHITECTURE (NON-NEGOTIABLE)

| Level | Entity | Description |
|-------|--------|-------------|
| 1️⃣ | **Organization** | Root - Trust/Group/Owner (Billing, Subscription, Ownership) |
| 2️⃣ | **Branch** | School/College/Campus (Operational Unit) |
| 3️⃣ | **Session** | Academic Year (Time Isolation) |

---

## 🔐 STRICT GLOBAL DATA RULE

### 🚫 NO QUERY OR INSERT IS VALID WITHOUT:
```
✅ organization_id
✅ branch_id
✅ session_id
```

This applies to ALL modules:
- Students, Staff, Fees, Exams, Attendance, Hostel, Transport, Library, etc.

### Code Pattern Required:
```javascript
// Frontend - useAuth destructuring
const { user, currentSessionId, organizationId } = useAuth();
const { selectedBranch } = useBranch();

// Every insert/upsert MUST include:
const payload = {
    ...data,
    branch_id: selectedBranch.id,
    session_id: currentSessionId,
    organization_id: organizationId
};
```

---

## 🚫 FORBIDDEN PRACTICES (ZERO TOLERANCE)

- ❌ Hardcoded IDs
- ❌ Hardcoded role names in logic
- ❌ Manual DB inserts
- ❌ UI-only permission checks
- ❌ Partial fixes
- ❌ Shortcuts "for now"
- ❌ Duplicate `branch_id: branchId, branch_id: branchId` bugs

---

## 📁 FOLDER RULES

### jashchar-backend & jashchar-frontend folders:
- ✅ Production-ready code ONLY
- ❌ NO .env files with real keys
- ❌ NO debug/test/fix/audit scripts
- ❌ NO temporary migration scripts

### For temp/debug scripts:
- Put in `_cleanup/` or `scripts/` at ROOT level
- NEVER in jashchar-backend or jashchar-frontend

---

## ⚙️ IMPLEMENTATION CHECKLIST

Before writing ANY code:
1. ✅ Scan existing codebase first
2. ✅ Understand frontend ↔ backend ↔ DB connection
3. ✅ Check if `organization_id`, `session_id`, `branch_id` are included
4. ✅ Never duplicate logic
5. ✅ Never bypass permissions
6. ✅ Always use API → Service → DB flow

---

## 🧪 BEFORE DECLARING "DONE"

- ✅ Test with multiple roles
- ✅ Test cross-branch isolation
- ✅ Test permission denial scenarios
- ✅ Test reload / session restore
- ✅ Test API failure handling

---

## 🎯 REMEMBER

> "ನೀನು just code fix ಮಾಡುತ್ತಿಲ್ಲ.
> ನೀನು future education systems ನ backbone build ಮಾಡುತ್ತಿದ್ದೀಯ."

**Think deeply. Design carefully. Implement perfectly. Test completely.**

---

📖 Full manifesto: `src/PROJECT_MANIFESTO.md`
