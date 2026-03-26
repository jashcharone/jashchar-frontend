import { supabase } from '@/lib/customSupabaseClient';

export const seedCmsDemoData = async (branchId) => {
  try {
    // 1. Seed General Settings (if missing)
    const { data: existingSettings } = await supabase.from('cms_settings').select('id').eq('branch_id', branchId).maybeSingle();
    
    if (!existingSettings) {
      await supabase.from('cms_settings').insert({
        branch_id: branchId,
        cms_title: 'Demo Public School',
        cms_url_alias: `demo-${branchId.slice(0, 8)}`,
        is_frontend_enabled: true,
        cms_frontend_active: true,
        theme_primary_color: '#2563eb',
        contact_email: 'demo@example.com',
        website_status_message: 'Welcome to our new website!',
        default_public_language: 'en',
        site_board_type: 'CBSE',
        seo_index_enabled: false,
        theme_variant: 'glass-light'
      });
    }

    // 2. Seed School Login Settings (NEW)
    const { data: existingLogin } = await supabase.from('school_login_settings').select('id').eq('branch_id', branchId).maybeSingle();
    
    if (!existingLogin) {
      await supabase.from('school_login_settings').insert({
        branch_id: branchId,
        page_title: 'Welcome Back',
        subtitle: 'Sign in to access your digital campus',
        accent_color: '#3b82f6',
        background_type: 'slider',
        slider_image_1: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1500&q=80',
        slider_image_2: 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&w=1500&q=80',
        slider_image_3: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1500&q=80',
        social_login_enabled: true
      });
    }

    // 3. Seed Sample Pages (About, Contact)
    const { count: pageCount } = await supabase.from('cms_pages').select('*', { count: 'exact', head: true }).eq('branch_id', branchId);
    if (pageCount === 0) {
      await supabase.from('cms_pages').insert([
        {
          branch_id: branchId,
          title: 'About Us',
          slug: 'about-us',
          title_en: 'About Us',
          content_en: '<h2>Our History</h2><p>Established in 1990, we have been providing quality education...</p>',
          is_published: true
        },
        {
          branch_id: branchId,
          title: 'Admission',
          slug: 'admission',
          title_en: 'Admission Process',
          content_en: '<h2>Join Us</h2><p>Applications open for the academic year 2024-25.</p>',
          is_published: true
        }
      ]);
    }

    return { success: true, status: 'seeded' };
  } catch (error) {
    console.error('Seeding Error:', error);
    return { success: false, error: error.message };
  }
};
