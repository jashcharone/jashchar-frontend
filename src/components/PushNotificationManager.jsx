import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { subscribeToPushNotifications } from '@/utils/pushNotification';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const PushNotificationManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const checkedRef = useRef(false);

  useEffect(() => {
    // Only check once per mount
    if (checkedRef.current) return;
    checkedRef.current = true;

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, [user]);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (error) {
      // Silently handle errors (likely incognito mode)
      setIsAvailable(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) return;

    toast({
      title: 'Enabling Notifications...',
      description: 'Please allow notifications when prompted.',
    });

    const sub = await subscribeToPushNotifications(user.id);
    
    if (sub) {
      setSubscription(sub);
      toast({
        title: 'Success!',
        description: 'You will now receive notifications on this device.',
      });
    } else {
      setIsAvailable(false);
      toast({
        variant: 'destructive',
        title: 'Not Available',
        description: 'Notifications are not available in private browsing mode.',
      });
    }
  };

  // Don't show if not available (incognito), not supported, or already subscribed
  if (!user || !isSupported || !isAvailable || subscription) return null;

  return (
    <div className='fixed bottom-4 right-4 z-50 print-hidden'>
      <Button 
        onClick={handleSubscribe}
        className='shadow-lg rounded-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white'
      >
        <Bell className='h-4 w-4' />
        Enable Notifications
      </Button>
    </div>
  );
};

export default PushNotificationManager;
