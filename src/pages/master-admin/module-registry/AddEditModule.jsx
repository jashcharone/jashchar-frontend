/**
 * ADD/EDIT MODULE PAGE
 * Form for creating and editing modules
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Box,
  Settings,
  Plus,
  Trash2,
  ChevronDown,
  AlertCircle,
  Loader2,
  X,
  Check,
  Layout,
  Globe,
  Shield,
  CreditCard,
  Menu,
  Building,
  GitBranch
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import moduleRegistryApiService from '@/services/moduleRegistryApiService';
import DashboardLayout from '@/components/DashboardLayout';

const PERMISSION_OPTIONS = ['view', 'create', 'edit', 'delete', 'export', 'import', 'approve', 'audit'];

const ICON_PRESETS = ['Box', 'Users', 'Settings', 'Book', 'DollarSign', 'BarChart', 'Bell', 'FileText', 'Globe'];

const CATEGORY_OPTIONS = [
  'core',
  'academics',
  'finance', 
  'administration',
  'communication',
  'analytics',
  'facilities',
  'content',
  'cms',
  'student_management',
  'attendance',
  'master_admin'
];

// Assignment types
const ASSIGNMENT_TYPES = [
  { value: 'subscription_plans', label: 'Subscription Plans Only', description: 'Available only for schools based on their subscription plan', icon: 'CreditCard', color: 'purple' },
  { value: 'master_admin', label: 'Master Admin Only', description: 'Only visible to Master Admin users, not for schools', icon: 'Shield', color: 'amber' },
  { value: 'both', label: 'Both (Master Admin + Plans)', description: 'Available for Master Admin AND schools based on subscription plan', icon: 'Globe', color: 'green' }
];

// PLAN_OPTIONS - now loaded dynamically from database

const AddEditModule = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const isEdit = Boolean(slug);
  const { toast } = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [parentModules, setParentModules] = useState([]);
  const [loadingParents, setLoadingParents] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    name_kannada: '',
    description: '',
    icon: 'Box',
    category: 'core',
    parent_slug: null,
    is_active: true,
    is_premium: false,
    display_order: 100,
    assignment_type: 'subscription_plans', // 'subscription_plans' | 'master_admin' | 'both'
    default_plans: ['basic', 'standard', 'premium', 'enterprise'],
    default_permissions: ['view', 'create', 'edit', 'delete'],
    route_path: '',
    // Branch/Org access control for master_admin modules
    org_access: {
      access_type: 'all', // 'all' | 'specific_orgs' | 'specific_branches'
      org_ids: [],
      branch_ids: []
    },
    sidebar_config: {
      show_in_sidebar: true,
      badge: null,
      highlight: false
    },
    metadata: {}
  });

  const [errors, setErrors] = useState({});

  // Load parent modules and subscription plans
  useEffect(() => {
    loadParentModules();
    loadSubscriptionPlans();
  }, []);

  // Load subscription plans from database
  const loadSubscriptionPlans = async () => {
    try {
      setLoadingPlans(true);
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${baseUrl}/api/subscriptions/plans`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const plans = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        // Filter only active plans
        const activePlans = plans.filter(p => p.status === true || p.status === 'active');
        setSubscriptionPlans(activePlans);
        console.log('📋 Loaded subscription plans:', activePlans.length);
      } else {
        console.error('Failed to load plans:', response.status);
        setSubscriptionPlans([]);
      }
    } catch (error) {
      console.error('Error loading subscription plans:', error);
      setSubscriptionPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  // Load existing module if editing
  useEffect(() => {
    if (isEdit) {
      loadModule();
    }
  }, [slug]);

  const loadParentModules = async () => {
    try {
      setLoadingParents(true);
      const res = await moduleRegistryApiService.getModulesFlat({ parent_only: true });
      console.log('📦 Parent Modules API Response:', res);
      
      // Handle different response formats
      let modules = [];
      if (Array.isArray(res)) {
        modules = res;
      } else if (res?.data && Array.isArray(res.data)) {
        modules = res.data;
      } else if (res?.success && res?.data) {
        modules = res.data;
      }
      
      console.log('📋 Parsed Parent Modules:', modules.length, 'modules found');
      setParentModules(modules);
    } catch (error) {
      console.error('Error loading parents:', error);
      setParentModules([]);
    } finally {
      setLoadingParents(false);
    }
  };

  // Load organizations and branches for Master Admin module access control
  const loadOrganizations = async () => {
    try {
      setLoadingOrgs(true);
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');
      
      // Fetch organizations (list-all for master admin)
      // Use schools API as fallback since organizations/list-all might not exist
      let orgsData = [];
      try {
        const orgsRes = await fetch(`${baseUrl}/api/schools`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (orgsRes.ok) {
          const data = await orgsRes.json();
          orgsData = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        }
      } catch (e) {
        console.log('Could not load organizations:', e);
      }
      setOrganizations(orgsData);
      
      // Fetch branches - use schools branches API
      let branchData = [];
      try {
        const branchRes = await fetch(`${baseUrl}/api/branches`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (branchRes.ok) {
          const data = await branchRes.json();
          branchData = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        }
      } catch (e) {
        console.log('Could not load branches:', e);
      }
      setBranches(branchData);
    } catch (error) {
      console.error('Error loading organizations:', error);
      // Ensure arrays are set even on error
      setOrganizations([]);
      setBranches([]);
    } finally {
      setLoadingOrgs(false);
    }
  };

  // Load orgs when assignment type changes to master_admin or both
  useEffect(() => {
    if (formData.assignment_type === 'master_admin' || formData.assignment_type === 'both') {
      loadOrganizations();
    }
  }, [formData.assignment_type]);

  const loadModule = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading module with slug:', slug);
      const res = await moduleRegistryApiService.getModule(slug);
      console.log('📦 Module API Response:', res);
      
      // Handle both response formats: {data: {...}} OR {success: true, data: {...}} OR direct object
      const moduleData = res?.data || res;
      console.log('📋 Module Data:', moduleData);
      
      if (moduleData && moduleData.slug) {
        // Determine assignment_type from category and default_plans
        let assignmentType = 'subscription_plans';
        if (moduleData.category === 'master_admin') {
          // If master_admin category but has default_plans, it's "both"
          if (moduleData.default_plans && moduleData.default_plans.length > 0) {
            assignmentType = 'both';
          } else {
            assignmentType = 'master_admin';
          }
        }
        // Override with metadata assignment_type if available
        if (moduleData.metadata?.assignment_type) {
          assignmentType = moduleData.metadata.assignment_type;
        }
        
        // Restore org_access from metadata
        const orgAccess = moduleData.metadata?.org_access || {
          access_type: 'all',
          org_ids: [],
          branch_ids: []
        };
        
        // Convert default_permissions from object to array if needed
        // DB stores: {view: true, add: true} but form expects: ['view', 'create', 'edit', 'delete']
        // Permission mapping: DB 'add' = UI 'create'
        const permissionDbToUi = { 'add': 'create', 'view': 'view', 'edit': 'edit', 'delete': 'delete', 'export': 'export', 'import': 'import', 'approve': 'approve', 'audit': 'audit', 'create': 'create' };
        let permissionsArray = [];
        if (moduleData.default_permissions) {
          if (Array.isArray(moduleData.default_permissions)) {
            // Map permission names from DB format to UI format
            permissionsArray = moduleData.default_permissions.map(p => permissionDbToUi[p] || p);
          } else if (typeof moduleData.default_permissions === 'object') {
            // Convert object {view: true, add: true} to array ['view', 'create']
            permissionsArray = Object.entries(moduleData.default_permissions)
              .filter(([key, value]) => value === true)
              .map(([key]) => permissionDbToUi[key] || key);
          }
        }
        
        // Ensure default_plans is an array
        let plansArray = [];
        if (moduleData.default_plans) {
          if (Array.isArray(moduleData.default_plans)) {
            plansArray = moduleData.default_plans;
          }
        }
        
        // Map DB column names to frontend field names
        // DB uses sort_order, frontend uses display_order
        const displayOrder = moduleData.display_order ?? moduleData.sort_order ?? 100;
        
        setFormData({
          ...formData,
          ...moduleData,
          // Map DB column names to frontend field names
          display_order: displayOrder,
          assignment_type: assignmentType,
          org_access: orgAccess,
          default_plans: plansArray,
          default_permissions: permissionsArray,
          sidebar_config: moduleData.sidebar_config || { show_in_sidebar: true },
          metadata: moduleData.metadata || {},
          is_premium: moduleData.is_premium ?? false,
          name_kannada: moduleData.name_kannada || ''
        });
        console.log('✅ Form data set successfully');
      } else {
        console.error('❌ Module data not found in response');
        toast({ title: 'Module not found', variant: 'destructive' });
        navigate('/master-admin/module-registry');
      }
    } catch (error) {
      console.error('❌ loadModule Error:', error);
      toast({ title: 'Module failed to load', variant: 'destructive' });
      navigate('/master-admin/module-registry');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (value) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      slug: isEdit ? prev.slug : generateSlug(value)
    }));
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const togglePlan = (plan) => {
    setFormData(prev => {
      const currentPlans = Array.isArray(prev.default_plans) ? prev.default_plans : [];
      return {
        ...prev,
        default_plans: currentPlans.includes(plan)
          ? currentPlans.filter(p => p !== plan)
          : [...currentPlans, plan]
      };
    });
  };

  // Toggle organization selection
  const toggleOrg = (orgId) => {
    setFormData(prev => ({
      ...prev,
      org_access: {
        ...prev.org_access,
        org_ids: prev.org_access.org_ids.includes(orgId)
          ? prev.org_access.org_ids.filter(id => id !== orgId)
          : [...prev.org_access.org_ids, orgId]
      }
    }));
  };

  // Toggle branch selection
  const toggleBranch = (branchId) => {
    setFormData(prev => ({
      ...prev,
      org_access: {
        ...prev.org_access,
        branch_ids: prev.org_access.branch_ids.includes(branchId)
          ? prev.org_access.branch_ids.filter(id => id !== branchId)
          : [...prev.org_access.branch_ids, branchId]
      }
    }));
  };

  // Change org access type
  const handleOrgAccessType = (accessType) => {
    setFormData(prev => ({
      ...prev,
      org_access: {
        ...prev.org_access,
        access_type: accessType,
        // Clear selections when switching to 'all'
        org_ids: accessType === 'all' ? [] : prev.org_access.org_ids,
        branch_ids: accessType === 'all' ? [] : prev.org_access.branch_ids
      }
    }));
  };

  const togglePermission = (perm) => {
    setFormData(prev => {
      const currentPerms = Array.isArray(prev.default_permissions) ? prev.default_permissions : [];
      return {
        ...prev,
        default_permissions: currentPerms.includes(perm)
          ? currentPerms.filter(p => p !== perm)
          : [...currentPerms, perm]
      };
    });
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-_.]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, hyphens, underscores and dots';
    }

    // Validate plans if assignment includes subscription plans
    const plansArray = Array.isArray(formData.default_plans) ? formData.default_plans : [];
    if ((formData.assignment_type === 'subscription_plans' || formData.assignment_type === 'both') && plansArray.length === 0) {
      newErrors.default_plans = 'Select at least one plan';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);
      
      // Permission mapping: UI 'create' = DB 'add'
      const permissionUiToDb = { 'create': 'add', 'view': 'view', 'edit': 'edit', 'delete': 'delete', 'export': 'export', 'import': 'import', 'approve': 'approve', 'audit': 'audit', 'add': 'add' };
      
      // Convert permissions array to object format for DB
      // ['view', 'create', 'edit'] -> {view: true, add: true, edit: true}
      const permissionsObject = {};
      (Array.isArray(formData.default_permissions) ? formData.default_permissions : []).forEach(perm => {
        const dbKey = permissionUiToDb[perm] || perm;
        permissionsObject[dbKey] = true;
      });
      
      // Prepare data based on assignment_type
      const submitData = {
        ...formData,
        // Convert permissions to object format
        default_permissions: permissionsObject,
        // For "both" and "master_admin", set category to master_admin
        // For "subscription_plans" only, keep original category
        category: (formData.assignment_type === 'master_admin' || formData.assignment_type === 'both') 
          ? 'master_admin' 
          : formData.category,
        // Keep default_plans for "both" and "subscription_plans", clear for "master_admin" only
        default_plans: formData.assignment_type === 'master_admin' ? [] : formData.default_plans,
        // Store assignment_type and org_access in metadata for reference
        metadata: {
          ...formData.metadata,
          assignment_type: formData.assignment_type,
          // Store org/branch access control settings (for Master Admin modules)
          org_access: (formData.assignment_type === 'master_admin' || formData.assignment_type === 'both') 
            ? formData.org_access 
            : null
        }
      };
      
      if (isEdit) {
        await moduleRegistryApiService.updateModule(slug, submitData);
        toast({ title: 'Module updated successfully!' });
      } else {
        await moduleRegistryApiService.createModule(submitData);
        toast({ title: 'New module added successfully!' });
      }
      
      navigate('/master-admin/module-registry');
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to save';
      toast({ title: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 dark:text-indigo-400 mb-4" />
          <p className="text-gray-500 animate-pulse">Loading module configuration...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50/50 dark:bg-black/20 p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/master-admin/module-registry')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-400"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {isEdit ? <Settings className="w-5 h-5 text-indigo-500" /> : <Plus className="w-5 h-5 text-indigo-500" />}
                  {isEdit ? `Edit: ${formData.name}` : 'Create New Module'}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {isEdit ? slug : 'New Identity'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
               <button
                type="button"
                onClick={() => navigate('/master-admin/module-registry')}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isEdit ? 'Save Changes' : 'Create Module'}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Core Information */}
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center gap-2">
                  <Box className="w-5 h-5 text-indigo-500" />
                  <h2 className="font-semibold text-gray-900 dark:text-white">Core Information</h2>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Name field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Module Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all ${
                        errors.name ? 'border-red-500' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                      }`}
                      placeholder="e.g. Student Management"
                      autoFocus
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                  </div>

                  {/* Slug field */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Slug Identifier <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.slug}
                          onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          disabled={isEdit}
                          className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border rounded-lg font-mono text-sm text-gray-900 dark:text-white ${
                            isEdit ? 'cursor-not-allowed opacity-75' : ''
                          } ${errors.slug ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}`}
                        />
                        {isEdit && <span className="absolute right-3 top-2.5 text-xs text-gray-400">Locked</span>}
                      </div>
                      {errors.slug && <p className="mt-1 text-sm text-red-500">{errors.slug}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Local Name (Kannada)
                      </label>
                      <input
                        type="text"
                        value={formData.name_kannada}
                        onChange={(e) => handleChange('name_kannada', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="e.g. ವಿದ್ಯಾರ್ಥಿ ನಿರ್ವಹಣೆ"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description & Purpose
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Explain what this module handles..."
                    />
                  </div>
                </div>
              </div>

              {/* Navigation & Interface */}
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center gap-2">
                  <Layout className="w-5 h-5 text-blue-500" />
                  <h2 className="font-semibold text-gray-900 dark:text-white">Interface & Navigation</h2>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Parent Module */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Parent Module
                      </label>
                      <select
                        value={formData.parent_slug || ''}
                        onChange={(e) => handleChange('parent_slug', e.target.value || null)}
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                        disabled={loadingParents}
                      >
                        <option value="">-- No Parent (Root Module) --</option>
                        {parentModules.map(m => (
                          <option key={m.slug} value={m.slug} disabled={m.slug === slug}>
                            {m.name} ({m.slug})
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">Nests this module under a parent category</p>
                    </div>
                    
                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Functional Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => handleChange('category', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        {CATEGORY_OPTIONS.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Route Path */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Frontend Route Path
                      </label>
                      <div className="flex gap-2">
                         <input
                          type="text"
                          value={formData.route_path}
                          onChange={(e) => handleChange('route_path', e.target.value)}
                          className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg font-mono text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="/path/to/module"
                        />
                        <button
                          type="button"
                          onClick={() => handleChange('route_path', `/${formData.slug}`)}
                          className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs"
                          title="Auto-generate from slug"
                        >
                           Generate
                        </button>
                      </div>
                    </div>

                    {/* Display Order */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Sort Order
                      </label>
                      <input
                        type="number"
                        value={formData.display_order}
                        onChange={(e) => handleChange('display_order', parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        min="0"
                      />
                    </div>
                  </div>
                  
                  {/* Icon Selection - Simple Text Input for now, could be a picker */}
                   <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Module Icon (Lucide Icon Name)
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {ICON_PRESETS.map(iconName => (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => handleChange('icon', iconName)}
                            className={`px-3 py-1.5 text-xs rounded-md border transition-all ${
                              formData.icon === iconName 
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20' 
                                : 'bg-white border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-50'
                            }`}
                          >
                            {iconName}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={formData.icon || ''}
                        onChange={(e) => handleChange('icon', e.target.value)}
                         className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg font-mono text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="e.g. Users, Box, Settings"
                      />
                   </div>
                </div>
              </div>

               {/* Default Permissions */}
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  <h2 className="font-semibold text-gray-900 dark:text-white">Default Permissions</h2>
                </div>
                
                <div className="p-6">
                   <p className="text-sm text-gray-500 mb-4">Select the permissions that should be available for this module by default.</p>
                   <div className="flex flex-wrap gap-3">
                    {PERMISSION_OPTIONS.map(perm => {
                      const permArray = Array.isArray(formData.default_permissions) ? formData.default_permissions : [];
                      const isSelected = permArray.includes(perm);
                      return (
                        <button
                          key={perm}
                          type="button"
                          onClick={() => togglePermission(perm)}
                          className={`px-4 py-2 rounded-lg border font-medium text-sm transition-all duration-200 ${
                            isSelected
                              ? 'bg-green-50 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300 shadow-sm'
                              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                             <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-green-500 bg-green-500 text-white' : 'border-gray-400'}`}>
                                {isSelected && <Check className="w-3 h-3" />}
                             </div>
                             {perm.charAt(0).toUpperCase() + perm.slice(1)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

            {/* Side Column */}
            <div className="space-y-6">

              {/* Module Assignment Type - IMPORTANT */}
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border-2 border-indigo-200 dark:border-indigo-800 overflow-hidden">
                <div className="p-4 border-b border-indigo-100 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-900/20 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-600" />
                  <h2 className="font-semibold text-gray-900 dark:text-white">Module Assignment</h2>
                  <span className="ml-auto text-xs bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full">Important</span>
                </div>
                
                <div className="p-4 space-y-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Choose where this module should be available:
                  </p>
                  
                  {/* Subscription Plans Only Option */}
                  <label 
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.assignment_type === 'subscription_plans'
                        ? 'bg-purple-50 border-purple-400 dark:bg-purple-900/20 dark:border-purple-600 shadow-sm ring-2 ring-purple-200 dark:ring-purple-800'
                        : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="assignment_type"
                      value="subscription_plans"
                      checked={formData.assignment_type === 'subscription_plans'}
                      onChange={(e) => handleChange('assignment_type', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      formData.assignment_type === 'subscription_plans'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                    }`}>
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">Schools Only (Plans)</span>
                        {formData.assignment_type === 'subscription_plans' && (
                          <Check className="w-4 h-4 text-purple-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Only for schools based on subscription plan. Not in Master Admin sidebar.
                      </p>
                    </div>
                  </label>

                  {/* Master Admin Only Option */}
                  <label 
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.assignment_type === 'master_admin'
                        ? 'bg-amber-50 border-amber-400 dark:bg-amber-900/20 dark:border-amber-600 shadow-sm ring-2 ring-amber-200 dark:ring-amber-800'
                        : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="assignment_type"
                      value="master_admin"
                      checked={formData.assignment_type === 'master_admin'}
                      onChange={(e) => handleChange('assignment_type', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      formData.assignment_type === 'master_admin'
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                    }`}>
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">Master Admin Only</span>
                        {formData.assignment_type === 'master_admin' && (
                          <Check className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Only for Master Admin. Schools cannot see this module.
                      </p>
                    </div>
                  </label>

                  {/* BOTH - Master Admin + Plans Option */}
                  <label 
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.assignment_type === 'both'
                        ? 'bg-emerald-50 border-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-600 shadow-sm ring-2 ring-emerald-200 dark:ring-emerald-800'
                        : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="assignment_type"
                      value="both"
                      checked={formData.assignment_type === 'both'}
                      onChange={(e) => handleChange('assignment_type', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      formData.assignment_type === 'both'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                    }`}>
                      <Globe className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">Both (Master Admin + Schools)</span>
                        {formData.assignment_type === 'both' && (
                          <Check className="w-4 h-4 text-emerald-500" />
                        )}
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-300 px-1.5 py-0.5 rounded">Recommended</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Available in Master Admin sidebar AND for schools based on plan. (Example: Front CMS)
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Organization/Branch Access Control - Show for master_admin or both */}
              {(formData.assignment_type === 'master_admin' || formData.assignment_type === 'both') && (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border-2 border-cyan-200 dark:border-cyan-800 overflow-hidden">
                <div className="p-4 border-b border-cyan-100 dark:border-cyan-900 bg-cyan-50/50 dark:bg-cyan-900/20 flex items-center gap-2">
                  <Building className="w-5 h-5 text-cyan-600" />
                  <h2 className="font-semibold text-gray-900 dark:text-white">Organization/Branch Access</h2>
                  <span className="ml-auto text-xs bg-cyan-100 dark:bg-cyan-800 text-cyan-600 dark:text-cyan-300 px-2 py-0.5 rounded-full">Future-Proof</span>
                </div>
                
                <div className="p-4 space-y-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    ಯಾವ organizations/branches ಈ module ನೋಡಬಹುದು ಎಂದು ನಿರ್ಧರಿಸಿ:
                  </p>
                  
                  {/* All Organizations Option */}
                  <label 
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.org_access.access_type === 'all'
                        ? 'bg-green-50 border-green-400 dark:bg-green-900/20 dark:border-green-600'
                        : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="org_access_type"
                      value="all"
                      checked={formData.org_access.access_type === 'all'}
                      onChange={() => handleOrgAccessType('all')}
                      className="sr-only"
                    />
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      formData.org_access.access_type === 'all'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                    }`}>
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">All Organizations</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">ಎಲ್ಲಾ organizations/schools ನೋಡಬಹುದು</p>
                    </div>
                    {formData.org_access.access_type === 'all' && <Check className="w-4 h-4 text-green-500" />}
                  </label>

                  {/* Specific Organizations Option */}
                  <label 
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.org_access.access_type === 'specific_orgs'
                        ? 'bg-blue-50 border-blue-400 dark:bg-blue-900/20 dark:border-blue-600'
                        : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="org_access_type"
                      value="specific_orgs"
                      checked={formData.org_access.access_type === 'specific_orgs'}
                      onChange={() => handleOrgAccessType('specific_orgs')}
                      className="sr-only"
                    />
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      formData.org_access.access_type === 'specific_orgs'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                    }`}>
                      <Building className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">Specific Organizations</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">ನಿರ್ದಿಷ್ಟ organizations ಆಯ್ಕೆ ಮಾಡಿ</p>
                    </div>
                    {formData.org_access.access_type === 'specific_orgs' && <Check className="w-4 h-4 text-blue-500" />}
                  </label>

                  {/* Specific Branches Option */}
                  <label 
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.org_access.access_type === 'specific_branches'
                        ? 'bg-purple-50 border-purple-400 dark:bg-purple-900/20 dark:border-purple-600'
                        : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="org_access_type"
                      value="specific_branches"
                      checked={formData.org_access.access_type === 'specific_branches'}
                      onChange={() => handleOrgAccessType('specific_branches')}
                      className="sr-only"
                    />
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      formData.org_access.access_type === 'specific_branches'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                    }`}>
                      <GitBranch className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">Specific Branches</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">ನಿರ್ದಿಷ್ಟ branches ಆಯ್ಕೆ ಮಾಡಿ</p>
                    </div>
                    {formData.org_access.access_type === 'specific_branches' && <Check className="w-4 h-4 text-purple-500" />}
                  </label>

                  {/* Organization Selection List */}
                  {formData.org_access.access_type === 'specific_orgs' && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Select Organizations
                      </h4>
                      {loadingOrgs ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading organizations...
                        </div>
                      ) : !Array.isArray(organizations) || organizations.length === 0 ? (
                        <p className="text-sm text-gray-500">No organizations found</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {organizations.map(org => (
                            <div
                              key={org.id}
                              onClick={() => toggleOrg(org.id)}
                              className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                                formData.org_access.org_ids.includes(org.id)
                                  ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700'
                                  : 'bg-white border-gray-200 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{org.name || org.school_name}</span>
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                formData.org_access.org_ids.includes(org.id) 
                                  ? 'bg-blue-500 border-blue-500 text-white' 
                                  : 'border-gray-300'
                              }`}>
                                {formData.org_access.org_ids.includes(org.id) && <Check className="w-3 h-3" />}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {formData.org_access.org_ids.length > 0 && (
                        <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                          {formData.org_access.org_ids.length} organization(s) selected
                        </p>
                      )}
                    </div>
                  )}

                  {/* Branch Selection List */}
                  {formData.org_access.access_type === 'specific_branches' && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <GitBranch className="w-4 h-4" />
                        Select Branches
                      </h4>
                      {loadingOrgs ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading branches...
                        </div>
                      ) : !Array.isArray(branches) || branches.length === 0 ? (
                        <p className="text-sm text-gray-500">No branches found</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {branches.map(branch => (
                            <div
                              key={branch.id}
                              onClick={() => toggleBranch(branch.id)}
                              className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                                formData.org_access.branch_ids.includes(branch.id)
                                  ? 'bg-purple-50 border-purple-300 dark:bg-purple-900/20 dark:border-purple-700'
                                  : 'bg-white border-gray-200 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{branch.name}</span>
                                {branch.org_name && (
                                  <p className="text-xs text-gray-500">{branch.org_name}</p>
                                )}
                              </div>
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                formData.org_access.branch_ids.includes(branch.id) 
                                  ? 'bg-purple-500 border-purple-500 text-white' 
                                  : 'border-gray-300'
                              }`}>
                                {formData.org_access.branch_ids.includes(branch.id) && <Check className="w-3 h-3" />}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {formData.org_access.branch_ids.length > 0 && (
                        <p className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                          {formData.org_access.branch_ids.length} branch(es) selected
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              )}
              
              {/* Status & Visibility */}
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center gap-2">
                  <Menu className="w-5 h-5 text-indigo-500" />
                  <h2 className="font-semibold text-gray-900 dark:text-white">Visibility & State</h2>
                </div>
                
                <div className="p-6 space-y-4">
                  {/* Active Toggle */}
                  <label className={`flex items-start gap-4 p-3 rounded-lg border cursor-pointer transition-all ${formData.is_active ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}>
                    <div className="relative flex items-start">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.is_active}
                        onChange={(e) => handleChange('is_active', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </div>
                    <div>
                      <span className="block font-medium text-gray-900 dark:text-white">Active Status</span>
                      <span className="text-xs text-gray-500">Enable or disable this module entirely.</span>
                    </div>
                  </label>

                   {/* Premium Toggle */}
                  <label className={`flex items-start gap-4 p-3 rounded-lg border cursor-pointer transition-all ${formData.is_premium ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}>
                     <div className="relative flex items-start">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.is_premium}
                        onChange={(e) => handleChange('is_premium', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-500"></div>
                    </div>
                    <div>
                      <span className="block font-medium text-gray-900 dark:text-white">Premium Feature</span>
                      <span className="text-xs text-gray-500">Mark as a premium/paid feature.</span>
                    </div>
                  </label>

                  {/* Sidebar Toggle */}
                   <label className={`flex items-start gap-4 p-3 rounded-lg border cursor-pointer transition-all ${formData.sidebar_config?.show_in_sidebar ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}>
                     <div className="relative flex items-start">
                      <input
                        type="checkbox"
                         className="sr-only peer"
                        checked={formData.sidebar_config?.show_in_sidebar !== false}
                         onChange={(e) => handleChange('sidebar_config', {
                          ...formData.sidebar_config,
                          show_in_sidebar: e.target.checked
                        })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </div>
                    <div>
                      <span className="block font-medium text-gray-900 dark:text-white">Show in Sidebar</span>
                      <span className="text-xs text-gray-500">Visible in the main navigation menu.</span>
                    </div>
                  </label>
                </div>
              </div>

               {/* Default Plans - Show when assignment includes subscription plans */}
              {(formData.assignment_type === 'subscription_plans' || formData.assignment_type === 'both') && (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-500" />
                  <h2 className="font-semibold text-gray-900 dark:text-white">Included Plans</h2>
                </div>
                
                <div className="p-6">
                   <p className="text-xs text-gray-500 mb-4">Select which subscription plans should include this module by default.</p>
                   {errors.default_plans && <p className="text-sm text-red-500 mb-2">{errors.default_plans}</p>}
                   
                   <div className="space-y-2">
                    {loadingPlans ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                        <span className="ml-2 text-sm text-gray-500">Loading plans...</span>
                      </div>
                    ) : subscriptionPlans.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No subscription plans found</p>
                    ) : (
                      subscriptionPlans.map(plan => {
                        const plansArray = Array.isArray(formData.default_plans) ? formData.default_plans : [];
                        const planSlug = plan.slug || plan.name?.toLowerCase();
                        const isSelected = plansArray.includes(planSlug);
                        return (
                          <div
                            key={plan.id || planSlug}
                            onClick={() => togglePlan(planSlug)}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                               isSelected
                                ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'
                                : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                             <span className="font-medium text-gray-700 dark:text-gray-200">{plan.name}</span>
                             <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-purple-500 border-purple-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                               {isSelected && <Check className="w-3.5 h-3.5" />}
                             </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
              )}

              {/* Master Admin Info Box - Only show when assignment_type is master_admin */}
              {formData.assignment_type === 'master_admin' && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-amber-800 dark:text-amber-300">Master Admin Only</h3>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                      ಈ module Master Admin ಗೆ ಮಾತ್ರ ಕಾಣಿಸುತ್ತದೆ. Schools ಗೆ ಕಾಣಿಸುವುದಿಲ್ಲ.
                    </p>
                  </div>
                </div>
              </div>
              )}

              {/* Both Info Box - Show when assignment_type is both */}
              {formData.assignment_type === 'both' && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-4">
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-emerald-800 dark:text-emerald-300">Master Admin + Schools</h3>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                      ✅ Master Admin sidebar ಅಲ್ಲಿ ಇರುತ್ತದೆ<br/>
                      ✅ Schools ಗೆ plan ಪ್ರಕಾರ ಲಭ್ಯ<br/>
                      <span className="text-emerald-600 dark:text-emerald-300 font-medium">Example: Front CMS, System Settings</span>
                    </p>
                  </div>
                </div>
              </div>
              )}


            </div>

          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddEditModule;
