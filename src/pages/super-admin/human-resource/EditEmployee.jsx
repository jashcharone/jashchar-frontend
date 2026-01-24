import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Sparkles, User, Banknote, Briefcase, FileText, Home, Phone, Link as LinkIcon, Lock, Edit } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import { v4 as uuidv4 } from 'uuid';
import DatePicker from '@/components/ui/DatePicker';
import AadharInput from '@/components/AadharInput';
import { useParams, useNavigate } from 'react-router-dom';

const SectionBox = ({ icon, title, children }) => {
  const Icon = icon;
  return (
    <div className="bg-card p-6 rounded-lg shadow-sm border">
      <div className="flex items-center gap-4 mb-4 pb-3 border-b">
        <div className="bg-primary/10 p-2 rounded-lg">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {children}
      </div>
    </div>
  );
};

const EditEmployee = () => {
    const { employeeId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const [loading, setLoading] = useState(true);
    const [roles, setRoles] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState({});
    
    let branchId = user?.profile?.branch_id;
    if (!branchId) {
        branchId = sessionStorage.getItem('ma_target_branch_id');
    }

    useEffect(() => {
        if (!branchId || !employeeId || !selectedBranch?.id) return;
        
        const fetchData = async () => {
            setLoading(true);
            try {
                const [rolesRes, departmentsRes, designationsRes, employeeRes] = await Promise.all([
                    supabase.from('roles').select('id, name').eq('branch_id', branchId),
                    supabase.from('departments').select('id, name').eq('branch_id', branchId).eq('branch_id', selectedBranch.id),
                    supabase.from('designations').select('id, name').eq('branch_id', branchId).eq('branch_id', selectedBranch.id),
                    supabase.from('employee_profiles').select('*').eq('id', employeeId).eq('branch_id', selectedBranch.id).single()
                ]);
                
                // Process roles: Filter restricted and deduplicate
                let fetchedRoles = rolesRes.data || [];
                const restrictedRoles = ['student', 'parent', 'master_admin', 'school_owner'];
                
                // Filter restricted
                fetchedRoles = fetchedRoles.filter(r => !restrictedRoles.includes(r.name.toLowerCase()));

                // Deduplicate (prefer Title Case)
                const uniqueRolesMap = new Map();
                fetchedRoles.forEach(r => {
                    const key = r.name.toLowerCase();
                    if (!uniqueRolesMap.has(key)) {
                        uniqueRolesMap.set(key, r);
                    } else {
                        // If existing is lowercase and new is Title Case, replace it
                        const current = uniqueRolesMap.get(key);
                        const isNewTitleCase = r.name[0] === r.name[0].toUpperCase();
                        const isCurrentLowerCase = current.name[0] === current.name[0].toLowerCase();
                        
                        if (isNewTitleCase && isCurrentLowerCase) {
                            uniqueRolesMap.set(key, r);
                        }
                    }
                });

                setRoles(Array.from(uniqueRolesMap.values()));
                setDepartments(departmentsRes.data || []);
                setDesignations(designationsRes.data || []);
                
                if (employeeRes.data) {
                    const data = employeeRes.data;
                    const splitName = data.full_name ? data.full_name.split(' ') : ['', ''];
                    const firstName = splitName[0];
                    const lastName = splitName.slice(1).join(' ');
                    
                    setFormData({
                        ...data,
                        first_name: firstName,
                        last_name: lastName,
                        role_id: data.role_id || '',
                        department_id: data.department_id || '',
                        designation_id: data.designation_id || '',
                        staff_id: data.username, // Assuming username is staff_id here for legacy reasons
                    });
                    if (data.photo_url) setPhotoPreview(data.photo_url);
                } else {
                    toast({ variant: 'destructive', title: 'Employee not found' });
                    navigate('/super-admin/human-resource/employees');
                }
            } catch (error) {
                console.error(error);
                toast({ variant: 'destructive', title: 'Error fetching data' });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [branchId, employeeId, selectedBranch?.id, navigate, toast]);
    
    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };
    
    const handleFileChange = (file) => {
        setPhotoFile(file);
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPhotoPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            let photoUrl = formData.photo_url;
            if (photoFile) {
                const fileName = `${uuidv4()}-${photoFile.name}`;
                const { data, error } = await supabase.storage.from('staff-photos').upload(fileName, photoFile);
                if (error) throw error;
                const { data: { publicUrl } } = supabase.storage.from('staff-photos').getPublicUrl(data.path);
                photoUrl = publicUrl;
            }

            const updates = {
                full_name: `${formData.first_name} ${formData.last_name}`.trim(),
                role_id: formData.role_id,
                designation_id: formData.designation_id,
                department_id: formData.department_id,
                date_of_joining: formData.date_of_joining,
                phone: formData.phone,
                emergency_contact_number: formData.emergency_contact_number,
                marital_status: formData.marital_status,
                photo_url: photoUrl,
                current_address: formData.current_address,
                permanent_address: formData.permanent_address,
                qualification: formData.qualification,
                work_experience: formData.work_experience,
                note: formData.note,
                pan_number: formData.pan_number,
                epf_no: formData.epf_no,
                basic_salary: formData.basic_salary,
                contract_type: formData.contract_type,
                work_shift: formData.work_shift,
                location: formData.location,
                medical_leave: formData.medical_leave,
                casual_leave: formData.casual_leave,
                maternity_leave: formData.maternity_leave,
                bank_account_title: formData.bank_account_title,
                bank_account_number: formData.bank_account_number,
                bank_name: formData.bank_name,
                ifsc_code: formData.ifsc_code,
                bank_branch_name: formData.bank_branch_name,
                social_facebook_url: formData.social_facebook_url,
                social_twitter_url: formData.social_twitter_url,
                social_linkedin_url: formData.social_linkedin_url,
                social_instagram_url: formData.social_instagram_url,
                father_name: formData.father_name,
                mother_name: formData.mother_name,
                email: formData.email,
                gender: formData.gender,
                dob: formData.dob,
            };
            
            const { error } = await supabase
                .from('employee_profiles')
                .update(updates)
                .eq('id', employeeId);

            if (error) throw error;

            toast({ title: 'Success', description: 'Employee updated successfully.' });
            navigate('/school-owner/human-resource/staff-directory');
        } catch (error) {
            console.error("Employee update error:", error);
            toast({ variant: 'destructive', title: 'Failed to update employee', description: error.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <DashboardLayout><div className="flex justify-center items-center h-full"><Loader2 className="animate-spin h-8 w-8" /></div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2"><Edit className="text-primary w-6 h-6"/>Edit Employee</h1>
            </div>
            <form onSubmit={handleSubmit} className="space-y-8">
                <SectionBox icon={User} title="Basic Information">
                    <div className="lg:col-span-1"><Label>Staff ID</Label><Input value={formData.username} disabled /></div>
                    <div className="lg:col-span-1"><Label required>Role</Label><Select value={formData.role_id} onValueChange={v => handleChange('role_id', v)} required><SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger><SelectContent>{roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent></Select></div>
                    <div className="lg:col-span-1"><Label>Designation</Label><Select value={formData.designation_id} onValueChange={v => handleChange('designation_id', v)}><SelectTrigger><SelectValue placeholder="Select Designation" /></SelectTrigger><SelectContent>{designations.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
                    <div className="lg:col-span-1"><Label>Department</Label><Select value={formData.department_id} onValueChange={v => handleChange('department_id', v)}><SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger><SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
                    <div className="lg:col-span-1"><Label required>First Name</Label><Input value={formData.first_name || ''} onChange={e => handleChange('first_name', e.target.value)} required /></div>
                    <div className="lg:col-span-1"><Label>Last Name</Label><Input value={formData.last_name || ''} onChange={e => handleChange('last_name', e.target.value)} /></div>
                    <div className="lg:col-span-1"><Label>Father's Name</Label><Input value={formData.father_name || ''} onChange={e => handleChange('father_name', e.target.value)} /></div>
                    <div className="lg:col-span-1"><Label>Mother's Name</Label><Input value={formData.mother_name || ''} onChange={e => handleChange('mother_name', e.target.value)} /></div>
                    <div className="lg:col-span-1"><Label required>Gender</Label><Select value={formData.gender || ''} onValueChange={v => handleChange('gender', v)} required><SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
                    <DatePicker id="dob" label="Date of Birth" value={formData.dob} onChange={date => handleChange('dob', date)} disableFuture />
                    <DatePicker id="doj" label="Date of Joining" value={formData.date_of_joining} onChange={date => handleChange('date_of_joining', date)} />
                    <div className="lg:col-span-1"><Label>Marital Status</Label><Select value={formData.marital_status || ''} onValueChange={v => handleChange('marital_status', v)}><SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger><SelectContent><SelectItem value="single">Single</SelectItem><SelectItem value="married">Married</SelectItem><SelectItem value="widowed">Widowed</SelectItem><SelectItem value="separated">Separated</SelectItem><SelectItem value="divorced">Divorced</SelectItem></SelectContent></Select></div>
                    <div className="lg:col-span-2"><Label>Current Address</Label><Textarea value={formData.current_address || ''} onChange={e => handleChange('current_address', e.target.value)} /></div>
                    <div className="lg:col-span-2"><Label>Permanent Address</Label><Textarea value={formData.permanent_address || ''} onChange={e => handleChange('permanent_address', e.target.value)} /></div>
                    <div className="lg:col-span-1 md:col-span-2"><Label>Photo</Label><ImageUploader onFileChange={handleFileChange} initialPreview={photoPreview} key={photoPreview} /></div>
                </SectionBox>

                <SectionBox icon={Phone} title="Contact Details">
                    <div className="lg:col-span-1"><Label required>Email</Label><Input value={formData.email || ''} type="email" onChange={e => handleChange('email', e.target.value)} required /></div>
                    <div className="lg:col-span-1"><Label>Mobile No</Label><Input value={formData.phone || ''} type="tel" onChange={e => handleChange('phone', e.target.value)} /></div>
                    <div className="lg:col-span-1"><Label>Emergency Contact</Label><Input value={formData.emergency_contact_number || ''} type="tel" onChange={e => handleChange('emergency_contact_number', e.target.value)} /></div>
                </SectionBox>

                <SectionBox icon={Banknote} title="Payroll">
                    <div className="lg:col-span-1"><Label>EPF No</Label><Input value={formData.epf_no || ''} onChange={e => handleChange('epf_no', e.target.value)} /></div>
                    <div className="lg:col-span-1"><Label>Basic Salary</Label><Input value={formData.basic_salary || ''} type="number" onChange={e => handleChange('basic_salary', e.target.value)} /></div>
                    <div className="lg:col-span-1"><Label>Contract Type</Label><Select value={formData.contract_type || ''} onValueChange={v => handleChange('contract_type', v)}><SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger><SelectContent><SelectItem value="permanent">Permanent</SelectItem><SelectItem value="probation">Probation</SelectItem></SelectContent></Select></div>
                    <div className="lg:col-span-1"><Label>Work Shift</Label><Input value={formData.work_shift || ''} onChange={e => handleChange('work_shift', e.target.value)} /></div>
                    <div className="lg:col-span-1"><Label>Location</Label><Input value={formData.location || ''} onChange={e => handleChange('location', e.target.value)} /></div>
                </SectionBox>

                <SectionBox icon={Briefcase} title="Leaves">
                    <div className="lg:col-span-1"><Label>Medical</Label><Input value={formData.medical_leave || ''} type="number" onChange={e => handleChange('medical_leave', e.target.value)} /></div>
                    <div className="lg:col-span-1"><Label>Casual</Label><Input value={formData.casual_leave || ''} type="number" onChange={e => handleChange('casual_leave', e.target.value)} /></div>
                    <div className="lg:col-span-1"><Label>Maternity</Label><Input value={formData.maternity_leave || ''} type="number" onChange={e => handleChange('maternity_leave', e.target.value)} /></div>
                </SectionBox>

                <SectionBox icon={Home} title="Bank Account Details">
                    <div className="lg:col-span-1"><Label>Account Title</Label><Input value={formData.bank_account_title || ''} onChange={e => handleChange('bank_account_title', e.target.value)} /></div>
                    <div className="lg:col-span-1"><Label>Account Number</Label><Input value={formData.bank_account_number || ''} onChange={e => handleChange('bank_account_number', e.target.value)} /></div>
                    <div className="lg:col-span-1"><Label>Bank Name</Label><Input value={formData.bank_name || ''} onChange={e => handleChange('bank_name', e.target.value)} /></div>
                    <div className="lg:col-span-1"><Label>IFSC Code</Label><Input value={formData.ifsc_code || ''} onChange={e => handleChange('ifsc_code', e.target.value)} /></div>
                    <div className="lg:col-span-1"><Label>Branch Name</Label><Input value={formData.bank_branch_name || ''} onChange={e => handleChange('bank_branch_name', e.target.value)} /></div>
                </SectionBox>

                <SectionBox icon={FileText} title="Other Information">
                    <div className="lg:col-span-1"><Label>Qualification</Label><Input value={formData.qualification || ''} onChange={e => handleChange('qualification', e.target.value)} /></div>
                    <div className="lg:col-span-1"><Label>Work Experience</Label><Input value={formData.work_experience || ''} onChange={e => handleChange('work_experience', e.target.value)} /></div>
                    <div className="lg:col-span-1"><Label>PAN Number</Label><Input value={formData.pan_number || ''} onChange={e => handleChange('pan_number', e.target.value)} /></div>
                    <div className="lg:col-span-1"><AadharInput label="Aadhar No" value={formData.aadhar_no || ''} onChange={val => handleChange('aadhar_no', val)} /></div>
                    <div className="md:col-span-2 lg:col-span-4"><Label>Note</Label><Textarea value={formData.note || ''} onChange={e => handleChange('note', e.target.value)} /></div>
                </SectionBox>

                <SectionBox icon={LinkIcon} title="Social Media Links">
                    <div className="lg:col-span-1"><Label>Facebook URL</Label><Input value={formData.social_facebook_url || ''} onChange={e => handleChange('social_facebook_url', e.target.value)} /></div>
                    <div className="lg:col-span-1"><Label>Twitter URL</Label><Input value={formData.social_twitter_url || ''} onChange={e => handleChange('social_twitter_url', e.target.value)} /></div>
                    <div className="lg:col-span-1"><Label>LinkedIn URL</Label><Input value={formData.social_linkedin_url || ''} onChange={e => handleChange('social_linkedin_url', e.target.value)} /></div>
                    <div className="lg:col-span-1"><Label>Instagram URL</Label><Input value={formData.social_instagram_url || ''} onChange={e => handleChange('social_instagram_url', e.target.value)} /></div>
                </SectionBox>

                <div className="flex justify-end pt-4"><Button type="submit" size="lg" disabled={saving}>{saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />} Update Employee</Button></div>
            </form>
        </DashboardLayout>
    );
};

export default EditEmployee;
