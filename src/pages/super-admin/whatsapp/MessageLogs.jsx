/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MESSAGE LOGS - Super Admin
 * View WhatsApp message history
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { 
  Loader2, Search, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Clock, Eye, Send, MessageSquare
} from "lucide-react";
import api from '@/lib/api';
import { format } from 'date-fns';

const MessageLogs = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(25);
  const [filters, setFilters] = useState({
    status: '',
    start_date: '',
    end_date: '',
    recipient_phone: ''
  });

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        limit,
        offset: page * limit,
        ...filters
      };
      
      // Remove empty params
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const res = await api.get('/whatsapp/logs', { params });
      
      if (res.data.success) {
        setLogs(res.data.data || []);
        setTotalCount(res.data.total || res.data.data?.length || 0);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch message logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchLogs();
  };

  const getStatusBadge = (status) => {
    const config = {
      sent: { color: 'bg-blue-100 text-blue-700', icon: Send },
      delivered: { color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
      read: { color: 'bg-emerald-100 text-emerald-700', icon: Eye },
      failed: { color: 'bg-red-100 text-red-700', icon: XCircle },
      pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock }
    };
    
    const { color, icon: Icon } = config[status] || config.pending;
    
    return (
      <Badge variant="secondary" className={`${color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search phone number..."
                value={filters.recipient_phone}
                onChange={(e) => setFilters(prev => ({ ...prev, recipient_phone: e.target.value }))}
              />
            </div>
            <div className="w-40">
              <Select 
                value={filters.status} 
                onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-40"
              />
            </div>
            <div>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
                className="w-40"
              />
            </div>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button variant="outline" onClick={fetchLogs}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Message Logs
            </span>
            <span className="text-sm font-normal text-muted-foreground">
              Total: {totalCount}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No messages found</p>
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Recipient</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent At</TableHead>
                      <TableHead>Delivered</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{log.recipient_name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{log.recipient_phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {log.whatsapp_templates?.template_name || log.template_slug}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(log.status)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.sent_at ? format(new Date(log.sent_at), 'dd MMM, HH:mm') : '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.delivered_at ? format(new Date(log.delivered_at), 'HH:mm') : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={log.config_source === 'organization' ? 'default' : 'secondary'}>
                            {log.config_source === 'organization' ? 'Own' : 'Platform'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {page * limit + 1} to {Math.min((page + 1) * limit, totalCount)} of {totalCount}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 py-1 border rounded text-sm">
                    {page + 1} / {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= totalPages - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MessageLogs;
