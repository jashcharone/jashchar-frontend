import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2, Phone, MessageCircle, IndianRupee, Users, AlertCircle, TrendingUp } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const SearchDueFees = () => {
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const navigate = useNavigate();
    const { roleSlug } = useParams();
    const basePath = roleSlug || 'super-admin';
    
    const branchId = selectedBranch?.id || user?.profile?.branch_id || user?.user_metadata?.branch_id;

    const [feeGroups, setFeeGroups] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('all');
    
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    // Summary stats
    const [summary, setSummary] = useState({ totalStudents: 0, totalDue: 0, totalPaid: 0 });

    const fetchPrerequisites = useCallback(async () => {
        if (!branchId) return;
        const [groupsRes, classesRes, sectionsRes] = await Promise.all([
            supabase.from('fee_groups').select('id, name').eq('branch_id', branchId),
            supabase.from('classes').select('id, name').eq('branch_id', branchId).order('name'),
            supabase.from('sections').select('id, name').eq('branch_id', branchId),
        ]);
        setFeeGroups(groupsRes.data || []);
        setClasses(classesRes.data || []);
        setSections(sectionsRes.data || []);
    }, [branchId]);

    useEffect(() => {
        fetchPrerequisites();
    }, [fetchPrerequisites]);

    const handleGroupSelect = (groupId) => {
        setSelectedGroups(prev => 
            prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
        );
    };

    const handleSearch = async () => {
        if (selectedGroups.length === 0 || !selectedClass) {
            toast({ variant: 'destructive', title: 'Criteria Missing', description: 'Please select at least one Fees Group and a Class.' });
            return;
        }
        setLoading(true);
        setSearched(true);

        const { data, error } = await supabase.rpc('get_due_fees_students', {
            p_school_id: branchId,
            p_branch_id: branchId,
            p_class_id: selectedClass,
            p_section_id: selectedSection === 'all' ? null : selectedSection,
            p_fee_group_ids: selectedGroups
        });

        if (error) {
            toast({ variant: 'destructive', title: 'Error searching due fees', description: error.message });
            setStudents([]);
        } else {
            // Fetch additional student details (photo, phone)
            const studentIds = data?.map(s => s.student_id) || [];
            if (studentIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('student_profiles')
                    .select('id, photo_url, admission_number, father_phone, mother_phone, guardian_phone')
                    .in('id', studentIds);
                
                const profileMap = {};
                profiles?.forEach(p => { profileMap[p.id] = p; });
                
                const enrichedData = data.map(s => ({
                    ...s,
                    photo_url: profileMap[s.student_id]?.photo_url,
                    admission_number: profileMap[s.student_id]?.admission_number || s.school_code,
                    phone: profileMap[s.student_id]?.father_phone || profileMap[s.student_id]?.mother_phone || profileMap[s.student_id]?.guardian_phone
                }));
                
                setStudents(enrichedData);
                
                // Calculate summary
                const totalDue = enrichedData.reduce((sum, s) => sum + Number(s.balance || 0), 0);
                const totalPaid = enrichedData.reduce((sum, s) => sum + Number(s.total_paid || 0), 0);
                setSummary({ totalStudents: enrichedData.length, totalDue, totalPaid });
            } else {
                setStudents([]);
                setSummary({ totalStudents: 0, totalDue: 0, totalPaid: 0 });
            }
        }
        
        setLoading(false);
    };

    const handleCollectFees = (studentId) => {
        navigate(`/${basePath}/fees-collection/student-fees/${studentId}`);
    };

    const handleCall = (phone) => {
        if (phone) {
            window.open(`tel:${phone}`, '_self');
        } else {
            toast({ variant: 'destructive', title: 'No Phone', description: 'Phone number not available' });
        }
    };

    const handleWhatsApp = (phone, studentName, balance) => {
        if (phone) {
            const message = encodeURIComponent(
                `ನಮಸ್ಕಾರ,\n\n${studentName} ಅವರ fees ₹${balance.toFixed(2)} due ಇದೆ. ದಯವಿಟ್ಟು pay ಮಾಡಿ.\n\nThank you.`
            );
            window.open(`https://wa.me/91${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
        } else {
            toast({ variant: 'destructive', title: 'No Phone', description: 'Phone number not available for WhatsApp' });
        }
    };

    const getPaymentProgress = (paid, total) => {
        if (!total || total === 0) return 0;
        return Math.min(100, Math.round((paid / total) * 100));
    };

    const getStatusBadge = (paid, total) => {
        const percentage = getPaymentProgress(paid, total);
        if (percentage === 0) return <Badge variant="destructive">Unpaid</Badge>;
        if (percentage < 50) return <Badge className="bg-orange-500">Partial</Badge>;
        if (percentage < 100) return <Badge className="bg-yellow-500 text-black">Almost</Badge>;
        return <Badge className="bg-green-500">Paid</Badge>;
    };

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ST';
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <AlertCircle className="h-6 w-6 text-red-500" />
                        Search Due Fees
                    </h1>
                </div>

                {/* Search Criteria */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Select Criteria</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Fees Group *</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                                            {selectedGroups.length > 0 ? `${selectedGroups.length} selected` : "Select Groups"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-0">
                                        <ScrollArea className="h-48">
                                            <div className="p-4">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <Checkbox id="select-all" onCheckedChange={(checked) => setSelectedGroups(checked ? feeGroups.map(g => g.id) : [])} />
                                                    <label htmlFor="select-all" className="font-medium">Select All</label>
                                                </div>
                                                {feeGroups.map(group => (
                                                    <div key={group.id} className="flex items-center space-x-2 mt-1">
                                                        <Checkbox id={group.id} checked={selectedGroups.includes(group.id)} onCheckedChange={() => handleGroupSelect(group.id)} />
                                                        <label htmlFor={group.id}>{group.name}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Class *</label>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                                    <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Section</label>
                                <Select value={selectedSection} onValueChange={setSelectedSection}>
                                    <SelectTrigger><SelectValue placeholder="All Sections" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Sections</SelectItem>
                                        {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleSearch} disabled={loading} className="h-10">
                                {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Search className="mr-2 h-4 w-4" />}
                                Search
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Cards */}
                {searched && students.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Due</p>
                                        <p className="text-2xl font-bold text-red-500">₹{summary.totalDue.toLocaleString('en-IN')}</p>
                                    </div>
                                    <AlertCircle className="h-10 w-10 text-red-500/50" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Paid</p>
                                        <p className="text-2xl font-bold text-green-500">₹{summary.totalPaid.toLocaleString('en-IN')}</p>
                                    </div>
                                    <TrendingUp className="h-10 w-10 text-green-500/50" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Students with Dues</p>
                                        <p className="text-2xl font-bold text-blue-500">{summary.totalStudents}</p>
                                    </div>
                                    <Users className="h-10 w-10 text-blue-500/50" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Student List */}
                {searched && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Student List
                                {students.length > 0 && <span className="text-sm font-normal text-muted-foreground">({students.length} students)</span>}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center p-8">
                                    <Loader2 className="animate-spin mx-auto h-8 w-8" />
                                </div>
                            ) : students.length > 0 ? (
                                <div className="space-y-3">
                                    {/* Table Header */}
                                    <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-muted/50 rounded-lg text-sm font-medium text-muted-foreground">
                                        <div className="col-span-1">#</div>
                                        <div className="col-span-3">Student</div>
                                        <div className="col-span-2">Class</div>
                                        <div className="col-span-2">Phone</div>
                                        <div className="col-span-2">Fees Status</div>
                                        <div className="col-span-2 text-right">Action</div>
                                    </div>

                                    {/* Student Rows */}
                                    {students.map((student, index) => {
                                        const progress = getPaymentProgress(student.total_paid, student.total_amount);
                                        return (
                                            <div key={student.student_id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 bg-card border rounded-lg hover:bg-muted/30 transition-colors">
                                                {/* # */}
                                                <div className="hidden md:block col-span-1 text-muted-foreground font-medium">
                                                    {index + 1}
                                                </div>

                                                {/* Student Info */}
                                                <div className="col-span-1 md:col-span-3 flex items-center gap-3">
                                                    <Avatar className="h-12 w-12 border-2 border-primary/20">
                                                        <AvatarImage src={student.photo_url} alt={student.full_name} />
                                                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                                            {getInitials(student.full_name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-semibold text-sm uppercase">{student.full_name}</p>
                                                        <p className="text-xs text-muted-foreground">{student.admission_number || 'N/A'}</p>
                                                    </div>
                                                </div>

                                                {/* Class */}
                                                <div className="col-span-1 md:col-span-2">
                                                    <p className="text-sm font-medium">{student.class_name}</p>
                                                    <p className="text-xs text-muted-foreground">Section: {student.section_name || 'N/A'}</p>
                                                </div>

                                                {/* Phone */}
                                                <div className="col-span-1 md:col-span-2">
                                                    {student.phone ? (
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <Phone className="h-3 w-3 text-muted-foreground" />
                                                            <span>{student.phone}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">No phone</span>
                                                    )}
                                                </div>

                                                {/* Fees Status */}
                                                <div className="col-span-1 md:col-span-2">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            {getStatusBadge(student.total_paid, student.total_amount)}
                                                            <span className="text-xs font-semibold">{progress}%</span>
                                                        </div>
                                                        <Progress value={progress} className="h-2" />
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-green-500">₹{Number(student.total_paid).toLocaleString('en-IN')}</span>
                                                            <span className="text-muted-foreground">/</span>
                                                            <span>₹{Number(student.total_amount).toLocaleString('en-IN')}</span>
                                                        </div>
                                                        <p className="text-xs text-red-500 font-medium">
                                                            ⏱ Due: ₹{Number(student.balance).toLocaleString('en-IN')}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-2">
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-9 w-9 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                                                        onClick={() => handleCall(student.phone)}
                                                        title="Call"
                                                    >
                                                        <Phone className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-9 w-9 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                                        onClick={() => handleWhatsApp(student.phone, student.full_name, student.balance)}
                                                        title="WhatsApp"
                                                    >
                                                        <MessageCircle className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="bg-orange-500 hover:bg-orange-600 text-white"
                                                        onClick={() => handleCollectFees(student.student_id)}
                                                    >
                                                        <IndianRupee className="h-4 w-4 mr-1" />
                                                        Collect
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                                    <p className="text-muted-foreground">No students with due fees found for the selected criteria.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default SearchDueFees;
