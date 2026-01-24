import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Printer, Loader2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { useReactToPrint } from 'react-to-print';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.bubble.css';

const QuillReader = ({ content }) => (
  <ReactQuill value={content || ''} readOnly={true} theme="bubble" className="[&_.ql-editor]:p-0" />
);

const PrintSelectedFees = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [printData, setPrintData] = useState(null);
  const [printSettings, setPrintSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  const branchId = user?.profile?.branch_id;
  const { studentId, feeMasterIds } = location.state || {};

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Fees-Invoice-${printData?.student?.school_code || studentId}`,
  });

  useEffect(() => {
    const fetchAllDetails = async () => {
      if (!studentId || !feeMasterIds || feeMasterIds.length === 0 || !branchId || !selectedBranch) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Student or Fee details are missing.' });
        navigate(-1);
        return;
      }
      setLoading(true);

      try {
        const [studentRes, mastersRes, settingsRes] = await Promise.all([
          supabase.from('profiles').select('*, school:schools(*), class:classes(name), section:sections(name)').eq('id', studentId).eq('branch_id', selectedBranch.id).single(),
          supabase.from('fee_masters').select('*, fee_group:fee_group_id(name), fee_type:fee_type_id(name, code), due_date').in('id', feeMasterIds),
          supabase.from('print_settings').select('header_image_url, footer_content').eq('branch_id', branchId).eq('branch_id', selectedBranch.id).eq('type', 'fees_receipt').single(),
        ]);

        if (studentRes.error) throw studentRes.error;
        if (mastersRes.error) throw mastersRes.error;
        if (settingsRes.error && settingsRes.error.code !== 'PGRST116') throw settingsRes.error;

        setPrintData({ student: studentRes.data, masters: mastersRes.data });
        setPrintSettings(settingsRes.data);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error fetching data', description: error.message });
      } finally {
        setLoading(false);
      }
    };

    fetchAllDetails();
  }, [studentId, feeMasterIds, branchId, selectedBranch, toast, navigate]);


  useEffect(() => {
    if (!loading && printData) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, printData, handlePrint]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
        <span className="ml-2">Loading Invoice...</span>
      </div>
    );
  }

  if (!printData) {
    return (
        <div className='flex flex-col justify-center items-center h-screen text-destructive'>
            <p>Could not load invoice details.</p>
            <Button variant="outline" onClick={() => navigate(-1)} className="mt-4"><ArrowLeft className="mr-2 h-4 w-4" /> Go Back</Button>
        </div>
    );
  }

  const { student, masters } = printData;
  const school = student.school;
  const currencySymbol = school?.currency_symbol || '₹';
  const grandTotal = masters.reduce((sum, master) => sum + Number(master.amount), 0);

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto mb-4 flex justify-between items-center print:hidden">
        <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
        <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print</Button>
      </div>

      <div ref={printRef}>
        <Card className="shadow-lg my-4 mx-auto w-full max-w-4xl" style={{ fontFamily: 'Arial, sans-serif' }}>
          <CardContent className="p-8">
            {printSettings?.header_image_url ? (
                <header className="pb-4 mb-4 border-b-2 border-black">
                    <img src={printSettings.header_image_url} alt="School Header" className="w-full h-auto object-contain" style={{ maxHeight: '120px' }} />
                </header>
            ) : (
                <header className="flex justify-between items-start pb-4 mb-4 border-b-2 border-black">
                    <div className="flex items-center">
                        {school.logo_url && <img src={school.logo_url} alt="School Logo" className="h-16 mr-4" />}
                        <div><h1 className="text-3xl font-bold uppercase">{school.name}</h1></div>
                    </div>
                    <div className="text-right text-xs">
                        {school.address && <p>{school.address}</p>}
                        {school.contact_number && <p><strong>Phone:</strong> {school.contact_number}</p>}
                        {school.contact_email && <p><strong>Email:</strong> {school.contact_email}</p>}
                    </div>
                </header>
            )}

            <div className="text-center my-4">
              <h2 className="text-xl font-bold inline-block px-4 py-1 border-2 border-black">FEES INVOICE</h2>
            </div>

            <div className="flex justify-between items-start mb-6 text-sm">
              <div>
                <p><strong>Student Name:</strong> {student.full_name}</p>
                <p><strong>Admission No:</strong> {student.school_code}</p>
                <p><strong>Father Name:</strong> {student.father_name}</p>
                <p><strong>Class:</strong> {student.class?.name} ({student.section?.name})</p>
              </div>
              <div>
                <p><strong>Date:</strong> {format(new Date(), 'dd-MM-yyyy')}</p>
              </div>
            </div>

            <table className="w-full text-sm border-collapse">
              <thead className="font-bold">
                <tr className="border-y-2 border-black bg-gray-50">
                  <th className="p-2 text-left">Fees Group</th>
                  <th className="p-2 text-left">Fees Code</th>
                  <th className="p-2 text-left">Due Date</th>
                  <th className="p-2 text-right">Amount ({currencySymbol})</th>
                </tr>
              </thead>
              <tbody>
                {masters.map((master) => (
                  <tr key={master.id} className="border-b">
                    <td className="p-2">{master.fee_group.name}</td>
                    <td className="p-2">{master.fee_type.code}</td>
                    <td className="p-2">{format(new Date(master.due_date), 'dd/MM/yyyy')}</td>
                    <td className="p-2 text-right">{Number(master.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="font-bold">
                <tr className="border-t-2 border-black">
                  <td colSpan="3" className="p-2 text-right">Grand Total</td>
                  <td className="p-2 text-right">{currencySymbol}{grandTotal.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>

            <footer className="mt-8 pt-4 border-t text-sm text-center">
              {printSettings?.footer_content ? (
                <div className="prose prose-sm max-w-none text-center"><QuillReader content={printSettings.footer_content} /></div>
              ) : (
                <p>This is a computer generated invoice and does not require a signature.</p>
              )}
            </footer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrintSelectedFees;
