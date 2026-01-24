# Frontend Source Code Structure

## 📁 Current Structure

```
src/
├── App.jsx                    # Main app component with routing
├── main.jsx                   # Application entry point
│
├── app/                       # App-level configuration
│   ├── routes/               # Route definitions
│   └── providers/            # Context providers
│
├── core/                      # Core functionality
│   ├── auth/                 # Authentication
│   │   └── SupabaseAuthContext.jsx
│   ├── config/               # Configuration
│   │   ├── defaultCmsContent.js
│   │   ├── modules.js
│   │   ├── sidebarConfig.js
│   │   └── stagingConfig.js
│   ├── constants/            # Constants
│   │   ├── academicsModule.js
│   │   └── masterAdminConstants.js
│   └── lib/                  # Core libraries
│       └── customSupabaseClient.js
│
├── features/                  # Feature-based modules (conceptual)
│   │
│   ├── master-admin/         # Master Admin Features
│   │   ├── pages/           # All master-admin pages
│   │   │   ├── MasterAdminDashboard.jsx
│   │   │   ├── SchoolRequests.jsx
│   │   │   ├── SchoolsPage.jsx
│   │   │   ├── AddNewSchool.jsx
│   │   │   ├── EditSchool.jsx
│   │   │   ├── front-cms/
│   │   │   ├── branch-management/
│   │   │   ├── subscriptions/
│   │   │   ├── system-settings/
│   │   │   └── ...
│   │   └── components/       # Master admin specific components
│   │
│   ├── school-owner/         # School Owner Features
│   │   ├── pages/           # All school-owner pages
│   │   │   ├── SchoolOwnerDashboard.jsx
│   │   │   ├── academics/
│   │   │   ├── attendance/
│   │   │   ├── examinations/
│   │   │   ├── fees-collection/
│   │   │   ├── front-cms/
│   │   │   ├── library/
│   │   │   ├── student-information/
│   │   │   ├── transport/
│   │   │   └── ...
│   │   └── components/       # School owner specific components
│   │
│   ├── students/             # Student Features
│   │   ├── pages/           # Student pages
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── ExamResult.jsx
│   │   │   ├── ExamSchedule.jsx
│   │   │   ├── StudentPanelFees.jsx
│   │   │   └── ...
│   │   └── components/       # Student specific components
│   │
│   ├── teachers/             # Teacher Features
│   │   ├── pages/           # Teacher pages
│   │   │   └── TeacherDashboard.jsx
│   │   └── components/
│   │
│   ├── parents/              # Parent Features
│   │   ├── pages/           # Parent pages
│   │   │   └── ParentDashboard.jsx
│   │   └── components/
│   │
│   ├── staff/                # Staff Features
│   │   ├── pages/           # Staff pages
│   │   │   ├── StaffDashboard.jsx
│   │   │   ├── AccountantDashboard.jsx
│   │   │   ├── LibrarianDashboard.jsx
│   │   │   └── ...
│   │   └── components/
│   │
│   ├── public/               # Public Pages
│   │   ├── pages/           # Public pages
│   │   │   ├── Homepage.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── RegisterSchool.jsx
│   │   │   ├── SchoolHomepage.jsx
│   │   │   ├── OnlineAdmission.jsx
│   │   │   └── ...
│   │   └── components/       # Public components
│   │       └── homepage/    # Homepage sections
│   │
│   ├── academics/             # Academics Module
│   │   ├── components/      # Academics components
│   │   └── pages/          # Academics pages (in school-owner/academics/)
│   │
│   ├── admissions/            # Admissions Module
│   │   └── pages/           # OnlineAdmission.jsx
│   │
│   ├── attendance/           # Attendance Module
│   │   ├── components/      # Attendance components
│   │   └── pages/          # Attendance pages (in school-owner/attendance/)
│   │
│   ├── examinations/         # Examinations Module
│   │   ├── components/      # Examination components
│   │   └── pages/          # Examination pages (in school-owner/examinations/)
│   │
│   ├── fees/                 # Fees Module
│   │   ├── components/      # Fees components
│   │   └── pages/          # Fees pages (in school-owner/fees-collection/)
│   │
│   ├── library/              # Library Module
│   │   ├── components/      # Library components
│   │   └── pages/          # Library pages (in school-owner/library/)
│   │
│   ├── transport/            # Transport Module
│   │   ├── components/      # Transport components
│   │   └── pages/          # Transport pages (in school-owner/transport/)
│   │
│   ├── cms/                  # Front CMS Module
│   │   ├── components/      # CMS components
│   │   │   ├── front-cms/   # CMS components
│   │   │   └── front-cms-editor/  # CMS editor components
│   │   └── pages/          # CMS pages (in master-admin/front-cms/ and school-owner/front-cms/)
│   │
│   ├── multi-branch/         # Multi-Branch Module
│   │   ├── components/      # Multi-branch components
│   │   └── pages/          # Multi-branch pages (in school-owner/multi-branch/)
│   │
│   └── online-courses/       # Online Courses Module
│       ├── components/      # Online course components
│       └── pages/          # Online course pages (in school-owner/online-course/)
│
├── shared/                    # Shared across features
│   ├── components/           # Shared components
│   │   ├── ui/              # UI component library (shadcn/ui)
│   │   ├── DashboardLayout.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── PermissionGate.jsx
│   │   └── ...
│   ├── hooks/                # Shared hooks
│   │   └── [11 custom hooks]
│   ├── utils/                # Shared utilities
│   │   └── [50 utility files]
│   └── services/             # Shared services
│       └── [31 service files]
│
├── pages/                     # All pages (current location)
│   ├── master-admin/         # Master admin pages
│   ├── school-owner/         # School owner pages
│   ├── student/             # Student pages
│   ├── public/              # Public pages
│   └── [role]Dashboard.jsx  # Dashboard pages
│
├── components/                # All components (current location)
│   ├── ui/                  # UI components
│   ├── homepage/            # Homepage components
│   ├── front-cms/           # CMS components
│   ├── front-cms-editor/    # CMS editor components
│   └── [feature]/           # Feature-specific components
│
├── contexts/                  # React contexts
│   ├── SupabaseAuthContext.jsx
│   └── [other contexts]
│
├── hooks/                     # Custom hooks
│   └── [11 hooks]
│
├── services/                 # API services
│   └── [31 services]
│
├── utils/                     # Utility functions
│   └── [50 utilities]
│
└── routes/                    # Route definitions
    └── routeRegistry.js
```

