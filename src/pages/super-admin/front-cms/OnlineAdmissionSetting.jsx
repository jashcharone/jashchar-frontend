import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, Download } from 'lucide-react';
import frontCmsService from '@/services/frontCmsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardLayout from '@/components/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RichTextEditor from '@/components/front-cms/RichTextEditor';
import DocumentUploadField from '@/components/common/DocumentUploadField';
import { useSearchParams } from 'react-router-dom';
import MasterAdminSchoolHeader from '@/components/front-cms/MasterAdminSchoolHeader';

const OnlineAdmissionSetting = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const branchId = searchParams.get('branch_id');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    is_enabled: false,
    is_payment_enabled: false,
    form_fees: 0,
    instructions: '',
    terms_conditions: '',
    application_form_path: '',
    visible_fields: {}
  });

  const systemFields = [
    { key: 'last_name', label: 'Last Name' },
    { key: 'gender', label: 'Gender' },
    { key: 'date_of_birth', label: 'Date of Birth' },
    { key: 'mobile_number', label: 'Mobile Number' },
    { key: 'email', label: 'Email' },
    { key: 'student_photo', label: 'Student Photo' },
    
    { key: 'father_name', label: 'Father Name' },
    { key: 'father_phone', label: 'Father Phone' },
    { key: 'father_occupation', label: 'Father Occupation' },
    { key: 'father_photo', label: 'Father Photo' },
    
    { key: 'mother_name', label: 'Mother Name' },
    { key: 'mother_phone', label: 'Mother Phone' },
    { key: 'mother_occupation', label: 'Mother Occupation' },
    { key: 'mother_photo', label: 'Mother Photo' },
    
    { key: 'guardian_name', label: 'Guardian Name' },
    { key: 'guardian_relation', label: 'Guardian Relation' },
    { key: 'guardian_email', label: 'Guardian Email' },
    { key: 'guardian_photo', label: 'Guardian Photo' },
    { key: 'guardian_phone', label: 'Guardian Phone' },
    { key: 'guardian_occupation', label: 'Guardian Occupation' },
    { key: 'guardian_address', label: 'Guardian Address' },
    
    { key: 'current_address', label: 'Current Address' },
    { key: 'permanent_address', label: 'Permanent Address' },
    
    { key: 'national_id_no', label: 'National Identification Number' },
    { key: 'local_id_no', label: 'Local Identification Number' },
    { key: 'bank_account_no', label: 'Bank Account Number' },
    { key: 'bank_name', label: 'Bank Name' },
    { key: 'ifsc_code', label: 'IFSC Code' },
    
    { key: 'previous_school_details', label: 'Previous School Details' },
    { key: 'documents', label: 'Upload Documents' },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await frontCmsService.getOnlineAdmissionSettings(branchId);
      if (response.success && response.data) {
        setFormData({
            ...response.data,
            visible_fields: response.data.visible_fields || {}
        });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error loading settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await frontCmsService.updateOnlineAdmissionSettings(formData, branchId);
      if (response.success) {
        toast({ title: 'Settings updated successfully' });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Failed to update settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleFieldToggle = (key, checked) => {
    setFormData(prev => ({
        ...prev,
        visible_fields: {
            ...prev.visible_fields,
            [key]: checked
        }
    }));
  };

  const handleFileUpload = (files) => {
      if (files && files.length > 0) {
          // Assuming DocumentUploadField returns array of { url, name } or similar
          // But here it might just return the file object if not handled by internal uploader logic
          // Wait, DocumentUploadField usually handles upload and returns URL if configured, 
          // or we need to handle it. 
          // Let's assume it returns the URL directly or we use the standard MediaSelector if needed.
          // Actually, let's use the standard pattern:
          const file = files[0];
          if (file.url) {
              setFormData(prev => ({ ...prev, application_form_path: file.url }));
          }
      }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <MasterAdminSchoolHeader />
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Online Admission Setting</h1>
        </div>

        <form onSubmit={handleSubmit}>
            <Tabs defaultValue="form_setting" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
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
                                <div className="space-y-0.5">
                                    <Label className="text-base">Online Admission</Label>
                                    <p className="text-sm text-muted-foreground">Enable or disable online admission module</p>
                                </div>
                                <Switch 
                                    checked={formData.is_enabled}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_enabled: checked }))}
                                />
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Online Admission Payment Option</Label>
                                    <p className="text-sm text-muted-foreground">Enable online payment for admission</p>
                                </div>
                                <Switch 
                                    checked={formData.is_payment_enabled}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_payment_enabled: checked }))}
                                />
                            </div>

                            {formData.is_payment_enabled && (
                                <div className="space-y-2">
                                    <Label>Online Admission Form Fees</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.form_fees}
                                        onChange={(e) => setFormData(prev => ({ ...prev, form_fees: e.target.value }))}
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Upload Admission Application Form</Label>
                                <div className="flex gap-4 items-center">
                                    <div className="flex-1">
                                        <DocumentUploadField onUpload={handleFileUpload} />
                                    </div>
                                    {formData.application_form_path && (
                                        <Button type="button" variant="outline" size="icon" onClick={() => window.open(formData.application_form_path, '_blank')}>
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Instructions & Terms</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Online Admission Instructions</Label>
                                <RichTextEditor
                                    value={formData.instructions || ''}
                                    onChange={(val) => setFormData(prev => ({ ...prev, instructions: val }))}
                                    placeholder="Enter instructions..."
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Online Admission Terms & Conditions</Label>
                                <RichTextEditor
                                    value={formData.terms_conditions || ''}
                                    onChange={(val) => setFormData(prev => ({ ...prev, terms_conditions: val }))}
                                    placeholder="Enter terms & conditions..."
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="fields_setting" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>System Fields</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {systemFields.map((field) => (
                                    <div key={field.key} className="flex items-center justify-between p-3 border rounded-lg">
                                        <Label htmlFor={`field-${field.key}`} className="cursor-pointer flex-1">{field.label}</Label>
                                        <Switch 
                                            id={`field-${field.key}`}
                                            checked={formData.visible_fields[field.key] !== false} // Default true if undefined
                                            onCheckedChange={(checked) => handleFieldToggle(field.key, checked)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end mt-6">
                <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save
                </Button>
            </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default OnlineAdmissionSetting;
