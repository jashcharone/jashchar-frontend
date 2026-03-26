import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const AssignIncidentModal = ({ isOpen, onClose, student, onAssignSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedIncidents, setSelectedIncidents] = useState([]);

  useEffect(() => {
    if (isOpen && user?.user_metadata?.branch_id) {
      fetchIncidents();
      setSelectedIncidents([]);
    }
  }, [isOpen, user]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('behaviour_incidents')
        .select('*')
        .eq('branch_id', user.user_metadata.branch_id)
        .order('title', { ascending: true });

      if (error) throw error;
      setIncidents(data);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load incidents" });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (incidentId, checked) => {
    if (checked) {
      setSelectedIncidents(prev => [...prev, incidentId]);
    } else {
      setSelectedIncidents(prev => prev.filter(id => id !== incidentId));
    }
  };

  const handleSave = async () => {
    if (selectedIncidents.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Please select at least one incident" });
      return;
    }

    setSaving(true);
    try {
      const records = selectedIncidents.map(incidentId => ({
        branch_id: user.user_metadata.branch_id,
        student_id: student.id,
        incident_id: incidentId,
        assigned_by: user.id,
        assigned_date: new Date(),
      }));

      const { error } = await supabase
        .from('student_behaviour_incidents')
        .insert(records);

      if (error) throw error;

      toast({ title: "Success", description: "Incidents assigned successfully" });
      onAssignSuccess();
      onClose();
    } catch (error) {
      console.error("Error assigning incidents:", error);
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Assign Incident to {student?.full_name}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <div key={incident.id} className="flex items-start space-x-3 border p-3 rounded-md">
                    <Checkbox
                      id={`incident-${incident.id}`}
                      checked={selectedIncidents.includes(incident.id)}
                      onCheckedChange={(checked) => handleCheckboxChange(incident.id, checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={`incident-${incident.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex justify-between w-full min-w-[400px]"
                      >
                        <span>{incident.title}</span>
                        <span className={incident.point < 0 ? "text-red-600 ml-2" : "text-green-600 ml-2"}>
                          Point: {incident.point}
                        </span>
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {incident.description}
                      </p>
                    </div>
                  </div>
                ))}
                {incidents.length === 0 && (
                  <p className="text-center text-muted-foreground">No incidents available to assign.</p>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={handleSave} disabled={saving || incidents.length === 0}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignIncidentModal;
