import React, { useState, useEffect } from 'react';
import { formatDate } from '@/utils/dateUtils';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { Loader2, Search, Trash2, Eye, Download } from 'lucide-react';
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

const CertificateHistory = () => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewCertificate, setViewCertificate] = useState(null);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [certToDelete, setCertToDelete] = useState(null);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user, selectedBranch]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('generated_certificates')
        .select(`
            id,
            generated_date,
            student_profiles:student_id(full_name, enrollment_id, classes:classes!student_profiles_class_id_fkey(name)),
            certificate_templates:template_id(name, template_html, background_image)
        `)
        .eq('branch_id', user.branch_id)
        .order('generated_date', { ascending: false });

      if (selectedBranch) {
        query = query.eq('branch_id', selectedBranch.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCertificates(data || []);
    } catch (error) {
        console.error("Error:", error);
      toast({
        title: 'Error fetching history',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const initiateDelete = (cert) => {
    setCertToDelete(cert);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!certToDelete) return;

    try {
      const { error } = await supabase
        .from('generated_certificates')
        .delete()
        .eq('id', certToDelete.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Certificate record deleted'
      });
      fetchHistory();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setDeleteDialogOpen(false);
      setCertToDelete(null);
    }
  };

  const filteredCertificates = certificates.filter(cert => 
    cert.student_profiles?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.student_profiles?.enrollment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.certificate_templates?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
             <h1 className="text-3xl font-bold tracking-tight">Certificate History</h1>
             <div className="relative w-72">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search student or certificate type..." 
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generated Certificates List</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredCertificates.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                No certificate history found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Certificate Name</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Enroll ID</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Generated Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCertificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-medium">{cert.certificate_templates?.name}</TableCell>
                      <TableCell>{cert.student_profiles?.full_name}</TableCell>
                      <TableCell>{cert.student_profiles?.enrollment_id}</TableCell>
                      <TableCell>{cert.student_profiles?.classes?.name}</TableCell>
                      <TableCell>{formatDate(cert.generated_date)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => setViewCertificate(cert)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => initiateDelete(cert)}>
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
         <Dialog open={!!viewCertificate} onOpenChange={(open) => !open && setViewCertificate(null)}>
            <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>View Certificate</DialogTitle>
                </DialogHeader>
                <div className="border p-4 rounded-lg relative min-h-[600px] flex items-center justify-center bg-white text-black">
                    {viewCertificate?.certificate_templates?.background_image && (
                        <img 
                        src={viewCertificate.certificate_templates.background_image} 
                        alt="Background" 
                        className="absolute inset-0 w-full h-full object-cover z-0 opacity-50"
                        />
                    )}
                    <div 
                        className="relative z-10 w-full h-full"
                        dangerouslySetInnerHTML={{ 
                        __html: viewCertificate?.certificate_templates?.template_html
                            ?.replace(/{student_name}/g, viewCertificate.student_profiles?.full_name || '')
                            ?.replace(/{class}/g, viewCertificate.student_profiles?.classes?.name || '')
                            ?.replace(/{date}/g, formatDate(viewCertificate.generated_date))
                            || '' 
                        }} 
                    />
                </div>
                <div className="flex justify-end mt-4">
                    <Button>
                        <Download className="mr-2 h-4 w-4" /> Download
                    </Button>
                </div>
            </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the generated certificate record.
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

export default CertificateHistory;
