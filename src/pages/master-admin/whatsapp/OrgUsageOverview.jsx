/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ORG USAGE OVERVIEW - Master Admin Only
 * View all organizations' WhatsApp usage and billing
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
  Loader2, Building2, MessageSquare, TrendingUp, IndianRupee, 
  Search, Download, RefreshCw, BarChart3, PieChart 
} from "lucide-react";
import api from '@/lib/api';

const OrgUsageOverview = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [usageData, setUsageData] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM format
  );

  const [totals, setTotals] = useState({
    totalOrgs: 0,
    totalMessages: 0,
    platformMessages: 0,
    orgMessages: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchUsage();
  }, [selectedMonth]);

  const fetchUsage = async () => {
    setLoading(true);
    try {
      const res = await api.get('/whatsapp/platform/usage', {
        params: { month: selectedMonth }
      });
      
      if (res.data.success) {
        setUsageData(res.data.data || []);
        setRawData(res.data.raw || []);
        
        // Calculate totals
        const data = res.data.data || [];
        setTotals({
          totalOrgs: data.length,
          totalMessages: data.reduce((sum, org) => sum + (org.total_messages || 0), 0),
          platformMessages: data.reduce((sum, org) => sum + (org.platform_messages || 0), 0),
          orgMessages: data.reduce((sum, org) => sum + (org.organization_messages || 0), 0),
          totalRevenue: data.reduce((sum, org) => sum + (org.total_cost || 0), 0)
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch usage data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredData = usageData.filter(org => 
    org.organization_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.organization_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = ['Organization', 'Code', 'Total Messages', 'Platform Messages', 'Own Messages', 'Total Cost'];
    const rows = usageData.map(org => [
      org.organization_name,
      org.organization_code,
      org.total_messages,
      org.platform_messages,
      org.organization_messages,
      `₹${org.total_cost?.toFixed(2)}`
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Organizations</p>
                <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {totals.totalOrgs}
                </h3>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Total Messages</p>
                <h3 className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {totals.totalMessages.toLocaleString()}
                </h3>
              </div>
              <MessageSquare className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400">Via Platform</p>
                <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {totals.platformMessages.toLocaleString()}
                </h3>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400">Via Own Config</p>
                <h3 className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {totals.orgMessages.toLocaleString()}
                </h3>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 border-emerald-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">Total Revenue</p>
                <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  ₹{totals.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </h3>
              </div>
              <IndianRupee className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <CardTitle>Organization Usage Details</CardTitle>
              <CardDescription>
                WhatsApp usage breakdown by organization for {selectedMonth}
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
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search organization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No usage data found for this period</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Organization</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Platform</TableHead>
                    <TableHead className="text-center">Own Config</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-center">Config Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((org) => (
                    <TableRow key={org.organization_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{org.organization_name}</p>
                          <p className="text-xs text-muted-foreground">{org.organization_code}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {(org.total_messages || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                          {(org.platform_messages || 0).toLocaleString()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                          {(org.organization_messages || 0).toLocaleString()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{(org.total_cost || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center">
                        {org.organization_messages > 0 ? (
                          <Badge className="bg-blue-500">Own</Badge>
                        ) : (
                          <Badge variant="outline">Platform</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrgUsageOverview;
