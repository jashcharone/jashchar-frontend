import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import api from '@/lib/api';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, Calendar, MapPin, Phone, Mail, BookOpen, Bus, Home, Download, Printer, QrCode, Barcode, FileText, UserCog, Shield, Files, Building, BedDouble, GraduationCap } from 'lucide-react';
import StudentProfileFeesTab from './StudentProfileFeesTab';

// Icon mapping
const ICON_MAP = {
  BookOpen, User, Users: User, Key: User, Bus, FileText, UserCog, Shield, Files, Building, BedDouble, GraduationCap, Phone, MapPin
};

const InfoRow = ({ label, value, className = "" }) => (
  <div className={`grid grid-cols-3 py-3 border-b border-primary/10 last:border-0 ${className}`}>
    <span className="font-medium text-muted-foreground col-span-1">{label}</span>
    <span className="col-span-2 text-foreground font-medium break-words">{value || <span className="text-muted-foreground italic">N/A</span>}</span>
  </div>
);

const SectionHeader = ({ title, icon }) => {
    const Icon = ICON_MAP[icon] || FileText;
    return (
        <h3 className="text-lg font-semibold mt-8 mb-4 pb-2 border-b-2 border-primary/20 flex items-center gap-3 text-primary">
            <div className="bg-primary/10 p-1.5 rounded-full">
                <Icon className="h-5 w-5" />
            </div>
            {title}
        </h3>
    );
};

