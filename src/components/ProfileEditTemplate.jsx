import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  User, Calendar, Phone, Mail, MapPin, 
  Facebook, Twitter, Linkedin, Camera, Save, 
  Briefcase, Home, Droplet, Globe, Lock, Key, Shield, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const ProfileEditTemplate = ({ 
  profile, 
  setProfile, 
  handleSubmit, 
  isSubmitting, 
  handleImageChange, 
  imagePreview,
  roleLabel = "Admin",
  disableOtp = false // New prop to disable OTP flow (e.g. for Master Admin)
}) => {
  const { toast } = useToast();
  const [securityLoading, setSecurityLoading] = useState(false);
  
  // OTP State
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [pendingAction, setPendingAction] = useState(null); // 'password', 'email', 'mobile'
  const [pendingData, setPendingData] = useState(null);
  const [otpLoading, setOtpLoading] = useState(false);
  
  // New OTP Flow State
  const [channelOptions, setChannelOptions] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('whatsapp');
  const [otpStep, setOtpStep] = useState(1); // 1: Select Channel, 2: Enter OTP

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Email/Username Change State
  const [emailData, setEmailData] = useState({
    email: profile?.email || ''
  });

  // Mobile Number Change State (for Login & Security tab)
  const [mobileData, setMobileData] = useState({
    mobile: profile?.phone || ''
  });

  // Initial Mobile Number (to detect changes)
  const [initialPhone, setInitialPhone] = useState(profile?.phone || '');

  // Sync initialPhone when profile loads
  React.useEffect(() => {
    if (profile?.phone && !initialPhone) {
        setInitialPhone(profile.phone);
        setMobileData({ mobile: profile.phone });
    }
    // Also sync email data
    if (profile?.email && !emailData.email) {
        setEmailData({ email: profile.email });
    }
  }, [profile]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setProfile(prev => ({...prev, [id]: value}));
  };

  const handleSelectChange = (id, value) => {
    setProfile(prev => ({...prev, [id]: value}));
  };

  const handlePasswordChange = (e) => {
    const { id, value } = e.target;
    setPasswordData(prev => ({...prev, [id]: value}));
  };

  const handleEmailChange = (e) => {
    const { id, value } = e.target;
    setEmailData(prev => ({...prev, [id]: value}));
  };

  const handleMobileChange = (e) => {
    const { id, value } = e.target;
    // Only allow numbers
    const numericValue = value.replace(/\D/g, '').slice(0, 10);
    setMobileData(prev => ({...prev, [id]: numericValue}));
  };

  // --- OTP Logic ---

  const initiateOtp = async (action, data) => {
    setOtpLoading(true);
    try {
      // 1. Resolve User to get channels
      const response = await fetch('/api/auth/resolve-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: profile.email })
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || 'Failed to resolve user');

      setChannelOptions(resData.options);
      if (resData.options.some(o => o.channel === 'whatsapp')) setSelectedChannel('whatsapp');
      else if (resData.options.length > 0) setSelectedChannel(resData.options[0].channel);

      setPendingAction(action);
      setPendingData(data);
      setOtpStep(1);
      setOtpDialogOpen(true);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setOtpLoading(false);
    }
  };

  const sendOtp = async () => {
    setOtpLoading(true);
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) throw new Error('No active session');

        const response = await fetch('/api/auth/request-sensitive-otp', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                identifier: profile.email,
                channel: selectedChannel,
                action: pendingAction 
            })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        
        toast({ title: "OTP Sent", description: data.message });
        setOtpStep(2);
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
        setOtpLoading(false);
    }
  };

  const verifyOtpAndProceed = async () => {
    if (!otp) {
      toast({ variant: "destructive", title: "Error", description: "Please enter the OTP" });
      return;
    }
    setOtpLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('No active session');

      // Verify OTP
      const response = await fetch('/api/auth/verify-sensitive-otp', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
            identifier: profile.email,
            otp
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      const sensitiveToken = data.sensitiveToken;

      // If verified, proceed with action
      if (pendingAction === 'password') {
        await performPasswordUpdate(sensitiveToken);
      } else if (pendingAction === 'email') {
        await performEmailUpdate(sensitiveToken);
      } else if (pendingAction === 'mobile') {
        await performMobileUpdate(sensitiveToken);
      }

      setOtpDialogOpen(false);
      setOtp('');
      setPendingAction(null);
      setPendingData(null);
      setOtpStep(1);

    } catch (error) {
      toast({ variant: "destructive", title: "Verification Failed", description: error.message });
    } finally {
      setOtpLoading(false);
    }
  };

  // --- Action Handlers ---

  const onPasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Passwords do not match" });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast({ variant: "destructive", title: "Error", description: "Password must be at least 6 characters" });
      return;
    }

    if (disableOtp) {
        // Direct Update
        setSecurityLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword });
            if (error) throw error;
            toast({ title: "Success", description: "Password updated successfully" });
            setPasswordData({ newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setSecurityLoading(false);
        }
        return;
    }

    // Trigger OTP
    initiateOtp('password', passwordData);
  };

  const performPasswordUpdate = async (token) => {
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
            newPassword: pendingData.newPassword
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      toast({ title: "Success", description: "Password updated successfully" });
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const onEmailSubmit = async (e) => {
    e.preventDefault();
    if (emailData.email === profile.email) {
        toast({ variant: "destructive", title: "Error", description: "New email is same as current email" });
        return;
    }

    if (disableOtp) {
        // Direct Update
        setSecurityLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ email: emailData.email });
            if (error) throw error;
            toast({ title: "Success", description: "Email update initiated. Please check your new email for verification link." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setSecurityLoading(false);
        }
        return;
    }

    // Trigger OTP
    initiateOtp('email', emailData);
  };

  const performEmailUpdate = async (token) => {
    try {
      const response = await fetch('/api/auth/update-email', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
            newEmail: pendingData.email
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      toast({ title: "Success", description: "Email updated successfully." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  // Handler for Login Mobile Number change (Security tab)
  const onMobileSubmit = async (e) => {
    e.preventDefault();
    if (mobileData.mobile === profile.phone) {
        toast({ variant: "destructive", title: "Error", description: "New mobile number is same as current number" });
        return;
    }
    if (mobileData.mobile.length !== 10) {
        toast({ variant: "destructive", title: "Error", description: "Mobile number must be 10 digits" });
        return;
    }

    if (disableOtp) {
        // Direct Update for Master Admin
        setSecurityLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ 
                phone: mobileData.mobile,
                data: { phone: mobileData.mobile }
            });
            if (error) throw error;
            
            // Also update in profile state
            setProfile(prev => ({ ...prev, phone: mobileData.mobile }));
            setInitialPhone(mobileData.mobile);
            
            toast({ title: "Success", description: "Mobile number updated successfully" });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setSecurityLoading(false);
        }
        return;
    }

    // Trigger OTP for regular users
    initiateOtp('mobile', mobileData.mobile);
  };

  const onProfileSubmit = async (e) => {
    e.preventDefault();
    // Check if mobile number changed
    if (profile.phone !== initialPhone && !disableOtp) {
        // Trigger OTP
        initiateOtp('mobile', profile.phone); 
    } else {
        // Normal submit (or if OTP disabled)
        handleSubmit(e);
    }
  };

  const performMobileUpdate = async (token) => {
      try {
        const response = await fetch('/api/auth/update-mobile', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                newMobile: pendingData // pendingData is the new phone number
            })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        // After mobile update, proceed with other profile updates if any
        const mockEvent = { preventDefault: () => {} };
        await handleSubmit(mockEvent);

        toast({ title: "Success", description: "Mobile and Profile updated successfully." });
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
      }
  };

  const performProfileUpdate = async (originalEvent) => {
      // Since handleSubmit expects an event, we might need to mock it or adjust handleSubmit
      // But handleSubmit in parent usually just takes e.preventDefault().
      // We can just call the parent's logic.
      // However, handleSubmit in parent is async.
      
      // We need to call the parent's submit logic. 
      // Since we can't easily pass the event object through state and back, 
      // we'll assume handleSubmit handles the state 'profile' directly.
      
      // Create a fake event object
      const fakeEvent = { preventDefault: () => {} };
      await handleSubmit(fakeEvent);
  };

  return (
    <div className="space-y-6">
      {/* OTP Dialog */}
      <Dialog open={otpDialogOpen} onOpenChange={setOtpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Security Verification</DialogTitle>
            <DialogDescription>
              {otpStep === 1 
                ? "Select how you want to receive the verification code." 
                : `Enter the code sent to your ${selectedChannel}.`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {otpStep === 1 ? (
                <div className="space-y-3">
                    {channelOptions.map((option) => (
                        <div 
                            key={option.channel} 
                            className={`flex items-center space-x-3 border p-3 rounded-md cursor-pointer transition-colors ${selectedChannel === option.channel ? 'border-primary bg-primary/5' : 'hover:bg-gray-50'}`}
                            onClick={() => setSelectedChannel(option.channel)}
                        >
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedChannel === option.channel ? 'border-primary' : 'border-gray-400'}`}>
                                {selectedChannel === option.channel && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                            <span className="text-sm font-medium">{option.label}</span>
                        </div>
                    ))}
                    {channelOptions.length === 0 && (
                        <p className="text-sm text-red-500">No verification channels available. Please contact support.</p>
                    )}
                </div>
            ) : (
                <div className="space-y-2">
                  <Label htmlFor="otp">One-Time Password</Label>
                  <Input 
                    id="otp" 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)} 
                    placeholder="Enter 6-digit code" 
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                  />
                </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOtpDialogOpen(false)}>Cancel</Button>
            {otpStep === 1 ? (
                <Button onClick={sendOtp} disabled={otpLoading || channelOptions.length === 0}>
                    {otpLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Send Code
                </Button>
            ) : (
                <Button onClick={verifyOtpAndProceed} disabled={otpLoading}>
                    {otpLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Verify & Proceed
                </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header Section */}
      <div className="relative h-64 rounded-xl overflow-hidden bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900">
        {/* Background Pattern/Image */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center" />
        
        <div className="absolute inset-0 flex items-center px-8 md:px-12">
          <div className="flex flex-col md:flex-row items-center gap-8 w-full max-w-5xl mx-auto">
            {/* Profile Image */}
            <div className="relative group">
              <div className="w-40 h-40 rounded-lg border-4 border-white/20 overflow-hidden shadow-2xl bg-white">
                <img 
                  src={imagePreview || profile?.photo_url || "https://github.com/shadcn.png"} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              <label htmlFor="photo-upload" className="absolute bottom-2 right-2 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-lg">
                <Camera className="w-5 h-5" />
                <input 
                  id="photo-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange}
                />
              </label>
            </div>

            {/* Profile Info */}
            <div className="text-white text-center md:text-left space-y-2 flex-1">
              <h1 className="text-3xl font-bold tracking-tight">{profile?.full_name || 'User Name'}</h1>
              <div className="flex items-center justify-center md:justify-start gap-2 text-indigo-200 font-medium">
                <Briefcase className="w-4 h-4" />
                <span>{roleLabel}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-4 text-sm text-indigo-100/80">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>ID: {profile?.school_code || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>DOB: {profile?.dob ? format(new Date(profile.dob), 'dd.MMM.yyyy') : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{profile?.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{profile?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 col-span-1 md:col-span-2">
                  <MapPin className="w-4 h-4" />
                  <span>{profile?.present_address || 'Location N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="profile">Profile Details</TabsTrigger>
          <TabsTrigger value="security">Login & Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          {/* Form Section */}
          <form onSubmit={onProfileSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            
            {/* Main Details */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50">
                  <User className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-lg">Personal Details</h2>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name <span className="text-red-500">*</span></Label>
                    <Input id="full_name" value={profile?.full_name || ''} onChange={handleInputChange} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={profile?.gender || ''} onValueChange={(val) => handleSelectChange('gender', val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="religion">Religion</Label>
                    <Select value={profile?.religion || ''} onValueChange={(val) => handleSelectChange('religion', val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Religion" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hindu">Hindu</SelectItem>
                        <SelectItem value="Muslim">Muslim</SelectItem>
                        <SelectItem value="Christian">Christian</SelectItem>
                        <SelectItem value="Sikh">Sikh</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="blood_group">Blood Group</Label>
                    <Select value={profile?.blood_group || ''} onValueChange={(val) => handleSelectChange('blood_group', val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Blood Group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input id="dob" type="date" value={profile?.dob || ''} onChange={handleInputChange} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Mobile Number <span className="text-red-500">*</span></Label>
                    <Input id="phone" value={profile?.phone || ''} onChange={handleInputChange} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={profile?.email || ''} readOnly className="bg-gray-100 text-gray-500 cursor-not-allowed" />
                    <p className="text-xs text-muted-foreground">To change email, go to Login & Security tab.</p>
                  </div>

                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <Label htmlFor="present_address">Present Address</Label>
                    <Textarea id="present_address" value={profile?.present_address || ''} onChange={handleInputChange} className="min-h-[80px]" />
                  </div>

                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <Label htmlFor="permanent_address">Permanent Address</Label>
                    <Textarea id="permanent_address" value={profile?.permanent_address || ''} onChange={handleInputChange} className="min-h-[80px]" />
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50">
                  <Globe className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-lg">Social Links</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="facebook_url" className="flex items-center gap-2"><Facebook className="w-4 h-4 text-blue-600" /> Facebook URL</Label>
                    <Input id="facebook_url" placeholder="https://facebook.com/username" value={profile?.facebook_url || ''} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter_url" className="flex items-center gap-2"><Twitter className="w-4 h-4 text-sky-500" /> Twitter URL</Label>
                    <Input id="twitter_url" placeholder="https://twitter.com/username" value={profile?.twitter_url || ''} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url" className="flex items-center gap-2"><Linkedin className="w-4 h-4 text-blue-700" /> LinkedIn URL</Label>
                    <Input id="linkedin_url" placeholder="https://linkedin.com/in/username" value={profile?.linkedin_url || ''} onChange={handleInputChange} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting} size="lg" className="w-full md:w-auto">
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Save Profile
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Change Password Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden h-fit">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50">
                <Lock className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-lg">Change Password</h2>
              </div>
              <div className="p-6 space-y-4">
                <form onSubmit={onPasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password <span className="text-red-500">*</span></Label>
                    <Input 
                      id="newPassword" 
                      type="password" 
                      value={passwordData.newPassword} 
                      onChange={handlePasswordChange} 
                      required 
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password <span className="text-red-500">*</span></Label>
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      value={passwordData.confirmPassword} 
                      onChange={handlePasswordChange} 
                      required 
                      placeholder="Confirm new password"
                    />
                  </div>
                  <Button type="submit" disabled={securityLoading} className="w-full">
                    {securityLoading ? 'Updating...' : 'Update Password'}
                  </Button>
                </form>
              </div>
            </div>

            {/* Change Username/Email Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden h-fit">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50">
                <Shield className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-lg">Login Username</h2>
              </div>
              <div className="p-6 space-y-4">
                <form onSubmit={onEmailSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Username (Email) <span className="text-red-500">*</span></Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={emailData.email} 
                      onChange={handleEmailChange} 
                      required 
                      placeholder="Enter new email address"
                    />
                    <p className="text-xs text-muted-foreground">
                      Note: Changing your email will require verification. You will be logged out and must verify the new email.
                    </p>
                  </div>
                  <Button type="submit" disabled={securityLoading} variant="outline" className="w-full">
                    {securityLoading ? 'Updating...' : 'Update Username'}
                  </Button>
                </form>
              </div>
            </div>

            {/* Change Login Mobile Number Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden h-fit">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50">
                <Phone className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-lg">Login Mobile Number</h2>
              </div>
              <div className="p-6 space-y-4">
                <form onSubmit={onMobileSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number <span className="text-red-500">*</span></Label>
                    <Input 
                      id="mobile" 
                      type="tel" 
                      value={mobileData.mobile} 
                      onChange={handleMobileChange} 
                      required 
                      placeholder="Enter 10-digit mobile number"
                      maxLength={10}
                    />
                    <p className="text-xs text-muted-foreground">
                      Note: Changing your login mobile number will require OTP verification.
                    </p>
                  </div>
                  <Button type="submit" disabled={securityLoading} variant="outline" className="w-full">
                    {securityLoading ? 'Updating...' : 'Update Mobile Number'}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileEditTemplate;
