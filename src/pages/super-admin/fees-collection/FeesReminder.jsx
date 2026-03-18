import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Save, Loader2, Plus, Trash2, Bell, Clock, AlertCircle, Info } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Alert, AlertDescription } from '@/components/ui/alert';

const FeesReminder = () => {
    const { user, organizationId, currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    
    // Unified branchId with fallback for staff users
    const branchId = selectedBranch?.id || user?.profile?.branch_id || user?.user_metadata?.branch_id;

    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchReminders = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('fee_reminders')
            .select('*')
            .eq('branch_id', branchId)
            .eq('session_id', currentSessionId)
            .order('reminder_type')
            .order('days');

        if (error) {
            // Table might not exist - create default reminders
            if (error.code === '42P01') {
                toast({ variant: 'destructive', title: 'Fee reminders table not found', description: 'Please contact administrator.' });
            } else {
                toast({ variant: 'destructive', title: 'Error fetching reminders', description: error.message });
            }
            setReminders([]);
        } else {
            setReminders(data.map(r => ({ ...r, isNew: false })));
        }
        setLoading(false);
    }, [selectedBranch, toast]);

    useEffect(() => {
        fetchReminders();
    }, [fetchReminders]);

    const handleReminderChange = (id, field, value) => {
        setReminders(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const addReminder = (type) => {
        if (!branchId) return;
        const existingOfType = reminders.filter(r => r.reminder_type === type);
        const defaultDays = existingOfType.length === 0 ? (type === 'before' ? 3 : 1) : 
                           (Math.max(...existingOfType.map(r => r.days)) + 2);
        
        setReminders(prev => [
            ...prev,
            { 
                id: uuidv4(), 
                branch_id: branchId, 
                organization_id: organizationId,
                session_id: currentSessionId,
                is_active: true, 
                reminder_type: type, 
                days: defaultDays, 
                isNew: true,
                notification_channel: 'sms',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ]);
    };

    const removeReminder = async (id, isNew) => {
        if (isNew) {
            setReminders(prev => prev.filter(r => r.id !== id));
            return;
        }
        
        const { error } = await supabase.from('fee_reminders').delete().eq('id', id);
        if (error) {
            toast({ variant: 'destructive', title: 'Error deleting reminder', description: error.message });
        } else {
            toast({ title: 'Reminder Deleted' });
            setReminders(prev => prev.filter(r => r.id !== id));
        }
    };

    const handleSave = async () => {
        if (!branchId) return;
        setIsSubmitting(true);
        
        const remindersToUpsert = reminders.map(r => {
            const { isNew, ...dbReminder } = r;
            return {
                ...dbReminder,
                branch_id: branchId,
                organization_id: organizationId,
                session_id: currentSessionId,
                created_at: dbReminder.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
        });

        // Validation
        for (const r of remindersToUpsert) {
            if (r.days === undefined || r.days < 0) {
                toast({ variant: 'destructive', title: 'Invalid Input', description: 'Days must be a positive number.' });
                setIsSubmitting(false);
                return;
            }
        }
        
        const { error } = await supabase.from('fee_reminders').upsert(remindersToUpsert, { onConflict: 'id' });

        if (error) {
            toast({ variant: 'destructive', title: 'Error saving reminders', description: error.message });
        } else {
            toast({ title: 'Success!', description: 'Fee reminders have been saved.' });
            fetchReminders();
        }
        setIsSubmitting(false);
    };

    const renderReminderCard = (type, title, description, icon, bgColor) => {
        const filteredReminders = reminders.filter(r => r.reminder_type === type);
        const Icon = icon;
        
        return (
            <Card className={`border-l-4 ${bgColor}`}>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${type === 'before' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">{title}</CardTitle>
                                <CardDescription>{description}</CardDescription>
                            </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => addReminder(type)}>
                            <Plus className="mr-1 h-4 w-4" /> Add Reminder
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredReminders.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No {type} reminders configured</p>
                            <p className="text-sm">Click "Add Reminder" to create one</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                                <div className="col-span-2">Status</div>
                                <div className="col-span-4">Days {type === 'before' ? 'Before' : 'After'} Due</div>
                                <div className="col-span-5">Description</div>
                                <div className="col-span-1"></div>
                            </div>
                            {filteredReminders.map(reminder => (
                                <div key={reminder.id} className="grid grid-cols-12 gap-4 items-center py-2 hover:bg-muted/50 rounded-lg px-2 -mx-2">
                                    <div className="col-span-2">
                                        <div className="flex items-center gap-2">
                                            <Switch 
                                                checked={reminder.is_active}
                                                onCheckedChange={(checked) => handleReminderChange(reminder.id, 'is_active', checked)}
                                            />
                                            <span className={`text-xs font-medium ${reminder.is_active ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                                                {reminder.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="col-span-4">
                                        <div className="flex items-center gap-2">
                                            <Input 
                                                type="number" 
                                                value={reminder.days}
                                                onChange={(e) => handleReminderChange(reminder.id, 'days', parseInt(e.target.value, 10) || 0)}
                                                min="0"
                                                max="365"
                                                className="w-24"
                                            />
                                            <span className="text-sm text-muted-foreground">days</span>
                                        </div>
                                    </div>
                                    <div className="col-span-5">
                                        <span className="text-sm text-muted-foreground">
                                            {reminder.days === 0 
                                                ? (type === 'before' ? 'On due date' : 'On overdue day')
                                                : `${reminder.days} day${reminder.days > 1 ? 's' : ''} ${type} due date`
                                            }
                                        </span>
                                    </div>
                                    <div className="col-span-1 flex justify-end">
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            onClick={() => removeReminder(reminder.id, reminder.isNew)}
                                            className="hover:bg-destructive/10 hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    const activeCount = reminders.filter(r => r.is_active).length;
    const totalCount = reminders.length;

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Fee Reminders</h1>
                    <p className="text-muted-foreground">Configure automatic fee payment reminders for parents</p>
                </div>
                <div className="flex items-center gap-4">
                    {totalCount > 0 && (
                        <div className="text-sm text-muted-foreground">
                            <span className="font-medium text-green-600 dark:text-green-400">{activeCount}</span> active / {totalCount} total
                        </div>
                    )}
                    <Button onClick={handleSave} disabled={isSubmitting || loading || reminders.length === 0}>
                        {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertDescription>
                    Fee reminders are sent via SMS/WhatsApp to parents based on the configured schedule. 
                    "Before" reminders are sent before the due date, "After" reminders are sent for overdue fees.
                </AlertDescription>
            </Alert>
            
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="animate-spin h-8 w-8 text-primary"/>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {renderReminderCard(
                        'before', 
                        'Before Due Date', 
                        'Send reminders before fees are due',
                        Clock,
                        'border-l-blue-500'
                    )}
                    {renderReminderCard(
                        'after', 
                        'After Due Date (Overdue)', 
                        'Send reminders after fees become overdue',
                        AlertCircle,
                        'border-l-orange-500'
                    )}
                </div>
            )}
        </DashboardLayout>
    );
};

export default FeesReminder;
