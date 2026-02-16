/**
 * 🌟 STUDENT PANEL PROFILE PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Shows student's own profile information (for student role)
 * Uses dedicated API endpoint that bypasses admin permission requirements
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
    User, Phone, Mail, MapPin, Calendar, GraduationCap, 
    Building, Shield, CheckCircle2, Loader2, ArrowLeft, 
    CreditCard, Bus, Home, Users, Heart, FileText, Hash,
    Briefcase, Globe, Flag, IndianRupee
} from 'lucide-react';
import { format, parseISO, differenceInYears } from 'date-fns';

// Info Item Component
const InfoItem = ({ icon: Icon, label, value, className = "" }) => (
    <div className={`flex items-start gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors ${className}`}>
        <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
            <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-sm font-semibold mt-0.5 break-words">
                {value || 'Not Provided'}
            </p>
        </div>
    </div>
);

// Section Title Component
const SectionTitle = ({ icon: Icon, title, subtitle }) => (
    <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
            <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
            <h3 className="text-lg font-bold">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
    </div>
);

const StudentPanelProfile = () => {
    const navigate = useNavigate();
    const { user, school } = useAuth();
    const { toast } = useToast();
    
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                console.log('[StudentPanelProfile] Fetching own profile...');
                
                // Use dedicated student profile API (bypasses admin permission check)
                const response = await api.get('/students/my-profile');
                
                if (response.data?.success && response.data.student) {
                    setStudent(response.data.student);
                    console.log('[StudentPanelProfile] Profile loaded:', response.data.student.full_name);
                } else {
                    throw new Error('Invalid response from server');
                }
            } catch (error) {
                console.error('[StudentPanelProfile] Error:', error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: error.response?.data?.message || "Failed to load profile"
                });
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchProfile();
        }
    }, [user, toast]);

    const calculateAge = (dob) => {
        if (!dob) return 'N/A';
        try {
            const birthDate = typeof dob === 'string' ? parseISO(dob) : dob;
            return `${differenceInYears(new Date(), birthDate)} years`;
        } catch (e) {
            return 'N/A';
        }
    };

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                        <p className="mt-4 text-muted-foreground">Loading your profile...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!student) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <User className="h-16 w-16 text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold">Profile Not Found</h2>
                    <p className="text-muted-foreground mt-2">Unable to load your profile information.</p>
                    <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    const feeBalance = student.feesSummary?.balance || 0;
    const feePercentPaid = student.feesSummary?.total > 0 
        ? Math.round((student.feesSummary.paid / student.feesSummary.total) * 100)
        : 0;

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/Student/dashboard')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">My Profile</h1>
                        <p className="text-muted-foreground">View your student profile information</p>
                    </div>
                </div>

                {/* Profile Header Card */}
                <Card className="overflow-hidden">
                    {/* Banner */}
                    <div className="h-32 bg-gradient-to-r from-primary via-primary/80 to-primary/60 relative">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200')] bg-cover bg-center opacity-20" />
                    </div>

                    <CardContent className="relative -mt-16 pb-6">
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            {/* Avatar */}
                            <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                                <AvatarImage src={student.photo_url} />
                                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-3xl font-bold text-white">
                                    {getInitials(student.full_name)}
                                </AvatarFallback>
                            </Avatar>

                            {/* Basic Info */}
                            <div className="flex-1 pt-4 md:pt-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-2xl font-bold">{student.full_name}</h2>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <Badge variant="secondary">
                                                <GraduationCap className="h-3 w-3 mr-1" />
                                                {student.class?.name || 'N/A'} {student.section?.name && `(${student.section.name})`}
                                            </Badge>
                                            <Badge variant="outline">
                                                <Hash className="h-3 w-3 mr-1" />
                                                Roll: {student.roll_number || 'N/A'}
                                            </Badge>
                                            <Badge variant="outline" className="text-green-600 border-green-600">
                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                Active
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Admission No: <span className="font-semibold">{student.school_code || student.admission_number || 'N/A'}</span>
                                        </p>
                                    </div>
                                    <div className="text-right hidden md:block">
                                        <p className="text-xs text-muted-foreground">School</p>
                                        <p className="font-medium">{school?.name || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                    <IndianRupee className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">₹{student.feesSummary?.paid?.toLocaleString() || 0}</p>
                                    <p className="text-xs text-muted-foreground">Fees Paid</p>
                                </div>
                            </div>
                            <Progress value={feePercentPaid} className="mt-3 h-2" />
                            <p className="text-xs text-muted-foreground mt-1">{feePercentPaid}% of total fees</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                                    <CreditCard className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-orange-600">₹{feeBalance?.toLocaleString() || 0}</p>
                                    <p className="text-xs text-muted-foreground">Balance Due</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                                    <Users className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{student.siblings?.length || 0}</p>
                                    <p className="text-xs text-muted-foreground">Siblings in School</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="personal" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="personal">
                            <User className="h-4 w-4 mr-2 hidden sm:inline" />
                            Personal
                        </TabsTrigger>
                        <TabsTrigger value="parent">
                            <Users className="h-4 w-4 mr-2 hidden sm:inline" />
                            Parent
                        </TabsTrigger>
                        <TabsTrigger value="address">
                            <MapPin className="h-4 w-4 mr-2 hidden sm:inline" />
                            Address
                        </TabsTrigger>
                        <TabsTrigger value="other">
                            <FileText className="h-4 w-4 mr-2 hidden sm:inline" />
                            Other
                        </TabsTrigger>
                    </TabsList>

                    {/* Personal Info Tab */}
                    <TabsContent value="personal">
                        <Card>
                            <CardHeader>
                                <SectionTitle icon={User} title="Personal Information" subtitle="Your basic details" />
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <InfoItem icon={User} label="Full Name" value={student.full_name} />
                                    <InfoItem icon={Calendar} label="Date of Birth" 
                                        value={student.date_of_birth ? format(parseISO(student.date_of_birth), 'dd MMMM yyyy') : null} />
                                    <InfoItem icon={Calendar} label="Age" value={calculateAge(student.date_of_birth)} />
                                    <InfoItem icon={User} label="Gender" value={student.gender} />
                                    <InfoItem icon={Heart} label="Blood Group" value={student.blood_group} />
                                    <InfoItem icon={Globe} label="Nationality" value={student.nationality} />
                                    <InfoItem icon={Flag} label="Religion" value={student.religion} />
                                    <InfoItem icon={Hash} label="Aadhaar Number" value={student.aadhaar_number || student.aadhar_no} />
                                    <InfoItem icon={FileText} label="Category" value={student.category?.name} />
                                    <InfoItem icon={Phone} label="Phone" value={student.phone} />
                                    <InfoItem icon={Mail} label="Email" value={student.email} />
                                    <InfoItem icon={Globe} label="Mother Tongue" value={student.mother_tongue} />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Parent Info Tab */}
                    <TabsContent value="parent">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Father */}
                            <Card>
                                <CardHeader className="bg-blue-50 dark:bg-blue-950/20">
                                    <SectionTitle icon={User} title="Father's Details" />
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="space-y-3">
                                        <InfoItem icon={User} label="Name" value={student.father_name} />
                                        <InfoItem icon={Phone} label="Phone" value={student.father_phone} />
                                        <InfoItem icon={Briefcase} label="Occupation" value={student.father_occupation} />
                                        <InfoItem icon={Mail} label="Email" value={student.father_email} />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Mother */}
                            <Card>
                                <CardHeader className="bg-pink-50 dark:bg-pink-950/20">
                                    <SectionTitle icon={User} title="Mother's Details" />
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="space-y-3">
                                        <InfoItem icon={User} label="Name" value={student.mother_name} />
                                        <InfoItem icon={Phone} label="Phone" value={student.mother_phone} />
                                        <InfoItem icon={Briefcase} label="Occupation" value={student.mother_occupation} />
                                        <InfoItem icon={Mail} label="Email" value={student.mother_email} />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Guardian */}
                            {(student.guardian_name || student.guardian_phone) && (
                                <Card className="lg:col-span-2">
                                    <CardHeader className="bg-green-50 dark:bg-green-950/20">
                                        <SectionTitle icon={Shield} title="Guardian's Details" />
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                            <InfoItem icon={User} label="Name" value={student.guardian_name} />
                                            <InfoItem icon={Phone} label="Phone" value={student.guardian_phone} />
                                            <InfoItem icon={User} label="Relation" value={student.guardian_relation} />
                                            <InfoItem icon={Mail} label="Email" value={student.guardian_email} />
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    {/* Address Tab */}
                    <TabsContent value="address">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <SectionTitle icon={Home} title="Present Address" />
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <InfoItem icon={MapPin} label="Address" value={student.present_address || student.current_address} />
                                        <InfoItem icon={Building} label="City" value={student.present_city || student.city} />
                                        <InfoItem icon={MapPin} label="State" value={student.present_state || student.state} />
                                        <InfoItem icon={Hash} label="PIN Code" value={student.present_pincode || student.pincode} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <SectionTitle icon={Home} title="Permanent Address" />
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <InfoItem icon={MapPin} label="Address" value={student.permanent_address} />
                                        <InfoItem icon={Building} label="City" value={student.permanent_city} />
                                        <InfoItem icon={MapPin} label="State" value={student.permanent_state} />
                                        <InfoItem icon={Hash} label="PIN Code" value={student.permanent_pincode} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Other Tab */}
                    <TabsContent value="other">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Transport */}
                            {student.transport && (
                                <Card>
                                    <CardHeader className="bg-yellow-50 dark:bg-yellow-950/20">
                                        <SectionTitle icon={Bus} title="Transport Details" />
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="space-y-3">
                                            <InfoItem icon={Bus} label="Route" value={student.transport?.route?.route_title} />
                                            <InfoItem icon={MapPin} label="Pickup Point" value={student.transport?.pickup?.name} />
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Hostel */}
                            {student.hostel && (
                                <Card>
                                    <CardHeader className="bg-purple-50 dark:bg-purple-950/20">
                                        <SectionTitle icon={Building} title="Hostel Details" />
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="space-y-3">
                                            <InfoItem icon={Building} label="Hostel" value={student.hostel?.hostel?.name} />
                                            <InfoItem icon={Home} label="Room Number" value={student.hostel?.room_number} />
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Siblings */}
                            {student.siblings?.length > 0 && (
                                <Card className={student.transport || student.hostel ? '' : 'lg:col-span-2'}>
                                    <CardHeader>
                                        <SectionTitle icon={Users} title="Siblings" subtitle={`${student.siblings.length} sibling(s) in school`} />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {student.siblings.map(sibling => (
                                                <div key={sibling.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={sibling.photo_url} />
                                                        <AvatarFallback>{getInitials(sibling.full_name)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{sibling.full_name}</p>
                                                        <p className="text-xs text-muted-foreground">{sibling.class?.name || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Academic Info */}
                            <Card className={!(student.transport || student.hostel || student.siblings?.length) ? 'lg:col-span-2' : ''}>
                                <CardHeader>
                                    <SectionTitle icon={GraduationCap} title="Academic Information" />
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <InfoItem icon={GraduationCap} label="Class" value={student.class?.name} />
                                        <InfoItem icon={Users} label="Section" value={student.section?.name} />
                                        <InfoItem icon={Hash} label="Roll Number" value={student.roll_number} />
                                        <InfoItem icon={Calendar} label="Session" value={student.session?.name} />
                                        <InfoItem icon={Calendar} label="Admission Date" 
                                            value={student.admission_date ? format(parseISO(student.admission_date), 'dd MMM yyyy') : null} />
                                        <InfoItem icon={FileText} label="Previous School" value={student.previous_school} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
};

export default StudentPanelProfile;