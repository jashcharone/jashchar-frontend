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
      { slug: 'about', title_en: 'About Us', title_kn: 'ನಮ್ಮ ಬಗ್ಗೆ', content_en: 'Detailed history of our school...', content_kn: 'ನಮ್ಮ ಶಾಲೆಯ ವಿವರವಾದ ಇತಿಹಾಸ...', is_published: true },
      { slug: 'academics', title_en: 'Academics', title_kn: 'ಶಿಕ್ಷಣ', content_en: 'Our curriculum details...', content_kn: 'ನಮ್ಮ ಪಠ್ಯಕ್ರಮದ ವಿವರಗಳು...', is_published: true },
      { slug: 'admission', title_en: 'Admissions', title_kn: 'ಪ್ರವೇಶಾತಿ', content_en: 'Admission procedure...', content_kn: 'ಪ್ರವೇಶ ಪ್ರಕ್ರಿಯೆ...', is_published: true },
      { slug: 'contact', title_en: 'Contact Us', title_kn: 'ಸಂಪರ್ಕಿಸಿ', content_en: 'Reach out to us...', content_kn: 'ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ...', is_published: true }
    ];
    
    for (const page of pages) {
        await supabase.from('cms_pages').insert({ ...page, branch_id: branchId });
    }

    // 4. Seed News
    await supabase.from('cms_news').insert([
      { branch_id: branchId, title_en: 'Annual Sports Day', title_kn: 'ವಾರ್ಷಿಕ ಕ್ರೀಡಾ ದಿನ', date: new Date().toISOString(), content_en: 'Join us for the big game!', content_kn: 'ದೊಡ್ಡ ಆಟಕ್ಕಾಗಿ ನಮ್ಮೊಂದಿಗೆ ಸೇರಿ!', is_published: true },
      { branch_id: branchId, title_en: 'Science Fair Winners', title_kn: 'ವಿಜ್ಞಾನ ಮೇಳದ ವಿಜೇತರು', date: new Date().toISOString(), content_en: 'Congrats to the winners.', content_kn: 'ವಿಜೇತರಿಗೆ ಅಭಿನಂದನೆಗಳು.', is_published: true }
    ]);

    // 5. Seed Notices
    await supabase.from('cms_notices').insert([
      { branch_id: branchId, title_en: 'Holiday Notice', title_kn: 'ರಜೆ ಸೂಚನೆ', notice_date: new Date().toISOString(), content_en: 'School closed tomorrow.', content_kn: 'ನಾಳೆ ಶಾಲೆ ಮುಚ್ಚಿರುತ್ತದೆ.', is_published: true }
    ]);

    // 6. Seed Footer Links
    await supabase.from('cms_footer_links').insert([
      { branch_id: branchId, title_en: 'Privacy Policy', title_kn: 'ಗೌಪ್ಯತಾ ನೀತಿ', url: '#', sort_order: 1 },
      { branch_id: branchId, title_en: 'Terms of Use', title_kn: 'ಬಳಕೆಯ ನಿಯಮಗಳು', url: '#', sort_order: 2 }
    ]);

    console.log("Seeding complete.");
    return { success: true, status: 'seeded' };

  } catch (err) {
    console.error("Seed failed:", err);
    return { success: false, error: err };
  }
};
