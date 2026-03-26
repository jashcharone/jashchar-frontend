/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * UNKNOWN FACE MANAGEMENT - Day 34
 * ─────────────────────────────────────────────────────────────────────────────
 * AI Face Attendance System - Unknown Face Review & Identification
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { 
    RefreshCw, Calendar as CalendarIcon, Eye, EyeOff, Camera, Search,
    Download, Filter, ChevronRight, User, UserCheck, UserX, Check,
    X, AlertCircle, MapPin, Clock, Trash2, Link2
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { formatDate, formatDateTime, formatTime } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import faceAnalyticsApi from '@/services/faceAnalyticsApi';
import api from '@/services/api';

// ═══════════════════════════════════════════════════════════════════════════════
// UNKNOWN FACE CARD
// ═══════════════════════════════════════════════════════════════════════════════

const UnknownFaceCard = ({ face, onIdentify, onDismiss }) => {
    const [imageError, setImageError] = useState(false);

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-all">
            {/* Face Image */}
            <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
                {face.snapshot_url && !imageError ? (
                    <img
                        src={face.snapshot_url}
                        alt="Unknown face"
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Eye className="h-16 w-16 text-gray-400" />
                    </div>
                )}
                
                {/* Status Badge */}
                <Badge 
                    className="absolute top-2 right-2"
                    variant={face.status === 'dismissed' ? 'secondary' : 'destructive'}
                >
                    {face.status === 'dismissed' ? 'Dismissed' : 'Pending'}
                </Badge>

                {/* Confidence Badge */}
                {face.confidence && (
                    <Badge className="absolute bottom-2 left-2" variant="outline">
                        {(face.confidence * 100).toFixed(1)}% conf
                    </Badge>
                )}
            </div>

            {/* Info */}
            <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatDateTime(face.detected_at)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{face.location || face.camera_devices?.location || 'Unknown'}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Camera className="h-4 w-4" />
                    <span>{face.camera_devices?.name || 'Unknown Camera'}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    <Button 
                        variant="default" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => onIdentify(face)}
                    >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Identify
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onDismiss(face)}
                    >
                        <EyeOff className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// IDENTIFY DIALOG
// ═══════════════════════════════════════════════════════════════════════════════

