import { supabase } from '@/lib/customSupabaseClient';

// REPLACE WITH YOUR VAPID PUBLIC KEY FROM YOUR PUSH SERVICE PROVIDER
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

// Track if we've already attempted subscription to prevent spam
let subscriptionAttempted = false;

export async function subscribeToPushNotifications(userId) {
  // Prevent multiple subscription attempts
  if (subscriptionAttempted) {
    return null;
  }
  subscriptionAttempted = true;

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }

    // Send subscription to backend
    if (userId) {
      await saveSubscriptionToDb(userId, subscription);
    }
    
    return subscription;
  } catch (error) {
    // Silent fail for incognito/permission issues - no console.error spam
    if (error.name === 'AbortError' || error.message?.includes('permission')) {
      console.info('[Push] Notifications unavailable in this mode');
    }
    return null;
  }
}

async function saveSubscriptionToDb(userId, subscription) {
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ 
      user_id: userId, 
      subscription: subscription,
      updated_at: new Date()
    }, { onConflict: 'user_id' }); 
    
  if (error) console.info('[Push] Could not save subscription');
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
