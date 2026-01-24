import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import { Helmet } from 'react-helmet';
import LoadingFallback from '@/components/LoadingFallback';

function SchoolLogin() {
  const { alias } = useParams();
  const { signIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState(null);
  const [loginSettings, setLoginSettings] = useState({});

  useEffect(() => {
    const fetchSchoolInfo = async () => {
      setLoading(true);
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .select('id, name, logo_url, cms_url_alias, status')
        .eq('cms_url_alias', alias)
        .maybeSingle();

      if (schoolError || !schoolData) {
        console.error('Error fetching school:', schoolError?.message);
        toast({ variant: 'destructive', title: 'Invalid School', description: "The school you're trying to access doesn't exist." });
        navigate('/');
        return;
      }
      
      // ✅ Check if school is inactive
      if (schoolData.status === 'Inactive') {
        toast({ 
          variant: 'destructive', 
          title: 'School Account Inactive', 
          description: 'This school account has been deactivated. Please contact your administrator.',
          duration: 10000
        });
        navigate('/');
        return;
      }
      
      setSchool(schoolData);

            const { data: settingsData, error: settingsError } = await supabase
        .from('login_page_settings')
        .select('setting_value')
        .eq('branch_id', schoolData.id)
        .eq('setting_key', 'school_login_config')
        .maybeSingle();

      if (settingsError) {
        console.error('Error fetching login settings:', settingsError.message);
      }
      
      if (settingsData?.setting_value) {
        setLoginSettings(settingsData.setting_value);
      }
      
      setLoading(false);
    };

    fetchSchoolInfo();
  }, [alias, navigate, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!school) {
      toast({ variant: 'destructive', title: 'Error', description: 'School not identified. Cannot log in.' });
      return;
    }
    await signIn(identifier, password, school.id);
  };

  if (loading) {
    return <LoadingFallback />;
  }

  const pageStyle = {
    backgroundColor: loginSettings.page_background_color || '#f3f4f6',
  };

  const cardStyle = {
    backgroundColor: loginSettings.form_background_color || '#ffffff',
    color: loginSettings.form_text_color || '#000000',
  };
  
  const buttonStyle = {
    backgroundColor: loginSettings.button_color || '#1f2937',
    color: loginSettings.button_text_color || '#ffffff',
    '--button-hover-color': loginSettings.button_hover_color || '#374151',
  };

  return (
    <>
      <Helmet>
          <title>{`${school?.name || 'School'} Login`}</title>
          <meta name="description" content={`Login page for ${school?.name || 'our school'}.`} />
      </Helmet>
      <div className="flex items-center justify-center min-h-screen p-4" style={pageStyle}>
        <style>
          {`
            .hover-bg-dynamic:hover {
              background-color: var(--button-hover-color) !important;
            }
          `}
        </style>
        <Card className="w-full max-w-sm" style={cardStyle}>
          <CardHeader className="text-center">
            {school?.logo_url ? (
              <img src={school.logo_url} alt={`${school.name} Logo`} className="mx-auto h-16 w-auto" />
            ) : (
              <CardTitle className="text-2xl font-bold" style={{ color: cardStyle.color }}>{school.name}</CardTitle>
            )}
            <CardDescription style={{ color: cardStyle.color, opacity: 0.8 }}>Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier" style={{ color: cardStyle.color }}>Username or Email</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="john.doe"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={authLoading}
                />
              </div>
              <div className="space-y-2 relative">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" style={{ color: cardStyle.color }}>Password</Label>
                  <Link to={`/forgot-password?school=${alias}`} className="text-sm text-blue-600 hover:underline" style={{ color: loginSettings.link_color || '#2563eb' }}>
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={authLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <Button type="submit" className="w-full hover-bg-dynamic" disabled={authLoading} style={buttonStyle}>
                {authLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default SchoolLogin;
