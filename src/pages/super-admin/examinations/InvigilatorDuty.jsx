/**
 * Invigilator Duty Management Page
 * Assign teachers/staff to exam invigilation duties
 * Phase 3 of Examination Module
 * @file jashchar-frontend/src/pages/super-admin/examinations/InvigilatorDuty.jsx
 * @date 2026-03-13
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { invigilatorDutyService, examService, examGroupService, roomService } from '@/services/examinationService';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { formatDate, formatTime } from '@/utils/dateUtils';
import DatePicker from '@/components/ui/DatePicker';
import DashboardLayout from '@/components/DashboardLayout';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Icons
import { 
    UserCog, 
    Plus, 
    Pencil, 
    Trash2, 
    RefreshCw,
    Calendar,
    Clock,
    MapPin,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Users,
    Crown
} from 'lucide-react';

const InvigilatorDuty = () => {
    const { toast } = useToast();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();

    // State
    const [duties, setDuties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingDuty, setEditingDuty] = useState(null);
    const [dutyToDelete, setDutyToDelete] = useState(null);
    const [activeTab, setActiveTab] = useState('all');

    // Reference data
    const [examGroups, setExamGroups] = useState([]);
    const [exams, setExams] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [staff, setStaff] = useState([]);
    const [selectedExamGroup, setSelectedExamGroup] = useState('');
    const [selectedExam, setSelectedExam] = useState('');

    // Form
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            exam_id: '',
            staff_id: '',
            room_id: '',
            duty_date: '',
            start_time: '',
            end_time: '',
            duty_type: 'invigilator',
            is_chief_invigilator: false,
            remarks: ''
        }
    });

    // Fetch reference data
    const fetchReferenceData = useCallback(async () => {
        try {
            const [groupsRes, roomsRes, staffRes] = await Promise.all([
                examGroupService.getAll(),
                roomService.getAll({ is_available_for_exam: 'true' }),
                apiClient.get('/staff?is_active=true')
            ]);

            if (groupsRes.success) setExamGroups(groupsRes.data || []);
            if (roomsRes.success) setRooms(roomsRes.data || []);
            if (staffRes.success) setStaff(staffRes.data || []);
        } catch (error) {
            console.error('Error fetching reference data:', error);
        }
    }, []);

    // Fetch exams when exam group changes
    useEffect(() => {
        const fetchExams = async () => {
            if (selectedExamGroup) {
                try {
                    const examsRes = await examService.getAll({ exam_group_id: selectedExamGroup });
                    if (examsRes.success) {
                        setExams(examsRes.data || []);
                    }
                } catch (error) {
                    console.error('Error fetching exams:', error);
                }
            } else {
                setExams([]);
            }
        };
        fetchExams();
    }, [selectedExamGroup]);

    // Fetch duties
    const fetchDuties = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (selectedExam) params.exam_id = selectedExam;
            if (activeTab !== 'all') params.status = activeTab;

            const response = await invigilatorDutyService.getAll(params);
            if (response.success) {
                setDuties(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching duties:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch invigilator duties',
                variant: 'destructive'
            });
        }
        setLoading(false);
    }, [selectedExam, activeTab, toast]);

    useEffect(() => {
        fetchReferenceData();
    }, [fetchReferenceData]);

    useEffect(() => {
        fetchDuties();
    }, [fetchDuties]);

    // Open dialog for create/edit
    const openDialog = (duty = null) => {
        if (duty) {
            setEditingDuty(duty);
            setValue('exam_id', duty.exam_id);
            setValue('staff_id', duty.staff_id);
            setValue('room_id', duty.room_id);
            setValue('duty_date', duty.duty_date);
            setValue('start_time', duty.start_time);
            setValue('end_time', duty.end_time);
            setValue('duty_type', duty.duty_type);
            setValue('is_chief_invigilator', duty.is_chief_invigilator);
            setValue('remarks', duty.remarks || '');
        } else {
            setEditingDuty(null);
            reset();
            if (selectedExam) {
                setValue('exam_id', selectedExam);
            }
        }
        setDialogOpen(true);
    };

    // Handle form submit
    const onSubmit = async (data) => {
        setLoading(true);
        try {
            if (editingDuty) {
                const response = await invigilatorDutyService.update(editingDuty.id, data);
                if (response.success) {
                    toast({ title: 'Success', description: 'Duty updated successfully' });
                }
            } else {
                const response = await invigilatorDutyService.assign(data);
                if (response.success) {
                    toast({ title: 'Success', description: 'Duty assigned successfully' });
                }
            }
            setDialogOpen(false);
            fetchDuties();
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to save duty',
                variant: 'destructive'
            });
        }
        setLoading(false);
    };

    // Handle delete
    const handleDelete = async () => {
        if (!dutyToDelete) return;
        
        setLoading(true);
        try {
            const response = await invigilatorDutyService.delete(dutyToDelete.id);
            if (response.success) {
                toast({ title: 'Success', description: 'Duty deleted successfully' });
                fetchDuties();
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete duty',
                variant: 'destructive'
            });
        }
        setDeleteDialogOpen(false);
        setDutyToDelete(null);
        setLoading(false);
    };

    // Handle attendance marking
    const handleMarkAttendance = async (duty, type) => {
        try {
            const now = new Date().toISOString();
            const data = type === 'in' 
                ? { check_in_time: now, status: 'confirmed' }
                : { check_out_time: now, status: 'completed' };

            await invigilatorDutyService.markAttendance(duty.id, data);
            toast({ title: 'Success', description: `${type === 'in' ? 'Check-in' : 'Check-out'} recorded` });
            fetchDuties();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to mark attendance',
                variant: 'destructive'
            });
        }
    };

    // Get status badge
    const getStatusBadge = (status) => {
        const config = {
            assigned: { variant: 'secondary', icon: AlertCircle, label: 'Assigned' },
            confirmed: { variant: 'default', icon: CheckCircle2, label: 'Confirmed' },
            completed: { variant: 'success', icon: CheckCircle2, label: 'Completed' },
            absent: { variant: 'destructive', icon: XCircle, label: 'Absent' },
            substitute: { variant: 'outline', icon: Users, label: 'Substitute' },
            cancelled: { variant: 'secondary', icon: XCircle, label: 'Cancelled' }
        };
        const c = config[status] || config.assigned;
        const Icon = c.icon;
        return (
            <Badge variant={c.variant} className="gap-1">
                <Icon className="h-3 w-3" />
                {c.label}
            </Badge>
        );
    };

    // Stats
    const totalDuties = duties.length;
    const completedDuties = duties.filter(d => d.status === 'completed').length;
    const pendingDuties = duties.filter(d => d.status === 'assigned').length;

    return (
        <DashboardLayout>
            <div className="container mx-auto py-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <UserCog className="h-6 w-6" />
                            Invigilator Duty Assignment
                        </h1>
                        <p className="text-muted-foreground">
                            Assign staff to exam invigilation duties
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => openDialog()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Assign Duty
                        </Button>
                    </div>
                </div>

                {/* Filter Card */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Exam Group</Label>
                                <Select value={selectedExamGroup || 'all'} onValueChange={(v) => setSelectedExamGroup(v === 'all' ? '' : v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select exam group" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Groups</SelectItem>
                                        {examGroups.map(group => (
                                            <SelectItem key={group.id} value={group.id}>
                                                {group.group_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Exam</Label>
                                <Select 
                                    value={selectedExam || 'all'} 
                                    onValueChange={(v) => setSelectedExam(v === 'all' ? '' : v)}
                                    disabled={!selectedExamGroup}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select exam" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Exams</SelectItem>
                                        {exams.map(exam => (
                                            <SelectItem key={exam.id} value={exam.id}>
                                                {exam.exam_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <Button variant="outline" onClick={fetchDuties}>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Refresh
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Duties</p>
                                    <p className="text-2xl font-bold">{totalDuties}</p>
                                </div>
                                <UserCog className="h-8 w-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Completed</p>
                                    <p className="text-2xl font-bold">{completedDuties}</p>
                                </div>
                                <CheckCircle2 className="h-8 w-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Pending</p>
                                    <p className="text-2xl font-bold">{pendingDuties}</p>
                                </div>
                                <AlertCircle className="h-8 w-8 text-orange-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Duties Table */}
                <Card>
                    <CardHeader>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList>
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="assigned">Assigned</TabsTrigger>
                                <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                                <TabsTrigger value="completed">Completed</TabsTrigger>
                                <TabsTrigger value="absent">Absent</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Staff</TableHead>
                                    <TableHead>Exam</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Room</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && duties.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8">
                                            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                                            Loading duties...
                                        </TableCell>
                                    </TableRow>
                                ) : duties.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            No duties found. Select an exam group and exam to view duties.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    duties.map(duty => (
                                        <TableRow key={duty.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {duty.is_chief_invigilator && (
                                                        <Crown className="h-4 w-4 text-yellow-500" title="Chief Invigilator" />
                                                    )}
                                                    {duty.staff?.full_name || '-'}
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {duty.staff?.designation || ''}
                                                </span>
                                            </TableCell>
                                            <TableCell>{duty.exam?.exam_name || '-'}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(duty.duty_date)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {duty.start_time || '-'} - {duty.end_time || '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {duty.room?.room_name || '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {duty.duty_type?.replace('_', ' ') || 'Invigilator'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(duty.status)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    {duty.status === 'assigned' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleMarkAttendance(duty, 'in')}
                                                        >
                                                            Check In
                                                        </Button>
                                                    )}
                                                    {duty.status === 'confirmed' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleMarkAttendance(duty, 'out')}
                                                        >
                                                            Check Out
                                                        </Button>
                                                    )}
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon"
                                                        onClick={() => openDialog(duty)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon"
                                                        onClick={() => {
                                                            setDutyToDelete(duty);
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Create/Edit Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingDuty ? 'Edit Duty' : 'Assign Invigilator Duty'}
                            </DialogTitle>
                            <DialogDescription>
                                Assign a staff member to invigilation duty
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="exam_id">Exam *</Label>
                                <Select 
                                    value={watch('exam_id')} 
                                    onValueChange={(v) => setValue('exam_id', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select exam" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {exams.map(exam => (
                                            <SelectItem key={exam.id} value={exam.id}>
                                                {exam.exam_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="staff_id">Staff *</Label>
                                <Select 
                                    value={watch('staff_id')} 
                                    onValueChange={(v) => setValue('staff_id', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select staff member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {staff.map(s => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.full_name} - {s.designation || 'Staff'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="room_id">Room</Label>
                                <Select 
                                    value={watch('room_id')} 
                                    onValueChange={(v) => setValue('room_id', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select room" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rooms.map(room => (
                                            <SelectItem key={room.id} value={room.id}>
                                                {room.room_name} ({room.capacity} seats)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <DatePicker
                                        id="duty_date"
                                        label="Date *"
                                        required
                                        value={watch('duty_date')}
                                        onChange={(date) => setValue('duty_date', date)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="start_time">Start Time</Label>
                                    <Input
                                        id="start_time"
                                        type="time"
                                        {...register('start_time')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end_time">End Time</Label>
                                    <Input
                                        id="end_time"
                                        type="time"
                                        {...register('end_time')}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="duty_type">Duty Type</Label>
                                    <Select 
                                        value={watch('duty_type')} 
                                        onValueChange={(v) => setValue('duty_type', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="invigilator">Invigilator</SelectItem>
                                            <SelectItem value="chief_invigilator">Chief Invigilator</SelectItem>
                                            <SelectItem value="relief">Relief</SelectItem>
                                            <SelectItem value="flying_squad">Flying Squad</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center space-x-2 pt-8">
                                    <Switch
                                        id="is_chief_invigilator"
                                        checked={watch('is_chief_invigilator')}
                                        onCheckedChange={(checked) => setValue('is_chief_invigilator', checked)}
                                    />
                                    <Label htmlFor="is_chief_invigilator">Chief Invigilator</Label>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="remarks">Remarks</Label>
                                <Textarea
                                    id="remarks"
                                    {...register('remarks')}
                                    placeholder="Any special instructions..."
                                />
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                                    {editingDuty ? 'Update Duty' : 'Assign Duty'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation */}
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Duty?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete this invigilator duty assignment?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
};

export default InvigilatorDuty;
