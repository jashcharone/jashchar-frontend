import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, School, ArrowRight, Check } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

const SchoolSelector = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState(sessionStorage.getItem('ma_target_branch_id') || '');

  useEffect(() => {
    // Validate stored ID on mount
    const storedId = sessionStorage.getItem('ma_target_branch_id');
    if (storedId === 'null' || storedId === 'undefined') {
        sessionStorage.removeItem('ma_target_branch_id');
        setSelectedSchoolId('');
    }
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      // Fetch ONLY Organizations (Primary Schools) - NOT branches
      const { data, error } = await supabase
        .from('schools')
        .select(`
          id, 
          name, 
          slug, 
          city, 
          is_primary,
          sequence,
          contact_number,
          organizations (
            name,
            code,
            city
          )
        `)
        .eq('is_primary', true) // CRITICAL: Only show Organization Primary Schools, NOT branches
        .order('name');
      
      if (error) throw error;
      
      console.log('[SchoolSelector] Fetched schools (organizations only):', data?.length || 0);
      console.log('[SchoolSelector] Sample data:', data?.[0]);
      
      setSchools(data || []);
    } catch (error) {
      console.error('[SchoolSelector] Error fetching schools:', error);
      toast({ variant: 'destructive', title: 'Failed to load schools' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (school) => {
    sessionStorage.setItem('ma_target_branch_id', school.id);
    setSelectedSchoolId(school.id);
    toast({ title: 'School Selected', description: `Now managing Front CMS for ${school.name}` });
    // Navigate to website settings by default
    navigate(`/master-admin/front-cms/website-settings?branch_id=${school.id}`);
  };

  const filteredSchools = schools.filter(s => {
    const searchLower = search.toLowerCase();
    const orgName = s.organizations?.name || s.name || '';
    const orgCode = s.organizations?.code || s.slug || '';
    const city = s.organizations?.city || s.city || '';
    
    return orgName.toLowerCase().includes(searchLower) || 
           orgCode.toLowerCase().includes(searchLower) ||
           city.toLowerCase().includes(searchLower);
  });

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Front CMS Manager</h1>
            <p className="text-muted-foreground">Select a school to manage their website settings</p>
          </div>
          {selectedSchoolId && (
            <Button variant="outline" onClick={() => {
                sessionStorage.removeItem('ma_target_branch_id');
                setSelectedSchoolId('');
            }}>
                Clear Selection
            </Button>
          )}
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search schools by name or slug..." 
              className="pl-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSchools.map(school => (
            <Card 
                key={school.id} 
                className={`cursor-pointer transition-all hover:border-primary ${selectedSchoolId === school.id ? 'border-primary bg-primary/5' : ''}`}
                onClick={() => handleSelect(school)}
            >
              <CardContent className="p-4 flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <School className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold truncate">
                    {school.organizations?.name || school.name}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate font-mono">
                    {school.organizations?.code || school.slug || 'No Code'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                     <span className="opacity-70">📍</span> {school.organizations?.city || school.city || 'No Location'}
                  </p>
                </div>
                {selectedSchoolId === school.id && (
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                    </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {filteredSchools.length === 0 && !loading && (
            <div className="col-span-full text-center py-10 text-muted-foreground">
              No schools found matching "{search}"
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SchoolSelector;
