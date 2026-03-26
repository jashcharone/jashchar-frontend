import React, { useState, useEffect } from 'react';
import { formatDate } from '@/utils/dateUtils';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Trash2, Building, Mail, Phone, MapPin, Globe } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const isValidUUID = (uuid) => {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
};

const SchoolDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !isValidUUID(id)) {
      // If ID is invalid (e.g. "new"), do not attempt fetch.
      // This component should not be rendered for "new", but if it is, fail gracefully.
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('*, subscription_plans:subscription_plans!schools_plan_id_fkey(name)')
        .eq('id', id)
        .maybeSingle();
      
      if (error || !data) {
        toast({ variant: 'destructive', title: 'Error', description: 'School not found.' });
        navigate('/master-admin/schools');
      } else {
        setSchool(data);
      }
      setLoading(false);
    };
    fetchDetails();
  }, [id, navigate, toast]);

  if (loading) return <DashboardLayout><div className="p-8">Loading...</div></DashboardLayout>;
  
  // If ID was invalid or school not found, return null (or could show error state)
  if (!school) return null;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/master-admin/schools')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">{school.name}</h1>
            <Badge variant={school.status === 'Active' ? 'default' : 'destructive'}>{school.status}</Badge>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate(`/master-admin/schools/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">General Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3"><Building className="h-4 w-4 text-muted-foreground" /> <div><div className="text-sm font-medium">School Code</div><div className="text-sm text-muted-foreground">{school.enrollment_id_number || 'N/A'}</div></div></div>
              <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /> <div><div className="text-sm font-medium">Email</div><div className="text-sm text-muted-foreground">{school.contact_email}</div></div></div>
              <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /> <div><div className="text-sm font-medium">Phone</div><div className="text-sm text-muted-foreground">{school.contact_number || 'N/A'}</div></div></div>
              <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-muted-foreground" /> <div><div className="text-sm font-medium">Address</div><div className="text-sm text-muted-foreground">{school.address || 'N/A'}</div></div></div>
              <div className="flex items-center gap-3"><Globe className="h-4 w-4 text-muted-foreground" /> <div><div className="text-sm font-medium">Website Slug</div><div className="text-sm text-muted-foreground">{school.cms_url_alias || 'N/A'}</div></div></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Subscription & Meta</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><div className="text-sm font-medium">Current Plan</div><Badge variant="outline">{school.subscription_plans?.name || 'No Plan'}</Badge></div>
              <div><div className="text-sm font-medium">Board Type</div><div className="text-sm text-muted-foreground">{school.site_board_type || 'N/A'}</div></div>
              <div><div className="text-sm font-medium">Joined Date</div><div className="text-sm text-muted-foreground">{formatDate(school.created_at)}</div></div>
              <div><div className="text-sm font-medium">School ID</div><div className="text-xs font-mono bg-slate-100 p-1 rounded">{school.id}</div></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SchoolDetails;
