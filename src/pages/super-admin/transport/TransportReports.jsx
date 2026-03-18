/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TRANSPORT REPORTS ENGINE — Day 24
 * Comprehensive multi-tab reporting: Fleet, Routes, Trips, Attendance, Fees,
 * Maintenance, Fuel, Driver Performance, Incidents
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    FileText, Download, Search, Loader2, Bus, Route, Users,
    Calendar, Fuel, Wrench, AlertTriangle, UserCheck, BarChart3,
    Filter, Printer
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/services/api';
import { toast } from 'sonner';
import { formatDate } from '@/utils/dateUtils';

const REPORT_TABS = [
    { key: 'fleet', label: 'Fleet Summary', icon: Bus, endpoint: '/transport/reports/fleet-summary' },
    { key: 'routes', label: 'Route Students', icon: Route, endpoint: '/transport/reports/route-students' },
    { key: 'trips', label: 'Trip Report', icon: Calendar, endpoint: '/transport/reports/trip-report' },
    { key: 'attendance', label: 'Attendance', icon: UserCheck, endpoint: '/transport/reports/attendance-report' },
    { key: 'fees', label: 'Fee Collection', icon: BarChart3, endpoint: '/transport/reports/fee-report' },
    { key: 'maintenance', label: 'Maintenance', icon: Wrench, endpoint: '/transport/reports/maintenance-report' },
    { key: 'fuel', label: 'Fuel Log', icon: Fuel, endpoint: '/transport/reports/fuel-report' },
    { key: 'drivers', label: 'Driver Performance', icon: Users, endpoint: '/transport/reports/driver-report' },
    { key: 'incidents', label: 'Incidents', icon: AlertTriangle, endpoint: '/transport/reports/incident-report' },
];

