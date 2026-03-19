import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from '@/lib/api';
import { useToast } from "@/components/ui/use-toast";

const WhatsAppLogs = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/whatsapp-manager/logs?page=${page}&limit=20`);
      if (res.data.success) {
        setLogs(res.data.data);
        setTotal(res.data.count);
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch logs.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Message Logs</CardTitle>
          <CardDescription>History of messages sent via WhatsApp.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap hidden sm:table-cell">School</TableHead>
                  <TableHead className="whitespace-nowrap hidden md:table-cell">Template</TableHead>
                  <TableHead className="whitespace-nowrap">Recipient</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && logs.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                ) : logs.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No logs found.</TableCell></TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-xs sm:text-sm">{new Date(log.created_at).toLocaleString()}</TableCell>
                      <TableCell className="hidden sm:table-cell">{log.schools?.name || 'N/A'}</TableCell>
                      <TableCell className="hidden md:table-cell">{log.whatsapp_templates?.name || 'N/A'}</TableCell>
                      <TableCell className="whitespace-nowrap">{log.recipient_phone}</TableCell>
                      <TableCell>
                        <Badge variant={log.status === 'sent' ? 'default' : 'secondary'}>{log.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Simple Pagination */}
          <div className="flex justify-between items-center mt-4 px-4 sm:px-0">
             <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
             <span className="text-xs sm:text-sm text-muted-foreground">Page {page}</span>
             <Button variant="outline" size="sm" disabled={logs.length < 20} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppLogs;
