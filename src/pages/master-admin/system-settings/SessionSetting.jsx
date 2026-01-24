import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Power, CheckCircle, ChevronDown, ChevronRight, Building2, Plus, Calendar, RefreshCw, Save, Trash2, Edit2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SessionSetting = () => {
    const { toast } = useToast();
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState({}); // { branchId_sessionId: true }
    const [expandedOrgs, setExpandedOrgs] = useState({}); // Track expanded organizations
    const [createDialogOpen, setCreateDialogOpen] = useState({}); // { branchId: true }
    const [creating, setCreating] = useState({}); // { branchId: true }
    const [newSession, setNewSession] = useState({}); // { branchId: { name, startDate, endDate } }
    
    // Global Session Templates
    const [sessionTemplates, setSessionTemplates] = useState([]);
    const [newTemplate, setNewTemplate] = useState({ name: '', startDate: '', endDate: '', type: '' });
    const [savingTemplate, setSavingTemplate] = useState(false);
    
    // Edit Template State
    const [editingTemplateId, setEditingTemplateId] = useState(null);
    const [editForm, setEditForm] = useState({ startDate: '', endDate: '' });
    const [updatingTemplate, setUpdatingTemplate] = useState(false);

    // Edit Session State (for existing sessions)
    const [editingSessionId, setEditingSessionId] = useState(null);
    const [editSessionForm, setEditSessionForm] = useState({ startDate: '', endDate: '' });
    const [updatingSession, setUpdatingSession] = useState(false);

    // Format session name: YYYY-YY (e.g., 2025-26)
    const formatSessionName = (value) => {
        // Remove all non-digits
        const digits = value.replace(/\D/g, '');
        
        if (digits.length === 0) return '';
        if (digits.length <= 4) return digits;
        
        // Format as YYYY-YY
        const year1 = digits.substring(0, 4);
        const year2 = digits.substring(4, 6);
        return `${year1}-${year2}`;
    };

    // Validate session name format (YYYY-YY)
    const validateSessionName = (name) => {
        const pattern = /^\d{4}-\d{2}$/;
        if (!pattern.test(name)) {
            return 'Session name must be in format YYYY-YY (e.g., 2025-26)';
        }
        
        const [year1, year2] = name.split('-');
        const year1Num = parseInt(year1);
        const year2Num = parseInt(year2);
        
        // Check if year2 is the last 2 digits of year1+1
        const expectedYear2 = (year1Num + 1) % 100;
        if (year2Num !== expectedYear2) {
            return `Year should be ${year1}-${String(expectedYear2).padStart(2, '0')}`;
        }
        
        return null;
    };

    // Format date to DD-MM-YYYY for display
    const formatDateDisplay = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    // Convert DD-MM-YYYY to YYYY-MM-DD for backend
    const parseDateInput = (dateStr) => {
        if (!dateStr) return '';
        // If already in YYYY-MM-DD format (from date input), return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr;
        }
        // If in DD-MM-YYYY format, convert
        const parts = dateStr.split('-');
        if (parts.length === 3 && parts[0].length === 2) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateStr;
    };

    // Format date input value for display (YYYY-MM-DD to DD-MM-YYYY)
    const formatDateInput = (dateStr) => {
        if (!dateStr) return '';
        // If in YYYY-MM-DD format, convert to DD-MM-YYYY
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const parts = dateStr.split('-');
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateStr;
    };

    const fetchData = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const [orgsResponse, settingsResponse] = await Promise.all([
                api.get('/sessions/organizations-with-sessions'),
                api.get('/system-settings')
            ]);

            if (orgsResponse.data.success) {
                setOrganizations(orgsResponse.data.data || []);
                
                // Only reset expanded state on initial load (not background refresh)
                if (!isBackground) {
                    const expanded = {};
                    orgsResponse.data.data.forEach(org => {
                        expanded[org.id] = true;
                    });
                    setExpandedOrgs(expanded);
                }
            }

            // Handle settings response (returns object directly: { key: value })
            const settings = settingsResponse.data;
            if (settings) {
                const templatesValue = settings['session_templates'];
                if (templatesValue) {
                    try {
                        const parsed = typeof templatesValue === 'string' 
                            ? JSON.parse(templatesValue) 
                            : (templatesValue || []);
                        setSessionTemplates(Array.isArray(parsed) ? parsed : []);
                    } catch (e) {
                        console.error("Error parsing session templates", e);
                        setSessionTemplates([]);
                    }
                }
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch data';
            toast({ variant: 'destructive', title: 'Error', description: errorMsg });
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    const handleAddTemplate = async () => {
        if (!newTemplate.name || !newTemplate.startDate || !newTemplate.endDate || !newTemplate.type) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'All fields are required' });
            return;
        }

        const nameError = validateSessionName(newTemplate.name);
        if (nameError) {
            toast({ variant: 'destructive', title: 'Validation Error', description: nameError });
            return;
        }

        setSavingTemplate(true);
        try {
            const updatedTemplates = [...sessionTemplates, { ...newTemplate, id: Date.now() }];
            
            const response = await api.post('/system-settings/update', {
                session_templates: JSON.stringify(updatedTemplates)
            });

            if (response.status === 200) {
                setSessionTemplates(updatedTemplates);
                setNewTemplate({ name: '', startDate: '', endDate: '', type: '' });
                toast({ title: 'Success', description: 'Session template added' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save template' });
        } finally {
            setSavingTemplate(false);
        }
    };

    const handleDeleteTemplate = async (id) => {
        if (!confirm('Are you sure you want to delete this template?')) return;

        setSavingTemplate(true);
        try {
            const updatedTemplates = sessionTemplates.filter(t => t.id !== id);
            
            const response = await api.post('/system-settings/update', {
                session_templates: JSON.stringify(updatedTemplates)
            });

            if (response.status === 200) {
                setSessionTemplates(updatedTemplates);
                toast({ title: 'Success', description: 'Session template deleted' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete template' });
        } finally {
            setSavingTemplate(false);
        }
    };

    const startEditing = (template) => {
        setEditingTemplateId(template.id);
        setEditForm({
            startDate: template.startDate,
            endDate: template.endDate
        });
    };

    const cancelEditing = () => {
        setEditingTemplateId(null);
        setEditForm({ startDate: '', endDate: '' });
    };

    const handleUpdateTemplate = async () => {
        if (!editForm.startDate || !editForm.endDate) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Start and End dates are required' });
            return;
        }

        setUpdatingTemplate(true);
        try {
            const updatedTemplates = sessionTemplates.map(t => {
                if (t.id === editingTemplateId) {
                    return { ...t, startDate: editForm.startDate, endDate: editForm.endDate };
                }
                return t;
            });
            
            const response = await api.post('/system-settings/update', {
                session_templates: JSON.stringify(updatedTemplates)
            });

            if (response.status === 200) {
                setSessionTemplates(updatedTemplates);
                setEditingTemplateId(null);
                toast({ title: 'Success', description: 'Session template updated' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update template' });
        } finally {
            setUpdatingTemplate(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleActivateSession = async (branchId, sessionId, sessionName, branchName) => {
        const key = `${branchId}_${sessionId}`;
        setActivating(prev => ({ ...prev, [key]: true }));

        try {
            const response = await api.post('/sessions/activate-branch-session', {
                branchId,
                sessionId
            });

            if (response.data.success) {
                toast({ 
                    title: 'Session Activated', 
                    description: `Session "${sessionName}" activated for ${branchName}` 
                });
                await fetchData(true); // Refresh data without resetting view
            } else {
                toast({ 
                    variant: 'destructive', 
                    title: 'Activation Failed', 
                    description: response.data.message || 'Failed to activate session' 
                });
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to activate session';
            toast({ variant: 'destructive', title: 'Activation Failed', description: errorMsg });
        } finally {
            setActivating(prev => {
                const newState = { ...prev };
                delete newState[key];
                return newState;
            });
        }
    };

    const startEditingSession = (session) => {
        setEditingSessionId(session.id);
        setEditSessionForm({
            startDate: session.start_date,
            endDate: session.end_date
        });
    };

    const cancelEditingSession = () => {
        setEditingSessionId(null);
        setEditSessionForm({ startDate: '', endDate: '' });
    };

    const handleUpdateSession = async () => {
        if (!editSessionForm.startDate || !editSessionForm.endDate) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Start and End dates are required' });
            return;
        }

        setUpdatingSession(true);
        try {
            const response = await api.post('/sessions/update-session', {
                sessionId: editingSessionId,
                startDate: editSessionForm.startDate,
                endDate: editSessionForm.endDate
            });

            if (response.data.success) {
                toast({ title: 'Success', description: 'Session updated successfully' });
                setEditingSessionId(null);
                await fetchData(true);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to update session';
            toast({ variant: 'destructive', title: 'Error', description: errorMsg });
        } finally {
            setUpdatingSession(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return formatDateDisplay(dateStr);
    };

    const toggleOrg = (orgId) => {
        setExpandedOrgs(prev => ({
            ...prev,
            [orgId]: !prev[orgId]
        }));
    };

    const openCreateDialog = (branchId) => {
        setCreateDialogOpen(prev => ({ ...prev, [branchId]: true }));
        setNewSession(prev => ({
            ...prev,
            [branchId]: { name: '', startDate: '', endDate: '' }
        }));
    };

    const closeCreateDialog = (branchId) => {
        setCreateDialogOpen(prev => ({ ...prev, [branchId]: false }));
        setNewSession(prev => {
            const newState = { ...prev };
            delete newState[branchId];
            return newState;
        });
    };

    const handleCreateSession = async (branchId, branchName) => {
        const sessionData = newSession[branchId];
        if (!sessionData || !sessionData.name?.trim()) {
            toast({ 
                variant: 'destructive', 
                title: 'Validation Error', 
                description: 'Session name is required' 
            });
            return;
        }

        // Validate session name format
        const nameError = validateSessionName(sessionData.name.trim());
        if (nameError) {
            toast({ 
                variant: 'destructive', 
                title: 'Validation Error', 
                description: nameError 
            });
            return;
        }

        setCreating(prev => ({ ...prev, [branchId]: true }));

        try {
            // Convert dates from DD-MM-YYYY to YYYY-MM-DD for backend
            const startDate = sessionData.startDate ? parseDateInput(sessionData.startDate) : null;
            const endDate = sessionData.endDate ? parseDateInput(sessionData.endDate) : null;

            const response = await api.post('/sessions/create-branch-session', {
                branchId,
                name: sessionData.name.trim(),
                startDate: startDate || null,
                endDate: endDate || null
            });

            if (response.data.success) {
                toast({ 
                    title: 'Session Created', 
                    description: `Session "${sessionData.name}" created successfully for ${branchName}` 
                });
                closeCreateDialog(branchId);
                await fetchData(true); // Refresh data without resetting view
            } else {
                toast({ 
                    variant: 'destructive', 
                    title: 'Creation Failed', 
                    description: response.data.message || 'Failed to create session' 
                });
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to create session';
            toast({ variant: 'destructive', title: 'Creation Failed', description: errorMsg });
        } finally {
            setCreating(prev => {
                const newState = { ...prev };
                delete newState[branchId];
                return newState;
            });
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex items-center justify-between pb-4 border-b">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Session Settings</h1>
                        <p className="text-muted-foreground mt-2 text-sm">
                            Manage academic sessions for all branches. Each branch can have multiple sessions with different active periods.
                        </p>
                    </div>
                    <Button onClick={fetchData} variant="outline" size="sm" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </Button>
                </div>

                {/* Global Session Templates */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            Global Session Templates
                        </CardTitle>
                        <CardDescription>
                            Define standard academic sessions (e.g., 2025-26) that can be quickly assigned to new schools during registration.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-muted/30 rounded-lg border">
                            <div>
                                <Label className="text-xs mb-1.5 block">Type</Label>
                                <Input 
                                    placeholder="School, PUC, etc." 
                                    value={newTemplate.type}
                                    onChange={(e) => setNewTemplate(prev => ({ ...prev, type: e.target.value }))}
                                    className="h-9"
                                />
                            </div>
                            <div>
                                <Label className="text-xs mb-1.5 block">Session Name (YYYY-YY)</Label>
                                <Input 
                                    placeholder="2025-26" 
                                    value={newTemplate.name}
                                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: formatSessionName(e.target.value) }))}
                                    maxLength={7}
                                    className="h-9"
                                />
                            </div>
                            <div>
                                <Label className="text-xs mb-1.5 block">Start Date</Label>
                                <Input 
                                    type="date" 
                                    value={newTemplate.startDate}
                                    onChange={(e) => setNewTemplate(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="h-9"
                                />
                            </div>
                            <div>
                                <Label className="text-xs mb-1.5 block">End Date</Label>
                                <Input 
                                    type="date" 
                                    value={newTemplate.endDate}
                                    onChange={(e) => setNewTemplate(prev => ({ ...prev, endDate: e.target.value }))}
                                    className="h-9"
                                />
                            </div>
                            <div className="flex items-end">
                                <Button 
                                    onClick={handleAddTemplate} 
                                    disabled={savingTemplate}
                                    className="w-full gap-2 h-9"
                                >
                                    {savingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                    Add
                                </Button>
                            </div>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Session Name</TableHead>
                                    <TableHead>Start Date</TableHead>
                                    <TableHead>End Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sessionTemplates.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No templates defined. Add one above.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sessionTemplates.map((template) => (
                                        <TableRow key={template.id}>
                                            <TableCell>
                                                <Badge variant="outline">{template.type || 'School'}</Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">{template.name}</TableCell>
                                            <TableCell>
                                                {editingTemplateId === template.id ? (
                                                    <Input 
                                                        type="date" 
                                                        value={editForm.startDate}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, startDate: e.target.value }))}
                                                        className="h-8 w-32"
                                                    />
                                                ) : (
                                                    formatDateDisplay(template.startDate)
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {editingTemplateId === template.id ? (
                                                    <Input 
                                                        type="date" 
                                                        value={editForm.endDate}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, endDate: e.target.value }))}
                                                        className="h-8 w-32"
                                                    />
                                                ) : (
                                                    formatDateDisplay(template.endDate)
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {editingTemplateId === template.id ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={handleUpdateTemplate}
                                                            disabled={updatingTemplate}
                                                            className="text-green-600 hover:text-green-800 hover:bg-green-50"
                                                        >
                                                            {updatingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={cancelEditing}
                                                            disabled={updatingTemplate}
                                                            className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={() => startEditing(template)}
                                                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={() => handleDeleteTemplate(template.id)}
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {organizations.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="py-16 text-center">
                            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <p className="text-muted-foreground text-lg font-medium">No organizations found</p>
                            <p className="text-muted-foreground text-sm mt-2">Create organizations first to manage sessions</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {organizations.map((org) => (
                            <Card key={org.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <Collapsible open={expandedOrgs[org.id]} onOpenChange={() => toggleOrg(org.id)}>
                                    <CollapsibleTrigger asChild>
                                        <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors border-b">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {expandedOrgs[org.id] ? (
                                                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                                    ) : (
                                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <Building2 className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-xl">{org.name}</CardTitle>
                                                        {org.code && (
                                                            <p className="text-xs text-muted-foreground mt-0.5">Code: {org.code}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className="px-3 py-1">
                                                    {org.branches?.length || 0} Branch{org.branches?.length !== 1 ? 'es' : ''}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <CardContent className="pt-6">
                                            {org.branches && org.branches.length > 0 ? (
                                                <div className="space-y-4">
                                                    {org.branches.map((branch) => (
                                                        <div 
                                                            key={branch.id} 
                                                            className="border-2 rounded-xl p-5 bg-gradient-to-br from-card to-muted/20 hover:border-primary/30 transition-all"
                                                        >
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                                                                        {branch.sequence || 1}
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-semibold text-lg text-foreground">
                                                                                {branch.branch_label}
                                                                            </span>
                                                                            {branch.is_primary && (
                                                                                <Badge variant="default" className="text-xs">
                                                                                    Primary
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-sm text-muted-foreground mt-0.5">{branch.name}</p>
                                                                        {branch.branch_code && (
                                                                            <p className="text-xs text-muted-foreground mt-0.5">Code: {branch.branch_code}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {branch.current_session && (
                                                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700 px-3 py-1">
                                                                            <CheckCircle className="h-3 w-3 mr-1.5" />
                                                                            Active: {branch.current_session.name}
                                                                        </Badge>
                                                                    )}
                                                                    <Button 
                                                                        variant="default" 
                                                                        size="sm"
                                                                        onClick={() => openCreateDialog(branch.id)}
                                                                        className="gap-2 shadow-sm"
                                                                    >
                                                                        <Plus className="h-4 w-4" />
                                                                        New Session
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            {/* Create Session Dialog */}
                                                            <Dialog 
                                                                open={createDialogOpen[branch.id] || false} 
                                                                onOpenChange={(open) => open ? openCreateDialog(branch.id) : closeCreateDialog(branch.id)}
                                                            >
                                                                <DialogContent className="sm:max-w-md">
                                                                    <DialogHeader>
                                                                        <DialogTitle className="text-xl">Create New Session</DialogTitle>
                                                                        <DialogDescription>
                                                                            Add a new academic session for <strong>{branch.branch_label}</strong>. Format: YYYY-YY (e.g., 2025-26)
                                                                        </DialogDescription>
                                                                    </DialogHeader>
                                                                    <div className="space-y-4 py-4">
                                                                        {/* Template Selection */}
                                                                        {sessionTemplates.length > 0 && (
                                                                            <div className="p-3 bg-muted/30 rounded-lg border mb-2">
                                                                                <Label className="text-sm font-medium mb-1.5 block text-primary">Quick Fill from Template</Label>
                                                                                <Select
                                                                                    onValueChange={(val) => {
                                                                                        const template = sessionTemplates.find(t => t.id.toString() === val);
                                                                                        if (template) {
                                                                                            setNewSession(prev => ({
                                                                                                ...prev,
                                                                                                [branch.id]: {
                                                                                                    name: template.name,
                                                                                                    startDate: template.startDate,
                                                                                                    endDate: template.endDate
                                                                                                }
                                                                                            }));
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <SelectTrigger className="bg-background">
                                                                                        <SelectValue placeholder="Select a template to auto-fill..." />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        {sessionTemplates.map((t) => (
                                                                                            <SelectItem key={t.id} value={t.id.toString()}>
                                                                                                {t.type ? `[${t.type}] ` : ''}{t.name} ({formatDateDisplay(t.startDate)} - {formatDateDisplay(t.endDate)})
                                                                                            </SelectItem>
                                                                                        ))}
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </div>
                                                                        )}

                                                                        <div>
                                                                            <Label htmlFor={`session-name-${branch.id}`} className="text-sm font-medium">
                                                                                Session Name <span className="text-red-500">*</span>
                                                                            </Label>
                                                                            <Input
                                                                                id={`session-name-${branch.id}`}
                                                                                placeholder="2025-26"
                                                                                value={newSession[branch.id]?.name || ''}
                                                                                onChange={(e) => {
                                                                                    const formatted = formatSessionName(e.target.value);
                                                                                    setNewSession(prev => ({
                                                                                        ...prev,
                                                                                        [branch.id]: { ...(prev[branch.id] || {}), name: formatted }
                                                                                    }));
                                                                                }}
                                                                                maxLength={7}
                                                                                className="mt-1.5"
                                                                            />
                                                                            <p className="text-xs text-muted-foreground mt-1.5">
                                                                                Format: YYYY-YY (e.g., 2025-26)
                                                                            </p>
                                                                        </div>
                                                                        <div className="grid grid-cols-2 gap-4">
                                                                            <div>
                                                                                <Label htmlFor={`start-date-${branch.id}`} className="text-sm font-medium flex items-center gap-1.5">
                                                                                    <Calendar className="h-3.5 w-3.5" />
                                                                                    Start Date
                                                                                </Label>
                                                                                <Input
                                                                                    id={`start-date-${branch.id}`}
                                                                                    type="date"
                                                                                    value={newSession[branch.id]?.startDate || ''}
                                                                                    onChange={(e) => setNewSession(prev => ({
                                                                                        ...prev,
                                                                                        [branch.id]: { ...(prev[branch.id] || {}), startDate: e.target.value }
                                                                                    }))}
                                                                                    className="mt-1.5"
                                                                                />
                                                                                <p className="text-xs text-muted-foreground mt-1.5">
                                                                                    Format: DD-MM-YYYY
                                                                                </p>
                                                                            </div>
                                                                            <div>
                                                                                <Label htmlFor={`end-date-${branch.id}`} className="text-sm font-medium flex items-center gap-1.5">
                                                                                    <Calendar className="h-3.5 w-3.5" />
                                                                                    End Date
                                                                                </Label>
                                                                                <Input
                                                                                    id={`end-date-${branch.id}`}
                                                                                    type="date"
                                                                                    value={newSession[branch.id]?.endDate || ''}
                                                                                    onChange={(e) => setNewSession(prev => ({
                                                                                        ...prev,
                                                                                        [branch.id]: { ...(prev[branch.id] || {}), endDate: e.target.value }
                                                                                    }))}
                                                                                    className="mt-1.5"
                                                                                />
                                                                                <p className="text-xs text-muted-foreground mt-1.5">
                                                                                    Format: DD-MM-YYYY
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <DialogFooter className="gap-2">
                                                                        <Button variant="outline" onClick={() => closeCreateDialog(branch.id)}>
                                                                            Cancel
                                                                        </Button>
                                                                        <Button 
                                                                            onClick={() => handleCreateSession(branch.id, branch.name)}
                                                                            disabled={creating[branch.id]}
                                                                            className="gap-2"
                                                                        >
                                                                            {creating[branch.id] ? (
                                                                                <>
                                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                                    Creating...
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Plus className="h-4 w-4" />
                                                                                    Create Session
                                                                                </>
                                                                            )}
                                                                        </Button>
                                                                    </DialogFooter>
                                                                </DialogContent>
                                                            </Dialog>

                                                            {branch.sessions && branch.sessions.length > 0 ? (
                                                                <div className="space-y-2.5 mt-4">
                                                                    {branch.sessions.map((session) => {
                                                                        const isActive = branch.current_session_id === session.id;
                                                                        const key = `${branch.id}_${session.id}`;
                                                                        const isActivating = activating[key];

                                                                        return (
                                                                            <div
                                                                                key={session.id}
                                                                                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                                                                                    isActive 
                                                                                        ? 'bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 border-green-300 dark:border-green-700 shadow-sm' 
                                                                                        : 'bg-card hover:bg-muted/30 border-border hover:border-primary/20'
                                                                                }`}
                                                                            >
                                                                                <div className="flex-1">
                                                                                    <div className="flex items-center gap-2.5 mb-1.5">
                                                                                        <span className="font-semibold text-base">{session.name}</span>
                                                                                        {isActive && (
                                                                                            <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">
                                                                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                                                                Active
                                                                                            </Badge>
                                                                                        )}
                                                                                    </div>
                                                                                    
                                                                                    {editingSessionId === session.id ? (
                                                                                        <div className="flex items-center gap-2 mt-2">
                                                                                            <Input 
                                                                                                type="date" 
                                                                                                value={editSessionForm.startDate}
                                                                                                onChange={(e) => setEditSessionForm(prev => ({ ...prev, startDate: e.target.value }))}
                                                                                                className="h-8 w-36"
                                                                                            />
                                                                                            <span className="text-muted-foreground">-</span>
                                                                                            <Input 
                                                                                                type="date" 
                                                                                                value={editSessionForm.endDate}
                                                                                                onChange={(e) => setEditSessionForm(prev => ({ ...prev, endDate: e.target.value }))}
                                                                                                className="h-8 w-36"
                                                                                            />
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                                                            <Calendar className="h-3.5 w-3.5" />
                                                                                            <span>{formatDate(session.start_date)} - {formatDate(session.end_date)}</span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    {editingSessionId === session.id ? (
                                                                                        <>
                                                                                            <Button 
                                                                                                variant="ghost" 
                                                                                                size="sm" 
                                                                                                onClick={handleUpdateSession}
                                                                                                disabled={updatingSession}
                                                                                                className="text-green-600 hover:text-green-800 hover:bg-green-50"
                                                                                            >
                                                                                                {updatingSession ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                                                            </Button>
                                                                                            <Button 
                                                                                                variant="ghost" 
                                                                                                size="sm" 
                                                                                                onClick={cancelEditingSession}
                                                                                                disabled={updatingSession}
                                                                                                className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                                                                            >
                                                                                                <X className="h-4 w-4" />
                                                                                            </Button>
                                                                                        </>
                                                                                    ) : (
                                                                                        <>
                                                                                            <Button 
                                                                                                variant="ghost" 
                                                                                                size="sm" 
                                                                                                onClick={() => startEditingSession(session)}
                                                                                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                                                            >
                                                                                                <Edit2 className="h-4 w-4" />
                                                                                            </Button>
                                                                                            {!isActive && (
                                                                                                <Button
                                                                                                    variant="outline"
                                                                                                    size="sm"
                                                                                                    onClick={() => handleActivateSession(
                                                                                                        branch.id,
                                                                                                        session.id,
                                                                                                        session.name,
                                                                                                        branch.name
                                                                                                    )}
                                                                                                    disabled={isActivating}
                                                                                                    className="gap-1.5"
                                                                                                >
                                                                                                    {isActivating ? (
                                                                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                                                    ) : (
                                                                                                        <>
                                                                                                            <Power className="h-3.5 w-3.5" />
                                                                                                            Activate
                                                                                                        </>
                                                                                                    )}
                                                                                                </Button>
                                                                                            )}
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <div className="text-sm text-muted-foreground mt-4 p-4 bg-muted/30 rounded-lg border border-dashed text-center">
                                                                    <p>No sessions available for this branch.</p>
                                                                    <p className="text-xs mt-1">Click "New Session" to create one.</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-lg">
                                                    No branches found for this organization.
                                                </div>
                                            )}
                                        </CardContent>
                                    </CollapsibleContent>
                                </Collapsible>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default SessionSetting;
