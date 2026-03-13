/**
 * Room Management Page
 * Manage exam rooms for seating arrangements
 * Phase 3 of Examination Module
 * @file jashchar-frontend/src/pages/super-admin/examinations/RoomManagement.jsx
 * @date 2026-03-13
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { roomService } from '@/services/examinationService';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import DashboardLayout from '@/components/DashboardLayout';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
    DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Icons
import { 
    Building2, 
    Plus, 
    Pencil, 
    Trash2, 
    RefreshCw, 
    DoorOpen,
    Users,
    Monitor,
    Snowflake,
    Video,
    CheckCircle2,
    XCircle,
    LayoutGrid
} from 'lucide-react';

const RoomManagement = () => {
    const { toast } = useToast();
    const { user, organizationId } = useAuth();
    const { selectedBranch } = useBranch();

    // State
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [roomToDelete, setRoomToDelete] = useState(null);
    const [activeTab, setActiveTab] = useState('all');

    // Form
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            room_name: '',
            room_number: '',
            room_code: '',
            floor: '',
            building: '',
            capacity: 30,
            rows_count: 5,
            columns_count: 6,
            has_projector: false,
            has_ac: false,
            has_cctv: false,
            has_whiteboard: true,
            has_computer: false,
            is_active: true,
            is_available_for_exam: true,
            remarks: ''
        }
    });

    // Fetch rooms
    const fetchRooms = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (activeTab === 'active') params.is_active = 'true';
            if (activeTab === 'inactive') params.is_active = 'false';
            if (activeTab === 'exam-ready') params.is_available_for_exam = 'true';

            const response = await roomService.getAll(params);
            if (response.success) {
                setRooms(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching rooms:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch rooms',
                variant: 'destructive'
            });
        }
        setLoading(false);
    }, [activeTab, toast]);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    // Open dialog for create/edit
    const openDialog = (room = null) => {
        if (room) {
            setEditingRoom(room);
            Object.keys(room).forEach(key => {
                setValue(key, room[key]);
            });
        } else {
            setEditingRoom(null);
            reset();
        }
        setDialogOpen(true);
    };

    // Handle form submit
    const onSubmit = async (data) => {
        setLoading(true);
        try {
            if (editingRoom) {
                const response = await roomService.update(editingRoom.id, data);
                if (response.success) {
                    toast({ title: 'Success', description: 'Room updated successfully' });
                }
            } else {
                const response = await roomService.create(data);
                if (response.success) {
                    toast({ title: 'Success', description: 'Room created successfully' });
                }
            }
            setDialogOpen(false);
            fetchRooms();
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to save room',
                variant: 'destructive'
            });
        }
        setLoading(false);
    };

    // Handle delete
    const handleDelete = async () => {
        if (!roomToDelete) return;
        
        setLoading(true);
        try {
            const response = await roomService.delete(roomToDelete.id);
            if (response.success) {
                toast({ title: 'Success', description: 'Room deleted successfully' });
                fetchRooms();
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete room',
                variant: 'destructive'
            });
        }
        setDeleteDialogOpen(false);
        setRoomToDelete(null);
        setLoading(false);
    };

    // Stats
    const totalRooms = rooms.length;
    const activeRooms = rooms.filter(r => r.is_active).length;
    const examReadyRooms = rooms.filter(r => r.is_available_for_exam).length;
    const totalCapacity = rooms.reduce((sum, r) => sum + (r.capacity || 0), 0);

    return (
        <DashboardLayout>
            <div className="container mx-auto py-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Building2 className="h-6 w-6" />
                            Room Management
                        </h1>
                        <p className="text-muted-foreground">
                            Manage exam rooms for seating arrangements
                        </p>
                    </div>
                    <Button onClick={() => openDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Room
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Rooms</p>
                                    <p className="text-2xl font-bold">{totalRooms}</p>
                                </div>
                                <DoorOpen className="h-8 w-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Active Rooms</p>
                                    <p className="text-2xl font-bold">{activeRooms}</p>
                                </div>
                                <CheckCircle2 className="h-8 w-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Exam Ready</p>
                                    <p className="text-2xl font-bold">{examReadyRooms}</p>
                                </div>
                                <LayoutGrid className="h-8 w-8 text-purple-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Capacity</p>
                                    <p className="text-2xl font-bold">{totalCapacity}</p>
                                </div>
                                <Users className="h-8 w-8 text-orange-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Rooms Table */}
                <Card>
                    <CardHeader>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList>
                                <TabsTrigger value="all">All Rooms</TabsTrigger>
                                <TabsTrigger value="active">Active</TabsTrigger>
                                <TabsTrigger value="exam-ready">Exam Ready</TabsTrigger>
                                <TabsTrigger value="inactive">Inactive</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Room Name</TableHead>
                                    <TableHead>Number</TableHead>
                                    <TableHead>Building</TableHead>
                                    <TableHead>Floor</TableHead>
                                    <TableHead>Capacity</TableHead>
                                    <TableHead>Layout</TableHead>
                                    <TableHead>Facilities</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && rooms.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8">
                                            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                                            Loading rooms...
                                        </TableCell>
                                    </TableRow>
                                ) : rooms.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                            No rooms found. Click "Add Room" to create one.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    rooms.map(room => (
                                        <TableRow key={room.id}>
                                            <TableCell className="font-medium">{room.room_name}</TableCell>
                                            <TableCell>{room.room_number || '-'}</TableCell>
                                            <TableCell>{room.building || '-'}</TableCell>
                                            <TableCell>{room.floor || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">
                                                    <Users className="h-3 w-3 mr-1" />
                                                    {room.capacity}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {room.rows_count} x {room.columns_count}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    {room.has_projector && (
                                                        <Badge variant="outline" title="Projector">
                                                            <Monitor className="h-3 w-3" />
                                                        </Badge>
                                                    )}
                                                    {room.has_ac && (
                                                        <Badge variant="outline" title="AC">
                                                            <Snowflake className="h-3 w-3" />
                                                        </Badge>
                                                    )}
                                                    {room.has_cctv && (
                                                        <Badge variant="outline" title="CCTV">
                                                            <Video className="h-3 w-3" />
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    {room.is_active ? (
                                                        <Badge variant="success" className="w-fit">Active</Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="w-fit">Inactive</Badge>
                                                    )}
                                                    {room.is_available_for_exam && (
                                                        <Badge variant="default" className="w-fit text-xs">Exam Ready</Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon"
                                                        onClick={() => openDialog(room)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon"
                                                        onClick={() => {
                                                            setRoomToDelete(room);
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
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                {editingRoom ? 'Edit Room' : 'Add New Room'}
                            </DialogTitle>
                            <DialogDescription>
                                Enter room details for exam seating arrangements
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="room_name">Room Name *</Label>
                                    <Input
                                        id="room_name"
                                        {...register('room_name', { required: 'Room name is required' })}
                                        placeholder="e.g., Hall A"
                                    />
                                    {errors.room_name && (
                                        <span className="text-sm text-red-500">{errors.room_name.message}</span>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="room_number">Room Number</Label>
                                    <Input
                                        id="room_number"
                                        {...register('room_number')}
                                        placeholder="e.g., 101"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="room_code">Room Code</Label>
                                    <Input
                                        id="room_code"
                                        {...register('room_code')}
                                        placeholder="e.g., HA-101"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="building">Building</Label>
                                    <Input
                                        id="building"
                                        {...register('building')}
                                        placeholder="e.g., Main Block"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="floor">Floor</Label>
                                    <Input
                                        id="floor"
                                        {...register('floor')}
                                        placeholder="e.g., Ground Floor"
                                    />
                                </div>
                            </div>

                            {/* Capacity & Layout */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="capacity">Capacity</Label>
                                    <Input
                                        id="capacity"
                                        type="number"
                                        {...register('capacity', { valueAsNumber: true })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rows_count">Rows</Label>
                                    <Input
                                        id="rows_count"
                                        type="number"
                                        {...register('rows_count', { valueAsNumber: true })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="columns_count">Columns</Label>
                                    <Input
                                        id="columns_count"
                                        type="number"
                                        {...register('columns_count', { valueAsNumber: true })}
                                    />
                                </div>
                            </div>

                            {/* Facilities */}
                            <div className="space-y-3">
                                <Label>Facilities</Label>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="has_projector"
                                            checked={watch('has_projector')}
                                            onCheckedChange={(checked) => setValue('has_projector', checked)}
                                        />
                                        <Label htmlFor="has_projector" className="flex items-center gap-1">
                                            <Monitor className="h-4 w-4" /> Projector
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="has_ac"
                                            checked={watch('has_ac')}
                                            onCheckedChange={(checked) => setValue('has_ac', checked)}
                                        />
                                        <Label htmlFor="has_ac" className="flex items-center gap-1">
                                            <Snowflake className="h-4 w-4" /> AC
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="has_cctv"
                                            checked={watch('has_cctv')}
                                            onCheckedChange={(checked) => setValue('has_cctv', checked)}
                                        />
                                        <Label htmlFor="has_cctv" className="flex items-center gap-1">
                                            <Video className="h-4 w-4" /> CCTV
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            {/* Status Switches */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="is_active"
                                        checked={watch('is_active')}
                                        onCheckedChange={(checked) => setValue('is_active', checked)}
                                    />
                                    <Label htmlFor="is_active">Active</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="is_available_for_exam"
                                        checked={watch('is_available_for_exam')}
                                        onCheckedChange={(checked) => setValue('is_available_for_exam', checked)}
                                    />
                                    <Label htmlFor="is_available_for_exam">Available for Exams</Label>
                                </div>
                            </div>

                            {/* Remarks */}
                            <div className="space-y-2">
                                <Label htmlFor="remarks">Remarks</Label>
                                <Input
                                    id="remarks"
                                    {...register('remarks')}
                                    placeholder="Any additional notes..."
                                />
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? (
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    ) : null}
                                    {editingRoom ? 'Update Room' : 'Create Room'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Room?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete "{roomToDelete?.room_name}"? 
                                This action cannot be undone and may affect existing seating arrangements.
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

export default RoomManagement;
