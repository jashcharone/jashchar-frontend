import { supabase } from '@/lib/customSupabaseClient';

/**
 * Generates a sitemap XML string for a given school slug.
 * This is intended to be used by a route or edge function that serves /sitemap-{slug}.xml
 * @param {string} schoolSlug 
 * @returns {string} XML content
 */
export const generateSchoolSitemap = async (schoolSlug) => {
  const baseUrl = window.location.origin;
  
  try {
    // Resolve school
    const { data: school } = await supabase
      .from('schools')
      .select('id')
      .eq('cms_url_alias', schoolSlug)
      .single();

    if (!school) return '';

    const branchId = school.id;
    const urls = [
      `${baseUrl}/${schoolSlug}`,
      `${baseUrl}/${schoolSlug}/news`,
      `${baseUrl}/${schoolSlug}/events`,
      `${baseUrl}/${schoolSlug}/gallery`,
      `${baseUrl}/${schoolSlug}/admission`,
      `${baseUrl}/${schoolSlug}/login`
    ];

    // Fetch dynamic pages
    const { data: pages } = await supabase
      .from('cms_pages')
      .select('slug, updated_at')
      .eq('branch_id', branchId)
      .eq('is_published', true);

    if (pages) {
      pages.forEach(p => {
        urls.push(`${baseUrl}/${schoolSlug}/pages/${p.slug}`);
      });
    }

    // Build XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map(url => `
  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
</urlset>`;

    return xml;
  } catch (error) {
    console.error("Sitemap generation error", error);
    return '';
  }
};
