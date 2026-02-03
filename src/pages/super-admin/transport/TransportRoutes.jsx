import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash2, Save, Loader2, Route, IndianRupee } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";

const TransportRoutes = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [formData, setFormData] = useState({
    route_title: '',
    fare: ''
  });

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

  const handleOpenDialog = (route = null) => {
    setEditingRoute(route);
    setFormData(route ? {
      route_title: route.route_title || '',
      fare: route.fare || ''
    } : {
      route_title: '', fare: ''
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
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
      handleCloseDialog();
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

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Route className="h-8 w-8 text-primary" /> Transport Routes
            </h1>
            <p className="text-muted-foreground mt-1">Manage bus routes and fares</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Add Route
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <CardContent className="flex items-center p-4">
              <Route className="h-10 w-10 text-blue-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-blue-700">{routes.length}</p>
                <p className="text-sm text-blue-600">Total Routes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <CardContent className="flex items-center p-4">
              <IndianRupee className="h-10 w-10 text-green-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-green-700">
                  {(() => {
                    const faresWithValues = routes.filter(r => r.fare).map(r => r.fare);
                    return faresWithValues.length > 0 ? formatCurrency(Math.max(...faresWithValues)) : '₹0';
                  })()}
                </p>
                <p className="text-sm text-green-600">Highest Fare</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : routes.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No routes found. Add one to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Route Title</TableHead>
                    <TableHead className="text-right">Fare (₹)</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routes.map((route, index) => (
                    <TableRow key={route.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{route.route_title}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {formatCurrency(route.fare)}
                      </TableCell>
                      <TableCell className="text-center space-x-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(route)}>
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
                              <AlertDialogDescription>
                                This will permanently delete route "{route.route_title}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(route.id)} className="bg-destructive hover:bg-destructive/90">
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingRoute ? 'Edit Route' : 'Add New Route'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="route_title">Route Title *</Label>
                  <Input id="route_title" value={formData.route_title} onChange={(e) => setFormData({...formData, route_title: e.target.value})} placeholder="e.g. Route A - City Center" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fare">Fare (₹)</Label>
                  <Input id="fare" type="number" min="0" step="0.01" value={formData.fare} onChange={(e) => setFormData({...formData, fare: e.target.value})} placeholder="e.g. 1500" />
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

export default TransportRoutes;
