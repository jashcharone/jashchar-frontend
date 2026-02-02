import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, GraduationCap, Sparkles, Play, Building2 } from 'lucide-react';
import { Helmet } from 'react-helmet';

// Demo credentials for all schools
// Note: Student login uses admission_number@student.jashchar.local format (lowercase)
// Parent login uses mobilenumber@parent.jashchar.local format (with 91 prefix)
const DEMO_SCHOOLS = [
  {
    name: 'Jashchar ICSE School',
    key: 'ICSE School',
    color: '#d97706', // amber
    roles: {
      'Super Admin': { email: 'jashchar2025@gmail.com', password: '@123456', displayLogin: 'jashchar2025@gmail.com' },
      'Admin': null, // Need to create admin user via Human Resource module
      'Principal': null, // Not yet configured - Add staff via Human Resource module
      'Teacher': null, // Not yet configured - Add staff via Human Resource module
      'Accountant': null, // Not yet configured - Add staff via Human Resource module
      'Librarian': null, // Not yet configured - Add staff via Human Resource module
      'Parent': { email: '917676505840@parent.jashchar.local', password: '789456', displayLogin: '7676505840' },
      'Student': { email: 'jash-2026-0003@student.jashchar.local', password: '789456', displayLogin: 'JASH-2026-0003' },
    }
  },
  {
    name: 'Jashchar PU College',
    key: 'PU College',
    color: '#059669', // emerald
    roles: {
      'Super Admin': null, // Not yet configured
      'Admin': null, // Not yet configured
      'Principal': null, // Not yet configured
      'Teacher': null, // Not yet configured
      'Accountant': null, // Not yet configured
      'Librarian': null, // Not yet configured
      'Parent': null, // Not yet configured
      'Student': null, // Not yet configured
    }
  }
];

const ROLE_ORDER = ['Super Admin', 'Admin', 'Teacher', 'Accountant', 'Librarian', 'Parent', 'Student'];

const DemoLoginPage = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(null); // {school, role}

  const handleDemoLogin = async (schoolKey, role, creds) => {
    if (!creds) {
      toast({ variant: "destructive", title: "Not Available", description: `Demo not available for ${role}` });
      return;
    }
    
    setLoading({ school: schoolKey, role });
    
    try {
      const { data, error } = await signIn(creds.email, creds.password, true);
      if (error) throw error;

      // Store demo mode flag for logout redirect
      sessionStorage.setItem('demo_mode', 'true');

      toast({ 
        title: "🎉 Demo Login Success!", 
        description: `Welcome! Logged in as ${role}` 
      });

      const signedInUser = data?.user || data?.session?.user;
      let userRole = signedInUser?.user_metadata?.role;

      if (!userRole && signedInUser?.id) {
        const { data: branchUserData } = await supabase
          .from('branch_users')
          .select('role:roles(name)')
          .eq('user_id', signedInUser.id)
          .maybeSingle();

        if (branchUserData?.role?.name) {
          userRole = branchUserData.role.name.toLowerCase().replace(/\s+/g, '_');
        }
      }

      // Each role has their own dashboard URL
      const roleDashboards = {
        'super_admin': '/super-admin/dashboard',
        'school_owner': '/super-admin/dashboard',
        'organization_owner': '/super-admin/dashboard',
        'master_admin': '/master-admin/dashboard',
        'admin': '/Admin/dashboard',
        'principal': '/Principal/dashboard',
        'teacher': '/Teacher/dashboard',
        'student': '/Student/dashboard',
        'parent': '/Parent/dashboard',
        'accountant': '/Accountant/dashboard',
        'receptionist': '/Receptionist/dashboard',
        'librarian': '/Librarian/dashboard'
      };
      
      const target = roleDashboards[userRole] || '/super-admin/dashboard';
      navigate(target, { replace: true });
    } catch (error) {
      toast({ variant: "destructive", title: "Login Failed", description: error.message });
      setLoading(null);
    }
  };

  const handleSuperAdminLogin = async () => {
    setLoading({ school: 'super', role: 'SuperAdmin' });
    try {
      // Use main super admin account
      const { data, error } = await signIn('jashchar2025@gmail.com', '@123456', true);
      if (error) throw error;
      
      // Store demo mode flag for logout redirect
      sessionStorage.setItem('demo_mode', 'true');
      
      toast({ title: "🚀 Super Admin Access!", description: "Full system access granted" });
      navigate('/super-admin/dashboard', { replace: true });
    } catch (error) {
      toast({ variant: "destructive", title: "Login Failed", description: error.message });
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-amber-50">
      <Helmet><title>Demo Login - JashChar ERP</title></Helmet>
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-50">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f43f5e' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg mb-6">
            <GraduationCap className="h-8 w-8 text-rose-500" />
            <span className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-amber-500 text-transparent bg-clip-text">
              JashChar ERP
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
            Demo Login Portal
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Click on any role to instantly login and explore the system. 
            Experience the power of JashChar ERP with real data.
          </p>
        </div>

        {/* Super Admin Button */}
        <div className="flex justify-center mb-10">
          <Button
            onClick={handleSuperAdminLogin}
            disabled={loading !== null}
            className="h-14 px-10 text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            {loading?.role === 'SuperAdmin' ? (
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-6 w-6 mr-2" />
            )}
            SuperAdmin
          </Button>
        </div>

        {/* Schools Grid */}
        <div className="space-y-8">
          {DEMO_SCHOOLS.map((school) => (
            <div 
              key={school.key}
              className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 md:p-8"
            >
              {/* School Header */}
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: school.color + '20' }}
                >
                  <Building2 className="h-6 w-6" style={{ color: school.color }} />
                </div>
                <h2 
                  className="text-xl md:text-2xl font-bold"
                  style={{ color: school.color }}
                >
                  {school.name}
                </h2>
              </div>

              {/* Role Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {ROLE_ORDER.map((role) => {
                  const creds = school.roles[role];
                  const isLoading = loading?.school === school.key && loading?.role === role;
                  
                  return (
                    <Button
                      key={role}
                      onClick={() => handleDemoLogin(school.key, role, creds)}
                      disabled={loading !== null || !creds}
                      className={`
                        h-12 font-semibold rounded-xl transition-all duration-300
                        ${creds 
                          ? 'bg-slate-800 hover:bg-slate-700 text-white hover:scale-105 shadow-lg hover:shadow-xl' 
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }
                      `}
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        role
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-slate-500 text-sm">
          <p className="flex items-center justify-center gap-2">
            <Play className="h-4 w-4" />
            Click any button to instantly login as that role
          </p>
          <p className="mt-2">
            Powered by <span className="font-semibold text-slate-700">JashChar ERP</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DemoLoginPage;
