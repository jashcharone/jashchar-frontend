/**
 * MODULE REGISTRY DASHBOARD
 * Central dashboard for managing all modules
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  RefreshCw,
  Search,
  ChevronRight,
  ChevronDown,
  Box,
  Layers,
  Settings,
  Activity,
  History,
  FileText,
  ArrowUpDown,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Shield,
  Smartphone,
  Globe,
  LayoutGrid,
  CreditCard,
  Package,
  Check,
  X
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import moduleRegistryApiService from '@/services/moduleRegistryApiService';
import { supabase } from '@/lib/supabaseClient';
import DashboardLayout from '@/components/DashboardLayout';

const ModuleRegistryDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [moduleTree, setModuleTree] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [expandedModules, setExpandedModules] = useState(new Set());
  const [syncing, setSyncing] = useState(false);
  const [viewMode, setViewMode] = useState('tree'); // tree | list
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'plans' | 'master_admin'
  const [plans, setPlans] = useState([]);
  const [planModules, setPlanModules] = useState({});
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Compute master admin modules (category = 'master_admin')
  const masterAdminModules = useMemo(() => {
    return moduleTree.filter(m => m.category === 'master_admin');
  }, [moduleTree]);
  
  // Count all master admin modules including sub-modules
  const masterAdminModuleCount = useMemo(() => {
    let count = masterAdminModules.length;
    masterAdminModules.forEach(m => {
      count += (m.submodules?.length || 0);
    });
    return count;
  }, [masterAdminModules]);

  useEffect(() => {
    loadData();
    loadPlansWithModules();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading Module Registry data...');
      
      const [treeRes, statsRes, catRes] = await Promise.all([
        moduleRegistryApiService.getModuleTree(),
        moduleRegistryApiService.getStats(),
        moduleRegistryApiService.getCategories()
      ]);
      
      console.log('📦 Tree Response:', treeRes);
      console.log('📊 Stats Response:', statsRes);
      console.log('📁 Categories Response:', catRes);
      
      // Handle both response formats: direct array OR {data: array}
      const treeData = Array.isArray(treeRes) ? treeRes : (treeRes?.data || []);
      const statsData = statsRes?.total_modules !== undefined ? statsRes : (statsRes?.data || {});
      const catData = Array.isArray(catRes) ? catRes : (catRes?.data || []);
      
      setModuleTree(treeData);
      setStats(statsData);
      setCategories(catData);
    } catch (error) {
      console.error('❌ Error loading data:', error);
      toast({ 
        title: 'Failed to load data', 
        description: error.message || 'Check console for details',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPlansWithModules = async () => {
    try {
      // Load subscription plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('id, name, slug, status')
        .order('name');
      
      if (plansError) throw plansError;
      setPlans(plansData || []);

      // Load plan_modules for each plan
      const { data: pmData, error: pmError } = await supabase
        .from('plan_modules')
        .select('plan_id, module_key');
      
      if (pmError) throw pmError;
      
      // Group modules by plan
      const groupedModules = {};
      (pmData || []).forEach(pm => {
        if (!groupedModules[pm.plan_id]) {
          groupedModules[pm.plan_id] = [];
        }
        if (pm.module_key) {
          groupedModules[pm.plan_id].push(pm.module_key);
        }
      });
      setPlanModules(groupedModules);
      
      // Select first plan by default
      if (plansData?.length > 0) {
        setSelectedPlan(plansData[0].id);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  };

  const handleSyncAll = async () => {
    try {
      setSyncing(true);
      toast({ title: 'Initiating System-wide Sync...', description: 'Propagating modules to all subscription plans.' });
      await moduleRegistryApiService.syncToAllPlans();
      toast({ title: 'Sync Complete', description: 'All plans have been updated with the latest module definitions.', className: "bg-green-50 dark:bg-green-900/40 border-green-200 dark:border-green-700 dark:text-green-100" });
      loadData();
    } catch (error) {
      toast({ title: 'Sync failed', variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  const toggleExpand = (moduleId) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = moduleTree.map(m => m.id);
    setExpandedModules(new Set(allIds));
  };

  const collapseAll = () => {
    setExpandedModules(new Set());
  };

  const filteredModules = useMemo(() => {
    return moduleTree.filter(module => {
      const matchesSearch = !searchTerm || 
        module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.submodules?.some(s => 
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.slug.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesCategory = selectedCategory === 'all' || 
        module.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [moduleTree, searchTerm, selectedCategory]);

  const handleDelete = async (slug, name) => {
    if (!confirm(`Are you sure you want to delete the module "${name}"? This action cannot be undone.`)) return;
    
    try {
      await moduleRegistryApiService.deleteModule(slug);
      toast({ title: 'Module deleted successfully' });
      loadData();
    } catch (error) {
      toast({ title: 'Failed to delete module', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 animate-spin"></div>
            <Box className="w-6 h-6 text-indigo-600 dark:text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-gray-500 font-medium animate-pulse">Initializing Module Registry...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
    <div className="min-h-screen bg-slate-50/50 dark:bg-black/20 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-200 dark:border-gray-800">
          <div>
            <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400 font-medium text-sm">
              <Shield className="w-4 h-4" />
              <span>Master Administration</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-4">
              Module Registry
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-full uppercase tracking-wider">v2.0</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xl text-lg">
              Centralized command center for managing application modules, permissions, and subscription tiers.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/master-admin/module-registry/add')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20 font-medium"
            >
              <Plus className="w-5 h-5" />
              New Module
            </button>
            <button
              onClick={handleSyncAll}
              disabled={syncing}
              className={`px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl flex items-center gap-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium ${syncing ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              <Zap className={`w-5 h-5 text-yellow-500 ${syncing ? 'animate-pulse' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync All Plans'}
            </button>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard
            icon={<Layers className="w-5 h-5" />}
            label="Total Modules"
            value={stats?.total_modules || 0}
            color="blue"
          />
          <StatCard
            icon={<Box className="w-5 h-5" />}
            label="Root Modules"
            value={stats?.parent_modules || 0}
            color="purple"
          />
          <StatCard
            icon={<LayoutGrid className="w-5 h-5" />}
            label="Sub-Modules"
            value={stats?.sub_modules || 0}
            color="indigo"
          />
          <StatCard
            icon={<CheckCircle className="w-5 h-5" />}
            label="Active"
            value={stats?.active_modules || 0}
            color="green"
          />
          <StatCard
            icon={<XCircle className="w-5 h-5" />}
            label="Inactive"
            value={stats?.inactive_modules || 0}
            color="red"
          />
          <StatCard
            icon={<History className="w-5 h-5" />}
            label="Changes"
            value={stats?.total_versions || 0}
            color="orange"
            onClick={() => navigate('/master-admin/module-registry/versions')}
            clickable
          />
        </div>

        {/* Operational Tools */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <QuickLink
            icon={<RefreshCw className="w-6 h-6 text-blue-500" />}
            title="Sync Center"
            desc="Manage propagation to plans & schools"
            onClick={() => navigate('/master-admin/module-registry/sync')}
          />
          <QuickLink
            icon={<History className="w-6 h-6 text-orange-500" />}
            title="Version History"
            desc="Track changes and rollbacks"
            onClick={() => navigate('/master-admin/module-registry/versions')}
          />
          <QuickLink
            icon={<Activity className="w-6 h-6 text-teal-500" />}
            title="Audit Logs"
            desc="Monitor administrative actions"
            onClick={() => navigate('/master-admin/module-registry/audit')}
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            All Modules ({stats?.total_modules || 0})
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
              activeTab === 'plans'
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Plan Modules ({plans.length} Plans)
          </button>
          <button
            onClick={() => setActiveTab('master_admin')}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
              activeTab === 'master_admin'
                ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            Master Admin ({masterAdminModuleCount})
          </button>
        </div>

        {/* All Modules Tab */}
        {activeTab === 'all' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col min-h-[600px]">
          
          {/* Controls Bar */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col lg:flex-row gap-4 justify-between items-center sticky top-0 z-10 backdrop-blur-md">
            
            <div className="relative w-full lg:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search modules by name, slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-700 focus:outline-none transition-all text-sm"
              />
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>

              <button
                onClick={expandAll}
                className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                Collapse
              </button>
            </div>
          </div>

          {/* Module List */}
          <div className="flex-1 overflow-auto">
             {filteredModules.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 text-gray-400">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full mb-4">
                     <Search className="w-8 h-8 opacity-50" />
                  </div>
                  <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No modules found</p>
                  <p className="text-sm">Try adjusting your filters or search terms</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                   {filteredModules.map(module => (
                    <ModuleRow
                      key={module.id}
                      module={module}
                      expanded={expandedModules.has(module.id)}
                      onToggle={() => toggleExpand(module.id)}
                      onEdit={(slug) => navigate(`/master-admin/module-registry/edit/${slug}`)}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
          </div>
          
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 text-xs text-gray-500 flex justify-between items-center">
             <span>Showing {filteredModules.length} modules</span>
             <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>

        </div>
        )}

        {/* Plan Modules Tab */}
        {activeTab === 'plans' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              {/* Plan Selector Sidebar */}
              <div className="lg:w-64 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800 p-4">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Subscription Plans</h3>
                <div className="space-y-2">
                  {plans.map(plan => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between ${
                        selectedPlan === plan.id
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5" />
                        <span className="font-medium">{plan.name}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        selectedPlan === plan.id
                          ? 'bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                      }`}>
                        {planModules[plan.id]?.length || 0}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Plan Modules Content */}
              <div className="flex-1 p-6">
                {selectedPlan ? (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          {plans.find(p => p.id === selectedPlan)?.name} Plan Modules
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          {planModules[selectedPlan]?.length || 0} modules assigned to this plan
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/master-admin/subscriptions/plans/${selectedPlan}/edit`)}
                        className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition"
                      >
                        Edit Plan Modules
                      </button>
                    </div>

                    {/* Module Comparison Grid */}
                    <div className="overflow-auto max-h-[500px]">
                      <table className="w-full">
                        <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 z-10">
                          <tr>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Module</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Included</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {moduleTree.map(module => {
                            const isIncluded = planModules[selectedPlan]?.includes(module.slug);
                            const subIncluded = module.submodules?.filter(s => planModules[selectedPlan]?.includes(s.slug)).length || 0;
                            const totalSubs = module.submodules?.length || 0;
                            
                            return (
                              <React.Fragment key={module.id}>
                                <tr className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${isIncluded ? '' : 'opacity-50'}`}>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                        isIncluded 
                                          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                                      }`}>
                                        <Box className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{module.name}</p>
                                        <p className="text-xs text-gray-500">{module.slug}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-sm text-indigo-600 dark:text-indigo-400 capitalize">{module.category}</span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {isIncluded ? (
                                      <div className="flex items-center justify-center gap-2">
                                        <Check className="w-5 h-5 text-green-500" />
                                        {totalSubs > 0 && (
                                          <span className="text-xs text-gray-500">({subIncluded}/{totalSubs} subs)</span>
                                        )}
                                      </div>
                                    ) : (
                                      <X className="w-5 h-5 text-gray-300 mx-auto" />
                                    )}
                                  </td>
                                </tr>
                                {/* Show submodules */}
                                {isIncluded && module.submodules?.map(sub => {
                                  const subIsIncluded = planModules[selectedPlan]?.includes(sub.slug);
                                  return (
                                    <tr key={sub.id} className={`bg-gray-50/50 dark:bg-gray-800/30 ${subIsIncluded ? '' : 'opacity-40'}`}>
                                      <td className="px-4 py-2 pl-12">
                                        <div className="flex items-center gap-2">
                                          <LayoutGrid className="w-3.5 h-3.5 text-gray-400" />
                                          <span className="text-sm text-gray-600 dark:text-gray-400">{sub.name}</span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-2">
                                        <span className="text-xs text-gray-400">{sub.category}</span>
                                      </td>
                                      <td className="px-4 py-2 text-center">
                                        {subIsIncluded ? (
                                          <Check className="w-4 h-4 text-green-500 mx-auto" />
                                        ) : (
                                          <X className="w-4 h-4 text-gray-300 mx-auto" />
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <CreditCard className="w-12 h-12 mb-4 opacity-50" />
                    <p>Select a plan to view its modules</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Master Admin Modules Tab */}
        {activeTab === 'master_admin' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-amber-200 dark:border-amber-800/50 overflow-hidden">
            <div className="p-6 border-b border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Master Admin Modules</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    These modules are exclusively for Master Admin users and are not included in subscription plans.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 text-sm">
                <span className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg font-medium">
                  {masterAdminModules.length} Parent Modules
                </span>
                <span className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 rounded-lg">
                  {masterAdminModuleCount - masterAdminModules.length} Sub-modules
                </span>
              </div>
            </div>
            
            {/* Master Admin Modules List */}
            <div className="divide-y divide-amber-100 dark:divide-amber-900/20">
              {masterAdminModules.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 text-gray-400">
                  <Shield className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium text-gray-500">No Master Admin modules found</p>
                </div>
              ) : (
                masterAdminModules.map(module => (
                  <div key={module.id} className="hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors">
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                          <Box className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 dark:text-white">{module.name}</p>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              module.status === 'active' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                            }`}>
                              {module.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{module.slug}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                          {module.submodules?.length || 0} sub-modules
                        </span>
                        <button
                          onClick={() => navigate(`/master-admin/module-registry/edit/${module.slug}`)}
                          className="p-2 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition text-gray-500 hover:text-amber-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Sub-modules */}
                    {module.submodules?.length > 0 && (
                      <div className="bg-amber-50/50 dark:bg-amber-900/5 px-4 py-3 ml-14 border-l-2 border-amber-200 dark:border-amber-800">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {module.submodules.map(sub => (
                            <div key={sub.id} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900/50 rounded-lg border border-amber-100 dark:border-amber-900/20">
                              <LayoutGrid className="w-3.5 h-3.5 text-amber-500" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{sub.name}</span>
                              <span className={`ml-auto text-xs px-1.5 py-0.5 rounded ${
                                sub.status === 'active' 
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600' 
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                {sub.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </DashboardLayout>
  );
};

// Modern Stat Card
const StatCard = ({ icon, label, value, color, onClick, clickable }) => {
  const colorStyles = {
    blue: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30",
    purple: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30",
    indigo: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30",
    green: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30",
    red: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30",
    orange: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30",
  };

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden p-4 rounded-xl border transition-all duration-200 ${clickable ? 'cursor-pointer hover:-translate-y-1 hover:shadow-md' : ''} bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorStyles[color]}`}>
        {icon}
      </div>
      <div className="relative z-10">
        <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</p>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">{label}</p>
      </div>
    </div>
  );
};

// Modern Quick Link
const QuickLink = ({ icon, title, desc, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-4 p-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group text-left"
  >
    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl group-hover:scale-110 transition-transform duration-200">
      {icon}
    </div>
    <div>
      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{title}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{desc}</p>
    </div>
    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 ml-auto transition-colors" />
  </button>
);

// Enhanced Module Row
const ModuleRow = ({ module, expanded, onToggle, onEdit, onDelete }) => {
  const hasSubmodules = module.submodules && module.submodules.length > 0;

  return (
    <div className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
      {/* Parent Row */}
      <div className="flex items-center px-4 py-4 gap-4">
        {/* Expand Toggle */}
        <button
          onClick={onToggle}
          disabled={!hasSubmodules}
          className={`p-1 rounded-md transition-colors ${
            hasSubmodules 
              ? 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400' 
              : 'opacity-0 cursor-default'
          }`}
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Identification */}
        <div className="flex-1 min-w-0 flex items-center gap-4">
           {/* Icon Box */}
           <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${
             module.is_active 
              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
           }`}>
              <Box className="w-5 h-5" />
           </div>

           <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">
                  {module.name}
                </h3>
                {module.is_premium && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-200 dark:border-amber-800">
                    Premium
                  </span>
                )}
                {!module.is_active && (
                   <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px] font-bold uppercase border border-gray-200 dark:border-gray-700">Inactive</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                 <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">{module.slug}</code>
                 <span>•</span>
                 <span className="text-indigo-600 dark:text-indigo-400">{module.category}</span>
                 {hasSubmodules && <span>• {module.submodules.length} items</span>}
              </div>
           </div>
        </div>

        {/* Quick Stats (Desktop) */}
        <div className="hidden xl:flex items-center gap-6 text-xs text-gray-500 mr-8">
           <div className="flex -space-x-2">
              {module.default_plans?.slice(0, 3).map((plan, i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-white dark:bg-gray-800 border dark:border-gray-700 flex items-center justify-center text-[10px] font-bold ring-2 ring-white dark:ring-gray-900" title={plan}>
                  {plan.charAt(0).toUpperCase()}
                </div>
              ))}
               {module.default_plans?.length > 3 && (
                 <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 flex items-center justify-center text-[10px] font-bold ring-2 ring-white dark:ring-gray-900">
                   +{module.default_plans.length - 3}
                 </div>
               )}
           </div>
           <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
           <div className="flex flex-col items-end">
              <span>{module.default_permissions?.length || 0} perms</span>
              <span className="text-gray-400">defined</span>
           </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(module.slug)}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition"
            title="Configure Module"
          >
            <Settings className="w-4 h-4" />
          </button>
           <button
            onClick={() => onDelete(module.slug, module.name)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
            title="Delete Module"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Submodules Nested View */}
      {expanded && hasSubmodules && (
        <div className="bg-gray-50/50 dark:bg-black/20 border-t border-b border-gray-100 dark:border-gray-800 shadow-inner">
          {module.submodules.map((sub, idx) => (
            <div
              key={sub.id}
              className={`flex items-center px-4 py-3 pl-14 hover:bg-white dark:hover:bg-gray-800/80 transition-colors ${idx !== module.submodules.length - 1 ? 'border-b border-gray-100 dark:border-gray-800/50' : ''}`}
            >
              {/* Connector Line */}
              <div className="absolute left-6 h-full w-px bg-gray-200 dark:bg-gray-700 -z-10 top-0 hidden md:block"></div> 
              {/* Not actually implementing visual lines without complex styling but simpler indentation works */}

              <div className={`p-1.5 rounded-md mr-4 ${sub.is_active ? 'bg-white border border-gray-200 text-indigo-600 shadow-sm' : 'bg-transparent text-gray-300'}`}>
                 <LayoutGrid className="w-4 h-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{sub.name}</span>
                  {!sub.is_active && (
                     <span className="text-[10px] uppercase font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Inactive</span>
                  )}
                </div>
                <div className="text-xs text-gray-400 font-mono mt-0.5">{sub.slug}</div>
              </div>

               {/* Sub Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit(sub.slug)}
                  className="p-1.5 text-gray-400 hover:text-indigo-600 rounded hover:bg-indigo-50"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(sub.slug, sub.name)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModuleRegistryDashboard;

