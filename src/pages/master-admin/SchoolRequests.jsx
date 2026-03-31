import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import apiClient from '@/lib/apiClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Check, X, UserPlus, Building2, Layers, Edit, Save, RefreshCcw } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

const SchoolRequests = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [plans, setPlans] = useState([]);
    const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    
    // Edit Form State
    const [editFormData, setEditFormData] = useState({
        school_name: '',
        slug: '',
        board: '',
        contact_number: '',
        contact_email: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        post_office: '',
        registration_type: ''
    });

    useEffect(() => {
        fetchRequests();
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        const { data, error } = await supabase
            .from('subscription_plans')
            .select('id, name, price')
            .order('price', { ascending: true });
        
        if (error) {
            console.error('Error fetching plans:', error);
        } else {
            setPlans(data || []);
        }
    };

    const fetchRequests = async () => {
        setLoading(true);
        // CRITICAL: Only fetch NON-approved requests
        // Approved schools are already in /master-admin/schools page
        // Filter out: 'Approved', 'approved' (case-insensitive handled in query)
        const { data, error } = await supabase
            .from('school_requests')
            .select('*')
            .not('status', 'ilike', 'approved') // Exclude all approved requests
            .order('created_at', { ascending: false });
        
        if (error) {
            toast({ variant: "destructive", title: "Error fetching requests", description: error.message });
        } else {
            // Parse organization name from notes
            const processedData = (data || []).map(req => {
                let orgName = '';
                if (req.notes && req.notes.includes('||ORG_BRANCH_DATA:')) {
                    try {
                        // Extract JSON by finding balanced braces
                        const startIdx = req.notes.indexOf('||ORG_BRANCH_DATA:') + '||ORG_BRANCH_DATA:'.length;
                        let braceCount = 0;
                        let endIdx = startIdx;
                        let jsonStarted = false;
                        
                        for (let i = startIdx; i < req.notes.length; i++) {
                            if (req.notes[i] === '{') {
                                braceCount++;
                                jsonStarted = true;
                            } else if (req.notes[i] === '}') {
                                braceCount--;
                            }
                            if (jsonStarted && braceCount === 0) {
                                endIdx = i + 1;
                                break;
                            }
                        }
                        
                        const jsonStr = req.notes.substring(startIdx, endIdx);
                        const parsed = JSON.parse(jsonStr);
                        orgName = parsed.organization?.name || '';
                    } catch (e) {
                        console.error("Error parsing metadata for req", req.id, e);
                    }
                }
                return { ...req, organization_name: orgName };
            });
            setRequests(processedData);
        }
        setLoading(false);
    };

    // Sync pending requests with existing schools (fix data inconsistency)
    const handleSync = async () => {
        setSyncing(true);
        try {
            const result = await apiClient.post('/admin/sync-requests');
            toast({ 
                title: "? Sync Complete", 
                description: `${result.syncedCount || 0} requests updated to Approved status` 
            });
            fetchRequests(); // Refresh list
        } catch (error) {
            toast({ variant: "destructive", title: "Sync Failed", description: error.message });
        } finally {
            setSyncing(false);
        }
    };

    const handleStatusUpdate = async (requestId, newStatus) => {
        if (!confirm(`Are you sure you want to mark this request as ${newStatus}?`)) return;
        
        try {
            setLoading(true);

            if (newStatus === 'rejected') {
                // Direct Supabase Delete
                const { error } = await supabase
                    .from('school_requests')
                    .delete()
                    .eq('id', requestId);
                
                if (error) throw error;
                
                toast({ title: "Success", description: "Request rejected and data removed." });
            } else {
                const { error } = await supabase
                    .from('school_requests')
                    .update({ status: newStatus })
                    .eq('id', requestId);

                if (error) throw error;
                toast({ title: "Success", description: `Request marked as ${newStatus}` });
            }

            fetchRequests();
        } catch (error) {
            console.error("Update Error:", error);
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleApproveClick = (request) => {
        setSelectedRequest(request);
        setSelectedPlanId('');
        
        // Initialize edit form with request data
        setEditFormData({
            school_name: request.school_name || '',
            slug: request.slug || '',
            board: request.board || '',
            contact_number: request.contact_number || '',
            contact_email: request.contact_email || '',
            address: request.address || '',
            city: request.city || '',
            state: request.state || '',
            pincode: request.pincode || '',
            post_office: request.post_office || '',
            registration_type: request.registration_type || 'single_school'
        });
        
        setApprovalDialogOpen(true);
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSelectChange = (name, value) => {
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleApprove = async () => {
        if (!selectedRequest || !selectedPlanId) {
            toast({ variant: "destructive", title: "Error", description: "Please select a subscription plan." });
            return;
        }

        try {
            setLoading(true);
            
            // Call backend approval endpoint directly
            const result = await apiClient.post('/admin/approve-request', {
                requestId: selectedRequest.id,
                planId: selectedPlanId
            });
            
            setApprovalDialogOpen(false);
            toast({ title: "Success", description: result.message || "School created and owner assigned successfully." });
            fetchRequests();
            setSelectedRequest(null);
            setSelectedPlanId('');

        } catch (error) {
            console.error("Approval Error:", error);
            
            // Extract detailed error information from backend response
            const errorData = error.response?.data || {};
            const errorMessage = errorData.message || error.message || 'Unknown error occurred';
            const errorHint = errorData.hint || '';
            const failedAt = errorData.failedAt || '';
            const technicalError = errorData.error || '';
            
            // Show detailed error toast
            toast({ 
                variant: "destructive", 
                title: "? Approval Failed - ???????", 
                description: (
                    <div className="space-y-2">
                        <p className="font-semibold">{errorMessage}</p>
                        {technicalError && <p className="text-sm opacity-90">???: {technicalError}</p>}
                        {failedAt && <p className="text-sm opacity-90">????: {failedAt}</p>}
                        {errorHint && <p className="text-xs opacity-75 mt-1">{errorHint}</p>}
                    </div>
                ),
                duration: 10000 // Show for 10 seconds so admin can read it
            });
        } finally {
            setLoading(false);
        }
    };

    // Helper to get registration type display
    const getRegistrationType = (type) => {
        const typeMap = {
            'single_school': { label: 'Single School', icon: '🏫', color: 'bg-blue-100 text-blue-800' },
            'organization': { label: 'Organization', icon: '🏢', color: 'bg-purple-100 text-purple-800' },
            'organization_multi_branch': { label: 'Multi-Branch Organization', icon: '🏗️', color: 'bg-orange-100 text-orange-800' }
        };
        return typeMap[type] || { label: type || 'Single School', icon: '🏫', color: 'bg-gray-100 text-gray-800' };
    };

    // Filter requests based on active tab
    const getFilteredRequests = () => {
        if (activeTab === 'all') return requests;
        return requests.filter(req => (req.registration_type || 'single_school') === activeTab);
    };

    const filteredRequests = getFilteredRequests();

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">School Requests</h1>
                        <p className="text-muted-foreground">Manage incoming school registration requests.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            onClick={handleSync}
                            disabled={syncing}
                            title="Sync pending requests with existing schools"
                        >
                            {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
                            Sync
                        </Button>
                        <Button variant="outline" onClick={fetchRequests}>
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Tabs for filtering by registration type */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="all" className="flex items-center gap-2">
                            All Requests ({requests.length})
                        </TabsTrigger>
                        <TabsTrigger value="single_school" className="flex items-center gap-2">
                            🏫 Single School ({requests.filter(r => (r.registration_type || 'single_school') === 'single_school').length})
                        </TabsTrigger>
                        <TabsTrigger value="organization" className="flex items-center gap-2">
                            🏢 Organization ({requests.filter(r => r.registration_type === 'organization').length})
                        </TabsTrigger>
                        <TabsTrigger value="organization_multi_branch" className="flex items-center gap-2">
                            🏗️ Multi-Branch ({requests.filter(r => r.registration_type === 'organization_multi_branch').length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab} className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    {activeTab === 'all' ? 'All Requests' : getRegistrationType(activeTab).label}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Organization Name</TableHead>
                                                <TableHead>Branch/School Name</TableHead>
                                                <TableHead>Slug</TableHead>
                                                <TableHead>Contact</TableHead>
                                                <TableHead>Location</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredRequests.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                                        No {activeTab !== 'all' ? getRegistrationType(activeTab).label.toLowerCase() : ''} requests found.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredRequests.map((req) => {
                                                    const regType = getRegistrationType(req.registration_type || 'single_school');
                                                    return (
                                                        <TableRow key={req.id}>
                                                            <TableCell>{format(new Date(req.created_at), 'MMM dd, yyyy')}</TableCell>
                                                            <TableCell>
                                                                <span className="text-sm font-medium text-muted-foreground">
                                                                    {regType.label}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="font-medium">
                                                                {req.organization_name || '-'}
                                                            </TableCell>
                                                            <TableCell className="font-medium">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    {req.school_name}
                                                                    {req.board && (
                                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-blue-50 text-blue-700 border-blue-200 whitespace-nowrap">
                                                                            {req.board}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">{req.owner_name}</div>
                                                            </TableCell>
                                                            <TableCell><Badge variant="outline">{req.slug || 'N/A'}</Badge></TableCell>
                                                            <TableCell>
                                                                <div className="text-sm">{req.contact_number}</div>
                                                                <div className="text-xs text-muted-foreground">{req.contact_email}</div>
                                                            </TableCell>
                                                            <TableCell>
                                                                {req.city}, {req.state}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant={
                                                                    ['pending', 'new', 'submitted'].includes(req.status?.toLowerCase()) ? 'outline' : 
                                                                    (req.status?.toLowerCase() === 'approved' ? 'default' : 'destructive')
                                                                }>
                                                                    {req.status}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right space-x-2">
                                                                {['pending', 'new', 'submitted'].includes(req.status?.toLowerCase()) && (
                                                                    <>
                                                                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleStatusUpdate(req.id, 'Rejected')}>
                                                                            Reject
                                                                        </Button>
                                                                        <Button size="sm" variant="outline" onClick={() => navigate(`/master-admin/school-requests/${req.id}/edit`)}>
                                                                            <Edit className="h-4 w-4 mr-1" /> Edit
                                                                        </Button>
                                                                    </>
                                                                )}
                                                                {req.status?.toLowerCase() === 'approved' && (
                                                                    <span className="text-green-600 text-sm font-medium flex items-center justify-end">
                                                                        <Check className="h-4 w-4 mr-1" /> Approved
                                                                    </span>
                                                                )}
                                                                {req.status?.toLowerCase() === 'rejected' && (
                                                                    <span className="text-red-600 text-sm font-medium">Rejected</span>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Approval Dialog */}
                <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
                    <DialogContent className="max-w-md flex flex-col">
                        <DialogHeader>
                            <DialogTitle>Approve School Request</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-6 py-4">
                            {/* Read-Only Owner Information */}
                            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                                <h3 className="font-semibold flex items-center gap-2 text-sm">
                                    <UserPlus className="h-4 w-4" /> Request Details
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">School Name:</span>
                                        <span className="font-medium">{selectedRequest?.school_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Owner Name:</span>
                                        <span className="font-medium">{selectedRequest?.owner_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Email:</span>
                                        <span className="font-medium">{selectedRequest?.owner_email}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Plan Selection */}
                            <div className="space-y-4">
                                <h3 className="font-semibold flex items-center gap-2 text-sm">
                                    <Layers className="h-4 w-4" /> Assign Subscription Plan
                                </h3>
                                <div className="space-y-2">
                                    <Label>Select Plan *</Label>
                                    <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose a plan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {plans.map((plan) => (
                                                <SelectItem key={plan.id} value={plan.id}>
                                                    {plan.name} - ₹{plan.price}/month
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-4 border-t mt-auto">
                            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleApprove} disabled={!selectedPlanId || loading}>
                                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                                Approve Request
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default SchoolRequests;

