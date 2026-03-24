import React, { useState, useEffect } from 'react';
import { formatDate } from '@/utils/dateUtils';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2, Trash2, Eye, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

const StaffIDCard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [idCards, setIdCards] = useState([]);
  const [viewCard, setViewCard] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);

  useEffect(() => {
    if (user) {
      fetchIDCards();
    }
  }, [user]);

  const fetchIDCards = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('generated_staff_id_cards')
        .select(`
            id,
            generated_date,
            employee_profiles:staff_id(full_name, phone, designation_id),
            staff_id_cards:id_card_template_id(id_card_title, background_image)
        `)
        .eq('branch_id', user.branch_id)
        .order('generated_date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setIdCards(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const initiateDelete = (card) => {
    setCardToDelete(card);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!cardToDelete) return;

    try {
      const { error } = await supabase
        .from('generated_staff_id_cards')
        .delete()
        .eq('id', cardToDelete.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Staff ID Card deleted successfully'
      });
      fetchIDCards();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setDeleteDialogOpen(false);
      setCardToDelete(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Staff ID Cards History</h1>

        <Card>
          <CardHeader>
            <CardTitle>Generated Staff ID Cards</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : idCards.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                No Staff ID Cards found. Use 'Generate Staff ID Card' to create one.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Staff Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Generated Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {idCards.map((card) => (
                    <TableRow key={card.id}>
                      <TableCell className="font-medium">{card.staff_id_cards?.id_card_title || 'Staff ID Card'}</TableCell>
                      <TableCell>{card.employee_profiles?.full_name}</TableCell>
                      <TableCell>{card.employee_profiles?.phone}</TableCell>
                      <TableCell>{formatDate(card.generated_date)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => setViewCard(card)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => initiateDelete(card)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

         {/* View Dialog */}
         <Dialog open={!!viewCard} onOpenChange={(open) => !open && setViewCard(null)}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>View Staff ID Card</DialogTitle>
                </DialogHeader>
                <div className="flex justify-center py-8">
                    <div className="border w-[300px] h-[450px] rounded-lg bg-white shadow-lg relative overflow-hidden">
                         {/* Simplified preview */}
                         {viewCard?.staff_id_cards?.background_image && (
                             <img src={viewCard.staff_id_cards.background_image} className="absolute w-full h-full object-cover opacity-30" alt="bg"/>
                         )}
                         <div className="relative z-10 p-4 text-center">
                             <h3 className="font-bold text-lg">{viewCard?.staff_id_cards?.id_card_title || 'Staff ID Card'}</h3>
                             <div className="my-4">
                                 <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-2"></div>
                                 <h4 className="font-bold">{viewCard?.employee_profiles?.full_name}</h4>
                                 <p className="text-sm text-gray-600 dark:text-gray-400">Phone: {viewCard?.employee_profiles?.phone}</p>
                             </div>
                         </div>
                    </div>
                </div>
                <div className="flex justify-end mt-4">
                    <Button>
                        <Download className="mr-2 h-4 w-4" /> Download
                    </Button>
                </div>
            </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the Staff ID card record.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default StaffIDCard;
