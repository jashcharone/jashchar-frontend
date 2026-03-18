import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2, Save, Loader2, Bus, Route, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowLeft, AlertTriangle, Users, BarChart3 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';

const AssignVehicle = () => {
  const navigate = useNavigate();
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
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

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      route_id: assignment.route_id,
      vehicle_id: assignment.vehicle_id
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingAssignment(null);
    setFormData({ route_id: '', vehicle_id: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Separate validation messages for route and vehicle
    if (!formData.route_id && !formData.vehicle_id) {
      toast({ variant: 'destructive', title: 'Please select both route and vehicle.' });
      return;
    }
    if (!formData.route_id) {
      toast({ variant: 'destructive', title: 'Please select route.' });
      return;
    }
    if (!formData.vehicle_id) {
      toast({ variant: 'destructive', title: 'Please select vehicle.' });
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
      branch_id: branchId
      // Note: session_id and organization_id columns don't exist in route_vehicle_assignments table
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
      handleCancel();
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
  // Logic: Once a route has a vehicle OR a vehicle is assigned to a route, 
  // they should NOT be available for new assignments
  
  // Filter out already assigned routes (except when editing that same assignment)
  const assignedRouteIds = assignments
    .filter(a => !editingAssignment || a.id !== editingAssignment.id)
    .map(a => a.route_id);
  const availableRoutes = editingAssignment 
    ? routes 
    : routes.filter(r => !assignedRouteIds.includes(r.id));
  
  // Filter out already assigned vehicles (except when editing that same assignment)
  // A vehicle can only be assigned to ONE route at a time
  const assignedVehicleIds = assignments
    .filter(a => !editingAssignment || a.id !== editingAssignment.id)
    .map(a => a.vehicle_id);
  const availableVehicles = editingAssignment 
    ? vehicles 
    : vehicles.filter(v => !assignedVehicleIds.includes(v.id));

  // Pagination
  const totalPages = Math.ceil(assignments.length / itemsPerPage);
  const paginatedAssignments = assignments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Back Button */}
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left - Assign Form */}
          <div className="xl:col-span-1">
            <div className="bg-card text-card-foreground rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">{editingAssignment ? 'Edit Assignment' : 'Assign Vehicle to Route'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Route *</Label>
                  <Select value={formData.route_id} onValueChange={(v) => setFormData({...formData, route_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Select Route" /></SelectTrigger>
                    <SelectContent>
                      {availableRoutes.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.route_title}</SelectItem>
                      ))}
                      {availableRoutes.length === 0 && (
                        <div className="px-2 py-4 text-sm text-muted-foreground text-center">All routes have vehicles assigned</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vehicle *</Label>
                  <Select value={formData.vehicle_id} onValueChange={(v) => setFormData({...formData, vehicle_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Select Vehicle" /></SelectTrigger>
                    <SelectContent>
                      {availableVehicles.map(v => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.vehicle_number} {v.driver_name ? `(${v.driver_name})` : ''}
                        </SelectItem>
                      ))}
                      {availableVehicles.length === 0 && (
                        <div className="px-2 py-4 text-sm text-muted-foreground text-center">All vehicles are assigned</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save
                </Button>
                {editingAssignment && (
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
                <h2 className="text-xl font-bold mb-4">Vehicle Assignments List</h2>
                {loading ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : assignments.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No assignments found. Assign vehicles to routes to get started.</p>
                  </div>
                ) : (
                  <>
                    <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-foreground uppercase bg-muted/50 sticky top-0 bg-background z-10">
                          <tr>
                            <th className="px-4 py-3 w-12">#</th>
                            <th className="px-4 py-3">Route</th>
                            <th className="px-4 py-3">Vehicle Number</th>
                            <th className="px-4 py-3">Driver</th>
                            <th className="px-4 py-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedAssignments.map((assignment, index) => (
                            <tr key={assignment.id} className="border-b border-border hover:bg-muted/50">
                              <td className="px-4 py-3">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                              <td className="px-4 py-3 font-medium">
                                <div className="flex items-center gap-2">
                                  <Route className="h-4 w-4 text-primary" />
                                  {assignment.route?.route_title || 'Unknown Route'}
                                </div>
                              </td>
                              <td className="px-4 py-3">{assignment.vehicle?.vehicle_number || 'N/A'}</td>
                              <td className="px-4 py-3">{assignment.vehicle?.driver_name || '-'}</td>
                              <td className="px-4 py-3 text-center space-x-2">
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEdit(assignment)}>
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
                                      <AlertDialogDescription>This will remove the vehicle from this route. You can reassign later.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(assignment.id)} className="bg-destructive hover:bg-destructive/90">Remove</AlertDialogAction>
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
                      <span className="text-muted-foreground">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, assignments.length)} of {assignments.length} entries</span>
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

        {/* ═══════ OPTIMIZATION INSIGHTS (Day 23 Enhancement) ═══════ */}
        {!loading && assignments.length > 0 && (
          <div className="mt-6 bg-card text-card-foreground rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" /> Assignment Insights & Optimization
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Unassigned Routes */}
              {(() => {
                const assignedRouteIdsList = assignments.map(a => a.route_id);
                const unassignedRoutes = routes.filter(r => !assignedRouteIdsList.includes(r.id));
                return (
                  <div className={`p-4 rounded-lg border ${unassignedRoutes.length > 0 ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20' : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {unassignedRoutes.length > 0 ? (
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <Route className="h-5 w-5 text-green-600" />
                      )}
                      <span className="font-semibold text-sm">
                        {unassignedRoutes.length > 0 ? `${unassignedRoutes.length} Routes Without Vehicle` : 'All Routes Assigned ✅'}
                      </span>
                    </div>
                    {unassignedRoutes.length > 0 && (
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mt-2">
                        {unassignedRoutes.slice(0, 5).map(r => (
                          <li key={r.id}>• {r.route_title}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })()}

              {/* Unassigned Vehicles */}
              {(() => {
                const assignedVehicleIdsList = assignments.map(a => a.vehicle_id);
                const unassignedVehicles = vehicles.filter(v => !assignedVehicleIdsList.includes(v.id));
                return (
                  <div className={`p-4 rounded-lg border ${unassignedVehicles.length > 0 ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20' : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Bus className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-sm">
                        {unassignedVehicles.length > 0 ? `${unassignedVehicles.length} Idle Vehicles` : 'All Vehicles Utilized ✅'}
                      </span>
                    </div>
                    {unassignedVehicles.length > 0 && (
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mt-2">
                        {unassignedVehicles.slice(0, 5).map(v => (
                          <li key={v.id}>• {v.vehicle_number} (Cap: {v.seating_capacity || 'N/A'})</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })()}

              {/* Capacity Overview */}
              <div className="p-4 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold text-sm">Fleet Summary</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mt-2">
                  <p>Total Vehicles: <strong>{vehicles.length}</strong></p>
                  <p>Total Routes: <strong>{routes.length}</strong></p>
                  <p>Assigned: <strong>{assignments.length}</strong></p>
                  <p>Total Capacity: <strong>{vehicles.reduce((s, v) => s + (v.seating_capacity || 0), 0)} seats</strong></p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AssignVehicle;
