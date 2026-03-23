import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2, Save, X, MapPin, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowLeft } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const PickupPoints = () => {
  const navigate = useNavigate();
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPoint, setEditingPoint] = useState(null);
  const [formData, setFormData] = useState({ name: '', latitude: '', longitude: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const fetchPickupPoints = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    
    let query = supabase
      .from('transport_pickup_points')
      .select('*')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching pickup points', description: error.message });
    } else {
      setPoints(data || []);
    }
    setLoading(false);
  }, [branchId, toast]);

  useEffect(() => {
    fetchPickupPoints();
  }, [fetchPickupPoints]);

  const handleEdit = (point) => {
    setEditingPoint(point);
    setFormData({ name: point.name, latitude: point.latitude || '', longitude: point.longitude || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingPoint(null);
    setFormData({ name: '', latitude: '', longitude: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ variant: 'destructive', title: 'Pickup point name is required.' });
      return;
    }
    setIsSubmitting(true);

    let error;
    if (editingPoint) {
      // UPDATE - only update the fields that changed
      const updateData = {
        name: formData.name.trim(),
        latitude: formData.latitude?.trim() || null,
        longitude: formData.longitude?.trim() || null,
        updated_at: new Date().toISOString()
      };
      
      console.log('[PickupPoints] Updating point:', editingPoint.id, updateData);
      
      ({ error } = await supabase
        .from('transport_pickup_points')
        .update(updateData)
        .eq('id', editingPoint.id)
        .eq('branch_id', branchId)); // Ensure we only update our branch's data
    } else {
      // INSERT - include branch_id for new record
      const insertData = {
        name: formData.name.trim(),
        latitude: formData.latitude?.trim() || null,
        longitude: formData.longitude?.trim() || null,
        branch_id: branchId
      };
      
      console.log('[PickupPoints] Inserting new point:', insertData);
      
      ({ error } = await supabase
        .from('transport_pickup_points')
        .insert(insertData));
    }

    if (error) {
      console.error('[PickupPoints] Error:', error);
      toast({ variant: 'destructive', title: `Error ${editingPoint ? 'updating' : 'creating'} point`, description: error.message });
    } else {
      toast({ title: 'Success!', description: `Pickup point successfully ${editingPoint ? 'updated' : 'created'}.` });
      await fetchPickupPoints();
      handleCancel();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (pointId) => {
    const { error } = await supabase.from('transport_pickup_points').delete().eq('id', pointId);
    if (error) {
      toast({ variant: 'destructive', title: 'Error deleting point', description: error.message });
    } else {
      toast({ title: 'Success!', description: 'Pickup point deleted successfully.' });
      await fetchPickupPoints();
    }
  };

  const openMap = (lat, lon) => {
    if (lat && lon) {
      window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`, '_blank');
    } else {
      toast({ variant: 'destructive', title: 'Coordinates not available.' });
    }
  };

  // Pagination
  const totalPages = Math.ceil(points.length / itemsPerPage);
  const paginatedPoints = points.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Back Button */}
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left - Add/Edit Form */}
          <div className="xl:col-span-1">
            <div className="bg-card text-card-foreground rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">{editingPoint ? 'Edit Pickup Point' : 'Add Pickup Point'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                    Click here to get latitude and longitude (Optional)
                  </a>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Pickup Point *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required placeholder="e.g. Main Gate" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input id="latitude" value={formData.latitude} onChange={(e) => setFormData({...formData, latitude: e.target.value})} placeholder="e.g. 28.6139" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input id="longitude" value={formData.longitude} onChange={(e) => setFormData({...formData, longitude: e.target.value})} placeholder="e.g. 77.2090" />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save
                </Button>
                {editingPoint && (
                  <Button type="button" variant="outline" className="w-full" onClick={handleCancel}>
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                )}
              </form>
            </div>
          </div>

          {/* Right - List */}
          <div className="xl:col-span-2">
            <div className="bg-card text-card-foreground rounded-xl shadow-lg">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Pickup Points List</h2>
                {loading ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : points.length === 0 ? (
                  <div className="text-center py-16">
                    <MapPin className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No pickup points found</p>
                    <p className="text-sm text-muted-foreground mt-1">Add one to get started</p>
                  </div>
                ) : (
                  <>
                    <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-foreground uppercase bg-muted/50 sticky top-0 bg-background z-10">
                          <tr>
                            <th className="px-4 py-3 w-12">#</th>
                            <th className="px-4 py-3">Pickup Point</th>
                            <th className="px-4 py-3">Latitude</th>
                            <th className="px-4 py-3">Longitude</th>
                            <th className="px-4 py-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedPoints.map((point, index) => (
                            <tr key={point.id} className="border-b border-border hover:bg-muted/50">
                              <td className="px-4 py-3">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                              <td className="px-4 py-3 font-medium text-foreground">{point.name}</td>
                              <td className="px-4 py-3">{point.latitude || 'N/A'}</td>
                              <td className="px-4 py-3">{point.longitude || 'N/A'}</td>
                              <td className="px-4 py-3 text-center space-x-2">
                                {point.latitude && point.longitude && (
                                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openMap(point.latitude, point.longitude)}>
                                    <MapPin className="h-4 w-4 text-blue-500" />
                                  </Button>
                                )}
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEdit(point)}>
                                  <Edit className="h-4 w-4 text-yellow-500" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon" className="h-8 w-8">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the pickup point.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(point.id)} className="bg-destructive hover:bg-destructive/90">
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4 text-sm">
                      <span className="text-muted-foreground">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, points.length)} of {points.length} entries</span>
                      <div className="flex items-center gap-2">
                        <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                          <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}><ChevronsLeft className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                        <span className="px-2">Page {currentPage} of {totalPages}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}><ChevronsRight className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PickupPoints;
