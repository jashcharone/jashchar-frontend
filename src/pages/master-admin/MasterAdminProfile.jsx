import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import ProfileEditTemplate from '@/components/ProfileEditTemplate';

const MasterAdminProfile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshUserContext } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
        if (!user) return;
        
        // Try to fetch from master_admin_profiles first to ensure we get the latest data
        const { data, error } = await supabase
            .from('master_admin_profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
            
        if (data) {
            setProfile({
                ...user.profile, // Keep metadata as fallback
                ...data, // Overwrite with table data
                email: data.email || user.email
            });
            setImagePreview(data.photo_url || user.profile?.photo_url || '');
        } else {
            // Fallback to existing logic if no table data found
            setProfile({ 
                ...user.profile,
                email: user.profile?.email || user.email 
            });
            setImagePreview(user.profile?.photo_url || '');
        }
    };

    if (!authLoading && user) {
        fetchProfile();
    }
  }, [user, authLoading]);

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
            email: profile.email,
            present_address: profile.present_address,
            permanent_address: profile.permanent_address,
            facebook_url: profile.facebook_url,
            twitter_url: profile.twitter_url,
            linkedin_url: profile.linkedin_url
        };

        const { error } = await supabase.auth.updateUser({
            data: updateData
        });

        if (error) {
            // Handle session expiry specifically
            if (error.message?.includes("Session from session_id claim in JWT does not exist") || error.code === 403) {
                toast({ variant: 'destructive', title: 'Session Expired', description: 'Please log in again.' });
                navigate('/login');
                return;
            }
            throw error;
        }

        // Filter data for the table update (only include columns that exist in master_admin_profiles)
        const tableUpdateData = {
            id: user.id, // Ensure ID is present for upsert
            full_name: profile.full_name,
            photo_url: photo_url,
            email: profile.email,
            phone: profile.phone,
            gender: profile.gender,
            religion: profile.religion,
            blood_group: profile.blood_group,
            dob: profile.dob,
            present_address: profile.present_address,
            permanent_address: profile.permanent_address,
            facebook_url: profile.facebook_url,
            twitter_url: profile.twitter_url,
            linkedin_url: profile.linkedin_url
        };

        // Also update the profiles table directly to ensure sync
        const { error: profileError } = await supabase
            .from('master_admin_profiles')
            .upsert(tableUpdateData);
            
        if (error) throw error;
        if (profileError) throw profileError;
        
        await refreshUserContext();

        toast({ title: "Profile Updated!", description: "Your profile has been successfully updated." });
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (authLoading || !profile) {
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
            roleLabel="Super Admin / Master Admin"
            disableOtp={true} // Master Admin can update directly without OTP
        />
      </div>
    </DashboardLayout>
  );
};

export default MasterAdminProfile;
