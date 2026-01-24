import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useLocation } from 'react-router-dom';

const ThemeContext = createContext();

const defaultSettings = {
  theme: 'Luminous Pro', // World Best Light Theme
  mode: 'light',
  radius: 8,
  headerRadius: 24,
  sidebarRadius: 0,
  shadows: true,
  fontFamily: 'Inter',
  colors: {
    primary: '#4f46e5', // Indigo 600 - Modern, Trustworthy SaaS Blue/Purple
    secondary: '#eef2ff', // Indigo 50
    background: '#ffffff', 
    card: '#ffffff',
    foreground: '#0f172a', // Slate 900 - High contrast text
    popover: '#ffffff',
    popoverForeground: '#0f172a',
    muted: '#f1f5f9', // Slate 100
    mutedForeground: '#64748b', // Slate 500
    accent: '#f8fafc', // Slate 50
    accentForeground: '#0f172a',
    border: '#e2e8f0', // Slate 200
    input: '#e2e8f0',
    ring: '#4f46e5',
    destructive: '#ef4444',
    sidebarBackground: '#ffffff',
    sidebarHeader: '#ffffff',
    sidebarForeground: '#0f172a',
    sidebarPrimary: '#4f46e5',
    sidebarPrimaryForeground: '#ffffff',
    sidebarAccent: '#f1f5f9',
    sidebarAccentForeground: '#0f172a',
    sidebarBorder: '#e2e8f0',
    sidebarMutedForeground: '#64748b',
    sidebarLogo: '', 
    sidebarTitle: 'Horizon ERP',
    sidebarSubtitle: 'Dashboard',
    headerBackground: '',
  },
  sidebarLogo: '',
  sidebarTitle: 'Horizon ERP',
  sidebarSubtitle: 'Dashboard',
  scheduling: {
      enabled: false,
      dayTheme: 'Luminous Pro',
      nightTheme: 'Midnight Pro',
      dayStart: '06:00',
      nightStart: '18:00'
  }
};

const defaultDarkMode = {
  theme: 'Midnight Pro', // Improved Dark Mode (20% Better Visibility)
  mode: 'dark',
  radius: 8,
  headerRadius: 24,
  sidebarRadius: 0,
  shadows: true,
  fontFamily: 'Inter',
  colors: {
    primary: '#6366f1', // Indigo 500 - Brighter, pops more on dark
    secondary: '#1e1b4b', // Indigo 950
    background: '#020617', // Slate 950 - Deep rich background
    card: '#0f172a', // Slate 900 - Distinct cards
    foreground: '#f8fafc', // Slate 50 - Pure white text
    popover: '#0f172a',
    popoverForeground: '#f8fafc',
    muted: '#1e293b', // Slate 800
    mutedForeground: '#cbd5e1', // Slate 300 - LIGHTER than before (was Slate 400) for better readability
    accent: '#1e293b',
    accentForeground: '#f8fafc',
    border: '#1e293b', // Slate 800
    input: '#1e293b',
    ring: '#6366f1',
    destructive: '#ef4444',
    sidebarBackground: '#020617',
    sidebarHeader: '#0f172a',
    sidebarForeground: '#cbd5e1', // Lighter text for sidebar too
    sidebarPrimary: '#6366f1',
    sidebarPrimaryForeground: '#ffffff',
    sidebarAccent: '#1e293b',
    sidebarAccentForeground: '#f8fafc',
    sidebarBorder: '#1e293b',
    sidebarMutedForeground: '#94a3b8',
    sidebarLogo: '',
    sidebarTitle: 'Horizon ERP',
    sidebarSubtitle: 'Dashboard',
    headerBackground: '',
  },
  sidebarLogo: '',
  sidebarTitle: 'Horizon ERP',
  sidebarSubtitle: 'Dashboard',
  scheduling: defaultSettings.scheduling
};

