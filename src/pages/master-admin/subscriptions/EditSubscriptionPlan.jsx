import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Save, Users, UserCheck, Loader2, ArrowLeft } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import PlanModuleForm from '@/components/PlanModuleForm';
import { planModuleService } from '@/services/planModuleService'; // Use NEW service

const EditSubscriptionPlan = () => {
  const { id: planId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    discount: '',
    is_recommended: false,
    is_free_trial: false,
    no_of_students: '',
    no_of_staffs: '',
    subscription_period_type: 'Days',
    subscription_period_value: '',
    modules: [],
    show_on_website: false,
    status: true,
    plan_type: 'Prepaid',
    description: '',
    tagline: '',
    per_student_charge: '',
    per_staff_charge: '',
    gst_percentage: '18',
    max_branches_allowed: 1
  });

  useEffect(() => {
    const fetchPlan = async () => {
        if (!planId) return;
        setLoading(true);
        
        try {
            // 1. Fetch Plan Details
            const { data: plan, error: planError } = await supabase
                .from('subscription_plans')
                .select('*')
                .eq('id', planId)
                .single();

            if (planError) throw planError;

            // 2. Fetch Linked Modules (including sub-modules) - use new method
            const moduleSlugs = await planModuleService.getModuleSlugsForPlan(planId);

            setFormData({
                name: plan.name || '',
                price: plan.price || '',
                discount: plan.discount || '',
                is_recommended: plan.is_recommended || false,
                is_free_trial: plan.is_free_trial || false,
                no_of_students: plan.no_of_students || '',
                no_of_staffs: plan.no_of_staffs || '',
                subscription_period_type: plan.subscription_period_type || 'Days',
                subscription_period_value: plan.subscription_period_value || '',
                modules: moduleSlugs, // Use fetched modules
                show_on_website: plan.show_on_website || false,
                status: plan.status || false,
                plan_type: plan.plan_type || 'Prepaid',
                description: plan.description || '',
                tagline: plan.tagline || '',
                per_student_charge: plan.per_student_charge || '',
                per_staff_charge: plan.per_staff_charge || '',
                gst_percentage: plan.gst_percentage || '18',
                max_branches_allowed: plan.max_branches_allowed || 1
            });
        } catch (error) {
            console.error("Error loading plan:", error);
            toast({ variant: 'destructive', title: 'Error loading plan', description: error.message });
            navigate('/master-admin/subscription-plans');
        } finally {
            setLoading(false);
        }
    };

    fetchPlan();
  }, [planId, navigate, toast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleValueChange = (name, value) => {
    setFormData(prev => ({...prev, [name]: value}));
  }

  const handleCheckboxChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  }
  
  const handleModuleSelectionChange = (newSelection) => {
      setFormData(prev => ({ ...prev, modules: newSelection }));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const dataToSubmit = {
      name: formData.name,
      description: formData.description,
      tagline: formData.tagline,
      subscription_period_type: formData.subscription_period_type,
      subscription_period_value: formData.subscription_period_value || null,
      is_recommended: formData.is_recommended,
      is_free_trial: formData.is_free_trial,
      // modules: formData.modules, // Handled separately
      show_on_website: formData.show_on_website,
      status: formData.status,
      plan_type: formData.plan_type,
      gst_percentage: formData.gst_percentage,
      price: formData.plan_type === 'Prepaid' ? formData.price : null,
      no_of_students: formData.plan_type === 'Prepaid' ? formData.no_of_students : null,
      no_of_staffs: formData.plan_type === 'Prepaid' ? formData.no_of_staffs : null,
      per_student_charge: formData.plan_type === 'Postpaid' ? formData.per_student_charge : null,
      per_staff_charge: formData.plan_type === 'Postpaid' ? formData.per_staff_charge : null,
      discount: formData.discount || null,
      max_branches_allowed: formData.max_branches_allowed || 1
    };

    try {
        // 1. Update Plan in Supabase
        const { error: updateError } = await supabase
            .from('subscription_plans')
            .update(dataToSubmit)
            .eq('id', planId);

        if (updateError) throw updateError;

        // 2. Update Modules using Service
        const result = await planModuleService.setModulesForPlan(planId, formData.modules);
        if (!result.success) {
             console.error("Module update error:", result.error);
             toast({ variant: 'warning', title: 'Plan updated but modules failed', description: result.error });
        }

        toast({ title: 'Success', description: 'Subscription plan updated successfully.' });
        navigate('/master-admin/subscription-plans');
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error updating plan', description: error.message });
    } finally {
        setSaving(false);
    }
  };

  if (loading) {
      return <DashboardLayout><div className="flex justify-center p-10"><Loader2 className="animate-spin h-8 w-8" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/master-admin/subscription-plans')}>
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Edit Subscription Plan</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-card rounded-xl shadow-lg p-8 border">
            <div className="mb-6">
                <Label className="text-base font-semibold">Type *</Label>
                <RadioGroup value={formData.plan_type} onValueChange={(v) => handleValueChange('plan_type', v)} className="flex items-center gap-6 mt-2">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Prepaid" id="r_prepaid" /><Label htmlFor="r_prepaid">Prepaid</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Postpaid" id="r_postpaid" /><Label htmlFor="r_postpaid">Postpaid</Label></div>
                </RadioGroup>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                 <div><Label htmlFor="name">Name *</Label><Input id="name" name="name" value={formData.name} onChange={handleInputChange} required /></div>
                 <div><Label htmlFor="description">Description</Label><Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} /></div>
                 <div className="md:col-span-2"><Label htmlFor="tagline">Tagline</Label><Input id="tagline" name="tagline" value={formData.tagline} onChange={handleInputChange} /></div>
            </div>

            <div className="mb-8">
                <Label>Subscription Period</Label>
                <div className="grid grid-cols-2 gap-4 max-w-md">
                    <Select value={formData.subscription_period_type} onValueChange={(v) => handleValueChange('subscription_period_type', v)}>
                        <SelectTrigger><SelectValue placeholder="Period" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Days">Days</SelectItem>
                            <SelectItem value="Months">Months</SelectItem>
                            <SelectItem value="Years">Years</SelectItem>
                            <SelectItem value="Lifetime">Lifetime</SelectItem>
                        </SelectContent>
                    </Select>
                    {formData.subscription_period_type !== 'Lifetime' &&
                        <Input name="subscription_period_value" type="number" value={formData.subscription_period_value} onChange={handleInputChange} placeholder={`Enter no. of ${formData.subscription_period_type}`} />
                    }
                </div>
            </div>

            {formData.plan_type === 'Prepaid' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div><Label htmlFor="no_of_students" className="flex items-center"><Users className="w-4 h-4 mr-1"/>No. Of Students (Active) *</Label><Input id="no_of_students" name="no_of_students" type="number" value={formData.no_of_students} onChange={handleInputChange} required /></div>
                    <div><Label htmlFor="no_of_staffs" className="flex items-center"><UserCheck className="w-4 h-4 mr-1"/>No. Of Staffs (Active) *</Label><Input id="no_of_staffs" name="no_of_staffs" type="number" value={formData.no_of_staffs} onChange={handleInputChange} required /></div>
                    <div><Label htmlFor="price">Charges (₹) *</Label><Input id="price" name="price" type="number" value={formData.price} onChange={handleInputChange} required /></div>
                </div>
            )}
            
            {formData.plan_type === 'Postpaid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div><Label htmlFor="per_student_charge">Per Active Student Charges (₹) *</Label><Input id="per_student_charge" name="per_student_charge" type="number" value={formData.per_student_charge} onChange={handleInputChange} required /></div>
                    <div><Label htmlFor="per_staff_charge">Per Active Staff Charges (₹) *</Label><Input id="per_staff_charge" name="per_staff_charge" type="number" value={formData.per_staff_charge} onChange={handleInputChange} required /></div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div><Label htmlFor="gst_percentage">GST Percentage (%)</Label><Input id="gst_percentage" name="gst_percentage" type="number" value={formData.gst_percentage} onChange={handleInputChange} /></div>
                <div><Label htmlFor="discount">Discount (₹)</Label><Input id="discount" name="discount" type="number" value={formData.discount} onChange={handleInputChange} /></div>
            </div>

            <div className="mb-6">
                <Label htmlFor="max_branches_allowed">Max Branches Allowed *</Label>
                <Input 
                    id="max_branches_allowed" 
                    name="max_branches_allowed" 
                    type="number" 
                    min="1"
                    value={formData.max_branches_allowed} 
                    onChange={handleInputChange} 
                    required 
                    className="max-w-md"
                />
                <p className="text-sm text-muted-foreground mt-1">Set to 1 for Single School plans. Set higher (e.g. 10, 100) for Multi-Branch plans.</p>
            </div>
        </div>

        {/* Modules Section - Dynamic */}
        <div className="bg-card rounded-xl shadow-lg p-8 border">
            <Label className="text-base font-semibold mb-4 block">Modules</Label>
            
            <PlanModuleForm 
                selectedModules={formData.modules} 
                onChange={handleModuleSelectionChange} 
            />

            <div className="flex items-center space-x-6 mb-8 pt-6 border-t mt-6">
                <div className="flex items-center space-x-2"><Checkbox id="is_recommended" checked={formData.is_recommended} onCheckedChange={(c) => handleCheckboxChange('is_recommended', c)} /><Label htmlFor="is_recommended">Recommended</Label></div>
                <div className="flex items-center space-x-2"><Checkbox id="is_free_trial" checked={formData.is_free_trial} onCheckedChange={(c) => handleCheckboxChange('is_free_trial', c)} /><Label htmlFor="is_free_trial">Free Trial</Label></div>
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t">
                <div className="flex items-center space-x-2">
                    <Switch id="show_on_website" checked={formData.show_on_website} onCheckedChange={(c) => handleCheckboxChange('show_on_website', c)} />
                    <Label htmlFor="show_on_website">Show on Website</Label>
                </div>
                 <div className="flex items-center space-x-2">
                    <Label htmlFor="status">{formData.status ? 'Active' : 'Inactive'}</Label>
                    <Switch id="status" checked={formData.status} onCheckedChange={(c) => handleCheckboxChange('status', c)} />
                </div>
            </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-6 rounded-lg">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Update Plan
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
};

export default EditSubscriptionPlan;
