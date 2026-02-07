// ═══════════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - MASTER ADMIN - BRANCH ATTENDANCE CONFIG
// ═══════════════════════════════════════════════════════════════════════════════
// Master Admin can configure which attendance modules are available for each branch
// across ALL organizations
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { 
    Users, UserCheck, Calendar, Clock, FileText, CalendarOff,
    QrCode, CreditCard, Upload, MessageSquare, Smartphone,
    Fingerprint, ScanFace, Camera, Activity, Cpu, Settings, Watch,
    MapPin, Navigation, Monitor, Video, Mic, Shield, Eye, Code,
    FileBarChart, CheckCircle2, XCircle, Lock, Crown, AlertTriangle,
    ChevronDown, ChevronUp, Save, RefreshCw, Info, Zap, Building2,
    School, Search, Filter, LayoutGrid, List
} from 'lucide-react';

// Icon mapping
const ICONS = {
    Users, UserCheck, Calendar, Clock, FileText, CalendarOff,
    QrCode, CreditCard, Upload, MessageSquare, Smartphone,
    Fingerprint, ScanFace, Camera, Activity, Cpu, Settings, Watch,
    MapPin, Navigation, Monitor, Video, Mic, Shield, Eye, Code,
    FileBarChart, BarChart3: Activity
};

// Tier colors and labels
const TIER_CONFIG = {
    basic: { 
        label: 'Basic', 
        color: 'bg-gray-100 text-gray-700 border-gray-300',
        badge: 'bg-gray-500',
        description: 'Manual attendance only'
    },
    standard: { 
        label: 'Standard', 
        color: 'bg-blue-100 text-blue-700 border-blue-300',
        badge: 'bg-blue-500',
        description: 'QR Code + RFID/NFC Cards'
    },
    premium: { 
        label: 'Premium', 
        color: 'bg-purple-100 text-purple-700 border-purple-300',
        badge: 'bg-purple-500',
        description: 'Biometric + Face Recognition'
    },
    enterprise: { 
        label: 'Enterprise', 
        color: 'bg-amber-100 text-amber-700 border-amber-300',
        badge: 'bg-amber-500',
        description: 'All Features + GPS + AI'
    },
    trial: { 
        label: 'Trial', 
        color: 'bg-green-100 text-green-700 border-green-300',
        badge: 'bg-green-500',
        description: 'All features for trial period'
    }
};

