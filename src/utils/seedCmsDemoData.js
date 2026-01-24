import { supabase } from '@/lib/customSupabaseClient';

/**
 * Seeds demo CMS data for a specific school ID if settings are missing.
 * Safe to run multiple times (idempotent check).
 */
export const seedCmsDemoData = async (branchId) => {
  console.log(`Checking CMS seed status for school: ${branchId}`);
  
  try {
    // 1. Check if data exists (using cms_pages as proxy)
    const { data: existing } = await supabase
      .from('cms_pages')
      .select('id')
      .eq('branch_id', branchId)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log("CMS Data already exists. Skipping seed.");
      return { success: true, status: 'skipped' };
    }

    console.log("Seeding CMS data...");

    // 3. Seed Pages
    const pages = [
      { slug: 'about', title_en: 'About Us', title_kn: 'à²¨à²®à³à²® à²¬à²—à³à²—à³†', content_en: 'Detailed history of our school...', content_kn: 'à²¨à²®à³à²® à²¶à²¾à²²à³†à²¯ à²µà²¿à²µà²°à²µà²¾à²¦ à²‡à²¤à²¿à²¹à²¾à²¸...', is_published: true },
      { slug: 'academics', title_en: 'Academics', title_kn: 'à²¶à²¿à²•à³à²·à²£', content_en: 'Our curriculum details...', content_kn: 'à²¨à²®à³à²® à²ªà² à³à²¯à²•à³à²°à²®à²¦ à²µà²¿à²µà²°à²—à²³à³...', is_published: true },
      { slug: 'admission', title_en: 'Admissions', title_kn: 'à²ªà³à²°à²µà³‡à²¶à²¾à²¤à²¿', content_en: 'Admission procedure...', content_kn: 'à²ªà³à²°à²µà³‡à²¶ à²ªà³à²°à²•à³à²°à²¿à²¯à³†...', is_published: true },
      { slug: 'contact', title_en: 'Contact Us', title_kn: 'à²¸à²‚à²ªà²°à³à²•à²¿à²¸à²¿', content_en: 'Reach out to us...', content_kn: 'à²¨à²®à³à²®à²¨à³à²¨à³ à²¸à²‚à²ªà²°à³à²•à²¿à²¸à²¿...', is_published: true }
    ];
    
    for (const page of pages) {
        await supabase.from('cms_pages').insert({ ...page, branch_id: branchId });
    }

    // 4. Seed News
    await supabase.from('cms_news').insert([
      { branch_id: branchId, title_en: 'Annual Sports Day', title_kn: 'à²µà²¾à²°à³à²·à²¿à²• à²•à³à²°à³€à²¡à²¾ à²¦à²¿à²¨', date: new Date().toISOString(), content_en: 'Join us for the big game!', content_kn: 'à²¦à³Šà²¡à³à²¡ à²†à²Ÿà²•à³à²•à²¾à²—à²¿ à²¨à²®à³à²®à³Šà²‚à²¦à²¿à²—à³† à²¸à³‡à²°à²¿!', is_published: true },
      { branch_id: branchId, title_en: 'Science Fair Winners', title_kn: 'à²µà²¿à²œà³à²žà²¾à²¨ à²®à³‡à²³à²¦ à²µà²¿à²œà³‡à²¤à²°à³', date: new Date().toISOString(), content_en: 'Congrats to the winners.', content_kn: 'à²µà²¿à²œà³‡à²¤à²°à²¿à²—à³† à²…à²­à²¿à²¨à²‚à²¦à²¨à³†à²—à²³à³.', is_published: true }
    ]);

    // 5. Seed Notices
    await supabase.from('cms_notices').insert([
      { branch_id: branchId, title_en: 'Holiday Notice', title_kn: 'à²°à²œà³† à²¸à³‚à²šà²¨à³†', notice_date: new Date().toISOString(), content_en: 'School closed tomorrow.', content_kn: 'à²¨à²¾à²³à³† à²¶à²¾à²²à³† à²®à³à²šà³à²šà²¿à²°à³à²¤à³à²¤à²¦à³†.', is_published: true }
    ]);

    // 6. Seed Footer Links
    await supabase.from('cms_footer_links').insert([
      { branch_id: branchId, title_en: 'Privacy Policy', title_kn: 'à²—à³Œà²ªà³à²¯à²¤à²¾ à²¨à³€à²¤à²¿', url: '#', sort_order: 1 },
      { branch_id: branchId, title_en: 'Terms of Use', title_kn: 'à²¬à²³à²•à³†à²¯ à²¨à²¿à²¯à²®à²—à²³à³', url: '#', sort_order: 2 }
    ]);

    console.log("Seeding complete.");
    return { success: true, status: 'seeded' };

  } catch (err) {
    console.error("Seed failed:", err);
    return { success: false, error: err };
  }
};
