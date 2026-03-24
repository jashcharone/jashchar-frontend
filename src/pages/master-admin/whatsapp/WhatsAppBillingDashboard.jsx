import React, { useState, useEffect } from 'react';
import { formatDate } from '@/utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, Filter } from "lucide-react";
import api from '@/lib/api';
import { useToast } from "@/components/ui/use-toast";

const WhatsAppBillingDashboard = () => {
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [branchId, setSchoolId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (branchId) params.branchId = branchId;

      const res = await api.get('/whatsapp-manager/usage/dashboard', { params });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch billing data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Usage & Billing Dashboard</CardTitle>
          <CardDescription>Monitor WhatsApp usage across all organizations for billing and auditing.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6 items-end">
            <div className="grid gap-2">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Organization ID (Optional)</Label>
              <Input placeholder="Filter by School ID" value={branchId} onChange={e => setSchoolId(e.target.value)} />
            </div>
            <Button onClick={fetchData} disabled={loading}>
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
            <Button variant="outline" onClick={() => { setStartDate(''); setEndDate(''); setSchoolId(''); fetchData(); }}>
              Reset
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Branches</TableHead>
                  <TableHead>Total Messages</TableHead>
                  <TableHead>Template / Utility</TableHead>
                  <TableHead>Billing Usage</TableHead>
                  <TableHead>Last Sent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No usage data found for the selected period.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row) => (
                    <TableRow key={row.branch_id}>
                      <TableCell className="font-medium">
                        {row.organization_name}
                        <div className="text-xs text-muted-foreground">{row.whatsapp_number}</div>
                      </TableCell>
                      <TableCell>{row.branch_count}</TableCell>
                      <TableCell className="font-bold">{row.total_messages}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Badge variant="secondary" title="Template">{row.template_messages_count}</Badge>
                          <Badge variant="outline" title="Utility">{row.utility_messages_count}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.current_billing_usage > 0 ? "default" : "outline"}>
                          {row.current_billing_usage}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {row.last_message_sent ? formatDate(row.last_message_sent) : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppBillingDashboard;
