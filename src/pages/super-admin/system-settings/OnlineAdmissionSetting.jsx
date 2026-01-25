import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, Search } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useToast } from '@/components/ui/use-toast';
import DocumentUploadField from '@/components/common/DocumentUploadField';
import frontCmsService from '@/services/frontCmsService';

const ADMISSION_FIELDS = [
  // Basic Student Details
  { id: 'student_last_name', label: 'Last Name', category: 'Student Details' },
  { id: 'student_email', label: 'Email', category: 'Student Details' },
  { id: 'student_photo', label: 'Student Photo', category: 'Student Details' },
  { id: 'blood_group', label: 'Blood Group', category: 'Student Details' },
  { id: 'mother_tongue', label: 'Mother Tongue', category: 'Student Details' },
  { id: 'religion', label: 'Religion', category: 'Student Details' },
  { id: 'caste', label: 'Caste', category: 'Student Details' },
  { id: 'category', label: 'Category', category: 'Student Details' },
  { id: 'national_id', label: 'National ID (Aadhar)', category: 'Student Details' },
  
  // Father Details
  { id: 'father_name', label: 'Father Name', category: 'Father Details' },
  { id: 'father_phone', label: 'Father Phone', category: 'Father Details' },
  { id: 'father_occupation', label: 'Father Occupation', category: 'Father Details' },
  { id: 'father_photo', label: 'Father Photo', category: 'Father Details' },
  { id: 'father_email', label: 'Father Email', category: 'Father Details' },
  { id: 'father_income', label: 'Father Annual Income', category: 'Father Details' },
  { id: 'father_education', label: 'Father Education', category: 'Father Details' },
  { id: 'father_aadhar', label: 'Father Aadhar No', category: 'Father Details' },
  { id: 'father_dob', label: 'Father Date of Birth', category: 'Father Details' },
  
  // Mother Details
  { id: 'mother_name', label: 'Mother Name', category: 'Mother Details' },
  { id: 'mother_phone', label: 'Mother Phone', category: 'Mother Details' },
  { id: 'mother_occupation', label: 'Mother Occupation', category: 'Mother Details' },
  { id: 'mother_photo', label: 'Mother Photo', category: 'Mother Details' },
  { id: 'mother_income', label: 'Mother Annual Income', category: 'Mother Details' },
  { id: 'mother_education', label: 'Mother Education', category: 'Mother Details' },
  { id: 'mother_aadhar', label: 'Mother Aadhar No', category: 'Mother Details' },
  { id: 'mother_dob', label: 'Mother Date of Birth', category: 'Mother Details' },
  
  // Guardian Details
  { id: 'guardian_name', label: 'Guardian Name', category: 'Guardian Details' },
  { id: 'guardian_relation', label: 'Guardian Relation', category: 'Guardian Details' },
  { id: 'guardian_email', label: 'Guardian Email', category: 'Guardian Details' },
  { id: 'guardian_photo', label: 'Guardian Photo', category: 'Guardian Details' },
  { id: 'guardian_phone', label: 'Guardian Phone', category: 'Guardian Details' },
  { id: 'guardian_occupation', label: 'Guardian Occupation', category: 'Guardian Details' },
  { id: 'guardian_address', label: 'Guardian Address', category: 'Guardian Details' },
  
  // Address Details
  { id: 'pincode', label: 'Pincode', category: 'Address' },
  { id: 'city', label: 'City', category: 'Address' },
  { id: 'state', label: 'State', category: 'Address' },
  { id: 'current_address', label: 'Current Address', category: 'Address' },
  { id: 'permanent_address', label: 'Permanent Address', category: 'Address' },
  
  // Additional Details
  { id: 'student_house', label: 'House', category: 'Additional Details' },
  { id: 'height', label: 'Height', category: 'Additional Details' },
  { id: 'weight', label: 'Weight', category: 'Additional Details' },
  { id: 'as_on_date', label: 'Measurement Date', category: 'Additional Details' },
  
  // Miscellaneous
  { id: 'local_id', label: 'Local Identification Number', category: 'Miscellaneous' },
  { id: 'bank_account_no', label: 'Bank Account Number', category: 'Miscellaneous' },
  { id: 'bank_name', label: 'Bank Name', category: 'Miscellaneous' },
  { id: 'ifsc_code', label: 'IFSC Code', category: 'Miscellaneous' },
  { id: 'previous_school_details', label: 'Previous School Details', category: 'Miscellaneous' },
  { id: 'upload_documents', label: 'Upload Documents', category: 'Miscellaneous' },
  { id: 'rte_student', label: 'RTE Student', category: 'Miscellaneous' }
];

