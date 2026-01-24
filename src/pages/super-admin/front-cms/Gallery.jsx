import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import frontCmsService from '@/services/frontCmsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PermissionButton } from '@/components/PermissionComponents';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import MasterAdminSchoolHeader from '@/components/front-cms/MasterAdminSchoolHeader';

const Gallery = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isMasterAdmin = location.pathname.startsWith('/master-admin');
  const { user } = useAuth();
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [schoolSlug, setSchoolSlug] = useState('');

  useEffect(() => {
    loadGalleries();
    fetchSchoolSlug();
  }, []);

  const fetchSchoolSlug = async () => {
    let targetId = user?.user_metadata?.branch_id;
    if (isMasterAdmin) {
        targetId = sessionStorage.getItem('ma_target_branch_id');
    }
    
    if (!targetId) return;

    try {
      const { data, error } = await supabase
        .from('schools')
        .select('slug')
        .eq('id', targetId)
        .single();
      
      if (data) setSchoolSlug(data.slug);
    } catch (err) {
      console.error("Error fetching school slug:", err);
    }
  };

  const loadGalleries = async () => {
    setLoading(true);
    try {
      const response = await frontCmsService.getGalleries();
      if (response.success) {
        setGalleries(response.data || []);
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error loading galleries' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGallery = async (id) => {
    if (!confirm('Are you sure you want to delete this gallery?')) return;
    try {
      const response = await frontCmsService.deleteGallery(id);
      if (response.success) {
        toast({ title: 'Gallery deleted successfully' });
        loadGalleries();
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Delete failed' });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <MasterAdminSchoolHeader />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gallery List</CardTitle>
          <PermissionButton 
            moduleSlug="front_cms.gallery" 
            action="add"
            onClick={() => navigate(isMasterAdmin ? '/master-admin/front-cms/gallery/add' : '/super-admin/front-cms/gallery/add')}
            className="bg-gray-600 hover:bg-gray-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" /> Add
          </PermissionButton>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>URL</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : galleries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                    No galleries found
                  </TableCell>
                </TableRow>
              ) : (
                galleries.map((gallery) => (
                  <TableRow key={gallery.id}>
                    <TableCell className="font-medium">{gallery.title}</TableCell>
                    <TableCell className="text-blue-600 truncate max-w-xs">
                      {schoolSlug ? (
                        <a 
                          href={`${window.location.origin.replace(':3005', ':3006')}/${schoolSlug}/read/${gallery.id}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center hover:underline"
                        >
                          {`/read/${gallery.id}`}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      ) : (
                        <span className="text-gray-400">Loading link...</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <PermissionButton 
                          moduleSlug="front_cms.gallery" 
                          action="edit"
                          variant="ghost" 
                          size="icon" 
                          onClick={() => navigate(isMasterAdmin ? `/master-admin/front-cms/gallery/edit/${gallery.id}` : `/super-admin/front-cms/gallery/edit/${gallery.id}`)}
                        >
                          <Pencil className="h-4 w-4 text-gray-600" />
                        </PermissionButton>
                        <PermissionButton 
                          moduleSlug="front_cms.gallery" 
                          action="delete"
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteGallery(gallery.id)}
                        >
                          <Trash2 className="h-4 w-4 text-gray-600" />
                        </PermissionButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  );
};

export default Gallery;
