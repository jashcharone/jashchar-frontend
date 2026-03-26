import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2 } from 'lucide-react';
import { seedCmsDemoData } from '@/utils/seedCmsDemoData';
import UnifiedFrontCmsEditor from '@/components/front-cms/UnifiedFrontCmsEditor';

const FrontCmsMasterAdmin = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState(searchParams.get('branch_id') || '');
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const id = searchParams.get('branch_id');
    if (id) {
      setSelectedSchoolId(id);
      sessionStorage.setItem('ma_target_branch_id', id);
    }
  }, [searchParams]);

  const handleSchoolChange = (newId) => {
    setSelectedSchoolId(newId);
    setSearchParams({ branch_id: newId });
    sessionStorage.setItem('ma_target_branch_id', newId);
  };

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const { data, error } = await supabase
          .from('schools')
          .select('id, name, status')
          .eq('status', 'Active')
          .eq('is_primary', true)
          .order('name');
        if (error) throw error;
        setSchools(data || []);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load schools' });
      } finally {
        setLoadingSchools(false);
      }
    };
    fetchSchools();
  }, [toast]);

  const handleSeedData = async () => {
    if (!selectedSchoolId) return;
    setSeeding(true);
    const result = await seedCmsDemoData(selectedSchoolId);
    setSeeding(false);
    if (result.success) {
      toast({ 
        title: result.status === 'seeded' ? 'Data Seeded' : 'Data Exists', 
        description: result.status === 'seeded' ? 'Demo content injected successfully.' : 'Settings already exist, skipped seeding.' 
      });
      window.location.reload(); 
    } else {
      toast({ variant: 'destructive', title: 'Seed Failed', description: result.message });
    }
  };

  if (loadingSchools) {
    return (<DashboardLayout><div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div></DashboardLayout>);
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Front CMS Manager</h1>
            <p className="text-slate-500 dark:text-slate-400">Manage public websites for all schools.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-64">
              <Select value={selectedSchoolId} onValueChange={handleSchoolChange}>
                <SelectTrigger className="bg-white dark:bg-slate-800"><SelectValue placeholder="Select School" /></SelectTrigger>
                <SelectContent>{schools.map(s => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            {selectedSchoolId && (<Button variant="outline" size="sm" onClick={handleSeedData} disabled={seeding}>{seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Seed Demo Data</Button>)}
          </div>
        </div>
        <UnifiedFrontCmsEditor branchId={selectedSchoolId} role="master_admin" basePath="/master-admin/front-cms" />
      </div>
    </DashboardLayout>
  );
};

export default FrontCmsMasterAdmin;
