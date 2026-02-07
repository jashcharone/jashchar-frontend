import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    Loader2, Search, Plus, FileText, Eye, Download, 
    Copy, Trash2, Send, CheckCircle, XCircle, Clock,
    ArrowRight, IndianRupee, Calendar, Building2
} from 'lucide-react';
import { format } from 'date-fns';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const EstimatesList = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [estimates, setEstimates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({
        total: 0,
        draft: 0,
        sent: 0,
        accepted: 0,
        rejected: 0,
        totalValue: 0
    });

    const fetchEstimates = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('subscription_estimates')
                .select(`*, school:schools(name, logo_url)`)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            setEstimates(data || []);
            
            // Calculate stats
            const statData = {
                total: data?.length || 0,
                draft: data?.filter(e => e.status === 'draft').length || 0,
                sent: data?.filter(e => e.status === 'sent').length || 0,
                accepted: data?.filter(e => e.status === 'accepted').length || 0,
                rejected: data?.filter(e => e.status === 'rejected').length || 0,
                totalValue: data?.reduce((sum, e) => sum + (e.total_amount || 0), 0) || 0
            };
            setStats(statData);
            
        } catch (error) {
            console.error('Fetch Error:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load estimates.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEstimates();
    }, []);

    const handleStatusChange = async (estimateId, newStatus) => {
        try {
            const { error } = await supabase
                .from('subscription_estimates')
                .update({ status: newStatus })
                .eq('id', estimateId);
            
            if (error) throw error;
            
            toast({ title: 'Success', description: `Estimate marked as ${newStatus}.` });
            fetchEstimates();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };

    const handleDelete = async (estimateId) => {
        try {
            const { error } = await supabase
                .from('subscription_estimates')
                .delete()
                .eq('id', estimateId);
            
            if (error) throw error;
            
            toast({ title: 'Deleted', description: 'Estimate deleted successfully.' });
            fetchEstimates();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };

    const handleDuplicate = async (estimate) => {
        navigate(`/master-admin/estimates/new?duplicate=${estimate.id}`);
    };

    const handleConvertToInvoice = async (estimate) => {
        // Navigate to generate bill with pre-filled data
        if (estimate.school_id) {
            navigate(`/master-admin/subscriptions/bill/${estimate.school_id}?estimateId=${estimate.id}`);
        } else {
            toast({ 
                variant: 'destructive', 
                title: 'Cannot Convert', 
                description: 'This estimate is not linked to a school. Please link it first.' 
            });
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            draft: { class: 'bg-gray-100 text-gray-800', icon: Clock },
            sent: { class: 'bg-blue-100 text-blue-800', icon: Send },
            accepted: { class: 'bg-green-100 text-green-800', icon: CheckCircle },
            rejected: { class: 'bg-red-100 text-red-800', icon: XCircle },
            expired: { class: 'bg-orange-100 text-orange-800', icon: Clock },
            converted: { class: 'bg-purple-100 text-purple-800', icon: ArrowRight }
        };
        
        const config = statusConfig[status] || statusConfig.draft;
        const Icon = config.icon;
        
        return (
            <Badge className={`${config.class} gap-1`}>
                <Icon className="h-3 w-3" />
                {status?.charAt(0).toUpperCase() + status?.slice(1)}
            </Badge>
        );
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const filteredEstimates = estimates.filter(est => 
        (est.client_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (est.estimate_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (est.school?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Estimates & Quotations</h1>
                        <p className="text-muted-foreground">Manage professional quotations for schools</p>
                    </div>
                    <Button onClick={() => navigate('/master-admin/estimates/new')} className="gap-2">
                        <Plus className="h-4 w-4" /> New Estimate
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <div className="text-xs text-muted-foreground">Total Estimates</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
                            <div className="text-xs text-muted-foreground">Drafts</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
                            <div className="text-xs text-muted-foreground">Sent</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
                            <div className="text-xs text-muted-foreground">Accepted</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                            <div className="text-xs text-muted-foreground">Rejected</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                        <CardContent className="pt-4">
                            <div className="text-xl font-bold text-primary">{formatCurrency(stats.totalValue)}</div>
                            <div className="text-xs text-muted-foreground">Total Value</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search & Table */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>All Estimates</CardTitle>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by client, school or estimate number..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                className="pl-9" 
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-10">
                                <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                            </div>
                        ) : filteredEstimates.length === 0 ? (
                            <div className="text-center py-16">
                                <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                                <h3 className="text-lg font-medium mb-2">No Estimates Found</h3>
                                <p className="text-muted-foreground mb-4">Create your first professional quotation</p>
                                <Button onClick={() => navigate('/master-admin/estimates/new')}>
                                    <Plus className="mr-2 h-4 w-4" /> Create Estimate
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-muted/50">
                                        <tr className="border-b">
                                            <th className="px-4 py-3">Estimate #</th>
                                            <th className="px-4 py-3">Client</th>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Valid Until</th>
                                            <th className="px-4 py-3">Amount</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEstimates.map((estimate) => (
                                            <tr key={estimate.id} className="border-b hover:bg-muted/50">
                                                <td className="px-4 py-3">
                                                    <Link 
                                                        to={`/master-admin/estimates/${estimate.id}`}
                                                        className="font-mono text-primary hover:underline"
                                                    >
                                                        {estimate.estimate_number}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        {estimate.school?.logo_url ? (
                                                            <img 
                                                                src={estimate.school.logo_url} 
                                                                alt="" 
                                                                className="w-8 h-8 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                                <Building2 className="h-4 w-4 text-primary" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-medium">{estimate.client_name}</div>
                                                            {estimate.school?.name && estimate.school.name !== estimate.client_name && (
                                                                <div className="text-xs text-muted-foreground">{estimate.school.name}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {estimate.estimate_date ? format(new Date(estimate.estimate_date), 'dd MMM yyyy') : '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className={new Date(estimate.valid_until) < new Date() ? 'text-red-500' : ''}>
                                                        {estimate.valid_until ? format(new Date(estimate.valid_until), 'dd MMM yyyy') : '-'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-semibold">
                                                    {formatCurrency(estimate.total_amount)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {getStatusBadge(estimate.status)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon"
                                                            onClick={() => navigate(`/master-admin/estimates/${estimate.id}`)}
                                                            title="View/Edit"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm">Actions</Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => handleStatusChange(estimate.id, 'sent')}>
                                                                    <Send className="mr-2 h-4 w-4" /> Mark as Sent
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleStatusChange(estimate.id, 'accepted')}>
                                                                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Mark Accepted
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleStatusChange(estimate.id, 'rejected')}>
                                                                    <XCircle className="mr-2 h-4 w-4 text-red-600" /> Mark Rejected
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => handleConvertToInvoice(estimate)}>
                                                                    <ArrowRight className="mr-2 h-4 w-4" /> Convert to Invoice
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleDuplicate(estimate)}>
                                                                    <Copy className="mr-2 h-4 w-4" /> Duplicate
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-red-600">
                                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                                        </DropdownMenuItem>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Delete Estimate?</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                This will permanently delete estimate #{estimate.estimate_number}. This action cannot be undone.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                            <AlertDialogAction 
                                                                                onClick={() => handleDelete(estimate.id)}
                                                                                className="bg-red-600 hover:bg-red-700"
                                                                            >
                                                                                Delete
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default EstimatesList;
