/**
 * HORIZON SAFETY SHIELD - AUTO SNAPSHOT BACKUP SYSTEM
 * Automatically creates local backups of critical state before dangerous operations.
 */

const BACKUP_KEY = 'horizon_app_snapshots';
const MAX_SNAPSHOTS = 5;

export const backupSystem = {
  // Create a snapshot of current app state (e.g. sidebar config, user preferences)
  createSnapshot: (tag = 'auto') => {
    try {
      const snapshot = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        tag,
        // Add other critical local state here if needed
        // For now we store registry integrity markers or user theme settings
        themeSettings: localStorage.getItem('app-theme-settings'),
        userPreferences: localStorage.getItem('user-preferences') 
      };

      const existing = backupSystem.getSnapshots();
      const newSnapshots = [snapshot, ...existing].slice(0, MAX_SNAPSHOTS);
      
      localStorage.setItem(BACKUP_KEY, JSON.stringify(newSnapshots));
      console.log(`[Safety Shield] Snapshot created: ${tag}`);
      return snapshot.id;
    } catch (e) {
      console.error('[Safety Shield] Backup failed', e);
      return null;
    }
  },

  getSnapshots: () => {
    try {
      return JSON.parse(localStorage.getItem(BACKUP_KEY) || '[]');
    } catch {
      return [];
    }
  },

  rollback: (snapshotId) => {
    const snapshots = backupSystem.getSnapshots();
    const target = snapshots.find(s => s.id === snapshotId);
    
    if (target) {
      if(target.themeSettings) localStorage.setItem('app-theme-settings', target.themeSettings);
      if(target.userPreferences) localStorage.setItem('user-preferences', target.userPreferences);
      console.log(`[Safety Shield] Rolled back to snapshot: ${target.tag}`);
      window.location.reload(); // Reload to apply changes
      return true;
    }
    return false;
  },
  
  clearBackups: () => {
      localStorage.removeItem(BACKUP_KEY);
  }
};
