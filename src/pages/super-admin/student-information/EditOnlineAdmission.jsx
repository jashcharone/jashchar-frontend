import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import DatePicker from '@/components/ui/DatePicker';
import { Loader2, Save, UserPlus, ArrowLeft, FileText, AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const EditOnlineAdmission = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [formData, setFormData] = useState(null);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [successCredentials, setSuccessCredentials] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.profile?.branch_id || !id || !selectedBranch) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('online_admissions')
          .select('*')
          .eq('id', id)
          .eq('branch_id', selectedBranch.id)
          .single();

        if (error) throw error;
        setFormData(data);

        const { data: classesData } = await supabase
          .from('classes')
          .select('id, name')
          .eq('branch_id', user.profile.branch_id)
          .eq('branch_id', selectedBranch.id);
        setClasses(classesData || []);

        if (data.class_id) {
          fetchSections(data.class_id);
        }

      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user, selectedBranch, toast]);

  const fetchSections = async (classId) => {
    const { data } = await supabase
        .from('class_sections')
        .select('sections(id, name)')
        .eq('class_id', classId);
    setSections(data ? data.map(item => item.sections).filter(Boolean) : []);
  };

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (key === 'class_id') {
        fetchSections(value);
        setSelectedSection(''); 
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('online_admissions')
        .update({
            ...formData,
            updated_at: new Date()
        })
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Saved successfully' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error saving', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleEnroll = async () => {
    if (!selectedSection) {
        toast({ variant: 'destructive', title: 'Section Required', description: 'Please select a section to enroll the student.' });
        return;
    }
    if (formData.enrolled_status === 'Enrolled') {
        toast({ variant: 'warning', title: 'Already Enrolled', description: 'This student is already enrolled.' });
        return;
    }

    setEnrolling(true);
    try {
        // Generate random credentials
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const tempUsername = `STU${formData.reference_no || randomSuffix}`;
        const tempPassword = `PASS${randomSuffix}`;

        const studentData = {
            full_name: `${formData.first_name} ${formData.last_name}`.trim(),
            email: formData.email || `${uuidv4()}@example.com`,
            username: tempUsername,
            password: tempPassword,
            class_id: formData.class_id,
            section_id: selectedSection,
            admission_date: new Date().toISOString(),
            dob: formData.date_of_birth,
            gender: formData.gender,
            phone: formData.mobile_number,
            father_name: formData.father_name,
            mother_name: formData.mother_name,
            present_address: formData.guardian_address,
            documents_received: { uploaded_docs: formData.documents }
        };

        const { data: result, error: enrollError } = await supabase.rpc('create_student_admission', { 
            p_branch_id: user.profile.branch_id,
            p_student_data: studentData,
            p_branch_id: selectedBranch.id
        });

        if (enrollError) throw enrollError;

        await supabase
            .from('online_admissions')
            .update({ enrolled_status: 'Enrolled' })
            .eq('id', id);
            
        setFormData(prev => ({ ...prev, enrolled_status: 'Enrolled' }));
        setSuccessCredentials({ username: tempUsername, password: tempPassword });

    } catch (error) {
        console.error("Enrollment Error", error);
        toast({ variant: 'destructive', title: 'Enrollment Failed', description: error.message || 'Check console for details.' });
    } finally {
        setEnrolling(false);
    }
  };

  if (loading) return <DashboardLayout><div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div></DashboardLayout>;
  if (!formData) return <DashboardLayout><div className="p-6">Admission not found</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate('/school-owner/student-information/online-admission')}><ArrowLeft className="h-4 w-4" /></Button>
                <h1 className="text-2xl font-bold">Edit Admission Application</h1>
                {formData.enrolled_status === 'Enrolled' && <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Enrolled</span>}
            </div>
            <div className="flex items-center gap-3">
                <Button variant="outline" onClick={handleSave} disabled={saving || enrolling || formData.enrolled_status === 'Enrolled'}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save
                </Button>
                
                {formData.enrolled_status !== 'Enrolled' && (
                    <div className="flex items-center gap-2 bg-secondary/20 p-1.5 rounded-md border">
                        <Select value={selectedSection} onValueChange={setSelectedSection}>
                            <SelectTrigger className="w-[180px] bg-background"><SelectValue placeholder="Select Section to Enroll" /></SelectTrigger>
                            <SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <Button onClick={handleEnroll} disabled={saving || enrolling || !selectedSection}>
                            {enrolling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                            Enroll Student
                        </Button>
                    </div>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader><CardTitle>Student Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><Label>Reference No</Label><Input value={formData.reference_no} disabled /></div>
                        <div>
                            <Label>Class</Label>
                            <Select value={formData.class_id} onValueChange={v => handleChange('class_id', v)} disabled={formData.enrolled_status === 'Enrolled'}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div><Label>First Name</Label><Input value={formData.first_name} onChange={e => handleChange('first_name', e.target.value)} disabled={formData.enrolled_status === 'Enrolled'} /></div>
                        <div><Label>Last Name</Label><Input value={formData.last_name} onChange={e => handleChange('last_name', e.target.value)} disabled={formData.enrolled_status === 'Enrolled'} /></div>
                        <div><Label>Gender</Label>
                            <Select value={formData.gender} onValueChange={v => handleChange('gender', v)} disabled={formData.enrolled_status === 'Enrolled'}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent>
                            </Select>
                        </div>
                        <div><Label>DOB</Label><DatePicker value={formData.date_of_birth} onChange={d => handleChange('date_of_birth', d)} disabled={formData.enrolled_status === 'Enrolled'} /></div>
                        <div><Label>Mobile</Label><Input value={formData.mobile_number} onChange={e => handleChange('mobile_number', e.target.value)} disabled={formData.enrolled_status === 'Enrolled'} /></div>
                        <div><Label>Email</Label><Input value={formData.email} onChange={e => handleChange('email', e.target.value)} disabled={formData.enrolled_status === 'Enrolled'} /></div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Parent Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><Label>Father Name</Label><Input value={formData.father_name} onChange={e => handleChange('father_name', e.target.value)} disabled={formData.enrolled_status === 'Enrolled'} /></div>
                        <div><Label>Father Phone</Label><Input value={formData.father_phone} onChange={e => handleChange('father_phone', e.target.value)} disabled={formData.enrolled_status === 'Enrolled'} /></div>
                        <div><Label>Father Occupation</Label><Input value={formData.father_occupation} onChange={e => handleChange('father_occupation', e.target.value)} disabled={formData.enrolled_status === 'Enrolled'} /></div>
                        <div><Label>Mother Name</Label><Input value={formData.mother_name} onChange={e => handleChange('mother_name', e.target.value)} disabled={formData.enrolled_status === 'Enrolled'} /></div>
                        <div><Label>Mother Phone</Label><Input value={formData.mother_phone} onChange={e => handleChange('mother_phone', e.target.value)} disabled={formData.enrolled_status === 'Enrolled'} /></div>
                        <div><Label>Mother Occupation</Label><Input value={formData.mother_occupation} onChange={e => handleChange('mother_occupation', e.target.value)} disabled={formData.enrolled_status === 'Enrolled'} /></div>
                    </div>
                    <div><Label>Address</Label><Textarea value={formData.guardian_address} onChange={e => handleChange('guardian_address', e.target.value)} disabled={formData.enrolled_status === 'Enrolled'} /></div>
                </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
                <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
                <CardContent>
                    {formData.documents && formData.documents.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {formData.documents.map((doc, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20">
                                    <FileText className="h-8 w-8 text-blue-500" />
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-medium truncate">Document {idx + 1}</p>
                                        <a href={doc} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">View / Download</a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <div className="flex items-center gap-2 text-muted-foreground"><AlertTriangle className="h-4 w-4"/> No documents uploaded.</div>}
                </CardContent>
            </Card>
        </div>

        {successCredentials && (
            <Dialog open={!!successCredentials} onOpenChange={() => setSuccessCredentials(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-green-600 flex items-center gap-2"><UserPlus/> Enrollment Successful!</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p>The student has been successfully enrolled into the system.</p>
                        <div className="bg-muted p-4 rounded-md space-y-2">
                            <p className="font-medium">Generated Credentials:</p>
                            <div className="flex justify-between text-sm"><span>Username:</span> <span className="font-mono font-bold">{successCredentials.username}</span></div>
                            <div className="flex justify-between text-sm"><span>Password:</span> <span className="font-mono font-bold">{successCredentials.password}</span></div>
                        </div>
                        <p className="text-sm text-muted-foreground">Please share these credentials with the student/parent securely.</p>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => navigate('/school-owner/student-information/online-admission')}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EditOnlineAdmission;
