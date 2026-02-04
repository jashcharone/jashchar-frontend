/**
 * Utility functions for sorting classes and sections in proper school order
 * Order: Nursery → LKG → UKG → Class 1 → Class 2 → ... → Class 12
 */

/**
 * Get the sort order number for a class name
 * @param {string} name - Class name
 * @returns {number} - Sort order (lower = first)
 */
export const getClassSortOrder = (name) => {
    if (!name) return 999;
    const lowerName = name.toLowerCase().trim();
    
    // Pre-school classes first
    if (lowerName.includes('nursery') || lowerName.includes('nur') || lowerName === 'play group' || lowerName === 'pg') return 1;
    if (lowerName === 'lkg' || lowerName.includes('lower kg') || lowerName.includes('l.k.g')) return 2;
    if (lowerName === 'ukg' || lowerName.includes('upper kg') || lowerName.includes('u.k.g')) return 3;
    if (lowerName.includes('prep') || lowerName.includes('pre-primary') || lowerName === 'pp') return 4;
    
    // Extract class number (Class 1, Class 2, Grade 1, Std 1, etc.)
    const match = name.match(/(\d+)/);
    if (match) {
        return 10 + parseInt(match[1]); // Class 1 = 11, Class 2 = 12, etc.
    }
    
    // Unknown classes at end (alphabetically)
    return 100;
};

/**
 * Sort classes array in proper school order
 * @param {Array} classes - Array of class objects with 'name' property
 * @returns {Array} - Sorted array
 */
export const sortClasses = (classes) => {
    if (!classes || !Array.isArray(classes)) return [];
    
    return [...classes].sort((a, b) => {
        const orderA = getClassSortOrder(a.name);
        const orderB = getClassSortOrder(b.name);
        
        if (orderA !== orderB) {
            return orderA - orderB;
        }
        // If same order (e.g., both unknown), sort alphabetically
        return (a.name || '').localeCompare(b.name || '', undefined, { numeric: true });
    });
};

/**
 * Get the sort order number for a section name
 * @param {string} name - Section name
 * @returns {number} - Sort order
 */
export const getSectionSortOrder = (name) => {
    if (!name) return 999;
    const lowerName = name.toLowerCase().trim();
    
    // Single letter sections (A, B, C, D, ...)
    if (lowerName.length === 1 && /^[a-z]$/.test(lowerName)) {
        return lowerName.charCodeAt(0) - 96; // a=1, b=2, c=3, ...
    }
    
    // Common section names
    const sectionOrder = {
        'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5, 'f': 6, 'g': 7, 'h': 8,
        'section a': 1, 'section b': 2, 'section c': 3, 'section d': 4,
        'sec a': 1, 'sec b': 2, 'sec c': 3, 'sec d': 4,
    };
    
    if (sectionOrder[lowerName] !== undefined) {
        return sectionOrder[lowerName];
    }
    
    // Extract number if present
    const match = name.match(/(\d+)/);
    if (match) {
        return parseInt(match[1]);
    }
    
    return 50; // Unknown sections
};

/**
 * Sort sections array in proper order (A, B, C, ...)
 * @param {Array} sections - Array of section objects with 'name' property
 * @returns {Array} - Sorted array
 */
export const sortSections = (sections) => {
    if (!sections || !Array.isArray(sections)) return [];
    
    return [...sections].sort((a, b) => {
        const orderA = getSectionSortOrder(a.name);
        const orderB = getSectionSortOrder(b.name);
        
        if (orderA !== orderB) {
            return orderA - orderB;
        }
        return (a.name || '').localeCompare(b.name || '', undefined, { numeric: true });
    });
};

export default {
    getClassSortOrder,
    sortClasses,
    getSectionSortOrder,
    sortSections
};
