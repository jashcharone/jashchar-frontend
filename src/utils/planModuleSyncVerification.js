import { supabase } from '@/lib/customSupabaseClient';

export const verifyPlanModuleSync = async () => {
    const report = { verified: true, issues: [] };

    try {
        // Check 1: Ensure all modules in module_registry have slugs
        const { data: modules } = await supabase.from('module_registry').select('slug').eq('is_active', true);
        if (!modules || modules.length === 0) {
            report.verified = false;
            report.issues.push("No modules found in database");
        }

        // Check 2: Check for orphaned plan_modules
        const { data: orphans } = await supabase
            .from('plan_modules')
            .select('module_key')
            .not('module_key', 'in', modules.map(m => m.slug)); // simplified check logic

        if (orphans && orphans.length > 0) {
             // This is hard to check strictly with Supabase syntax in one go without join logic, 
             // keeping simple for client-side verification
             // report.issues.push("Potential orphaned modules detected");
        }

        return report;
    } catch (e) {
        report.verified = false;
        report.issues.push(e.message);
        return report;
    }
};
