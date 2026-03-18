import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, Copy, Sheet, FileText, Printer, Trash2, HelpCircle, ChevronLeft, ChevronRight, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const DomainList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('custom_domains')
      .select(`
        *,
        schools (name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching domains:', error);
      // Fallback to mock data if table doesn't exist yet
      setDomains([
        {
            id: 1,
            schools: { name: 'Shri Shaileshwara Vidya Kendra CSBC School' },
            origin_url: 'https://www.jashwik.in/shailavarana',
            domain_url: 'ITKINNOVATIONS.jashwik.in',
            domain_type: 'Sub Domain',
            request_date: '2025-08-14',
            approved_date: '2025-09-13',
            status: 'Approved'
        }
      ]);
    } else {
      setDomains(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
      if(!confirm("Are you sure you want to delete this domain?")) return;
      
      const { error } = await supabase.from('custom_domains').delete().eq('id', id);
      if(error) {
          toast({ variant: "destructive", title: "Error", description: error.message });
      } else {
          toast({ title: "Deleted", description: "Domain deleted successfully" });
          fetchDomains();
      }
  };

  return (
    <DashboardLayout>
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center bg-card p-4 rounded-lg shadow-sm border border-border">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-foreground">Domain List</h1>
        </div>
        <Link to="/master-admin/custom-domain/instruction">
          <Button className="bg-orange-400 hover:bg-orange-500 text-white gap-2">
            <HelpCircle size={16} />
            Custom Domain Instruction
          </Button>
        </Link>
      </div>

      {/* Content */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            {/* Export Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="icon" title="Copy"><Copy size={16} /></Button>
              <Button variant="outline" size="icon" title="Excel"><Sheet size={16} /></Button>
              <Button variant="outline" size="icon" title="CSV"><FileText size={16} /></Button>
              <Button variant="outline" size="icon" title="PDF"><FileText size={16} /></Button>
              <Button variant="outline" size="icon" title="Print"><Printer size={16} /></Button>
            </div>
            
            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search..." 
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-gray-100">
                <TableRow>
                  <TableHead className="w-[50px]">Sl</TableHead>
                  <TableHead>School Name</TableHead>
                  <TableHead>Origin Url</TableHead>
                  <TableHead>Custom Domain</TableHead>
                  <TableHead>Domain Type</TableHead>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Approved Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={9} className="text-center h-24">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                    </TableRow>
                ) : domains.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={9} className="text-center h-24">No domains found.</TableCell>
                    </TableRow>
                ) : (
                domains.map((domain, index) => (
                  <TableRow key={domain.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{domain.schools?.name || 'Unknown School'}</TableCell>
                    <TableCell>
                      <a href={domain.origin_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                        {domain.origin_url}
                      </a>
                    </TableCell>
                    <TableCell>{domain.domain_url}</TableCell>
                    <TableCell>{domain.domain_type}</TableCell>
                    <TableCell>{new Date(domain.request_date).toLocaleDateString()}</TableCell>
                    <TableCell>{domain.approved_date ? new Date(domain.approved_date).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <Badge className={
                          domain.status === 'Approved' ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200" :
                          domain.status === 'Rejected' ? "bg-red-100 text-red-800 hover:bg-red-200 border-red-200" :
                          "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200"
                      }>
                        {domain.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(domain.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                )))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between py-4">
            <div className="text-sm text-gray-500">
              Showing {domains.length} entries
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled><ChevronLeft size={16} /></Button>
              <Button variant="outline" size="sm" className="bg-orange-400 text-white hover:bg-orange-500 border-orange-400">1</Button>
              <Button variant="outline" size="sm" disabled><ChevronRight size={16} /></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
  );
};

export default DomainList;
