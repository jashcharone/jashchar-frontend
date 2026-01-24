import React, { useState, useEffect } from 'react';
import { useSchoolSlug } from '@/hooks/useSchoolSlug';
import { supabase } from '@/lib/customSupabaseClient';
import publicCmsService from '@/services/publicCmsService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import DatePicker from '@/components/ui/DatePicker';
import DocumentUploadField from '@/components/common/DocumentUploadField';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PublicHeader, PublicFooter, TopBar } from '@/components/public/PublicLayoutComponents';
import { Helmet } from 'react-helmet';

const OnlineAdmission = () => {
  const schoolAlias = useSchoolSlug();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [school, setSchool] = useState(null);
  const [settings, setSettings] = useState(null);
  const [classes, setClasses] = useState([]);
  const [submittedRef, setSubmittedRef] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // Layout Data
  const [siteSettings, setSiteSettings] = useState(null);
  const [menus, setMenus] = useState([]);
  const [news, setNews] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    class_id: '',
    first_name: '',
    last_name: '',
    gender: '',
    date_of_birth: null,
    mobile_number: '',
    email: '',
    student_photo: '',
    
    father_name: '',
    father_phone: '',
    father_occupation: '',
    father_photo: '',
    
    mother_name: '',
    mother_phone: '',
    mother_occupation: '',
    mother_photo: '',
    
    guardian_is: 'father', // father, mother, other
    guardian_name: '',
    guardian_relation: '',
    guardian_email: '',
    guardian_photo: '',
    guardian_phone: '',
    guardian_occupation: '',
    guardian_address: '',
    
    current_address: '',
    permanent_address: '',
    is_permanent_same_as_current: false,
    is_guardian_address_same_as_current: false,
    
    national_id_no: '',
    local_id_no: '',
    bank_account_no: '',
    bank_name: '',
    ifsc_code: '',
    previous_school_details: '',
    
    documents: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch School Data & Site Settings
        const [siteRes, newsRes, settingsData] = await Promise.all([
            publicCmsService.getPublicSite(schoolAlias),
            publicCmsService.getPublicNewsList(schoolAlias),
            publicCmsService.getOnlineAdmissionSettings(schoolAlias)
        ]);

        if (!siteRes.success) {
            throw new Error(siteRes.message || 'School not found');
        }

        const schoolData = siteRes.data.school;
        setSchool(schoolData);
        setSiteSettings(siteRes.data.settings);
        setMenus(siteRes.data.menus);
        
        if (newsRes.success) {
            setNews(newsRes.data);
        }

        if (settingsData.success) {
            setSettings(settingsData.data);
        }

        // 3. Fetch Classes
        const classesRes = await publicCmsService.getPublicClasses(schoolAlias);
        
        if (!classesRes.success) {
            throw new Error(classesRes.message || 'Failed to load classes');
        }
        setClasses(classesRes.data || []);
      } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      } finally {
        setLoading(false);
      }
    };

    if (schoolAlias) {
      fetchData();
    }
  }, [schoolAlias, toast]);

  // Auto-fill guardian details based on selection
  useEffect(() => {
    if (formData.guardian_is === 'father') {
      setFormData(prev => ({
        ...prev,
        guardian_name: prev.father_name,
        guardian_relation: 'Father',
        guardian_phone: prev.father_phone || prev.guardian_phone,
        guardian_occupation: prev.father_occupation,
        guardian_photo: prev.father_photo
      }));
    } else if (formData.guardian_is === 'mother') {
      setFormData(prev => ({
        ...prev,
        guardian_name: prev.mother_name,
        guardian_relation: 'Mother',
        guardian_phone: prev.mother_phone || prev.guardian_phone,
        guardian_occupation: prev.mother_occupation,
        guardian_photo: prev.mother_photo
      }));
    }
  }, [formData.guardian_is, formData.father_name, formData.mother_name, formData.father_phone, formData.mother_phone]);

  // Address sync logic
  useEffect(() => {
    if (formData.is_guardian_address_same_as_current) {
      setFormData(prev => ({ ...prev, current_address: prev.guardian_address }));
    }
  }, [formData.is_guardian_address_same_as_current, formData.guardian_address]);

  useEffect(() => {
    if (formData.is_permanent_same_as_current) {
      setFormData(prev => ({ ...prev, permanent_address: prev.current_address }));
    }
  }, [formData.is_permanent_same_as_current, formData.current_address]);


  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleDocumentUpload = (url) => {
    if (url) {
        setFormData(prev => ({ ...prev, documents: [...prev.documents, url] }));
    }
  };

  const isFieldVisible = (fieldName) => {
    if (!settings || !settings.visible_fields) return true; // Default to visible if no settings
    // If the key exists in visible_fields, return its value. If not, default to true (or false depending on requirement, but usually true for core fields)
    // However, the requirement implies we should respect the toggle.
    // Let's assume if it's in the map, we use it. If not, we show it (safe default).
    return settings.visible_fields[fieldName] !== false;
  };

  const handleSubmit = async () => {
    if (!formData.class_id || !formData.first_name || !formData.gender || !formData.date_of_birth || !formData.mobile_number || !formData.guardian_name) {
      toast({ variant: 'destructive', title: 'Required Fields', description: 'Please fill in all required fields marked with *' });
      return;
    }

    if (settings?.terms_conditions && !termsAccepted) {
        toast({ variant: 'destructive', title: 'Terms & Conditions', description: 'Please accept the terms and conditions to proceed.' });
        return;
    }

    setSubmitting(true);
    try {
      const reference_no = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Find branch_id from selected class
      const selectedClass = classes.find(c => c.id === formData.class_id);
      const branch_id = selectedClass ? selectedClass.branch_id : null;

      const admissionData = {
          branch_id: school.id,
          branch_id: branch_id,
          reference_no,
          enrolled_status: 'Pending',
          
          class_id: formData.class_id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          gender: formData.gender,
          date_of_birth: formData.date_of_birth,
          mobile_number: formData.mobile_number,
          email: formData.email,
          student_photo: formData.student_photo,
          
          father_name: formData.father_name,
          father_phone: formData.father_phone,
          father_occupation: formData.father_occupation,
          father_photo: formData.father_photo,

          mother_name: formData.mother_name,
          mother_phone: formData.mother_phone,
          mother_occupation: formData.mother_occupation,
          mother_photo: formData.mother_photo,
          
          guardian_is: formData.guardian_is,
          guardian_name: formData.guardian_name,
          guardian_relation: formData.guardian_relation,
          guardian_email: formData.guardian_email,
          guardian_photo: formData.guardian_photo,
          guardian_phone: formData.guardian_phone,
          guardian_occupation: formData.guardian_occupation,
          guardian_address: formData.guardian_address,
          
          current_address: formData.current_address,
          permanent_address: formData.permanent_address,
          
          national_id_no: formData.national_id_no,
          local_id_no: formData.local_id_no,
          bank_account_no: formData.bank_account_no,
          bank_name: formData.bank_name,
          ifsc_code: formData.ifsc_code,
          previous_school_details: formData.previous_school_details,
          
          documents: formData.documents,

          // Payment info (placeholder for now)
          payment_status: settings?.payment_option_enabled ? 'Pending' : 'Not Required',
          amount_paid: 0
      };

      const res = await publicCmsService.submitAdmission(schoolAlias, admissionData);

      if (!res.success) {
        throw new Error(res.message || 'Submission failed');
      }

      setSubmittedRef(reference_no);
      toast({ title: 'Application Submitted!', description: `Your admission reference number is ${reference_no}.` });
    } catch (error) {
      console.error('Submission error:', error);
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen bg-gray-50"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (settings && !settings.online_admission_enabled) {
      return (
        <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-white">
            <Helmet><title>{`Online Admission | ${siteSettings?.school_name || 'School'}`}</title></Helmet>
            <TopBar settings={siteSettings} news={news} />
            <PublicHeader settings={siteSettings} menus={menus} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} slug={schoolAlias} />
            
            <div className="flex-grow flex items-center justify-center p-4 bg-gray-50">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                        <CardTitle className="text-xl">Admissions Closed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600">Online admissions are currently closed for {school?.name}. Please contact the school administration for more information.</p>
                    </CardContent>
                </Card>
            </div>
            <PublicFooter settings={siteSettings} />
        </div>
      );
  }

  if (submittedRef) {
    return (
      <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-white">
        <Helmet><title>{`Online Admission | ${siteSettings?.school_name || 'School'}`}</title></Helmet>
        <TopBar settings={siteSettings} news={news} />
        <PublicHeader settings={siteSettings} menus={menus} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} slug={schoolAlias} />

        <div className="flex-grow flex items-center justify-center p-4 bg-gray-50">
            <Card className="w-full max-w-md text-center">
            <CardHeader>
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-700">Application Submitted!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Reference Number</p>
                <p className="text-2xl font-mono font-bold tracking-wider">{submittedRef}</p>
                </div>
                <p className="text-sm text-gray-600">
                Please save this reference number for future correspondence. We will contact you shortly.
                </p>
                {settings?.payment_option_enabled && (
                    <Alert className="bg-blue-50 border-blue-200">
                        <AlertTitle>Payment Required</AlertTitle>
                        <AlertDescription>
                            Please proceed to pay the application fee of ₹{settings.form_fees}.
                            <div className="mt-2">
                                <Button className="w-full">Pay Now (Coming Soon)</Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}
                <Button onClick={() => window.location.reload()} variant="outline" className="w-full mt-2">Submit Another Application</Button>
            </CardContent>
            </Card>
        </div>
        <PublicFooter settings={siteSettings} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-white">
      <Helmet><title>{`Online Admission | ${siteSettings?.school_name || 'School'}`}</title></Helmet>
      <TopBar settings={siteSettings} news={news} />
      <PublicHeader settings={siteSettings} menus={menus} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} slug={schoolAlias} />

      <div className="flex-grow bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Online Admission</h1>
          <div className="flex gap-2">
            <Button variant="secondary" className="bg-gray-600 hover:bg-gray-700 text-white">Check Your Form Status</Button>
            <Button variant="secondary" className="bg-gray-600 hover:bg-gray-700 text-white">Download Application Form</Button>
          </div>
        </div>

        {/* Instructions */}
        {settings?.instructions && (
            <Card className="border-l-4 border-l-blue-500 shadow-sm">
                <CardHeader className="bg-gray-50 border-b py-3">
                    <CardTitle className="text-lg text-blue-700">Instructions</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="prose prose-sm max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: settings.instructions }} />
                </CardContent>
            </Card>
        )}

        <div className="grid grid-cols-1 gap-8">
            
            {/* Basic Details */}
            <Card className="shadow-sm">
                <CardHeader className="bg-gray-50 border-b py-3">
                    <CardTitle className="text-base font-semibold text-gray-800">Basic Details</CardTitle>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <Label className="text-gray-700">Class <span className="text-red-500">*</span></Label>
                        <Select onValueChange={(val) => handleChange('class_id', val)} value={formData.class_id}>
                            <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                            <SelectContent>
                                {classes.map((cls) => (
                                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="space-y-2">
                        <Label className="text-gray-700">First Name <span className="text-red-500">*</span></Label>
                        <Input value={formData.first_name} onChange={(e) => handleChange('first_name', e.target.value)} placeholder="" />
                    </div>

                    {isFieldVisible('student_last_name') && (
                        <div className="space-y-2">
                            <Label className="text-gray-700">Last Name</Label>
                            <Input value={formData.last_name} onChange={(e) => handleChange('last_name', e.target.value)} placeholder="" />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label className="text-gray-700">Gender <span className="text-red-500">*</span></Label>
                        <Select onValueChange={(val) => handleChange('gender', val)} value={formData.gender}>
                            <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-gray-700">Date of Birth <span className="text-red-500">*</span></Label>
                        <Input type="date" value={formData.date_of_birth} onChange={(e) => handleChange('date_of_birth', e.target.value)} />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-gray-700">Mobile Number <span className="text-red-500">*</span></Label>
                        <Input value={formData.mobile_number} onChange={(e) => handleChange('mobile_number', e.target.value)} placeholder="" />
                    </div>

                    {isFieldVisible('student_email') && (
                        <div className="space-y-2">
                            <Label className="text-gray-700">Email</Label>
                            <Input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="" />
                        </div>
                    )}

                    {isFieldVisible('student_photo') && (
                        <div className="space-y-2">
                            <Label className="text-gray-700">Student Photo</Label>
                            <DocumentUploadField 
                                onUploadComplete={(url) => handleChange('student_photo', url)}
                                label="Drop file here or click to upload"
                                className="h-10 text-xs"
                            />
                            {formData.student_photo && <p className="text-xs text-green-600 mt-1">Photo Uploaded</p>}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Parent Details */}
            <Card className="shadow-sm">
                <CardHeader className="bg-gray-50 border-b py-3">
                    <CardTitle className="text-base font-semibold text-gray-800">Parent Details</CardTitle>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Father */}
                    {isFieldVisible('father_name') && (
                        <div className="space-y-2">
                            <Label className="text-gray-700">Father Name</Label>
                            <Input value={formData.father_name} onChange={(e) => handleChange('father_name', e.target.value)} placeholder="" />
                        </div>
                    )}
                    {isFieldVisible('father_phone') && (
                        <div className="space-y-2">
                            <Label className="text-gray-700">Father Phone</Label>
                            <Input value={formData.father_phone} onChange={(e) => handleChange('father_phone', e.target.value)} placeholder="" />
                        </div>
                    )}
                    {isFieldVisible('father_occupation') && (
                        <div className="space-y-2">
                            <Label className="text-gray-700">Father Occupation</Label>
                            <Input value={formData.father_occupation} onChange={(e) => handleChange('father_occupation', e.target.value)} placeholder="" />
                        </div>
                    )}
                    {isFieldVisible('father_photo') && (
                        <div className="space-y-2">
                            <Label className="text-gray-700">Father Photo</Label>
                            <DocumentUploadField onUploadComplete={(url) => handleChange('father_photo', url)} label="Upload" className="h-10 text-xs" />
                        </div>
                    )}

                    {/* Mother */}
                    {isFieldVisible('mother_name') && (
                        <div className="space-y-2">
                            <Label className="text-gray-700">Mother Name</Label>
                            <Input value={formData.mother_name} onChange={(e) => handleChange('mother_name', e.target.value)} placeholder="" />
                        </div>
                    )}
                    {isFieldVisible('mother_phone') && (
                        <div className="space-y-2">
                            <Label className="text-gray-700">Mother Phone</Label>
                            <Input value={formData.mother_phone} onChange={(e) => handleChange('mother_phone', e.target.value)} placeholder="" />
                        </div>
                    )}
                    {isFieldVisible('mother_occupation') && (
                        <div className="space-y-2">
                            <Label className="text-gray-700">Mother Occupation</Label>
                            <Input value={formData.mother_occupation} onChange={(e) => handleChange('mother_occupation', e.target.value)} placeholder="" />
                        </div>
                    )}
                    {isFieldVisible('mother_photo') && (
                        <div className="space-y-2">
                            <Label className="text-gray-700">Mother Photo</Label>
                            <DocumentUploadField onUploadComplete={(url) => handleChange('mother_photo', url)} label="Upload" className="h-10 text-xs" />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Guardian Details */}
            <Card className="shadow-sm">
                <CardHeader className="bg-gray-50 border-b py-3">
                    <CardTitle className="text-base font-semibold text-gray-800">Guardian Details</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <Label className="text-gray-700 min-w-fit">If Guardian Is <span className="text-red-500">*</span></Label>
                        <RadioGroup 
                            value={formData.guardian_is} 
                            onValueChange={(v) => handleChange('guardian_is', v)}
                            className="flex gap-6"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="father" id="g_father" />
                                <Label htmlFor="g_father" className="font-normal cursor-pointer">Father</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="mother" id="g_mother" />
                                <Label htmlFor="g_mother" className="font-normal cursor-pointer">Mother</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="other" id="g_other" />
                                <Label htmlFor="g_other" className="font-normal cursor-pointer">Other</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {isFieldVisible('guardian_name') && (
                            <div className="space-y-2">
                                <Label className="text-gray-700">Guardian Name <span className="text-red-500">*</span></Label>
                                <Input value={formData.guardian_name} onChange={(e) => handleChange('guardian_name', e.target.value)} placeholder="" />
                            </div>
                        )}
                        {isFieldVisible('guardian_relation') && (
                            <div className="space-y-2">
                                <Label className="text-gray-700">Guardian Relation</Label>
                                <Input value={formData.guardian_relation} onChange={(e) => handleChange('guardian_relation', e.target.value)} placeholder="" />
                            </div>
                        )}
                        {isFieldVisible('guardian_email') && (
                            <div className="space-y-2">
                                <Label className="text-gray-700">Guardian Email</Label>
                                <Input value={formData.guardian_email} onChange={(e) => handleChange('guardian_email', e.target.value)} placeholder="" />
                            </div>
                        )}
                        {isFieldVisible('guardian_photo') && (
                            <div className="space-y-2">
                                <Label className="text-gray-700">Guardian Photo</Label>
                                <DocumentUploadField onUploadComplete={(url) => handleChange('guardian_photo', url)} label="Upload" className="h-10 text-xs" />
                            </div>
                        )}
                        {isFieldVisible('guardian_phone') && (
                            <div className="space-y-2">
                                <Label className="text-gray-700">Guardian Phone</Label>
                                <Input value={formData.guardian_phone} onChange={(e) => handleChange('guardian_phone', e.target.value)} placeholder="" />
                            </div>
                        )}
                        {isFieldVisible('guardian_occupation') && (
                            <div className="space-y-2">
                                <Label className="text-gray-700">Guardian Occupation</Label>
                                <Input value={formData.guardian_occupation} onChange={(e) => handleChange('guardian_occupation', e.target.value)} placeholder="" />
                            </div>
                        )}
                        {isFieldVisible('guardian_address') && (
                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <Label className="text-gray-700">Guardian Address</Label>
                                <Textarea value={formData.guardian_address} onChange={(e) => handleChange('guardian_address', e.target.value)} placeholder="" className="h-10 min-h-[40px]" />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Address Details */}
            {(isFieldVisible('current_address') || isFieldVisible('permanent_address')) && (
                <Card className="shadow-sm">
                    <CardHeader className="bg-gray-50 border-b py-3">
                        <CardTitle className="text-base font-semibold text-gray-800">Student Address Details</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {isFieldVisible('current_address') && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label className="text-gray-700 font-medium">Current Address</Label>
                                    <div className="flex items-center gap-2">
                                        <Checkbox 
                                            id="same_as_guardian" 
                                            checked={formData.is_guardian_address_same_as_current}
                                            onCheckedChange={(checked) => handleChange('is_guardian_address_same_as_current', checked)}
                                        />
                                        <label htmlFor="same_as_guardian" className="text-xs text-gray-600 cursor-pointer">If Guardian Address is Current Address</label>
                                    </div>
                                </div>
                                <Textarea value={formData.current_address} onChange={(e) => handleChange('current_address', e.target.value)} placeholder="" className="h-24" />
                            </div>
                        )}
                        
                        {isFieldVisible('permanent_address') && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label className="text-gray-700 font-medium">Permanent Address</Label>
                                    <div className="flex items-center gap-2">
                                        <Checkbox 
                                            id="same_as_current" 
                                            checked={formData.is_permanent_same_as_current}
                                            onCheckedChange={(checked) => handleChange('is_permanent_same_as_current', checked)}
                                        />
                                        <label htmlFor="same_as_current" className="text-xs text-gray-600 cursor-pointer">If Permanent Address is Current Address</label>
                                    </div>
                                </div>
                                <Textarea value={formData.permanent_address} onChange={(e) => handleChange('permanent_address', e.target.value)} placeholder="" className="h-24" />
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Miscellaneous Details */}
            {(isFieldVisible('national_id') || isFieldVisible('local_id') || isFieldVisible('bank_account_no') || isFieldVisible('previous_school_details')) && (
                <Card className="shadow-sm">
                    <CardHeader className="bg-gray-50 border-b py-3">
                        <CardTitle className="text-base font-semibold text-gray-800">Miscellaneous Details</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {isFieldVisible('national_id') && (
                            <div className="space-y-2">
                                <Label className="text-gray-700">National Identification Number</Label>
                                <Input value={formData.national_id_no} onChange={(e) => handleChange('national_id_no', e.target.value)} />
                            </div>
                        )}
                        {isFieldVisible('local_id') && (
                            <div className="space-y-2">
                                <Label className="text-gray-700">Local Identification Number</Label>
                                <Input value={formData.local_id_no} onChange={(e) => handleChange('local_id_no', e.target.value)} />
                            </div>
                        )}
                        {isFieldVisible('bank_account_no') && (
                            <>
                                <div className="space-y-2">
                                    <Label className="text-gray-700">Bank Account Number</Label>
                                    <Input value={formData.bank_account_no} onChange={(e) => handleChange('bank_account_no', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-700">Bank Name</Label>
                                    <Input value={formData.bank_name} onChange={(e) => handleChange('bank_name', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-700">IFSC Code</Label>
                                    <Input value={formData.ifsc_code} onChange={(e) => handleChange('ifsc_code', e.target.value)} />
                                </div>
                            </>
                        )}
                        {isFieldVisible('previous_school_details') && (
                            <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-2">
                                <Label className="text-gray-700">Previous School Details</Label>
                                <Textarea value={formData.previous_school_details} onChange={(e) => handleChange('previous_school_details', e.target.value)} className="h-20" />
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Upload Documents */}
            {isFieldVisible('upload_documents') && (
                <Card className="shadow-sm">
                    <CardHeader className="bg-gray-50 border-b py-3">
                        <CardTitle className="text-base font-semibold text-gray-800">Upload Documents</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            <Label className="text-gray-700">Documents (To Upload Multiple Document Compress It In A Single File Then Upload It)</Label>
                            <DocumentUploadField 
                                onUploadComplete={handleDocumentUpload} 
                                label="Drag and drop a file here or click"
                            />
                            {formData.documents.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.documents.map((doc, idx) => (
                                        <div key={idx} className="bg-gray-100 px-3 py-1 rounded text-sm flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            <span>Document {idx + 1}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Terms and Submit */}
            <div className="space-y-4">
                {settings?.terms_conditions && (
                    <Card className="shadow-sm">
                        <CardContent className="p-6">
                            <div className="prose prose-sm max-w-none text-gray-600 mb-4" dangerouslySetInnerHTML={{ __html: settings.terms_conditions }} />
                            <div className="flex items-center space-x-2">
                                <Checkbox id="terms" checked={termsAccepted} onCheckedChange={setTermsAccepted} />
                                <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                    I agree to the terms and conditions
                                </label>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="flex justify-end">
                    <Button size="lg" onClick={handleSubmit} disabled={submitting} className="w-full md:w-auto bg-pink-600 hover:bg-pink-700 text-white px-8">
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            'Submit'
                        )}
                    </Button>
                </div>
            </div>

        </div>
      </div>
      </div>
      <PublicFooter settings={siteSettings} />
    </div>
  );
};

export default OnlineAdmission;
