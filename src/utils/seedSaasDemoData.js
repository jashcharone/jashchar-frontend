import { supabase } from '@/lib/customSupabaseClient';

export const seedSaasDemoData = async () => {
  try {
    // Seed SaaS Website Settings if missing
    const { data: existingSettings } = await supabase.from('saas_website_settings').select('id').maybeSingle();
    
    if (!existingSettings) {
      console.log('Seeding SaaS website settings...');
      await supabase.from('saas_website_settings').insert({
        header: {
            company_name: 'Jashchar ERP',
            enabled: true
        },
        hero: {
            title: 'Transform School Management',
            subtitle: 'A next-generation SaaS platform.',
            ctaText: 'Get Started',
            ctaLink: '/login',
            enabled: true
        },
        demo_school_enabled: true,
        demo_school_label: 'Demo School',
        demo_school_url: '/jashchar-cbse',
        demo_school_open_in_new_tab: false,
        seo_settings: {
            meta_title: 'Jashchar ERP',
            meta_description: 'School Management System'
        },
        section_order: ["hero", "features", "panels", "pricing", "testimonials", "faq", "cta", "footer"]
      });
    } else {
      // Ensure new columns are populated even if row exists
      const { error } = await supabase.from('saas_website_settings').update({
          demo_school_enabled: true,
          demo_school_label: 'Demo School',
          demo_school_url: '/jashchar-cbse',
          demo_school_open_in_new_tab: false
      }).eq('id', existingSettings.id).is('demo_school_enabled', null); // Only if null
      
      if (error) console.warn("Error updating demo school defaults:", error);
    }

    return { success: true, status: 'seeded' };
  } catch (error) {
    console.error('Seeding Error:', error);
    return { success: false, error: error.message };
  }
};
