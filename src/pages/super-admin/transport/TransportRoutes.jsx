import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2, Save, Loader2, Route, IndianRupee, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';

const TransportRoutes = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [formData, setFormData] = useState({ route_title: '', fare: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const fetchRoutes = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('transport_routes')
      .select('*')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching routes', description: error.message });
    } else {
      setRoutes(data || []);
    }
    setLoading(false);
  }, [branchId, toast]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const handleEdit = (route) => {
    setEditingRoute(route);
    setFormData({ route_title: route.route_title || '', fare: route.fare || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingRoute(null);
    setFormData({ route_title: '', fare: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.route_title.trim()) {
      toast({ variant: 'destructive', title: 'Route title is required.' });
      return;
    }
    setIsSubmitting(true);

    const payload = {
      route_title: formData.route_title,
      fare: formData.fare ? parseFloat(formData.fare) : null,
      branch_id: branchId,
      session_id: currentSessionId,
      organization_id: organizationId
    };

    let error;
    if (editingRoute) {
      ({ error } = await supabase.from('transport_routes').update(payload).eq('id', editingRoute.id));
    } else {
      ({ error } = await supabase.from('transport_routes').insert(payload));
    }

    if (error) {
      toast({ variant: 'destructive', title: `Error ${editingRoute ? 'updating' : 'creating'} route`, description: error.message });
    } else {
      toast({ title: 'Success!', description: `Route successfully ${editingRoute ? 'updated' : 'created'}.` });
      await fetchRoutes();
      handleCancel();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (routeId) => {
    const { error } = await supabase.from('transport_routes').delete().eq('id', routeId);
    if (error) {
      toast({ variant: 'destructive', title: 'Error deleting route', description: error.message });
    } else {
      toast({ title: 'Success!', description: 'Route deleted successfully.' });
      await fetchRoutes();
    }
  };

  const formatCurrency = (amount) => {
    return amount ? `₹${parseFloat(amount).toLocaleString('en-IN')}` : '-';
  };

  // Pagination
  const totalPages = Math.ceil(routes.length / itemsPerPage);
  const paginatedRoutes = routes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left - Add/Edit Form */}
          <div className="xl:col-span-1">
            <div className="bg-card text-card-foreground rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">{editingRoute ? 'Edit Route' : 'Add Route'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="route_title">Route Title *</Label>
                  <Input id="route_title" value={formData.route_title} onChange={(e) => setFormData({...formData, route_title: e.target.value})} placeholder="e.g. Route A - City Center" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fare">Fee (₹)</Label>
                  <Input id="fare" type="number" min="0" step="0.01" value={formData.fare} onChange={(e) => setFormData({...formData, fare: e.target.value})} placeholder="e.g. 1500" />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save
                </Button>
                {editingRoute && (
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
                <h2 className="text-xl font-bold mb-4">Transport Routes List</h2>
                {loading ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : routes.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No routes found. Add one to get started.</p>
                  </div>
                ) : (
                  <>
                    <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-foreground uppercase bg-muted/50 sticky top-0 bg-background z-10">
                          <tr>
                            <th className="px-4 py-3 w-12">#</th>
                            <th className="px-4 py-3">Route Title</th>
                            <th className="px-4 py-3 text-right">Fee (₹)</th>
                            <th className="px-4 py-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedRoutes.map((route, index) => (
                            <tr key={route.id} className="border-b border-border hover:bg-muted/50">
                              <td className="px-4 py-3">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                              <td className="px-4 py-3 font-medium">{route.route_title}</td>
                              <td className="px-4 py-3 text-right font-semibold text-green-600">{formatCurrency(route.fare)}</td>
                              <td className="px-4 py-3 text-center space-x-2">
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEdit(route)}>
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
                                      <AlertDialogTitle>Delete Route?</AlertDialogTitle>
                                      <AlertDialogDescription>This will permanently delete route "{route.route_title}". This action cannot be undone.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(route.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
                      <span className="text-muted-foreground">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, routes.length)} of {routes.length} entries</span>
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

export default TransportRoutes;
