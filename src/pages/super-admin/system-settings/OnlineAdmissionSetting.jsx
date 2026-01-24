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
  { id: 'student_last_name', label: 'Last Name' },
  { id: 'student_email', label: 'Email' },
  { id: 'student_photo', label: 'Student Photo' },
  
  { id: 'father_name', label: 'Father Name' },
  { id: 'father_phone', label: 'Father Phone' },
  { id: 'father_occupation', label: 'Father Occupation' },
  { id: 'father_photo', label: 'Father Photo' },
  
  { id: 'mother_name', label: 'Mother Name' },
  { id: 'mother_phone', label: 'Mother Phone' },
  { id: 'mother_occupation', label: 'Mother Occupation' },
  { id: 'mother_photo', label: 'Mother Photo' },
  
  { id: 'guardian_name', label: 'Guardian Name' },
  { id: 'guardian_relation', label: 'Guardian Relation' },
  { id: 'guardian_email', label: 'Guardian Email' },
  { id: 'guardian_photo', label: 'Guardian Photo' },
  { id: 'guardian_phone', label: 'Guardian Phone' },
  { id: 'guardian_occupation', label: 'Guardian Occupation' },
  { id: 'guardian_address', label: 'Guardian Address' },
  
  { id: 'current_address', label: 'Current Address' },
  { id: 'permanent_address', label: 'Permanent Address' },
  
  { id: 'national_id', label: 'National Identification Number' },
  { id: 'local_id', label: 'Local Identification Number' },
  { id: 'bank_account_no', label: 'Bank Account Number' },
  { id: 'bank_name', label: 'Bank Name' },
  { id: 'ifsc_code', label: 'IFSC Code' },
  { id: 'previous_school_details', label: 'Previous School Details' },
  { id: 'upload_documents', label: 'Upload Documents' }
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
    field.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                <div className="space-y-4">
                    <div className="grid grid-cols-12 font-medium text-sm text-muted-foreground border-b pb-2 mb-4">
                    <div className="col-span-10">Name</div>
                    <div className="col-span-2 text-right">Action</div>
                    </div>
                    
                    {filteredFields.map((field) => (
                    <div key={field.id} className="grid grid-cols-12 items-center py-2 border-b last:border-0">
                        <div className="col-span-10 text-sm font-medium">{field.label}</div>
                        <div className="col-span-2 flex justify-end">
                        <Switch 
                            checked={isFieldVisible(field.id)}
                            onCheckedChange={() => toggleField(field.id)}
                            className="data-[state=checked]:bg-green-600"
                        />
                        </div>
                    </div>
                    ))}

                    {filteredFields.length === 0 && (
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
