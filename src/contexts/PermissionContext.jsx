import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/supabaseClient'; // SAFE IMPORT
import { useLoginSafetyCheck } from '@/hooks/useLoginSafetyCheck';
import { fetchUserProfileWithFallback } from '@/utils/profileFetchWrapper';
import { safeFetch } from '@/utils/safeFetchWrapper';
import { useRecovery } from '@/contexts/RecoveryContext';
import { isSupabaseReady } from '@/lib/supabaseClientSafe';

const PermissionContext = createContext(null);

export const PermissionProvider = ({ children }) => {
  const { user, school } = useAuth(); // Fix: Destructure school, not branchId
  const { isReadOnly } = useRecovery();
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [detectedRole, setDetectedRole] = useState(null); // ? Store detected role for sidebar
  
  // ✅ FIX: Track if permissions already loaded for this user/school combo
  const loadedForRef = useRef({ userId: null, schoolId: null, role: null });

  // SAFETY: Run auto-repair logic on login
  useLoginSafetyCheck();
  
  // ✅ FIX: Extract primitive values for dependency array
  const userId = user?.id;
  const schoolId = school?.id;
  const userRole = user?.user_metadata?.role;
  const userBranchId = user?.user_metadata?.branch_id;

  useEffect(() => {
    let isMounted = true;
    
    // Initial branch_id from school or user metadata
    let branchId = school?.id || user?.user_metadata?.branch_id;

    if (!isSupabaseReady()) {
      if (isMounted) {
        setPermissions({});
        setLoading(false);
      }
      return;
    }

    const loadPermissions = async () => {
      if (isReadOnly || !user) {
        if (isMounted) { setPermissions({}); setLoading(false); }
        return;
      }

      // ? CRITICAL FIX: If branch_id is still missing, fetch from branch_users table
      if (!branchId) {
        const { data: branchUserData } = await supabase
          .from('branch_users')
          .select('branch_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();
        
        if (branchUserData?.branch_id) {
          branchId = branchUserData.branch_id;
        }
      }

      // 1. Determine Role Name
      let roleName = user?.user_metadata?.role;
      
      // If role is generic or missing, try to fetch from profile
      if (!roleName || roleName === 'staff' || roleName === 'user' || roleName === 'authenticated') {
          const { success, profile } = await fetchUserProfileWithFallback(user.id);
          if (success && profile) {
              // Check if role name is already resolved (from branch_users/employee_profiles)
              if (profile.role && typeof profile.role === 'string') {
                  roleName = profile.role;
              }
              // If profile has role_id but no role name, fetch it
              else if (profile.role_id) {
                  const { data: roleData } = await supabase
                      .from('roles')
                      .select('name')
                      .eq('id', profile.role_id)
                      .maybeSingle();
                  if (roleData) roleName = roleData.name;
              }
          }
      }

      // Normalize role name
      const normalizedRole = roleName ? roleName.toLowerCase() : '';
      
      // ? Save detected role for sidebar/dashboard
      if (isMounted && normalizedRole) {
        setDetectedRole(normalizedRole);
      }

      // Master Admin Bypass
      if (normalizedRole === 'master_admin') {
        if (isMounted) { setPermissions({ __MASTER_ADMIN__: true }); setLoading(false); }
        return;
      }

      // ? Parent/Student - Fetch ACTUAL permissions from role_permissions table
      if (normalizedRole === 'parent' || normalizedRole === 'student') {
        try {
          // Use the same RPC as super_admin to fetch permissions
          const queryRoleName = normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1); // 'Parent' or 'Student'
          
          const { data: rolePerms, error: permError } = await supabase
            .rpc('rpc_get_role_permissions_for_school', {
              p_branch_id: branchId,
              p_role_name: queryRoleName
            });

          if (rolePerms && rolePerms.length > 0) {
            // Build permission map from database
            const permMap = { '__ROLE_BASED__': true };
            
            rolePerms.forEach(p => {
              let moduleSlug = p.module_slug;
              
              // Fix duplicate parent prefix if present
              const parts = moduleSlug.split('.');
              if (parts.length >= 3 && parts[0] === parts[1]) {
                moduleSlug = parts[0] + '.' + parts.slice(2).join('.');
              }
              
              permMap[moduleSlug] = {
                can_view: p.can_view,
                can_add: p.can_add,
                can_edit: p.can_edit,
                can_delete: p.can_delete
              };
              
              // Also add base module permission for submodule access
              const baseModule = moduleSlug.split('.')[0];
              if (baseModule !== moduleSlug && !permMap[baseModule]) {
                permMap[baseModule] = {
                  can_view: p.can_view,
                  can_add: false,
                  can_edit: false,
                  can_delete: false
                };
              }
            });

            // Always ensure dashboard access
            permMap['dashboard'] = { can_view: true, can_add: false, can_edit: false, can_delete: false };
            
            if (isMounted) { setPermissions(permMap); setLoading(false); }
            return;
          }
        } catch (err) {
          console.error('PermissionContext: Error loading', normalizedRole, 'permissions:', err);
        }

        // Fallback to basic defaults if no explicit permissions found
        const basicPerms = {
          '__BASIC_USER__': true,
          'dashboard': { can_view: true, can_add: false, can_edit: false, can_delete: false },
          'student_information': { can_view: true, can_add: false, can_edit: false, can_delete: false },
          'fees': { can_view: true, can_add: false, can_edit: false, can_delete: false },
          'fees_collection': { can_view: true, can_add: false, can_edit: false, can_delete: false },
          'finance': { can_view: true, can_add: false, can_edit: false, can_delete: false },
          'human_resource': { can_view: true, can_add: false, can_edit: false, can_delete: false },
          'academics': { can_view: true, can_add: false, can_edit: false, can_delete: false },
          'examinations': { can_view: true, can_add: false, can_edit: false, can_delete: false },
          'attendance': { can_view: true, can_add: false, can_edit: false, can_delete: false },
          'homework': { can_view: true, can_add: false, can_edit: false, can_delete: false },
          'library': { can_view: true, can_add: false, can_edit: false, can_delete: false },
          'transport': { can_view: true, can_add: false, can_edit: false, can_delete: false },
          'hostel': { can_view: true, can_add: false, can_edit: false, can_delete: false },
          'communicate': { can_view: true, can_add: false, can_edit: false, can_delete: false },
        };
        if (isMounted) { setPermissions(basicPerms); setLoading(false); }
        return;
      }

      // Super Admin (formerly School Owner) - Fetch modules from their subscription plan
      if (normalizedRole === 'super admin' || normalizedRole === 'super_admin' || normalizedRole === 'school_owner') {
        try {
          // Get branch_id from user metadata or profile
          let ownerSchoolId = branchId || user?.user_metadata?.branch_id;
          
          // If still no branch_id, try to fetch from profiles table
          if (!ownerSchoolId) {
            // Try school_owner_profiles first (using user_id)
            let { data: ownerProfile } = await supabase
                .from('school_owner_profiles')
                .select('branch_id')
                .eq('user_id', user.id)
                .maybeSingle();
            
            if (!ownerProfile) {
                 // Try profiles (staff) using user_id
                 const { data: staffProfile } = await supabase
                    .from('profiles')
                    .select('branch_id')
                    .eq('user_id', user.id)
                    .maybeSingle();
                 ownerProfile = staffProfile;
            }
            
            ownerSchoolId = ownerProfile?.branch_id;
          }

          if (!ownerSchoolId) {
            console.warn("School Owner has no branch_id - Restricting access.");
            if (isMounted) { setPermissions({}); setLoading(false); }
            return;
          }

          // 1. Fetch subscription with plan modules (The "Possible" Modules)
          // Updated to fetch from plan_modules table as well
          let { data: subData, error: subError } = await supabase
            .from('school_subscriptions')
            .select(`
                plan_id, 
                status, 
                plan:subscription_plans(
                    id, 
                    name, 
                    modules,
                    plan_modules(
                        module_key,
                        module:modules(slug)
                    )
                )
            `)
            .eq('branch_id', ownerSchoolId)
            .in('status', ['active', 'trialing'])
            .order('created_at', { ascending: false }) // Get latest
            .limit(1)
            .maybeSingle();

          // FALLBACK: If no subscription found, check schools table directly
          if (!subData) {
             const { data: schoolData } = await supabase
                .from('schools')
                .select(`
                    plan_id,
                    plan:subscription_plans!plan_id(
                        id, 
                        name, 
                        modules,
                        plan_modules(
                            module_key,
                            module:modules(slug)
                        )
                    )
                `)
                .eq('id', ownerSchoolId)
                .single();
             
             if (schoolData && schoolData.plan) {
                 subData = {
                     plan: schoolData.plan,
                     status: 'active' // Assume active if directly assigned
                 };
                 subError = null;
             }
          }

          if (subError || !subData || !subData.plan) {
            console.warn("No active subscription found - Restricting access.");
            if (isMounted) { setPermissions({}); setLoading(false); }
            return;
          }

          // Extract modules from either JSON column (legacy) or plan_modules table (new)
          let planModuleSlugs = subData.plan.modules || [];
          
          if (subData.plan.plan_modules && subData.plan.plan_modules.length > 0) {
              // Check both relational module.slug AND direct module_key
              const relationalSlugs = subData.plan.plan_modules.map(pm => pm.module?.slug || pm.module_key).filter(Boolean);
              if (relationalSlugs.length > 0) {
                  // Merge legacy and relational slugs to prevent data loss from partial migrations
                  planModuleSlugs = [...new Set([...planModuleSlugs, ...relationalSlugs])];
              }
          }
          
          if (planModuleSlugs.length === 0) {
            console.warn("Plan has no modules assigned - Restricting access.");
            if (isMounted) { setPermissions({}); setLoading(false); }
            return;
          }

          // Map DB module names to sidebar slugs
          const DB_TO_SLUG = {
            // Legacy Title Case
            'Academics': 'academics',
            'Student Information': 'student_information',
            'Fees Collection': 'fees_collection',
            'Human Resource': 'human_resource',
            'Examination': 'examinations',
            'Transport': 'transport',
            'Hostel': 'hostel',
            'Library': 'library',
            'Inventory': 'inventory',
            'Communication': 'communicate',
            'Front Office': 'front_office',
            'Download Center': 'download_center',
            'Homework': 'homework',
            'Certificate': 'certificate',
            'Alumni': 'alumni',
            'Reports': 'reports',
            'System Settings': 'system_settings',
            'Front CMS': 'front_cms',
            'Online Course': 'online_course',
            'Gmeet Live Classes': 'gmeet_live_classes',
            'Zoom Live Classes': 'zoom_live',
            'Behaviour Records': 'behaviour_records',
            'Multi Branch': 'multi_branch',
            'Annual Calendar': 'annual_calendar',
            'Student CV': 'student_cv',
            'System Utilities': 'system_utilities',
            
            // New Snake Case (from plan_modules table)
            'academics': 'academics',
            'student_information': 'student_information',
            'fees_collection': 'fees_collection',
            'human_resource': 'human_resource',
            'examination': 'examinations',
            'transport': 'transport',
            'hostel': 'hostel',
            'library': 'library',
            'inventory': 'inventory',
            'communication': 'communicate',
            'front_office': 'front_office',
            'download_center': 'download_center',
            'homework': 'homework',
            'certificate': 'certificate',
            'alumni': 'alumni',
            'reports': 'reports',
            'system_settings': 'system_settings',
            'front_cms': 'front_cms',
            'online_course': 'online_course',
            'gmeet_live_classes': 'gmeet_live_classes',
            'zoom_live': 'zoom_live',
            'behaviour_records': 'behaviour_records',
            'multi_branch': 'multi_branch',
            'annual_calendar': 'annual_calendar',
            'student_cv': 'student_cv',
            'system_utilities': 'system_utilities',
            'Front CMS': 'front_cms'
          };

          // 2. Check for Explicit Permissions in role_permissions table
          // This allows Master Admin to disable specific modules for School Owner
          
          // Normalize role name for query (DB uses 'School Owner'/'Super Admin', metadata uses 'school_owner'/'super_admin')
          // The ROLE_MAP converts snake_case to Title Case to match how RolePermission.jsx saves them
          const ROLE_NAME_MAP = {
            'school_owner': 'School Owner',
            'super_admin': 'Super Admin',
            'super admin': 'Super Admin',
            'organization_owner': 'Super Admin', // Org owners use Super Admin permissions
            'admin': 'Admin',
            'principal': 'Principal',
            'teacher': 'Teacher',
            'accountant': 'Accountant',
            'receptionist': 'Receptionist',
            'librarian': 'Librarian',
            'parent': 'Parent',
            'student': 'Student'
          };
          
          let queryRoleName = ROLE_NAME_MAP[normalizedRole] || roleName;

          // Use SECURITY DEFINER RPC to bypass RLS issues
          const { data: explicitPerms, error: permError } = await supabase
            .rpc('rpc_get_role_permissions_for_school', {
              p_branch_id: ownerSchoolId,
              p_role_name: queryRoleName
            });

          const permMap = { __SCHOOL_OWNER_LIMITED__: true };
          
          // Helper to normalize slug
          // If the plan contains "Academics" (Name), map it. If it contains "academics" (Slug), use it.
          const getSlug = (val) => DB_TO_SLUG[val] || val.toLowerCase().replace(/ /g, '_');

          // Fetch module hierarchy from module_registry (centralized source)
          const { data: allModules } = await supabase
            .from('module_registry')
            .select('id, slug, parent_slug')
            .eq('is_active', true);
            
          const moduleMap = {}; // id -> slug
          const moduleParentMap = {}; // slug -> parentSlug
          const slugToIdMap = {}; // slug -> id
          const childrenMap = {}; // parentSlug -> [child_slugs]
          
          if (allModules) {
              allModules.forEach(m => { 
                  moduleMap[m.id] = m.slug; 
                  slugToIdMap[m.slug] = m.id;
                  if (m.parent_slug) {
                      if (!childrenMap[m.parent_slug]) childrenMap[m.parent_slug] = [];
                      childrenMap[m.parent_slug].push(m.slug);
                      moduleParentMap[m.slug] = m.parent_slug;
                  }
              });
          }

          if (explicitPerms && explicitPerms.length > 0) {
             // CASE A: Explicit Permissions Exist (Master Admin has configured them)
             // We only grant what is in the Plan AND explicitly enabled
             
             // First, create a set of allowed slugs from the Plan
             const planSlugs = new Set(planModuleSlugs.map(m => getSlug(m)));

             explicitPerms.forEach(p => {
                // Normalize slug: RPC sometimes returns 'parent.parent.child' instead of 'parent.child'
                // Fix: Remove duplicate parent prefix (e.g., 'multi_branch.multi_branch.branch_list' -> 'multi_branch.branch_list')
                let moduleSlug = p.module_slug;
                const parts = moduleSlug.split('.');
                if (parts.length >= 3 && parts[0] === parts[1]) {
                    // Duplicate prefix detected, remove it
                    moduleSlug = parts[0] + '.' + parts.slice(2).join('.');
                }
                
                // Check if this permission's module is actually in the plan
                // Handle submodules (e.g. 'academics.class_timetable') -> check 'academics'
                const baseModule = moduleSlug.split('.')[0];
                const parentSlug = moduleParentMap[moduleSlug];
                
                // Special case for front_cms: if parent is in plan, include all children
                // This fixes issues where submodules like 'front_cms.events' were being filtered out
                if ((baseModule === 'front_cms' || moduleSlug.startsWith('front_cms')) && planSlugs.has('front_cms')) {
                    permMap[moduleSlug] = {
                        can_view: p.can_view,
                        can_add: p.can_add,
                        can_edit: p.can_edit,
                        can_delete: p.can_delete
                    };
                    // Also add without prefix if it's a submodule, to support legacy checks
                    if (moduleSlug.includes('.')) {
                        const shortSlug = moduleSlug.split('.')[1];
                        permMap[shortSlug] = {
                            can_view: p.can_view,
                            can_add: p.can_add,
                            can_edit: p.can_edit,
                            can_delete: p.can_delete
                        };
                    }
                    return;
                }

                if (planSlugs.has(moduleSlug) || planSlugs.has(baseModule) || (parentSlug && planSlugs.has(parentSlug))) {
                    permMap[moduleSlug] = {
                        can_view: p.can_view,
                        can_add: p.can_add,
                        can_edit: p.can_edit,
                        can_delete: p.can_delete
                    };
                }
             });

             // Ensure Dashboard is always there (required for login)
             permMap['dashboard'] = { can_view: true, can_add: true, can_edit: true, can_delete: true };
             
             // ⚠️ REMOVED: system_settings should NOT be auto-granted!
             // It must come from explicit role_permissions in database
             // permMap['system_settings'] = { can_view: true, can_add: true, can_edit: true, can_delete: true };

          } else {
             // CASE B: No Explicit Permissions (Default Behavior)
             // Grant ALL permissions for modules in the Plan
             planModuleSlugs.forEach(m => {
                const slug = getSlug(m);
                permMap[slug] = { can_view: true, can_add: true, can_edit: true, can_delete: true };

                // Also grant permission to all child modules (sub-modules)
                // childrenMap is keyed by parent_slug (not UUID), so use slug directly
                if (childrenMap[slug]) {
                    childrenMap[slug].forEach(childSlug => {
                        permMap[childSlug] = { can_view: true, can_add: true, can_edit: true, can_delete: true };
                    });
                }
             });

             // Always allow Dashboard (required for login)
             permMap['dashboard'] = { can_view: true, can_add: true, can_edit: true, can_delete: true };
             
             // ⚠️ REMOVED: system_settings should only be granted if in plan modules
             // permMap['system_settings'] = { can_view: true, can_add: true, can_edit: true, can_delete: true };
          }

          if (isMounted) { setPermissions(permMap); setLoading(false); }
          return;

        } catch (err) {
          console.error("Error loading School Owner permissions:", err);
          if (isMounted) { setPermissions({}); setLoading(false); }
          return;
        }
      }

      try {
        // 2. Fetch School's Subscription Plan (To filter allowed modules)
        let allowedModules = [];
        if (branchId) {
            let { data: subData } = await supabase
                .from('school_subscriptions')
                .select('plan:subscription_plans(modules)')
                .eq('branch_id', branchId)
                .in('status', ['active', 'trialing']) // Allow both active and trialing
                .maybeSingle();

            // FALLBACK: If no subscription found, check schools table directly
            if (!subData) {
                 const { data: schoolData } = await supabase
                    .from('schools')
                    .select('plan:subscription_plans!plan_id(modules)')
                    .eq('id', branchId)
                    .single();
                 
                 if (schoolData && schoolData.plan) {
                     subData = { plan: schoolData.plan };
                 }
            }

            if (subData?.plan?.modules) {
                // FIX: subData.plan.modules is ALREADY an array of slugs (strings), not IDs.
                // We don't need to query the modules table.
                const moduleSlugs = subData.plan.modules;
                
                if (moduleSlugs && Array.isArray(moduleSlugs)) {
                    allowedModules = moduleSlugs;
                }
            }
        }

        // 3. Fetch Permissions using RPC (to bypass RLS)
        let permMap = {};

        // Normalize role name for query
        // Map frontend role names to DB role names if needed
        const ROLE_MAP = {
          'school_owner': 'School Owner',
          'super_admin': 'Super Admin',
          'admin': 'Admin',
          'principal': 'Principal',
          'teacher': 'Teacher',
          'accountant': 'Accountant',
          'receptionist': 'Receptionist',
          'librarian': 'Librarian',
          'parent': 'Parent',
          'student': 'Student'
        };
        
        const queryRoleName = ROLE_MAP[roleName] || roleName;

        if (!branchId) {
            console.warn('DEBUG: Skipping RPC call because branchId is missing. Granting basic permissions.');
            // ? FIX: Set loading to false and grant basic permissions instead of returning empty
            const basicPermMap = {
              '__NO_BRANCH__': true,
              'dashboard': { can_view: true, can_add: false, can_edit: false, can_delete: false },
            };
            if (isMounted) { setPermissions(basicPermMap); setLoading(false); }
            return;
        }

        // Use SECURITY DEFINER RPC to bypass RLS issues
        const { data: permData, error: permError } = await supabase
          .rpc('rpc_get_role_permissions_for_school', {
            p_branch_id: branchId,
            p_role_name: queryRoleName
          });

        if (permError) {
          console.error('RPC error:', permError);
          throw permError;
        }

        if (permData && permData.length > 0) {
            let addedCount = 0;
            permData.forEach(p => {
                // Allow both main modules and submodules
                // Main module: "academics" must be in subscription plan
                // Submodule: "academics.class_timetable" - check base module in plan
                const baseModule = p.module_slug.split('.')[0];
                
                // FIX: Ensure we don't accidentally grant access if can_view is false
                // We must add it to the map regardless of value, so checkAccess can see the explicit 'false'
                if (allowedModules.includes(p.module_slug) || allowedModules.includes(baseModule)) {
                    addedCount++;
                    permMap[p.module_slug] = {
                        can_view: p.can_view,
                        can_add: p.can_add,
                        can_edit: p.can_edit,
                        can_delete: p.can_delete
                    };
                }
            });

            // ✅ Always ensure dashboard + profile access for all staff roles
            if (!permMap['dashboard']) {
                permMap['dashboard'] = { can_view: true, can_add: false, can_edit: false, can_delete: false };
            }
            if (!permMap['my_profile']) {
                permMap['my_profile'] = { can_view: true, can_add: false, can_edit: true, can_delete: false };
            }
        } else if (normalizedRole === 'school_owner' || normalizedRole === 'admin' || normalizedRole === 'organization_owner') {
            // Fallback: School Owner gets ALL permissions for allowed modules if no specific permissions set
            // If allowedModules is empty (e.g. plan fetch failed), we default to ALL modules for safety in dev
            // FIX: 2025-12-28 - Disabled "Grant All" fallback to prevent leaking modules not in plan.
            const modulesToGrant = allowedModules.length > 0 ? allowedModules : []; // Was: Object.values({ ... })

            if (modulesToGrant.length === 0) {
                console.warn("PermissionContext: No allowed modules found for fallback role. Granting nothing.");
                // EMERGENCY FALLBACK: If plan fetch failed, grant basic modules to owner
                // ⚠️ FIX: Removed system_settings from emergency fallback - must be explicitly assigned
                if (normalizedRole === 'organization_owner' || normalizedRole === 'school_owner') {
                    console.warn("PermissionContext: Emergency fallback for owner - granting core modules.");
                    const CORE_MODULES = ['dashboard', 'academics', 'students', 'staff', 'fees', 'transport', 'front_cms'];
                    CORE_MODULES.forEach(slug => {
                        permMap[slug] = { can_view: true, can_add: true, can_edit: true, can_delete: true };
                    });
                }
            }

            modulesToGrant.forEach(slug => {
                permMap[slug] = { can_view: true, can_add: true, can_edit: true, can_delete: true };
            });
        } else if (normalizedRole === 'teacher') {
            const TEACHER_DEFAULTS = {
              'dashboard':           { can_view: true, can_add: false, can_edit: false, can_delete: false },
              'academics':           { can_view: true, can_add: true,  can_edit: true,  can_delete: false },
              'my_timetable':        { can_view: true, can_add: false, can_edit: false, can_delete: false },
              'student_information': { can_view: true, can_add: false, can_edit: false, can_delete: false },
              'students':            { can_view: true, can_add: false, can_edit: false, can_delete: false },
              'attendance':          { can_view: true, can_add: true,  can_edit: true,  can_delete: false },
              'homework':            { can_view: true, can_add: true,  can_edit: true,  can_delete: true  },
              'lesson_plan':         { can_view: true, can_add: true,  can_edit: true,  can_delete: false },
              'lesson_planning_adv': { can_view: true, can_add: true,  can_edit: true,  can_delete: false },
              'examinations':        { can_view: true, can_add: true,  can_edit: true,  can_delete: false },
              'behaviour_records':   { can_view: true, can_add: true,  can_edit: true,  can_delete: false },
              'gmeet_live_classes':  { can_view: true, can_add: true,  can_edit: true,  can_delete: false },
              'live_classes':        { can_view: true, can_add: true,  can_edit: true,  can_delete: false },
              'online_course':       { can_view: true, can_add: true,  can_edit: false, can_delete: false },
              'communicate':         { can_view: true, can_add: false, can_edit: false, can_delete: false },
              'notice_board':        { can_view: true, can_add: false, can_edit: false, can_delete: false },
              'human_resource':      { can_view: true, can_add: true,  can_edit: false, can_delete: false },
              'leave':               { can_view: true, can_add: true,  can_edit: false, can_delete: false },
              'my_profile':          { can_view: true, can_add: false, can_edit: true,  can_delete: false },
            };
            
            Object.entries(TEACHER_DEFAULTS).forEach(([slug, perms]) => {
              // Only grant if module is in the school's subscription plan (or plan info unavailable)
              const isInPlan = allowedModules.length === 0 || 
                allowedModules.some(m => {
                  const normalized = m.toLowerCase().replace(/ /g, '_');
                  return normalized === slug || m === slug;
                });
              if (isInPlan) {
                permMap[slug] = perms;
              }
            });
        }
        
        // ✅ FIX: Mark as loaded for this user/school/role combo
        loadedForRef.current = { userId, schoolId, role: userRole };
        
        if (isMounted) {
          setPermissions(permMap);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load permissions", err);
        if (isMounted) { setPermissions({}); setLoading(false); }
      }
    };
    
    // ✅ FIX: Skip refetch if already loaded for same user/school/role
    if (loadedForRef.current.userId === userId && 
        loadedForRef.current.schoolId === schoolId && 
        loadedForRef.current.role === userRole) {
      return;
    }

    loadPermissions();
    return () => { isMounted = false; };
  }, [userId, userRole, userBranchId, schoolId, isReadOnly]); // ✅ FIX: Use extracted primitive values

  const checkAccess = (moduleSlug, action = 'view') => {
    if (loading) return false;
    if (!permissions) return false;

    // Master Admin Bypass
    if (permissions.__MASTER_ADMIN__) return true;

    // PARANOID CHECK: System Settings
    // If the module is System Settings (or submodule), and the main permission is missing or false, DENY.
    if (moduleSlug === 'system_settings' || moduleSlug.startsWith('system_settings.')) {
        const sysPerm = permissions['system_settings'];
        if (!sysPerm || sysPerm.can_view === false) {
            return false;
        }
    }

    // Check for exact match first (e.g. "academics.class_timetable")
    const exactPerm = permissions[moduleSlug];

    if (exactPerm) {
      if (action === 'view') return exactPerm.can_view;
      if (action === 'add') return exactPerm.can_add;
      if (action === 'edit') return exactPerm.can_edit;
      if (action === 'delete') return exactPerm.can_delete;
    }

    // If no exact match AND it's a submodule (contains dot)
    if (moduleSlug.includes('.')) {
      const parentModule = moduleSlug.split('.')[0];
      
      // Check if parent is explicitly disabled
      const parentPerm = permissions[parentModule];
      if (parentPerm && parentPerm.can_view === false) {
          return false;
      }

      // STRICT MODE: Check if ANY granular permissions exist for this parent
      // If yes, then we are in "granular mode" - don't fallback to parent
      const hasGranularPerms = Object.keys(permissions).some(k => 
        k.startsWith(parentModule + '.') && !k.startsWith('__')
      );
      
      if (hasGranularPerms) {
        // Granular mode: If this specific submodule isn't defined, deny access
        // (Because user explicitly configured some children, so unlisted ones are disabled)
        return false;
      }
      
      // No granular permissions exist - fallback to parent
      // RE-ENABLED: 2025-12-30 - Re-enabled fallback because School Owner permissions 
      // are often granted at the parent level (via Plan), and we need to allow access 
      // to all submodules unless explicitly denied.
      
      if (parentPerm) {
        if (action === 'view') return parentPerm.can_view;
        if (action === 'add') return parentPerm.can_add;
        if (action === 'edit') return parentPerm.can_edit;
        if (action === 'delete') return parentPerm.can_delete;
      }
    }

    // Default to false if not found
    return false;
  };  const value = useMemo(() => ({
    permissions,
    loading,
    detectedRole, // ? Expose detected role for sidebar
    canView: (slug) => checkAccess(slug, 'view'),
    canAdd: (slug) => checkAccess(slug, 'add'),
    canEdit: (slug) => checkAccess(slug, 'edit'),
    canDelete: (slug) => checkAccess(slug, 'delete'),
  }), [permissions, loading, detectedRole]);

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionContext);