function hexToHsl(hex) {
  if (!hex || typeof hex !== 'string') {
    if (hex && (hex.includes('gradient') || hex === 'transparent')) return hex;
    return '0 0% 0%';
  }
  if (hex === 'transparent') return 'transparent';
  if (!/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
      if (hex.includes('gradient') || hex.includes('rgba') || hex.includes('hsla')) return hex;
      return '0 0% 0%';
  }

  let c = hex.substring(1).split('');
    if (c.length === 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    let r = (c >> 16) & 255;
    let g = (c >> 8) & 255;
    let b = c & 255;
    
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function getLuminance(hex) {
    if (!hex || !hex.startsWith('#')) return 0;
    hex = hex.replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}


export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [settings, setSettings] = useState(defaultSettings);
  const [savedDarkModeSettings, setSavedDarkModeSettings] = useState(defaultDarkMode);
  const [savedLightModeSettings, setSavedLightModeSettings] = useState(defaultSettings);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const schedulerRef = useRef(null);

  // Helper to get current dashboard context (role)
  const getDashboardContext = useCallback(() => {
      const path = location.pathname;
      if (path.startsWith('/master-admin')) return 'master_admin';
      if (path.startsWith('/school-owner')) return 'school_owner';
      if (path.startsWith('/admin')) return 'admin';
      if (path.startsWith('/teacher')) return 'teacher';
      if (path.startsWith('/student')) return 'student';
      if (path.startsWith('/parent')) return 'parent';
      if (path.startsWith('/principal')) return 'principal';
      if (path.startsWith('/accountant')) return 'accountant';
      if (path.startsWith('/librarian')) return 'librarian';
      if (path.startsWith('/employee')) return 'employee';
      if (path.startsWith('/receptionist')) return 'receptionist';
      return 'default';
  }, [location.pathname]);

  const dashboardContext = getDashboardContext();
  
  const mergeSettings = (loaded) => {
      return {
          ...defaultSettings,
          ...loaded,
          colors: { ...defaultSettings.colors, ...(loaded.colors || {}) },
          scheduling: { ...defaultSettings.scheduling, ...(loaded.scheduling || {}) }
      };
  };

  const addToHistory = (newSettings) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newSettings);
      if (newHistory.length > 10) newHistory.shift(); // Keep last 10
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
      if (historyIndex > 0) {
          const prev = history[historyIndex - 1];
          setHistoryIndex(historyIndex - 1);
          setSettings(prev);
          applySettings(prev);
      }
  };

  const redo = () => {
      if (historyIndex < history.length - 1) {
          const next = history[historyIndex + 1];
          setHistoryIndex(historyIndex + 1);
          setSettings(next);
          applySettings(next);
      }
  };

  const applySettings = useCallback((newSettings) => {
    const root = window.document.documentElement;
    
    root.classList.remove('light', 'dark');
    root.classList.add(newSettings.mode);

    root.style.setProperty('--radius', `${newSettings.radius}px`);
    
    const colors = newSettings.colors;

    const setProp = (name, value) => {
        const isSidebar = name.startsWith('--sidebar-');
        
        if (value && (value.includes('gradient') || value.includes('rgba') || value.includes('hsla') || value === 'transparent')) {
            root.style.setProperty(name, value);
        } else {
            const hsl = hexToHsl(value);
            if (isSidebar) {
                root.style.setProperty(name, `hsl(${hsl})`);
            } else {
                root.style.setProperty(name, hsl);
            }
        }
    };

    setProp('--background', colors.background);
    setProp('--foreground', colors.foreground);
    setProp('--card', colors.card);
    setProp('--card-foreground', colors.foreground);
    setProp('--popover', colors.popover);
    setProp('--popover-foreground', colors.popoverForeground);
    setProp('--primary', colors.primary);
    
    const primaryLuminance = getLuminance(colors.primary);
    root.style.setProperty('--primary-foreground', primaryLuminance > 0.5 ? 'hsl(0 0% 0%)' : 'hsl(0 0% 100%)');
    
    setProp('--secondary', colors.secondary);
    setProp('--secondary-foreground', colors.foreground);
    setProp('--muted', colors.muted);
    setProp('--muted-foreground', colors.mutedForeground);
    setProp('--accent', colors.accent);
    setProp('--accent-foreground', colors.accentForeground);
    setProp('--destructive', colors.destructive);
    
    const destructiveLuminance = getLuminance(colors.destructive);
    root.style.setProperty('--destructive-foreground', destructiveLuminance > 0.5 ? 'hsl(0 0% 0%)' : 'hsl(0 0% 100%)');
    
    setProp('--border', colors.border);
    setProp('--input', colors.input);
    setProp('--ring', colors.ring);
    
    setProp('--sidebar-background', colors.sidebarBackground);
    setProp('--sidebar-header', colors.sidebarHeader);
    setProp('--sidebar-foreground', colors.sidebarForeground);
    setProp('--sidebar-primary', colors.sidebarPrimary);
    setProp('--sidebar-primary-foreground', colors.sidebarPrimaryForeground);
    setProp('--sidebar-accent', colors.sidebarAccent);
    setProp('--sidebar-accent-foreground', colors.sidebarAccentForeground);
    setProp('--sidebar-border', colors.sidebarBorder);
    setProp('--sidebar-muted-foreground', colors.sidebarMutedForeground);


    document.body.style.fontFamily = newSettings.fontFamily;
    root.style.setProperty('--font-family', newSettings.fontFamily);
    
    if (newSettings.shadows) {
      root.style.setProperty('--shadow-card', '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)');
      root.classList.add('shadows-enabled');
      root.classList.remove('shadows-disabled');
    } else {
      root.style.setProperty('--shadow-card', 'none');
      root.classList.add('shadows-disabled');
      root.classList.remove('shadows-enabled');
    }
  }, []);

  useEffect(() => {
    const fetchAndSetTheme = async () => {
      let loadedSettings = defaultSettings;
      
      if (user) {
        const { data } = await supabase.from('user_theme_settings').select('settings').eq('user_id', user.id).maybeSingle();
        if (data && data.settings) {
            // Check if settings are role-based (new format) or flat (old format)
            // New format: { "school_owner": { ... }, "admin": { ... } }
            // Old format: { theme: "...", colors: { ... } }
            
            if (data.settings[dashboardContext] && data.settings[dashboardContext].theme) {
                // It's the new format and has settings for this context
                loadedSettings = mergeSettings(data.settings[dashboardContext]);
            } else if (dashboardContext !== 'default' && data.settings.theme) {
                // It's the old format (flat), use it as base but migrate in memory
                // FIX: Only use legacy flat settings if NOT on homepage (default context)
                // This prevents old dashboard themes from leaking to homepage
                loadedSettings = mergeSettings(data.settings);
            } else {
                // New format but no settings for this context yet, use default
                loadedSettings = defaultSettings;
            }
        }
      } else {
        try {
            const local = JSON.parse(localStorage.getItem('app-theme-settings'));
            if (local) {
                 if (local[dashboardContext] && local[dashboardContext].theme) {
                    loadedSettings = mergeSettings(local[dashboardContext]);
                 } else if (dashboardContext !== 'default' && local.theme) {
                    loadedSettings = mergeSettings(local);
                 }
            }
        } catch (e) {}
      }

      setSettings(loadedSettings);
      setHistory([loadedSettings]);
      setHistoryIndex(0);
      
      if (loadedSettings.mode === 'dark') {
        setSavedDarkModeSettings(loadedSettings);
      } else {
        setSavedLightModeSettings(loadedSettings);
      }
    };

    fetchAndSetTheme();
  }, [user, dashboardContext]); // Re-run when user OR dashboard context changes

  useEffect(() => {
      if (!settings.scheduling?.enabled) return;

      const checkSchedule = () => {
          const now = new Date();
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          
          const [dayH, dayM] = (settings.scheduling.dayStart || '06:00').split(':').map(Number);
          const [nightH, nightM] = (settings.scheduling.nightStart || '18:00').split(':').map(Number);
          
          const dayStartMinutes = dayH * 60 + dayM;
          const nightStartMinutes = nightH * 60 + nightM;
          
          const isDay = currentMinutes >= dayStartMinutes && currentMinutes < nightStartMinutes;
          
          if (isDay && settings.mode !== 'light') {
            // Switch to light mode using saved light settings
            const lightSettings = { ...savedLightModeSettings, mode: 'light' };
            setSettings(lightSettings);
            applySettings(lightSettings);
          } else if (!isDay && settings.mode !== 'dark') {
            // Switch to dark mode using saved dark settings
            const darkSettings = { ...savedDarkModeSettings, mode: 'dark' };
            setSettings(darkSettings);
            applySettings(darkSettings);
          }
      };

      // Check immediately on enable
      checkSchedule();
      
      // Then check every minute
      const interval = setInterval(checkSchedule, 60000);
      return () => clearInterval(interval);
  }, [settings.scheduling?.enabled, settings.scheduling?.dayStart, settings.scheduling?.nightStart, savedLightModeSettings, savedDarkModeSettings, applySettings]);


  useEffect(() => {
    const isDashboardRoute = (path) => {
        const dashboardPrefixes = [
            '/master-admin', 
            '/school-owner', 
            '/admin', 
            '/teacher', 
            '/student', 
            '/parent', 
            '/principal', 
            '/accountant', 
            '/librarian', 
            '/employee', 
            '/receptionist'
        ];
        return dashboardPrefixes.some(prefix => path.startsWith(prefix));
    };

    // FIX: Allow theme to be applied everywhere, including Homepage
    applySettings(settings);
    
    /* 
    // Previous logic forced light mode on public pages
    if (isDashboardRoute(location.pathname)) {
        applySettings(settings);
    } else {
        applySettings(defaultSettings);
    }
    */
  }, [settings, location.pathname, applySettings]);
  
  const toggleMode = () => {
    setSettings(currentSettings => {
      const isLight = currentSettings.mode === 'light';
      const targetMode = isLight ? 'dark' : 'light';
      
      // Save current state before switching
      if (isLight) {
          setSavedLightModeSettings(currentSettings);
      } else {
          setSavedDarkModeSettings(currentSettings);
      }

      // Determine new settings
      // FORCE STANDARD DEFAULTS when toggling via Sun/Moon
      // This ensures independence from Theme Studio presets
      let nextSettings = targetMode === 'dark' ? defaultDarkMode : defaultSettings;

      // PERSIST BRANDING: Ensure logo and title are carried over
      // We check both root level (legacy/fallback) and colors level
      // PRIORITY FIX: Check root first (User Customization), then colors (Theme Default)
      const currentLogo = currentSettings.sidebarLogo || currentSettings.colors?.sidebarLogo;
      const currentTitle = currentSettings.sidebarTitle || currentSettings.colors?.sidebarTitle;
      const currentSubtitle = currentSettings.sidebarSubtitle || currentSettings.colors?.sidebarSubtitle;

      if (currentLogo || currentTitle || currentSubtitle) {
          nextSettings = {
              ...nextSettings,
              // Save to root to ensure precedence
              sidebarLogo: currentLogo || nextSettings.sidebarLogo,
              sidebarTitle: currentTitle || nextSettings.sidebarTitle,
              sidebarSubtitle: currentSubtitle || nextSettings.sidebarSubtitle,
              colors: {
                  ...nextSettings.colors,
                  // Also update colors for consistency, though root takes precedence now
                  sidebarLogo: currentLogo || nextSettings.colors?.sidebarLogo,
                  sidebarTitle: currentTitle || nextSettings.colors?.sidebarTitle,
                  sidebarSubtitle: currentSubtitle || nextSettings.colors?.sidebarSubtitle
              }
          };
      }

      // Ensure the mode is correct
      nextSettings = { ...nextSettings, mode: targetMode };
      
      // SAVE LOGIC: Update to support Role-Based Isolation
      const saveSettings = async (newSettingsToSave) => {
          if (user) {
              // Fetch current full settings object first to preserve other roles
              const { data } = await supabase.from('user_theme_settings').select('settings').eq('user_id', user.id).maybeSingle();
              let fullSettings = data?.settings || {};
              
              // If fullSettings is flat (old format), migrate it to be under 'default' or current context
              if (fullSettings.theme && !fullSettings[dashboardContext]) {
                  // It's flat. We can't easily know which role it belonged to, so we might just overwrite or keep it as legacy fallback.
                  // Better strategy: Create new structure.
                  fullSettings = { 
                      ...fullSettings, // Keep legacy keys for safety
                      [dashboardContext]: newSettingsToSave 
                  };
              } else {
                  // It's already structured or empty
                  fullSettings[dashboardContext] = newSettingsToSave;
              }

              await supabase.from('user_theme_settings').upsert({ user_id: user.id, settings: fullSettings });
          } else {
              // Local Storage Logic
              let local = {};
              try { local = JSON.parse(localStorage.getItem('app-theme-settings')) || {}; } catch(e) {}
              
              if (local.theme && !local[dashboardContext]) {
                   local = { ...local, [dashboardContext]: newSettingsToSave };
              } else {
                   local[dashboardContext] = newSettingsToSave;
              }
              localStorage.setItem('app-theme-settings', JSON.stringify(local));
          }
      };

      saveSettings(nextSettings);
      
      addToHistory(nextSettings);
      return nextSettings;
    });
  };

  const resetToDefault = async () => {
    // Only reset for CURRENT dashboard context
    if (user) {
        const { data } = await supabase.from('user_theme_settings').select('settings').eq('user_id', user.id).maybeSingle();
        if (data && data.settings) {
            const newSettings = { ...data.settings };
            delete newSettings[dashboardContext]; // Remove only current context settings
            await supabase.from('user_theme_settings').upsert({ user_id: user.id, settings: newSettings });
        }
    }
    
    // Local Storage
    try {
        const local = JSON.parse(localStorage.getItem('app-theme-settings')) || {};
        delete local[dashboardContext];
        localStorage.setItem('app-theme-settings', JSON.stringify(local));
    } catch(e) {}
    
    const reset = defaultSettings;
    setSettings(reset);
    setSavedDarkModeSettings(defaultDarkMode);
    setSavedLightModeSettings(defaultSettings);
    addToHistory(reset);
  };

  const updateAndApplySettings = (newSettings, skipHistory = false) => {
      setSettings(newSettings);
      if (newSettings.mode === 'dark') {
        setSavedDarkModeSettings(newSettings);
      }
      if (!skipHistory) addToHistory(newSettings);
  };

  // --- CUSTOM THEME LOGIC ---
  const saveCustomThemeToProfile = async (name) => {
      if (!user) return { success: false, message: 'User not logged in' };
      
      const themeToSave = {
          ...settings,
          name: name,
          isCustom: true,
          savedAt: new Date().toISOString()
      };

      try {
          console.log('Saving custom theme via RPC...', themeToSave);
          // Use RPC to bypass RLS issues
          const { data: success, error } = await supabase.rpc('save_my_theme_config', { config: themeToSave });

          if (error) {
              console.error('RPC Error saving theme:', error);
              throw error;
          }
          
          if (!success) {
              console.warn('RPC returned false (no rows updated). User ID might not match.');
              return { success: false, message: 'Failed to save: User profile not found.' };
          }

          console.log('Custom theme saved successfully via RPC.');
          return { success: true, message: 'Custom theme saved successfully!' };
      } catch (error) {
          console.error('Error saving custom theme:', error);
          return { success: false, message: 'Failed to save custom theme.' };
      }
  };

  const loadCustomThemeFromProfile = async () => {
      if (!user) {
          console.warn('Cannot load theme: User not logged in');
          return { success: false, message: 'User not logged in' };
      }

      try {
          console.log('Loading custom theme via RPC...');
          // Use RPC to bypass RLS issues
          const { data, error } = await supabase.rpc('get_my_theme_config');

          if (error) {
              console.error('RPC Error loading theme:', error);
              throw error;
          }

          console.log('Loaded theme data:', data);

          if (data) {
              updateAndApplySettings(data);
              return { success: true, message: 'Custom theme loaded!', theme: data };
          } else {
              console.log('No custom theme found in profile.');
              return { success: false, message: 'No custom theme found.' };
          }
      } catch (error) {
          console.error('Error loading custom theme:', error);
          return { success: false, message: 'Failed to load custom theme.' };
      }
  };

  const value = {
    settings,
    setSettings: updateAndApplySettings,
    applySettings,
    toggleMode,
    resetToDefault,
    defaultSettings,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    saveCustomThemeToProfile,
    loadCustomThemeFromProfile
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
