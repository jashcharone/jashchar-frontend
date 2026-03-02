# ═══════════════════════════════════════════════════════════════════════════════
# JASHCHAR ERP - FOLDER AUDIT RULES (ಫೋಲ್ಡರ್ ಆಡಿಟ್ ನಿಯಮಗಳು)
# ═══════════════════════════════════════════════════════════════════════════════
# Last Updated: 2026-01-27
# ═══════════════════════════════════════════════════════════════════════════════

## 🔴 CRITICAL RULES - MUST FOLLOW (ಕಡ್ಡಾಯ ನಿಯಮಗಳು)

### 1. Database Keys Rule (ಡೇಟಾಬೇಸ್ ಕೀ ನಿಯಮ)
```
❌ NEVER put actual database keys in jashchar-backend or jashchar-frontend folders
❌ If .env files exist, they MUST be in .gitignore
❌ NEVER push .env files to Git
✅ Use .env.example files with placeholder values for reference
```

### 2. File Creation Rule (ಫೈಲ್ ಸೃಷ್ಟಿ ನಿಯಮ)
```
✅ ONLY create files that are NEEDED for server to run
✅ Production-ready code only in jashchar-backend and jashchar-frontend
❌ NO debug scripts
❌ NO test scripts (except in dedicated tests/ folder)
❌ NO audit scripts
❌ NO fix scripts
❌ NO temporary migration scripts
```

### 3. Allowed Files in jashchar-backend (ಅನುಮತಿಸಲಾದ ಫೈಲ್‌ಗಳು)
```
✅ src/              - Main source code
✅ package.json      - Dependencies
✅ package-lock.json - Lock file
✅ nodemon.json      - Dev config
✅ Procfile          - Railway deployment
✅ railway.json      - Railway config
✅ README.md         - Documentation
✅ .env.example      - Environment template
✅ .gitignore        - Git ignore rules
```

### 4. Allowed Files in jashchar-frontend (ಅನುಮತಿಸಲಾದ ಫೈಲ್‌ಗಳು)
```
✅ src/              - Main source code
✅ public/           - Static files
✅ index.html        - Entry HTML
✅ package.json      - Dependencies
✅ package-lock.json - Lock file
✅ vite.config.js    - Vite config
✅ tailwind.config.js - Tailwind config
✅ postcss.config.js - PostCSS config
✅ vercel.json       - Vercel deployment
✅ railway.json      - Railway config
✅ README.md         - Documentation
✅ .env.example      - Environment template
✅ .gitignore        - Git ignore rules
✅ .gitattributes    - Git attributes
```

### 5. Folder Structure for Temp/Debug Files
```
If you need to create debug/audit/fix/test scripts:

📁 _cleanup/                    ← Move all unnecessary files here
   ├── backend-scripts/         ← Backend debug/fix scripts
   ├── frontend-scripts/        ← Frontend debug/fix scripts
   ├── sql-migrations/          ← One-time SQL scripts
   └── documentation/           ← Old/unused docs

📁 scripts/                     ← Root level scripts (outside backend/frontend)
   ├── run_foundation_sql.js
   └── other utility scripts

These folders are NOT in jashchar-backend or jashchar-frontend!
```

## 📋 Files to ALWAYS Ignore in Git

### .gitignore must contain:
```gitignore
# Environment files with REAL keys
.env
.env.local
.env.*.local
.env.production
.env.development

# Dependencies
node_modules/

# Debug/utility scripts patterns
add_*.js
fill_*.js
fix_*.js
audit_*.js
check_*.js
test_*.js
verify_*.js
quick_*.js
register_*.js
debug_*.js
setup_*.js
create_*.js
run_*.js
seed_*.js
migrate_*.js

# Script folders
scripts/
tests/
tools/
_archive/
_cleanup/
```

## 🔄 When Creating New Features

### Before Creating Files:
1. ⚠️ Ask: "Is this file NEEDED for server to run?"
2. ⚠️ If NO → Create in `_cleanup/` or `scripts/` at root level
3. ⚠️ If YES → Create in proper location within src/

### File Naming:
- Production files: Use proper names (userController.js, UserPage.jsx)
- Temp/debug files: Use prefix patterns (debug_*, test_*, fix_*)
- SQL one-time: Put in `database/` folder at root, NOT in backend

## 📦 Before Git Push Checklist

```bash
# 1. Check no .env files are staged
git status | grep ".env"

# 2. Check no debug scripts are staged
git diff --cached --name-only | grep -E "(debug_|test_|fix_|audit_)"

# 3. Verify .gitignore is working
git check-ignore -v .env
```

## 🚫 NEVER DO THIS

```
❌ git add .env
❌ Create debug_*.js in jashchar-backend/
❌ Create test_*.js in jashchar-frontend/src/
❌ Put SQL migration files in jashchar-backend/database/
❌ Create _archive folder inside backend or frontend
```

## ✅ ALWAYS DO THIS

```
✅ Use .env.example for documentation
✅ Create utility scripts in root level _cleanup/ or scripts/
✅ Keep backend and frontend folders CLEAN
✅ Run audit before major commits
```

---
## Summary (ಸಾರಾಂಶ)

**jashchar-backend** ಮತ್ತು **jashchar-frontend** ಫೋಲ್ಡರ್‌ಗಳಲ್ಲಿ:
- ✅ Server run ಆಗಲು ಬೇಕಾದ ಫೈಲ್‌ಗಳು ಮಾತ್ರ
- ❌ Database keys ಇರಬಾರದು (or must be in .gitignore)
- ❌ Debug/test/fix scripts ಇರಬಾರದು
- ✅ Clean, production-ready code only
