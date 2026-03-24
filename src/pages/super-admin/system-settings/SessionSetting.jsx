import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Power, CheckCircle, Plus, Calendar, RefreshCw, Save, Trash2, Edit2, X, ChevronDown, ChevronRight, Building2 } from 'lucide-react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SessionSetting = () => {
    const { user, organizationId } = useAuth();
    const { toast } = useToast();
    
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState({}); // { branchId_sessionId: true }
    const [expandedBranches, setExpandedBranches] = useState({});
    const [createDialogOpen, setCreateDialogOpen] = useState({}); // { branchId: true }
    const [creating, setCreating] = useState({}); // { branchId: true }
    const [newSession, setNewSession] = useState({}); // { branchId: { name, startDate, endDate } }
    
    // Edit Session State
    const [editingSessionId, setEditingSessionId] = useState(null);
    const [editForm, setEditForm] = useState({ startDate: '', endDate: '' });
    const [updating, setUpdating] = useState(false);
    
    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Get organization ID from user profile or localStorage
    const orgId = organizationId || user?.profile?.organization_id || localStorage.getItem('selectedOrganizationId');

    // Format session name: YYYY-YYYY (e.g., 2025-2026) - 8 digit format for 100 year stability
    const formatSessionName = (value) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length === 0) return '';
        if (digits.length <= 4) return digits;
        const year1 = digits.substring(0, 4);
        const year2 = digits.substring(4, 8);
        return `${year1}-${year2}`;
    };

    // Auto-generate session name from year
    const generateSessionName = (startYear) => {
        const year1 = parseInt(startYear);
        if (isNaN(year1) || year1 < 2000 || year1 > 2199) return '';
        return `${year1}-${year1 + 1}`;
    };

    // Get next session name based on current session
    const getNextSessionName = (currentSessionName) => {
        const match = currentSessionName?.match(/^(\d{4})-(\d{4})$/);
        if (!match) return '';
        const currentEndYear = parseInt(match[2]);
        return `${currentEndYear}-${currentEndYear + 1}`;
    };

    // Validate session name format (YYYY-YYYY)
    const validateSessionName = (name) => {
        const pattern = /^\d{4}-\d{4}$/;
        if (!pattern.test(name)) {
            return 'Session name must be in format YYYY-YYYY (e.g., 2025-2026)';
        }
        const [year1, year2] = name.split('-');
        const year1Num = parseInt(year1);
        const year2Num = parseInt(year2);
        if (year2Num !== year1Num + 1) {
            return `Year should be ${year1}-${year1Num + 1}`;
        }
        return null;
    };

    // Format date for display
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    // Check if any session is ending soon or has already ended
    const checkSessionExpiry = (branchesWithSessions) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const warningDays = 30; // Warn 30 days before end
        
        branchesWithSessions.forEach(branch => {
            const activeSession = branch.sessions?.find(s => s.is_active);
            if (!activeSession?.end_date) return;
            
            const endDate = new Date(activeSession.end_date);
            const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
            
            // Check if next session exists
            const nextSessionName = getNextSessionName(activeSession.name);
            const nextSessionExists = branch.sessions?.some(s => s.name === nextSessionName);
            
            if (daysUntilEnd < 0 && !nextSessionExists) {
                // Session has already ended!
                toast({ 
                    variant: 'destructive', 
                    title: `⚠️ Session Expired - ${branch.branch_name}`,
                    description: `Session "${activeSession.name}" has ended. Please create next session "${nextSessionName}".`,
                    duration: 10000
                });
            } else if (daysUntilEnd <= warningDays && daysUntilEnd >= 0 && !nextSessionExists) {
                // Session ending soon
                toast({ 
                    title: `📅 Session Ending Soon - ${branch.branch_name}`,
                    description: `Session "${activeSession.name}" ends in ${daysUntilEnd} days. Consider creating "${nextSessionName}".`,
                    duration: 8000
                });
            }
        });
    };

    // Quick create next session for a branch
    const quickCreateNextSession = async (branchId, currentSession) => {
        const nextSessionName = getNextSessionName(currentSession.name);
        if (!nextSessionName) {
            toast({ variant: 'destructive', title: 'Error', description: 'Cannot determine next session name' });
            return;
        }

        // Check if next session already exists
        const branch = branches.find(b => b.id === branchId);
        if (branch?.sessions?.some(s => s.name === nextSessionName)) {
            toast({ variant: 'destructive', title: 'Error', description: `Session "${nextSessionName}" already exists` });
            return;
        }

        // Calculate default dates: next day after current session ends, 1 year duration
        let startDate = '';
        let endDate = '';
        if (currentSession.end_date) {
            const start = new Date(currentSession.end_date);
            start.setDate(start.getDate() + 1);
            startDate = start.toISOString().split('T')[0];
            
            const end = new Date(start);
            end.setFullYear(end.getFullYear() + 1);
            end.setDate(end.getDate() - 1); // End one day before next year
            endDate = end.toISOString().split('T')[0];
        }

        setCreating(prev => ({ ...prev, [branchId]: true }));
        try {
            const { error } = await supabase
                .from('sessions')
                .insert({
                    branch_id: branchId,
                    organization_id: organizationId,
                    name: nextSessionName,
                    start_date: startDate || null,
                    end_date: endDate || null,
                    is_active: false // Don't auto-activate, let admin activate when ready
                });

            if (error) throw error;

            toast({ 
                title: '✅ Next Session Created', 
                description: `Session "${nextSessionName}" created. Activate it when ready.` 
            });
            fetchData();
        } catch (error) {
            console.error('Error creating next session:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create session' });
        } finally {
            setCreating(prev => ({ ...prev, [branchId]: false }));
        }
    };

    // Fetch all branches and their sessions for this organization
    const fetchData = async () => {
        if (!orgId) {
            console.log('No organization ID found');
            setLoading(false);
            return;
        }
        
        setLoading(true);
        try {
            // Fetch all branches for this organization
            const { data: branchesData, error: branchesError } = await supabase
                .from('branches')
                .select('id, branch_name, organization_id')
                .eq('organization_id', orgId)
                .order('branch_name');
            
            if (branchesError) throw branchesError;

            // For each branch, fetch its sessions
            const branchesWithSessions = await Promise.all(
                (branchesData || []).map(async (branch) => {
                    const { data: sessionsData, error: sessionsError } = await supabase
                        .from('sessions')
                        .select('id, name, start_date, end_date, is_active')
                        .eq('branch_id', branch.id)
                        .order('name', { ascending: false });
                    
                    if (sessionsError) {
                        console.error(`Error fetching sessions for branch ${branch.id}:`, sessionsError);
                        return { ...branch, sessions: [] };
                    }
                    
                    return { ...branch, sessions: sessionsData || [] };
                })
            );

            setBranches(branchesWithSessions);
            
            // Check for sessions expiring soon or already ended - notify user
            checkSessionExpiry(branchesWithSessions);
            
            // Expand all branches by default
            const expanded = {};
            branchesWithSessions.forEach(branch => {
                expanded[branch.id] = true;
            });
            setExpandedBranches(expanded);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch branch and session data' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [orgId]);

    // Toggle branch expansion
    const toggleBranch = (branchId) => {
        setExpandedBranches(prev => ({
            ...prev,
            [branchId]: !prev[branchId]
        }));
    };

    // Create new session for a specific branch
    const handleCreateSession = async (branchId) => {
        const sessionData = newSession[branchId] || {};
        
        if (!sessionData.name?.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Session name is required' });
            return;
        }

        const nameError = validateSessionName(sessionData.name.trim());
        if (nameError) {
            toast({ variant: 'destructive', title: 'Validation Error', description: nameError });
            return;
        }

        // Check if session already exists for this branch
        const branch = branches.find(b => b.id === branchId);
        const exists = branch?.sessions?.some(s => s.name === sessionData.name.trim());
        if (exists) {
            toast({ variant: 'destructive', title: 'Error', description: 'Session with this name already exists for this branch' });
            return;
        }

        setCreating(prev => ({ ...prev, [branchId]: true }));
        try {
            const isFirstSession = !branch?.sessions?.length;
            
            const { error } = await supabase
                .from('sessions')
                .insert({
                    branch_id: branchId,
                    organization_id: organizationId,
                    name: sessionData.name.trim(),
                    start_date: sessionData.startDate || null,
                    end_date: sessionData.endDate || null,
                    is_active: isFirstSession // Make active if first session for this branch
                });

            if (error) throw error;

            toast({ title: 'Success', description: `Session "${sessionData.name}" created successfully` });
            setCreateDialogOpen(prev => ({ ...prev, [branchId]: false }));
            setNewSession(prev => ({ ...prev, [branchId]: { name: '', startDate: '', endDate: '' } }));
            fetchData();
        } catch (error) {
            console.error('Error creating session:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create session' });
        } finally {
            setCreating(prev => ({ ...prev, [branchId]: false }));
        }
    };

    // Activate session for a specific branch
    const handleActivateSession = async (branchId, sessionId, sessionName, branchName) => {
        const key = `${branchId}_${sessionId}`;
        setActivating(prev => ({ ...prev, [key]: true }));
        
        try {
            // Deactivate all sessions for this branch
            await supabase
                .from('sessions')
                .update({ is_active: false })
                .eq('branch_id', branchId);

            // Activate the selected session
            await supabase
                .from('sessions')
                .update({ is_active: true })
                .eq('id', sessionId);

            // ✅ CRITICAL: Also update schools.current_session_id to keep in sync
            await supabase
                .from('schools')
                .update({ current_session_id: sessionId })
                .eq('id', branchId);

            toast({ title: 'Success', description: `Session "${sessionName}" is now active for ${branchName}` });
            fetchData();
        } catch (error) {
            console.error('Error activating session:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to activate session' });
        } finally {
            setActivating(prev => ({ ...prev, [key]: false }));
        }
    };

    // Start editing session
    const startEditing = (session) => {
        setEditingSessionId(session.id);
        setEditForm({
            startDate: session.start_date || '',
            endDate: session.end_date || ''
        });
    };

    // Cancel editing
    const cancelEditing = () => {
        setEditingSessionId(null);
        setEditForm({ startDate: '', endDate: '' });
    };

    // Update session
    const handleUpdateSession = async () => {
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('sessions')
                .update({
                    start_date: editForm.startDate || null,
                    end_date: editForm.endDate || null
                })
                .eq('id', editingSessionId);

            if (error) throw error;

            toast({ title: 'Success', description: 'Session updated successfully' });
            cancelEditing();
            fetchData();
        } catch (error) {
            console.error('Error updating session:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update session' });
        } finally {
            setUpdating(false);
        }
    };

    // Delete session
    const handleDeleteSession = async () => {
        if (!deleteConfirm) return;
        
        // Don't allow deleting active session
        if (deleteConfirm.is_active) {
            toast({ variant: 'destructive', title: 'Error', description: 'Cannot delete active session. Please activate another session first.' });
            setDeleteConfirm(null);
            return;
        }

        setDeleting(true);
        try {
            const { error } = await supabase
                .from('sessions')
                .delete()
                .eq('id', deleteConfirm.id);

            if (error) throw error;

            toast({ title: 'Success', description: `Session "${deleteConfirm.name}" deleted` });
            setDeleteConfirm(null);
            fetchData();
        } catch (error) {
            console.error('Error deleting session:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete session' });
        } finally {
            setDeleting(false);
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
            <div className="container mx-auto py-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Calendar className="h-6 w-6" />
                            Session Settings
                        </h1>
                        <p className="text-muted-foreground">
                            Manage academic sessions for all branches
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchData}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>

                {/* Summary Card */}
                <Card>
                    <CardContent className="py-4">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-blue-600" />
                                <span className="font-medium">{branches.length} Branch{branches.length !== 1 ? 'es' : ''}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-green-600" />
                                <span className="font-medium">
                                    {branches.reduce((total, b) => total + (b.sessions?.length || 0), 0)} Total Sessions
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Branches with Sessions */}
                {branches.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">No branches found</p>
                            <p className="text-sm mt-1">Add branches to manage their sessions</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {branches.map((branch) => {
                            const activeSession = branch.sessions?.find(s => s.is_active);
                            const isExpanded = expandedBranches[branch.id];

                            return (
                                <Card key={branch.id} className="overflow-hidden">
                                    <Collapsible open={isExpanded} onOpenChange={() => toggleBranch(branch.id)}>
                                        <CollapsibleTrigger asChild>
                                            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        {isExpanded ? (
                                                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                                        ) : (
                                                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                                        )}
                                                        <Building2 className="h-5 w-5 text-blue-600" />
                                                        <div className="text-left">
                                                            <CardTitle className="text-lg">{branch.branch_name}</CardTitle>
                                                            <CardDescription>
                                                                {branch.sessions?.length || 0} session{(branch.sessions?.length || 0) !== 1 ? 's' : ''}
                                                            </CardDescription>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                                        {activeSession && (
                                                            <Badge className="bg-green-600 text-white">
                                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                                Active: {activeSession.name}
                                                            </Badge>
                                                        )}
                                                        <Button 
                                                            size="sm" 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setCreateDialogOpen(prev => ({ ...prev, [branch.id]: true }));
                                                                setNewSession(prev => ({ ...prev, [branch.id]: { name: '', startDate: '', endDate: '' } }));
                                                            }}
                                                        >
                                                            <Plus className="h-4 w-4 mr-1" />
                                                            Add Session
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                        </CollapsibleTrigger>
                                        
                                        <CollapsibleContent>
                                            <CardContent className="pt-0">
                                                {branch.sessions?.length === 0 ? (
                                                    <div className="text-center py-8 text-muted-foreground border rounded-lg">
                                                        <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
                                                        <p className="font-medium">No sessions found</p>
                                                        <p className="text-sm mt-1">Create the first session for this branch</p>
                                                    </div>
                                                ) : (
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Session Name</TableHead>
                                                                <TableHead>Start Date</TableHead>
                                                                <TableHead>End Date</TableHead>
                                                                <TableHead>Status</TableHead>
                                                                <TableHead className="text-right">Actions</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {branch.sessions.map((session) => {
                                                                const isActive = session.is_active;
                                                                const isEditing = editingSessionId === session.id;
                                                                const activatingKey = `${branch.id}_${session.id}`;

                                                                return (
                                                                    <TableRow key={session.id} className={isActive ? 'bg-green-50/50 dark:bg-green-900/10' : ''}>
                                                                        <TableCell className="font-semibold">{session.name}</TableCell>
                                                                        <TableCell>
                                                                            {isEditing ? (
                                                                                <Input 
                                                                                    type="date" 
                                                                                    value={editForm.startDate}
                                                                                    onChange={(e) => setEditForm(prev => ({ ...prev, startDate: e.target.value }))}
                                                                                    className="h-8 w-36"
                                                                                />
                                                                            ) : (
                                                                                formatDate(session.start_date)
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {isEditing ? (
                                                                                <Input 
                                                                                    type="date" 
                                                                                    value={editForm.endDate}
                                                                                    onChange={(e) => setEditForm(prev => ({ ...prev, endDate: e.target.value }))}
                                                                                    className="h-8 w-36"
                                                                                />
                                                                            ) : (
                                                                                formatDate(session.end_date)
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {isActive ? (
                                                                                <Badge className="bg-green-600 text-white">
                                                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                                                    Active
                                                                                </Badge>
                                                                            ) : (
                                                                                <Badge variant="outline">Inactive</Badge>
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell className="text-right">
                                                                            <div className="flex items-center justify-end gap-2">
                                                                                {isEditing ? (
                                                                                    <>
                                                                                        <Button 
                                                                                            variant="ghost" 
                                                                                            size="sm" 
                                                                                            onClick={handleUpdateSession}
                                                                                            disabled={updating}
                                                                                            className="text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-950/30"
                                                                                        >
                                                                                            {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                                                        </Button>
                                                                                        <Button 
                                                                                            variant="ghost" 
                                                                                            size="sm" 
                                                                                            onClick={cancelEditing}
                                                                                            disabled={updating}
                                                                                            className="text-muted-foreground"
                                                                                        >
                                                                                            <X className="h-4 w-4" />
                                                                                        </Button>
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <Button 
                                                                                            variant="ghost" 
                                                                                            size="sm" 
                                                                                            onClick={() => startEditing(session)}
                                                                                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                                                                        >
                                                                                            <Edit2 className="h-4 w-4" />
                                                                                        </Button>
                                                                                        {!isActive && (
                                                                                            <>
                                                                                                <Button
                                                                                                    variant="outline"
                                                                                                    size="sm"
                                                                                                    onClick={() => handleActivateSession(branch.id, session.id, session.name, branch.branch_name)}
                                                                                                    disabled={activating[activatingKey]}
                                                                                                    className="gap-1"
                                                                                                >
                                                                                                    {activating[activatingKey] ? (
                                                                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                                                    ) : (
                                                                                                        <>
                                                                                                            <Power className="h-3.5 w-3.5" />
                                                                                                            Activate
                                                                                                        </>
                                                                                                    )}
                                                                                                </Button>
                                                                                                <Button 
                                                                                                    variant="ghost" 
                                                                                                    size="sm" 
                                                                                                    onClick={() => setDeleteConfirm(session)}
                                                                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                                                                >
                                                                                                    <Trash2 className="h-4 w-4" />
                                                                                                </Button>
                                                                                            </>
                                                                                        )}
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                )}
                                                
                                                {/* Quick Create Next Session Button */}
                                                {activeSession && !branch.sessions?.some(s => s.name === getNextSessionName(activeSession.name)) && (
                                                    <div className="mt-4 p-4 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="font-medium text-primary">
                                                                    📅 Create Next Session
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Suggested: <span className="font-semibold">{getNextSessionName(activeSession.name)}</span>
                                                                    {activeSession.end_date && (
                                                                        <> (starts after {formatDate(activeSession.end_date)})</>
                                                                    )}
                                                                </p>
                                                            </div>
                                                            <Button
                                                                onClick={() => quickCreateNextSession(branch.id, activeSession)}
                                                                disabled={creating[branch.id]}
                                                                className="gap-2"
                                                            >
                                                                {creating[branch.id] ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Plus className="h-4 w-4" />
                                                                )}
                                                                Quick Create
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </CollapsibleContent>
                                    </Collapsible>

                                    {/* Create Session Dialog for this branch */}
                                    <Dialog 
                                        open={createDialogOpen[branch.id]} 
                                        onOpenChange={(open) => setCreateDialogOpen(prev => ({ ...prev, [branch.id]: open }))}
                                    >
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle className="text-xl">Create New Session</DialogTitle>
                                                <DialogDescription>
                                                    Add a new academic session for <strong>{branch.branch_name}</strong>
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div>
                                                    <Label htmlFor={`session-name-${branch.id}`} className="text-sm font-medium">
                                                        Session Name <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        id={`session-name-${branch.id}`}
                                                        placeholder="2025-2026"
                                                        value={newSession[branch.id]?.name || ''}
                                                        onChange={(e) => setNewSession(prev => ({ 
                                                            ...prev, 
                                                            [branch.id]: { ...(prev[branch.id] || {}), name: formatSessionName(e.target.value) }
                                                        }))}
                                                        maxLength={9}
                                                        className="mt-1.5"
                                                    />
                                                    <p className="text-xs text-muted-foreground mt-1">Format: YYYY-YYYY (e.g., 2025-2026)</p>
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
                                                    </div>
                                                </div>
                                            </div>
                                            <DialogFooter className="gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    onClick={() => setCreateDialogOpen(prev => ({ ...prev, [branch.id]: false }))}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button 
                                                    onClick={() => handleCreateSession(branch.id)} 
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
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Session?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete session "{deleteConfirm?.name}"? 
                                This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={handleDeleteSession}
                                disabled={deleting}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
};

export default SessionSetting;
