import { ALL_MODULES } from '@/config/modules';
import { supabase } from '@/lib/customSupabaseClient';

export const verifyModuleSync = async () => {
    const report = {
        totalDefined: ALL_MODULES.length,
        missingInDb: [],
        status: 'ok'
    };

    const { data: dbModules } = await supabase.from('module_registry').select('slug').eq('is_active', true);
    const dbSlugs = dbModules ? dbModules.map(m => m.slug) : [];

    report.missingInDb = ALL_MODULES.filter(m => !dbSlugs.includes(m.slug)).map(m => m.slug);

    if (report.missingInDb.length > 0) report.status = 'issues_found';

    return report;
};
