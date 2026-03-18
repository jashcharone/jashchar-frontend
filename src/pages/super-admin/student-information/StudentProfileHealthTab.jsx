import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { getApiBaseUrl } from '@/utils/platform';
import { formatDate } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Heart, Syringe, Stethoscope, Plus, Edit, Trash2, Save, AlertCircle,
  Activity, Eye, Droplets, Scale, Ruler, Phone, Shield, ChevronDown,
} from 'lucide-react';

const _apiBase = getApiBaseUrl();
const BASE_URL = _apiBase ? `${_apiBase}/api` : '/api';

const apiCall = async (endpoint, method = 'GET', body = null) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
  };
  if (body && method !== 'GET') options.body = JSON.stringify(body);
  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  return response.json();
};

// ─── MINI COMPONENTS ──────────
const InfoField = ({ icon: Icon, label, value, className = '' }) => (
  <div className={`flex items-start gap-2 ${className}`}>
    {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || '-'}</p>
    </div>
  </div>
);

const StatBox = ({ label, value, color = 'blue', icon: Icon }) => (
  <div className={`bg-${color}-50 dark:bg-${color}-900/20 rounded-lg p-3 text-center`}>
    {Icon && <Icon className={`h-5 w-5 mx-auto mb-1 text-${color}-600`} />}
    <p className={`text-lg font-bold text-${color}-700 dark:text-${color}-400`}>{value || '-'}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

// ===================== MAIN COMPONENT =====================
export default function StudentProfileHealthTab({ studentId }) {
  const { currentSessionId } = useAuth();
  const { selectedBranch } = useBranch();

  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);

  // Health record
  const [healthRecord, setHealthRecord] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [healthForm, setHealthForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Vaccinations
  const [vaccinations, setVaccinations] = useState([]);
  const [showVaccineModal, setShowVaccineModal] = useState(false);
  const [editVaccine, setEditVaccine] = useState(null);
  const [vaccineForm, setVaccineForm] = useState({
    vaccine_name: '', dose_number: 1, vaccination_date: '', next_due_date: '',
    administered_by: '', administered_at: '', batch_number: '', status: 'completed', notes: '',
  });

  // Medical Visits
  const [medicalVisits, setMedicalVisits] = useState([]);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [editVisit, setEditVisit] = useState(null);
  const [visitForm, setVisitForm] = useState({
    visit_date: new Date().toISOString().split('T')[0], visit_type: 'sick_visit',
    complaint: '', diagnosis: '', treatment: '', medication_given: '',
    referred_to_hospital: false, attended_by: '', parent_notified: false,
    rest_advised: false, rest_duration: '', sent_home: false, follow_up_required: false, follow_up_date: '', notes: '',
  });

  // ─── FETCH ALL DATA ────────────────
  const fetchAll = useCallback(async () => {
    if (!studentId || !selectedBranch?.id) return;
    setLoading(true);
    try {
      const [healthRes, vaccRes, visitRes] = await Promise.all([
        apiCall(`/student-health/${studentId}/record`),
        apiCall(`/student-health/${studentId}/vaccinations`),
        apiCall(`/student-health/${studentId}/medical-visits`),
      ]);
      if (healthRes.success) {
        setHealthRecord(healthRes.data);
        setHealthForm(healthRes.data || {});
      }
      if (vaccRes.success) setVaccinations(vaccRes.data);
      if (visitRes.success) setMedicalVisits(visitRes.data);
    } catch (e) {
      console.error('Error fetching health data:', e);
    }
    setLoading(false);
  }, [studentId, selectedBranch?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── SAVE HEALTH RECORD ────────────
  const saveHealthRecord = async () => {
    setSaving(true);
    const result = await apiCall(`/student-health/${studentId}/record`, 'POST', healthForm);
    if (result.success) {
      setHealthRecord(result.data);
      setEditMode(false);
    }
    setSaving(false);
  };

  // ─── VACCINATION CRUD ──────────────
  const openVaccineModal = (vac = null) => {
    if (vac) {
      setEditVaccine(vac);
      setVaccineForm({ ...vac });
    } else {
      setEditVaccine(null);
      setVaccineForm({
        vaccine_name: '', dose_number: 1, vaccination_date: '', next_due_date: '',
        administered_by: '', administered_at: '', batch_number: '', status: 'completed', notes: '',
      });
    }
    setShowVaccineModal(true);
  };

  const saveVaccination = async () => {
    if (!vaccineForm.vaccine_name) return;
    let result;
    if (editVaccine) {
      result = await apiCall(`/student-health/vaccinations/${editVaccine.id}`, 'PUT', vaccineForm);
    } else {
      result = await apiCall(`/student-health/${studentId}/vaccinations`, 'POST', vaccineForm);
    }
    if (result.success) { setShowVaccineModal(false); fetchAll(); }
  };

  const deleteVaccination = async (id) => {
    if (!confirm('Delete this vaccination record?')) return;
    const result = await apiCall(`/student-health/vaccinations/${id}`, 'DELETE');
    if (result.success) fetchAll();
  };

  // ─── MEDICAL VISIT CRUD ────────────
  const openVisitModal = (visit = null) => {
    if (visit) {
      setEditVisit(visit);
      setVisitForm({ ...visit });
    } else {
      setEditVisit(null);
      setVisitForm({
        visit_date: new Date().toISOString().split('T')[0], visit_type: 'sick_visit',
        complaint: '', diagnosis: '', treatment: '', medication_given: '',
        referred_to_hospital: false, attended_by: '', parent_notified: false,
        rest_advised: false, rest_duration: '', sent_home: false, follow_up_required: false, follow_up_date: '', notes: '',
      });
    }
    setShowVisitModal(true);
  };

  const saveMedicalVisit = async () => {
    if (!visitForm.visit_date) return;
    let result;
    if (editVisit) {
      result = await apiCall(`/student-health/medical-visits/${editVisit.id}`, 'PUT', visitForm);
    } else {
      result = await apiCall(`/student-health/${studentId}/medical-visits`, 'POST', visitForm);
    }
    if (result.success) { setShowVisitModal(false); fetchAll(); }
  };

  const deleteMedicalVisit = async (id) => {
    if (!confirm('Delete this medical visit record?')) return;
    const result = await apiCall(`/student-health/medical-visits/${id}`, 'DELETE');
    if (result.success) fetchAll();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const visitTypeLabels = {
    sick_visit: 'Sick Visit', routine_checkup: 'Routine Checkup', emergency: 'Emergency',
    follow_up: 'Follow Up', vaccination: 'Vaccination', dental: 'Dental', eye_checkup: 'Eye Checkup',
  };

  const vaccineStatusColors = {
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', skipped: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatBox label="Height" value={healthRecord?.height_cm ? `${healthRecord.height_cm} cm` : '-'} color="blue" icon={Ruler} />
        <StatBox label="Weight" value={healthRecord?.weight_kg ? `${healthRecord.weight_kg} kg` : '-'} color="green" icon={Scale} />
        <StatBox label="BMI" value={healthRecord?.bmi || '-'} color="purple" icon={Activity} />
        <StatBox label="Blood Group" value={healthRecord?.blood_group || '-'} color="red" icon={Droplets} />
        <StatBox label="Vaccinations" value={vaccinations.filter(v => v.status === 'completed').length} color="emerald" icon={Syringe} />
      </div>

      {/* Sub Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 rounded-lg">
          <TabsTrigger value="profile"><Heart className="h-4 w-4 mr-1" /> Health Profile</TabsTrigger>
          <TabsTrigger value="vaccinations"><Syringe className="h-4 w-4 mr-1" /> Vaccinations ({vaccinations.length})</TabsTrigger>
          <TabsTrigger value="visits"><Stethoscope className="h-4 w-4 mr-1" /> Medical Visits ({medicalVisits.length})</TabsTrigger>
        </TabsList>

        {/* ═══ HEALTH PROFILE TAB ═══ */}
        <TabsContent value="profile" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Health Profile</h3>
            {!editMode ? (
              <Button size="sm" variant="outline" onClick={() => { setEditMode(true); setHealthForm(healthRecord || {}); }}>
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
                <Button size="sm" onClick={saveHealthRecord} disabled={saving}>
                  <Save className="h-4 w-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>

          {!editMode ? (
            /* View Mode */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Physical Metrics</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <InfoField icon={Ruler} label="Height" value={healthRecord?.height_cm ? `${healthRecord.height_cm} cm` : null} />
                  <InfoField icon={Scale} label="Weight" value={healthRecord?.weight_kg ? `${healthRecord.weight_kg} kg` : null} />
                  <InfoField icon={Activity} label="BMI" value={healthRecord?.bmi} />
                  <InfoField icon={Droplets} label="Blood Group" value={healthRecord?.blood_group} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Vision</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <InfoField icon={Eye} label="Left Eye" value={healthRecord?.vision_left} />
                  <InfoField icon={Eye} label="Right Eye" value={healthRecord?.vision_right} />
                  <InfoField label="Wears Glasses" value={healthRecord?.wears_glasses ? 'Yes' : 'No'} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Medical Conditions</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <InfoField icon={AlertCircle} label="Allergies" value={healthRecord?.allergies} />
                  <InfoField label="Chronic Conditions" value={healthRecord?.chronic_conditions} />
                  <InfoField label="Disabilities" value={healthRecord?.disabilities} />
                  <InfoField label="Current Medications" value={healthRecord?.medications} />
                  <InfoField label="Dietary Restrictions" value={healthRecord?.dietary_restrictions} />
                  <InfoField label="Special Needs" value={healthRecord?.special_needs} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Emergency & Insurance</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <InfoField icon={Phone} label="Emergency Contact" value={healthRecord?.emergency_contact_name} />
                  <InfoField label="Emergency Phone" value={healthRecord?.emergency_contact_phone} />
                  <InfoField label="Relation" value={healthRecord?.emergency_contact_relation} />
                  <InfoField label="Family Doctor" value={healthRecord?.family_doctor_name} />
                  <InfoField icon={Shield} label="Insurance Provider" value={healthRecord?.insurance_provider} />
                  <InfoField label="Insurance No" value={healthRecord?.health_insurance_number} />
                  <InfoField label="Valid Till" value={healthRecord?.insurance_valid_till ? formatDate(healthRecord.insurance_valid_till) : null} />
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Edit Mode */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Physical Metrics</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-medium">Height (cm)</label><Input type="number" value={healthForm.height_cm || ''} onChange={e => setHealthForm(p => ({ ...p, height_cm: e.target.value }))} /></div>
                  <div><label className="text-xs font-medium">Weight (kg)</label><Input type="number" value={healthForm.weight_kg || ''} onChange={e => setHealthForm(p => ({ ...p, weight_kg: e.target.value }))} /></div>
                  <div><label className="text-xs font-medium">Blood Group</label>
                    <Select value={healthForm.blood_group || ''} onValueChange={v => setHealthForm(p => ({ ...p, blood_group: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Vision</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-medium">Left Eye</label><Input value={healthForm.vision_left || ''} onChange={e => setHealthForm(p => ({ ...p, vision_left: e.target.value }))} placeholder="e.g., 6/6" /></div>
                  <div><label className="text-xs font-medium">Right Eye</label><Input value={healthForm.vision_right || ''} onChange={e => setHealthForm(p => ({ ...p, vision_right: e.target.value }))} placeholder="e.g., 6/6" /></div>
                  <div className="col-span-2 flex items-center gap-2">
                    <Switch checked={healthForm.wears_glasses || false} onCheckedChange={v => setHealthForm(p => ({ ...p, wears_glasses: v }))} />
                    <label className="text-sm">Wears Glasses</label>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Medical Conditions</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div><label className="text-xs font-medium">Allergies</label><Textarea value={healthForm.allergies || ''} onChange={e => setHealthForm(p => ({ ...p, allergies: e.target.value }))} rows={2} /></div>
                  <div><label className="text-xs font-medium">Chronic Conditions</label><Textarea value={healthForm.chronic_conditions || ''} onChange={e => setHealthForm(p => ({ ...p, chronic_conditions: e.target.value }))} rows={2} /></div>
                  <div><label className="text-xs font-medium">Disabilities</label><Input value={healthForm.disabilities || ''} onChange={e => setHealthForm(p => ({ ...p, disabilities: e.target.value }))} /></div>
                  <div><label className="text-xs font-medium">Medications</label><Input value={healthForm.medications || ''} onChange={e => setHealthForm(p => ({ ...p, medications: e.target.value }))} /></div>
                  <div><label className="text-xs font-medium">Dietary Restrictions</label><Input value={healthForm.dietary_restrictions || ''} onChange={e => setHealthForm(p => ({ ...p, dietary_restrictions: e.target.value }))} /></div>
                  <div><label className="text-xs font-medium">Special Needs</label><Input value={healthForm.special_needs || ''} onChange={e => setHealthForm(p => ({ ...p, special_needs: e.target.value }))} /></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Emergency & Insurance</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div><label className="text-xs font-medium">Emergency Contact Name</label><Input value={healthForm.emergency_contact_name || ''} onChange={e => setHealthForm(p => ({ ...p, emergency_contact_name: e.target.value }))} /></div>
                  <div><label className="text-xs font-medium">Emergency Phone</label><Input value={healthForm.emergency_contact_phone || ''} onChange={e => setHealthForm(p => ({ ...p, emergency_contact_phone: e.target.value }))} /></div>
                  <div><label className="text-xs font-medium">Relation</label><Input value={healthForm.emergency_contact_relation || ''} onChange={e => setHealthForm(p => ({ ...p, emergency_contact_relation: e.target.value }))} /></div>
                  <div><label className="text-xs font-medium">Family Doctor</label><Input value={healthForm.family_doctor_name || ''} onChange={e => setHealthForm(p => ({ ...p, family_doctor_name: e.target.value }))} /></div>
                  <div><label className="text-xs font-medium">Doctor Phone</label><Input value={healthForm.family_doctor_phone || ''} onChange={e => setHealthForm(p => ({ ...p, family_doctor_phone: e.target.value }))} /></div>
                  <div><label className="text-xs font-medium">Insurance Provider</label><Input value={healthForm.insurance_provider || ''} onChange={e => setHealthForm(p => ({ ...p, insurance_provider: e.target.value }))} /></div>
                  <div><label className="text-xs font-medium">Insurance Number</label><Input value={healthForm.health_insurance_number || ''} onChange={e => setHealthForm(p => ({ ...p, health_insurance_number: e.target.value }))} /></div>
                  <div><label className="text-xs font-medium">Valid Till</label><Input type="date" value={healthForm.insurance_valid_till || ''} onChange={e => setHealthForm(p => ({ ...p, insurance_valid_till: e.target.value }))} /></div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ═══ VACCINATIONS TAB ═══ */}
        <TabsContent value="vaccinations" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Vaccination Records</h3>
            <Button size="sm" onClick={() => openVaccineModal()}>
              <Plus className="h-4 w-4 mr-1" /> Add Vaccination
            </Button>
          </div>

          {vaccinations.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">
              <Syringe className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>No vaccination records</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-2">
              {vaccinations.map((vac) => (
                <Card key={vac.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{vac.vaccine_name}</p>
                          <Badge variant="outline" className="text-xs">Dose {vac.dose_number}</Badge>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${vaccineStatusColors[vac.status] || ''}`}>
                            {vac.status?.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                          {vac.vaccination_date && <span>Date: {formatDate(vac.vaccination_date)}</span>}
                          {vac.next_due_date && <span>Next Due: {formatDate(vac.next_due_date)}</span>}
                          {vac.administered_by && <span>By: {vac.administered_by}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openVaccineModal(vac)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteVaccination(vac.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══ MEDICAL VISITS TAB ═══ */}
        <TabsContent value="visits" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Medical Visit History</h3>
            <Button size="sm" onClick={() => openVisitModal()}>
              <Plus className="h-4 w-4 mr-1" /> Add Visit
            </Button>
          </div>

          {medicalVisits.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">
              <Stethoscope className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>No medical visit records</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-2">
              {medicalVisits.map((visit) => (
                <Card key={visit.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{visitTypeLabels[visit.visit_type] || visit.visit_type}</Badge>
                          <span className="text-sm font-medium">{formatDate(visit.visit_date)}</span>
                          {visit.sent_home && <Badge className="bg-orange-100 text-orange-700 text-[10px]">Sent Home</Badge>}
                          {visit.referred_to_hospital && <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px]">Referred to Hospital</Badge>}
                        </div>
                        <div className="mt-1">
                          {visit.complaint && <p className="text-sm"><span className="text-muted-foreground">Complaint:</span> {visit.complaint}</p>}
                          {visit.diagnosis && <p className="text-sm"><span className="text-muted-foreground">Diagnosis:</span> {visit.diagnosis}</p>}
                          {visit.treatment && <p className="text-sm"><span className="text-muted-foreground">Treatment:</span> {visit.treatment}</p>}
                        </div>
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          {visit.attended_by && <span>Attended by: {visit.attended_by}</span>}
                          {visit.follow_up_date && <span>Follow-up: {formatDate(visit.follow_up_date)}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openVisitModal(visit)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteMedicalVisit(visit.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── VACCINATION MODAL ──── */}
      <Dialog open={showVaccineModal} onOpenChange={setShowVaccineModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editVaccine ? 'Edit Vaccination' : 'Add Vaccination'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="text-xs font-medium">Vaccine Name *</label><Input value={vaccineForm.vaccine_name} onChange={e => setVaccineForm(p => ({ ...p, vaccine_name: e.target.value }))} placeholder="e.g., BCG, Hepatitis B" /></div>
            <div><label className="text-xs font-medium">Dose Number</label><Input type="number" min={1} value={vaccineForm.dose_number} onChange={e => setVaccineForm(p => ({ ...p, dose_number: parseInt(e.target.value) || 1 }))} /></div>
            <div><label className="text-xs font-medium">Status</label>
              <Select value={vaccineForm.status} onValueChange={v => setVaccineForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="skipped">Skipped</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-xs font-medium">Vaccination Date</label><Input type="date" value={vaccineForm.vaccination_date || ''} onChange={e => setVaccineForm(p => ({ ...p, vaccination_date: e.target.value }))} /></div>
            <div><label className="text-xs font-medium">Next Due Date</label><Input type="date" value={vaccineForm.next_due_date || ''} onChange={e => setVaccineForm(p => ({ ...p, next_due_date: e.target.value }))} /></div>
            <div><label className="text-xs font-medium">Administered By</label><Input value={vaccineForm.administered_by || ''} onChange={e => setVaccineForm(p => ({ ...p, administered_by: e.target.value }))} /></div>
            <div><label className="text-xs font-medium">Administered At</label><Input value={vaccineForm.administered_at || ''} onChange={e => setVaccineForm(p => ({ ...p, administered_at: e.target.value }))} /></div>
            <div><label className="text-xs font-medium">Batch Number</label><Input value={vaccineForm.batch_number || ''} onChange={e => setVaccineForm(p => ({ ...p, batch_number: e.target.value }))} /></div>
            <div className="col-span-2"><label className="text-xs font-medium">Notes</label><Textarea value={vaccineForm.notes || ''} onChange={e => setVaccineForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVaccineModal(false)}>Cancel</Button>
            <Button onClick={saveVaccination} disabled={!vaccineForm.vaccine_name}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── MEDICAL VISIT MODAL ──── */}
      <Dialog open={showVisitModal} onOpenChange={setShowVisitModal}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editVisit ? 'Edit Medical Visit' : 'Add Medical Visit'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium">Visit Date *</label><Input type="date" value={visitForm.visit_date} onChange={e => setVisitForm(p => ({ ...p, visit_date: e.target.value }))} /></div>
            <div><label className="text-xs font-medium">Visit Type</label>
              <Select value={visitForm.visit_type} onValueChange={v => setVisitForm(p => ({ ...p, visit_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(visitTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><label className="text-xs font-medium">Complaint</label><Textarea value={visitForm.complaint || ''} onChange={e => setVisitForm(p => ({ ...p, complaint: e.target.value }))} rows={2} /></div>
            <div className="col-span-2"><label className="text-xs font-medium">Diagnosis</label><Textarea value={visitForm.diagnosis || ''} onChange={e => setVisitForm(p => ({ ...p, diagnosis: e.target.value }))} rows={2} /></div>
            <div className="col-span-2"><label className="text-xs font-medium">Treatment</label><Textarea value={visitForm.treatment || ''} onChange={e => setVisitForm(p => ({ ...p, treatment: e.target.value }))} rows={2} /></div>
            <div className="col-span-2"><label className="text-xs font-medium">Medication Given</label><Input value={visitForm.medication_given || ''} onChange={e => setVisitForm(p => ({ ...p, medication_given: e.target.value }))} /></div>
            <div><label className="text-xs font-medium">Attended By</label><Input value={visitForm.attended_by || ''} onChange={e => setVisitForm(p => ({ ...p, attended_by: e.target.value }))} /></div>
            <div className="flex items-center gap-2 pt-5"><Switch checked={visitForm.referred_to_hospital || false} onCheckedChange={v => setVisitForm(p => ({ ...p, referred_to_hospital: v }))} /><label className="text-xs">Referred to Hospital</label></div>
            <div className="flex items-center gap-2"><Switch checked={visitForm.parent_notified || false} onCheckedChange={v => setVisitForm(p => ({ ...p, parent_notified: v }))} /><label className="text-xs">Parent Notified</label></div>
            <div className="flex items-center gap-2"><Switch checked={visitForm.sent_home || false} onCheckedChange={v => setVisitForm(p => ({ ...p, sent_home: v }))} /><label className="text-xs">Sent Home</label></div>
            <div className="flex items-center gap-2"><Switch checked={visitForm.rest_advised || false} onCheckedChange={v => setVisitForm(p => ({ ...p, rest_advised: v }))} /><label className="text-xs">Rest Advised</label></div>
            {visitForm.rest_advised && <div><label className="text-xs font-medium">Rest Duration</label><Input value={visitForm.rest_duration || ''} onChange={e => setVisitForm(p => ({ ...p, rest_duration: e.target.value }))} placeholder="e.g., 2 days" /></div>}
            <div className="flex items-center gap-2"><Switch checked={visitForm.follow_up_required || false} onCheckedChange={v => setVisitForm(p => ({ ...p, follow_up_required: v }))} /><label className="text-xs">Follow Up Required</label></div>
            {visitForm.follow_up_required && <div><label className="text-xs font-medium">Follow Up Date</label><Input type="date" value={visitForm.follow_up_date || ''} onChange={e => setVisitForm(p => ({ ...p, follow_up_date: e.target.value }))} /></div>}
            <div className="col-span-2"><label className="text-xs font-medium">Notes</label><Textarea value={visitForm.notes || ''} onChange={e => setVisitForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVisitModal(false)}>Cancel</Button>
            <Button onClick={saveMedicalVisit} disabled={!visitForm.visit_date}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