const OnlineAdmissionSetting = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [settings, setSettings] = useState({
    online_admission_enabled: false,
    payment_option_enabled: false,
    form_fees: 0,
    admission_form_file_url: '',
    instructions: '',
    terms_conditions: '',
    visible_fields: {}
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      console.log('Fetching settings via frontCmsService...');
      setLoading(true);
      const response = await frontCmsService.getOnlineAdmissionSettings();
      if (response.success) {
        // Ensure visible_fields is an object
        const data = response.data;
        if (!data.visible_fields) data.visible_fields = {};
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await frontCmsService.updateOnlineAdmissionSettings(settings);
      if (response.success) {
        toast({ title: 'Success', description: 'Settings saved successfully' });
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const toggleField = (fieldId) => {
    setSettings(prev => {
      const currentVisible = prev.visible_fields || {};
      return {
        ...prev,
        visible_fields: {
          ...currentVisible,
          [fieldId]: currentVisible[fieldId] === false ? true : false
        }
      };
    });
  };

  // Helper to check if field is visible (default true)
  const isFieldVisible = (fieldId) => {
    return settings?.visible_fields?.[fieldId] !== false;
  };

  const filteredFields = ADMISSION_FIELDS.filter(field => 
    field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group fields by category
  const groupedFields = filteredFields.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = [];
    }
    acc[field.category].push(field);
    return acc;
  }, {});

  if (loading) {
    return (
        <DashboardLayout>
            <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>
        </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
        <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Online Admission</h1>
        </div>

        <Tabs defaultValue="form_setting" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="form_setting">Online Admission Form Setting</TabsTrigger>
            <TabsTrigger value="fields_setting">Online Admission Fields Setting</TabsTrigger>
            </TabsList>

            <TabsContent value="form_setting" className="space-y-6 mt-6">
            <Card>
                <CardHeader>
                <CardTitle>General Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <Label htmlFor="online_admission">Online Admission</Label>
                    <Switch 
                    id="online_admission" 
                    checked={settings.online_admission_enabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, online_admission_enabled: checked }))}
                    />
                </div>
                
                <div className="flex items-center justify-between">
                    <Label htmlFor="payment_option">Online Admission Payment Option</Label>
                    <Switch 
                    id="payment_option" 
                    checked={settings.payment_option_enabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, payment_option_enabled: checked }))}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="form_fees">Online Admission Form Fees ($)</Label>
                    <Input 
                    id="form_fees" 
                    type="number" 
                    value={settings.form_fees}
                    onChange={(e) => setSettings(prev => ({ ...prev, form_fees: parseFloat(e.target.value) || 0 }))}
                    className="max-w-md"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Upload Admission Application Form</Label>
                    <div className="max-w-md">
                    <DocumentUploadField 
                        onUpload={(url) => setSettings(prev => ({ ...prev, admission_form_file_url: url }))}
                        label={settings.admission_form_file_url ? "Change File" : "Drag and drop a file here or click"}
                    />
                    {settings.admission_form_file_url && (
                        <div className="mt-2 text-sm text-green-600 flex items-center gap-2">
                            <a href={settings.admission_form_file_url} target="_blank" rel="noreferrer" className="underline">View Uploaded Form</a>
                        </div>
                    )}
                    </div>
                </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle>Online Admission Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                <ReactQuill 
                    theme="snow" 
                    value={settings.instructions || ''} 
                    onChange={(value) => setSettings(prev => ({ ...prev, instructions: value }))}
                    className="h-64 mb-12"
                />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle>Terms & Conditions</CardTitle>
                </CardHeader>
                <CardContent>
                <ReactQuill 
                    theme="snow" 
                    value={settings.terms_conditions || ''} 
                    onChange={(value) => setSettings(prev => ({ ...prev, terms_conditions: value }))}
                    className="h-64 mb-12"
                />
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save
                </Button>
            </div>
            </TabsContent>

            <TabsContent value="fields_setting" className="space-y-6 mt-6">
            <Card>
                <CardHeader>
                <CardTitle>Online Admission Form Fields</CardTitle>
                <div className="pt-4">
                    <div className="relative max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                    </div>
                </div>
                </CardHeader>
                <CardContent>
                <div className="space-y-6">
                    {Object.entries(groupedFields).map(([category, fields]) => (
                        <div key={category} className="space-y-2">
                            <h3 className="text-sm font-semibold text-primary border-b pb-2 mb-3">{category}</h3>
                            {fields.map((field) => (
                                <div key={field.id} className="flex items-center justify-between py-2 px-2 hover:bg-muted/50 rounded-md">
                                    <div className="text-sm font-medium">{field.label}</div>
                                    <Switch 
                                        checked={isFieldVisible(field.id)}
                                        onCheckedChange={() => toggleField(field.id)}
                                        className="data-[state=checked]:bg-green-600"
                                    />
                                </div>
                            ))}
                        </div>
                    ))}

                    {Object.keys(groupedFields).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        No fields found matching "{searchTerm}"
                    </div>
                    )}
                </div>
                </CardContent>
            </Card>
            
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save
                </Button>
            </div>
            </TabsContent>
        </Tabs>
        </div>
    </DashboardLayout>
  );
};

export default OnlineAdmissionSetting;
