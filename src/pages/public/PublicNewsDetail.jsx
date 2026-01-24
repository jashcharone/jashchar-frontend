import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSchoolSlug } from '@/hooks/useSchoolSlug';
import { useSchoolPublicData } from '@/hooks/useSchoolPublicData';
import PublicSchoolHeader from '@/components/public/PublicSchoolHeader';
import PublicSchoolFooter from '@/components/public/PublicSchoolFooter';
import { supabase } from '@/lib/customSupabaseClient';
import { format } from 'date-fns';

const PublicNewsDetail = () => {
  const schoolAlias = useSchoolSlug();
  const { newsSlug } = useParams(); // newsSlug is actually ID for simplicity unless we add slugs to DB
  const { schoolData } = useSchoolPublicData(schoolAlias);
  const school = schoolData?.schools;
  const settings = schoolData;
  const [item, setItem] = useState(null);

  useEffect(() => {
    if (newsSlug) {
      supabase.from('cms_news').select('*').eq('id', newsSlug).single()
        .then(({ data }) => setItem(data));
    }
  }, [newsSlug]);

  if (!school || !item) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicSchoolHeader school={school} settings={settings} alias={schoolAlias} />
      <main className="flex-grow container mx-auto px-4 py-12">
        <article className="bg-white rounded-xl shadow-sm p-8 max-w-4xl mx-auto">
          {item.featured_image && <img src={item.featured_image} className="w-full h-[400px] object-cover rounded-lg mb-8" alt={item.title} />}
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{item.title}</h1>
          <div className="text-slate-500 mb-8 flex items-center gap-4">
            <span>{item.date ? format(new Date(item.date), 'MMMM dd, yyyy') : ''}</span>
          </div>
          <div className="prose max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: item.description }} />
        </article>
      </main>
      <PublicSchoolFooter school={school} settings={settings} alias={schoolAlias} />
    </div>
  );
};
export default PublicNewsDetail;
