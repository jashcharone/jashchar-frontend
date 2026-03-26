import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import ProfileEditTemplate from '@/components/ProfileEditTemplate';

const SchoolOwnerProfile = () => {
  const navigate = useNavigate();
  const { user, school, loading: authLoading, refreshUserContext } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Determine the correct table based on user role
  const userRole = user?.user_metadata?.role || user?.role;
  const isSuperAdmin = userRole === 'super_admin' || userRole === 'master_admin';

  // Function to load profile from current user data
  const loadProfileFromUser = useCallback((currentUser) => {
    if (!currentUser) return null;
    
    const metadata = currentUser.user_metadata || {};
    const profileData = currentUser.profile || {};
    
    return {
      id: currentUser.id,
      email: currentUser.email,
      full_name: metadata.full_name || profileData.full_name || '',
      phone: metadata.phone || profileData.phone || '',
      photo_url: metadata.avatar_url || profileData.photo_url || '',
      gender: metadata.gender || profileData.gender || '',
      religion: metadata.religion || profileData.religion || '',
      blood_group: metadata.blood_group || profileData.blood_group || '',
      dob: metadata.dob || profileData.dob || '',
      present_address: metadata.current_address || profileData.current_address || profileData.present_address || '',
      permanent_address: metadata.permanent_address || profileData.permanent_address || '',
      facebook_url: metadata.facebook_url || profileData.facebook_url || '',
      twitter_url: metadata.twitter_url || profileData.twitter_url || '',
      linkedin_url: metadata.linkedin_url || profileData.linkedin_url || '',
      enrollment_id: profileData.enrollment_id || metadata.enrollment_id || ''
    };
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
        if (authLoading) return;
        
        if (!user) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        try {
            if (isSuperAdmin) {
                // For super_admin/master_admin: Load directly from auth user metadata
                console.log('Loading super_admin profile from auth metadata');
                const mergedProfile = loadProfileFromUser(user);
                setProfile(mergedProfile);
                setImagePreview(mergedProfile?.photo_url || '');
            } else {
                // For school_owner: Fetch from school_owner_profiles table
                const { data: freshProfile, error } = await supabase
                    .from('school_owner_profiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (error) {
                    console.error('Error fetching school_owner profile:', error);
                }

                // Merge with user metadata as fallback
                const mergedProfile = {
                    ...loadProfileFromUser(user),
                    ...(freshProfile || {}),
                    present_address: freshProfile?.address || freshProfile?.current_address || user.profile?.current_address || ''
                };

                setProfile(mergedProfile);
                setImagePreview(freshProfile?.photo_url || user.user_metadata?.avatar_url || '');
            }
        } catch (err) {
            console.error('Profile load error:', err);
            // Fallback to existing user data
            const fallbackProfile = loadProfileFromUser(user);
            setProfile(fallbackProfile);
            setImagePreview(fallbackProfile?.photo_url || '');
        } finally {
            setIsLoading(false);
        }
    };

    loadProfile();
  }, [user, authLoading, isSuperAdmin, loadProfileFromUser]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        let photo_url = profile.photo_url;
        if (imageFile) {
            const fileName = `avatars/${user.id}-${uuidv4()}`;
            const { error: uploadError } = await supabase.storage
              .from('school-logos')
              .upload(fileName, imageFile, { upsert: true });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
              .from('school-logos')
              .getPublicUrl(fileName);
            photo_url = data.publicUrl;
        }

        let savedData, error;
        
        if (isSuperAdmin) {
            // For super_admin/master_admin: Update auth user metadata directly
            console.log('Updating auth user metadata for super_admin');
            const { data: authData, error: authError } = await supabase.auth.updateUser({
                data: {
                    full_name: profile.full_name,
                    avatar_url: photo_url,
                    phone: profile.phone,
                    gender: profile.gender,
                    religion: profile.religion,
                    blood_group: profile.blood_group,
                    dob: profile.dob,
                    current_address: profile.present_address,
                    permanent_address: profile.permanent_address,
                    facebook_url: profile.facebook_url,
                    twitter_url: profile.twitter_url,
                    linkedin_url: profile.linkedin_url
                }
            });
            
            if (authError) {
                error = authError;
            } else {
                savedData = authData;
                // Update local state immediately with saved data
                if (authData?.user) {
                    const updatedProfile = loadProfileFromUser(authData.user);
                    setProfile(updatedProfile);
                    setImagePreview(updatedProfile?.photo_url || '');
                }
            }
        } else {
            // school_owner_profiles table: user_id, full_name, email, phone, address, city, state, photo_url
            const tableUpdateData = {
                user_id: user.id,
                full_name: profile.full_name,
                photo_url: photo_url,
                email: profile.email,
                phone: profile.phone,
                address: profile.present_address || profile.current_address || profile.address,
                city: profile.city,
                state: profile.state,
                updated_at: new Date().toISOString()
            };
            
            if (school?.id) {
                tableUpdateData.branch_id = school.id;
            }

            console.log('Saving profile to school_owner_profiles:', tableUpdateData);
            
            // First check if profile exists for this user
            const { data: existingProfile } = await supabase
                .from('school_owner_profiles')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();
            
            if (existingProfile) {
                // Update existing profile
                const { data, error: updateError } = await supabase
                    .from('school_owner_profiles')
                    .update(tableUpdateData)
                    .eq('user_id', user.id)
                    .select();
                savedData = data;
                error = updateError;
                
                // Update local state with saved data
                if (data && data[0]) {
                    setProfile(prev => ({ ...prev, ...data[0], present_address: data[0].address }));
                    setImagePreview(data[0].photo_url || '');
                }
            } else {
                // Insert new profile
                const { data, error: insertError } = await supabase
                    .from('school_owner_profiles')
                    .insert(tableUpdateData)
                    .select();
                savedData = data;
                error = insertError;
                
                // Update local state with saved data
                if (data && data[0]) {
                    setProfile(prev => ({ ...prev, ...data[0], present_address: data[0].address }));
                    setImagePreview(data[0].photo_url || '');
                }
            }
        }
            
        if (error) throw error;
        console.log("Saved profile result:", savedData);
        
        // Refresh auth context to sync globally
        await refreshUserContext();
        
        // Clear the image file since it's now saved
        setImageFile(null);

        toast({ title: "Profile Updated!", description: "Your profile has been successfully updated." });
    } catch (error) {
        console.error(error);
        if (error.message?.includes("Session from session_id claim in JWT does not exist") || error.code === '403' || error.code === 403) {
             toast({ variant: 'destructive', title: 'Session Expired', description: 'Please log in again.' });
             navigate('/login');
             return;
        }
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (authLoading || isLoading || !profile) {
    return <DashboardLayout><div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <ProfileEditTemplate 
            profile={profile}
            setProfile={setProfile}
            handleSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            handleImageChange={handleImageChange}
            imagePreview={imagePreview}
            roleLabel="School Owner / Admin"
            disableOtp={true}
        />
      </div>
    </DashboardLayout>
  );
};

export default SchoolOwnerProfile;
