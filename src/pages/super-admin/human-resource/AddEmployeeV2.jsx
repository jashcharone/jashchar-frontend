/**
 * Add Employee V2 - Using new employees table
 * Complete employee creation form with all fields
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import hrApi from '@/services/hrApi';
import { ArrowLeft, Save, User, Briefcase, Building, CreditCard, FileCheck } from 'lucide-react';

const AddEmployeeV2 = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [employees, setEmployees] = useState([]);
    
    const organizationId = user?.organization_id;
    const branchId = user?.branch_id;
    
    const [formData, setFormData] = useState({
        // Basic Info
        first_name: '',
        last_name: '',
        gender: '',
        dob: '',
        blood_group: '',
        mobile: '',
        email: '',
        emergency_contact: '',
        emergency_contact_name: '',
        current_address: '',
        permanent_address: '',
        city: '',
        state: '',
        pincode: '',
        
        // Employment Info
        department_id: '',
        designation_id: '',
        reporting_to: '',
        employment_type: 'permanent',
        joining_date: '',
        confirmation_date: '',
        
        // Bank Details
        bank_name: '',
        bank_account_no: '',
        ifsc_code: '',
        
        // Compliance
        pan_number: '',
        aadhaar_number: '',
        uan_number: '',
        esi_number: '',
    });
    
    useEffect(() => {
        if (organizationId) {
            fetchMasterData();
        }
    }, [organizationId]);
    
    const fetchMasterData = async () => {
        try {
            const [deptRes, desigRes, empRes] = await Promise.all([
                hrApi.getHrDepartments({ organizationId }),
                hrApi.getHrDesignations({ organizationId }),
                hrApi.getEmployees({ organizationId, status: 'active' })
            ]);
            
            setDepartments(deptRes.data?.data || []);
            setDesignations(desigRes.data?.data || []);
            setEmployees(empRes.data?.data || []);
        } catch (error) {
            console.error('Error fetching master data:', error);
        }
    };
    
    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.first_name || !formData.joining_date) {
            toast({ title: 'Error', description: 'First name and joining date are required', variant: 'destructive' });
            return;
        }
        
        setLoading(true);
        try {
            const payload = {
                ...formData,
                organization_id: organizationId,
                branch_id: branchId || null,
                department_id: formData.department_id || null,
                designation_id: formData.designation_id || null,
                reporting_to: formData.reporting_to || null,
            };
            
            // Remove empty strings
            Object.keys(payload).forEach(key => {
                if (payload[key] === '') payload[key] = null;
            });
            
            await hrApi.createEmployee(payload);
            toast({ title: 'Success', description: 'Employee created successfully' });
            navigate('/super-admin/human-resource/employee-list-v2');
        } catch (error) {
            toast({ 
                title: 'Error', 
                description: error.response?.data?.message || 'Failed to create employee', 
                variant: 'destructive' 
            });
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Add New Employee</h1>
                    <p className="text-gray-500">Create a new employee record</p>
                </div>
            </div>
            
            <form onSubmit={handleSubmit}>
                <Tabs defaultValue="basic" className="space-y-6">
                    <TabsList className="grid grid-cols-5 w-full max-w-2xl">
                        <TabsTrigger value="basic" className="flex items-center gap-2">
                            <User className="w-4 h-4" /> Basic
                        </TabsTrigger>
                        <TabsTrigger value="employment" className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4" /> Employment
                        </TabsTrigger>
                        <TabsTrigger value="address" className="flex items-center gap-2">
                            <Building className="w-4 h-4" /> Address
                        </TabsTrigger>
                        <TabsTrigger value="bank" className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4" /> Bank
                        </TabsTrigger>
                        <TabsTrigger value="compliance" className="flex items-center gap-2">
                            <FileCheck className="w-4 h-4" /> Compliance
                        </TabsTrigger>
                    </TabsList>
                    
                    {/* Basic Info Tab */}
                    <TabsContent value="basic">
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name">First Name *</Label>
                                    <Input
                                        id="first_name"
                                        value={formData.first_name}
                                        onChange={(e) => handleChange('first_name', e.target.value)}
                                        placeholder="Enter first name"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="last_name">Last Name</Label>
                                    <Input
                                        id="last_name"
                                        value={formData.last_name}
                                        onChange={(e) => handleChange('last_name', e.target.value)}
                                        placeholder="Enter last name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select value={formData.gender} onValueChange={(v) => handleChange('gender', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dob">Date of Birth</Label>
                                    <Input
                                        id="dob"
                                        type="date"
                                        value={formData.dob}
                                        onChange={(e) => handleChange('dob', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="blood_group">Blood Group</Label>
                                    <Select value={formData.blood_group} onValueChange={(v) => handleChange('blood_group', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select blood group" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                                                <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mobile">Mobile Number</Label>
                                    <Input
                                        id="mobile"
                                        value={formData.mobile}
                                        onChange={(e) => handleChange('mobile', e.target.value)}
                                        placeholder="10 digit mobile"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        placeholder="employee@example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                                    <Input
                                        id="emergency_contact_name"
                                        value={formData.emergency_contact_name}
                                        onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                                        placeholder="Contact person name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="emergency_contact">Emergency Contact Number</Label>
                                    <Input
                                        id="emergency_contact"
                                        value={formData.emergency_contact}
                                        onChange={(e) => handleChange('emergency_contact', e.target.value)}
                                        placeholder="Emergency phone"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    {/* Employment Tab */}
                    <TabsContent value="employment">
                        <Card>
                            <CardHeader>
                                <CardTitle>Employment Details</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="department_id">Department</Label>
                                    <Select value={formData.department_id} onValueChange={(v) => handleChange('department_id', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments.map(dept => (
                                                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="designation_id">Designation</Label>
                                    <Select value={formData.designation_id} onValueChange={(v) => handleChange('designation_id', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select designation" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {designations.map(desig => (
                                                <SelectItem key={desig.id} value={desig.id}>{desig.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reporting_to">Reports To</Label>
                                    <Select value={formData.reporting_to} onValueChange={(v) => handleChange('reporting_to', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select manager" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {employees.map(emp => (
                                                <SelectItem key={emp.id} value={emp.id}>
                                                    {emp.first_name} {emp.last_name} ({emp.emp_code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="employment_type">Employment Type</Label>
                                    <Select value={formData.employment_type} onValueChange={(v) => handleChange('employment_type', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="permanent">Permanent</SelectItem>
                                            <SelectItem value="contract">Contract</SelectItem>
                                            <SelectItem value="intern">Intern</SelectItem>
                                            <SelectItem value="part_time">Part Time</SelectItem>
                                            <SelectItem value="probation">Probation</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="joining_date">Joining Date *</Label>
                                    <Input
                                        id="joining_date"
                                        type="date"
                                        value={formData.joining_date}
                                        onChange={(e) => handleChange('joining_date', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmation_date">Confirmation Date</Label>
                                    <Input
                                        id="confirmation_date"
                                        type="date"
                                        value={formData.confirmation_date}
                                        onChange={(e) => handleChange('confirmation_date', e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    {/* Address Tab */}
                    <TabsContent value="address">
                        <Card>
                            <CardHeader>
                                <CardTitle>Address Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current_address">Current Address</Label>
                                    <Textarea
                                        id="current_address"
                                        value={formData.current_address}
                                        onChange={(e) => handleChange('current_address', e.target.value)}
                                        placeholder="Enter current address"
                                        rows={3}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="permanent_address">Permanent Address</Label>
                                    <Textarea
                                        id="permanent_address"
                                        value={formData.permanent_address}
                                        onChange={(e) => handleChange('permanent_address', e.target.value)}
                                        placeholder="Enter permanent address"
                                        rows={3}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="city">City</Label>
                                        <Input
                                            id="city"
                                            value={formData.city}
                                            onChange={(e) => handleChange('city', e.target.value)}
                                            placeholder="City"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="state">State</Label>
                                        <Input
                                            id="state"
                                            value={formData.state}
                                            onChange={(e) => handleChange('state', e.target.value)}
                                            placeholder="State"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pincode">Pincode</Label>
                                        <Input
                                            id="pincode"
                                            value={formData.pincode}
                                            onChange={(e) => handleChange('pincode', e.target.value)}
                                            placeholder="Pincode"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    {/* Bank Tab */}
                    <TabsContent value="bank">
                        <Card>
                            <CardHeader>
                                <CardTitle>Bank Details</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bank_name">Bank Name</Label>
                                    <Input
                                        id="bank_name"
                                        value={formData.bank_name}
                                        onChange={(e) => handleChange('bank_name', e.target.value)}
                                        placeholder="Bank name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bank_account_no">Account Number</Label>
                                    <Input
                                        id="bank_account_no"
                                        value={formData.bank_account_no}
                                        onChange={(e) => handleChange('bank_account_no', e.target.value)}
                                        placeholder="Account number"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ifsc_code">IFSC Code</Label>
                                    <Input
                                        id="ifsc_code"
                                        value={formData.ifsc_code}
                                        onChange={(e) => handleChange('ifsc_code', e.target.value.toUpperCase())}
                                        placeholder="IFSC code"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    {/* Compliance Tab */}
                    <TabsContent value="compliance">
                        <Card>
                            <CardHeader>
                                <CardTitle>Statutory Compliance</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="pan_number">PAN Number</Label>
                                    <Input
                                        id="pan_number"
                                        value={formData.pan_number}
                                        onChange={(e) => handleChange('pan_number', e.target.value.toUpperCase())}
                                        placeholder="ABCDE1234F"
                                        maxLength={10}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="aadhaar_number">Aadhaar Number</Label>
                                    <Input
                                        id="aadhaar_number"
                                        value={formData.aadhaar_number}
                                        onChange={(e) => handleChange('aadhaar_number', e.target.value)}
                                        placeholder="12 digit Aadhaar"
                                        maxLength={12}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="uan_number">UAN (PF Number)</Label>
                                    <Input
                                        id="uan_number"
                                        value={formData.uan_number}
                                        onChange={(e) => handleChange('uan_number', e.target.value)}
                                        placeholder="Universal Account Number"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="esi_number">ESI Number</Label>
                                    <Input
                                        id="esi_number"
                                        value={formData.esi_number}
                                        onChange={(e) => handleChange('esi_number', e.target.value)}
                                        placeholder="ESI number"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
                
                {/* Submit Button */}
                <div className="flex justify-end gap-4 mt-6">
                    <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? 'Saving...' : 'Save Employee'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default AddEmployeeV2;
