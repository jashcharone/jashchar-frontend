/**
 * SYNC CENTER PAGE
 * Centralized sync operations for plans and schools
 */

import React, { useState, useEffect } from 'react';
import { formatDateTime } from '@/utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Zap,
  Building2,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Play,
  Loader2,
  ChevronDown,
  ChevronRight,
  Server,
  Activity,
  Globe,
  Database,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import moduleRegistryApiService from '@/services/moduleRegistryApiService';
import { supabase } from '@/lib/supabaseClient';
import DashboardLayout from '@/components/DashboardLayout';

const SyncCenter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [schools, setSchools] = useState([]);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingPlan, setSyncingPlan] = useState(null);
  const [syncingSchool, setSyncingSchool] = useState(null);
  const [syncHistory, setSyncHistory] = useState([]);
  const [expandedSection, setExpandedSection] = useState('plans');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load plans
      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('id, name, slug, status')
        .order('name');
      
      // Load schools with their plan info
      const { data: schoolsData } = await supabase
        .from('schools')
        .select(`
          id, 
          name, 
          slug,
          status,
          subscription_plans:plan_id (id, name, slug)
        `)
        .eq('status', 'active')
        .order('name')
        .limit(100);

      // Load recent sync history
      const { data: historyData } = await supabase
        .from('module_sync_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      setPlans(plansData || []);
      setSchools(schoolsData || []);
      setSyncHistory(historyData || []);
    } catch (error) {
      console.error('Error loading sync data:', error);
      toast({ title: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAllPlans = async () => {
    try {
      setSyncingAll(true);
      toast({ title: 'Initiating Global Sync...', description: 'Propagating modules to all plans.' });
      
      await moduleRegistryApiService.syncToAllPlans();
      
      toast({ title: 'Global Sync Complete!', className: "bg-green-50 dark:bg-green-900/40 border-green-200 dark:border-green-700 dark:text-green-100" });
      loadData();
    } catch (error) {
      toast({ title: 'Sync failed', variant: 'destructive' });
    } finally {
      setSyncingAll(false);
    }
  };

  const handleSyncPlan = async (planId, planName) => {
    try {
      setSyncingPlan(planId);
      toast({ title: `Syncing Plan: ${planName}` });
      
      await moduleRegistryApiService.syncToPlan(planId);
      
      toast({ title: `Plan ${planName} synced successfully!` });
      loadData();
    } catch (error) {
      toast({ title: 'Sync failed', variant: 'destructive' });
    } finally {
      setSyncingPlan(null);
    }
  };

  const handleSyncPlanSchools = async (planId, planName) => {
    try {
      setSyncingPlan(`schools-${planId}`);
      toast({ title: `Broadcasting to all schools in ${planName}...` });
      
      await moduleRegistryApiService.syncPlanSchools(planId);
      
      toast({ title: `Broadcasting complete!` });
      loadData();
    } catch (error) {
      toast({ title: 'Sync failed', variant: 'destructive' });
    } finally {
      setSyncingPlan(null);
    }
  };

  const handleSyncSchool = async (branchId, schoolName) => {
    try {
      setSyncingSchool(branchId);
      toast({ title: `Syncing School: ${schoolName}` });
      
      await moduleRegistryApiService.syncSchoolPermissions(branchId);
      
      toast({ title: `School synced successfully!` });
    } catch (error) {
      toast({ title: 'Sync failed', variant: 'destructive' });
    } finally {
      setSyncingSchool(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 dark:text-indigo-400 mb-4" />
          <p className="text-gray-500 animate-pulse font-medium">Connecting to Sync Node...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
    <div className="min-h-screen bg-slate-50/50 dark:bg-black/20 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <button
               onClick={() => navigate('/master-admin/module-registry')}
               className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-2 transition-colors"
            >
               <ArrowLeft className="w-4 h-4" />
               <span>Back to Registry</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              Sync Ops Center
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
              Manage the propagation of module definitions and permissions across the entire platform ecosystem.
            </p>
          </div>
          
          <button
            onClick={handleSyncAllPlans}
            disabled={syncingAll}
            className={`px-8 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white rounded-xl flex items-center gap-3 hover:opacity-90 transition shadow-xl shadow-indigo-500/20 font-semibold text-lg relative overflow-hidden group disabled:opacity-70 ${syncingAll ? 'cursor-not-allowed' : ''}`}
          >
             {syncingAll && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
            {syncingAll ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Zap className="w-6 h-6 group-hover:scale-110 transition-transform" />
            )}
            {syncingAll ? 'Broadcasting Updates...' : 'Global Sync'}
          </button>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Server className="w-24 h-24 text-blue-600" />
              </div>
              <div className="relative z-10">
                 <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Subscription Plans</p>
                 <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{plans.length}</h3>
                 <div className="mt-4 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <Activity className="w-4 h-4" />
                    <span>All services operational</span>
                 </div>
              </div>
           </div>

           <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Building2 className="w-24 h-24 text-purple-600" />
              </div>
              <div className="relative z-10">
                 <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Active Tenants (Schools)</p>
                 <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{schools.length}</h3>
                 <div className="mt-4 flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                    <Globe className="w-4 h-4" />
                    <span>Live connections</span>
                 </div>
              </div>
           </div>

           <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Database className="w-24 h-24 text-green-600" />
              </div>
              <div className="relative z-10">
                 <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Last Global Sync</p>
                 <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                    {syncHistory.length > 0 ? new Date(syncHistory[0].created_at).toLocaleTimeString() : 'Never'}
                 </h3>
                 <div className="mt-4 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                     <span>System Healthy</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Sync Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-6 flex flex-col md:flex-row gap-6 items-start">
           <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
              <AlertTriangle className="w-6 h-6" />
           </div>
           <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-300">Synchronization Architecture</h3>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1 max-w-3xl">
                 Sync operations propagate module definitions from the Master Registry to Subscription Plans (`plan_modules`), which then cascade to individual School Roles (`role_permissions`). This ensures consistency across the platform.
              </p>
              <div className="flex flex-wrap gap-4 mt-4 text-xs font-mono text-blue-600 dark:text-blue-400">
                 <span className="bg-white/50 dark:bg-black/20 px-2 py-1 rounded border border-blue-200 dark:border-blue-800">Master Registry → Plans</span>
                 <span className="bg-white/50 dark:bg-black/20 px-2 py-1 rounded border border-blue-200 dark:border-blue-800">Plans → Schools</span>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plans Section */}
          <section className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  <h2 className="font-semibold text-gray-900 dark:text-white">Subscription Tiers</h2>
               </div>
               <span className="text-xs font-medium bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300">{plans.length}</span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {plans.map(plan => (
                  <div
                    key={plan.id}
                    className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900 dark:text-white text-lg">{plan.name}</span>
                        {plan.status ? (
                          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        )}
                      </div>
                      <code className="text-xs text-gray-400 mt-1 block">{plan.slug} Plan</code>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                       {/* Sync Plan Button */}
                      <button
                        onClick={() => handleSyncPlan(plan.id, plan.name)}
                        disabled={syncingPlan === plan.id}
                        className="px-4 py-2 text-sm bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors font-medium border border-indigo-100 dark:border-indigo-900/50"
                      >
                        {syncingPlan === plan.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        Sync Defs
                      </button>

                      {/* Broadcast Schools Button */}
                      <button
                        onClick={() => handleSyncPlanSchools(plan.id, plan.name)}
                        disabled={syncingPlan === `schools-${plan.id}`}
                        className="px-4 py-2 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors font-medium border border-purple-100 dark:border-purple-900/50"
                      >
                        {syncingPlan === `schools-${plan.id}` ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Building2 className="w-4 h-4" />
                        )}
                        Broadcast
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </section>

          {/* Schools Section */}
          <section className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  <h2 className="font-semibold text-gray-900 dark:text-white">Tenant Schools</h2>
               </div>
               <span className="text-xs font-medium bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300">{schools.length} Active</span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800 overflow-y-auto max-h-[600px] flex-1">
                {schools.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                     <Building2 className="w-10 h-10 mb-2 opacity-50" />
                     <p>No active schools found</p>
                  </div>
                ) : (
                  schools.map(school => (
                    <div
                      key={school.id}
                      className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                    >
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white block group-hover:text-indigo-600 transition-colors">
                            {school.name}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                             <span className={`w-2 h-2 rounded-full ${school.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                             <span className="text-xs text-gray-500 dark:text-gray-400">
                                {school.subscription_plans?.name || 'No Plan Assigned'}
                            </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleSyncSchool(school.id, school.name)}
                        disabled={syncingSchool === school.id}
                        className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300 disabled:opacity-50 flex items-center gap-1 transition-all"
                      >
                        {syncingSchool === school.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                        Sync
                      </button>
                    </div>
                  ))
                )}
            </div>
          </section>
        </div>

        {/* Recent Sync History */}
        <section className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Audit Trail & Sync Logs</h2>
            </div>
          </div>
          
          <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800/50">
                   <tr>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Operation Type</th>
                      <th className="px-6 py-3">Target</th>
                      <th className="px-6 py-3">Modules Affected</th>
                      <th className="px-6 py-3 text-right">Timestamp</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                   {syncHistory.length === 0 ? (
                      <tr>
                         <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No logs recorded yet.</td>
                      </tr>
                   ) : (
                      syncHistory.map(log => (
                         <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-6 py-4">
                               {log.sync_status === 'success' ? (
                                  <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full w-fit text-xs">
                                     <CheckCircle className="w-3 h-3" /> Success
                                  </span>
                               ) : (
                                  <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full w-fit text-xs">
                                     <XCircle className="w-3 h-3" /> Failed
                                  </span>
                               )}
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-200 capitalize">
                               {log.sync_type?.replace('_', ' ') || 'Manual Sync'}
                            </td>
                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                               {log.target_type || 'System'}
                            </td>
                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                               <span className="font-mono">{log.modules_synced || 0}</span> updates
                            </td>
                            <td className="px-6 py-4 text-right text-gray-500 font-mono text-xs">
                               {formatDateTime(log.created_at)}
                            </td>
                         </tr>
                      ))
                   )}
                </tbody>
             </table>
          </div>
        </section>
      </div>
    </div>
    </DashboardLayout>
  );
};

export default SyncCenter;
