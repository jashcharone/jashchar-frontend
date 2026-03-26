/**
 * Seating Arrangement Page
 * Generate and manage exam seating plans
 * Phase 3 of Examination Module
 * @file jashchar-frontend/src/pages/super-admin/examinations/SeatingArrangement.jsx
 * @date 2026-03-13
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { seatingService, examService, examGroupService, roomService } from '@/services/examinationService';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/utils/dateUtils';
import DashboardLayout from '@/components/DashboardLayout';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Icons
import { 
    LayoutGrid, 
    RefreshCw,
    Wand2,
    Trash2,
    Users,
    MapPin,
    Download,
    Printer,
    Grid3X3
} from 'lucide-react';

const SeatingArrangement = () => {
    const { toast } = useToast();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();

    // State
    const [seating, setSeating] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
    const [clearDialogOpen, setClearDialogOpen] = useState(false);
    const [viewMode, setViewMode] = useState('table'); // table, room-wise, visual

    // Reference data
    const [examGroups, setExamGroups] = useState([]);
    const [exams, setExams] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [selectedExamGroup, setSelectedExamGroup] = useState('');
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedRoom, setSelectedRoom] = useState('');
    const [selectedRooms, setSelectedRooms] = useState([]);

    // Generation options
    const [generatePattern, setGeneratePattern] = useState('sequential');

    // Fetch reference data
    const fetchReferenceData = useCallback(async () => {
        try {
            const [groupsRes, roomsRes] = await Promise.all([
                examGroupService.getAll(),
                roomService.getAll({ is_available_for_exam: 'true' })
            ]);

            if (groupsRes.success) setExamGroups(groupsRes.data || []);
            if (roomsRes.success) setRooms(roomsRes.data || []);
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

    // Fetch seating arrangements
    const fetchSeating = useCallback(async () => {
        if (!selectedExam) {
            setSeating([]);
            return;
        }

        setLoading(true);
        try {
            const params = { exam_id: selectedExam };
            if (selectedRoom) params.room_id = selectedRoom;

            const response = await seatingService.getAll(params);
            if (response.success) {
                setSeating(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching seating:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch seating arrangements',
                variant: 'destructive'
            });
        }
        setLoading(false);
    }, [selectedExam, selectedRoom, toast]);

    useEffect(() => {
        fetchReferenceData();
    }, [fetchReferenceData]);

    useEffect(() => {
        fetchSeating();
    }, [fetchSeating]);

    // Handle room selection for generation
    const handleRoomToggle = (roomId, checked) => {
        if (checked) {
            setSelectedRooms([...selectedRooms, roomId]);
        } else {
            setSelectedRooms(selectedRooms.filter(id => id !== roomId));
        }
    };

    // Generate seating arrangement
    const handleGenerate = async () => {
        if (!selectedExam) {
            toast({
                title: 'Select Exam',
                description: 'Please select an exam first',
                variant: 'destructive'
            });
            return;
        }

        if (selectedRooms.length === 0) {
            toast({
                title: 'Select Rooms',
                description: 'Please select at least one room',
                variant: 'destructive'
            });
            return;
        }

        setLoading(true);
        try {
            const response = await seatingService.generate({
                exam_id: selectedExam,
                room_ids: selectedRooms,
                pattern: generatePattern
            });

            if (response.success) {
                toast({ 
                    title: 'Success', 
                    description: response.message || 'Seating arrangement generated successfully' 
                });
                setGenerateDialogOpen(false);
                setSelectedRooms([]);
                fetchSeating();
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to generate seating arrangement',
                variant: 'destructive'
            });
        }
        setLoading(false);
    };

    // Clear seating arrangements
    const handleClear = async () => {
        if (!selectedExam) return;

        setLoading(true);
        try {
            const response = await seatingService.clear(selectedExam);
            if (response.success) {
                toast({ title: 'Success', description: 'Seating arrangements cleared' });
                setClearDialogOpen(false);
                fetchSeating();
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to clear seating arrangements',
                variant: 'destructive'
            });
        }
        setLoading(false);
    };

    // Group seating by room
    const seatingByRoom = seating.reduce((acc, seat) => {
        const roomId = seat.room_id;
        if (!acc[roomId]) {
            acc[roomId] = {
                room: seat.room,
                seats: []
            };
        }
        acc[roomId].seats.push(seat);
        return acc;
    }, {});

    // Stats
    const totalSeats = seating.length;
    const roomsUsed = Object.keys(seatingByRoom).length;

    // Get selected exam details
    const selectedExamDetails = exams.find(e => e.id === selectedExam);

    return (
        <DashboardLayout>
            <div className="container mx-auto py-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <LayoutGrid className="h-6 w-6" />
                            Seating Arrangement
                        </h1>
                        <p className="text-muted-foreground">
                            Generate and manage exam seating plans
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline"
                            onClick={() => setClearDialogOpen(true)}
                            disabled={!selectedExam || seating.length === 0}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear All
                        </Button>
                        <Button onClick={() => setGenerateDialogOpen(true)} disabled={!selectedExam}>
                            <Wand2 className="h-4 w-4 mr-2" />
                            Generate Seating
                        </Button>
                    </div>
                </div>

                {/* Exam Selection */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label>Exam Group</Label>
                                <Select value={selectedExamGroup} onValueChange={setSelectedExamGroup}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select exam group" />
                                    </SelectTrigger>
                                    <SelectContent>
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
                                    value={selectedExam} 
                                    onValueChange={setSelectedExam}
                                    disabled={!selectedExamGroup}
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
                                <Label>Filter by Room</Label>
                                <Select 
                                    value={selectedRoom || 'all'} 
                                    onValueChange={(v) => setSelectedRoom(v === 'all' ? '' : v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Rooms" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Rooms</SelectItem>
                                        {rooms.map(room => (
                                            <SelectItem key={room.id} value={room.id}>
                                                {room.room_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <Button variant="outline" onClick={fetchSeating}>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Refresh
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Exam Info & Stats */}
                {selectedExamDetails && (
                    <div className="grid grid-cols-4 gap-4">
                        <Card className="col-span-2">
                            <CardContent className="pt-6">
                                <h3 className="font-semibold">{selectedExamDetails.exam_name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {selectedExamDetails.exam_date ? formatDate(selectedExamDetails.exam_date) : 'Date not set'}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Students Seated</p>
                                        <p className="text-2xl font-bold">{totalSeats}</p>
                                    </div>
                                    <Users className="h-8 w-8 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Rooms Used</p>
                                        <p className="text-2xl font-bold">{roomsUsed}</p>
                                    </div>
                                    <MapPin className="h-8 w-8 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* View Mode Tabs */}
                <Card>
                    <CardHeader>
                        <Tabs value={viewMode} onValueChange={setViewMode}>
                            <TabsList>
                                <TabsTrigger value="table">Table View</TabsTrigger>
                                <TabsTrigger value="room-wise">Room-wise</TabsTrigger>
                                <TabsTrigger value="visual">Visual Layout</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </CardHeader>
                    <CardContent>
                        {viewMode === 'table' && (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Seat No</TableHead>
                                        <TableHead>Student Name</TableHead>
                                        <TableHead>Enroll ID</TableHead>
                                        <TableHead>Class</TableHead>
                                        <TableHead>Room</TableHead>
                                        <TableHead>Row</TableHead>
                                        <TableHead>Column</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading && seating.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8">
                                                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                                                Loading seating arrangements...
                                            </TableCell>
                                        </TableRow>
                                    ) : !selectedExam ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                Select an exam to view seating arrangements
                                            </TableCell>
                                        </TableRow>
                                    ) : seating.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                No seating arrangements found. Click "Generate Seating" to create.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        seating.map(seat => (
                                            <TableRow key={seat.id}>
                                                <TableCell className="font-medium">{seat.seat_number}</TableCell>
                                                <TableCell>{seat.student?.full_name || '-'}</TableCell>
                                                <TableCell>{seat.student?.enrollment_id || '-'}</TableCell>
                                                <TableCell>
                                                    {seat.student?.class_name} - {seat.student?.section_name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {seat.room?.room_name || '-'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{seat.row_number}</TableCell>
                                                <TableCell>{seat.column_number}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}

                        {viewMode === 'room-wise' && (
                            <div className="space-y-6">
                                {Object.entries(seatingByRoom).length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        {!selectedExam 
                                            ? 'Select an exam to view seating arrangements'
                                            : 'No seating arrangements found. Click "Generate Seating" to create.'
                                        }
                                    </div>
                                ) : (
                                    Object.entries(seatingByRoom).map(([roomId, data]) => (
                                        <Card key={roomId}>
                                            <CardHeader>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <MapPin className="h-5 w-5" />
                                                    {data.room?.room_name}
                                                </CardTitle>
                                                <CardDescription>
                                                    {data.seats.length} students | Capacity: {data.room?.capacity || '-'}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-6 gap-2">
                                                    {data.seats.map(seat => (
                                                        <div 
                                                            key={seat.id}
                                                            className="p-2 border rounded text-center text-xs"
                                                        >
                                                            <div className="font-bold">{seat.seat_number}</div>
                                                            <div className="truncate" title={seat.student?.full_name}>
                                                                {seat.student?.full_name?.split(' ')[0]}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        )}

                        {viewMode === 'visual' && (
                            <div className="space-y-6">
                                {Object.entries(seatingByRoom).length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        {!selectedExam 
                                            ? 'Select an exam to view seating arrangements'
                                            : 'No seating arrangements found. Click "Generate Seating" to create.'
                                        }
                                    </div>
                                ) : (
                                    Object.entries(seatingByRoom).map(([roomId, data]) => {
                                        const room = data.room || {};
                                        const rows = room.rows_count || 5;
                                        const cols = room.columns_count || 6;
                                        
                                        // Create grid
                                        const grid = Array(rows).fill(null).map(() => Array(cols).fill(null));
                                        data.seats.forEach(seat => {
                                            if (seat.row_number && seat.column_number) {
                                                const r = seat.row_number - 1;
                                                const c = seat.column_number - 1;
                                                if (r >= 0 && r < rows && c >= 0 && c < cols) {
                                                    grid[r][c] = seat;
                                                }
                                            }
                                        });

                                        return (
                                            <Card key={roomId}>
                                                <CardHeader>
                                                    <CardTitle className="text-lg flex items-center gap-2">
                                                        <Grid3X3 className="h-5 w-5" />
                                                        {room.room_name} Layout
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="w-full bg-slate-200 text-center py-2 rounded mb-4">
                                                            FRONT (Blackboard)
                                                        </div>
                                                        {grid.map((row, rowIdx) => (
                                                            <div key={rowIdx} className="flex gap-2">
                                                                {row.map((seat, colIdx) => (
                                                                    <div 
                                                                        key={`${rowIdx}-${colIdx}`}
                                                                        className={`w-20 h-16 border rounded flex flex-col items-center justify-center text-xs ${
                                                                            seat ? 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700' : 'bg-gray-50 dark:bg-gray-800'
                                                                        }`}
                                                                    >
                                                                        {seat ? (
                                                                            <>
                                                                                <div className="font-bold">{seat.seat_number}</div>
                                                                                <div className="truncate w-full text-center px-1" title={seat.student?.full_name}>
                                                                                    {seat.student?.full_name?.split(' ')[0]}
                                                                                </div>
                                                                            </>
                                                                        ) : (
                                                                            <span className="text-gray-400 dark:text-gray-500">Empty</span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Generate Dialog */}
                <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Generate Seating Arrangement</DialogTitle>
                            <DialogDescription>
                                Select rooms and generate seating for the selected exam
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Generation Pattern</Label>
                                <Select value={generatePattern} onValueChange={setGeneratePattern}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sequential">Sequential (001, 002, 003...)</SelectItem>
                                        <SelectItem value="alternate">Alternate Classes</SelectItem>
                                        <SelectItem value="random">Random</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Select Rooms *</Label>
                                <div className="border rounded-md p-4 max-h-64 overflow-y-auto">
                                    {rooms.length === 0 ? (
                                        <p className="text-muted-foreground text-center">
                                            No exam-ready rooms available
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {rooms.map(room => (
                                                <div key={room.id} className="flex items-center space-x-3 p-2 hover:bg-muted rounded">
                                                    <Checkbox
                                                        id={room.id}
                                                        checked={selectedRooms.includes(room.id)}
                                                        onCheckedChange={(checked) => handleRoomToggle(room.id, checked)}
                                                    />
                                                    <Label htmlFor={room.id} className="flex-1 cursor-pointer">
                                                        <span className="font-medium">{room.room_name}</span>
                                                        <span className="text-muted-foreground ml-2">
                                                            (Capacity: {room.capacity}, Layout: {room.rows_count}x{room.columns_count})
                                                        </span>
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedRooms.length > 0 && (
                                <div className="p-3 bg-muted rounded">
                                    <p className="text-sm">
                                        <strong>Selected:</strong> {selectedRooms.length} room(s) with total capacity of {' '}
                                        {rooms.filter(r => selectedRooms.includes(r.id)).reduce((sum, r) => sum + (r.capacity || 0), 0)} seats
                                    </p>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleGenerate} disabled={loading || selectedRooms.length === 0}>
                                {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                                Generate Seating
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Clear Confirmation */}
                <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Clear Seating Arrangements?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will remove all seating arrangements for this exam. 
                                You'll need to regenerate the seating plan.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClear} className="bg-red-600 hover:bg-red-700">
                                Clear All
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
};

export default SeatingArrangement;
