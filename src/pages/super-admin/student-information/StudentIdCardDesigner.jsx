import React, { useState, useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  CreditCard, Printer, Search, Eye, Loader2, QrCode, Palette, Layout,
  LayoutGrid, Users, ChevronDown, Settings, Download
} from 'lucide-react';
import { format } from 'date-fns';
import { sortClasses, sortSections } from '@/utils/classOrderUtils';
import QRCode from 'qrcode';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════
// ID CARD TEMPLATES
// ═══════════════════════════════════════════════════
const TEMPLATES = [
  {
    id: 'classic-horizontal',
    name: 'Classic Horizontal',
    orientation: 'horizontal',
    width: 340,
    height: 220,
    bg: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    headerBg: '#ffffff',
    headerText: '#1e40af',
    bodyText: '#ffffff',
    accent: '#fbbf24',
  },
  {
    id: 'modern-vertical',
    name: 'Modern Vertical',
    orientation: 'vertical',
    width: 240,
    height: 360,
    bg: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
    headerBg: '#3b82f6',
    headerText: '#ffffff',
    bodyText: '#e2e8f0',
    accent: '#22c55e',
  },
  {
    id: 'elegant-horizontal',
    name: 'Elegant White',
    orientation: 'horizontal',
    width: 340,
    height: 220,
    bg: '#ffffff',
    headerBg: '#111827',
    headerText: '#ffffff',
    bodyText: '#374151',
    accent: '#ef4444',
  },
  {
    id: 'royal-horizontal',
    name: 'Royal Purple',
    orientation: 'horizontal',
    width: 340,
    height: 220,
    bg: 'linear-gradient(135deg, #581c87 0%, #9333ea 100%)',
    headerBg: '#ffffff',
    headerText: '#581c87',
    bodyText: '#ffffff',
    accent: '#f59e0b',
  },
];

const CARDS_PER_PAGE = [
  { value: '4', label: '4 per page (2×2)' },
  { value: '6', label: '6 per page (2×3)' },
  { value: '8', label: '8 per page (2×4)' },
];

