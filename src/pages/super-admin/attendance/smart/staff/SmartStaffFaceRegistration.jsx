/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SMART STAFF FACE REGISTRATION
 * ─────────────────────────────────────────────────────────────────────────────
 * Face Registration specifically for Staff members
 * ═══════════════════════════════════════════════════════════════════════════════
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
import { Progress } from '@/components/ui/progress';
import { formatDate } from '@/utils/dateUtils';

import {
    ScanFace, Camera, Users, User, Briefcase, CheckCircle2,
    AlertTriangle, Loader2, RefreshCw, Search
} from 'lucide-react';

const SmartStaffFaceRegistration = () => {
    const { user, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();

    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    const [loading, setLoading] = useState(false);
    const [staff, setStaff] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({ total: 0, registered: 0, pending: 0 });

    useEffect(() => {
        if (branchId) {
            fetchDepartments();
        }
    }, [branchId]);

    const fetchDepartments = async () => {
        try {
            const { data, error } = await supabase
                .from('departments')
                .select('id, name')
                .eq('branch_id', branchId)
                .order('name');
            if (error) throw error;
            setDepartments(data || []);
        } catch (err) {
            console.error('Error fetching departments:', err);
        }
    };

    const fetchStaff = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);

        try {
            let query = supabase
                .from('employee_profiles')
                .select('id, full_name, first_name, last_name, employee_id, photo_url, department_id, departments!employee_profiles_department_id_fkey(name), designations!employee_profiles_designation_id_fkey(name)')
                .eq('branch_id', branchId)
                .eq('status', 'Active');

            if (selectedDepartment !== 'all') {
                query = query.eq('department_id', selectedDepartment);
            }

            const { data: staffData, error } = await query.order('full_name');
            if (error) throw error;

            const staffIds = staffData.map(s => s.id);
            const { data: faceData } = await supabase
                .from('face_embeddings')
                .select('person_id')
                .in('person_id', staffIds)
                .eq('person_type', 'staff');

            const registeredIds = new Set(faceData?.map(f => f.person_id) || []);

            const staffWithStatus = staffData.map(s => ({
                ...s,
                display_name: s.full_name || [s.first_name, s.last_name].filter(Boolean).join(' ') || 'Unknown',
                hasFace: registeredIds.has(s.id)
            }));

            setStaff(staffWithStatus);
            setStats({
                total: staffWithStatus.length,
                registered: staffWithStatus.filter(s => s.hasFace).length,
                pending: staffWithStatus.filter(s => !s.hasFace).length
            });
        } catch (err) {
            console.error('Error fetching staff:', err);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load staff' });
        } finally {
            setLoading(false);
        }
    }, [branchId, selectedDepartment]);

    useEffect(() => {
        fetchStaff();
    }, [fetchStaff]);

    const filteredStaff = staff.filter(s =>
        s.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.employee_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="p-4 md:p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <ScanFace className="h-7 w-7 text-purple-600" />
                            Staff Face Registration
                        </h1>
                        <p className="text-muted-foreground">Register staff faces for AI attendance</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="px-3 py-1">
                            <Users className="h-4 w-4 mr-1" />
                            {stats.total} Total
                        </Badge>
                        <Badge variant="outline" className="px-3 py-1 bg-green-50 text-green-700">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            {stats.registered} Registered
                        </Badge>
                        <Badge variant="outline" className="px-3 py-1 bg-yellow-50 text-yellow-700">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            {stats.pending} Pending
                        </Badge>
                    </div>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label>Department</Label>
                                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Departments" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments</SelectItem>
                                        {departments.map(d => (
                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Search</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name, ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                            <div className="flex items-end">
                                <Button onClick={fetchStaff} variant="outline" className="w-full">
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Refresh
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Registration Progress</span>
                            <span className="text-sm text-muted-foreground">
                                {stats.registered} / {stats.total} ({stats.total > 0 ? Math.round((stats.registered / stats.total) * 100) : 0}%)
                            </span>
                        </div>
                        <Progress value={stats.total > 0 ? (stats.registered / stats.total) * 100 : 0} className="h-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Briefcase className="h-5 w-5" />
                            Staff List
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Staff</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Designation</TableHead>
                                        <TableHead>Face Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStaff.map(member => (
                                        <TableRow key={member.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                                        {member.photo_url ? (
                                                            <img src={member.photo_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User className="h-5 w-5 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{member.display_name}</p>
                                                        <p className="text-xs text-muted-foreground">{member.employee_id}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{member.departments?.name || '-'}</TableCell>
                                            <TableCell>{member.designations?.name || '-'}</TableCell>
                                            <TableCell>
                                                {member.hasFace ? (
                                                    <Badge className="bg-green-500">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        Registered
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                                        Pending
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        window.location.href = `/super-admin/attendance/face-registration?staffId=${member.id}`;
                                                    }}
                                                >
                                                    <Camera className="h-4 w-4 mr-1" />
                                                    {member.hasFace ? 'Update' : 'Register'}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredStaff.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No staff found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default SmartStaffFaceRegistration;
