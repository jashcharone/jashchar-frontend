import { supabase } from '@/lib/customSupabaseClient';

/**
 * Syncs the selected modules for a plan to the plan_modules table.
 * Performs a differential update (insert new, delete removed).
 * 
 * @param {string} planId - The ID of the subscription plan
 * @param {string[]} selectedModuleSlugs - Array of selected module slugs
 */
export const syncPlanModules = async (planId, selectedModuleSlugs) => {
  try {
    // 1. Fetch current mappings to determine delta
    const { data: currentMappings, error: fetchError } = await supabase
        .from('plan_modules')
        .select('module_key')
        .eq('plan_id', planId);
    
    if (fetchError) throw fetchError;

    const currentSlugs = currentMappings.map(m => m.module_key);

    // 2. Calculate differences
    const toAdd = selectedModuleSlugs.filter(slug => !currentSlugs.includes(slug));
    const toRemove = currentSlugs.filter(slug => !selectedModuleSlugs.includes(slug));

    // 3. Insert new modules
    if (toAdd.length > 0) {
        const insertPayload = toAdd.map(slug => ({
            plan_id: planId,
            module_key: slug,
            created_at: new Date()
        }));
        const { error: insertError } = await supabase
            .from('plan_modules')
            .insert(insertPayload);
        
        if (insertError) throw insertError;
    }

    // 4. Remove deselected modules
    if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
            .from('plan_modules')
            .delete()
            .eq('plan_id', planId)
            .in('module_key', toRemove);
        
        if (deleteError) throw deleteError;
    }

    return { 
        success: true, 
        synced: toAdd.length, 
        removed: toRemove.length 
    };

  } catch (error) {
    console.error('Sync Plan Modules Failed:', error);
    return { success: false, error: error.message };
  }
};
