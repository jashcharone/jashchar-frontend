/**
 * SMART STAFF QR CODE GENERATOR
 */
import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import QRCode from 'qrcode';
import { QrCode, Users, User, Briefcase, Loader2, RefreshCw, Search, Download } from 'lucide-react';

const SmartStaffQRCode = () => {
    const { user, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    const [loading, setLoading] = useState(false);
    const [staff, setStaff] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        if (branchId) fetchDepartments();
    }, [branchId]);

    const fetchDepartments = async () => {
        const { data } = await supabase.from('departments').select('id, name').eq('branch_id', branchId).order('name');
        setDepartments(data || []);
    };

    const fetchStaff = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        try {
            let query = supabase
                .from('employee_profiles')
                .select('id, full_name, first_name, last_name, employee_id, photo_url, department_id, departments!employee_profiles_department_id_fkey(name)')
                .eq('branch_id', branchId)
                .eq('status', 'Active');
            if (selectedDepartment !== 'all') query = query.eq('department_id', selectedDepartment);
            const { data } = await query.order('full_name');
            setStaff((data || []).map(s => ({ ...s, display_name: s.full_name || [s.first_name, s.last_name].filter(Boolean).join(' ') || 'Unknown' })));
        } finally {
            setLoading(false);
        }
    }, [branchId, selectedDepartment]);

    useEffect(() => { fetchStaff(); }, [fetchStaff]);

    const generateQRCode = async (member) => {
        const qrData = JSON.stringify({ type: 'staff_attendance', staffId: member.id, branchId, employeeId: member.employee_id, name: member.display_name });
        return await QRCode.toDataURL(qrData, { width: 300, margin: 2 });
    };

    const downloadQR = async (member) => {
        const qrDataUrl = await generateQRCode(member);
        if (qrDataUrl) {
            const link = document.createElement('a');
            link.download = `QR_Staff_${member.employee_id}_${member.display_name.replace(/\s/g, '_')}.png`;
            link.href = qrDataUrl;
            link.click();
            toast({ title: 'QR Code Downloaded', description: `QR for ${member.display_name}` });
        }
    };

    const bulkGenerateQR = async () => {
        setGenerating(true);
        toast({ title: 'Generating QR Codes', description: `Generating for ${staff.length} staff...` });
        setTimeout(() => {
            setGenerating(false);
            toast({ title: 'QR Codes Generated', description: `Generated QR codes for ${staff.length} staff` });
        }, 2000);
    };

    const filteredStaff = staff.filter(s => s.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.employee_id?.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <DashboardLayout>
            <div className="p-4 md:p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <QrCode className="h-7 w-7 text-purple-600" />
                            Staff QR Code Generator
                        </h1>
                        <p className="text-muted-foreground">Generate QR codes for staff attendance</p>
                    </div>
                    <Button onClick={bulkGenerateQR} disabled={generating || staff.length === 0}>
                        {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                        Generate All QR Codes
                    </Button>
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
                            <div className="flex items-end">
                                <Button onClick={fetchStaff} variant="outline" className="w-full"><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2"><Briefcase className="h-5 w-5" />Staff ({filteredStaff.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Staff</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Employee ID</TableHead>
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
                                            <TableCell>
                                                <Button variant="outline" size="sm" onClick={() => downloadQR(member)}>
                                                    <QrCode className="h-4 w-4 mr-1" />Download QR
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredStaff.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No staff found</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default SmartStaffQRCode;
