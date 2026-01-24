import { supabase } from './customSupabaseClient';

/**
 * Secure Delete Operation
 * Checks RLS permissions automatically.
 * 
 * @param {string} table - The table name (e.g., 'sections', 'students')
 * @param {string} id - The ID of the row to delete
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const secureDelete = async (table, id) => {
    try {
        const { data, error } = await supabase
            .from(table)
            .delete()
            .eq('id', id)
            .select(); // Critical: This checks if the row was actually touched

        if (error) return { success: false, error: error.message };
        
        // If no data returned, it means RLS silently blocked it
        if (!data || data.length === 0) {
            return { success: false, error: 'Permission Denied: You do not have permission to delete this record.' };
        }

        return { success: true, error: null };
    } catch (err) {
        return { success: false, error: err.message };
    }
};

/**
 * Secure Update Operation
 * Checks RLS permissions automatically.
 * 
 * @param {string} table - The table name
 * @param {string} id - The ID of the row to update
 * @param {object} updates - The object containing updates (e.g., { name: 'New Name' })
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const secureUpdate = async (table, id, updates) => {
    try {
        const { data, error } = await supabase
            .from(table)
            .update(updates)
            .eq('id', id)
            .select();

        if (error) return { success: false, error: error.message };

        if (!data || data.length === 0) {
            return { success: false, error: 'Permission Denied: You do not have permission to edit this record.' };
        }

        return { success: true, error: null };
    } catch (err) {
        return { success: false, error: err.message };
    }
};
