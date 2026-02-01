import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash2, Save, Loader2, Bus, User } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const TransportVehicles = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    vehicle_number: '',
    registration_number: '',
    chassis_number: '',
    vehicle_model: '',
    year_made: '',
    driver_name: '',
    driver_license: '',
    driver_contact: '',
    max_seating_capacity: '',
    note: ''
  });

  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const fetchVehicles = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    
    let query = supabase
      .from('transport_vehicles')
      .select('*')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false });
    
    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;

    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching vehicles', description: error.message });
    } else {
      setVehicles(data || []);
    }
    setLoading(false);
  }, [branchId, branchId, toast]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleOpenDialog = (vehicle = null) => {
    setEditingVehicle(vehicle);
    setFormData(vehicle ? {
      vehicle_number: vehicle.vehicle_number || '',
      registration_number: vehicle.registration_number || '',
      chassis_number: vehicle.chassis_number || '',
      vehicle_model: vehicle.vehicle_model || '',
      year_made: vehicle.year_made || '',
      driver_name: vehicle.driver_name || '',
      driver_license: vehicle.driver_license || '',
      driver_contact: vehicle.driver_contact || '',
      max_seating_capacity: vehicle.max_seating_capacity || '',
      note: vehicle.note || ''
    } : {
      vehicle_number: '', registration_number: '', chassis_number: '', vehicle_model: '',
      year_made: '', driver_name: '', driver_license: '', driver_contact: '',
      max_seating_capacity: '', note: ''
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingVehicle(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicle_number.trim()) {
      toast({ variant: 'destructive', title: 'Vehicle number is required.' });
      return;
    }
    setIsSubmitting(true);

    const payload = {
      vehicle_number: formData.vehicle_number,
      registration_number: formData.registration_number || null,
      chassis_number: formData.chassis_number || null,
      vehicle_model: formData.vehicle_model || null,
      year_made: formData.year_made || null,
      driver_name: formData.driver_name || null,
      driver_license: formData.driver_license || null,
      driver_contact: formData.driver_contact || null,
      max_seating_capacity: formData.max_seating_capacity ? parseInt(formData.max_seating_capacity) : null,
      note: formData.note || null,
      branch_id: branchId,
      session_id: currentSessionId,
      organization_id: organizationId
    };

    let error;
    if (editingVehicle) {
      ({ error } = await supabase.from('transport_vehicles').update(payload).eq('id', editingVehicle.id));
    } else {
      ({ error } = await supabase.from('transport_vehicles').insert(payload));
    }

    if (error) {
      toast({ variant: 'destructive', title: `Error ${editingVehicle ? 'updating' : 'creating'} vehicle`, description: error.message });
    } else {
      toast({ title: 'Success!', description: `Vehicle successfully ${editingVehicle ? 'updated' : 'created'}.` });
      await fetchVehicles();
      handleCloseDialog();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (vehicleId) => {
    const { error } = await supabase.from('transport_vehicles').delete().eq('id', vehicleId);
    if (error) {
      toast({ variant: 'destructive', title: 'Error deleting vehicle', description: error.message });
    } else {
      toast({ title: 'Success!', description: 'Vehicle deleted successfully.' });
      await fetchVehicles();
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bus className="h-8 w-8 text-primary" /> Transport Vehicles
            </h1>
            <p className="text-muted-foreground mt-1">Manage school vehicles and driver assignments</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Add Vehicle
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Bus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No vehicles found. Add one to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Vehicle No.</TableHead>
                    <TableHead>Registration No.</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle, index) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{vehicle.vehicle_number}</TableCell>
                      <TableCell>{vehicle.registration_number || '-'}</TableCell>
                      <TableCell>{vehicle.vehicle_model || '-'}</TableCell>
                      <TableCell>{vehicle.max_seating_capacity || '-'}</TableCell>
                      <TableCell>{vehicle.driver_name || '-'}</TableCell>
                      <TableCell>{vehicle.driver_contact || '-'}</TableCell>
                      <TableCell className="text-center space-x-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(vehicle)}>
                          <Edit className="h-4 w-4 text-yellow-600" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" className="h-8 w-8">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Vehicle?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete vehicle "{vehicle.vehicle_number}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(vehicle.id)} className="bg-destructive hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_number">Vehicle Number *</Label>
                    <Input id="vehicle_number" value={formData.vehicle_number} onChange={(e) => setFormData({...formData, vehicle_number: e.target.value.toUpperCase()})} placeholder="e.g. KA01AB1234" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registration_number">Registration Number</Label>
                    <Input id="registration_number" value={formData.registration_number} onChange={(e) => setFormData({...formData, registration_number: e.target.value})} placeholder="Registration No." />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="chassis_number">Chassis Number</Label>
                    <Input id="chassis_number" value={formData.chassis_number} onChange={(e) => setFormData({...formData, chassis_number: e.target.value})} placeholder="Chassis No." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_model">Vehicle Model</Label>
                    <Input id="vehicle_model" value={formData.vehicle_model} onChange={(e) => setFormData({...formData, vehicle_model: e.target.value})} placeholder="e.g. Tata Starbus" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year_made">Year Made</Label>
                    <Input id="year_made" value={formData.year_made} onChange={(e) => setFormData({...formData, year_made: e.target.value})} placeholder="e.g. 2020" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_seating_capacity">Max Seating Capacity</Label>
                  <Input id="max_seating_capacity" type="number" value={formData.max_seating_capacity} onChange={(e) => setFormData({...formData, max_seating_capacity: e.target.value})} placeholder="e.g. 40" />
                </div>

                <div className="border-t pt-4 mt-2">
                  <h4 className="font-semibold mb-3 flex items-center gap-2"><User className="h-4 w-4" /> Driver Information</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="driver_name">Driver Name</Label>
                      <Input id="driver_name" value={formData.driver_name} onChange={(e) => setFormData({...formData, driver_name: e.target.value})} placeholder="Driver full name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="driver_contact">Driver Contact</Label>
                      <Input id="driver_contact" value={formData.driver_contact} onChange={(e) => setFormData({...formData, driver_contact: e.target.value})} placeholder="Mobile number" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="driver_license">License Number</Label>
                      <Input id="driver_license" value={formData.driver_license} onChange={(e) => setFormData({...formData, driver_license: e.target.value})} placeholder="DL number" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Notes</Label>
                  <Textarea id="note" value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} placeholder="Any additional notes..." rows={2} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary" onClick={handleCloseDialog}>Cancel</Button>
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
    </DashboardLayout>
  );
};

export default TransportVehicles;
