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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2, Save, Loader2, Bus, User, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';

const TransportVehicles = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    vehicle_number: '', registration_number: '', chassis_number: '', vehicle_model: '',
    year_made: '', driver_name: '', driver_license: '', driver_contact: '',
    max_seating_capacity: '', note: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const fetchVehicles = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    
    let query = supabase
      .from('transport_vehicles')
      .select('*')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false });
    
    const { data, error } = await query;

    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching vehicles', description: error.message });
    } else {
      setVehicles(data || []);
    }
    setLoading(false);
  }, [branchId, toast]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      vehicle_number: vehicle.vehicle_number || '', registration_number: vehicle.registration_number || '',
      chassis_number: vehicle.chassis_number || '', vehicle_model: vehicle.vehicle_model || '',
      year_made: vehicle.year_made || '', driver_name: vehicle.driver_name || '',
      driver_license: vehicle.driver_license || '', driver_contact: vehicle.driver_contact || '',
      max_seating_capacity: vehicle.max_seating_capacity || '', note: vehicle.note || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingVehicle(null);
    setFormData({ vehicle_number: '', registration_number: '', chassis_number: '', vehicle_model: '', year_made: '', driver_name: '', driver_license: '', driver_contact: '', max_seating_capacity: '', note: '' });
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
      handleCancel();
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

  // Pagination
  const totalPages = Math.ceil(vehicles.length / itemsPerPage);
  const paginatedVehicles = vehicles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left - Add/Edit Form */}
          <div className="xl:col-span-1">
            <div className="bg-card text-card-foreground rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="vehicle_number">Vehicle Number *</Label>
                  <Input id="vehicle_number" value={formData.vehicle_number} onChange={(e) => setFormData({...formData, vehicle_number: e.target.value.toUpperCase()})} placeholder="e.g. KA01AB1234" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registration_number">Registration Number</Label>
                  <Input id="registration_number" value={formData.registration_number} onChange={(e) => setFormData({...formData, registration_number: e.target.value})} placeholder="Registration No." />
                </div>
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
                <div className="space-y-2">
                  <Label htmlFor="max_seating_capacity">Max Seating Capacity</Label>
                  <Input id="max_seating_capacity" type="number" value={formData.max_seating_capacity} onChange={(e) => setFormData({...formData, max_seating_capacity: e.target.value})} placeholder="e.g. 40" />
                </div>

                <div className="border-t pt-3 mt-3">
                  <h4 className="font-semibold mb-3 flex items-center gap-2"><User className="h-4 w-4" /> Driver Information</h4>
                  <div className="space-y-3">
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

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save
                </Button>
                {editingVehicle && (
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
                <h2 className="text-xl font-bold mb-4">Transport Vehicles List</h2>
                {loading ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : vehicles.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Bus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No vehicles found. Add one to get started.</p>
                  </div>
                ) : (
                  <>
                    <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-foreground uppercase bg-muted/50 sticky top-0 bg-background z-10">
                          <tr>
                            <th className="px-4 py-3 w-12">#</th>
                            <th className="px-4 py-3">Vehicle No.</th>
                            <th className="px-4 py-3">Model</th>
                            <th className="px-4 py-3">Capacity</th>
                            <th className="px-4 py-3">Driver</th>
                            <th className="px-4 py-3">Contact</th>
                            <th className="px-4 py-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedVehicles.map((vehicle, index) => (
                            <tr key={vehicle.id} className="border-b border-border hover:bg-muted/50">
                              <td className="px-4 py-3">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                              <td className="px-4 py-3 font-medium">{vehicle.vehicle_number}</td>
                              <td className="px-4 py-3">{vehicle.vehicle_model || '-'}</td>
                              <td className="px-4 py-3">{vehicle.max_seating_capacity || '-'}</td>
                              <td className="px-4 py-3">{vehicle.driver_name || '-'}</td>
                              <td className="px-4 py-3">{vehicle.driver_contact || '-'}</td>
                              <td className="px-4 py-3 text-center space-x-2">
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEdit(vehicle)}>
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
                                      <AlertDialogDescription>This will permanently delete vehicle "{vehicle.vehicle_number}". This action cannot be undone.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(vehicle.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
                      <span className="text-muted-foreground">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, vehicles.length)} of {vehicles.length} entries</span>
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

export default TransportVehicles;
