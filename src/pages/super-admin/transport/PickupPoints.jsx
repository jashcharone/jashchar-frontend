import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Save, X, MapPin, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
  const { user, currentSessionId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState(null);
  const [formData, setFormData] = useState({ name: '', latitude: '', longitude: '' });

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

  const handleOpenDialog = (point = null) => {
    setEditingPoint(point);
    setFormData(point ? { name: point.name, latitude: point.latitude || '', longitude: point.longitude || '' } : { name: '', latitude: '', longitude: '' });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
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

    const upsertData = {
        name: formData.name,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        branch_id: branchId
    };

    let error;
    if (editingPoint) {
      ({ error } = await supabase
        .from('transport_pickup_points')
        .update(upsertData)
        .eq('id', editingPoint.id));
    } else {
      ({ error } = await supabase
        .from('transport_pickup_points')
        .insert(upsertData));
    }

    if (error) {
      toast({ variant: 'destructive', title: `Error ${editingPoint ? 'updating' : 'creating'} point`, description: error.message });
    } else {
      toast({ title: 'Success!', description: `Pickup point successfully ${editingPoint ? 'updated' : 'created'}.` });
      await fetchPickupPoints();
      handleCloseDialog();
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

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Pickup Points</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" /> Add Pickup Point
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingPoint ? 'Edit Pickup Point' : 'Add New Pickup Point'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-1">
                  <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                    Click here to get latitude and longitude (Optional)
                  </a>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Pickup Point *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input id="latitude" value={formData.latitude} onChange={(e) => setFormData({...formData, latitude: e.target.value})} placeholder="e.g. 28.6139" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input id="longitude" value={formData.longitude} onChange={(e) => setFormData({...formData, longitude: e.target.value})} placeholder="e.g. 77.2090" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary" onClick={handleCloseDialog}>
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card text-card-foreground rounded-xl shadow-lg">
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : points.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground">No pickup points found. Add one to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-foreground uppercase bg-muted/50">
                  <tr>
                    <th scope="col" className="px-6 py-3">Pickup Point</th>
                    <th scope="col" className="px-6 py-3">Latitude</th>
                    <th scope="col" className="px-6 py-3">Longitude</th>
                    <th scope="col" className="px-6 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((point) => (
                    <tr key={point.id} className="border-b border-border hover:bg-muted/50">
                      <td className="px-6 py-4 font-medium text-foreground">{point.name}</td>
                      <td className="px-6 py-4">{point.latitude || 'N/A'}</td>
                      <td className="px-6 py-4">{point.longitude || 'N/A'}</td>
                      <td className="px-6 py-4 text-center space-x-2">
                        {point.latitude && point.longitude && (
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openMap(point.latitude, point.longitude)}>
                            <MapPin className="h-4 w-4 text-blue-500" />
                          </Button>
                        )}
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(point)}>
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
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PickupPoints;
