import { useState, useEffect } from 'react';
import api from '@/lib/api'; // Use the configured axios instance
import { PUBLIC_SITE_SEED } from '@/data/publicSiteSeed';

export const useSchoolPublicData = (slug) => {
  const [school, setSchool] = useState(null);
  const [settings, setSettings] = useState({});
  const [schoolData, setSchoolData] = useState(null); // For backward compatibility
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSchoolData = async () => {
      // 1. Safety Check: Don't fetch if slug is missing or is a reserved system route
      if (!slug || slug === 'undefined' || slug === 'null' || slug === 'master-admin' || slug === 'school-owner' || slug === 'login') {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 2. Fetch from Backend API (Phase-2)
        const response = await api.get(`/public/site/${slug}`);
        
        if (response.data && response.data.success) {
            const { school: schoolObj, settings: settingsObj, pages } = response.data.data;
            
            // Validate school object exists
            if (!schoolObj) {
              throw new Error("School data missing in API response");
            }

            // Set separate values (new pattern)
            setSchool(schoolObj);
            setSettings({
              ...settingsObj,
              pages: pages || []
            });
            
            // Also set combined schoolData for backward compatibility
            const mappedData = {
              ...settingsObj,
              schools: schoolObj,
              pages: pages || []
            };
            setSchoolData(mappedData);
        } else {
            throw new Error("Site not found");
        }

      } catch (err) {
        console.warn("API fetch failed, trying seed fallback:", err);
        
        // Phase-1 fallback: allow seeded content
        const seeded = PUBLIC_SITE_SEED?.[slug];
        if (seeded) {
          setSchool(seeded.schools);
          setSettings(seeded);
          setSchoolData(seeded); // backward compatibility
        } else {
          setError(err.message || 'Site not found');
          setSchool(null);
          setSettings({});
          setSchoolData(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSchoolData();
  }, [slug]);

  // Return both patterns for compatibility
  return { school, settings, schoolData, loading, error };
};
