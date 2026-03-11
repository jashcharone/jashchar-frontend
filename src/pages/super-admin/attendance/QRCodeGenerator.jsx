// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - QR CODE GENERATOR FOR ATTENDANCE
// Generate, print, and manage QR codes for students and staff
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { usePermissions } from '@/contexts/PermissionContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
    QrCode,
    Download,
    Printer,
    Users,
    GraduationCap,
    Briefcase,
    Search,
    CheckSquare,
    Square,
    RefreshCw,
    Eye,
    Settings,
    Sparkles,
    Loader2,
    FileDown,
    Grid3X3,
    List,
    AlertCircle,
    Check,
    X,
    Image as ImageIcon,
    School
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// QR CODE CARD COMPONENT (Single person QR display)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const QRCodeCard = ({ person, personType, branchName, showPhoto = true, size = 200 }) => {
    const [qrDataUrl, setQrDataUrl] = useState('');
    const canvasRef = useRef(null);
    
    useEffect(() => {
        generateQR();
    }, [person]);
    
    const generateQR = async () => {
        // QR data payload
        const qrPayload = JSON.stringify({
            t: personType.charAt(0), // 's' for student, 'e' for staff
            id: person.id,
            code: person.school_code || person.staff_id || person.roll_number,
            name: person.full_name?.substring(0, 20),
            ts: Date.now()
        });
        
        try {
            const dataUrl = await QRCode.toDataURL(qrPayload, {
                width: size,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'H'
            });
            setQrDataUrl(dataUrl);
        } catch (error) {
            console.error('QR Generation error:', error);
        }
    };
    
    const downloadQR = () => {
        const link = document.createElement('a');
        link.download = `QR_${person.school_code || person.id}.png`;
        link.href = qrDataUrl;
        link.click();
    };
    
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
            <div className="p-4 bg-gradient-to-r from-primary to-violet-600 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {personType === 'student' ? (
                            <GraduationCap className="w-5 h-5" />
                        ) : (
                            <Briefcase className="w-5 h-5" />
                        )}
                        <span className="font-semibold capitalize">{personType}</span>
                    </div>
                    <Badge variant="secondary" className="bg-white/20 text-white">
                        {person.school_code || person.staff_id || 'N/A'}
                    </Badge>
                </div>
            </div>
            
            <div className="p-4 flex flex-col items-center">
                {showPhoto && (
                    <Avatar className="w-16 h-16 mb-3 border-4 border-primary/20">
                        <AvatarImage src={person.photo_url} alt={person.full_name} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-violet-500 text-white text-xl">
                            {person.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                    </Avatar>
                )}
                
                <h3 className="font-bold text-lg text-center mb-1">{person.full_name}</h3>
                <p className="text-sm text-muted-foreground text-center mb-3">
                    {person.class_name ? `${person.class_name} - ${person.section_name}` : person.designation_name || person.department_name || '-'}
                </p>
                
                {qrDataUrl ? (
                    <div className="p-2 bg-white rounded-lg shadow-inner">
                        <img src={qrDataUrl} alt="QR Code" className="w-32 h-32" />
                    </div>
                ) : (
                    <div className="w-32 h-32 flex items-center justify-center bg-muted rounded-lg">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                )}
                
                <p className="text-xs text-muted-foreground mt-3">{branchName}</p>
                
                <Button 
                    onClick={downloadQR} 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 w-full"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                </Button>
            </div>
        </motion.div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// PRINT LAYOUT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const PrintableQRSheet = React.forwardRef(({ persons, personType, branchName, settings }, ref) => {
    const [qrCodes, setQrCodes] = useState({});
    
    useEffect(() => {
        generateAllQRCodes();
    }, [persons]);
    
    const generateAllQRCodes = async () => {
        const codes = {};
        for (const person of persons) {
            const qrPayload = JSON.stringify({
                t: personType.charAt(0),
                id: person.id,
                code: person.school_code || person.staff_id || person.roll_number,
                name: person.full_name?.substring(0, 20),
                ts: Date.now()
            });
            
            try {
                codes[person.id] = await QRCode.toDataURL(qrPayload, {
                    width: settings.qrSize,
                    margin: 1,
                    errorCorrectionLevel: 'H'
                });
            } catch (error) {
                console.error('QR error for', person.id, error);
            }
        }
        setQrCodes(codes);
    };
    
    return (
        <div ref={ref} className="print-container p-4 bg-white">
            <style>{`
                @media print {
                    .print-container { 
                        page-break-inside: avoid;
                    }
                    .qr-card {
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }
                }
            `}</style>
            
            <div className={`grid gap-4 ${
                settings.cardsPerRow === 2 ? 'grid-cols-2' :
                settings.cardsPerRow === 3 ? 'grid-cols-3' :
                settings.cardsPerRow === 4 ? 'grid-cols-4' :
                'grid-cols-3'
            }`}>
                {persons.map((person) => (
                    <div key={person.id} className="qr-card border rounded-lg p-3 text-center">
                        {settings.showPhoto && person.photo_url && (
                            <img 
                                src={person.photo_url} 
                                alt={person.full_name}
                                className="w-12 h-12 rounded-full mx-auto mb-2 object-cover"
                            />
                        )}
                        <h4 className="font-bold text-sm truncate">{person.full_name}</h4>
                        <p className="text-xs text-gray-500">
                            {person.school_code || person.staff_id}
                        </p>
                        {settings.showClass && person.class_name && (
                            <p className="text-xs text-gray-500">
                                {person.class_name} - {person.section_name}
                            </p>
                        )}
                        {qrCodes[person.id] && (
                            <img 
                                src={qrCodes[person.id]} 
                                alt="QR" 
                                className="mx-auto mt-2"
                                style={{ width: settings.qrSize, height: settings.qrSize }}
                            />
                        )}
                        {settings.showSchool && (
                            <p className="text-xs text-gray-400 mt-1">{branchName}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// MAIN QR CODE GENERATOR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const QRCodeGenerator = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const { canView, canAdd } = usePermissions();
    const printRef = useRef();
    
    const branchId = selectedBranch?.id || user?.profile?.branch_id;
    
    // State
    const [activeTab, setActiveTab] = useState('students');
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    
    // Filters
    const [selectedClass, setSelectedClass] = useState('all');
    const [selectedSection, setSelectedSection] = useState('all');
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    
    // Data
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [students, setStudents] = useState([]);
    const [staff, setStaff] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    
    // Print settings
    const [printSettings, setPrintSettings] = useState({
        qrSize: 80,
        cardsPerRow: 3,
        showPhoto: true,
        showClass: true,
        showSchool: true,
        includeLogo: false,
    });
    
    const [showPrintDialog, setShowPrintDialog] = useState(false);
    const [previewPerson, setPreviewPerson] = useState(null);
    
    // Permissions
    const hasViewPermission = canView('attendance.qr_generator') || canView('attendance') || canView('attendance.qr_attendance');
    const hasAddPermission = canAdd('attendance.qr_generator') || canAdd('attendance') || canAdd('attendance.qr_attendance');
    
    // Fetch classes
    useEffect(() => {
        if (branchId) {
            fetchClasses();
            fetchDepartments();
        }
    }, [branchId]);
    
    // Fetch data when filters change
    useEffect(() => {
        if (branchId) {
            if (activeTab === 'students') {
                fetchStudents();
            } else {
                fetchStaff();
            }
        }
    }, [branchId, activeTab, selectedClass, selectedSection, selectedDepartment]);
    
    const fetchClasses = async () => {
        const { data, error } = await supabase
            .from('classes')
            .select('id, name')
            .eq('branch_id', branchId)
            .order('name');
        if (!error) setClasses(data || []);
    };
    
    const fetchSections = async (classId) => {
        if (!classId || classId === 'all') {
            setSections([]);
            return;
        }
        const { data, error } = await supabase
            .from('class_sections')
            .select('id, name')
            .eq('class_id', classId)
            .order('name');
        if (!error) setSections(data || []);
    };
    
    const fetchDepartments = async () => {
        const { data, error } = await supabase
            .from('departments')
            .select('id, name')
            .eq('branch_id', branchId)
            .order('name');
        if (!error) setDepartments(data || []);
    };
    
    const fetchStudents = async () => {
        setLoading(true);
        let query = supabase
            .from('student_profiles')
            .select(`
                id, full_name, school_code, roll_number, photo_url,
                class:classes!student_profiles_class_id_fkey(id, name),
                section:sections!student_profiles_section_id_fkey(id, name)
            `)
            .eq('branch_id', branchId)
            .or('status.eq.active,status.is.null');
        
        if (selectedClass && selectedClass !== 'all') {
            query = query.eq('class_id', selectedClass);
        }
        if (selectedSection && selectedSection !== 'all') {
            query = query.eq('section_id', selectedSection);
        }
        
        const { data, error } = await query.order('full_name');
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching students', description: error.message });
        } else {
            const formattedData = data?.map(s => ({
                ...s,
                class_name: s.class?.name,
                section_name: s.section?.name
            })) || [];
            setStudents(formattedData);
        }
        setLoading(false);
    };
    
    const fetchStaff = async () => {
        setLoading(true);
        let query = supabase
            .from('employee_profiles')
            .select(`
                id, full_name, school_code, staff_id, photo_url,
                department:department_id(id, name),
                designation:designation_id(id, name)
            `)
            .eq('branch_id', branchId)
            .eq('is_active', true);
        
        if (selectedDepartment && selectedDepartment !== 'all') {
            query = query.eq('department_id', selectedDepartment);
        }
        
        const { data, error } = await query.order('full_name');
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching staff', description: error.message });
        } else {
            const formattedData = data?.map(s => ({
                ...s,
                department_name: s.department?.name,
                designation_name: s.designation?.name
            })) || [];
            setStaff(formattedData);
        }
        setLoading(false);
    };
    
    // Filter items based on search
    const filteredItems = activeTab === 'students'
        ? students.filter(s => 
            s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.school_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.roll_number?.toString().includes(searchTerm)
          )
        : staff.filter(s =>
            s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.school_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.staff_id?.toLowerCase().includes(searchTerm.toLowerCase())
          );
    
    // Selection handlers
    const toggleSelectAll = () => {
        if (selectedItems.length === filteredItems.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(filteredItems.map(item => item.id));
        }
    };
    
    const toggleSelect = (id) => {
        setSelectedItems(prev => 
            prev.includes(id) 
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };
    
    // Download all as ZIP
    const downloadAllAsZip = async () => {
        if (selectedItems.length === 0) {
            toast({ variant: 'destructive', title: 'No items selected' });
            return;
        }
        
        setGenerating(true);
        const zip = new JSZip();
        const items = filteredItems.filter(item => selectedItems.includes(item.id));
        
        for (const person of items) {
            const qrPayload = JSON.stringify({
                t: activeTab === 'students' ? 's' : 'e',
                id: person.id,
                code: person.school_code || person.staff_id || person.roll_number,
                name: person.full_name?.substring(0, 20),
                ts: Date.now()
            });
            
            try {
                const dataUrl = await QRCode.toDataURL(qrPayload, {
                    width: 400,
                    margin: 2,
                    errorCorrectionLevel: 'H'
                });
                
                // Convert data URL to blob
                const response = await fetch(dataUrl);
                const blob = await response.blob();
                const filename = `QR_${person.school_code || person.staff_id || person.id}.png`;
                zip.file(filename, blob);
            } catch (error) {
                console.error('Error generating QR for', person.id, error);
            }
        }
        
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `QR_Codes_${activeTab}_${new Date().toISOString().split('T')[0]}.zip`);
        
        toast({ title: 'Download Complete', description: `${items.length} QR codes downloaded` });
        setGenerating(false);
    };
    
    // Print handler
    const handlePrint = () => {
        if (selectedItems.length === 0) {
            toast({ variant: 'destructive', title: 'No items selected for printing' });
            return;
        }
        setShowPrintDialog(true);
    };
    
    const executePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>QR Codes - Print</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                        .grid { display: grid; gap: 16px; }
                        .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
                        .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
                        .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
                        .qr-card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; text-align: center; break-inside: avoid; }
                        .qr-card img { max-width: 100%; }
                        h4 { margin: 0 0 4px 0; font-size: 14px; }
                        p { margin: 0; font-size: 12px; color: #666; }
                        @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
                    </style>
                </head>
                <body>${printContent.innerHTML}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.onload = () => {
            printWindow.print();
            printWindow.close();
        };
        
        setShowPrintDialog(false);
    };
    
    const selectedPersons = filteredItems.filter(item => selectedItems.includes(item.id));
    
    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <QrCode className="h-8 w-8 text-primary" />
                        QR Code Generator
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Generate QR codes for student and staff attendance
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm">
                        <School className="w-3 h-3 mr-1" />
                        {selectedBranch?.name || 'All Branches'}
                    </Badge>
                </div>
            </div>
            
            {/* Permission Check */}
            {!hasViewPermission && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>You don't have permission to access this module.</AlertDescription>
                </Alert>
            )}
            
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <TabsList className="grid w-full md:w-auto grid-cols-2">
                        <TabsTrigger value="students" className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" />
                            Students ({students.length})
                        </TabsTrigger>
                        <TabsTrigger value="staff" className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            Staff ({staff.length})
                        </TabsTrigger>
                    </TabsList>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                        >
                            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handlePrint}
                            disabled={selectedItems.length === 0}
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Print ({selectedItems.length})
                        </Button>
                        <Button
                            onClick={downloadAllAsZip}
                            disabled={selectedItems.length === 0 || generating}
                        >
                            {generating ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <FileDown className="w-4 h-4 mr-2" />
                            )}
                            Download ZIP
                        </Button>
                    </div>
                </div>
                
                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            
                            {activeTab === 'students' ? (
                                <>
                                    <Select value={selectedClass} onValueChange={(v) => {
                                        setSelectedClass(v);
                                        setSelectedSection('all');
                                        fetchSections(v);
                                    }}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Classes</SelectItem>
                                            {classes.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select 
                                        value={selectedSection} 
                                        onValueChange={setSelectedSection}
                                        disabled={!selectedClass || selectedClass === 'all'}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Section" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Sections</SelectItem>
                                            {sections.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </>
                            ) : (
                                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments</SelectItem>
                                        {departments.map(d => (
                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            
                            {/* Select All */}
                            <Button 
                                variant="outline"
                                onClick={toggleSelectAll}
                                className="flex items-center gap-2"
                            >
                                {selectedItems.length === filteredItems.length && filteredItems.length > 0 ? (
                                    <CheckSquare className="w-4 h-4 text-primary" />
                                ) : (
                                    <Square className="w-4 h-4" />
                                )}
                                {selectedItems.length === filteredItems.length ? 'Deselect All' : 'Select All'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                
                {/* Content */}
                <TabsContent value="students" className="mt-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <Card>
                            <CardContent className="py-20 text-center">
                                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No students found</p>
                            </CardContent>
                        </Card>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredItems.map((student) => (
                                <motion.div
                                    key={student.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="relative"
                                >
                                    <div 
                                        className={`absolute top-2 left-2 z-10 cursor-pointer`}
                                        onClick={() => toggleSelect(student.id)}
                                    >
                                        {selectedItems.includes(student.id) ? (
                                            <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                                                <Check className="w-4 h-4" />
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-muted border-2 border-muted-foreground/30" />
                                        )}
                                    </div>
                                    <div onClick={() => setPreviewPerson(student)} className="cursor-pointer">
                                        <QRCodeCard 
                                            person={student}
                                            personType="student"
                                            branchName={selectedBranch?.name}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[600px]">
                                    <div className="divide-y">
                                        {filteredItems.map((student) => (
                                            <div 
                                                key={student.id}
                                                className={`flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer ${
                                                    selectedItems.includes(student.id) ? 'bg-primary/5' : ''
                                                }`}
                                                onClick={() => toggleSelect(student.id)}
                                            >
                                                <Checkbox 
                                                    checked={selectedItems.includes(student.id)}
                                                    onCheckedChange={() => toggleSelect(student.id)}
                                                />
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={student.photo_url} />
                                                    <AvatarFallback>{student.full_name?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <p className="font-medium">{student.full_name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {student.school_code || student.roll_number} • {student.class_name} - {student.section_name}
                                                    </p>
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPreviewPerson(student);
                                                    }}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
                
                <TabsContent value="staff" className="mt-0">
                    {/* Same structure as students, just for staff */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <Card>
                            <CardContent className="py-20 text-center">
                                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No staff found</p>
                            </CardContent>
                        </Card>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredItems.map((person) => (
                                <motion.div
                                    key={person.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="relative"
                                >
                                    <div 
                                        className={`absolute top-2 left-2 z-10 cursor-pointer`}
                                        onClick={() => toggleSelect(person.id)}
                                    >
                                        {selectedItems.includes(person.id) ? (
                                            <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                                                <Check className="w-4 h-4" />
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-muted border-2 border-muted-foreground/30" />
                                        )}
                                    </div>
                                    <div onClick={() => setPreviewPerson(person)} className="cursor-pointer">
                                        <QRCodeCard 
                                            person={person}
                                            personType="staff"
                                            branchName={selectedBranch?.name}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[600px]">
                                    <div className="divide-y">
                                        {filteredItems.map((person) => (
                                            <div 
                                                key={person.id}
                                                className={`flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer ${
                                                    selectedItems.includes(person.id) ? 'bg-primary/5' : ''
                                                }`}
                                                onClick={() => toggleSelect(person.id)}
                                            >
                                                <Checkbox 
                                                    checked={selectedItems.includes(person.id)}
                                                    onCheckedChange={() => toggleSelect(person.id)}
                                                />
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={person.photo_url} />
                                                    <AvatarFallback>{person.full_name?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <p className="font-medium">{person.full_name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {person.school_code || person.staff_id} • {person.department_name} - {person.designation_name}
                                                    </p>
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPreviewPerson(person);
                                                    }}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
            
            {/* Preview Dialog */}
            <Dialog open={!!previewPerson} onOpenChange={() => setPreviewPerson(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>QR Code Preview</DialogTitle>
                    </DialogHeader>
                    {previewPerson && (
                        <QRCodeCard 
                            person={previewPerson}
                            personType={activeTab === 'students' ? 'student' : 'staff'}
                            branchName={selectedBranch?.name}
                            size={250}
                        />
                    )}
                </DialogContent>
            </Dialog>
            
            {/* Print Settings Dialog */}
            <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle>Print QR Codes</DialogTitle>
                        <DialogDescription>
                            Configure print settings and preview
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="space-y-2">
                            <Label>QR Size (px)</Label>
                            <Input
                                type="number"
                                value={printSettings.qrSize}
                                onChange={(e) => setPrintSettings(prev => ({ ...prev, qrSize: parseInt(e.target.value) || 80 }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Cards Per Row</Label>
                            <Select 
                                value={printSettings.cardsPerRow.toString()} 
                                onValueChange={(v) => setPrintSettings(prev => ({ ...prev, cardsPerRow: parseInt(v) }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="2">2 per row</SelectItem>
                                    <SelectItem value="3">3 per row</SelectItem>
                                    <SelectItem value="4">4 per row</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-4 pt-6">
                            <div className="flex items-center gap-2">
                                <Checkbox 
                                    checked={printSettings.showPhoto}
                                    onCheckedChange={(v) => setPrintSettings(prev => ({ ...prev, showPhoto: v }))}
                                />
                                <Label>Show Photo</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox 
                                    checked={printSettings.showClass}
                                    onCheckedChange={(v) => setPrintSettings(prev => ({ ...prev, showClass: v }))}
                                />
                                <Label>Show Class/Dept</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox 
                                    checked={printSettings.showSchool}
                                    onCheckedChange={(v) => setPrintSettings(prev => ({ ...prev, showSchool: v }))}
                                />
                                <Label>Show School Name</Label>
                            </div>
                        </div>
                    </div>
                    
                    {/* Preview */}
                    <div className="border rounded-lg p-4 bg-white overflow-auto max-h-[400px]">
                        <PrintableQRSheet 
                            ref={printRef}
                            persons={selectedPersons}
                            personType={activeTab === 'students' ? 'student' : 'staff'}
                            branchName={selectedBranch?.name}
                            settings={printSettings}
                        />
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={executePrint}>
                            <Printer className="w-4 h-4 mr-2" />
                            Print {selectedPersons.length} Cards
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default QRCodeGenerator;