const StudentProfile = () => {
  const { studentId } = useParams();
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formSections, setFormSections] = useState([]);
  const [allFields, setAllFields] = useState([]);
  const [customData, setCustomData] = useState({});

  // Determine the ID to fetch
  const targetId = studentId || user?.id;
  const branchId = user?.profile?.branch_id;

  useEffect(() => {
    if (!branchId || !selectedBranch?.id) return;

    const init = async () => {
        setLoading(true);
        try {
             // 1. Fetch Form Settings
             const settingsRes = await api.get('/form-settings', {
                 params: { branchId, module: 'student_admission' }
             });
             
             if(settingsRes.data?.success) {
                 setFormSections(settingsRes.data.sections || []);
                 setAllFields([...(settingsRes.data.systemFields || []), ...(settingsRes.data.customFields || [])]);
             }

             if (!targetId) return;

             // 2. Fetch Student Data
             const { data, error } = await supabase
                .from('student_profiles')
                .select(`
                    *,
                    class:classes!student_profiles_class_id_fkey(name),
                    section:sections!student_profiles_section_id_fkey(name),
                    category:student_categories(name),
                    transport:student_transport_details!student_profiles_transport_details_id_fkey(*),
                    hostel:student_hostel_details!student_profiles_hostel_details_id_fkey(*)
                `)
                .eq('id', targetId)
                .single();

             if (error) throw error;
             
             setStudent(data);

             // 3. Fetch Custom Data
             const { data: cData } = await supabase.from('student_custom_data').select('custom_data').eq('student_id', targetId).maybeSingle();
             if (cData?.custom_data) setCustomData(cData.custom_data);

        } catch (err) {
            console.error("Profile Load Error:", err);
        } finally {
            setLoading(false);
        }
    };
    init();
  }, [branchId, selectedBranch, targetId]);

  const getFieldValue = (field) => {
      // Handle System Fields
      if (field.is_system) {
          const val = student[field.field_name];
          
          switch(field.field_name) {
              case 'class': return student.class?.name;
              case 'section': return student.section?.name;
              case 'category': return student.category?.name;
              case 'admission_date': case 'dob': return val; 
              case 'student_photo': case 'father_photo': case 'mother_photo': case 'guardian_photo': return 'Photo'; // Handled in UI separately 
              default: return val; 
          }
      }
      // Handle Custom Fields
      return customData[field.field_key];
  };

  if (loading) return <DashboardLayout><div className="flex justify-center p-8 h-screen items-center"><Loader2 className="w-8 h-8 animate-spin" /></div></DashboardLayout>;
  if (!student) return <DashboardLayout><div className="p-8 text-center text-muted-foreground">Student not found</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar - Profile Summary */}
        <div className="w-full lg:w-1/4 space-y-6">
          <Card className="overflow-hidden border-t-4 border-t-primary shadow-md">
            <div className="bg-gradient-to-br from-primary/5 to-transparent p-6 flex flex-col items-center text-center border-b">
               <Avatar className="w-32 h-32 border-4 border-background shadow-xl mb-4">
                <AvatarImage src={student.photo_url} className="object-cover" />
                <AvatarFallback className="text-4xl bg-primary/20"><User className="font-bold text-primary" /></AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold text-primary">{student.full_name}</h2>
              <div className="text-sm text-muted-foreground mt-2 space-y-1 w-full">
                 <div className="flex justify-between border-b pb-1 border-dashed"><span>Adm No:</span> <span className="font-semibold text-foreground">{student.school_code}</span></div>
                 <div className="flex justify-between border-b pb-1 border-dashed pt-1"><span>Roll No:</span> <span className="font-semibold text-foreground">{student.roll_number}</span></div>
              </div>
            </div>
            <CardContent className="p-0">
              <div className="divide-y">
                <div className="flex justify-between p-3 text-sm px-6">
                  <span className="text-muted-foreground">Class</span>
                  <span className="font-medium text-primary bg-primary/10 px-2 py-0.5 rounded text-xs">{student.class?.name || 'N/A'} ({student.section?.name || 'N/A'})</span>
                </div>
                <div className="flex justify-between p-3 text-sm px-6">
                  <span className="text-muted-foreground">Gender</span>
                  <span className="font-medium">{student.gender}</span>
                </div>
                <div className="flex justify-between p-3 text-sm px-6">
                  <span className="text-muted-foreground">RTE</span>
                  <span className={`font-medium ${student.is_rte_student ? 'text-red-500' : 'text-foreground'}`}>{student.is_rte_student ? 'Yes' : 'No'}</span>
                </div>
                <div className="p-4 flex flex-col items-center gap-4 bg-muted/30">
                   {student.school_code && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground w-full justify-between">
                        <span>Barcode</span>
                        <Barcode className="h-8 w-24 opacity-50" />
                    </div>
                   )}
                   <div className="flex items-center gap-2 text-xs text-muted-foreground w-full justify-between">
                      <span>QR Code</span>
                      <QrCode className="h-10 w-10 opacity-50" />
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Content - Tabs */}
        <div className="w-full lg:w-3/4">
          <Tabs defaultValue="profile" className="w-full">
            <div className="flex justify-between items-center mb-4 overflow-x-auto pb-1">
              <TabsList className="h-auto p-1 bg-background border shadow-sm rounded-lg">
                <TabsTrigger value="profile" className="px-4 py-2">Profile</TabsTrigger>
                <TabsTrigger value="fees" className="px-4 py-2">Fees</TabsTrigger>
                <TabsTrigger value="exam" className="px-4 py-2">Exam</TabsTrigger>
                <TabsTrigger value="attendance" className="px-4 py-2">Attendance</TabsTrigger>
                <TabsTrigger value="documents" className="px-4 py-2">Documents</TabsTrigger>
                <TabsTrigger value="timeline" className="px-4 py-2">Timeline</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="profile" className="mt-0 space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
              <Card className="shadow-md border-t-2 border-t-primary/50">
                <CardContent className="p-8">
                  
                  {formSections.sort((a,b) => a.order - b.order).map(section => {
                      // Filter fields for this section
                      const fields = allFields.filter(f => f.section_key === section.key && f.is_enabled).sort((a,b) => a.sort_order - b.sort_order);
                      
                      const isTransport = section.key === 'transport';
                      const isHostel = section.key === 'hostel';
                      const isDocs = section.key === 'documents';

                      if (fields.length === 0 && !isTransport && !isHostel && !isDocs) return null;
                      
                      if (isTransport) {
                          if (!student.transport_details) return null; 
                          return (
                            <div key={section.key}>
                                <SectionHeader title={section.label} icon={section.icon} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
                                    <InfoRow label="Route" value={student.transport?.route_title} />
                                    <InfoRow label="Pickup Point" value={student.transport?.pickup_point_name} />
                                    <InfoRow label="Vehicle No" value={student.transport?.vehicle_number} />
                                    <InfoRow label="Driver" value={student.transport?.driver_name} />
                                    <InfoRow label="Contact" value={student.transport?.driver_contact} />
                                    <InfoRow label="Special Instructions" value={student.transport?.special_instructions} />
                                </div>
                            </div>
                          );
                      }

                      if (isHostel) {
                           if (!student.hostel_details) return null;
                           return (
                             <div key={section.key}>
                                <SectionHeader title={section.label} icon={section.icon} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
                                    <InfoRow label="Hostel" value={student.hostel?.hostel_name} />
                                    <InfoRow label="Room Type" value={student.hostel?.room_type} />
                                    <InfoRow label="Room No" value={student.hostel?.room_number} />
                                    <InfoRow label="Bed No" value={student.hostel?.bed_number} />
                                    <InfoRow label="Check-in" value={student.hostel?.check_in_date} />
                                    <InfoRow label="Guardian Contact" value={student.hostel?.guardian_contact} />
                                </div>
                             </div>
                           );
                      }

                      if (isDocs) {
                          // Simplified docs view
                          return null;
                      }

                      return (
                        <div key={section.key}>
                            <SectionHeader title={section.label} icon={section.icon} />
                            
                            {/* Special Layout for Parents Photos if in Parent Section */}
                            {section.key === 'parent_guardian_details' && (
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    {['father', 'mother', 'guardian'].map(type => {
                                        const url = student[`${type}_photo_url`];
                                        const name = student[`${type}_name`];
                                        if(!name) return null;
                                        return (
                                            <div key={type} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                                                <Avatar className="h-12 w-12"><AvatarImage src={url} /><AvatarFallback><User /></AvatarFallback></Avatar>
                                                <div><p className="text-xs font-semibold capitalize">{type}</p><p className="text-sm truncate max-w-[100px]">{name}</p></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-1">
                                {fields.map(field => {
                                    if(field.type === 'file' || field.field_name?.includes('photo')) return null; // Skip photos in list
                                    return <InfoRow key={field.id || field.key} label={field.field_label} value={getFieldValue(field)} />;
                                })}
                            </div>
                        </div>
                      );
                  })}

                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fees">
              <StudentProfileFeesTab studentId={targetId} />
            </TabsContent>

            <TabsContent value="exam">
              <Card>
                <CardContent className="p-12 flex flex-col items-center justify-center text-muted-foreground space-y-4">
                  <div className="p-4 bg-muted rounded-full"><BookOpen className="h-8 w-8 opacity-50" /></div>
                  <p>Exam results module integration pending.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance">
              <Card>
                <CardContent className="p-12 flex flex-col items-center justify-center text-muted-foreground space-y-4">
                  <div className="p-4 bg-muted rounded-full"><Calendar className="h-8 w-8 opacity-50" /></div>
                  <p>Attendance module integration pending.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                  <CardContent className="p-12 flex flex-col items-center justify-center text-muted-foreground space-y-4">
                      <div className="p-4 bg-muted rounded-full"><Files className="h-8 w-8 opacity-50" /></div>
                      <p>Document management module integration pending.</p>
                  </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline">
              <Card>
                  <CardContent className="p-12 flex flex-col items-center justify-center text-muted-foreground space-y-4">
                      <div className="p-4 bg-muted rounded-full"><FileText className="h-8 w-8 opacity-50" /></div>
                      <p>Timeline module integration pending.</p>
                  </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentProfile;