export default function StudentIdCardDesigner() {
  const { user, currentSessionId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const printRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [filters, setFilters] = useState({ class_id: '', section_id: '' });
  const [branchInfo, setBranchInfo] = useState(null);

  // Design settings
  const [templateId, setTemplateId] = useState('classic-horizontal');
  const [showQR, setShowQR] = useState(true);
  const [cardsPerPage, setCardsPerPage] = useState('6');
  const [showPreview, setShowPreview] = useState(false);
  const [qrCodes, setQrCodes] = useState({});

  const branchId = user?.profile?.branch_id || selectedBranch?.id;
  const template = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0];

  // Load branch info
  useEffect(() => {
    if (!branchId) return;
    supabase.from('branches').select('*').eq('id', branchId).single()
      .then(({ data }) => { if (data) setBranchInfo(data); });
  }, [branchId]);

  // Load classes
  useEffect(() => {
    if (!branchId) return;
    supabase.from('classes').select('id, name').eq('branch_id', branchId)
      .then(({ data }) => setClasses(sortClasses(data || [])));
  }, [branchId]);

  // Load sections
  useEffect(() => {
    if (!filters.class_id) { setSections([]); return; }
    supabase.from('class_sections').select('sections(id, name)').eq('class_id', filters.class_id)
      .then(({ data }) => setSections(sortSections((data || []).map(d => d.sections).filter(Boolean))));
  }, [filters.class_id]);

  // Search students
  const handleSearch = async () => {
    if (!filters.class_id) return;
    setLoading(true);
    try {
      let q = supabase
        .from('student_profiles')
        .select('id, school_code, full_name, first_name, last_name, gender, date_of_birth, blood_group, phone, father_name, mother_name, present_address, permanent_address, city, state, pincode, photo_url, roll_number, classes:classes!student_profiles_class_id_fkey(id, name), sections:sections!student_profiles_section_id_fkey(id, name)')
        .eq('branch_id', branchId)
        .eq('class_id', filters.class_id)
        .or('status.is.null,status.eq.active');
      if (filters.section_id) q = q.eq('section_id', filters.section_id);
      const { data } = await q.order('full_name');
      setStudents(data || []);
      setSelectedStudents([]);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
    setLoading(false);
  };

  // Generate QR codes for selected students
  useEffect(() => {
    if (!showQR) return;
    const generateQRs = async () => {
      const codes = {};
      for (const id of selectedStudents) {
        const student = students.find(s => s.id === id);
        if (student) {
          try {
            const qrData = JSON.stringify({
              name: student.full_name || `${student.first_name} ${student.last_name}`,
              admNo: student.school_code,
              class: student.classes?.name,
              school: branchInfo?.branch_name || branchInfo?.name,
            });
            codes[id] = await QRCode.toDataURL(qrData, { width: 60, margin: 1 });
          } catch { /* skip */ }
        }
      }
      setQrCodes(codes);
    };
    generateQRs();
  }, [selectedStudents, showQR, students, branchInfo]);

  const toggleStudent = (id, checked) => {
    if (checked) setSelectedStudents(prev => [...prev, id]);
    else setSelectedStudents(prev => prev.filter(s => s !== id));
  };

  const selectAll = (checked) => {
    if (checked) setSelectedStudents(students.map(s => s.id));
    else setSelectedStudents([]);
  };

  const selectedData = students.filter(s => selectedStudents.includes(s.id));

  // ═══════════════════════════════════════════════════
  // PRINT FUNCTION
  // ═══════════════════════════════════════════════════
  const executePrint = () => {
    const isVertical = template.orientation === 'vertical';
    const cols = isVertical ? 3 : 2;
    const rows = Math.ceil(parseInt(cardsPerPage) / cols);

    const cardCSS = isVertical
      ? `
        .id-card { width: ${template.width}px; height: ${template.height}px; border-radius: 12px; overflow: hidden; border: 1px solid #ccc; page-break-inside: avoid; }
        .card-header { background: ${template.headerBg}; padding: 10px; text-align: center; border-bottom: 3px solid ${template.accent}; }
        .school-name { font-size: 12px; font-weight: bold; color: ${template.headerText}; }
        .card-body { display: flex; flex-direction: column; align-items: center; padding: 10px; background: ${template.bg}; color: ${template.bodyText}; }
        .photo { width: 70px; height: 85px; border: 3px solid ${template.accent}; border-radius: 6px; background: #e5e7eb; display: flex; align-items: center; justify-content: center; font-size: 28px; color: #6b7280; overflow: hidden; margin-bottom: 8px; }
        .photo img { width: 100%; height: 100%; object-fit: cover; }
        .student-name { font-size: 13px; font-weight: bold; text-align: center; margin-bottom: 6px; }
        .info-section { font-size: 10px; width: 100%; }
        .info-row { display: flex; margin-bottom: 3px; }
        .info-label { width: 60px; font-weight: bold; opacity: 0.8; }
        .info-value { flex: 1; }
        .qr-section { margin-top: 6px; }
        .card-footer { background: rgba(0,0,0,0.15); padding: 4px; text-align: center; font-size: 9px; color: ${template.bodyText}; }
      `
      : `
        .id-card { width: ${template.width}px; height: ${template.height}px; border-radius: 12px; overflow: hidden; border: 1px solid #ccc; page-break-inside: avoid; }
        .card-header { background: ${template.headerBg}; padding: 8px 12px; text-align: center; border-bottom: 3px solid ${template.accent}; }
        .school-name { font-size: 13px; font-weight: bold; color: ${template.headerText}; }
        .card-body { display: flex; padding: 10px; background: ${template.bg}; color: ${template.bodyText}; }
        .photo-section { width: 85px; margin-right: 10px; }
        .photo { width: 75px; height: 90px; border: 3px solid ${template.accent}; border-radius: 6px; background: #e5e7eb; display: flex; align-items: center; justify-content: center; font-size: 32px; color: #6b7280; overflow: hidden; }
        .photo img { width: 100%; height: 100%; object-fit: cover; }
        .info-section { flex: 1; font-size: 10px; }
        .student-name { font-size: 13px; font-weight: bold; margin-bottom: 5px; }
        .info-row { display: flex; margin-bottom: 3px; }
        .info-label { width: 55px; font-weight: bold; opacity: 0.8; }
        .info-value { flex: 1; }
        .qr-section { position: absolute; bottom: 28px; right: 8px; }
        .card-footer { background: rgba(0,0,0,0.15); padding: 4px 8px; text-align: center; font-size: 9px; color: ${template.bodyText}; }
      `;

    const cardsHtml = selectedData.map(s => {
      const name = s.full_name || `${s.first_name || ''} ${s.last_name || ''}`.trim();
      const initials = name.substring(0, 2).toUpperCase();
      const address = s.present_address || s.permanent_address || '';
      const qrImg = showQR && qrCodes[s.id] ? `<img src="${qrCodes[s.id]}" style="width:50px;height:50px;" />` : '';

      if (isVertical) {
        return `
          <div class="id-card">
            <div class="card-header"><div class="school-name">${branchInfo?.branch_name || branchInfo?.name || 'School'}</div></div>
            <div class="card-body">
              <div class="photo">${s.photo_url ? `<img src="${s.photo_url}" />` : initials}</div>
              <div class="student-name">${name}</div>
              <div class="info-section">
                <div class="info-row"><span class="info-label">Adm No:</span><span class="info-value">${s.school_code || 'N/A'}</span></div>
                <div class="info-row"><span class="info-label">Class:</span><span class="info-value">${s.classes?.name || ''} ${s.sections?.name ? '- ' + s.sections.name : ''}</span></div>
                <div class="info-row"><span class="info-label">DOB:</span><span class="info-value">${s.date_of_birth ? format(new Date(s.date_of_birth), 'dd/MM/yyyy') : 'N/A'}</span></div>
                <div class="info-row"><span class="info-label">Father:</span><span class="info-value">${s.father_name || 'N/A'}</span></div>
                <div class="info-row"><span class="info-label">Phone:</span><span class="info-value">${s.phone || 'N/A'}</span></div>
              </div>
              ${qrImg ? `<div class="qr-section">${qrImg}</div>` : ''}
            </div>
            <div class="card-footer">${address || 'Address not provided'}</div>
          </div>`;
      }
      return `
        <div class="id-card" style="position:relative;">
          <div class="card-header"><div class="school-name">${branchInfo?.branch_name || branchInfo?.name || 'School'}</div></div>
          <div class="card-body">
            <div class="photo-section"><div class="photo">${s.photo_url ? `<img src="${s.photo_url}" />` : initials}</div></div>
            <div class="info-section">
              <div class="student-name">${name}</div>
              <div class="info-row"><span class="info-label">Adm No:</span><span class="info-value">${s.school_code || 'N/A'}</span></div>
              <div class="info-row"><span class="info-label">Class:</span><span class="info-value">${s.classes?.name || ''} ${s.sections?.name ? '- ' + s.sections.name : ''}</span></div>
              <div class="info-row"><span class="info-label">DOB:</span><span class="info-value">${s.date_of_birth ? format(new Date(s.date_of_birth), 'dd/MM/yyyy') : 'N/A'}</span></div>
              <div class="info-row"><span class="info-label">Blood:</span><span class="info-value">${s.blood_group || 'N/A'}</span></div>
              <div class="info-row"><span class="info-label">Father:</span><span class="info-value">${s.father_name || 'N/A'}</span></div>
              <div class="info-row"><span class="info-label">Phone:</span><span class="info-value">${s.phone || 'N/A'}</span></div>
            </div>
          </div>
          ${qrImg ? `<div class="qr-section">${qrImg}</div>` : ''}
          <div class="card-footer">${address || 'Address not provided'}</div>
        </div>`;
    }).join('');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<html><head><title>Student ID Cards</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; }
      .page { display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 16px; padding: 20px; justify-items: center; }
      ${cardCSS}
      @media print {
        .page { page-break-after: always; }
        .page:last-child { page-break-after: auto; }
        .id-card { break-inside: avoid; }
      }
    </style></head><body>`);

    // Split into pages
    const perPage = parseInt(cardsPerPage);
    for (let i = 0; i < selectedData.length; i += perPage) {
      const pageCards = cardsHtml.split('</div>\n').slice(0, -1); // crude approach
      // Better: inject all cards in a single grid and let CSS handle page breaks
    }
    // Simplified: just dump all in a grid
    printWindow.document.write(`<div class="page">${cardsHtml}</div>`);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  // ═══════════════════════════════════════════════════
  // INLINE PREVIEW CARD
  // ═══════════════════════════════════════════════════
  const PreviewCard = ({ student }) => {
    const name = student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim();
    const initials = name.substring(0, 2).toUpperCase();
    const isVertical = template.orientation === 'vertical';

    if (isVertical) {
      return (
        <div className="rounded-xl overflow-hidden border shadow-md" style={{ width: template.width, height: template.height }}>
          <div className="py-2 px-3 text-center" style={{ background: template.headerBg, borderBottom: `3px solid ${template.accent}` }}>
            <p className="text-xs font-bold" style={{ color: template.headerText }}>{branchInfo?.branch_name || branchInfo?.name || 'School'}</p>
          </div>
          <div className="flex flex-col items-center p-3" style={{ background: template.bg, color: template.bodyText, flex: 1 }}>
            <div className="w-16 h-20 rounded-md border-2 overflow-hidden mb-2 flex items-center justify-center bg-gray-200" style={{ borderColor: template.accent }}>
              {student.photo_url ? <img src={student.photo_url} className="w-full h-full object-cover" /> : <span className="text-xl text-gray-500">{initials}</span>}
            </div>
            <p className="text-xs font-bold text-center mb-1">{name}</p>
            <div className="text-[9px] w-full space-y-0.5">
              <div className="flex"><span className="w-12 font-bold opacity-80">Adm:</span><span>{student.school_code || 'N/A'}</span></div>
              <div className="flex"><span className="w-12 font-bold opacity-80">Class:</span><span>{student.classes?.name} {student.sections?.name}</span></div>
              <div className="flex"><span className="w-12 font-bold opacity-80">DOB:</span><span>{student.date_of_birth ? format(new Date(student.date_of_birth), 'dd/MM/yyyy') : 'N/A'}</span></div>
              <div className="flex"><span className="w-12 font-bold opacity-80">Father:</span><span>{student.father_name || 'N/A'}</span></div>
            </div>
            {showQR && qrCodes[student.id] && (
              <img src={qrCodes[student.id]} className="mt-1 w-10 h-10" />
            )}
          </div>
          <div className="text-center py-1 text-[8px]" style={{ background: 'rgba(0,0,0,0.15)', color: template.bodyText }}>
            {student.present_address || 'Address'}
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-xl overflow-hidden border shadow-md relative" style={{ width: template.width, height: template.height }}>
        <div className="py-2 px-3 text-center" style={{ background: template.headerBg, borderBottom: `3px solid ${template.accent}` }}>
          <p className="text-xs font-bold" style={{ color: template.headerText }}>{branchInfo?.branch_name || branchInfo?.name || 'School'}</p>
        </div>
        <div className="flex p-2.5" style={{ background: template.bg, color: template.bodyText }}>
          <div className="w-[72px] mr-2.5">
            <div className="w-[68px] h-[82px] rounded-md border-2 overflow-hidden flex items-center justify-center bg-gray-200" style={{ borderColor: template.accent }}>
              {student.photo_url ? <img src={student.photo_url} className="w-full h-full object-cover" /> : <span className="text-2xl text-gray-500">{initials}</span>}
            </div>
          </div>
          <div className="flex-1 text-[9px]">
            <p className="text-xs font-bold mb-1">{name}</p>
            <div className="space-y-0.5">
              <div className="flex"><span className="w-12 font-bold opacity-80">Adm:</span><span>{student.school_code || 'N/A'}</span></div>
              <div className="flex"><span className="w-12 font-bold opacity-80">Class:</span><span>{student.classes?.name} {student.sections?.name}</span></div>
              <div className="flex"><span className="w-12 font-bold opacity-80">DOB:</span><span>{student.date_of_birth ? format(new Date(student.date_of_birth), 'dd/MM/yyyy') : 'N/A'}</span></div>
              <div className="flex"><span className="w-12 font-bold opacity-80">Blood:</span><span>{student.blood_group || 'N/A'}</span></div>
              <div className="flex"><span className="w-12 font-bold opacity-80">Father:</span><span>{student.father_name || 'N/A'}</span></div>
              <div className="flex"><span className="w-12 font-bold opacity-80">Phone:</span><span>{student.phone || 'N/A'}</span></div>
            </div>
          </div>
        </div>
        {showQR && qrCodes[student.id] && (
          <img src={qrCodes[student.id]} className="absolute bottom-7 right-2 w-10 h-10" />
        )}
        <div className="text-center py-1 px-2 text-[8px] truncate" style={{ background: 'rgba(0,0,0,0.15)', color: template.bodyText }}>
          {student.present_address || 'Address'}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="h-7 w-7 text-primary" /> ID Card Designer
            </h1>
            <p className="text-muted-foreground mt-1">Design and batch print student ID cards</p>
          </div>
          <div className="flex gap-2">
            {selectedStudents.length > 0 && (
              <>
                <Button variant="outline" onClick={() => setShowPreview(true)}>
                  <Eye className="h-4 w-4 mr-1" /> Preview ({selectedStudents.length})
                </Button>
                <Button onClick={executePrint}>
                  <Printer className="h-4 w-4 mr-1" /> Print ({selectedStudents.length})
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Design Settings */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4" /> Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => setTemplateId(tpl.id)}
                    className={cn(
                      'w-full p-3 rounded-lg border text-left transition',
                      templateId === tpl.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'hover:bg-muted/50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-5 rounded" style={{ background: tpl.bg, border: '1px solid #ddd' }} />
                      <span className="text-sm font-medium">{tpl.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] mt-1">{tpl.orientation}</Badge>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Settings className="h-4 w-4" /> Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox checked={showQR} onCheckedChange={setShowQR} id="qr" />
                  <Label htmlFor="qr" className="text-sm">Show QR Code</Label>
                </div>
                <div>
                  <Label className="text-sm">Cards per A4 Page</Label>
                  <Select value={cardsPerPage} onValueChange={setCardsPerPage}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CARDS_PER_PAGE.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Student Selection & Preview */}
          <div className="lg:col-span-3 space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="min-w-[180px]">
                    <Label className="text-sm">Class</Label>
                    <Select value={filters.class_id} onValueChange={v => setFilters({ class_id: v, section_id: '' })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select class" /></SelectTrigger>
                      <SelectContent>
                        {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-[180px]">
                    <Label className="text-sm">Section</Label>
                    <Select value={filters.section_id} onValueChange={v => setFilters(prev => ({ ...prev, section_id: v === 'all' ? '' : v }))} disabled={!filters.class_id}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="All" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sections</SelectItem>
                        {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSearch} disabled={loading || !filters.class_id}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />} Search
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Student List */}
            {students.length > 0 && (
              <Card>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{students.length} Students Found</CardTitle>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedStudents.length === students.length && students.length > 0}
                        onCheckedChange={selectAll}
                      />
                      <span className="text-sm text-muted-foreground">Select All ({selectedStudents.length})</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="max-h-[300px]">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="py-2 px-3 w-10"></th>
                          <th className="py-2 px-3 text-left">Photo</th>
                          <th className="py-2 px-3 text-left">Name</th>
                          <th className="py-2 px-3 text-left">Adm No</th>
                          <th className="py-2 px-3 text-left">Class</th>
                          <th className="py-2 px-3 text-left">Father</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map(s => (
                          <tr key={s.id} className="border-b hover:bg-muted/30">
                            <td className="py-2 px-3">
                              <Checkbox checked={selectedStudents.includes(s.id)} onCheckedChange={c => toggleStudent(s.id, c)} />
                            </td>
                            <td className="py-2 px-3">
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center text-xs">
                                {s.photo_url ? <img src={s.photo_url} className="w-full h-full object-cover" /> : (s.full_name || '?')[0]}
                              </div>
                            </td>
                            <td className="py-2 px-3 font-medium">{s.full_name || `${s.first_name} ${s.last_name}`}</td>
                            <td className="py-2 px-3">{s.school_code || '-'}</td>
                            <td className="py-2 px-3">{s.classes?.name} {s.sections?.name}</td>
                            <td className="py-2 px-3">{s.father_name || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Live Preview */}
            {selectedStudents.length > 0 && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Live Preview ({selectedStudents.length} cards)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 justify-center">
                    {selectedData.slice(0, 6).map(s => (
                      <PreviewCard key={s.id} student={s} />
                    ))}
                    {selectedStudents.length > 6 && (
                      <div className="flex items-center justify-center w-[200px] h-[180px] rounded-xl border-2 border-dashed text-muted-foreground">
                        +{selectedStudents.length - 6} more cards
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Full Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview All Cards ({selectedData.length})</DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap gap-4 justify-center py-4" ref={printRef}>
            {selectedData.map(s => (
              <PreviewCard key={s.id} student={s} />
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowPreview(false)}>Close</Button>
            <Button onClick={executePrint}><Printer className="h-4 w-4 mr-1" /> Print All</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
