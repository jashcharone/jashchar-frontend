import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';

// Define persistence helpers locally since they aren't exported by supabase-js v2.86.2
const browserLocalPersistence = {
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
  removeItem: (key) => window.localStorage.removeItem(key),
};

const browserSessionPersistence = {
  getItem: (key) => window.sessionStorage.getItem(key),
  setItem: (key, value) => window.sessionStorage.setItem(key, value),
  removeItem: (key) => window.sessionStorage.removeItem(key),
};

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [school, setSchool] = useState(null);
  const [organizationId, setOrganizationId] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentSessionName, setCurrentSessionName] = useState(null);
  const [sessionList, setSessionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef(null);

  // Optimized Session Handling
  const handleSession = useCallback(async (currentSession) => {
    // If no session, clear everything and stop loading
    if (!currentSession?.user) {
      setUser(null);
      setSession(null);
      setSchool(null);
      userIdRef.current = null;
      setLoading(false);
      return;
    }

    // Only show loading if user ID changes (initial load or user switch)
    if (userIdRef.current !== currentSession.user.id) {
      setLoading(true);
    }
    setSession(currentSession);

    try {
      const currentUser = currentSession.user;
      const userId = currentUser.id;

      // --- PARALLEL FETCHING STRATEGY ---
      // We fetch everything we might need in parallel to avoid "waterfall" delays.
      
      const metaSchoolId = currentUser.user_metadata?.branch_id;
      
      // Validate UUID before querying (prevent zero UUID or invalid UUIDs)
      const isValidSchoolId = metaSchoolId && 
        metaSchoolId !== '00000000-0000-0000-0000-000000000000' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(metaSchoolId);

      // 1. Define Promises
      const profilePromise = Promise.any([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle().then(r => r.data ? { ...r.data, type: 'staff' } : Promise.reject()),
        supabase.from('school_owner_profiles').select('*').eq('id', userId).maybeSingle().then(r => r.data ? { ...r.data, type: 'owner' } : Promise.reject()),
        supabase.from('master_admin_profiles').select('*').eq('id', userId).maybeSingle().then(r => r.data ? { ...r.data, type: 'master_admin' } : Promise.reject()),
        // Include employee_profiles and resolve role_id to role name
        supabase.from('employee_profiles').select('*, role:roles(name)').eq('id', userId).maybeSingle().then(r => {
          if (r.data) {
            const roleName = r.data.role?.name?.toLowerCase() || 'staff';
            return { ...r.data, type: 'employee', role: roleName };
          }
          return Promise.reject();
        })
      ]).catch(() => null);

      // Fetch school if we have valid ID in metadata (fastest path)
      // Use maybeSingle() to gracefully handle missing records instead of throwing PGRST116
      const schoolPromise = isValidSchoolId 
        ? supabase.from('schools').select('*').eq('id', metaSchoolId).maybeSingle()
        : Promise.resolve({ data: null });

      // Fetch settings separately to avoid embedding issues
      const settingsPromise = isValidSchoolId
        ? supabase.from('school_website_settings').select('cms_url_alias').eq('branch_id', metaSchoolId).maybeSingle()
        : Promise.resolve({ data: null });

      // Fetch ALL sessions for this school (Active & Inactive) + Global Sessions
      // If no school ID (Master Admin), fetch only global sessions
      const sessionsPromise = isValidSchoolId
        ? supabase
            .from('sessions')
            .select('*')
            .or(`branch_id.eq.${metaSchoolId},branch_id.is.null`)
            .order('created_at', { ascending: false })
        : supabase
            .from('sessions')
            .select('*')
            .is('branch_id', null)
            .order('created_at', { ascending: false });

      // 2. Await All
      const [profile, schoolRes, sessionsRes, settingsRes] = await Promise.all([
        profilePromise, 
        schoolPromise,
        sessionsPromise,
        settingsPromise
      ]);

      let finalUser = { 
        ...currentUser,
        profile: { ...currentUser.user_metadata } 
      };
      let finalSchool = schoolRes?.data;
      let finalSettings = settingsRes?.data;
      const sessions = sessionsRes?.data || [];

      // 3. Resolve Logic
      if (profile) {
        // Merge profile into user object for easy access
        // Filter out null values from profile to avoid overwriting valid metadata values
        const filteredProfile = Object.fromEntries(
          Object.entries(profile).filter(([_, v]) => v !== null)
        );
        
        // Ensure Organization ID is present in user profile
        let userOrgId = profile.organization_id;
        
        // Determine role - handle master_admin type specially
        let userRole = profile.role || currentUser.user_metadata?.role;
        if (profile.type === 'master_admin') {
          userRole = 'master_admin';
        } else if (profile.type === 'owner' && !userRole) {
          userRole = 'super_admin';
        }
        
        finalUser = {
          ...finalUser,
          profile: { ...finalUser.profile, ...filteredProfile },
          role: userRole,
          // Ensure we have the type (staff/owner)
          userType: profile.type
        };

        if (userOrgId) {
            setOrganizationId(userOrgId);
        } else {
             // Fallback: If not in profile, try to infer from school or fetch explicitly
             // ...
        }

        // If we didn't have branch_id in metadata but found it in profile, fetch school NOW
        // This is the only case where we might need a second hop, but it's rare if metadata is synced.
        // Validate profile branch_id before querying
        const profileSchoolId = profile.branch_id;
        const isValidProfileSchoolId = profileSchoolId && 
          profileSchoolId !== '00000000-0000-0000-0000-000000000000' &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileSchoolId);
          
        if (!finalSchool && isValidProfileSchoolId) {
          const { data } = await supabase.from('schools').select('*').eq('id', profileSchoolId).maybeSingle();
          finalSchool = data;
          
          if (finalSchool) {
             const { data: sData } = await supabase.from('school_website_settings').select('cms_url_alias').eq('branch_id', finalSchool.id).maybeSingle();
             finalSettings = sData;
          }
          
          // Also fetch sessions if we didn't have branchId before
          if (!sessions.length) {
             const { data: lateSessions } = await supabase
                .from('sessions')
                .select('*')
                .or(`branch_id.eq.${profileSchoolId},branch_id.is.null`)
                .order('created_at', { ascending: false });
             if (lateSessions) sessions.push(...lateSessions);
          }
        }

        // ✅ Fallback for School Owners: If branch_id is missing in profile, try finding school by owner_user_id
        if (!finalSchool && profile.type === 'owner') {
           const { data } = await supabase.from('schools').select('*').eq('owner_user_id', userId).maybeSingle();
           if (data) {
             finalSchool = data;
             
             // Infer organization_id from school if not already set
             if (!userOrgId && finalSchool.organization_id) {
                setOrganizationId(finalSchool.organization_id);
             }
             
             const { data: sData } = await supabase.from('school_website_settings').select('cms_url_alias').eq('branch_id', finalSchool.id).maybeSingle();
             finalSettings = sData;
             
             if (!sessions.length) {
                const { data: ownerSessions } = await supabase
                    .from('sessions')
                    .select('*')
                    .or(`branch_id.eq.${data.id},branch_id.is.null`)
                    .order('created_at', { ascending: false });
                if (ownerSessions) sessions.push(...ownerSessions);
             }
           }
        }

        // ✅ NEW: Fallback via branch_users table - Most reliable source
        // If we still don't have a school, check branch_users for any linked school
        if (!finalSchool) {
           console.log('[AuthContext] No school found yet, checking branch_users table...');
           const { data: schoolUserEntry } = await supabase
               .from('branch_users')
               .select('branch_id')
               .eq('user_id', userId)
               .limit(1)
               .maybeSingle();
           
           if (schoolUserEntry?.branch_id) {
               console.log('[AuthContext] Found school via branch_users:', schoolUserEntry.branch_id);
               const { data: schoolData } = await supabase
                   .from('schools')
                   .select('*')
                   .eq('id', schoolUserEntry.branch_id)
                   .maybeSingle();
               
               if (schoolData) {
                   finalSchool = schoolData;
                   
                   const { data: sData } = await supabase
                       .from('school_website_settings')
                       .select('cms_url_alias')
                       .eq('branch_id', finalSchool.id)
                       .maybeSingle();
                   finalSettings = sData;
                   
                   if (!sessions.length) {
                       const { data: lateSessions } = await supabase
                           .from('sessions')
                           .select('*')
                           .or(`branch_id.eq.${finalSchool.id},branch_id.is.null`)
                           .order('created_at', { ascending: false });
                       if (lateSessions) sessions.push(...lateSessions);
                   }
               }
           }
        }
        
        // ✅ Check School Status - Block access if school is inactive (except Master Admin)
        if (finalSchool && finalSchool.status === 'Inactive' && finalUser.role !== 'master_admin') {
          console.warn('[Auth] School is inactive, signing out user');
          await supabase.auth.signOut();
          toast({
            variant: 'destructive',
            title: 'School Account Inactive',
            description: 'This school account has been deactivated. Please contact your administrator.',
            duration: 10000
          });
          setUser(null);
          setSchool(null);
          setLoading(false);
          return;
        }
      }

      // 4. Batch State Updates (Prevents multiple re-renders)
      userIdRef.current = currentSession.user.id;
      
      // Merge settings alias into school slug if available
      if (finalSchool && finalSettings?.cms_url_alias) {
        finalSchool.slug = finalSettings.cms_url_alias;
      }

      setUser(() => finalUser);
      setSchool(finalSchool);
      setSessionList(sessions);

      // ✅ CRITICAL FIX: Save organization_id to localStorage for API interceptor
      if (finalSchool?.organization_id) {
        localStorage.setItem('selectedOrganizationId', finalSchool.organization_id);
        setOrganizationId(finalSchool.organization_id);
      } else {
        localStorage.removeItem('selectedOrganizationId');
        setOrganizationId(null);
      }

      // ✅ CRITICAL FIX FOR SCHOOL OWNERS / SUPER ADMINS
      // Ensure the 'selectedSchoolId' in localStorage helps API calls
      // BUT override it if the user is an owner and the retrieved school is different
      if (finalSchool?.id) {
          const storedSelectedSchool = localStorage.getItem('selectedSchoolId');
          // If no stored school, or if user is owner (force sync), set it
          if (!storedSelectedSchool || (finalUser.role === 'school_owner' || finalUser.role === 'super_admin')) {
             localStorage.setItem('selectedSchoolId', finalSchool.id);
          }
      } else {
          // If no school associated, clear it to avoid stale headers
          localStorage.removeItem('selectedSchoolId');
      }

      // Set current session logic:
      // 1. Check LocalStorage (User preference)
      // 2. Check School's Default Active Session
      // 3. Fallback to first available session
      const storedSessionId = localStorage.getItem('selectedSessionId');
      let activeSessionId = null;

      if (storedSessionId && sessions.some(s => s.id === storedSessionId)) {
          activeSessionId = storedSessionId;
      } else {
          activeSessionId = finalSchool?.current_session_id || sessions?.[0]?.id;
          // Update local storage to match default
          if (activeSessionId) localStorage.setItem('selectedSessionId', activeSessionId);
      }

      if (activeSessionId) {
        setCurrentSessionId(activeSessionId);
        const activeSession = sessions.find(s => s.id === activeSessionId);
        setCurrentSessionName(activeSession?.name || '');
      }

    } catch (error) {
      console.error('Auth Context Critical Error:', error);
      toast({
        title: 'Login Error',
        description: 'Could not load user data. Please refresh.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // Listen for Auth Changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Prevent full reload on token refresh which causes form data loss
      if (event === 'TOKEN_REFRESHED') {
        setSession(session);
        return;
      }
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const signIn = useCallback(async (identifier, password, rememberMe = true) => {
    let email = identifier;
    const isEmail = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

    if (!isEmail(identifier)) {
      try {
        const response = await api.post('/auth/lookup-email', { identifier });
        if (response.data?.email) {
          email = response.data.email;
        } else {
          return { error: { message: "User not found." } };
        }
      } catch (err) {
        return { error: { message: "Error resolving user credentials." } };
      }
    }

    try {
      // Note: setPersistence is deprecated in Supabase v2+
      // Session persistence is handled automatically by Supabase
      // The rememberMe flag can be used for custom UI purposes
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }
    } catch (err) {
      console.warn("Failed to set persistence preference:", err);
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ variant: "destructive", title: "Sign in Failed", description: error.message });
    } else if (data?.session) {
      // Manually update session to ensure immediate UI update
      await handleSession(data.session);
    }
    return { data, error };
  }, [toast, handleSession]);

  const signOut = useCallback(async (redirectPath) => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      // Check if user logged in from demo page
      const isDemo = sessionStorage.getItem('demo_mode') === 'true';
      sessionStorage.removeItem('demo_mode');
      
      localStorage.clear();
      
      // Redirect to demo page if user came from demo, otherwise use provided path or homepage
      let path = '/';
      if (isDemo) {
        path = '/demo';
      } else if (typeof redirectPath === 'string') {
        path = redirectPath;
      }

      navigate(path);
    }
  }, [navigate]);

  const switchSession = useCallback((sessionId) => {
    const selectedSession = sessionList.find(s => s.id === sessionId);
    if (selectedSession) {
      setCurrentSessionId(sessionId);
      setCurrentSessionName(selectedSession.name);
      localStorage.setItem('selectedSessionId', sessionId);
      // Reload to ensure all data is refetched with new header
      window.location.reload();
    }
  }, [sessionList]);

  const value = useMemo(() => ({
    user,
    session,
    school,
    organizationId,
    loading,
    currentSessionId,
    currentSessionName,
    sessionList,
    setCurrentSessionId,
    switchSession,
    signIn,
    signOut,
    refreshAuth: () => supabase.auth.getSession().then(({ data: { session } }) => handleSession(session)),
    refreshUserContext: () => supabase.auth.getSession().then(({ data: { session } }) => handleSession(session))
  }), [user, session, school, organizationId, loading, currentSessionId, currentSessionName, sessionList, handleSession, signIn, signOut, switchSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useSupabaseAuth = useAuth;
