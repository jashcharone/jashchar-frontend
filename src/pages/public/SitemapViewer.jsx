import React, { useEffect, useState } from 'react';
import { useSchoolSlug } from '@/hooks/useSchoolSlug';
import { generateSchoolSitemap } from '@/utils/generateSitemap';

const SitemapViewer = () => {
  const schoolSlug = useSchoolSlug();
  const [xml, setXml] = useState('');

  useEffect(() => {
    if (schoolSlug) {
      generateSchoolSitemap(schoolSlug).then(setXml);
    }
  }, [schoolSlug]);

  if (!xml) return <div>Generating sitemap...</div>;

  return (
    <div className="p-4 bg-gray-100 min-h-screen font-mono text-xs overflow-auto whitespace-pre-wrap">
        {xml}
    </div>
  );
};

export default SitemapViewer;
