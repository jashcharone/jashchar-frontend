import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Mail, Phone, User } from 'lucide-react';
import { Helmet } from 'react-helmet';
import HeroCarousel from '@/components/front-cms/HeroCarousel';

const SchoolHomepage = () => {
    const { alias } = useParams();
    const navigate = useNavigate();
    const [settings, setSettings] = useState(null);
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            // 1. Fetch Settings
            const { data: settingsData, error: settingsError } = await supabase
                .from('cms_settings')
                .select('*')
                .eq('cms_url_alias', alias)
                .eq('is_frontend_enabled', true)
                .single();

            if (settingsError || !settingsData) {
                console.error('Error fetching school settings or not found:', settingsError);
                navigate('/'); // Redirect to main SaaS homepage if alias not found
                return;
            }
            setSettings(settingsData);

            // 2. Fetch Banners (if school found)
            if (settingsData.branch_id) {
                const { data: bannersData } = await supabase
                    .from('front_cms_banners')
                    .select('*')
                    .eq('branch_id', settingsData.branch_id)
                    .eq('is_active', true)
                    .order('position');
                
                setBanners(bannersData || []);
            }
            
            setLoading(false);
        };

        fetchData();
    }, [alias, navigate]);

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading School Page...</div>;
    }

    if (!settings) {
        return null; // Redirect is handled in useEffect
    }
    
    const primaryColor = settings.primary_color || settings.theme_primary_color || '#c00000';
    const buttonHoverColor = settings.button_hover_color || settings.theme_button_hover_color || '#a00000';

    return (
        <div className="bg-background text-foreground">
            <Helmet>
                <title>{settings.cms_title || 'Welcome'}</title>
                <style type="text/css">{`
                    :root {
                        --school-primary: ${primaryColor};
                        --school-button-hover: ${buttonHoverColor};
                    }
                    .school-primary-btn { background-color: var(--school-primary); }
                    .school-primary-btn:hover { background-color: var(--school-button-hover); }
                    .school-primary-text { color: var(--school-primary); }
                `}</style>
            </Helmet>

            {/* Top Bar */}
            <header className="bg-card shadow-sm border-b border-border">
                <div className="bg-muted text-muted-foreground text-xs py-1">
                    <div className="container mx-auto px-4 flex justify-between items-center">
                        <span>Hours: {settings.working_hours || 'Mon To Fri - 9AM-06PM, Sunday Closed'}</span>
                        <div className="flex items-center gap-4">
                            <a href={`mailto:${settings.contact_email}`} className="flex items-center gap-1 hover:text-foreground"><Mail size={14} /> {settings.contact_email}</a>
                            <a href={`tel:${settings.contact_number || settings.mobile_no || settings.contact_mobile}`} className="flex items-center gap-1 hover:text-foreground"><Phone size={14} /> {settings.contact_number || settings.mobile_no || settings.contact_mobile}</a>
                            <Link to={`/${alias}/login`} className="flex items-center gap-1 font-semibold school-primary-text"><User size={14} /> Login</Link>
                        </div>
                    </div>
                </div>
                <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <img src={settings.logo_url || "https://images.unsplash.com/photo-1485531865381-286666aa80a9"} alt="School Logo" className="h-12" />
                    <ul className="flex items-center gap-6 text-sm font-medium">
                        {['Home', 'Teachers', 'Events', 'About Us', 'FAQ', 'Online Admission', 'Gallery', 'News', 'Contact Us'].map(item => (
                            <li key={item}><a href="#" className="hover:school-primary-text transition-colors">{item}</a></li>
                        ))}
                    </ul>
                </nav>
            </header>

            <main>
                {/* Hero Section */}
                <HeroCarousel banners={banners} settings={settings} />

                {/* Welcome Section */}
                <section className="py-20 bg-card">
                    <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-4xl font-bold">Welcome To Education</h2>
                            <h3 className="text-2xl school-primary-text font-semibold mt-1">We Will Give You Future</h3>
                            <p className="mt-4 text-muted-foreground">It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using content.</p>
                            <p className="mt-4 text-muted-foreground">Making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text.</p>
                        </div>
                        <div>
                            <img class="rounded-lg shadow-xl" alt="Students in a classroom" src="https://images.unsplash.com/photo-1679316481049-4f6549df499f" />
                        </div>
                    </div>
                </section>
                
                {/* Call to Action Bar */}
                <section className="py-12 bg-gray-800 text-white">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-3xl font-bold">{settings.cms_title}</h2>
                        <p className="mt-2 max-w-2xl mx-auto">Making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text.</p>
                    </div>
                </section>

                {/* Why Choose Us */}
                <section className="py-20 bg-card">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-4xl font-bold">WHY CHOOSE US</h2>
                        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">Lorem Ipsum is simply dummy text of the printing and typesetting industry.</p>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-16 bg-gray-200 dark:bg-gray-900">
                    <div className="container mx-auto px-4 flex justify-between items-center bg-gray-700 text-white p-12 rounded-lg">
                        <div>
                            <h3 className="text-2xl font-bold">Request for a free Education Class</h3>
                            <p className="text-5xl font-bold mt-2">{settings.contact_mobile}</p>
                        </div>
                        <Button className="school-primary-btn text-white px-8 py-6 text-lg">Request Now</Button>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 text-gray-300">
                <div className="container mx-auto px-4 py-16 grid md:grid-cols-4 gap-8">
                    <div>
                        <h4 className="font-bold text-white mb-4">{settings.cms_title}</h4>
                        <p className="text-sm">{settings.footer_about_text || 'If you are going to use a passage Lorisum, you anythirassing hidden in the middle of text.'}</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-4">Address</h4>
                        <p className="text-sm">{settings.address}</p>
                        <p className="text-sm mt-2">{settings.contact_mobile}</p>
                        <p className="text-sm mt-2">{settings.contact_email}</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-4">Quick Links</h4>
                        <ul className="text-sm space-y-2">
                            <li><a href="#" className="hover:text-white">Home</a></li>
                            <li><a href="#" className="hover:text-white">About Us</a></li>
                            <li><a href="#" className="hover:text-white">Online Admission</a></li>
                            <li><a href="#" className="hover:text-white">Contact Us</a></li>
                        </ul>
                    </div>
                </div>
                <div className="bg-gray-900 py-4">
                    <div className="container mx-auto px-4 text-center text-xs text-gray-500">
                        {settings.footer_copyright_text || 'COPYRIGHT Â© 2025. ALL RIGHTS RESERVED.'}
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default SchoolHomepage;