const IdentifyDialog = ({ face, open, onClose, onConfirm, branchId }) => {
    const [personType, setPersonType] = useState('student');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [confirming, setConfirming] = useState(false);

    // Search students or staff
    const handleSearch = async (query) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const endpoint = personType === 'student' 
                ? `/students/search?branch_id=${branchId}&q=${query}`
                : `/staff/search?branch_id=${branchId}&q=${query}`;
            
            const response = await api.get(endpoint);
            setSearchResults(response.data?.data || response.data || []);
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            handleSearch(searchQuery);
        }, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery, personType]);

    const handleConfirm = async () => {
        if (!selectedPerson) return;
        
        setConfirming(true);
        try {
            await onConfirm(face.id, {
                person_id: selectedPerson.id,
                person_type: personType
            });
            onClose();
        } catch (error) {
            console.error('Identify error:', error);
        } finally {
            setConfirming(false);
        }
    };

    if (!face) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5" />
                        Identify Unknown Face
                    </DialogTitle>
                    <DialogDescription>
                        Link this face to a student or staff member
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-6">
                    {/* Face Preview */}
                    <div className="space-y-4">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                            {face.snapshot_url ? (
                                <img
                                    src={face.snapshot_url}
                                    alt="Unknown face"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Eye className="h-16 w-16 text-gray-400" />
                                </div>
                            )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                            <p>Detected: {formatDateTime(face.detected_at)}</p>
                            <p>Location: {face.location || 'Unknown'}</p>
                            <p>Confidence: {face.confidence ? `${(face.confidence * 100).toFixed(1)}%` : 'N/A'}</p>
                        </div>
                    </div>

                    {/* Search & Select */}
                    <div className="space-y-4">
                        <RadioGroup 
                            value={personType} 
                            onValueChange={(val) => {
                                setPersonType(val);
                                setSelectedPerson(null);
                                setSearchResults([]);
                            }}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="student" id="student" />
                                <Label htmlFor="student">Student</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="staff" id="staff" />
                                <Label htmlFor="staff">Staff</Label>
                            </div>
                        </RadioGroup>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={`Search ${personType}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <ScrollArea className="h-[250px] border rounded-lg">
                            {searching ? (
                                <div className="p-4 space-y-2">
                                    {[1, 2, 3].map(i => (
                                        <Skeleton key={i} className="h-14 w-full" />
                                    ))}
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    {searchQuery.length < 2 
                                        ? 'Type at least 2 characters to search'
                                        : 'No results found'}
                                </div>
                            ) : (
                                <div className="p-2 space-y-1">
                                    {searchResults.map((person) => (
                                        <div
                                            key={person.id}
                                            className={cn(
                                                'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                                                selectedPerson?.id === person.id 
                                                    ? 'bg-primary/10 border border-primary'
                                                    : 'hover:bg-muted/50'
                                            )}
                                            onClick={() => setSelectedPerson(person)}
                                        >
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={person.photo_url} />
                                                <AvatarFallback>
                                                    {person.full_name?.charAt(0) || person.name?.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="font-medium">
                                                    {person.full_name || person.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {personType === 'student' 
                                                        ? person.enrollment_id 
                                                        : person.employee_code || person.email}
                                                </p>
                                            </div>
                                            {selectedPerson?.id === person.id && (
                                                <Check className="h-5 w-5 text-primary" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>

                        {selectedPerson && (
                            <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20">
                                <UserCheck className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800 dark:text-green-200">
                                    Selected: <strong>{selectedPerson.full_name || selectedPerson.name}</strong>
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleConfirm} 
                        disabled={!selectedPerson || confirming}
                    >
                        {confirming ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Link2 className="h-4 w-4 mr-2" />
                        )}
                        Link Face
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// DISMISS DIALOG
// ═══════════════════════════════════════════════════════════════════════════════

const DismissDialog = ({ face, open, onClose, onConfirm }) => {
    const [reason, setReason] = useState('');
    const [dismissing, setDismissing] = useState(false);

    const dismissReasons = [
        'Not a valid person',
        'Blurry/unclear image',
        'Duplicate detection',
        'System error',
        'Other'
    ];

    const handleConfirm = async () => {
        setDismissing(true);
        try {
            await onConfirm(face.id, { reason: reason || 'Manually dismissed' });
            onClose();
        } catch (error) {
            console.error('Dismiss error:', error);
        } finally {
            setDismissing(false);
        }
    };

    if (!face) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <EyeOff className="h-5 w-5" />
                        Dismiss Unknown Face
                    </DialogTitle>
                    <DialogDescription>
                        This face will be marked as dismissed and won't appear in the pending list.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Face Preview */}
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
                            {face.snapshot_url ? (
                                <img
                                    src={face.snapshot_url}
                                    alt="Unknown face"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Eye className="h-8 w-8 m-4 text-gray-400" />
                            )}
                        </div>
                        <div>
                            <p className="font-medium">Unknown Face</p>
                            <p className="text-sm text-muted-foreground">
                                {formatDateTime(face.detected_at)}
                            </p>
                        </div>
                    </div>

                    {/* Reasons */}
                    <div className="space-y-2">
                        <Label>Dismiss Reason</Label>
                        <Select value={reason} onValueChange={setReason}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a reason..." />
                            </SelectTrigger>
                            <SelectContent>
                                {dismissReasons.map(r => (
                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button 
                        variant="destructive"
                        onClick={handleConfirm} 
                        disabled={dismissing}
                    >
                        {dismissing ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Dismiss Face
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const UnknownFaceManagement = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();

    // State
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [statusFilter, setStatusFilter] = useState('pending');

    // Data
    const [unknownFaces, setUnknownFaces] = useState([]);
    const [selectedFace, setSelectedFace] = useState(null);
    const [identifyOpen, setIdentifyOpen] = useState(false);
    const [dismissOpen, setDismissOpen] = useState(false);

    const branchId = selectedBranch?.id;

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA FETCH
    // ═══════════════════════════════════════════════════════════════════════════

    const fetchData = useCallback(async () => {
        if (!branchId) return;

        try {
            setRefreshing(true);
            const dateStr = selectedDate.toISOString().split('T')[0];
            
            const response = await faceAnalyticsApi.getUnknownFaces({
                branch_id: branchId,
                date: dateStr,
                status: statusFilter === 'all' ? undefined : statusFilter,
                limit: 100
            });

            if (response.success) {
                setUnknownFaces(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching unknown faces:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [branchId, selectedDate, statusFilter]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ═══════════════════════════════════════════════════════════════════════════
    // ACTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    const handleIdentify = (face) => {
        setSelectedFace(face);
        setIdentifyOpen(true);
    };

    const handleDismiss = (face) => {
        setSelectedFace(face);
        setDismissOpen(true);
    };

    const confirmIdentify = async (id, data) => {
        try {
            await faceAnalyticsApi.identifyUnknownFace(id, data);
            fetchData();
        } catch (error) {
            throw error;
        }
    };

    const confirmDismiss = async (id, data) => {
        try {
            await faceAnalyticsApi.dismissUnknownFace(id, data);
            fetchData();
        } catch (error) {
            throw error;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // STATS
    // ═══════════════════════════════════════════════════════════════════════════

    const pendingCount = unknownFaces.filter(f => f.status !== 'dismissed' && f.status !== 'identified').length;
    const identifiedCount = unknownFaces.filter(f => f.status === 'identified').length;
    const dismissedCount = unknownFaces.filter(f => f.status === 'dismissed').length;

    // ═══════════════════════════════════════════════════════════════════════════
    // MAIN RENDER
    // ═══════════════════════════════════════════════════════════════════════════

    if (!branchId) {
        return (
            <DashboardLayout>
                <div className="p-6">
                    <Alert>
                        <Eye className="h-4 w-4" />
                        <AlertDescription>
                            Please select a branch to manage unknown faces.
                        </AlertDescription>
                    </Alert>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Eye className="h-8 w-8 text-gray-500" />
                        Unknown Face Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Review and identify unrecognized faces
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Date Picker */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formatDate(selectedDate)}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => date && setSelectedDate(date)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    <Button 
                        variant="outline" 
                        onClick={fetchData}
                        disabled={refreshing}
                    >
                        <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card 
                    className={cn(
                        'cursor-pointer transition-all',
                        statusFilter === 'pending' && 'ring-2 ring-primary'
                    )}
                    onClick={() => setStatusFilter('pending')}
                >
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                                <AlertCircle className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Pending Review</p>
                                <p className="text-2xl font-bold">{pendingCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card 
                    className={cn(
                        'cursor-pointer transition-all',
                        statusFilter === 'identified' && 'ring-2 ring-primary'
                    )}
                    onClick={() => setStatusFilter('identified')}
                >
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                                <UserCheck className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Identified</p>
                                <p className="text-2xl font-bold">{identifiedCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card 
                    className={cn(
                        'cursor-pointer transition-all',
                        statusFilter === 'dismissed' && 'ring-2 ring-primary'
                    )}
                    onClick={() => setStatusFilter('dismissed')}
                >
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-900/30">
                                <EyeOff className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Dismissed</p>
                                <p className="text-2xl font-bold">{dismissedCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Face Grid */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Unknown Faces</CardTitle>
                            <CardDescription>
                                {formatDate(selectedDate)} - {unknownFaces.length} faces found
                            </CardDescription>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px]">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="identified">Identified</SelectItem>
                                <SelectItem value="dismissed">Dismissed</SelectItem>
                                <SelectItem value="all">All</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <Skeleton key={i} className="aspect-square rounded-lg" />
                            ))}
                        </div>
                    ) : unknownFaces.length === 0 ? (
                        <div className="text-center py-12">
                            <UserCheck className="h-16 w-16 mx-auto mb-4 text-green-500 opacity-50" />
                            <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
                            <p className="text-muted-foreground">
                                {statusFilter === 'pending' 
                                    ? 'No unknown faces pending review'
                                    : `No ${statusFilter} faces for this date`}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {unknownFaces.map((face, idx) => (
                                <UnknownFaceCard
                                    key={face.id || idx}
                                    face={face}
                                    onIdentify={handleIdentify}
                                    onDismiss={handleDismiss}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            <IdentifyDialog
                face={selectedFace}
                open={identifyOpen}
                onClose={() => setIdentifyOpen(false)}
                onConfirm={confirmIdentify}
                branchId={branchId}
            />

            <DismissDialog
                face={selectedFace}
                open={dismissOpen}
                onClose={() => setDismissOpen(false)}
                onConfirm={confirmDismiss}
            />
            </div>
        </DashboardLayout>
    );
};

export default UnknownFaceManagement;
