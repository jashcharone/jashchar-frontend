import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
    MessageSquare, Bot, FileText, Zap, Megaphone, BarChart3, Headphones, Users,
    Plus, Edit, Trash2, Loader2, Check, X, ChevronDown, ChevronRight, Building2,
    Sparkles, Crown, Settings, RefreshCw, Search, Filter, Save
} from "lucide-react";
import api from '@/lib/api';
import { useToast } from "@/components/ui/use-toast";

// Icon mapping
const iconMap = {
    MessageSquare, Bot, FileText, Zap, Megaphone, BarChart3, Headphones, Users,
    Sparkles, Crown, Settings, Plus, Edit, Check
};

const getIcon = (iconName, className = "h-5 w-5") => {
    const Icon = iconMap[iconName] || MessageSquare;
    return <Icon className={className} />;
};

const WhatsAppModules = () => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("modules");
    const [loading, setLoading] = useState(false);
    
    // Modules State
    const [modules, setModules] = useState([]);
    const [expandedModules, setExpandedModules] = useState({});
    
    // Branch Assignments State
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [branchAssignments, setBranchAssignments] = useState([]);
    
    // Dialog States
    const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
    const [isSubmoduleDialogOpen, setIsSubmoduleDialogOpen] = useState(false);
    const [editingModule, setEditingModule] = useState(null);
    const [editingSubmodule, setEditingSubmodule] = useState(null);
    
    // Form States
    const [moduleForm, setModuleForm] = useState({
        name: '', code: '', description: '', icon: 'MessageSquare', color: '#25D366', is_premium: false
    });
    const [submoduleForm, setSubmoduleForm] = useState({
        module_id: '', name: '', code: '', description: '', icon: '', is_premium: false, is_ai_powered: false
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // FETCH DATA
    // ═══════════════════════════════════════════════════════════════════════════

    const fetchModules = async () => {
        setLoading(true);
        try {
            const res = await api.get('/whatsapp-manager/modules');
            if (res.data.success) {
                setModules(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch modules:', error);
            toast({ title: "Error", description: "Failed to fetch modules", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const res = await api.get('/whatsapp-manager/branch-assignments');
            if (res.data.success) {
                setBranches(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch branches:', error);
        }
    };

    const fetchBranchModules = async (branchId) => {
        try {
            const res = await api.get(`/whatsapp-manager/branch-modules/${branchId}`);
            if (res.data.success) {
                setBranchAssignments(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch branch modules:', error);
        }
    };

    useEffect(() => {
        fetchModules();
        fetchBranches();
    }, []);

    useEffect(() => {
        if (selectedBranch) {
            fetchBranchModules(selectedBranch);
        }
    }, [selectedBranch]);

    // ═══════════════════════════════════════════════════════════════════════════
    // MODULE CRUD
    // ═══════════════════════════════════════════════════════════════════════════

    const handleSaveModule = async () => {
        try {
            if (editingModule) {
                await api.put(`/whatsapp-manager/modules/${editingModule.id}`, moduleForm);
                toast({ title: "Success", description: "Module updated successfully" });
            } else {
                await api.post('/whatsapp-manager/modules', moduleForm);
                toast({ title: "Success", description: "Module created successfully" });
            }
            setIsModuleDialogOpen(false);
            setEditingModule(null);
            setModuleForm({ name: '', code: '', description: '', icon: 'MessageSquare', color: '#25D366', is_premium: false });
            fetchModules();
        } catch (error) {
            toast({ title: "Error", description: error.response?.data?.message || "Failed to save module", variant: "destructive" });
        }
    };

    const handleDeleteModule = async (id) => {
        if (!confirm('Are you sure? This will delete all submodules too.')) return;
        try {
            await api.delete(`/whatsapp-manager/modules/${id}`);
            toast({ title: "Success", description: "Module deleted" });
            fetchModules();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete module", variant: "destructive" });
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // SUBMODULE CRUD
    // ═══════════════════════════════════════════════════════════════════════════

    const handleSaveSubmodule = async () => {
        try {
            if (editingSubmodule) {
                await api.put(`/whatsapp-manager/submodules/${editingSubmodule.id}`, submoduleForm);
                toast({ title: "Success", description: "Submodule updated" });
            } else {
                await api.post('/whatsapp-manager/submodules', submoduleForm);
                toast({ title: "Success", description: "Submodule created" });
            }
            setIsSubmoduleDialogOpen(false);
            setEditingSubmodule(null);
            setSubmoduleForm({ module_id: '', name: '', code: '', description: '', icon: '', is_premium: false, is_ai_powered: false });
            fetchModules();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save submodule", variant: "destructive" });
        }
    };

    const handleDeleteSubmodule = async (id) => {
        if (!confirm('Delete this submodule?')) return;
        try {
            await api.delete(`/whatsapp-manager/submodules/${id}`);
            toast({ title: "Success", description: "Submodule deleted" });
            fetchModules();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete submodule", variant: "destructive" });
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // BRANCH ASSIGNMENTS
    // ═══════════════════════════════════════════════════════════════════════════

    const handleAssignModules = async () => {
        if (!selectedBranch) return;
        
        try {
            const branch = branches.find(b => b.id === selectedBranch);
            await api.post('/whatsapp-manager/branch-assignments', {
                branch_id: selectedBranch,
                organization_id: branch?.organization_id,
                assignments: branchAssignments.map(a => ({
                    module_id: a.module_id,
                    submodule_id: a.submodule_id,
                    is_enabled: a.is_enabled,
                    config: a.config
                }))
            });
            toast({ title: "Success", description: "Branch modules updated" });
            fetchBranches();
        } catch (error) {
            toast({ title: "Error", description: "Failed to update assignments", variant: "destructive" });
        }
    };

    const toggleModuleExpand = (moduleId) => {
        setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
    };

    const isModuleAssigned = (moduleId) => {
        return branchAssignments.some(a => a.module_id === moduleId);
    };

    const isSubmoduleAssigned = (submoduleId) => {
        return branchAssignments.some(a => a.submodule_id === submoduleId);
    };

    const toggleModuleAssignment = (module) => {
        if (isModuleAssigned(module.id)) {
            // Remove all submodules of this module
            setBranchAssignments(prev => prev.filter(a => a.module_id !== module.id));
        } else {
            // Add module and all submodules
            const newAssignments = [
                { module_id: module.id, submodule_id: null, is_enabled: true, config: {} },
                ...(module.submodules || []).map(s => ({
                    module_id: module.id,
                    submodule_id: s.id,
                    is_enabled: true,
                    config: {}
                }))
            ];
            setBranchAssignments(prev => [...prev, ...newAssignments]);
        }
    };

    const toggleSubmoduleAssignment = (moduleId, submodule) => {
        if (isSubmoduleAssigned(submodule.id)) {
            setBranchAssignments(prev => prev.filter(a => a.submodule_id !== submodule.id));
        } else {
            // Make sure module is assigned first
            if (!isModuleAssigned(moduleId)) {
                setBranchAssignments(prev => [
                    ...prev,
                    { module_id: moduleId, submodule_id: null, is_enabled: true, config: {} }
                ]);
            }
            setBranchAssignments(prev => [
                ...prev,
                { module_id: moduleId, submodule_id: submodule.id, is_enabled: true, config: {} }
            ]);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-green-50 dark:bg-green-900/20">
                    <TabsTrigger value="modules" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                        <Settings className="h-4 w-4 mr-2" /> All Modules
                    </TabsTrigger>
                    <TabsTrigger value="assignments" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                        <Building2 className="h-4 w-4 mr-2" /> Branch Assignments
                    </TabsTrigger>
                </TabsList>

                {/* ═══════════════════ MODULES TAB ═══════════════════ */}
                <TabsContent value="modules" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-semibold">WhatsApp Modules & Submodules</h2>
                            <p className="text-muted-foreground text-sm">Manage all WhatsApp features available in the system</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={fetchModules} disabled={loading}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
                            </Button>
                            <Button onClick={() => { setEditingModule(null); setModuleForm({ name: '', code: '', description: '', icon: 'MessageSquare', color: '#25D366', is_premium: false }); setIsModuleDialogOpen(true); }}>
                                <Plus className="h-4 w-4 mr-2" /> Add Module
                            </Button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {modules.map(module => (
                                <Card key={module.id} className="overflow-hidden">
                                    <CardHeader 
                                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                        onClick={() => toggleModuleExpand(module.id)}
                                        style={{ borderLeft: `4px solid ${module.color}` }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {expandedModules[module.id] ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                                <div className="p-2 rounded-lg" style={{ backgroundColor: `${module.color}20` }}>
                                                    {getIcon(module.icon, `h-6 w-6`)}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg flex items-center gap-2">
                                                        {module.name}
                                                        {module.is_premium && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Crown className="h-3 w-3 mr-1" /> Premium</Badge>}
                                                    </CardTitle>
                                                    <CardDescription>{module.description}</CardDescription>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                <Badge variant="outline">{module.submodules?.length || 0} submodules</Badge>
                                                <Button variant="ghost" size="sm" onClick={() => { setSubmoduleForm({ module_id: module.id, name: '', code: '', description: '', icon: '', is_premium: false, is_ai_powered: false }); setEditingSubmodule(null); setIsSubmoduleDialogOpen(true); }}>
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => { setEditingModule(module); setModuleForm(module); setIsModuleDialogOpen(true); }}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteModule(module.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    
                                    {expandedModules[module.id] && module.submodules?.length > 0 && (
                                        <CardContent className="pt-0">
                                            <div className="grid gap-2 ml-10">
                                                {module.submodules.map(sub => (
                                                    <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            {getIcon(sub.icon, "h-4 w-4 text-gray-600")}
                                                            <div>
                                                                <span className="font-medium">{sub.name}</span>
                                                                <div className="flex gap-1 mt-1">
                                                                    {sub.is_ai_powered && <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs"><Sparkles className="h-3 w-3 mr-1" /> AI</Badge>}
                                                                    {sub.is_premium && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs"><Crown className="h-3 w-3 mr-1" /> Premium</Badge>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <code className="text-xs text-gray-500">{sub.code}</code>
                                                            <Button variant="ghost" size="sm" onClick={() => { setEditingSubmodule(sub); setSubmoduleForm(sub); setIsSubmoduleDialogOpen(true); }}>
                                                                <Edit className="h-3 w-3" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteSubmodule(sub.id)}>
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    )}
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* ═══════════════════ BRANCH ASSIGNMENTS TAB ═══════════════════ */}
                <TabsContent value="assignments" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-semibold">Branch WhatsApp Module Assignments</h2>
                            <p className="text-muted-foreground text-sm">Assign specific modules and features to each branch</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Branch List */}
                        <Card className="md:col-span-1">
                            <CardHeader>
                                <CardTitle className="text-base">Select Branch</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[400px]">
                                    <div className="space-y-2">
                                        {branches.map(branch => (
                                            <div
                                                key={branch.id}
                                                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                                    selectedBranch === branch.id 
                                                        ? 'bg-green-100 dark:bg-green-900 border-2 border-green-500' 
                                                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                }`}
                                                onClick={() => setSelectedBranch(branch.id)}
                                            >
                                                <div className="font-medium">{branch.branch_name}</div>
                                                <div className="text-xs text-muted-foreground">{branch.branch_code}</div>
                                                <div className="text-xs text-green-600 mt-1">
                                                    {branch.whatsapp_modules?.length || 0} modules assigned
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>

                        {/* Module Assignment */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center justify-between">
                                    <span>Assign Modules</span>
                                    {selectedBranch && (
                                        <Button onClick={handleAssignModules} size="sm">
                                            <Save className="h-4 w-4 mr-2" /> Save Assignments
                                        </Button>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!selectedBranch ? (
                                    <div className="text-center py-10 text-muted-foreground">
                                        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Select a branch to manage module assignments</p>
                                    </div>
                                ) : (
                                    <ScrollArea className="h-[400px]">
                                        <div className="space-y-4">
                                            {modules.map(module => (
                                                <div key={module.id} className="border rounded-lg overflow-hidden">
                                                    <div 
                                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800"
                                                        style={{ borderLeft: `4px solid ${module.color}` }}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Checkbox 
                                                                checked={isModuleAssigned(module.id)}
                                                                onCheckedChange={() => toggleModuleAssignment(module)}
                                                            />
                                                            {getIcon(module.icon, "h-5 w-5")}
                                                            <span className="font-medium">{module.name}</span>
                                                            {module.is_premium && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs"><Crown className="h-3 w-3" /></Badge>}
                                                        </div>
                                                    </div>
                                                    
                                                    {isModuleAssigned(module.id) && module.submodules?.length > 0 && (
                                                        <div className="p-3 space-y-2 bg-white dark:bg-gray-900">
                                                            {module.submodules.map(sub => (
                                                                <div key={sub.id} className="flex items-center gap-3 ml-6">
                                                                    <Checkbox 
                                                                        checked={isSubmoduleAssigned(sub.id)}
                                                                        onCheckedChange={() => toggleSubmoduleAssignment(module.id, sub)}
                                                                    />
                                                                    {getIcon(sub.icon, "h-4 w-4 text-gray-500")}
                                                                    <span className="text-sm">{sub.name}</span>
                                                                    {sub.is_ai_powered && <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs"><Sparkles className="h-3 w-3" /></Badge>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* ═══════════════════ MODULE DIALOG ═══════════════════ */}
            <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingModule ? 'Edit Module' : 'Add New Module'}</DialogTitle>
                        <DialogDescription>Configure WhatsApp module settings</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Name *</Label>
                            <Input value={moduleForm.name} onChange={e => setModuleForm({ ...moduleForm, name: e.target.value })} placeholder="e.g., Messaging" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Code *</Label>
                            <Input value={moduleForm.code} onChange={e => setModuleForm({ ...moduleForm, code: e.target.value.toLowerCase().replace(/\s+/g, '_') })} placeholder="e.g., messaging" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Textarea value={moduleForm.description} onChange={e => setModuleForm({ ...moduleForm, description: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Icon</Label>
                                <Select value={moduleForm.icon} onValueChange={v => setModuleForm({ ...moduleForm, icon: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(iconMap).map(icon => (
                                            <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Color</Label>
                                <Input type="color" value={moduleForm.color} onChange={e => setModuleForm({ ...moduleForm, color: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch checked={moduleForm.is_premium} onCheckedChange={v => setModuleForm({ ...moduleForm, is_premium: v })} />
                            <Label>Premium Feature</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModuleDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveModule}>Save Module</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══════════════════ SUBMODULE DIALOG ═══════════════════ */}
            <Dialog open={isSubmoduleDialogOpen} onOpenChange={setIsSubmoduleDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingSubmodule ? 'Edit Submodule' : 'Add New Submodule'}</DialogTitle>
                        <DialogDescription>Configure submodule settings</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Parent Module</Label>
                            <Select value={submoduleForm.module_id} onValueChange={v => setSubmoduleForm({ ...submoduleForm, module_id: v })}>
                                <SelectTrigger><SelectValue placeholder="Select module" /></SelectTrigger>
                                <SelectContent>
                                    {modules.map(m => (
                                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Name *</Label>
                            <Input value={submoduleForm.name} onChange={e => setSubmoduleForm({ ...submoduleForm, name: e.target.value })} placeholder="e.g., Auto Reply" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Code *</Label>
                            <Input value={submoduleForm.code} onChange={e => setSubmoduleForm({ ...submoduleForm, code: e.target.value.toLowerCase().replace(/\s+/g, '_') })} placeholder="e.g., auto_reply" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Textarea value={submoduleForm.description} onChange={e => setSubmoduleForm({ ...submoduleForm, description: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Icon</Label>
                            <Select value={submoduleForm.icon || ''} onValueChange={v => setSubmoduleForm({ ...submoduleForm, icon: v })}>
                                <SelectTrigger><SelectValue placeholder="Select icon" /></SelectTrigger>
                                <SelectContent>
                                    {Object.keys(iconMap).map(icon => (
                                        <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Switch checked={submoduleForm.is_premium} onCheckedChange={v => setSubmoduleForm({ ...submoduleForm, is_premium: v })} />
                                <Label>Premium</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch checked={submoduleForm.is_ai_powered} onCheckedChange={v => setSubmoduleForm({ ...submoduleForm, is_ai_powered: v })} />
                                <Label>AI Powered</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSubmoduleDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveSubmodule}>Save Submodule</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default WhatsAppModules;
