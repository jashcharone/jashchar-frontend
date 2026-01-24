import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Power, CheckCircle, Plus, Calendar, RefreshCw, Save, Trash2, Edit2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    
    const [sessions, setSessions] = useState([]);
    const [branchInfo, setBranchInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newSession, setNewSession] = useState({ name: '', startDate: '', endDate: '' });
    
    // Edit Session State
    const [editingSessionId, setEditingSessionId] = useState(null);
    const [editForm, setEditForm] = useState({ startDate: '', endDate: '' });
    const [updating, setUpdating] = useState(false);
    
    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const branchId = user?.profile?.branch_id || selectedBranch?.id;

    // Format session name: YYYY-YY (e.g., 2025-26)
    const formatSessionName = (value) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length === 0) return '';
        if (digits.length <= 4) return digits;
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
        const expectedYear2 = (year1Num + 1) % 100;
        if (year2Num !== expectedYear2) {
            return `Year should be ${year1}-${String(expectedYear2).padStart(2, '0')}`;
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

    // Fetch branch info and sessions
    const fetchData = async () => {
        if (!branchId) return;
        
        setLoading(true);
        try {
            // Fetch branch info
            const { data: branch, error: branchError } = await supabase
                .from('branches')
                .select('id, branch_name, current_session_id')
                .eq('id', branchId)
                .single();
            
            if (branchError) throw branchError;
            setBranchInfo(branch);
            
            // Fetch sessions for this branch
            const { data: sessionsData, error: sessionsError } = await supabase
                .from('sessions')
                .select('id, name, start_date, end_date, is_active')
                .eq('branch_id', branchId)
                .order('name', { ascending: false });
            
            if (sessionsError) throw sessionsError;
            setSessions(sessionsData || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch session data' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [branchId]);

    // Create new session
    const handleCreateSession = async () => {
        if (!newSession.name?.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Session name is required' });
            return;
        }

        const nameError = validateSessionName(newSession.name.trim());
        if (nameError) {
            toast({ variant: 'destructive', title: 'Validation Error', description: nameError });
            return;
        }

        // Check if session already exists
        const exists = sessions.some(s => s.name === newSession.name.trim());
        if (exists) {
            toast({ variant: 'destructive', title: 'Error', description: 'Session with this name already exists' });
            return;
        }

        setCreating(true);
        try {
            const { data, error } = await supabase
                .from('sessions')
                .insert({
                    branch_id: branchId,
                    name: newSession.name.trim(),
                    start_date: newSession.startDate || null,
                    end_date: newSession.endDate || null,
                    is_active: sessions.length === 0 // Make active if first session
                })
                .select()
                .single();

            if (error) throw error;

            // If first session, also update branch's current_session_id
            if (sessions.length === 0) {
                await supabase
                    .from('branches')
                    .update({ current_session_id: data.id })
                    .eq('id', branchId);
            }

            toast({ title: 'Success', description: `Session "${newSession.name}" created successfully` });
            setCreateDialogOpen(false);
            setNewSession({ name: '', startDate: '', endDate: '' });
            fetchData();
        } catch (error) {
            console.error('Error creating session:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create session' });
        } finally {
            setCreating(false);
        }
    };

    // Activate session
    const handleActivateSession = async (sessionId, sessionName) => {
        setActivating(sessionId);
        try {
            // Update sessions - deactivate all, activate selected
            await supabase
                .from('sessions')
                .update({ is_active: false })
                .eq('branch_id', branchId);

            await supabase
                .from('sessions')
                .update({ is_active: true })
                .eq('id', sessionId);

            // Update branch's current_session_id
            await supabase
                .from('branches')
                .update({ current_session_id: sessionId })
                .eq('id', branchId);

            toast({ title: 'Success', description: `Session "${sessionName}" is now active` });
            fetchData();
        } catch (error) {
            console.error('Error activating session:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to activate session' });
        } finally {
            setActivating(null);
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
        if (branchInfo?.current_session_id === deleteConfirm.id) {
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
                            Manage academic sessions for {branchInfo?.branch_name || 'your branch'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={fetchData}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                        <Button onClick={() => setCreateDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Session
                        </Button>
                    </div>
                </div>

                {/* Current Active Session */}
                {branchInfo?.current_session_id && (
                    <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/10">
                        <CardContent className="py-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="font-medium">Current Active Session:</span>
                                <Badge className="bg-green-600 text-white">
                                    {sessions.find(s => s.id === branchInfo.current_session_id)?.name || 'Unknown'}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Sessions Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Sessions</CardTitle>
                        <CardDescription>
                            {sessions.length} session{sessions.length !== 1 ? 's' : ''} configured
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {sessions.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium">No sessions found</p>
                                <p className="text-sm mt-1">Create your first academic session to get started</p>
                                <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create First Session
                                </Button>
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
                                    {sessions.map((session) => {
                                        const isActive = branchInfo?.current_session_id === session.id;
                                        const isEditing = editingSessionId === session.id;

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
                                                                    className="text-green-600 hover:text-green-800 hover:bg-green-50"
                                                                >
                                                                    {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                                </Button>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="sm" 
                                                                    onClick={cancelEditing}
                                                                    disabled={updating}
                                                                    className="text-gray-500"
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
                                                                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                                >
                                                                    <Edit2 className="h-4 w-4" />
                                                                </Button>
                                                                {!isActive && (
                                                                    <>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => handleActivateSession(session.id, session.name)}
                                                                            disabled={activating === session.id}
                                                                            className="gap-1"
                                                                        >
                                                                            {activating === session.id ? (
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
                                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
                    </CardContent>
                </Card>

                {/* Create Session Dialog */}
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-xl">Create New Session</DialogTitle>
                            <DialogDescription>
                                Add a new academic session. Format: YYYY-YY (e.g., 2025-26)
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label htmlFor="session-name" className="text-sm font-medium">
                                    Session Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="session-name"
                                    placeholder="2025-26"
                                    value={newSession.name}
                                    onChange={(e) => setNewSession(prev => ({ ...prev, name: formatSessionName(e.target.value) }))}
                                    maxLength={7}
                                    className="mt-1.5"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Format: YYYY-YY (e.g., 2025-26)</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="start-date" className="text-sm font-medium flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Start Date
                                    </Label>
                                    <Input
                                        id="start-date"
                                        type="date"
                                        value={newSession.startDate}
                                        onChange={(e) => setNewSession(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="end-date" className="text-sm font-medium flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" />
                                        End Date
                                    </Label>
                                    <Input
                                        id="end-date"
                                        type="date"
                                        value={newSession.endDate}
                                        onChange={(e) => setNewSession(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="mt-1.5"
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateSession} disabled={creating} className="gap-2">
                                {creating ? (
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
