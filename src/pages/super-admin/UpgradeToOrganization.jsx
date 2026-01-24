import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Building2, ArrowRight, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';

const UpgradeToOrganization = () => {
  const { user, school } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      currentSchoolBranchName: school?.name || ''
    }
  });

  const onSubmit = async (data) => {
    if (!school?.id) return;
    
    setLoading(true);
    try {
      const response = await api.post(`/schools/${school.id}/upgrade`, {
        organizationName: data.organizationName,
        currentSchoolBranchName: data.currentSchoolBranchName
      });

      if (response.data.success) {
        toast({
          title: "Upgrade Successful!",
          description: "Your school has been upgraded to an Organization structure. Please login again to see changes.",
          variant: "default",
          className: "bg-green-600 text-white"
        });
        
        // Redirect to login or dashboard after short delay
        setTimeout(() => {
            // Force logout or refresh to update context
            window.location.href = '/login';
        }, 2000);
      }
    } catch (error) {
      console.error("Upgrade failed:", error);
      toast({
        title: "Upgrade Failed",
        description: error.response?.data?.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (school?.registration_type === 'organization' || school?.registration_type === 'organization_multi_branch') {
    return (
      <div className="p-8 flex justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-green-600 flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Already Upgraded
            </CardTitle>
            <CardDescription>
              Your institution is already registered as an Organization ({school.name}).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/school-owner/dashboard')}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Upgrade to Organization</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Transform your single school into a multi-branch organization structure.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="border-l-4 border-l-indigo-500 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-indigo-100 p-2 rounded-full text-indigo-600 font-bold">1</div>
              <div>
                <h4 className="font-semibold">Create Organization</h4>
                <p className="text-sm text-gray-600">We will create a new Organization entity (e.g., "S V Group of Institutions").</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-indigo-100 p-2 rounded-full text-indigo-600 font-bold">2</div>
              <div>
                <h4 className="font-semibold">Convert Current School</h4>
                <p className="text-sm text-gray-600">Your current school ("{school?.name}") will become the <strong>Main Branch</strong> of this organization.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-indigo-100 p-2 rounded-full text-indigo-600 font-bold">3</div>
              <div>
                <h4 className="font-semibold">Data Migration</h4>
                <p className="text-sm text-gray-600">All your existing students, staff, and data will be automatically moved to this Main Branch. No data loss.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>Enter the details for your new organization structure.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="space-y-2">
                <Label htmlFor="organizationName">New Organization Name <span className="text-red-500">*</span></Label>
                <Input 
                  id="organizationName" 
                  placeholder="e.g. S V Group of Institutions" 
                  {...register("organizationName", { required: "Organization Name is required" })}
                />
                {errors.organizationName && <p className="text-sm text-red-500">{errors.organizationName.message}</p>}
                <p className="text-xs text-gray-500">This will be the main name of your group.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentSchoolBranchName">Current School Branch Name <span className="text-red-500">*</span></Label>
                <Input 
                  id="currentSchoolBranchName" 
                  placeholder="e.g. S V High School (Main Branch)" 
                  {...register("currentSchoolBranchName", { required: "Branch Name is required" })}
                />
                {errors.currentSchoolBranchName && <p className="text-sm text-red-500">{errors.currentSchoolBranchName.message}</p>}
                <p className="text-xs text-gray-500">Your existing school will be renamed to this branch name.</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex gap-3 items-start">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <strong>Important:</strong> This action cannot be undone. Once upgraded, your system will permanently switch to the Multi-Branch structure.
                </div>
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Upgrading...
                  </>
                ) : (
                  <>
                    Upgrade to Organization <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UpgradeToOrganization;
