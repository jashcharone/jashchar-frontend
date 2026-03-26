import { BASE_SIDEBAR } from '@/config/sidebarConfig';

/**
 * SIDEBAR IMMUTABILITY LOCK
 * Ensures the core navigation structure remains intact.
 */

// Deep freeze the base sidebar configuration at runtime
const freezeObject = (obj) => {
    if (obj === null || typeof obj !== 'object' || Object.isFrozen(obj)) {
        return obj;
    }
    const propNames = Object.getOwnPropertyNames(obj);
    for (const name of propNames) {
        const value = obj[name];
        if (typeof value === 'object' && value !== null) {
            freezeObject(value);
        }
    }
    return Object.freeze(obj);
};

// Freeze the imported base structure
// We create a deep copy first to ensure the original BASE_SIDEBAR isn't directly modified
export const LOCKED_SIDEBAR = freezeObject(JSON.parse(JSON.stringify(BASE_SIDEBAR)));

export const validateSidebarIntegrity = (currentSidebar) => {
    // This is a placeholder for a more comprehensive comparison.
    // In a production setup, this would compare deep equality of `currentSidebar`
    // against `LOCKED_SIDEBAR` excluding newly appended items.
    
    // For the current append-only rule, we primarily rely on the `mergeAppendOnly`
    // logic to prevent mutation of existing items.
    
    const report = {
        status: 'SECURE',
        issues: []
    };

    // Example simple check: ensure critical top-level sections still exist
    if (!currentSidebar || !currentSidebar.master_admin || !currentSidebar.school_owner) {
        report.status = 'COMPROMISED';
        report.issues.push('Critical sidebar roles are missing.');
    }

    return report;
};

export const isSidebarItemLocked = (title) => {
    const allTitles = [];
    for (const role in LOCKED_SIDEBAR) {
        for (const item of LOCKED_SIDEBAR[role]) {
            allTitles.push(item.title);
            if (item.submenu) {
                for (const subItem of item.submenu) {
                    allTitles.push(subItem.title);
                }
            }
        }
    }
    return allTitles.includes(title);
};