## 🗺️ Feature Mapping

### Master Admin Features
- **Location**: `pages/master-admin/`
- **Key Pages**:
  - `MasterAdminDashboard.jsx` - Main dashboard
  - `SchoolRequests.jsx` - School approval requests
  - `SchoolsPage.jsx` - All schools list
  - `AddNewSchool.jsx` - Add new school
  - `EditSchool.jsx` - Edit school
  - `front-cms/` - Front CMS management
  - `branch-management/` - Branch management
  - `subscriptions/` - Subscription management
  - `system-settings/` - System settings

### School Owner Features
- **Location**: `pages/school-owner/`
- **Key Modules**:
  - `academics/` - Academics management
  - `attendance/` - Attendance tracking
  - `examinations/` - Examination management
  - `fees-collection/` - Fees management
  - `front-cms/` - School website CMS
  - `library/` - Library management
  - `student-information/` - Student management
  - `transport/` - Transport management
  - `multi-branch/` - Multi-branch management

### Student Features
- **Location**: `pages/student/`
- **Key Pages**:
  - `StudentDashboard.jsx` - Student dashboard
  - `ExamResult.jsx` - Exam results
  - `ExamSchedule.jsx` - Exam schedule
  - `StudentPanelFees.jsx` - Fee details

### Public Features
- **Location**: `pages/public/`
- **Key Pages**:
  - `Homepage.jsx` - Main landing page
  - `Login.jsx` - Login page
  - `RegisterSchool.jsx` - School registration
  - `SchoolHomepage.jsx` - School public homepage

## 🔍 Finding Files

### Need to work on Master Admin?
→ Check `pages/master-admin/`

### Need to work on School Owner features?
→ Check `pages/school-owner/`

### Need to work on a specific module (e.g., Fees)?
→ Check `pages/school-owner/fees-collection/` or `components/fees/`

### Need to add a new feature?
1. Create page in appropriate `pages/[role]/[feature]/`
2. Create components in `components/[feature]/`
3. Add route to `routes/routeRegistry.js`
4. Add service in `services/` if needed

## 📝 Naming Conventions

- **Pages**: `[Feature]Page.jsx` or `[Feature].jsx` (e.g., `SchoolOwnerDashboard.jsx`)
- **Components**: `[Feature]Component.jsx` (e.g., `FeesCollectionForm.jsx`)
- **Services**: `[feature]Service.js` (e.g., `feesService.js`)
- **Hooks**: `use[Feature].js` (e.g., `useFees.js`)
- **Utils**: `[feature]Utils.js` (e.g., `feesUtils.js`)

## 🚀 Adding a New Feature

1. **Create Page**: `pages/[role]/[feature]/[Feature]Page.jsx`
2. **Create Components**: `components/[feature]/[Component].jsx`
3. **Create Service** (if needed): `services/[feature]Service.js`
4. **Add Route**: Update `routes/routeRegistry.js`
5. **Add to Sidebar**: Update `config/sidebarConfig.js` if needed

## 📦 Component Organization

### UI Components (`components/ui/`)
- Reusable UI components from shadcn/ui
- Button, Input, Select, Dialog, etc.

### Feature Components (`components/[feature]/`)
- Feature-specific components
- Organized by feature name

### Shared Components (`components/`)
- `DashboardLayout.jsx` - Main layout
- `Sidebar.jsx` - Navigation sidebar
- `Header.jsx` - Page header
- `ProtectedRoute.jsx` - Route protection
- `PermissionGate.jsx` - Permission checking

