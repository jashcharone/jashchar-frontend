import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const FeesReminder = () => {
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const branchId = user?.profile?.branch_id;

    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchReminders = useCallback(async () => {
        if (!branchId || !selectedBranch) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('fee_reminders')
            .select('*')
            .eq('branch_id', branchId)
            .eq('branch_id', selectedBranch.id)
            .order('reminder_type')
            .order('days');

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching reminders' });
            setReminders([]);
        } else {
            setReminders(data.map(r => ({ ...r, isNew: false })));
        }
        setLoading(false);
    }, [branchId, selectedBranch, toast]);

    useEffect(() => {
        fetchReminders();
    }, [fetchReminders]);

    const handleReminderChange = (id, field, value) => {
        setReminders(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const addReminder = (type) => {
        if (!selectedBranch) return;
        setReminders(prev => [
            ...prev,
            { id: uuidv4(), branch_id: selectedBranch.id, is_active: true, reminder_type: type, days: 1, isNew: true }
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
        setIsSubmitting(true);
        const remindersToUpsert = reminders.map(r => {
            const { isNew, ...dbReminder } = r;
            return dbReminder;
        });

        // Basic validation
        for (const r of remindersToUpsert) {
            if (!r.days || r.days < 0) {
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

    const renderReminderGroup = (type) => {
        const filteredReminders = reminders.filter(r => r.reminder_type === type);
        return (
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold capitalize">{type} Due Date</h3>
                    <Button size="sm" variant="ghost" onClick={() => addReminder(type)}><Plus className="mr-2 h-4 w-4" /> Add</Button>
                </div>
                <div className="space-y-2">
                    {filteredReminders.map(reminder => (
                        <div key={reminder.id} className="grid grid-cols-4 gap-4 items-center">
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`active-${reminder.id}`} 
                                    checked={reminder.is_active}
                                    onCheckedChange={(checked) => handleReminderChange(reminder.id, 'is_active', checked)}
                                />
                                <label htmlFor={`active-${reminder.id}`}>Active</label>
                            </div>
                            <div className="col-span-2">
                                <Input 
                                    type="number" 
                                    value={reminder.days}
                                    onChange={(e) => handleReminderChange(reminder.id, 'days', parseInt(e.target.value, 10) || 0)}
                                    min="0"
                                />
                            </div>
                            <Button size="icon" variant="ghost" onClick={() => removeReminder(reminder.id, reminder.isNew)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold mb-6">Fees Reminder</h1>
            <Card>
                <CardHeader><CardTitle>Set Fee Reminders</CardTitle></CardHeader>
                <CardContent>
                    {loading ? <div className="text-center p-8"><Loader2 className="animate-spin mx-auto"/></div> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {renderReminderGroup('before')}
                            {renderReminderGroup('after')}
                        </div>
                    )}
                    <div className="flex justify-end mt-6">
                        <Button onClick={handleSave} disabled={isSubmitting || loading}>
                            {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2 h-4 w-4" />}
                            Save
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default FeesReminder;
