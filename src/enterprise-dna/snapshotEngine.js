/**
 * AUTO SNAPSHOT ENGINE
 * captures state before mutations.
 */

const SNAPSHOT_STORAGE_KEY = 'horizon_enterprise_snapshots';

export const createSnapshot = (scope = 'global') => {
  try {
    const snapshot = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      scope,
      // Capture critical local storage state that defines current user/session
      auth: localStorage.getItem('sb-vibtoambozsmpzxcbuur-auth-token'),
      theme: localStorage.getItem('app-theme-settings'),
    };

    const existing = JSON.parse(localStorage.getItem(SNAPSHOT_STORAGE_KEY) || '[]');
    const updated = [snapshot, ...existing].slice(0, 50); // Keep last 50
    localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(updated));
    
    console.log(`[Snapshot Engine] State captured: ${snapshot.id}`);
    return snapshot.id;
  } catch (e) {
    console.error('Snapshot failed', e);
    return null;
  }
};

export const rollbackToSnapshot = (snapshotId) => {
  const snapshots = JSON.parse(localStorage.getItem(SNAPSHOT_STORAGE_KEY) || '[]');
  const target = snapshots.find(s => s.id === snapshotId);
  
  if (target) {
    if (target.theme) localStorage.setItem('app-theme-settings', target.theme);
    console.log('[Snapshot Engine] Rollback successful');
    window.location.reload();
    return true;
  }
  return false;
};
