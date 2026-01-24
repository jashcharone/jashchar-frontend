import { ALL_MODULES } from '@/config/modules';
import { supabase } from '@/lib/customSupabaseClient';

export const testModuleSync = async () => {
    console.log("Testing Module Sync...");
    
    // 1. Check Registry
    console.log(`Registry has ${ALL_MODULES.length} modules.`);

    // 2. Check DB (module_registry is the centralized module table)
    const { count } = await supabase.from('module_registry').select('*', { count: 'exact', head: true }).eq('is_active', true);
    console.log(`DB has ${count} modules.`);

    if (count >= ALL_MODULES.length) {
        console.log("✅ DB Sync looks correct.");
    } else {
        console.warn("❌ DB count mismatch.");
    }
};
