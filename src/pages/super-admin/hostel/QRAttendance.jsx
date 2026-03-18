import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { formatDate, formatDateTime } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Loader2, QrCode, Plus, Ban, ArrowLeft, Copy, RefreshCw
} from 'lucide-react';

const QRAttendance = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();

  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState('');
  const [qrCodes, setQRCodes] = useState([]);
  const [qrType, setQRType] = useState('hostel_entry');
  const [validUntil, setValidUntil] = useState('');

  // Fetch hostels
  useEffect(() => {
    const loadHostels = async () => {
      if (!branchId) return;
      try {
        const res = await api.get('/hostel/list');
        if (res.data?.success) {
          const list = res.data.data || [];
          setHostels(list);
          if (list.length > 0) setSelectedHostel(list[0].id);
        }
      } catch (err) {
        console.error('Error:', err);
      }
    };
    loadHostels();
  }, [branchId]);

  // Fetch active QR codes
  const fetchQRCodes = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const params = selectedHostel ? { hostelId: selectedHostel } : {};
      const res = await api.get('/hostel-attendance/qr/active', { params });
      if (res.data?.success) setQRCodes(res.data.data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [branchId, selectedHostel]);

  useEffect(() => { fetchQRCodes(); }, [fetchQRCodes]);

  // Generate QR
  const handleGenerate = async () => {
    if (!selectedHostel) {
      toast({ variant: 'destructive', title: 'Select a hostel first' });
      return;
    }
    setGenerating(true);
    try {
      const res = await api.post('/hostel-attendance/qr/generate', {
        hostelId: selectedHostel,
        qrType,
        validUntil: validUntil || null
      });
      if (res.data?.success) {
        toast({ title: '✅ QR Code Generated', description: `Type: ${qrType}` });
        fetchQRCodes();
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setGenerating(false);
    }
  };

  // Deactivate QR
  const handleDeactivate = async (qrId) => {
    try {
      const res = await api.put(`/hostel-attendance/qr/${qrId}/deactivate`);
      if (res.data?.success) {
        toast({ title: 'QR Code deactivated' });
        fetchQRCodes();
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  // Copy QR code to clipboard
  const copyQRCode = (code) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copied!', description: 'QR code copied to clipboard' });
  };

  const qrTypeBadge = (type) => {
    const colors = {
      hostel_entry: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      hostel_exit: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      mess_entry: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      mess_exit: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    };
    return <Badge className={colors[type] || 'bg-gray-100 dark:bg-gray-800'}>{type?.replace('_', ' ')}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">📱 QR Attendance Management</h1>
            <p className="text-sm text-muted-foreground mt-1">Generate and manage QR codes for hostel attendance</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </div>

        {/* Generate QR Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="w-5 h-5" /> Generate New QR Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Hostel</label>
                <Select value={selectedHostel} onValueChange={setSelectedHostel}>
                  <SelectTrigger><SelectValue placeholder="Select Hostel" /></SelectTrigger>
                  <SelectContent>
                    {hostels.map(h => (
                      <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">QR Type</label>
                <Select value={qrType} onValueChange={setQRType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hostel_entry">🏠 Hostel Entry</SelectItem>
                    <SelectItem value="hostel_exit">🚪 Hostel Exit</SelectItem>
                    <SelectItem value="mess_entry">🍽️ Mess Entry</SelectItem>
                    <SelectItem value="mess_exit">🍽️ Mess Exit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Valid Until (optional)</label>
                <Input
                  type="datetime-local"
                  value={validUntil}
                  onChange={e => setValidUntil(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={handleGenerate} disabled={generating}>
                  {generating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <QrCode className="w-4 h-4 mr-1" />}
                  Generate QR
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active QR Codes */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Active QR Codes ({qrCodes.length})</CardTitle>
              <Button variant="ghost" size="sm" onClick={fetchQRCodes}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : qrCodes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <QrCode className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No active QR codes</p>
                <p className="text-sm">Generate a new QR code above</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>QR Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Valid Until</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {qrCodes.map((qr, idx) => (
                      <TableRow key={qr.id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {qr.qr_code?.slice(0, 30)}...
                          </code>
                        </TableCell>
                        <TableCell>{qrTypeBadge(qr.qr_type)}</TableCell>
                        <TableCell className="text-xs">{formatDateTime(qr.created_at)}</TableCell>
                        <TableCell className="text-xs">
                          {qr.valid_until ? formatDateTime(qr.valid_until) : 'No expiry'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => copyQRCode(qr.qr_code)}>
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDeactivate(qr.id)}>
                              <Ban className="w-3 h-3" />
                            </Button>
                          </div>
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
    </DashboardLayout>
  );
};

export default QRAttendance;
