import { BASE_SIDEBAR } from '@/config/sidebarConfig';

// This configuration is now dynamic and future-proof.
// It imports the single source of truth from sidebarConfig.js

export const getScanQueue = (role = 'school_owner') => {
    const queue = [];
    // Fallback to school_owner if role not found, or empty array
    let sidebar = BASE_SIDEBAR[role] || BASE_SIDEBAR['school_owner'] || [];

    sidebar.forEach(item => {
        if (item.submenu) {
            item.submenu.forEach(sub => {
                queue.push({
                    category: item.title,
                    name: sub.title,
                    path: sub.path
                });
            });
        } else {
            queue.push({
                category: 'General',
                name: item.title,
                path: item.path
            });
        }
    });
    return queue;
};

export const validateModuleCount = (role = 'school_owner') => {
    const queue = getScanQueue(role);
    let minCount = 33;
    if (role === 'master_admin') minCount = 10;
    if (role === 'student') minCount = 5;
    if (role === 'admin') minCount = 2;
    if (role === 'teacher' || role === 'parent') minCount = 1;

    return {
        valid: queue.length >= minCount,
        count: queue.length
    };
};

export const calculateStats = (results) => {
    const total = results.length;
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const health = total === 0 ? 0 : Math.round((passed / total) * 100);
    
    let statusColor = 'gray';
    if (health === 100) statusColor = 'green';
    else if (health > 80) statusColor = 'yellow';
    else if (health > 0) statusColor = 'red';

    return { total, passed, failed, health, statusColor };
};
