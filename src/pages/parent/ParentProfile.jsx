/**
 * 🌟 PARENT PROFILE PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Shows parent's profile information and their linked children
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useParentChild } from '@/contexts/ParentChildContext';
import { useToast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, Phone, Mail, MapPin, Calendar, Users, GraduationCap, 
  Building, Briefcase, Shield, ChevronRight, CheckCircle2,
  Loader2, ArrowLeft, FileText, Edit
} from 'lucide-react';
import { format } from 'date-fns';

// Info Item Component
const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
    <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
      <Icon className="h-4 w-4" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold mt-0.5 break-words">
        {value || 'Not Provided'}
      </p>
    </div>
  </div>
);

// Child Card Component
const ChildCard = ({ child, onClick }) => {
  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarImage src={child.photo_url} alt={child.full_name} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-lg font-bold">
              {getInitials(child.full_name || child.first_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-bold text-lg">
              {child.full_name || `${child.first_name} ${child.last_name}`}
            </h3>
            <div className="flex flex-wrap gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                <GraduationCap className="h-3 w-3 mr-1" />
                {child.class_name} {child.section_name && `(${child.section_name})`}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Roll: {child.roll_number || 'N/A'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Admission: {child.admission_number || child.school_code || 'N/A'}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
};

const ParentProfile = () => {
  const navigate = useNavigate();
  const { user, school } = useAuth();
  const { children: contextChildren, loading: childrenLoading } = useParentChild();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [parentData, setParentData] = useState(null);
  // Use children from ParentChildContext (already fetched via backend API, bypasses RLS)
  const children = contextChildren || [];

  useEffect(() => {
    if (!user) return;

    // Get parent info from user metadata
    const parentInfo = {
      id: user.id,
      full_name: user.user_metadata?.full_name || 
                 `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() ||
                 user.user_metadata?.father_name ||
                 'Parent',
      phone: user.user_metadata?.phone || user.email?.split('@')[0] || '',
      email: user.user_metadata?.real_email || user.email,
      role: user.user_metadata?.role || 'parent',
      branch_id: user.user_metadata?.branch_id,
      created_at: user.created_at
    };

    setParentData(parentInfo);
    setLoading(false);
  }, [user]);

  if (loading || childrenLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">My Profile</h1>
            <p className="text-muted-foreground">View your profile information</p>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="overflow-hidden">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-primary via-primary/80 to-primary/60 relative">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?w=1200')] bg-cover bg-center opacity-20" />
          </div>

          <CardContent className="relative -mt-16 pb-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Avatar */}
              <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                <AvatarImage src={parentData?.photo_url} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-3xl font-bold text-white">
                  {getInitials(parentData?.full_name)}
                </AvatarFallback>
              </Avatar>

              {/* Basic Info */}
              <div className="flex-1 pt-4 md:pt-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">{parentData?.full_name}</h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="secondary" className="capitalize">
                        <Shield className="h-3 w-3 mr-1" />
                        {parentData?.role}
                      </Badge>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active Account
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-xs text-muted-foreground">Member Since</p>
                    <p className="font-medium">
                      {parentData?.created_at 
                        ? format(new Date(parentData.created_at), 'dd MMM yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">
              <User className="h-4 w-4 mr-2" />
              Profile Info
            </TabsTrigger>
            <TabsTrigger value="children">
              <Users className="h-4 w-4 mr-2" />
              My Children ({children.length})
            </TabsTrigger>
          </TabsList>

          {/* Profile Info Tab */}
          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Contact Information
                </CardTitle>
                <CardDescription>Your registered contact details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem 
                    icon={User} 
                    label="Full Name" 
                    value={parentData?.full_name}
                  />
                  <InfoItem 
                    icon={Phone} 
                    label="Mobile Number" 
                    value={parentData?.phone?.replace(/^91/, '')}
                  />
                  <InfoItem 
                    icon={Mail} 
                    label="Email" 
                    value={parentData?.email?.includes('@parent.jashchar.local') 
                      ? 'Not Registered'
                      : parentData?.email}
                  />
                  <InfoItem 
                    icon={Shield} 
                    label="Account Type" 
                    value={parentData?.role?.charAt(0).toUpperCase() + parentData?.role?.slice(1)}
                  />
                  <InfoItem 
                    icon={Building} 
                    label="School" 
                    value={school?.name || 'N/A'}
                  />
                  <InfoItem 
                    icon={Calendar} 
                    label="Registered On" 
                    value={parentData?.created_at 
                      ? format(new Date(parentData.created_at), 'dd MMMM yyyy')
                      : 'N/A'}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Children Tab */}
          <TabsContent value="children">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  My Children
                </CardTitle>
                <CardDescription>Children linked to your account</CardDescription>
              </CardHeader>
              <CardContent>
                {children.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Children Linked</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      No children are linked to your account yet. 
                      Please contact the school administration if you believe this is an error.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {children.map((child) => (
                      <ChildCard 
                        key={child.id}
                        child={child}
                        onClick={() => navigate(`/Parent/dashboard`)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => navigate('/Parent/dashboard')}
              >
                <Users className="h-6 w-6 text-primary" />
                <span>View Children Dashboard</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2"
                disabled
              >
                <Edit className="h-6 w-6 text-muted-foreground" />
                <span>Edit Profile (Coming Soon)</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2"
                disabled
              >
                <FileText className="h-6 w-6 text-muted-foreground" />
                <span>Download Reports (Coming Soon)</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ParentProfile;
