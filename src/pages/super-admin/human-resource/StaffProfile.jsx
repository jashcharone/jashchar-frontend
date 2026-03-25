import React, { useState, useEffect } from 'react';
import { formatDate } from '@/utils/dateUtils';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import DashboardLayout from '@/components/DashboardLayout';
import { useBranch } from '@/contexts/BranchContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { staffApi } from '@/lib/api/staffApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, User, Mail, Phone, MapPin, Briefcase, Calendar, FileText, Star, Edit, 
  Banknote, Clock, FileCheck, Activity, Facebook, Twitter, Linkedin, Instagram, QrCode,
  Download, Ban
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ROUTES } from '@/registry/routeRegistry';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/components/ui/use-toast';

const StaffProfile = () => {
  const { employeeId } = useParams();
  const { selectedBranch } = useBranch();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [attendance, setAttendance] = useState([]);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [disableType, setDisableType] = useState('date_set'); // 'date_set' | 'permanent'
  const [disableDate, setDisableDate] = useState('');
  const [disableReason, setDisableReason] = useState('');
  const [disabling, setDisabling] = useState(false);

  const handleDisableSubmit = async () => {
      if (disableType === 'date_set' && !disableDate) {
          toast({ variant: 'destructive', title: 'Date Required', description: 'Please select a date for disabling.' });
          return;
      }
      if (!disableReason) {
          toast({ variant: 'destructive', title: 'Reason Required', description: 'Please provide a reason.' });
          return;
      }

      setDisabling(true);
      try {
          await staffApi.disableStaff(employeeId, {
              type: disableType,
              date: disableType === 'date_set' ? disableDate : null,
              reason: disableReason
          });
          toast({ title: 'Success', description: 'Staff status updated successfully.' });
          setDisableDialogOpen(false);
          window.location.reload(); 
      } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: error.response?.data?.message || 'Failed to update status.' });
      } finally {
          setDisabling(false);
      }
  };

  const downloadImage = async (imgUrl, name) => {
      try {
        // Use backend proxy to bypass CSP
        const proxyUrl = `/api/staff/proxy-image?url=${encodeURIComponent(imgUrl)}`;
        
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('Download failed');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Download Failed', description: 'Could not download image.' });
      }
  };

  useEffect(() => {
    const fetchStaff = async () => {
      if (!selectedBranch) return;
      try {
        // ✅ FIX: Specify exact FK relationship to avoid ambiguous FK error
        // Fetch Profile
        const { data, error } = await supabase
          .from('employee_profiles')
          .select(`
            *,
            role:roles(name),
            designation:designations(name),
            department:departments!employee_profiles_department_id_fkey(name)
          `)
          .eq('id', employeeId)
          .eq('branch_id', selectedBranch.id) // Enforce branch check
          .single();

        if (error) throw error;
        setStaff(data);

        // Fetch related data
        const [docsRes, reviewsRes, payrollsRes, leavesRes, attendanceRes] = await Promise.all([
             supabase.from('employee_documents').select('*').eq('employee_id', employeeId).eq('branch_id', selectedBranch.id),
             supabase.from('employee_performance').select('*').eq('employee_id', employeeId).eq('branch_id', selectedBranch.id).order('review_date', { ascending: false }),
             supabase.from('staff_payroll').select('*').eq('staff_id', employeeId).eq('branch_id', selectedBranch.id).order('year', { ascending: false }).order('month', { ascending: false }),
             supabase.from('leave_requests').select('*').eq('staff_id', employeeId).eq('branch_id', selectedBranch.id).order('from_date', { ascending: false }),
             supabase.from('staff_attendance').select('*').eq('staff_id', employeeId).eq('branch_id', selectedBranch.id).order('attendance_date', { ascending: false })
        ]);
        setDocuments(docsRes.data || []);
        setReviews(reviewsRes.data || []);
        setPayrolls(payrollsRes.data || []);
        setLeaves(leavesRes.data || []);
        setAttendance(attendanceRes.data || []);

      } catch (error) {
        console.error('Error fetching staff:', error);
        setStaff(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [employeeId, selectedBranch]);

  if (loading) return <DashboardLayout><div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div></DashboardLayout>;
  if (!staff) return <DashboardLayout><div className="p-8">Staff member not found</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 bg-muted/20 min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* LEFT SIDEBAR - PROFILE CARD */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="overflow-hidden border-none shadow-lg">
              <div className="h-36 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                <div className="absolute -bottom-14 left-1/2 transform -translate-x-1/2">
                  <Avatar className="w-28 h-28 border-4 border-background shadow-md">
                    <AvatarImage src={staff.photo_url} className="object-cover" />
                    <AvatarFallback className="text-3xl bg-primary/10 text-primary">{staff.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <CardContent className="pt-16 pb-6 px-4 text-center">
                <h2 className="text-2xl font-bold text-foreground">{staff.full_name}</h2>
                <p className="text-sm text-primary font-mono font-semibold mb-4">{staff.staff_id}</p>
                
                <div className="space-y-3 text-sm text-left mt-6 bg-muted/10 p-4 rounded-lg border">
                    <div className="flex justify-between py-2 border-b border-dashed">
                        <span className="text-muted-foreground">Employee ID</span>
                        <span className="font-medium font-mono text-primary">{staff.staff_id || '-'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-dashed">
                        <span className="text-muted-foreground">Role</span>
                        <span className="font-medium capitalize">{staff.role?.name?.replace('_', ' ') || '-'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-dashed">
                        <span className="text-muted-foreground">Designation</span>
                        <span className="font-medium">{staff.designation?.name || '-'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-dashed">
                        <span className="text-muted-foreground">Department</span>
                        <span className="font-medium">{staff.department?.name || '-'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-dashed">
                        <span className="text-muted-foreground">EPF No</span>
                        <span className="font-medium">{staff.epf_no || '-'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-dashed">
                        <span className="text-muted-foreground">Basic Salary</span>
                        <span className="font-medium">₹{staff.basic_salary || '-'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-dashed">
                        <span className="text-muted-foreground">Contract Type</span>
                        <span className="font-medium">{staff.employment_status || '-'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-dashed">
                        <span className="text-muted-foreground">Work Shift</span>
                        <span className="font-medium">{staff.shift_id || '-'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-dashed">
                        <span className="text-muted-foreground">Date Of Joining</span>
                        <span className="font-medium">{staff.date_of_joining || '-'}</span>
                    </div>
                </div>

                {/* Barcode */}
                <div className="mt-6 pt-4 border-t flex flex-col items-center gap-2">
                   <div className="flex justify-between w-full items-center px-2">
                       <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Barcode</p>
                       <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => downloadImage(`https://bwipjs-api.metafloor.com/?bcid=code128&text=${staff.staff_id}&scale=2&height=8&incltext=true`, `barcode-${staff.staff_id}.png`)}>
                           <Download className="w-3 h-3" />
                       </Button>
                   </div>
                   <div className="bg-white dark:bg-gray-100 p-2 rounded border">
                      {staff.staff_id ? (
                          <img 
                            src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${staff.staff_id}&scale=2&height=8&incltext=true`} 
                            alt="Barcode" 
                            className="max-w-full h-auto"
                          />
                      ) : <span className="text-xs">No ID</span>}
                   </div>
                </div>

                {/* QR Code */}
                <div className="mt-4 flex flex-col items-center gap-2">
                   <div className="flex justify-between w-full items-center px-2">
                       <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">QR Code</p>
                       <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                           const qrData = `Name: ${staff.full_name}\nID: ${staff.staff_id}\nRole: ${staff.role?.name}\nPhone: ${staff.phone}`;
                           downloadImage(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`, `qr-${staff.staff_id}.png`);
                       }}>
                           <Download className="w-3 h-3" />
                       </Button>
                   </div>
                   <div className="bg-white dark:bg-gray-100 p-2 rounded border shadow-sm">
                      {staff.staff_id ? (
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`Name: ${staff.full_name}\nID: ${staff.staff_id}\nRole: ${staff.role?.name}\nPhone: ${staff.phone}`)}`} 
                            alt="QR Code" 
                            className="w-24 h-24"
                          />
                      ) : <QrCode className="w-24 h-24 text-gray-300 dark:text-gray-600" />}
                   </div>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* RIGHT CONTENT - TABS */}
          <div className="lg:col-span-3">
            <Card className="shadow-md min-h-[600px] border-none">
              <CardContent className="p-0">
                <Tabs defaultValue="profile" className="w-full">
                  <div className="border-b px-4 bg-muted/10">
                    <TabsList className="h-14 bg-transparent w-full justify-start gap-6 overflow-x-auto">
                      <TabsTrigger value="profile" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-2 py-3 text-muted-foreground">Profile</TabsTrigger>
                      <TabsTrigger value="payroll" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-2 py-3 text-muted-foreground">Payroll</TabsTrigger>
                      <TabsTrigger value="leaves" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-2 py-3 text-muted-foreground">Leaves</TabsTrigger>
                      <TabsTrigger value="attendance" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-2 py-3 text-muted-foreground">Attendance</TabsTrigger>
                      <TabsTrigger value="documents" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-2 py-3 text-muted-foreground">Documents</TabsTrigger>
                      <TabsTrigger value="timeline" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-2 py-3 text-muted-foreground">Timeline</TabsTrigger>
                    </TabsList>
                  </div>

                  {/* TAB: PROFILE */}
                  <TabsContent value="profile" className="p-6 space-y-8 animate-in fade-in-50">
                    
                    {/* 1. Personal Information */}
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-primary"><User className="w-5 h-5" /> Personal Information</h3>
                            <div className="flex gap-2">
                                {user?.role === 'school_owner' && (
                                    <Button variant="destructive" size="sm" onClick={() => setDisableDialogOpen(true)}>
                                        <Ban className="w-4 h-4 mr-2" /> Disable Staff
                                    </Button>
                                )}
                                <Link to={ROUTES.SUPER_ADMIN.EDIT_EMPLOYEE.replace(':employeeId', employeeId)}>
                                    <Button variant="outline" size="sm" className="hover:bg-primary hover:text-white transition-colors"><Edit className="w-4 h-4 mr-2" /> Edit Profile</Button>
                                </Link>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">Full Name</span><span className="col-span-2 font-medium">{staff.full_name}</span></div>
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">Gender</span><span className="col-span-2 font-medium">{staff.gender || '-'}</span></div>
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">Date of Birth</span><span className="col-span-2 font-medium">{staff.dob || '-'}</span></div>
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">Phone</span><span className="col-span-2 font-medium">{staff.phone || '-'}</span></div>
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">Email</span><span className="col-span-2 font-medium">{staff.email || '-'}</span></div>
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">Emergency Contact</span><span className="col-span-2 font-medium">{staff.emergency_contact_number || '-'}</span></div>
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">Father Name</span><span className="col-span-2 font-medium">{staff.father_name || '-'}</span></div>
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">Mother Name</span><span className="col-span-2 font-medium">{staff.mother_name || '-'}</span></div>
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">Marital Status</span><span className="col-span-2 font-medium">{staff.marital_status || '-'}</span></div>
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">Citizenship</span><span className="col-span-2 font-medium">{staff.citizenship || '-'}</span></div>
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">Aadhar Number</span><span className="col-span-2 font-medium">{staff.aadhar_no || '-'}</span></div>
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">Govt ID / Resident No</span><span className="col-span-2 font-medium">{staff.govt_id_no || '-'}</span></div>
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">PAN Number</span><span className="col-span-2 font-medium">{staff.pan_number || '-'}</span></div>
                        </div>
                    </section>

                    {/* 2. Employment & Official Details */}
                    <section>
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-primary mb-4"><Briefcase className="w-5 h-5" /> Employment & Official Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">Employee ID</span><span className="col-span-2 font-medium font-mono text-primary">{staff.staff_id || '-'}</span></div>
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">Date of Joining</span><span className="col-span-2 font-medium">{staff.date_of_joining || '-'}</span></div>
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">Designation</span><span className="col-span-2 font-medium">{staff.designation?.name || '-'}</span></div>
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">Department</span><span className="col-span-2 font-medium">{staff.department?.name || '-'}</span></div>
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">Role</span><span className="col-span-2 font-medium">{staff.role?.name || '-'}</span></div>
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">Employment Status</span><span className="col-span-2 font-medium">{staff.employment_status || '-'}</span></div>
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">Staff Type</span><span className="col-span-2 font-medium">{staff.staff_type || '-'}</span></div>
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">Employment Category</span><span className="col-span-2 font-medium">{staff.employment_category || '-'}</span></div>
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">Shift</span><span className="col-span-2 font-medium">{staff.shift_id || '-'}</span></div>
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">Biometric Code</span><span className="col-span-2 font-medium">{staff.biometric_code || '-'}</span></div>
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">Work Experience</span><span className="col-span-2 font-medium">{staff.work_experience || '-'}</span></div>
                        </div>
                    </section>

                    {/* 3. Academic & Qualification */}
                    <section>
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-primary mb-4"><FileText className="w-5 h-5" /> Academic & Qualification</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">Qualification Type</span><span className="col-span-2 font-medium">{staff.qualification_type || '-'}</span></div>
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">Qualification</span><span className="col-span-2 font-medium">{staff.educational_qualification || staff.qualification || '-'}</span></div>
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">Trained As</span><span className="col-span-2 font-medium">{staff.trained_as || '-'}</span></div>
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">CTET Qualified</span><span className="col-span-2 font-medium">{staff.ctet_qualified ? 'Yes' : 'No'}</span></div>
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">GATE Qualified</span><span className="col-span-2 font-medium">{staff.gate_qualified ? 'Yes' : 'No'}</span></div>
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">NAT Qualified</span><span className="col-span-2 font-medium">{staff.nat_qualified ? 'Yes' : 'No'}</span></div>
                        </div>
                    </section>

                    {/* 4. Financial & Statutory */}
                    <section>
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-primary mb-4"><Banknote className="w-5 h-5" /> Financial & Statutory</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">Salary Pay Type</span><span className="col-span-2 font-medium">{staff.salary_pay_type || '-'}</span></div>
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">Basic Salary</span><span className="col-span-2 font-medium">₹{staff.basic_salary || '0.00'}</span></div>
                            <div className="grid grid-cols-3 border-b pb-2"><span className="text-muted-foreground">EPF Number</span><span className="col-span-2 font-medium">{staff.epf_no || '-'}</span></div>
                        </div>
                    </section>

                    {/* 5. Address */}
                    <section>
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-primary mb-4"><MapPin className="w-5 h-5" /> Address Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div className="space-y-2">
                                <h4 className="font-medium text-muted-foreground">Current Address</h4>
                                <p className="p-3 bg-muted/30 rounded-md">{staff.present_address || staff.current_address || 'Not Provided'}</p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium text-muted-foreground">Permanent Address</h4>
                                <p className="p-3 bg-muted/30 rounded-md">{staff.permanent_address || 'Same as Current'}</p>
                            </div>
                        </div>
                    </section>

                    {/* 6. Bank Details */}
                    <section>
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-primary mb-4"><Banknote className="w-5 h-5" /> Bank Account Details</h3>
                        <div className="bg-muted/10 p-4 rounded-lg border grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="grid grid-cols-3"><span className="text-muted-foreground">Account Title</span><span className="col-span-2 font-medium">{staff.bank_account_title || staff.full_name}</span></div>
                            <div className="grid grid-cols-3"><span className="text-muted-foreground">Bank Name</span><span className="col-span-2 font-medium">{staff.bank_name || '-'}</span></div>
                            <div className="grid grid-cols-3"><span className="text-muted-foreground">Branch Name</span><span className="col-span-2 font-medium">{staff.bank_branch_name || staff.bank_branch || '-'}</span></div>
                            <div className="grid grid-cols-3"><span className="text-muted-foreground">Account Number</span><span className="col-span-2 font-medium">{staff.bank_account_number || '-'}</span></div>
                            <div className="grid grid-cols-3"><span className="text-muted-foreground">IFSC Code</span><span className="col-span-2 font-medium">{staff.ifsc_code || '-'}</span></div>
                        </div>
                    </section>

                    {/* 7. Social Media */}
                    <section>
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-primary mb-4"><Activity className="w-5 h-5" /> Social Media Links</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-3 p-2 border rounded hover:bg-muted/50 transition-colors">
                                <Facebook className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <span className="truncate text-muted-foreground">{staff.facebook_url || 'Not Linked'}</span>
                            </div>
                            <div className="flex items-center gap-3 p-2 border rounded hover:bg-muted/50 transition-colors">
                                <Twitter className="w-5 h-5 text-sky-500" />
                                <span className="truncate text-muted-foreground">{staff.twitter_url || 'Not Linked'}</span>
                            </div>
                            <div className="flex items-center gap-3 p-2 border rounded hover:bg-muted/50 transition-colors">
                                <Linkedin className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                                <span className="truncate text-muted-foreground">{staff.linkedin_url || 'Not Linked'}</span>
                            </div>
                            <div className="flex items-center gap-3 p-2 border rounded hover:bg-muted/50 transition-colors">
                                <Instagram className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                                <span className="truncate text-muted-foreground">{staff.instagram_url || 'Not Linked'}</span>
                            </div>
                        </div>
                    </section>
                  </TabsContent>

                  {/* TAB: PAYROLL */}
                  <TabsContent value="payroll" className="p-6 space-y-6 animate-in fade-in-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                            <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground uppercase font-semibold">Total Net Salary Paid</p>
                                <h3 className="text-xl font-bold text-blue-700 dark:text-blue-400 mt-1">₹{payrolls.reduce((acc, curr) => acc + (curr.net_salary || 0), 0).toLocaleString()}</h3>
                            </CardContent>
                        </Card>
                        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                            <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground uppercase font-semibold">Total Gross Salary</p>
                                <h3 className="text-xl font-bold text-green-700 dark:text-green-400 mt-1">₹{payrolls.reduce((acc, curr) => acc + (curr.gross_salary || 0), 0).toLocaleString()}</h3>
                            </CardContent>
                        </Card>
                        <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
                            <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground uppercase font-semibold">Total Earnings</p>
                                <h3 className="text-xl font-bold text-purple-700 dark:text-purple-400 mt-1">₹{payrolls.reduce((acc, curr) => acc + (curr.total_earnings || 0), 0).toLocaleString()}</h3>
                            </CardContent>
                        </Card>
                        <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                            <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground uppercase font-semibold">Total Deductions</p>
                                <h3 className="text-xl font-bold text-red-700 dark:text-red-400 mt-1">₹{payrolls.reduce((acc, curr) => acc + (curr.total_deductions || 0), 0).toLocaleString()}</h3>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Payslip #</TableHead>
                                    <TableHead>Month - Year</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Mode</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Net Salary (₹)</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payrolls.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No payroll records found.</TableCell></TableRow>
                                ) : (
                                    payrolls.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-medium">{p.id.slice(0, 8)}</TableCell>
                                            <TableCell>{p.month} - {p.year}</TableCell>
                                            <TableCell>{formatDate(p.created_at)}</TableCell>
                                            <TableCell>{p.payment_mode || 'Bank Transfer'}</TableCell>
                                            <TableCell><Badge variant={p.status === 'paid' ? 'success' : 'warning'} className={p.status === 'paid' ? 'bg-green-500 dark:bg-green-600' : 'bg-yellow-500 dark:bg-yellow-600'}>{p.status}</Badge></TableCell>
                                            <TableCell className="text-right font-bold">₹{p.net_salary}</TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" variant="outline">View Payslip</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                  </TabsContent>

                  {/* TAB: LEAVES */}
                  <TabsContent value="leaves" className="p-6 space-y-6 animate-in fade-in-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
                            <CardContent className="p-4 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">Medical Leave (20)</p>
                                    <p className="text-xs text-muted-foreground mt-1">Used: {leaves.filter(l => l.leave_type === 'Medical' && l.status === 'approved').length} | Available: 20</p>
                                </div>
                                <Activity className="h-8 w-8 text-orange-400 opacity-50" />
                            </CardContent>
                        </Card>
                        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                            <CardContent className="p-4 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Casual Leave (25)</p>
                                    <p className="text-xs text-muted-foreground mt-1">Used: {leaves.filter(l => l.leave_type === 'Casual' && l.status === 'approved').length} | Available: 25</p>
                                </div>
                                <Briefcase className="h-8 w-8 text-blue-400 opacity-50" />
                            </CardContent>
                        </Card>
                        <Card className="bg-pink-50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-800">
                            <CardContent className="p-4 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-semibold text-pink-800 dark:text-pink-300">Maternity Leave (25)</p>
                                    <p className="text-xs text-muted-foreground mt-1">Used: {leaves.filter(l => l.leave_type === 'Maternity' && l.status === 'approved').length} | Available: 25</p>
                                </div>
                                <User className="h-8 w-8 text-pink-400 opacity-50" />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Leave Type</TableHead>
                                    <TableHead>Leave Date</TableHead>
                                    <TableHead>Days</TableHead>
                                    <TableHead>Apply Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leaves.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No leave records found.</TableCell></TableRow>
                                ) : (
                                    leaves.map((l) => (
                                        <TableRow key={l.id}>
                                            <TableCell className="font-medium">{l.leave_type}</TableCell>
                                            <TableCell>{l.start_date} - {l.end_date}</TableCell>
                                            <TableCell>{l.days || 1}</TableCell>
                                            <TableCell>{formatDate(l.created_at)}</TableCell>
                                            <TableCell>
                                                <Badge className={
                                                    l.status === 'approved' ? 'bg-green-500 dark:bg-green-600' : 
                                                    l.status === 'rejected' ? 'bg-red-500 dark:bg-red-600' : 'bg-yellow-500 dark:bg-yellow-600'
                                                }>{l.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" variant="ghost"><Edit className="w-4 h-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                  </TabsContent>

                  {/* TAB: ATTENDANCE */}
                  <TabsContent value="attendance" className="p-6 space-y-6 animate-in fade-in-50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card><CardContent className="p-4 flex flex-col items-center"><span className="text-2xl font-bold text-green-600 dark:text-green-400">{attendance.filter(a => a.status === 'present').length}</span><span className="text-xs text-muted-foreground uppercase">Total Present</span></CardContent></Card>
                        <Card><CardContent className="p-4 flex flex-col items-center"><span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{attendance.filter(a => a.status === 'late').length}</span><span className="text-xs text-muted-foreground uppercase">Total Late</span></CardContent></Card>
                        <Card><CardContent className="p-4 flex flex-col items-center"><span className="text-2xl font-bold text-red-600 dark:text-red-400">{attendance.filter(a => a.status === 'absent').length}</span><span className="text-xs text-muted-foreground uppercase">Total Absent</span></CardContent></Card>
                        <Card><CardContent className="p-4 flex flex-col items-center"><span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{attendance.filter(a => a.status === 'half_day').length}</span><span className="text-xs text-muted-foreground uppercase">Half Day</span></CardContent></Card>
                    </div>
                    
                    <div className="border rounded-md p-8 text-center bg-muted/10">
                        <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">Attendance Calendar</h3>
                        <p className="text-muted-foreground">Calendar view implementation pending...</p>
                    </div>
                  </TabsContent>

                  {/* TAB: DOCUMENTS */}
                  <TabsContent value="documents" className="p-6 animate-in fade-in-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {documents.length === 0 ? <div className="col-span-3 text-center py-12 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">No documents uploaded.</div> :
                        documents.map(doc => (
                            <Card key={doc.id} className="hover:shadow-md transition-shadow group">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                                            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400"/>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm truncate max-w-[150px]" title={doc.document_name}>{doc.document_name}</h4>
                                            <p className="text-xs text-muted-foreground">{doc.document_type}</p>
                                        </div>
                                    </div>
                                    <a href={doc.document_url} target="_blank" rel="noreferrer">
                                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">View</Button>
                                    </a>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                  </TabsContent>

                  {/* TAB: TIMELINE */}
                  <TabsContent value="timeline" className="p-6 animate-in fade-in-50">
                    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-emerald-500 text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-slate-800 p-4 rounded border shadow-sm">
                                <div className="flex items-center justify-between space-x-2 mb-1">
                                    <div className="font-bold text-slate-900">Joined the School</div>
                                    <time className="font-caveat font-medium text-indigo-500">{staff.date_of_joining}</time>
                                </div>
                                <div className="text-slate-500">Started working as {staff.designation?.name} in {staff.department?.name} department.</div>
                            </div>
                        </div>
                        {/* More timeline items can be mapped here */}
                    </div>
                  </TabsContent>

                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    
      <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Disable Staff Account</DialogTitle>
                <DialogDescription>
                    This action will restrict the staff member's access to the system.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Disable Type</Label>
                    <RadioGroup value={disableType} onValueChange={setDisableType} className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="date_set" id="r1" />
                            <Label htmlFor="r1">Date Set Disable (Schedule or Record Date)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="permanent" id="r2" />
                            <Label htmlFor="r2">Permanent Disable (Immediate)</Label>
                        </div>
                    </RadioGroup>
                </div>

                {disableType === 'date_set' && (
                    <div className="space-y-2">
                        <Label>Select Date</Label>
                        <Input type="date" value={disableDate} onChange={(e) => setDisableDate(e.target.value)} />
                        <p className="text-xs text-muted-foreground">If date is today or past, access is revoked immediately.</p>
                    </div>
                )}

                <div className="space-y-2">
                    <Label>Reason</Label>
                    <Textarea placeholder="Enter reason for disabling..." value={disableReason} onChange={(e) => setDisableReason(e.target.value)} />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setDisableDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDisableSubmit} disabled={disabling}>
                    {disabling ? <Loader2 className="animate-spin w-4 h-4" /> : 'Confirm Disable'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Disable Staff Account</DialogTitle>
                <DialogDescription>
                    This action will restrict the staff member's access to the system.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Disable Type</Label>
                    <RadioGroup value={disableType} onValueChange={setDisableType} className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="date_set" id="r1" />
                            <Label htmlFor="r1">Date Set Disable (Schedule or Record Date)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="permanent" id="r2" />
                            <Label htmlFor="r2">Permanent Disable (Immediate)</Label>
                        </div>
                    </RadioGroup>
                </div>

                {disableType === 'date_set' && (
                    <div className="space-y-2">
                        <Label>Select Date</Label>
                        <Input type="date" value={disableDate} onChange={(e) => setDisableDate(e.target.value)} />
                        <p className="text-xs text-muted-foreground">If date is today or past, access is revoked immediately.</p>
                    </div>
                )}

                <div className="space-y-2">
                    <Label>Reason</Label>
                    <Textarea placeholder="Enter reason for disabling..." value={disableReason} onChange={(e) => setDisableReason(e.target.value)} />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setDisableDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDisableSubmit} disabled={disabling}>
                    {disabling ? <Loader2 className="animate-spin w-4 h-4" /> : 'Confirm Disable'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
</DashboardLayout>
  );
};

export default StaffProfile;
