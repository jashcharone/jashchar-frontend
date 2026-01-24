import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ViewAssignedIncidentsModal = ({ isOpen, onClose, student, onUpdate }) => {
  const { toast } = useToast();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [incidentToDelete, setIncidentToDelete] = useState(null);

  useEffect(() => {
    if (isOpen && student) {
      fetchAssignedIncidents();
    }
  }, [isOpen, student]);

  const fetchAssignedIncidents = async () => {
    try {
      setLoading(true);
      // Removed 'assigner:assigned_by' join as it may cause errors if the user table isn't consistently linked
      const { data, error } = await supabase
        .from('student_behaviour_incidents')
        .select(`
          id,
          assigned_date,
          incident:behaviour_incidents (
            title,
            point,
            description
          )
        `)
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIncidents(data);
    } catch (error) {
      console.error('Error fetching assigned incidents:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load history" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setIncidentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!incidentToDelete) return;
    try {
      const { error } = await supabase
        .from('student_behaviour_incidents')
        .delete()
        .eq('id', incidentToDelete);

      if (error) throw error;

      setIncidents(incidents.filter(inc => inc.id !== incidentToDelete));
      toast({ title: "Success", description: "Record deleted successfully" });
      onUpdate(); // Refresh parent stats
    } catch (error) {
      console.error("Error deleting record:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to delete record" });
    } finally {
      setDeleteDialogOpen(false);
      setIncidentToDelete(null);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>View Assigned Incidents - {student?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Point</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidents.length > 0 ? (
                      incidents.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.incident?.title}</TableCell>
                          <TableCell>
                            <span className={record.incident?.point < 0 ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                              {record.incident?.point}
                            </span>
                          </TableCell>
                          <TableCell>{new Date(record.assigned_date).toLocaleDateString()}</TableCell>
                          <TableCell className="max-w-xs truncate">{record.incident?.description}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive/90 h-8 w-8"
                              onClick={() => handleDeleteClick(record.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                          No incidents assigned.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ViewAssignedIncidentsModal;
