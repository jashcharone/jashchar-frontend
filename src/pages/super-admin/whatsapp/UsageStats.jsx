/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * USAGE STATS - Super Admin
 * View organization's WhatsApp usage and billing
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { 
  Loader2, MessageSquare, TrendingUp, IndianRupee, 
  Download, RefreshCw, BarChart3, Calendar
} from "lucide-react";
import api from '@/lib/api';

const UsageStats = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [usageData, setUsageData] = useState([]);
  const [totals, setTotals] = useState({
    messages: 0,
    delivered: 0,
    failed: 0,
    cost: 0
  });
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  useEffect(() => {
    fetchUsage();
  }, [selectedMonth]);

  const fetchUsage = async () => {
    setLoading(true);
    try {
      const res = await api.get('/whatsapp/usage', {
        params: { 
          start_month: selectedMonth,
          end_month: selectedMonth
        }
      });
      
      if (res.data.success) {
        setUsageData(res.data.data || []);
        setTotals(res.data.totals || {
          messages: 0,
          delivered: 0,
          failed: 0,
          cost: 0
        });
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, suffix = '' }) => (
    <Card className={`bg-gradient-to-br ${color}`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">{title}</p>
            <h3 className="text-2xl font-bold">
              {typeof value === 'number' ? value.toLocaleString('en-IN') : value}{suffix}
            </h3>
          </div>
          <Icon className="h-8 w-8 opacity-70" />
        </div>
      </CardContent>
    </Card>
  );

  const exportReport = () => {
    const headers = ['Month', 'Messages', 'Delivered', 'Failed', 'Platform', 'Own', 'Cost'];
    const rows = usageData.map(u => [
      u.billing_month,
      u.messages_sent,
      u.messages_delivered,
      u.messages_failed,
      u.platform_messages,
      u.organization_messages,
      `₹${parseFloat(u.total_cost || 0).toFixed(2)}`
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whatsapp-usage-${selectedMonth}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Messages"
          value={totals.messages}
          icon={MessageSquare}
          color="from-blue-50 to-blue-100 dark:from-blue-900/30 text-blue-700 dark:text-blue-300"
        />
        <StatCard
          title="Delivered"
          value={totals.delivered}
          icon={TrendingUp}
          color="from-green-50 to-green-100 dark:from-green-900/30 text-green-700 dark:text-green-300"
        />
        <StatCard
          title="Failed"
          value={totals.failed}
          icon={BarChart3}
          color="from-red-50 to-red-100 dark:from-red-900/30 text-red-700 dark:text-red-300"
        />
        <StatCard
          title="Total Cost"
          value={`₹${(totals.cost || 0).toFixed(2)}`}
          icon={IndianRupee}
          color="from-purple-50 to-purple-100 dark:from-purple-900/30 text-purple-700 dark:text-purple-300"
        />
      </div>

      {/* Filters & Actions */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Monthly Usage Report
              </CardTitle>
              <CardDescription>
                Detailed breakdown of WhatsApp usage for {selectedMonth}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-40"
              />
              <Button variant="outline" onClick={fetchUsage}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={exportReport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : usageData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No usage data for this period</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Month</TableHead>
                    <TableHead className="text-center">Sent</TableHead>
                    <TableHead className="text-center">Delivered</TableHead>
                    <TableHead className="text-center">Failed</TableHead>
                    <TableHead className="text-center">Platform</TableHead>
                    <TableHead className="text-center">Own Config</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usageData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        {row.billing_month}
                      </TableCell>
                      <TableCell className="text-center">
                        {(row.messages_sent || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-100 text-green-700">
                          {(row.messages_delivered || 0).toLocaleString()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="destructive">
                          {(row.messages_failed || 0).toLocaleString()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {(row.platform_messages || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        {(row.organization_messages || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ₹{parseFloat(row.total_cost || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Totals Row */}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-center">{totals.messages.toLocaleString()}</TableCell>
                    <TableCell className="text-center">{totals.delivered.toLocaleString()}</TableCell>
                    <TableCell className="text-center">{totals.failed.toLocaleString()}</TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-right">
                      ₹{(totals.cost || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/10">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <IndianRupee className="h-8 w-8 text-blue-500" />
            <div>
              <h4 className="font-semibold text-blue-700 dark:text-blue-400">Billing Information</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Messages sent via Platform Config are billed at the platform rate.
                If you have your own WhatsApp configuration, those messages are billed directly by your provider.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsageStats;