const TransportReports = () => {
    const { user, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    const [activeReport, setActiveReport] = useState('fleet');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Fetch report data
    const fetchReport = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        try {
            const tab = REPORT_TABS.find(t => t.key === activeReport);
            const params = { branchId, organizationId };
            if (dateFrom) params.from_date = dateFrom;
            if (dateTo) params.to_date = dateTo;
            const res = await api.get(tab.endpoint, { params });
            setData(res.data?.data || []);
        } catch (err) {
            console.error('Report fetch error:', err);
            toast.error('Failed to load report data');
            setData([]);
        } finally { setLoading(false); }
    }, [branchId, organizationId, activeReport, dateFrom, dateTo]);

    useEffect(() => { fetchReport(); }, [fetchReport]);

    // Export CSV
    const handleExport = () => {
        if (data.length === 0) return toast.error('No data to export');
        const headers = getColumns(activeReport).map(c => c.label);
        const rows = filteredData.map(row =>
            getColumns(activeReport).map(c => c.render ? c.render(row) : (row[c.key] || ''))
        );
        const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transport_${activeReport}_report.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Report exported!');
    };

    // Print
    const handlePrint = () => window.print();

    // Column definitions per report type
    const getColumns = (type) => {
        switch (type) {
            case 'fleet':
                return [
                    { key: 'vehicle_number', label: 'Vehicle No' },
                    { key: 'vehicle_name', label: 'Name' },
                    { key: 'vehicle_type', label: 'Type' },
                    { key: 'seating_capacity', label: 'Capacity' },
                    { key: 'fuel_type', label: 'Fuel' },
                    { key: 'is_active', label: 'Status', render: (r) => r.is_active ? '✅ Active' : '❌ Inactive' },
                    { key: 'driver', label: 'Driver', render: (r) => r.transport_drivers?.name || '-' },
                ];
            case 'routes':
                return [
                    { key: 'route_title', label: 'Route' },
                    { key: 'distance_km', label: 'Distance (km)' },
                    { key: 'students', label: 'Students', render: (r) => r.student_transport_details?.length || 0 },
                    { key: 'is_active', label: 'Status', render: (r) => r.is_active ? '✅ Active' : '❌ Inactive' },
                ];
            case 'trips':
                return [
                    { key: 'trip_date', label: 'Date', render: (r) => formatDate(r.trip_date) },
                    { key: 'trip_type', label: 'Type' },
                    { key: 'vehicle', label: 'Vehicle', render: (r) => r.transport_vehicles?.vehicle_number || '-' },
                    { key: 'driver', label: 'Driver', render: (r) => r.transport_drivers?.name || '-' },
                    { key: 'route', label: 'Route', render: (r) => r.transport_routes?.route_title || '-' },
                    { key: 'status', label: 'Status' },
                ];
            case 'attendance':
                return [
                    { key: 'student', label: 'Student', render: (r) => `${r.students?.first_name || ''} ${r.students?.last_name || ''}` },
                    { key: 'class', label: 'Class', render: (r) => r.students?.class_name || '-' },
                    { key: 'trip_date', label: 'Date', render: (r) => formatDate(r.transport_trips?.trip_date) },
                    { key: 'trip_type', label: 'Trip', render: (r) => r.transport_trips?.trip_type || '-' },
                    { key: 'boarding_status', label: 'Status' },
                    { key: 'boarding_time', label: 'Time' },
                ];
            case 'fees':
                return [
                    { key: 'student', label: 'Student', render: (r) => `${r.students?.first_name || ''} ${r.students?.last_name || ''}` },
                    { key: 'class', label: 'Class', render: (r) => r.students?.class_name || '-' },
                    { key: 'route', label: 'Route', render: (r) => r.transport_routes?.route_title || '-' },
                    { key: 'fee_amount', label: 'Fee Amount', render: (r) => `₹${parseFloat(r.fee_amount || 0).toLocaleString('en-IN')}` },
                ];
            case 'maintenance':
                return [
                    { key: 'vehicle', label: 'Vehicle', render: (r) => r.transport_vehicles?.vehicle_number || '-' },
                    { key: 'service_type', label: 'Service Type' },
                    { key: 'service_date', label: 'Date', render: (r) => formatDate(r.service_date) },
                    { key: 'cost', label: 'Cost', render: (r) => `₹${parseFloat(r.cost || 0).toLocaleString('en-IN')}` },
                    { key: 'status', label: 'Status' },
                    { key: 'description', label: 'Description' },
                ];
            case 'fuel':
                return [
                    { key: 'vehicle', label: 'Vehicle', render: (r) => r.transport_vehicles?.vehicle_number || '-' },
                    { key: 'fill_date', label: 'Date', render: (r) => formatDate(r.fill_date) },
                    { key: 'liters', label: 'Liters' },
                    { key: 'price_per_liter', label: 'Price/L', render: (r) => `₹${r.price_per_liter || '-'}` },
                    { key: 'total_cost', label: 'Total', render: (r) => `₹${parseFloat(r.total_cost || 0).toLocaleString('en-IN')}` },
                    { key: 'odometer_reading', label: 'Odometer' },
                ];
            case 'drivers':
                return [
                    { key: 'name', label: 'Driver Name' },
                    { key: 'phone', label: 'Phone' },
                    { key: 'license_number', label: 'License No' },
                    { key: 'license_expiry', label: 'License Expiry', render: (r) => r.license_expiry ? formatDate(r.license_expiry) : '-' },
                    { key: 'status', label: 'Status' },
                    { key: 'experience_years', label: 'Experience (yrs)' },
                ];
            case 'incidents':
                return [
                    { key: 'incident_date', label: 'Date', render: (r) => formatDate(r.incident_date) },
                    { key: 'incident_type', label: 'Type' },
                    { key: 'severity', label: 'Severity' },
                    { key: 'vehicle', label: 'Vehicle', render: (r) => r.transport_vehicles?.vehicle_number || '-' },
                    { key: 'driver', label: 'Driver', render: (r) => r.transport_drivers?.name || '-' },
                    { key: 'status', label: 'Status' },
                    { key: 'description', label: 'Description' },
                ];
            default:
                return [];
        }
    };

    // Search/filter data
    const filteredData = data.filter(row => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const cols = getColumns(activeReport);
        return cols.some(c => {
            const val = c.render ? c.render(row) : (row[c.key] || '');
            return String(val).toLowerCase().includes(term);
        });
    });

    const columns = getColumns(activeReport);
    const currentTab = REPORT_TABS.find(t => t.key === activeReport);
    const hasDateFilter = ['trips', 'attendance', 'maintenance', 'fuel', 'incidents'].includes(activeReport);

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FileText className="h-6 w-6 text-blue-600" />
                            Transport Reports
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Comprehensive transport reporting & export</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handlePrint}>
                            <Printer className="h-4 w-4 mr-1" /> Print
                        </Button>
                        <Button size="sm" onClick={handleExport}>
                            <Download className="h-4 w-4 mr-1" /> Export CSV
                        </Button>
                    </div>
                </div>

                {/* Report Tabs */}
                <div className="flex gap-1 flex-wrap bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    {REPORT_TABS.map(tab => (
                        <button key={tab.key}
                            onClick={() => { setActiveReport(tab.key); setSearchTerm(''); setDateFrom(''); setDateTo(''); }}
                            className={`px-3 py-2 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                                activeReport === tab.key
                                    ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <tab.icon className="h-3.5 w-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Filters Row */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input className="pl-9" placeholder="Search in results..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {hasDateFilter && (
                        <>
                            <div className="flex items-center gap-2">
                                <Label className="text-xs whitespace-nowrap">From:</Label>
                                <Input type="date" className="w-36" value={dateFrom}
                                    onChange={e => setDateFrom(e.target.value)} />
                            </div>
                            <div className="flex items-center gap-2">
                                <Label className="text-xs whitespace-nowrap">To:</Label>
                                <Input type="date" className="w-36" value={dateTo}
                                    onChange={e => setDateTo(e.target.value)} />
                            </div>
                        </>
                    )}
                    <Badge variant="outline" className="text-xs">
                        {filteredData.length} records
                    </Badge>
                </div>

                {/* Report Table */}
                <Card>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex justify-center py-16">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            </div>
                        ) : filteredData.length === 0 ? (
                            <div className="text-center py-16">
                                <currentTab.icon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500">No data found for {currentTab.label}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                                            {columns.map(col => (
                                                <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                                    {col.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {filteredData.map((row, idx) => (
                                            <tr key={row.id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                                                {columns.map(col => (
                                                    <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                                                        {col.render ? col.render(row) : (row[col.key] ?? '-')}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Summary for fee report */}
                {activeReport === 'fees' && filteredData.length > 0 && (
                    <Card className="bg-green-50 dark:bg-green-950/20 border-green-200">
                        <CardContent className="py-4 flex items-center justify-between">
                            <span className="font-semibold text-green-700">Total Fee Collection</span>
                            <span className="text-2xl font-bold text-green-700">
                                ₹{filteredData.reduce((s, r) => s + (parseFloat(r.fee_amount) || 0), 0).toLocaleString('en-IN')}
                            </span>
                        </CardContent>
                    </Card>
                )}

                {activeReport === 'maintenance' && filteredData.length > 0 && (
                    <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200">
                        <CardContent className="py-4 flex items-center justify-between">
                            <span className="font-semibold text-orange-700">Total Maintenance Cost</span>
                            <span className="text-2xl font-bold text-orange-700">
                                ₹{filteredData.reduce((s, r) => s + (parseFloat(r.cost) || 0), 0).toLocaleString('en-IN')}
                            </span>
                        </CardContent>
                    </Card>
                )}

                {activeReport === 'fuel' && filteredData.length > 0 && (
                    <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
                        <CardContent className="py-4 flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <span className="font-semibold text-blue-700">Total Fuel Cost</span>
                                <p className="text-2xl font-bold text-blue-700">
                                    ₹{filteredData.reduce((s, r) => s + (parseFloat(r.total_cost) || 0), 0).toLocaleString('en-IN')}
                                </p>
                            </div>
                            <div>
                                <span className="font-semibold text-blue-700">Total Liters</span>
                                <p className="text-2xl font-bold text-blue-700">
                                    {filteredData.reduce((s, r) => s + (parseFloat(r.liters) || 0), 0).toFixed(1)} L
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default TransportReports;
