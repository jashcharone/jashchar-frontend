import React, { useState, useEffect } from 'react';
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
  const tableName = isSuperAdmin ? 'profiles' : 'school_owner_profiles';
  const idColumn = isSuperAdmin ? 'id' : 'user_id';

  useEffect(() => {
    const loadProfile = async () => {
        if (authLoading) return;
        
        if (!user) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        try {
            // Fetch fresh profile data directly from DB using correct table
            const { data: freshProfile, error } = await supabase
                .from(tableName)
                .select('*')
                .eq(idColumn, user.id)
                .maybeSingle();

            if (error) {
                console.error('Error fetching profile:', error);
            }

            // Merge with user metadata as fallback
            const mergedProfile = {
                ...user.user_metadata,
                ...user.profile,
                ...(freshProfile || {}),
                present_address: freshProfile?.address || freshProfile?.current_address || user.profile?.current_address || user.profile?.present_address || ''
            };

            setProfile(mergedProfile);
            setImagePreview(freshProfile?.photo_url || freshProfile?.avatar_url || user.profile?.photo_url || user.user_metadata?.avatar_url || '');
        } catch (err) {
            console.error('Profile load error:', err);
            // Fallback to existing user data
            setProfile({ 
                ...user.user_metadata, 
                ...user.profile,
                present_address: user.profile?.current_address || user.profile?.present_address || ''
            });
            setImagePreview(user.profile?.photo_url || user.user_metadata?.avatar_url || '');
        } finally {
            setIsLoading(false);
        }
    };

    loadProfile();
  }, [user, authLoading, tableName, idColumn]);

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

        const updateData = {
            full_name: profile.full_name,
            photo_url: photo_url,
            phone: profile.phone,
            gender: profile.gender,
            religion: profile.religion,
            blood_group: profile.blood_group,
            dob: profile.dob,
            current_address: profile.present_address, // Map back to current_address for DB
            permanent_address: profile.permanent_address,
            facebook_url: profile.facebook_url,
            twitter_url: profile.twitter_url,
            linkedin_url: profile.linkedin_url
        };
        
        // Build update data based on table type
        let tableUpdateData;
        
        if (isSuperAdmin) {
            // profiles table: id, email, full_name, phone, avatar_url, preferences
            tableUpdateData = {
                full_name: profile.full_name,
                avatar_url: photo_url,
                email: profile.email,
                phone: profile.phone,
                updated_at: new Date().toISOString()
            };
        } else {
            // school_owner_profiles table: user_id, full_name, email, phone, address, city, state, photo_url
            tableUpdateData = {
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
        }

        console.log(`Saving profile to ${tableName}:`, tableUpdateData);
        
        // First check if profile exists for this user
        const { data: existingProfile } = await supabase
            .from(tableName)
            .select('id')
            .eq(idColumn, user.id)
            .maybeSingle();
        
        let savedData, error;
        
        if (existingProfile) {
            // Update existing profile
            const { data, error: updateError } = await supabase
                .from(tableName)
                .update(tableUpdateData)
                .eq(idColumn, user.id)
                .select();
            savedData = data;
            error = updateError;
        } else {
            // Insert new profile
            if (isSuperAdmin) {
                // profiles table: id must be user.id (references auth.users)
                const { data, error: insertError } = await supabase
                    .from(tableName)
                    .insert({ ...tableUpdateData, id: user.id })
                    .select();
                savedData = data;
                error = insertError;
            } else {
                // school_owner_profiles: don't set id, let DB generate it
                // But we need user to exist in public.users table first
                const { data, error: insertError } = await supabase
                    .from(tableName)
                    .insert(tableUpdateData)
                    .select();
                savedData = data;
                error = insertError;
            }
        }
            
        if (error) throw error;
        console.log("Saved profile result:", savedData);
        
        await refreshUserContext();

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
