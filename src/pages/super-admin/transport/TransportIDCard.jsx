/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TRANSPORT ID CARD — Day 27
 * Student transport pass / ID card generation with photo, route info,
 * QR code, and print-ready layout. Bulk generation by class/route.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    CreditCard, Printer, Search, Loader2, Users, Bus, Route,
    Download, Filter, QrCode, Eye
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/services/api';
import { toast } from 'sonner';
import { formatDate } from '@/utils/dateUtils';

// Single ID Card component
const Contact = ({ student, orgName, branchName, sessionName }) => {
    const qrData = encodeURIComponent(JSON.stringify({
        id: student.student_id,
        name: student.student_name,
        route: student.route_title,
    }));

    return (
        <div className="id-card border-2 border-gray-300 rounded-xl overflow-hidden bg-white shadow-lg"
            style={{ width: '340px', minHeight: '220px', pageBreakInside: 'avoid' }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-2 text-center">
                <h3 className="font-bold text-sm tracking-wide">{orgName || 'Jashchar ERP'}</h3>
                <p className="text-[10px] opacity-80">{branchName || 'Branch'}</p>
            </div>

            <div className="flex p-3 gap-3">
                {/* Photo */}
                <div className="flex-shrink-0">
                    <div className="w-16 h-20 bg-gray-100 rounded-md border flex items-center justify-center overflow-hidden">
                        {student.photo_url ? (
                            <img src={student.photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <Users className="h-8 w-8 text-gray-300" />
                        )}
                    </div>
                </div>

                {/* Details */}
                <div className="flex-1 text-xs space-y-1">
                    <p className="font-bold text-gray-900 text-sm">{student.student_name}</p>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-gray-600">
                        <span className="font-medium">Class:</span>
                        <span>{student.class_name || '-'}</span>
                        <span className="font-medium">Section:</span>
                        <span>{student.section_name || '-'}</span>
                        <span className="font-medium">Route:</span>
                        <span className="truncate">{student.route_title || '-'}</span>
                        <span className="font-medium">Stop:</span>
                        <span className="truncate">{student.pickup_point || '-'}</span>
                    </div>
                </div>

                {/* QR Code placeholder — uses a small inline SVG pattern */}
                <div className="flex-shrink-0 flex flex-col items-center">
                    <div className="w-14 h-14 bg-gray-100 border rounded flex items-center justify-center">
                        <QrCode className="h-10 w-10 text-gray-400" />
                    </div>
                    <p className="text-[8px] text-gray-400 mt-0.5">SCAN</p>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-1.5 flex items-center justify-between border-t text-[10px] text-gray-500">
                <span>Session: {sessionName || '-'}</span>
                <span className="font-medium text-blue-600">🚌 TRANSPORT PASS</span>
                <span>ID: {String(student.student_id).slice(-8)}</span>
            </div>
        </div>
    );
};

const TransportIDCard = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const branchId = selectedBranch?.id || user?.profile?.branch_id;
    const printRef = useRef();

    const [students, setStudents] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRoute, setFilterRoute] = useState('all');
    const [selectedStudents, setSelectedStudents] = useState(new Set());
    const [showPreview, setShowPreview] = useState(false);

    const orgName = user?.profile?.organization_name || selectedBranch?.organization_name || 'Jashchar ERP';
    const branchName = selectedBranch?.name || '';
    const sessionName = user?.profile?.session_name || '';

    // Fetch transport students
    const fetchData = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        try {
            const [studentsRes, routesRes] = await Promise.all([
                api.get('/transport/reports/route-students', { params: { branchId, organizationId } }),
                api.get('/transport/routes', { params: { branchId, organizationId } }),
            ]);

            // Flatten route → students
            const routeData = studentsRes.data?.data || [];
            const allStudents = [];
            routeData.forEach(route => {
                (route.student_transport_details || []).forEach(detail => {
                    allStudents.push({
                        student_id: detail.student_id || detail.students?.id,
                        student_name: detail.students
                            ? `${detail.students.first_name || ''} ${detail.students.last_name || ''}`.trim()
                            : 'Unknown',
                        class_name: detail.students?.class_name || '',
                        section_name: detail.students?.section_name || '',
                        photo_url: detail.students?.photo_url || '',
                        route_id: route.id,
                        route_title: route.route_title || '',
                        pickup_point: detail.pickup_point || detail.boarding_point || '',
                    });
                });
            });

            setStudents(allStudents);
            setRoutes(routesRes.data?.data || []);
        } catch (err) {
            console.error('ID Card fetch error:', err);
            toast.error('Failed to load ID card data');
        } finally { setLoading(false); }
    }, [branchId, organizationId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Filter students
    const filteredStudents = students.filter(s => {
        const matchSearch = !searchTerm || s.student_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchRoute = filterRoute === 'all' || s.route_id === filterRoute;
        return matchSearch && matchRoute;
    });

    // Selection
    const toggleSelect = (id) => {
        const next = new Set(selectedStudents);
        if (next.has(id)) next.delete(id); else next.add(id);
        setSelectedStudents(next);
    };
    const selectAll = () => {
        if (selectedStudents.size === filteredStudents.length) {
            setSelectedStudents(new Set());
        } else {
            setSelectedStudents(new Set(filteredStudents.map(s => s.student_id)));
        }
    };

    const cardsToShow = showPreview
        ? filteredStudents.filter(s => selectedStudents.has(s.student_id))
        : [];

    // Print
    const handlePrint = () => {
        if (cardsToShow.length === 0) return toast.error('Select students first');
        const printWindow = window.open('', '_blank');
        const cardsHtml = cardsToShow.map(s => `
            <div style="border:2px solid #d1d5db;border-radius:12px;overflow:hidden;width:340px;min-height:220px;background:#fff;box-shadow:0 2px 4px rgba(0,0,0,0.1);page-break-inside:avoid;margin:8px;">
                <div style="background:linear-gradient(135deg,#2563eb,#4f46e5);color:#fff;padding:8px 16px;text-align:center;">
                    <h3 style="margin:0;font-size:14px;letter-spacing:1px;">${orgName}</h3>
                    <p style="margin:2px 0 0;font-size:10px;opacity:0.8;">${branchName}</p>
                </div>
                <div style="display:flex;padding:12px;gap:12px;">
                    <div style="width:64px;height:80px;background:#f3f4f6;border-radius:6px;border:1px solid #e5e7eb;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">
                        ${s.photo_url ? `<img src="${s.photo_url}" style="width:100%;height:100%;object-fit:cover;"/>` : '<span style="color:#d1d5db;font-size:24px;">👤</span>'}
                    </div>
                    <div style="flex:1;font-size:11px;">
                        <p style="font-weight:bold;font-size:13px;margin:0 0 4px;">${s.student_name}</p>
                        <table style="font-size:11px;"><tbody>
                            <tr><td style="font-weight:600;padding-right:6px;">Class:</td><td>${s.class_name || '-'}</td></tr>
                            <tr><td style="font-weight:600;">Route:</td><td>${s.route_title || '-'}</td></tr>
                            <tr><td style="font-weight:600;">Stop:</td><td>${s.pickup_point || '-'}</td></tr>
                        </tbody></table>
                    </div>
                </div>
                <div style="background:#f9fafb;padding:4px 16px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:9px;color:#6b7280;">
                    <span>Session: ${sessionName}</span>
                    <span style="color:#2563eb;font-weight:600;">🚌 TRANSPORT PASS</span>
                    <span>ID: ${String(s.student_id).slice(-8)}</span>
                </div>
            </div>
        `).join('');

        printWindow.document.write(`
            <html><head><title>Transport ID Cards</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, sans-serif; margin: 20px; }
                .cards { display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; }
                @media print { body { margin: 10mm; } .cards { gap: 8px; } }
            </style></head>
            <body><div class="cards">${cardsHtml}</div></body></html>
        `);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <CreditCard className="h-6 w-6 text-indigo-600" />
                            Transport ID Cards
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Generate & print student transport passes</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm"
                            onClick={() => { if (selectedStudents.size === 0) toast.error('Select students first'); else setShowPreview(!showPreview); }}>
                            <Eye className="h-4 w-4 mr-1" /> {showPreview ? 'Hide Preview' : 'Preview Cards'}
                        </Button>
                        <Button size="sm" onClick={handlePrint} disabled={selectedStudents.size === 0}>
                            <Printer className="h-4 w-4 mr-1" /> Print {selectedStudents.size > 0 ? `(${selectedStudents.size})` : ''}
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input className="pl-9" placeholder="Search student..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <Select value={filterRoute} onValueChange={setFilterRoute}>
                        <SelectTrigger className="w-48"><SelectValue placeholder="Filter by route" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Routes</SelectItem>
                            {routes.map(r => <SelectItem key={r.id} value={r.id}>{r.route_title}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={selectAll}>
                        {selectedStudents.size === filteredStudents.length && filteredStudents.length > 0 ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Badge variant="outline" className="text-xs">
                        {selectedStudents.size} selected / {filteredStudents.length} students
                    </Badge>
                </div>

                {/* Student List */}
                <Card>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex justify-center py-16">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="text-center py-16">
                                <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500">No transport students found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th className="px-4 py-3 text-left w-10">
                                                <input type="checkbox"
                                                    checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                                                    onChange={selectAll}
                                                    className="rounded" />
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Class</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Route</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Stop</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {filteredStudents.map(s => (
                                            <tr key={s.student_id}
                                                className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer ${selectedStudents.has(s.student_id) ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
                                                onClick={() => toggleSelect(s.student_id)}>
                                                <td className="px-4 py-3">
                                                    <input type="checkbox"
                                                        checked={selectedStudents.has(s.student_id)}
                                                        onChange={() => toggleSelect(s.student_id)}
                                                        onClick={e => e.stopPropagation()}
                                                        className="rounded" />
                                                </td>
                                                <td className="px-4 py-3 font-medium flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                                                        {s.photo_url
                                                            ? <img src={s.photo_url} alt="" className="w-full h-full object-cover" />
                                                            : <Users className="h-4 w-4 text-gray-400" />}
                                                    </div>
                                                    {s.student_name}
                                                </td>
                                                <td className="px-4 py-3">{s.class_name || '-'}</td>
                                                <td className="px-4 py-3">{s.route_title || '-'}</td>
                                                <td className="px-4 py-3">{s.pickup_point || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ID Card Preview */}
                {showPreview && cardsToShow.length > 0 && (
                    <div>
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-indigo-600" />
                            Card Preview ({cardsToShow.length} cards)
                        </h2>
                        <div ref={printRef} className="flex flex-wrap gap-4 justify-center">
                            {cardsToShow.map(s => (
                                <Contact key={s.student_id} student={s}
                                    orgName={orgName} branchName={branchName} sessionName={sessionName} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default TransportIDCard;
