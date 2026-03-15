import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import PublicSchoolLayout from '@/components/public/PublicSchoolLayout';
import { useSchoolSlug } from '@/hooks/useSchoolSlug';
import { useSchoolPublicData } from '@/hooks/useSchoolPublicData';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';

const formatSlugTitle = (slug) => {
  if (!slug) return 'Page';
  return slug
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
};

const PageShell = ({ title, children }) => (
  <>
    <div className="bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{title}</h1>
        <div className="text-sm text-gray-500">Home / {title}</div>
      </div>
    </div>

    <div className="container mx-auto px-4 py-12 min-h-[400px]">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">{children}</div>
    </div>
  </>
);

const SchoolSubpage = ({ variant, title }) => {
  const schoolSlug = useSchoolSlug();
  const { schoolData, loading, error } = useSchoolPublicData(schoolSlug);
  const { pageSlug } = useParams();

  const school = schoolData?.schools;
  const settings = schoolData;
  const content = schoolData?.website_content;

  const resolvedTitle = useMemo(() => {
    if (title) return title;
    if (variant === 'page') {
      const seededTitle = content?.pages?.[pageSlug]?.title;
      return seededTitle || formatSlugTitle(pageSlug);
    }

    if (variant === 'online_course') return 'Online Course';
    if (variant === 'online_admission') return 'Online Admission';
    if (variant === 'examresult') return 'Exam Result';
    if (variant === 'annual_calendar') return 'Annual Calendar';
    return 'Page';
  }, [content?.pages, pageSlug, title, variant]);

  const pageTitle = `${resolvedTitle} | ${content?.meta?.siteTitle || school?.name || 'School'}`;
  const pageDescription =
    content?.meta?.defaultDescription || 'Sample Phase 1 page content (placeholder).';

  const displayTitle = title || (pageSlug ? pageSlug.replace(/-/g, ' ').toUpperCase() : 'Page');

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c70039]"></div></div>;
  }

  if (!school) {
    return <div className="min-h-screen flex items-center justify-center">{error || 'School not found'}</div>;
  }

  const renderPageVariant = () => {
    // Route templates (Phase 1)
    if (variant === 'online_course') {
      return (
        <PageShell title={resolvedTitle}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-3">Course Enquiry</h2>
              <p className="text-sm text-gray-600 mb-6">
                This is a Phase-1 template. It mirrors structure and form layout using dummy fields.
              </p>
              <div className="grid grid-cols-1 gap-3">
                <input className="border rounded-md px-3 py-2" placeholder="Student Name" aria-label="Student Name" />
                <input className="border rounded-md px-3 py-2" placeholder="Phone" aria-label="Phone" />
                <input className="border rounded-md px-3 py-2" placeholder="Email" aria-label="Email" />
                <select className="border rounded-md px-3 py-2" aria-label="Course">
                  <option>Select Course</option>
                  <option>Primary</option>
                  <option>Middle</option>
                  <option>Secondary</option>
                </select>
                <Button className="bg-[#c70039] hover:bg-[#a0002d] rounded-sm">Submit</Button>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-3">Available Courses</h2>
              <div className="space-y-4">
                {['Primary Program', 'Middle School Program', 'Senior Program'].map((item) => (
                  <div key={item} className="border rounded-md p-4">
                    <div className="font-semibold text-gray-800">{item}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Sample placeholder description about curriculum, timing, and learning outcomes.
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PageShell>
      );
    }

    if (variant === 'online_admission') {
      return (
        <PageShell title={resolvedTitle}>
          <p className="text-sm text-gray-600 mb-6">
            Phase-1 admission template with dummy fields. Phase 2 will save this data.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border rounded-md px-3 py-2" placeholder="Student Name" aria-label="Student Name" />
            <input className="border rounded-md px-3 py-2" placeholder="Date of Birth" aria-label="Date of Birth" />
            <input className="border rounded-md px-3 py-2" placeholder="Class Applying For" aria-label="Class Applying For" />
            <input className="border rounded-md px-3 py-2" placeholder="Parent Phone" aria-label="Parent Phone" />
            <input className="border rounded-md px-3 py-2" placeholder="Parent Email" aria-label="Parent Email" />
            <input className="border rounded-md px-3 py-2" placeholder="Address" aria-label="Address" />
          </div>
          <div className="mt-6">
            <Button className="bg-[#c70039] hover:bg-[#a0002d] rounded-sm">Submit Application</Button>
          </div>
        </PageShell>
      );
    }

    if (variant === 'examresult') {
      return (
        <PageShell title={resolvedTitle}>
          <p className="text-sm text-gray-600 mb-6">
            Phase-1 result lookup template. The search is UI-only for now.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="border rounded-md px-3 py-2" placeholder="Admission No." aria-label="Admission Number" />
            <input className="border rounded-md px-3 py-2" placeholder="Date of Birth" aria-label="Date of Birth" />
            <Button className="bg-[#c70039] hover:bg-[#a0002d] rounded-sm">Search</Button>
          </div>
          <div className="mt-8 text-sm text-gray-500">
            Result preview will appear here after Phase 2 API integration.
          </div>
        </PageShell>
      );
    }

    if (variant === 'annual_calendar') {
      return (
        <PageShell title={resolvedTitle}>
          <p className="text-sm text-gray-600 mb-6">
            Phase-1 calendar template. Replace with real entries via Front-CMS in Phase 2.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-sm font-semibold px-4 py-3 border">Date</th>
                  <th className="text-left text-sm font-semibold px-4 py-3 border">Activity</th>
                  <th className="text-left text-sm font-semibold px-4 py-3 border">Notes</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { date: '2025-12-15', activity: 'Orientation Program', notes: 'Auditorium' },
                  { date: '2025-12-22', activity: 'Science Exhibition', notes: 'Main Campus Hall' },
                  { date: '2025-12-27', activity: 'Sports Practice Day', notes: 'Playground' },
                ].map((row) => (
                  <tr key={row.date}>
                    <td className="px-4 py-3 border text-sm">{row.date}</td>
                    <td className="px-4 py-3 border text-sm">{row.activity}</td>
                    <td className="px-4 py-3 border text-sm text-gray-600">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PageShell>
      );
    }

    // /page/:pageSlug templates
    if (variant === 'page') {
      if (pageSlug === 'news') {
        const items = content?.news || [];
        return (
          <PageShell title={resolvedTitle}>
            <div className="space-y-4">
              {items.map((n) => (
                <div key={n.id} className="border rounded-md p-4">
                  <div className="text-xs text-gray-500">{n.date}</div>
                  <div className="font-semibold text-gray-800 mt-1">{n.title}</div>
                  <div className="text-sm text-gray-600 mt-2">{n.summary}</div>
                </div>
              ))}
              {!items.length && <div className="text-sm text-gray-500">No news available.</div>}
            </div>
          </PageShell>
        );
      }

      if (pageSlug === 'events') {
        const items = content?.events || [];
        return (
          <PageShell title={resolvedTitle}>
            <div className="space-y-4">
              {items.map((e) => (
                <div key={e.id} className="border rounded-md p-4">
                  <div className="text-xs text-gray-500">{e.date} • {e.time}</div>
                  <div className="font-semibold text-gray-800 mt-1">{e.title}</div>
                  <div className="text-sm text-gray-600 mt-2">Location: {e.location}</div>
                </div>
              ))}
              {!items.length && <div className="text-sm text-gray-500">No events available.</div>}
            </div>
          </PageShell>
        );
      }

      if (pageSlug === 'gallery') {
        const items = content?.gallery || [];
        return (
          <PageShell title={resolvedTitle}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {items.map((g) => (
                <div key={g.id} className="border rounded-md overflow-hidden">
                  <img
                    src={g.imageUrl}
                    alt={g.title}
                    className="w-full h-36 object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900&q=80&auto=format&fit=crop';
                    }}
                  />
                  <div className="px-3 py-2 text-sm text-gray-700">{g.title}</div>
                </div>
              ))}
              {!items.length && <div className="text-sm text-gray-500">No gallery items available.</div>}
            </div>
          </PageShell>
        );
      }

      if (pageSlug === 'contact-us') {
        return (
          <PageShell title={resolvedTitle}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3">Get In Touch</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Phase-1 contact template with dummy form fields.
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <input className="border rounded-md px-3 py-2" placeholder="Name" aria-label="Name" />
                  <input className="border rounded-md px-3 py-2" placeholder="Email" aria-label="Email" />
                  <input className="border rounded-md px-3 py-2" placeholder="Phone" aria-label="Phone" />
                  <textarea className="border rounded-md px-3 py-2 min-h-[110px]" placeholder="Message" aria-label="Message" />
                  <Button className="bg-[#c70039] hover:bg-[#a0002d] rounded-sm">Send</Button>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3">Contact Information</h2>
                <div className="text-sm text-gray-700 space-y-2">
                  <div><span className="font-semibold">Phone:</span> {settings?.phone || school?.contact_number}</div>
                  <div><span className="font-semibold">Email:</span> {settings?.email || school?.contact_email}</div>
                  <div><span className="font-semibold">Address:</span> {settings?.address || school?.address}</div>
                </div>
                <div className="mt-6 border rounded-md overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">Map Preview</div>
                  <div className="p-6 text-sm text-gray-500">Map integration can be added in Phase 3 (or earlier if you prefer).</div>
                </div>
              </div>
            </div>
          </PageShell>
        );
      }

      const page = content?.pages?.[pageSlug];
      return (
        <PageShell title={resolvedTitle}>
          {page?.sections?.length ? (
            <div className="space-y-8">
              {page.sections.map((s, idx) => (
                <div key={idx}>
                  <h2 className="text-xl font-bold text-gray-800">{s.heading}</h2>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <h2 className="text-xl font-semibold mb-2">Content Coming Soon</h2>
              <p>This page is currently under construction.</p>
            </div>
          )}
        </PageShell>
      );
    }

    // default
    return (
      <PageShell title={resolvedTitle}>
        <div className="text-center text-gray-500 py-12">
          <h2 className="text-xl font-semibold mb-2">Content Coming Soon</h2>
          <p>This page is currently under construction.</p>
        </div>
      </PageShell>
    );
  };

  return (
    <PublicSchoolLayout school={school} settings={settings} alias={schoolSlug}>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
      </Helmet>
      {renderPageVariant()}
    </PublicSchoolLayout>
  );
};

export default SchoolSubpage;
