import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import publicCmsService from '@/services/publicCmsService';
import { Loader2, MapPin, Phone, Mail, Send } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { PublicHeader, PublicFooter, TopBar } from '@/components/public/PublicLayoutComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/components/ui/use-toast";

const SchoolPublicContact = () => {
  const { schoolSlug } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const siteRes = await publicCmsService.getPublicSite(schoolSlug);
        if (siteRes.success) {
          setData({ 
            school: siteRes.data.school,
            settings: siteRes.data.settings, 
            menus: siteRes.data.menus
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [schoolSlug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast({
      title: "Success",
      description: "Message sent successfully! We will contact you soon.",
    });
    setSubmitting(false);
    e.target.reset();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center">School not found</div>;

  const { school, settings, menus } = data;

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-white dark:bg-gray-900 dark:text-white transition-colors duration-300">
      <Helmet><title>{`Contact Us | ${school?.name || settings?.homepage_title || 'School'}`}</title></Helmet>
      <TopBar settings={settings} />
      <PublicHeader settings={settings} menus={menus} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} slug={schoolSlug} />
      
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">Contact Us</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Contact Info */}
          <div>
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Get in Touch</h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-full mr-4 text-primary">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Address</h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">{settings.address || 'School Address Not Available'}</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-full mr-4 text-primary">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Phone</h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">{settings.phone || 'Not Available'}</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-full mr-4 text-primary">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Email</h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">{settings.email || 'Not Available'}</p>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="mt-8 bg-gray-100 dark:bg-gray-800 h-64 rounded-lg flex items-center justify-center text-gray-400">
              <MapPin className="w-12 h-12 mb-2" />
              <span className="sr-only">Map</span>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                  <Input required placeholder="John" className="dark:bg-gray-900 dark:border-gray-600" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                  <Input required placeholder="Doe" className="dark:bg-gray-900 dark:border-gray-600" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <Input type="email" required placeholder="john@example.com" className="dark:bg-gray-900 dark:border-gray-600" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                <Input type="tel" placeholder="+91 98765 43210" className="dark:bg-gray-900 dark:border-gray-600" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                <Textarea required placeholder="How can we help you?" className="min-h-[120px] dark:bg-gray-900 dark:border-gray-600" />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </main>
      
      <PublicFooter settings={settings} />
    </div>
  );
};

export default SchoolPublicContact;
