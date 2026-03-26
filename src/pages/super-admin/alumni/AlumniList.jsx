import React, { useState, useEffect } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ActionButtons, PermissionButton } from '@/components/PermissionComponents';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';
import { Search, UserPlus, Filter } from 'lucide-react';

const AlumniList = () => {
  const { toast } = useToast();
  const { selectedBranch } = useBranch();
  const [loading, setLoading] = useState(false);
  const [alumniList, setAlumniList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  
  // Filter state
  const [filters, setFilters] = useState({
    branch_id: '',
    session_id: '',
    class_id: '',
    section_id: '',
    searchTerm: ''
  });

  // Dropdown options
  const [branches, setBranches] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentAlumni, setCurrentAlumni] = useState(null);
  const [formData, setFormData] = useState({
    id: null,
    enroll_id: '',
    student_name: '',
    email: '',
    mobile_no: '',
    profession: '',
    address: '',
    photo: 'defualt.png'
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      setFilters(prev => ({ ...prev, branch_id: selectedBranch.id }));
    }
  }, [selectedBranch]);

  useEffect(() => {
    applyFilters();
  }, [filters, alumniList]);

  const loadInitialData = async () => {
    try {
      // Load branches, sessions, classes for filters
      const [branchRes, sessionRes, classRes] = await Promise.all([
        axios.get('/api/branches'),
        axios.get('/api/academics/sessions'),
        axios.get('/api/academics/classes')
      ]);

      setBranches(branchRes.data.data || []);
      setSessions(sessionRes.data.data || []);
      setClasses(classRes.data.data || []);

      // Load alumni list
      await loadAlumniList();
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load data'
      });
    }
  };

  const loadAlumniList = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedBranch) params.branch_id = selectedBranch.id;
      else if (filters.branch_id) params.branch_id = filters.branch_id;
      
      if (filters.session_id) params.session_id = filters.session_id;
      if (filters.class_id) params.class_id = filters.class_id;
      if (filters.section_id) params.section_id = filters.section_id;

      const response = await axios.get('/api/alumni', { params });
      
      if (response.data.success) {
        setAlumniList(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading alumni list:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load alumni list'
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

  const applyFilters = () => {
    let filtered = [...alumniList];

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(alumni =>
        alumni.student_name?.toLowerCase().includes(term) ||
        alumni.mobile_no?.includes(term) ||
        alumni.email?.toLowerCase().includes(term)
      );
    }

    setFilteredList(filtered);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    
    if (field === 'class_id' && value) {
      loadSections(value);
      setFilters(prev => ({ ...prev, section_id: '' }));
    }
  };

  const handleSearch = () => {
    loadAlumniList();
  };

  const handleAdd = () => {
    setCurrentAlumni(null);
    setFormData({
      id: null,
      enroll_id: '',
      student_name: '',
      email: '',
      mobile_no: '',
      profession: '',
      address: '',
      photo: 'defualt.png'
    });
    setIsDialogOpen(true);
  };

  const handleEdit = async (alumni) => {
    try {
      const response = await axios.get(`/api/alumni/${alumni.enroll_id}`);
      if (response.data.success) {
        setCurrentAlumni(alumni);
        setFormData({
          id: response.data.data.id,
          enroll_id: alumni.enroll_id,
          student_name: alumni.student_name,
          email: response.data.data.email || '',
          mobile_no: response.data.data.mobile_no || '',
          profession: response.data.data.profession || '',
          address: response.data.data.address || '',
          photo: response.data.data.photo || 'defualt.png'
        });
        setIsDialogOpen(true);
      }
    } catch (error) {
      console.error('Error loading alumni details:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load alumni details'
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this alumni record?')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/alumni/${id}`);
      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Alumni deleted successfully'
        });
        loadAlumniList();
      }
    } catch (error) {
      console.error('Error deleting alumni:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete alumni'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.mobile_no) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Mobile number is required'
      });
      return;
    }

    try {
      const response = formData.id
        ? await axios.put(`/api/alumni/${formData.id}`, formData)
        : await axios.post('/api/alumni', formData);

      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Alumni information saved successfully'
        });
        setIsDialogOpen(false);
        loadAlumniList();
      }
    } catch (error) {
      console.error('Error saving alumni:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save alumni'
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Alumni Management</span>
            <PermissionButton moduleSlug="alumni" action="add">
              <Button onClick={handleAdd}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Alumni
              </Button>
            </PermissionButton>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {!selectedBranch && (
            <Select
              value={filters.branch_id || 'all'}
              onValueChange={(value) => handleFilterChange('branch_id', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map(branch => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.branch_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            )}

            <Select
              value={filters.session_id || 'all'}
              onValueChange={(value) => handleFilterChange('session_id', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Passing Session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {sessions.map(session => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.session_year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.class_id || 'all'}
              onValueChange={(value) => handleFilterChange('class_id', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.class_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.section_id || 'all'}
              onValueChange={(value) => handleFilterChange('section_id', value === 'all' ? '' : value)}
              disabled={!filters.class_id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {sections.map(section => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.section_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleSearch}>
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search by name, mobile, or email..."
                className="pl-10"
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Class (Section)</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Profession</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No alumni records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredList.map((alumni, index) => (
                    <TableRow key={alumni.enroll_id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{alumni.student_name}</TableCell>
                      <TableCell>
                        {alumni.class_name} ({alumni.section_name})
                      </TableCell>
                      <TableCell>{alumni.session_year}</TableCell>
                      <TableCell>{alumni.mobile_no || '-'}</TableCell>
                      <TableCell>{alumni.email || '-'}</TableCell>
                      <TableCell>{alumni.profession || '-'}</TableCell>
                      <TableCell className="text-right">
                        <ActionButtons
                          moduleSlug="alumni"
                          onEdit={() => handleEdit(alumni)}
                          onDelete={() => handleDelete(alumni.id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {currentAlumni ? 'Edit Alumni Details' : 'Add Alumni Details'}
            </DialogTitle>
            <DialogDescription>
              {currentAlumni ? `Update information for ${formData.student_name}` : 'Add contact details for alumni'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mobile_no">Mobile Number *</Label>
                  <Input
                    id="mobile_no"
                    value={formData.mobile_no}
                    onChange={(e) => setFormData({ ...formData, mobile_no: e.target.value })}
                    placeholder="Enter mobile number"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="profession">Profession</Label>
                <Input
                  id="profession"
                  value={formData.profession}
                  onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  placeholder="Enter profession"
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter address"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Alumni</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AlumniList;
