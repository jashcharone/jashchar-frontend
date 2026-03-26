// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - RFID/NFC CARD MANAGEMENT
// Issue, activate, deactivate, and manage attendance cards
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import { formatDate } from '@/utils/dateUtils';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { usePermissions } from '@/contexts/PermissionContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard,
    Plus,
    Search,
    RefreshCw,
    Trash2,
    Edit,
    Eye,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2,
    Users,
    User,
    GraduationCap,
    Briefcase,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Calendar,
    Clock,
    Download,
    Upload,
    Printer,
    Save,
    X,
    Ban,
    History,
    Zap,
    QrCode,
    NfcIcon
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// CARD STATUS BADGES
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const CardStatusBadge = ({ status }) => {
    const statusConfig = {
        active: { label: 'Active', color: 'bg-green-500', icon: ShieldCheck },
        inactive: { label: 'Inactive', color: 'bg-gray-500', icon: Shield },
        lost: { label: 'Lost', color: 'bg-red-500', icon: ShieldAlert },
        damaged: { label: 'Damaged', color: 'bg-orange-500', icon: AlertTriangle },
        expired: { label: 'Expired', color: 'bg-yellow-500', icon: Clock },
        blocked: { label: 'Blocked', color: 'bg-purple-500', icon: Ban },
    };
    
    const config = statusConfig[status] || statusConfig.inactive;
    const Icon = config.icon;
    
    return (
        <Badge className={`${config.color} text-white flex items-center gap-1`}>
            <Icon className="w-3 h-3" />
            {config.label}
        </Badge>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// CARD TYPE BADGES
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const CardTypeBadge = ({ type }) => {
    const typeConfig = {
        rfid: { label: 'RFID', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
        nfc: { label: 'NFC', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
        mifare: { label: 'MIFARE', color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
        hid: { label: 'HID', color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
        smartcard: { label: 'Smart Card', color: 'text-cyan-500', bg: 'bg-cyan-100 dark:bg-cyan-900/30' },
    };
    
    const config = typeConfig[type] || { label: type, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800' };
    
    return (
        <Badge variant="outline" className={`${config.color} ${config.bg}`}>
            {config.label}
        </Badge>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// ISSUE CARD DIALOG
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const IssueCardDialog = ({ open, onClose, branchId, organizationId, onSaved }) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [searchType, setSearchType] = useState('student');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({
        card_type: 'rfid',
        card_number: '',
        card_uid: '',
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: '',
    });
    
    useEffect(() => {
        if (!open) {
            setSearchTerm('');
            setSearchResults([]);
            setSelectedUser(null);
            setFormData({
                card_type: 'rfid',
                card_number: '',
                card_uid: '',
                valid_from: new Date().toISOString().split('T')[0],
                valid_until: '',
            });
        }
    }, [open]);
    
    const searchUsers = async () => {
        if (!searchTerm || searchTerm.length < 2) return;
        
        setLoading(true);
        // Use correct table names: student_profiles (with full_name), employee_profiles (not staff_profiles)
        const table = searchType === 'student' ? 'student_profiles' : 'employee_profiles';
        
        let query;
        if (searchType === 'student') {
            query = supabase
                .from(table)
                .select('id, full_name, enrollment_id, class_id, section_id, photo_url')
                .eq('branch_id', branchId)
                .or(`full_name.ilike.%${searchTerm}%,enrollment_id.ilike.%${searchTerm}%`)
                .limit(20);
        } else {
            query = supabase
                .from(table)
                .select('id, full_name, phone, designation_id, department_id, photo_url')
                .eq('branch_id', branchId)
                .or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
                .limit(20);
        }
        
        const { data, error } = await query;
        
        if (error) {
            toast({ variant: 'destructive', title: 'Search failed', description: error.message });
        } else {
            setSearchResults(data || []);
        }
        
        setLoading(false);
    };
    
    const handleIssueCard = async () => {
        if (!selectedUser || !formData.card_number) {
            toast({ variant: 'destructive', title: 'Please select a user and enter card number' });
            return;
        }
        
        setLoading(true);
        
        const payload = {
            branch_id: branchId,
            organization_id: organizationId,
            user_type: searchType,
            user_id: selectedUser.id,
            card_type: formData.card_type,
            card_number: formData.card_number,
            card_uid: formData.card_uid || null,
            status: 'active',
            valid_from: formData.valid_from,
            valid_until: formData.valid_until || null,
        };
        
        try {
            const { error } = await supabase
                .from('attendance_cards')
                .insert(payload);
            
            if (error) throw error;
            
            toast({ title: 'Card issued successfully' });
            onSaved();
            onClose();
        } catch (error) {
            console.error('Issue error:', error);
            toast({ variant: 'destructive', title: 'Error issuing card', description: error.message });
        }
        
        setLoading(false);
    };
    
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        Issue New Card
                    </DialogTitle>
                    <DialogDescription>
                        Search for a student or staff member and issue an attendance card
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                    {/* Search Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Tabs value={searchType} onValueChange={setSearchType} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="student" className="flex items-center gap-2">
                                        <GraduationCap className="w-4 h-4" />
                                        Student
                                    </TabsTrigger>
                                    <TabsTrigger value="staff" className="flex items-center gap-2">
                                        <Briefcase className="w-4 h-4" />
                                        Staff
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                        
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Input
                                    placeholder={`Search ${searchType} by name or ID...`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                                    className="pl-10"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                            <Button onClick={searchUsers} disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                            </Button>
                        </div>
                        
                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <ScrollArea className="h-48 border rounded-lg">
                                <div className="p-2 space-y-2">
                                    {searchResults.map((user) => (
                                        <div
                                            key={user.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                                selectedUser?.id === user.id 
                                                    ? 'bg-primary/10 border-primary border' 
                                                    : 'hover:bg-muted border border-transparent'
                                            }`}
                                            onClick={() => setSelectedUser(user)}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                {searchType === 'student' 
                                                    ? <GraduationCap className="w-5 h-5 text-primary" />
                                                    : <Briefcase className="w-5 h-5 text-primary" />
                                                }
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">
                                                    {user.full_name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {searchType === 'student' ? user.enrollment_id : user.staff_id}
                                                    {user.class_name && ` • ${user.class_name}`}
                                                    {user.department && ` • ${user.department}`}
                                                </p>
                                            </div>
                                            {selectedUser?.id === user.id && (
                                                <CheckCircle2 className="w-5 h-5 text-primary" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                    
                    {/* Selected User */}
                    {selectedUser && (
                        <Alert className="border-primary/50 bg-primary/5">
                            <User className="w-4 h-4" />
                            <AlertDescription className="flex items-center justify-between">
                                <span>
                                    Selected: <strong>{selectedUser.full_name}</strong>
                                    {' '}({searchType === 'student' ? selectedUser.enrollment_id : selectedUser.staff_id})
                                </span>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}
                    
                    {/* Card Details */}
                    <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Card Details
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label>Card Type *</Label>
                                <Select 
                                    value={formData.card_type} 
                                    onValueChange={(v) => setFormData(prev => ({ ...prev, card_type: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="rfid">RFID Card</SelectItem>
                                        <SelectItem value="nfc">NFC Tag</SelectItem>
                                        <SelectItem value="mifare">MIFARE Card</SelectItem>
                                        <SelectItem value="hid">HID Proximity</SelectItem>
                                        <SelectItem value="smartcard">Smart Card</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Card Number *</Label>
                                <Input
                                    value={formData.card_number}
                                    onChange={(e) => setFormData(prev => ({ ...prev, card_number: e.target.value }))}
                                    placeholder="Enter card number"
                                />
                            </div>
                            <div>
                                <Label>Card UID (Hex)</Label>
                                <Input
                                    value={formData.card_uid}
                                    onChange={(e) => setFormData(prev => ({ ...prev, card_uid: e.target.value }))}
                                    placeholder="Auto-read or enter manually"
                                />
                            </div>
                            <div>
                                <Label>Valid From</Label>
                                <Input
                                    type="date"
                                    value={formData.valid_from}
                                    onChange={(e) => setFormData(prev => ({ ...prev, valid_from: e.target.value }))}
                                />
                            </div>
                            <div className="col-span-2">
                                <Label>Valid Until (Optional)</Label>
                                <Input
                                    type="date"
                                    value={formData.valid_until}
                                    onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleIssueCard} disabled={loading || !selectedUser || !formData.card_number}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        <CreditCard className="w-4 h-4 mr-2" />
                        Issue Card
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// MAIN CARD MANAGEMENT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const CardManagement = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const { canView, canAdd, canEdit, canDelete } = usePermissions();
    
    const branchId = selectedBranch?.id || user?.profile?.branch_id;
    
    // State
    const [loading, setLoading] = useState(true);
    const [cards, setCards] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterUserType, setFilterUserType] = useState('all');
    const [selectedCards, setSelectedCards] = useState([]);
    
    // Dialog state
    const [issueDialogOpen, setIssueDialogOpen] = useState(false);
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
    const [selectedCardHistory, setSelectedCardHistory] = useState(null);
    
    // Permissions
    const hasViewPermission = canView('attendance.card_management') || canView('attendance');
    const hasAddPermission = canAdd('attendance.card_management') || canAdd('attendance');
    const hasEditPermission = canEdit('attendance.card_management') || canEdit('attendance');
    const hasDeletePermission = canDelete('attendance.card_management') || canDelete('attendance');
    
    // Fetch cards
    useEffect(() => {
        if (branchId) {
            fetchCards();
        }
    }, [branchId]);
    
    const fetchCards = async () => {
        setLoading(true);
        
        // Fetch cards - no FK joins, will fetch user details separately
        const { data, error } = await supabase
            .from('attendance_cards')
            .select('*')
            .eq('branch_id', branchId)
            .order('created_at', { ascending: false });
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching cards', description: error.message });
        } else {
            // Fetch user details for each card
            const processedCards = await Promise.all((data || []).map(async (card) => {
                let userName = 'Unknown';
                let userCode = '';
                let userDetail = '';
                
                if (card.user_id) {
                    if (card.user_type === 'student') {
                        const { data: student } = await supabase
                            .from('student_profiles')
                            .select('full_name, enrollment_id')
                            .eq('id', card.user_id)
                            .single();
                        if (student) {
                            userName = student.full_name;
                            userCode = student.enrollment_id || '';
                        }
                    } else {
                        const { data: staff } = await supabase
                            .from('employee_profiles')
                            .select('full_name, phone')
                            .eq('id', card.user_id)
                            .single();
                        if (staff) {
                            userName = staff.full_name;
                            userCode = staff.phone || '';
                        }
                    }
                }
                
                return {
                    ...card,
                    user_name: userName,
                    user_code: userCode,
                    user_detail: userDetail,
                };
            }));
            setCards(processedCards);
        }
        
        setLoading(false);
    };
    
    // Filter cards
    const filteredCards = cards.filter(card => {
        const matchesSearch = !searchTerm || 
            card.card_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            card.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            card.user_code?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesType = filterType === 'all' || card.card_type === filterType;
        const matchesStatus = filterStatus === 'all' || card.status === filterStatus;
        const matchesUserType = filterUserType === 'all' || card.user_type === filterUserType;
        
        return matchesSearch && matchesType && matchesStatus && matchesUserType;
    });
    
    // Stats
    const stats = {
        total: cards.length,
        active: cards.filter(c => c.status === 'active').length,
        inactive: cards.filter(c => c.status === 'inactive').length,
        lost: cards.filter(c => c.status === 'lost').length,
        students: cards.filter(c => c.user_type === 'student').length,
        staff: cards.filter(c => c.user_type === 'staff').length,
    };
    
    // Handlers
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedCards(filteredCards.map(c => c.id));
        } else {
            setSelectedCards([]);
        }
    };
    
    const handleSelectCard = (cardId, checked) => {
        if (checked) {
            setSelectedCards(prev => [...prev, cardId]);
        } else {
            setSelectedCards(prev => prev.filter(id => id !== cardId));
        }
    };
    
    const handleUpdateStatus = async (cardId, newStatus) => {
        const { error } = await supabase
            .from('attendance_cards')
            .update({ 
                status: newStatus,
                deactivated_at: newStatus !== 'active' ? new Date().toISOString() : null,
            })
            .eq('id', cardId);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error updating status', description: error.message });
        } else {
            toast({ title: `Card status updated to ${newStatus}` });
            fetchCards();
        }
    };
    
    const handleBulkDeactivate = async () => {
        if (selectedCards.length === 0) return;
        
        const { error } = await supabase
            .from('attendance_cards')
            .update({ 
                status: 'inactive',
                deactivated_at: new Date().toISOString(),
            })
            .in('id', selectedCards);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } else {
            toast({ title: `${selectedCards.length} cards deactivated` });
            setSelectedCards([]);
            fetchCards();
        }
    };
    
    const handleViewHistory = (card) => {
        setSelectedCardHistory(card);
        setHistoryDialogOpen(true);
    };
    
    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <CreditCard className="h-8 w-8 text-primary" />
                        Card Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Issue and manage RFID/NFC attendance cards
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={fetchCards}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    {hasAddPermission && (
                        <Button onClick={() => setIssueDialogOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Issue Card
                        </Button>
                    )}
                </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <CreditCard className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-xs text-muted-foreground">Total</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.active}</p>
                                <p className="text-xs text-muted-foreground">Active</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gray-500/10">
                                <XCircle className="h-5 w-5 text-gray-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.inactive}</p>
                                <p className="text-xs text-muted-foreground">Inactive</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500/10">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.lost}</p>
                                <p className="text-xs text-muted-foreground">Lost</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <GraduationCap className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.students}</p>
                                <p className="text-xs text-muted-foreground">Students</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/10">
                                <Briefcase className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.staff}</p>
                                <p className="text-xs text-muted-foreground">Staff</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex-1 min-w-[200px] relative">
                            <Input
                                placeholder="Search cards..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Card Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="rfid">RFID</SelectItem>
                                <SelectItem value="nfc">NFC</SelectItem>
                                <SelectItem value="mifare">MIFARE</SelectItem>
                                <SelectItem value="hid">HID</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="lost">Lost</SelectItem>
                                <SelectItem value="damaged">Damaged</SelectItem>
                                <SelectItem value="blocked">Blocked</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filterUserType} onValueChange={setFilterUserType}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="User Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Users</SelectItem>
                                <SelectItem value="student">Students</SelectItem>
                                <SelectItem value="staff">Staff</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        {selectedCards.length > 0 && (
                            <div className="flex items-center gap-2 ml-auto">
                                <Badge variant="secondary">{selectedCards.length} selected</Badge>
                                <Button variant="destructive" size="sm" onClick={handleBulkDeactivate}>
                                    <Ban className="w-4 h-4 mr-2" />
                                    Deactivate
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
            
            {/* Cards Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : filteredCards.length === 0 ? (
                        <div className="py-20 text-center">
                            <CreditCard className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-xl font-semibold mb-2">No Cards Found</h3>
                            <p className="text-muted-foreground mb-4">
                                {cards.length === 0 
                                    ? "No attendance cards have been issued yet."
                                    : "No cards match your search criteria."}
                            </p>
                            {hasAddPermission && cards.length === 0 && (
                                <Button onClick={() => setIssueDialogOpen(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Issue First Card
                                </Button>
                            )}
                        </div>
                    ) : (
                        <ScrollArea className="h-[500px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">
                                            <Checkbox 
                                                checked={selectedCards.length === filteredCards.length && filteredCards.length > 0}
                                                onCheckedChange={handleSelectAll}
                                            />
                                        </TableHead>
                                        <TableHead>Card Number</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Valid Until</TableHead>
                                        <TableHead>Last Used</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <AnimatePresence>
                                        {filteredCards.map((card) => (
                                            <motion.tr
                                                key={card.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="hover:bg-muted/50"
                                            >
                                                <TableCell>
                                                    <Checkbox 
                                                        checked={selectedCards.includes(card.id)}
                                                        onCheckedChange={(checked) => handleSelectCard(card.id, checked)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-mono font-medium">{card.card_number}</p>
                                                        {card.card_uid && (
                                                            <p className="text-xs text-muted-foreground font-mono">
                                                                UID: {card.card_uid}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <CardTypeBadge type={card.card_type} />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {card.user_type === 'student' 
                                                            ? <GraduationCap className="w-4 h-4 text-blue-500" />
                                                            : <Briefcase className="w-4 h-4 text-amber-500" />
                                                        }
                                                        <div>
                                                            <p className="font-medium">{card.user_name || 'Unknown'}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {card.user_code} {card.user_detail && `• ${card.user_detail}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <CardStatusBadge status={card.status} />
                                                </TableCell>
                                                <TableCell>
                                                    {card.valid_until 
                                                        ? formatDate(card.valid_until)
                                                        : <span className="text-muted-foreground">No expiry</span>
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    {card.last_used_at 
                                                        ? formatDate(card.last_used_at)
                                                        : <span className="text-muted-foreground">Never</span>
                                                    }
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm"
                                                            onClick={() => handleViewHistory(card)}
                                                        >
                                                            <History className="w-4 h-4" />
                                                        </Button>
                                                        {card.status === 'active' ? (
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm"
                                                                onClick={() => handleUpdateStatus(card.id, 'inactive')}
                                                            >
                                                                <Ban className="w-4 h-4 text-destructive" />
                                                            </Button>
                                                        ) : (
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm"
                                                                onClick={() => handleUpdateStatus(card.id, 'active')}
                                                            >
                                                                <Zap className="w-4 h-4 text-green-500" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
            
            {/* Issue Card Dialog */}
            <IssueCardDialog
                open={issueDialogOpen}
                onClose={() => setIssueDialogOpen(false)}
                branchId={branchId}
                organizationId={organizationId}
                onSaved={fetchCards}
            />
            
            {/* History Dialog */}
            <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <History className="w-5 h-5 text-primary" />
                            Card History
                        </DialogTitle>
                        <DialogDescription>
                            Activity history for card {selectedCardHistory?.card_number}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <ScrollArea className="h-[300px]">
                            <div className="space-y-4">
                                {/* Card history entries would be loaded here */}
                                <div className="text-center text-muted-foreground py-8">
                                    <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>Card history tracking coming soon</p>
                                </div>
                            </div>
                        </ScrollArea>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setHistoryDialogOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default CardManagement;
