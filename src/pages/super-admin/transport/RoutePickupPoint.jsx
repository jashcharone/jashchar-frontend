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
import { Plus, Edit, Trash2, Save, X, Loader2, ArrowLeft, MapPin } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { v4 as uuidv4 } from 'uuid';

const RoutePickupPoint = () => {
  const navigate = useNavigate();
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
    const [routesWithPoints, setRoutesWithPoints] = useState([]);
    const [allRoutes, setAllRoutes] = useState([]);
    const [allPickupPoints, setAllPickupPoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [editingRouteId, setEditingRouteId] = useState(null);
    const [selectedRoute, setSelectedRoute] = useState('');
    const [pickupPointFields, setPickupPointFields] = useState([{ id: uuidv4(), pickup_point_id: '', distance: '', pickup_time: '', monthly_fees: '' }]);

    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    const fetchData = useCallback(async () => {
        console.log('[RoutePickupPoint] fetchData called with branchId:', branchId);
        if (!branchId) {
            console.log('[RoutePickupPoint] No branchId, returning');
            return;
        }
        setLoading(true);

        let mappingsQuery = supabase.from('route_pickup_point_mappings').select('*, pickup_point:pickup_point_id(name)').eq('branch_id', branchId).order('stop_order');
        let routesQuery = supabase.from('transport_routes').select('*').eq('branch_id', branchId);
        let pickupPointsQuery = supabase.from('transport_pickup_points').select('*').eq('branch_id', branchId);

        const [mappingsRes, routesRes, pickupPointsRes] = await Promise.all([
            mappingsQuery, routesQuery, pickupPointsQuery
        ]);

        console.log('[RoutePickupPoint] Routes:', routesRes.data?.length, 'Error:', routesRes.error?.message);
        console.log('[RoutePickupPoint] Pickup Points:', pickupPointsRes.data?.length, 'Error:', pickupPointsRes.error?.message);
        console.log('[RoutePickupPoint] Mappings:', mappingsRes.data?.length, 'Error:', mappingsRes.error?.message);

        if (routesRes.error || pickupPointsRes.error || mappingsRes.error) {
            toast({ variant: 'destructive', title: 'Error fetching data', description: routesRes.error?.message || pickupPointsRes.error?.message || mappingsRes.error?.message });
        } else {
            const groupedByRoute = routesRes.data.map(route => ({
                ...route,
                pickup_points: mappingsRes.data.filter(m => m.route_id === route.id)
            })).filter(r => r.pickup_points.length > 0);

            console.log('[RoutePickupPoint] Grouped routes with points:', groupedByRoute.length);
            setRoutesWithPoints(groupedByRoute);
            setAllRoutes(routesRes.data);
            setAllPickupPoints(pickupPointsRes.data);
        }
        setLoading(false);
    }, [branchId, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddField = () => {
        setPickupPointFields([...pickupPointFields, { id: uuidv4(), pickup_point_id: '', distance: '', pickup_time: '', monthly_fees: '' }]);
    };

    const handleRemoveField = (id) => {
        setPickupPointFields(pickupPointFields.filter(field => field.id !== id));
    };

    const handleFieldChange = (id, field, value) => {
        setPickupPointFields(pickupPointFields.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleCancel = () => {
        setEditingRouteId(null);
        setSelectedRoute('');
        setPickupPointFields([{ id: uuidv4(), pickup_point_id: '', distance: '', pickup_time: '', monthly_fees: '' }]);
    };

    const handleEdit = (route) => {
        setEditingRouteId(route.id);
        setSelectedRoute(route.id);
        setPickupPointFields(route.pickup_points.map(p => ({
            id: p.id,
            pickup_point_id: p.pickup_point_id,
            distance: p.distance || '',
            pickup_time: p.pickup_time || '',
            monthly_fees: p.monthly_fees || ''
        })));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async () => {
        if (!selectedRoute) {
            toast({ variant: 'destructive', title: 'Please select a route.' });
            return;
        }
        
        // TC-41: Validate at least one pickup point is selected
        const validPickupPoints = pickupPointFields.filter(field => field.pickup_point_id);
        if (validPickupPoints.length === 0) {
            toast({ variant: 'destructive', title: 'Please select at least one pickup point.' });
            return;
        }
        
        // Validate for negative fees
        const hasNegativeFees = pickupPointFields.some(field => field.monthly_fees && parseFloat(field.monthly_fees) < 0);
        if (hasNegativeFees) {
            toast({ variant: 'destructive', title: 'Monthly fees cannot be negative.' });
            return;
        }
        
        setIsSubmitting(true);

        try {
            // Delete existing mappings for this route
            const { error: deleteError } = await supabase
                .from('route_pickup_point_mappings')
                .delete()
                .eq('route_id', selectedRoute)
                .eq('branch_id', branchId);
            
            if (deleteError) {
                console.error('Delete error:', deleteError);
                // Continue anyway - might be no existing records
            }

            const mappingsToInsert = validPickupPoints.map((field, index) => ({
                branch_id: branchId,
                session_id: currentSessionId,
                organization_id: organizationId,
                route_id: selectedRoute,
                pickup_point_id: field.pickup_point_id,
                distance: field.distance ? parseFloat(field.distance) : null,
                pickup_time: field.pickup_time || null,
                monthly_fees: field.monthly_fees ? parseFloat(field.monthly_fees) : null,
                stop_order: index + 1
            }));

            console.log('Inserting mappings:', mappingsToInsert);

            const { data: insertedData, error: insertError } = await supabase
                .from('route_pickup_point_mappings')
                .insert(mappingsToInsert)
                .select();
            
            if (insertError) {
                console.error('Insert error:', insertError);
                throw insertError;
            }
            
            console.log('Inserted successfully:', insertedData);

            toast({ title: 'Success', description: 'Route pickup points saved successfully.' });
            handleCancel();
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Save failed', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteRouteMapping = async (routeId) => {
         const { error } = await supabase.from('route_pickup_point_mappings').delete().eq('route_id', routeId);
         if (error) {
             toast({ variant: 'destructive', title: 'Delete failed', description: error.message });
         } else {
             toast({ title: 'Success', description: 'Route pickup points deleted.' });
             fetchData();
         }
    };

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
                            <h2 className="text-xl font-bold mb-4">{editingRouteId ? 'Edit' : 'Add'} Route Pickup Points</h2>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Route *</Label>
                                    <Select value={selectedRoute} onValueChange={setSelectedRoute} disabled={!!editingRouteId}>
                                        <SelectTrigger><SelectValue placeholder="Select Route" /></SelectTrigger>
                                        <SelectContent>{allRoutes.map(r => <SelectItem key={r.id} value={r.id}>{r.route_title}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-semibold">Pickup Points</Label>
                                    {pickupPointFields.map((field, idx) => (
                                        <div key={field.id} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-medium text-muted-foreground">Stop #{idx + 1}</span>
                                                {pickupPointFields.length > 1 && (
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveField(field.id)}>
                                                        <X className="h-3 w-3 text-destructive" />
                                                    </Button>
                                                )}
                                            </div>
                                            <Select value={field.pickup_point_id} onValueChange={v => handleFieldChange(field.id, 'pickup_point_id', v)}>
                                                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select Point" /></SelectTrigger>
                                                <SelectContent>{allPickupPoints.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                                            </Select>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <Label className="text-xs">Distance (km)</Label>
                                                    <Input className="h-8 text-xs" type="text" value={field.distance} onChange={e => handleFieldChange(field.id, 'distance', e.target.value)} />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Time</Label>
                                                    <Input className="h-8 text-xs" type="time" value={field.pickup_time} onChange={e => handleFieldChange(field.id, 'pickup_time', e.target.value)} />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Fees (?)</Label>
                                                    <Input className="h-8 text-xs" type="number" min="0" value={field.monthly_fees} onChange={e => handleFieldChange(field.id, 'monthly_fees', e.target.value)} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <Button variant="outline" size="sm" className="w-full" onClick={handleAddField}>
                                        <Plus className="mr-2 h-3 w-3" /> Add More Stop
                                    </Button>
                                </div>

                                <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save
                                </Button>
                                {editingRouteId && (
                                    <Button type="button" variant="outline" className="w-full" onClick={handleCancel}>
                                        <X className="mr-2 h-4 w-4" /> Cancel
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right - Route Pickup Points List */}
                    <div className="xl:col-span-2">
                        <div className="bg-card text-card-foreground rounded-xl shadow-lg">
                            <div className="p-6">
                                <h2 className="text-xl font-bold mb-4">Route Pickup Points List</h2>
                                {loading ? (
                                    <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                                ) : routesWithPoints.length === 0 ? (
                                    <div className="text-center py-16">
                                        <MapPin className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                        <p className="text-gray-500 dark:text-gray-400 font-medium">No route pickup points defined</p>
                                        <p className="text-sm text-muted-foreground mt-1">Add one to get started</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 max-h-[500px] overflow-y-auto">
                                        {routesWithPoints.map(route => (
                                            <div key={route.id} className="border rounded-lg">
                                                <div className="bg-muted/50 p-4 flex justify-between items-center rounded-t-lg">
                                                    <h3 className="font-semibold text-lg">{route.route_title}</h3>
                                                    <div className="flex items-center space-x-2">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(route)}>
                                                            <Edit className="h-4 w-4 text-yellow-500" />
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild><Button variant="destructive" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will delete all pickup points for this route.</AlertDialogDescription></AlertDialogHeader>
                                                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteRouteMapping(route.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead className="text-xs text-muted-foreground uppercase">
                                                            <tr className="border-b">
                                                                <th className="px-6 py-3">Pickup Point</th>
                                                                <th className="px-6 py-3">Distance (km)</th>
                                                                <th className="px-6 py-3">Pickup Time</th>
                                                                <th className="px-6 py-3 text-right">Monthly Fees (?)</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {route.pickup_points.map(p => (
                                                                <tr key={p.id} className="border-b last:border-b-0">
                                                                    <td className="px-6 py-3 font-medium">{p.pickup_point?.name || '-'}</td>
                                                                    <td className="px-6 py-3">{p.distance || '-'}</td>
                                                                    <td className="px-6 py-3">{p.pickup_time || '-'}</td>
                                                                    <td className="px-6 py-3 text-right">{p.monthly_fees || '-'}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default RoutePickupPoint;
