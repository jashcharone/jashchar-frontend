import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { School, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const MasterAdminSchoolHeader = () => {
  const { user } = useAuth();
  const [schoolName, setSchoolName] = useState('');
  const targetSchoolId = sessionStorage.getItem('ma_target_branch_id');

  useEffect(() => {
    if (targetSchoolId && targetSchoolId !== 'null' && targetSchoolId !== 'undefined') {
      fetchSchoolName();
    }
  }, [targetSchoolId]);

  const fetchSchoolName = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('name')
        .eq('id', targetSchoolId)
        .single();
      
      if (data) {
        setSchoolName(data.name);
      }
    } catch (error) {
      console.error('Error fetching school name:', error);
    }
  };

  // Strict check: Only show if user is Master Admin AND targetSchoolId is set
  const isMasterAdmin = user?.user_metadata?.role === 'master_admin';
  if (!isMasterAdmin || !targetSchoolId || targetSchoolId === 'null' || targetSchoolId === 'undefined' || !schoolName) return null;

  return (
    <div className="mb-8 group relative overflow-hidden rounded-xl border border-indigo-100 dark:border-indigo-900 bg-white dark:bg-slate-950 shadow-lg shadow-indigo-100/50 dark:shadow-none transition-all duration-300 hover:shadow-indigo-200/50 dark:hover:shadow-indigo-900/20">
      {/* Gradient Background Accent */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 via-white to-purple-50 dark:from-indigo-950/20 dark:via-slate-950 dark:to-purple-950/20 opacity-80" />
      
      {/* Left Accent Bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 to-purple-600" />

      <div className="relative p-5 flex items-center justify-between">
        <div className="flex items-center gap-5">
          {/* Icon Container with Glow */}
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-20 rounded-full" />
            <div className="relative h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-inner border border-white/20">
              <School className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Text Content */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Master Admin Mode
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              {schoolName}
              <ShieldCheck className="h-4 w-4 text-green-500" />
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              You are currently managing this school's Front CMS settings.
            </p>
          </div>
        </div>

        {/* Right Side Decoration (Optional) */}
        <div className="hidden md:block opacity-10 transform translate-x-4">
           <School className="h-24 w-24 text-indigo-900 dark:text-indigo-100" />
        </div>
      </div>
    </div>
  );
};

export default MasterAdminSchoolHeader;
