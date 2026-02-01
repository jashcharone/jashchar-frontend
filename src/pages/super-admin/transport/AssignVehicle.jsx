import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Save, Loader2, Bus, Route } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

const AssignVehicle = () => {
    const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [formData, setFormData] = useState({
    route_id: '',
    vehicle_id: ''
  });

  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const fetchData = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);

    let routeQuery = supabase.from('transport_routes').select('*').eq('branch_id', branchId);
    let vehicleQuery = supabase.from('transport_vehicles').select('*').eq('branch_id', branchId);
    let assignmentQuery = supabase.from('route_vehicle_assignments').select(`
      *,
      route:route_id(route_title),
      vehicle:vehicle_id(vehicle_number, driver_name)
    `).eq('branch_id', branchId);

    const [routesRes, vehiclesRes, assignmentsRes] = await Promise.all([
      routeQuery, vehicleQuery, assignmentQuery
    ]);

    if (routesRes.error || vehiclesRes.error || assignmentsRes.error) {
      toast({ variant: 'destructive', title: 'Error fetching data' });
    } else {
      setRoutes(routesRes.data || []);
      setVehicles(vehiclesRes.data || []);
      setAssignments(assignmentsRes.data || []);
    }
    setLoading(false);
  }, [branchId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenDialog = (assignment = null) => {
    if (routes.length === 0 || vehicles.length === 0) {
      toast({ variant: 'destructive', title: 'Prerequisites Missing', description: 'Please add routes and vehicles first.' });
      return;
    }
    setEditingAssignment(assignment);
    setFormData(assignment ? {
      route_id: assignment.route_id,
      vehicle_id: assignment.vehicle_id
    } : { route_id: '', vehicle_id: '' });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAssignment(null);
    setFormData({ route_id: '', vehicle_id: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.route_id || !formData.vehicle_id) {
      toast({ variant: 'destructive', title: 'Please select both route and vehicle.' });
      return;
    }

    // Check for duplicate assignment
    const existingAssignment = assignments.find(a => 
      a.route_id === formData.route_id && 
      (!editingAssignment || a.id !== editingAssignment.id)
    );
    if (existingAssignment) {
      toast({ variant: 'destructive', title: 'Route already has a vehicle assigned.', description: 'Delete existing assignment first or choose different route.' });
      return;
    }

    setIsSubmitting(true);

    const payload = {
      route_id: formData.route_id,
      vehicle_id: formData.vehicle_id,
      branch_id: branchId,
      session_id: currentSessionId,
      organization_id: organizationId
    };

    let error;
    if (editingAssignment) {
      ({ error } = await supabase.from('route_vehicle_assignments').update(payload).eq('id', editingAssignment.id));
    } else {
      ({ error } = await supabase.from('route_vehicle_assignments').insert(payload));
    }

    if (error) {
      toast({ variant: 'destructive', title: `Error ${editingAssignment ? 'updating' : 'creating'} assignment`, description: error.message });
    } else {
      toast({ title: 'Success!', description: `Vehicle successfully ${editingAssignment ? 'updated' : 'assigned'} to route.` });
      await fetchData();
      handleCloseDialog();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (assignmentId) => {
    const { error } = await supabase.from('route_vehicle_assignments').delete().eq('id', assignmentId);
    if (error) {
      toast({ variant: 'destructive', title: 'Error removing assignment', description: error.message });
    } else {
      toast({ title: 'Success!', description: 'Assignment removed successfully.' });
      await fetchData();
    }
  };

  // Get unassigned routes and vehicles for the dropdown
  const assignedRouteIds = assignments.filter(a => !editingAssignment || a.id !== editingAssignment.id).map(a => a.route_id);
  const availableRoutes = editingAssignment 
    ? routes 
    : routes.filter(r => !assignedRouteIds.includes(r.id));

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bus className="h-8 w-8 text-primary" /> Assign Vehicle to Route
            </h1>
            <p className="text-muted-foreground mt-1">Map vehicles to transport routes</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Assign Vehicle
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Routes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{routes.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Active Vehicles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{vehicles.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Assigned Routes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{assignments.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No vehicle assignments found. Assign vehicles to routes to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Vehicle Number</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment, index) => (
                    <TableRow key={assignment.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Route className="h-4 w-4 text-primary" />
                          {assignment.route?.route_title || 'Unknown Route'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{assignment.vehicle?.vehicle_number || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>{assignment.vehicle?.driver_name || '-'}</TableCell>
                      <TableCell className="text-center space-x-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(assignment)}>
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
                              <AlertDialogTitle>Remove Assignment?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove the vehicle from this route. You can reassign later.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(assignment.id)} className="bg-destructive hover:bg-destructive/90">
                                Remove
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingAssignment ? 'Edit Assignment' : 'Assign Vehicle to Route'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Route *</Label>
                  <Select value={formData.route_id} onValueChange={(v) => setFormData({...formData, route_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Select Route" /></SelectTrigger>
                    <SelectContent>
                      {availableRoutes.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.route_title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vehicle *</Label>
                  <Select value={formData.vehicle_id} onValueChange={(v) => setFormData({...formData, vehicle_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Select Vehicle" /></SelectTrigger>
                    <SelectContent>
                      {vehicles.map(v => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.vehicle_number} {v.driver_name ? `(${v.driver_name})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

export default AssignVehicle;
