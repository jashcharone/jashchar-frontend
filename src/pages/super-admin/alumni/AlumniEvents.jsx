import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { useBranch } from '@/contexts/BranchContext';
import { PermissionButton } from '@/components/PermissionComponents';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar, Plus } from 'lucide-react';

const AlumniEvents = () => {
  const { toast } = useToast();
  const { selectedBranch } = useBranch();
  const calendarRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    id: null,
    title: '',
    audience: '1',
    session_id: '',
    selected_list: [],
    from_date: '',
    to_date: '',
    note: '',
    photo: 'defualt.png',
    status: true,
    show_web: false,
    branch_id: ''
  });

  // Dropdown options
  const [branches, setBranches] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      setFormData(prev => ({ ...prev, branch_id: selectedBranch.id }));
    }
  }, [selectedBranch]);

  const loadInitialData = async () => {
    try {
      // Load branches, sessions, classes
      const [branchRes, sessionRes, classRes] = await Promise.all([
        axios.get('/api/branches'),
        axios.get('/api/academics/sessions'),
        axios.get('/api/academics/classes')
      ]);

      setBranches(branchRes.data.data || []);
      setSessions(sessionRes.data.data || []);
      setClasses(classRes.data.data || []);

      // Load events
      await loadEvents();
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load data'
      });
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedBranch) params.branch_id = selectedBranch.id;
      const response = await axios.get('/api/alumni-events/calendar', { params });
      
      if (response.data.success) {
        setEvents(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load events'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async (classId) => {
    try {
      const response = await axios.get(`/api/academics/sections?class_id=${classId}`);
      if (response.data.success) {
        setSections(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading sections:', error);
    }
  };

  const handleDateClick = (arg) => {
    setCurrentEvent(null);
    setIsViewMode(false);
    setFormData({
      id: null,
      title: '',
      audience: '1',
      session_id: '',
      selected_list: [],
      from_date: arg.dateStr,
      to_date: arg.dateStr,
      note: '',
      photo: 'defualt.png',
      status: true,
      show_web: false,
      branch_id: ''
    });
    setIsDialogOpen(true);
  };

  const handleEventClick = async (info) => {
    try {
      const response = await axios.get(`/api/alumni-events/${info.event.id}`);
      if (response.data.success) {
        const eventData = response.data.data;
        setCurrentEvent(eventData);
        setFormData({
          id: eventData.id,
          title: eventData.title,
          audience: eventData.audience?.toString() || '1',
          session_id: eventData.session_id || '',
          selected_list: eventData.selected_list ? JSON.parse(eventData.selected_list) : [],
          from_date: eventData.from_date,
          to_date: eventData.to_date,
          note: eventData.note || '',
          photo: eventData.photo || 'defualt.png',
          status: eventData.status === 1,
          show_web: eventData.show_web || false,
          branch_id: eventData.branch_id || ''
        });
        setIsViewMode(true);
        setIsDialogOpen(true);

        // Load sections if class-based audience
        if (eventData.audience > 1 && eventData.selected_list) {
          const classIds = JSON.parse(eventData.selected_list)
            .filter(item => item.type === 'class')
            .map(item => item.id);
          if (classIds.length > 0) {
            await loadSections(classIds[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading event details:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load event details'
      });
    }
  };

  const handleAddEvent = () => {
    setCurrentEvent(null);
    setIsViewMode(false);
    setFormData({
      id: null,
      title: '',
      audience: '1',
      session_id: '',
      selected_list: [],
      from_date: new Date().toISOString().split('T')[0],
      to_date: new Date().toISOString().split('T')[0],
      note: '',
      photo: 'defualt.png',
      status: true,
      show_web: false,
      branch_id: ''
    });
    setIsDialogOpen(true);
  };

  const handleEdit = () => {
    setIsViewMode(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/alumni-events/${formData.id}`);
      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Event deleted successfully'
        });
        setIsDialogOpen(false);
        loadEvents();
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete event'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Event title is required'
      });
      return;
    }

    if (!formData.from_date || !formData.to_date) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Start and end dates are required'
      });
      return;
    }

    if (formData.audience !== '1' && !formData.session_id) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Passing session is required for class/section audience'
      });
      return;
    }

    if (formData.audience !== '1' && formData.selected_list.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please select at least one class or section'
      });
      return;
    }

    try {
      const payload = {
        ...formData,
        status: formData.status ? 1 : 0,
        audience: parseInt(formData.audience)
      };

      const response = formData.id
        ? await axios.put(`/api/alumni-events/${formData.id}`, payload)
        : await axios.post('/api/alumni-events', payload);

      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Event saved successfully'
        });
        setIsDialogOpen(false);
        loadEvents();
      }
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save event'
      });
    }
  };

  const handleAudienceChange = (value) => {
    setFormData({
      ...formData,
      audience: value,
      selected_list: []
    });
  };

  const handleClassToggle = (classId, className) => {
    const exists = formData.selected_list.find(
      item => item.type === 'class' && item.id === classId
    );

    if (exists) {
      setFormData({
        ...formData,
        selected_list: formData.selected_list.filter(
          item => !(item.type === 'class' && item.id === classId)
        )
      });
    } else {
      setFormData({
        ...formData,
        selected_list: [
          ...formData.selected_list,
          { type: 'class', id: classId, name: className }
        ]
      });
    }
  };

  const handleSectionToggle = (sectionId, sectionName, classId, className) => {
    const exists = formData.selected_list.find(
      item => item.type === 'section' && item.id === sectionId
    );

    if (exists) {
      setFormData({
        ...formData,
        selected_list: formData.selected_list.filter(
          item => !(item.type === 'section' && item.id === sectionId)
        )
      });
    } else {
      setFormData({
        ...formData,
        selected_list: [
          ...formData.selected_list,
          {
            type: 'section',
            id: sectionId,
            name: sectionName,
            class_id: classId,
            class_name: className
          }
        ]
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Alumni Events Calendar</span>
            <PermissionButton moduleSlug="alumni.events" action="add">
              <Button onClick={handleAddEvent}>
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </PermissionButton>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading calendar...</p>
            </div>
          ) : (
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek'
              }}
              events={events}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              height="auto"
              editable={false}
              selectable={true}
            />
          )}
        </CardContent>
      </Card>

      {/* Add/Edit/View Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isViewMode ? 'Event Details' : currentEvent ? 'Edit Event' : 'Add Event'}
            </DialogTitle>
            {isViewMode && (
              <DialogDescription>View and manage event information</DialogDescription>
            )}
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {/* Title */}
              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter event title"
                  required
                  disabled={isViewMode}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="from_date">Start Date *</Label>
                  <Input
                    id="from_date"
                    type="date"
                    value={formData.from_date}
                    onChange={(e) => setFormData({ ...formData, from_date: e.target.value })}
                    required
                    disabled={isViewMode}
                  />
                </div>
                <div>
                  <Label htmlFor="to_date">End Date *</Label>
                  <Input
                    id="to_date"
                    type="date"
                    value={formData.to_date}
                    onChange={(e) => setFormData({ ...formData, to_date: e.target.value })}
                    required
                    disabled={isViewMode}
                  />
                </div>
              </div>

              {/* Branch */}
              {!selectedBranch && (
              <div>
                <Label htmlFor="branch_id">Branch</Label>
                <Select
                  value={formData.branch_id}
                  onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
                  disabled={isViewMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Branches</SelectItem>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.branch_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              )}

              {/* Audience */}
              <div>
                <Label htmlFor="audience">Audience *</Label>
                <Select
                  value={formData.audience}
                  onValueChange={handleAudienceChange}
                  disabled={isViewMode}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Everybody</SelectItem>
                    <SelectItem value="2">By Class</SelectItem>
                    <SelectItem value="3">By Section</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Session (if class/section selected) */}
              {formData.audience !== '1' && (
                <div>
                  <Label htmlFor="session_id">Passing Session *</Label>
                  <Select
                    value={formData.session_id}
                    onValueChange={(value) => setFormData({ ...formData, session_id: value })}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Session" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.map(session => (
                        <SelectItem key={session.id} value={session.id}>
                          {session.session_year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Class/Section Selection */}
              {formData.audience === '2' && (
                <div>
                  <Label>Select Classes *</Label>
                  <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                    {classes.map(cls => (
                      <div key={cls.id} className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          id={`class-${cls.id}`}
                          checked={formData.selected_list.some(
                            item => item.type === 'class' && item.id === cls.id
                          )}
                          onCheckedChange={() => handleClassToggle(cls.id, cls.class_name)}
                          disabled={isViewMode}
                        />
                        <label htmlFor={`class-${cls.id}`} className="text-sm cursor-pointer">
                          {cls.class_name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.audience === '3' && (
                <div>
                  <Label>Select Sections *</Label>
                  <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                    {classes.map(cls => (
                      <div key={cls.id} className="mb-4">
                        <p className="font-medium text-sm mb-2">{cls.class_name}</p>
                        {/* TODO: Load and display sections for each class */}
                        <p className="text-xs text-gray-500">
                          Select a class first to load sections
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Note */}
              <div>
                <Label htmlFor="note">Event Description</Label>
                <Textarea
                  id="note"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Enter event description"
                  rows={4}
                  disabled={isViewMode}
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="status"
                    checked={formData.status}
                    onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
                    disabled={isViewMode}
                  />
                  <label htmlFor="status" className="text-sm cursor-pointer">
                    Active
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show_web"
                    checked={formData.show_web}
                    onCheckedChange={(checked) => setFormData({ ...formData, show_web: checked })}
                    disabled={isViewMode}
                  />
                  <label htmlFor="show_web" className="text-sm cursor-pointer">
                    Show on Website
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter>
              {isViewMode ? (
                <>
                  <PermissionButton moduleSlug="alumni.events" action="delete">
                    <Button type="button" variant="destructive" onClick={handleDelete}>
                      Delete
                    </Button>
                  </PermissionButton>
                  <PermissionButton moduleSlug="alumni.events" action="edit">
                    <Button type="button" onClick={handleEdit}>
                      Edit
                    </Button>
                  </PermissionButton>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Close
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Event</Button>
                </>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AlumniEvents;
