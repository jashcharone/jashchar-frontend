/**
 * SMART STAFF CARDS MANAGEMENT
 */
import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreditCard, Users, User, Briefcase, CheckCircle2, AlertTriangle, Loader2, RefreshCw, Search, Plus, Trash2 } from 'lucide-react';

const SmartStaffCards = () => {
    const { user, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    const [loading, setLoading] = useState(false);
    const [staff, setStaff] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [cardNumber, setCardNumber] = useState('');

    useEffect(() => { if (branchId) fetchDepartments(); }, [branchId]);

    const fetchDepartments = async () => {
        const { data } = await supabase.from('departments').select('id, name').eq('branch_id', branchId).order('name');
        setDepartments(data || []);
    };

    const fetchStaff = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        try {
            let query = supabase.from('employee_profiles').select('id, full_name, first_name, last_name, employee_id, photo_url, department_id, departments!employee_profiles_department_id_fkey(name)').eq('branch_id', branchId).eq('status', 'Active');
            if (selectedDepartment !== 'all') query = query.eq('department_id', selectedDepartment);
            const { data: staffData } = await query.order('full_name');
            
            const staffIds = staffData.map(s => s.id);
            const { data: cardData } = await supabase.from('attendance_cards').select('*').in('person_id', staffIds).eq('person_type', 'staff');
            
            const staffWithCards = staffData.map(s => {
                const card = cardData?.find(c => c.person_id === s.id);
                return { ...s, display_name: s.full_name || [s.first_name, s.last_name].filter(Boolean).join(' ') || 'Unknown', hasCard: !!card, cardNumber: card?.card_number, cardStatus: card?.status || 'unassigned' };
            });
            setStaff(staffWithCards);
        } finally { setLoading(false); }
    }, [branchId, selectedDepartment]);

    useEffect(() => { fetchStaff(); }, [fetchStaff]);

    const assignCard = async () => {
        if (!selectedStaff || !cardNumber) { toast({ variant: 'destructive', title: 'Error', description: 'Please enter a card number' }); return; }
        try {
            const { data: existing } = await supabase.from('attendance_cards').select('id').eq('card_number', cardNumber).single();
            if (existing) { toast({ variant: 'destructive', title: 'Error', description: 'Card already assigned' }); return; }
            
            await supabase.from('attendance_cards').upsert({ card_number: cardNumber, person_id: selectedStaff.id, person_type: 'staff', branch_id: branchId, organization_id: organizationId, status: 'active', assigned_at: new Date().toISOString() }, { onConflict: 'person_id,person_type' });
            toast({ title: 'Card Assigned', description: `Card ${cardNumber} assigned to ${selectedStaff.display_name}` });
            setAssignDialogOpen(false); setCardNumber(''); setSelectedStaff(null); fetchStaff();
        } catch (err) { toast({ variant: 'destructive', title: 'Error', description: 'Failed to assign card' }); }
    };

    const removeCard = async (member) => {
        try {
            await supabase.from('attendance_cards').delete().eq('person_id', member.id).eq('person_type', 'staff');
            toast({ title: 'Card Removed', description: `Card removed from ${member.display_name}` }); fetchStaff();
        } catch (err) { toast({ variant: 'destructive', title: 'Error', description: 'Failed to remove card' }); }
    };

    const filteredStaff = staff.filter(s => s.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.employee_id?.toLowerCase().includes(searchQuery.toLowerCase()) || s.cardNumber?.toLowerCase().includes(searchQuery.toLowerCase()));
    const stats = { total: staff.length, assigned: staff.filter(s => s.hasCard).length, unassigned: staff.filter(s => !s.hasCard).length };

    return (
        <DashboardLayout>
            <div className="p-4 md:p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2"><CreditCard className="h-7 w-7 text-purple-600" />Staff Cards Management</h1>
                        <p className="text-muted-foreground">Manage smart cards for staff attendance</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="px-3 py-1"><Users className="h-4 w-4 mr-1" />{stats.total} Total</Badge>
                        <Badge variant="outline" className="px-3 py-1 bg-green-50 text-green-700"><CheckCircle2 className="h-4 w-4 mr-1" />{stats.assigned} Assigned</Badge>
                        <Badge variant="outline" className="px-3 py-1 bg-yellow-50 text-yellow-700"><AlertTriangle className="h-4 w-4 mr-1" />{stats.unassigned} Unassigned</Badge>
                    </div>
                </div>

                <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-lg">Filters</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label>Department</Label>
                                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                    <SelectTrigger><SelectValue placeholder="All Departments" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments</SelectItem>
                                        {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Search</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
                                </div>
                            </div>
                            <div className="flex items-end"><Button onClick={fetchStaff} variant="outline" className="w-full"><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button></div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Briefcase className="h-5 w-5" />Staff ({filteredStaff.length})</CardTitle></CardHeader>
                    <CardContent>
                        {loading ? <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Staff</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Employee ID</TableHead>
                                        <TableHead>Card Number</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStaff.map(member => (
                                        <TableRow key={member.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                                        {member.photo_url ? <img src={member.photo_url} alt="" className="w-full h-full object-cover" /> : <User className="h-5 w-5 text-gray-400" />}
                                                    </div>
                                                    <p className="font-medium">{member.display_name}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>{member.departments?.name || '-'}</TableCell>
                                            <TableCell>{member.employee_id}</TableCell>
                                            <TableCell>{member.cardNumber || '-'}</TableCell>
                                            <TableCell>
                                                {member.hasCard ? <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Assigned</Badge> : <Badge variant="outline" className="text-yellow-600 border-yellow-300"><AlertTriangle className="h-3 w-3 mr-1" />Unassigned</Badge>}
                                            </TableCell>
                                            <TableCell>
                                                {member.hasCard ? (
                                                    <Button variant="outline" size="sm" onClick={() => removeCard(member)} className="text-red-600"><Trash2 className="h-4 w-4 mr-1" />Remove</Button>
                                                ) : (
                                                    <Dialog open={assignDialogOpen && selectedStaff?.id === member.id} onOpenChange={(open) => { setAssignDialogOpen(open); if (open) setSelectedStaff(member); }}>
                                                        <DialogTrigger asChild><Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" />Assign Card</Button></DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader><DialogTitle>Assign Card to {member.display_name}</DialogTitle></DialogHeader>
                                                            <div className="space-y-4 py-4">
                                                                <div><Label>Card Number</Label><Input placeholder="Enter card number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} /></div>
                                                                <Button onClick={assignCard} className="w-full">Assign Card</Button>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredStaff.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No staff found</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default SmartStaffCards;
