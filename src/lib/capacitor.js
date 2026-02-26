// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - Capacitor Native Integration
// Handles: Back button, Status bar, Splash screen, Keyboard, App lifecycle
// Import this in main.jsx — it auto-initializes on native platforms only.
// ═══════════════════════════════════════════════════════════════════════════

import { isNativePlatform, isAndroid } from '@/utils/platform';

let initialized = false;

/**
 * Initialize all Capacitor native integrations.
 * Safe to call on web — does nothing if not native.
 */
export async function initCapacitor() {
  if (!isNativePlatform() || initialized) return;
  initialized = true;

  console.log('[Capacitor] Initializing native integrations...');

  // Run all native initializations in parallel
  await Promise.allSettled([
    initStatusBar(),
    initSplashScreen(),
    initBackButton(),
    initKeyboard(),
    initAppLifecycle(),
  ]);

  console.log('[Capacitor] Native integrations ready ✓');
}

// ─── STATUS BAR ──────────────────────────────────────────────────────────
async function initStatusBar() {
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    
    // Check if user prefers dark mode
    const isDark = document.documentElement.classList.contains('dark');

    await StatusBar.setStyle({ 
      style: isDark ? Style.Dark : Style.Light
    });

    if (isAndroid()) {
      await StatusBar.setBackgroundColor({ 
        color: isDark ? '#0f172a' : '#FFFFFF'
      });
      // Don't overlay — let app be below status bar
      await StatusBar.setOverlaysWebView({ overlay: false });
    }

    // Listen for theme changes to update status bar
    const observer = new MutationObserver(() => {
      const nowDark = document.documentElement.classList.contains('dark');
      StatusBar.setStyle({ style: nowDark ? Style.Dark : Style.Light }).catch(() => {});
      if (isAndroid()) {
        StatusBar.setBackgroundColor({ 
          color: nowDark ? '#0f172a' : '#FFFFFF'
        }).catch(() => {});
      }
    });
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });

    console.log('[Capacitor] Status bar configured ✓');
  } catch (err) {
    console.warn('[Capacitor] StatusBar init failed:', err.message);
  }
}

// ─── SPLASH SCREEN ───────────────────────────────────────────────────────
async function initSplashScreen() {
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    
    // Hide splash after a brief delay to let React render
    setTimeout(async () => {
      await SplashScreen.hide({ fadeOutDuration: 300 });
      console.log('[Capacitor] Splash screen hidden ✓');
    }, 800);
  } catch (err) {
    console.warn('[Capacitor] SplashScreen init failed:', err.message);
  }
}

// ─── BACK BUTTON HANDLING ────────────────────────────────────────────────
async function initBackButton() {
  try {
    const { App } = await import('@capacitor/app');

    let lastBackPress = 0;

    App.addListener('backButton', ({ canGoBack }) => {
      // If browser history can go back, navigate back
      if (canGoBack || window.history.length > 1) {
        window.history.back();
        return;
      }

      // If at root, double-tap to exit
      const now = Date.now();
      if (now - lastBackPress < 2000) {
        App.exitApp();
      } else {
        lastBackPress = now;
        // Show toast using a simple div (no dependency needed)
        showNativeToast('Press back again to exit');
      }
    });

    console.log('[Capacitor] Back button handler configured ✓');
  } catch (err) {
    console.warn('[Capacitor] BackButton init failed:', err.message);
  }
}

// ─── KEYBOARD ────────────────────────────────────────────────────────────
async function initKeyboard() {
  try {
    const { Keyboard } = await import('@capacitor/keyboard');
    
    // When keyboard opens, scroll the focused input into view
    Keyboard.addListener('keyboardWillShow', (info) => {
      document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
      
      // Scroll active element into view
      setTimeout(() => {
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
          activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    });

    Keyboard.addListener('keyboardWillHide', () => {
      document.body.style.setProperty('--keyboard-height', '0px');
    });

    console.log('[Capacitor] Keyboard handler configured ✓');
  } catch (err) {
    console.warn('[Capacitor] Keyboard init failed:', err.message);
  }
}

// ─── APP LIFECYCLE ───────────────────────────────────────────────────────
async function initAppLifecycle() {
  try {
    const { App } = await import('@capacitor/app');

    // When app resumes from background, check auth token validity
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        console.log('[Capacitor] App resumed from background');
        // Dispatch custom event so AuthContext can refresh token
        window.dispatchEvent(new CustomEvent('app-resumed'));
      } else {
        console.log('[Capacitor] App went to background');
        window.dispatchEvent(new CustomEvent('app-paused'));
      }
    });

    // Handle deep links / URL opens
    App.addListener('appUrlOpen', (data) => {
      console.log('[Capacitor] URL opened:', data.url);
      // If it's a deep link, navigate to the path
      try {
        const url = new URL(data.url);
        if (url.pathname && url.pathname !== '/') {
          window.location.hash = '';
          window.history.pushState(null, '', url.pathname + url.search);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      } catch (e) {
        console.warn('[Capacitor] Could not parse deep link:', e);
      }
    });

    console.log('[Capacitor] App lifecycle listeners configured ✓');
  } catch (err) {
    console.warn('[Capacitor] AppLifecycle init failed:', err.message);
  }
}

// ─── HELPER: Simple toast for native ─────────────────────────────────────
function showNativeToast(message, duration = 2000) {
  // Remove existing toast if any
  const existing = document.getElementById('capacitor-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'capacitor-toast';
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0, 0, 0, 0.8)',
    color: '#fff',
    padding: '10px 24px',
    borderRadius: '24px',
    fontSize: '14px',
    fontFamily: 'system-ui, sans-serif',
    zIndex: '99999',
    pointerEvents: 'none',
    transition: 'opacity 0.3s',
    opacity: '1',
  });
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ─── THEME-AWARE STATUS BAR UPDATE ───────────────────────────────────────
/**
 * Call this from ThemeContext when theme changes
 * to update the status bar color dynamically.
 */
export async function updateStatusBarTheme(isDark) {
  if (!isNativePlatform()) return;
  
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
    if (isAndroid()) {
      await StatusBar.setBackgroundColor({ 
        color: isDark ? '#0f172a' : '#FFFFFF'
      });
    }
  } catch (err) {
    // Silently fail on web
  }
}

export default { initCapacitor, updateStatusBarTheme };