export default function BranchAttendanceConfig() {
    const { toast } = useToast();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [organizations, setOrganizations] = useState([]);
    const [branches, setBranches] = useState([]);
    const [moduleTypes, setModuleTypes] = useState([]);
    const [branchConfigs, setBranchConfigs] = useState({});
    
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [pendingChanges, setPendingChanges] = useState({});
    const [expandedTiers, setExpandedTiers] = useState({
        basic: true,
        standard: true,
        premium: false,
        enterprise: false
    });
    
    // Fetch all data
    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Get all organizations (only id and name - subscription_status may not exist in older schemas)
            const { data: orgs, error: orgsError } = await supabase
                .from('organizations')
                .select('id, name')
                .order('name');
            
            if (orgsError) throw orgsError;
            setOrganizations(orgs || []);
            
            // 2. Get all branches (only core columns that definitely exist)
            const { data: branchList, error: branchError } = await supabase
                .from('schools')
                .select('id, name, organization_id')
                .order('name');
            
            if (branchError) throw branchError;
            setBranches(branchList || []);
            
            // 3. Get all module types
            const { data: modules, error: modulesError } = await supabase
                .from('attendance_module_types')
                .select('*')
                .eq('is_active', true)
                .order('sort_order');
            
            if (modulesError) throw modulesError;
            setModuleTypes(modules || []);
            
            // 4. Get all branch configs
            const { data: configs, error: configsError } = await supabase
                .from('branch_attendance_config')
                .select('branch_id, module_code, is_enabled, settings');
            
            if (configsError) throw configsError;
            
            // Group configs by branch_id
            const configMap = {};
            configs?.forEach(c => {
                if (!configMap[c.branch_id]) {
                    configMap[c.branch_id] = {};
                }
                configMap[c.branch_id][c.module_code] = {
                    is_enabled: c.is_enabled,
                    settings: c.settings
                };
            });
            setBranchConfigs(configMap);
            
            // Default select first org
            if (orgs && orgs.length > 0 && !selectedOrg) {
                setSelectedOrg(orgs[0].id);
            }
            
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, []);
    
    // Filter branches by selected org
    const filteredBranches = useMemo(() => {
        let list = branches;
        
        if (selectedOrg) {
            list = list.filter(b => b.organization_id === selectedOrg);
        }
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            list = list.filter(b => b.name.toLowerCase().includes(term));
        }
        
        return list;
    }, [branches, selectedOrg, searchTerm]);
    
    // Get selected branch data
    const selectedBranchData = useMemo(() => {
        if (!selectedBranch) return null;
        return branches.find(b => b.id === selectedBranch);
    }, [selectedBranch, branches]);
    
    // Get modules with current state for selected branch
    // Note: All modules are available - subscription_tier column doesn't exist in schools table
    const modulesWithState = useMemo(() => {
        if (!selectedBranch) return [];
        
        return moduleTypes.map(mod => {
            const config = branchConfigs[selectedBranch]?.[mod.code];
            const pendingState = pendingChanges[`${selectedBranch}:${mod.code}`];
            
            return {
                ...mod,
                is_enabled: pendingState !== undefined ? pendingState : (config?.is_enabled || false),
                is_available: true, // All modules available to Master Admin
                has_pending_change: pendingState !== undefined
            };
        });
    }, [selectedBranch, moduleTypes, branchConfigs, pendingChanges]);
    
    // Group modules by tier
    const modulesByTier = useMemo(() => {
        return {
            basic: modulesWithState.filter(m => m.minimum_tier === 'basic'),
            standard: modulesWithState.filter(m => m.minimum_tier === 'standard'),
            premium: modulesWithState.filter(m => m.minimum_tier === 'premium'),
            enterprise: modulesWithState.filter(m => m.minimum_tier === 'enterprise')
        };
    }, [modulesWithState]);
    
    // Toggle module
    const handleToggle = (moduleCode) => {
        if (!selectedBranch) return;
        
        const key = `${selectedBranch}:${moduleCode}`;
        const currentState = modulesWithState.find(m => m.code === moduleCode)?.is_enabled || false;
        
        setPendingChanges(prev => ({
            ...prev,
            [key]: !currentState
        }));
    };
    
    // Save changes
    const saveChanges = async () => {
        if (Object.keys(pendingChanges).length === 0) {
            toast({ title: 'Info', description: 'No changes to save' });
            return;
        }
        
        setSaving(true);
        try {
            let updatedCount = 0;
            const errors = [];
            
            // Group changes by branch
            const changesByBranch = {};
            for (const [key, enabled] of Object.entries(pendingChanges)) {
                const [branchId, moduleCode] = key.split(':');
                if (!changesByBranch[branchId]) {
                    changesByBranch[branchId] = [];
                }
                changesByBranch[branchId].push({ moduleCode, enabled });
            }
            
            // Process each branch's changes
            for (const [branchId, changes] of Object.entries(changesByBranch)) {
                // Get org_id for this branch
                const branch = branches.find(b => b.id === branchId);
                const orgId = branch?.organization_id;
                
                for (const { moduleCode, enabled } of changes) {
                    try {
                        const { error } = await supabase
                            .from('branch_attendance_config')
                            .upsert({
                                organization_id: orgId,
                                branch_id: branchId,
                                module_code: moduleCode,
                                is_enabled: enabled,
                                updated_at: new Date().toISOString()
                            }, {
                                onConflict: 'branch_id,module_code'
                            });
                        
                        if (error) throw error;
                        updatedCount++;
                    } catch (err) {
                        errors.push({ branch: branch?.name, module: moduleCode, error: err.message });
                    }
                }
            }
            
            toast({ title: 'Success', description: `Updated ${updatedCount} module configurations` });
            
            if (errors.length > 0) {
                console.error('Errors:', errors);
                toast({ title: 'Warning', description: `${errors.length} errors occurred`, variant: 'destructive' });
            }
            
            setPendingChanges({});
            fetchData(); // Refresh
            
        } catch (error) {
            console.error('Error saving:', error);
            toast({ title: 'Error', description: error.message || 'Failed to save', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };
    
    // Update branch tier - DISABLED: subscription_tier column doesn't exist
    // This would require adding the column to schools table first
    const updateBranchTier = async (branchId, newTier) => {
        toast({ title: 'Info', description: 'Tier management not available - all modules are accessible' });
    };
    
    // Render module card
    const renderModuleCard = (module) => {
        const IconComponent = ICONS[module.icon] || Settings;
        const isEnabled = module.is_enabled;
        const isAvailable = module.is_available;
        const hasPending = module.has_pending_change;
        
        return (
            <div 
                key={module.code}
                className={`
                    p-4 rounded-lg border transition-all
                    ${!isAvailable ? 'bg-gray-50 dark:bg-gray-800/50 opacity-60' : 'bg-white dark:bg-gray-800 hover:shadow-md dark:hover:shadow-gray-900/50'}
                    ${hasPending ? 'ring-2 ring-yellow-400' : ''}
                    dark:border-gray-700
                `}
            >
                <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`
                        p-2 rounded-lg flex-shrink-0
                        ${isEnabled && isAvailable ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}
                    `}>
                        <IconComponent className="w-5 h-5" />
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{module.name}</h4>
                            {module.requires_hardware && (
                                <span className="px-1.5 py-0.5 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded">
                                    Hardware
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {module.description}
                        </p>
                    </div>
                    
                    {/* Toggle */}
                    <div className="flex-shrink-0">
                        {isAvailable ? (
                            <button
                                onClick={() => handleToggle(module.code)}
                                className={`
                                    relative w-11 h-6 rounded-full transition-colors duration-200
                                    ${isEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}
                                `}
                            >
                                <span className={`
                                    absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full 
                                    transition-transform duration-200 shadow
                                    ${isEnabled ? 'translate-x-5' : 'translate-x-0'}
                                `} />
                            </button>
                        ) : (
                            <Lock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        )}
                    </div>
                </div>
            </div>
        );
    };
    
    // Render tier section
    const renderTierSection = (tier, modules) => {
        if (!modules || modules.length === 0) return null;
        
        const tierConfig = TIER_CONFIG[tier];
        const isExpanded = expandedTiers[tier];
        const enabledCount = modules.filter(m => m.is_enabled).length;
        const availableCount = modules.filter(m => m.is_available).length;
        
        return (
            <div key={tier} className={`border rounded-xl overflow-hidden dark:border-gray-700 ${tierConfig.color}`}>
                <button
                    onClick={() => setExpandedTiers(prev => ({ ...prev, [tier]: !prev[tier] }))}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-opacity-80"
                >
                    <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-white text-xs font-medium ${tierConfig.badge}`}>
                            {tierConfig.label}
                        </span>
                        <span className="text-sm font-medium">{tierConfig.description}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm">
                            {enabledCount}/{availableCount} enabled
                        </span>
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                </button>
                
                {isExpanded && (
                    <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {modules.map(renderModuleCard)}
                        </div>
                    </div>
                )}
            </div>
        );
    };
    
    if (loading) {
        return (
            <DashboardLayout>
                <div className="p-6 flex items-center justify-center min-h-[400px]">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            </DashboardLayout>
        );
    }
    
    const pendingCount = Object.keys(pendingChanges).length;
    
    return (
        <DashboardLayout>
            <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Settings className="w-7 h-7 text-blue-600" />
                                Branch Attendance Configuration
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Configure which attendance modules are available for each branch
                            </p>
                        </div>
                        
                        {/* Save button */}
                        {pendingCount > 0 && (
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                                    {pendingCount} unsaved changes
                                </span>
                            <button
                                onClick={() => setPendingChanges({})}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveChanges}
                                disabled={saving}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="grid grid-cols-12 gap-6">
                {/* Left Panel - Organizations & Branches */}
                <div className="col-span-4 space-y-4">
                    {/* Organization Selector */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-blue-600" />
                            Select Organization
                        </h3>
                        <select
                            value={selectedOrg || ''}
                            onChange={(e) => {
                                setSelectedOrg(e.target.value);
                                setSelectedBranch(null);
                            }}
                            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">All Organizations</option>
                            {organizations.map(org => (
                                <option key={org.id} value={org.id}>{org.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Branch List */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700">
                        <div className="p-4 border-b dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <School className="w-5 h-5 text-green-600" />
                                Branches ({filteredBranches.length})
                            </h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search branches..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                />
                            </div>
                        </div>
                        
                        <div className="max-h-[500px] overflow-y-auto">
                            {filteredBranches.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    No branches found
                                </div>
                            ) : (
                                filteredBranches.map(branch => {
                                    const enabledModules = Object.values(branchConfigs[branch.id] || {})
                                        .filter(c => c.is_enabled).length;
                                    const isSelected = selectedBranch === branch.id;
                                    
                                    return (
                                        <button
                                            key={branch.id}
                                            onClick={() => setSelectedBranch(branch.id)}
                                            className={`
                                                w-full px-4 py-3 text-left border-b dark:border-gray-700 last:border-b-0
                                                hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                                                ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-l-blue-500' : ''}
                                            `}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">{branch.name}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        {enabledModules} modules enabled
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Right Panel - Module Configuration */}
                <div className="col-span-8">
                    {!selectedBranch ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-12 text-center">
                            <School className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Select a Branch</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">
                                Select a branch from the left panel to configure its attendance modules
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Branch Info */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl border border-blue-100 dark:border-blue-800 p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                            <School className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h2 className="font-semibold text-gray-900 dark:text-white">{selectedBranchData?.name}</h2>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Organization: {organizations.find(o => o.id === selectedBranchData?.organization_id)?.name}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Tier Selector - Disabled: subscription_tier column doesn't exist */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">All modules accessible</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Module Categories */}
                            <div className="space-y-4">
                                {renderTierSection('basic', modulesByTier.basic)}
                                {renderTierSection('standard', modulesByTier.standard)}
                                {renderTierSection('premium', modulesByTier.premium)}
                                {renderTierSection('enterprise', modulesByTier.enterprise)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            </div>
        </DashboardLayout>
    );
}
