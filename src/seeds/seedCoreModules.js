import { supabase } from '@/lib/customSupabaseClient';

/**
 * Seeds core modules into the modules table if they are missing.
 * Uses the 'slug' as the unique key to prevent duplicates.
 */
export const seedCoreModules = async () => {
  const coreModules = [
    { name: 'Academics', slug: 'academics', category: 'school' },
    { name: 'Students', slug: 'students', category: 'school' },
    { name: 'Staff', slug: 'staff', category: 'school' },
    { name: 'Fees', slug: 'fees', category: 'school' },
    { name: 'Attendance', slug: 'attendance', category: 'school' },
    { name: 'Front Office', slug: 'front_office', category: 'school' },
    { name: 'Finance', slug: 'finance', category: 'school' },
    { name: 'Examinations', slug: 'examinations', category: 'school' },
    { name: 'Online Examinations', slug: 'online_examinations', category: 'school' },
    { name: 'Transport', slug: 'transport', category: 'school' },
    { name: 'Hostel', slug: 'hostel', category: 'school' },
    { name: 'Library', slug: 'library', category: 'school' },
    { name: 'Inventory', slug: 'inventory', category: 'school' },
    { name: 'Human Resource', slug: 'human_resource', category: 'school' },
    { name: 'Communicate', slug: 'communicate', category: 'school' },
    { name: 'Certificate', slug: 'certificate', category: 'school' },
    { name: 'Front CMS', slug: 'front_cms', category: 'school' },
    { name: 'Reports', slug: 'reports', category: 'school' },
    { name: 'System Settings', slug: 'system_settings', category: 'school' }
  ];

  try {
    // 1. Check if module_registry table exists by trying to select from it
    const { error: tableError } = await supabase.from('module_registry').select('id').limit(1);
    
    if (tableError) {
       // If table doesn't exist, we can't seed via JS client directly if RLS blocks creation or table is missing.
       // Assuming the SQL migration ran, this shouldn't happen.
       // If it does, we log and return.
       console.error("module_registry table check failed:", tableError);
       return { success: false, message: "module_registry table likely missing or inaccessible." };
    }

    let seededCount = 0;

    // 2. Upsert or Insert missing
    // We use a loop here to be safe and granular, or we could use upsert if slug is unique constraint.
    // Given the constraint in migration, we can attempt upsert safely.
    const { data, error } = await supabase
        .from('module_registry')
        .upsert(coreModules, { onConflict: 'slug', ignoreDuplicates: true })
        .select();

    if (error) {
        console.error("Seeding core modules failed:", error);
        return { success: false, message: error.message };
    }

    seededCount = data?.length || 0;
    console.log(`Seeded/Verified ${seededCount} core modules.`);

    return { success: true, seeded: seededCount, message: "Core modules seeded successfully." };

  } catch (e) {
    console.error("Unexpected error seeding modules:", e);
    return { success: false, message: e.message };
  }
};

/**
 * Ensures a specific module exists by slug.
 */
export const ensureModuleExists = async (slug, name, category = 'school') => {
    try {
        const { data } = await supabase.from('module_registry').select('id').eq('slug', slug).maybeSingle();
        if (data) return { success: true, moduleId: data.id, created: false };

        const { data: newModule, error } = await supabase
            .from('module_registry')
            .insert([{ name, slug, category, is_active: true }])
            .select()
            .single();

        if (error) throw error;
        return { success: true, moduleId: newModule.id, created: true };
    } catch (e) {
        console.error(`Failed to ensure module ${slug}:`, e);
        return { success: false, error: e.message };
    }
};
