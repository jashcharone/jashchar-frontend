import React, { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Download, X, Share } from 'lucide-react';
import { useToast } from './ui/use-toast';

// ✅ Capture the event globally to ensure we don't miss it
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.pwaInstallPrompt = e; // ✅ Make it globally accessible
  window.dispatchEvent(new Event('pwa-install-available'));
});

function PwaUpdater() {
  const { toast } = useToast();
  const [installPrompt, setInstallPrompt] = useState(window.pwaInstallPrompt);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIosDevice);

    // Check if already in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    
    if (isIosDevice && !isStandalone) {
      // Show iOS prompt after a small delay
      const timer = setTimeout(() => setShowIOSPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // Listen for the custom event we dispatch globally
    const handlePwaAvailable = () => {
      setInstallPrompt(window.pwaInstallPrompt);
    };

    window.addEventListener('pwa-install-available', handlePwaAvailable);
    
    // Also check immediately in case it fired before mount
    if (window.pwaInstallPrompt) {
      setInstallPrompt(window.pwaInstallPrompt);
    }

    return () => {
      window.removeEventListener('pwa-install-available', handlePwaAvailable);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      toast({
        title: "Installation Success!",
        description: "The app is being installed on your device.",
      });
    }
    setInstallPrompt(null);
    window.pwaInstallPrompt = null;
  };
  
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  useEffect(() => {
    if (offlineReady) {
      toast({
        title: 'App is ready to work offline!',
        description: 'You can now use the app without an internet connection.',
      });
      setOfflineReady(false);
    }
  }, [offlineReady, toast, setOfflineReady]);

  const closeRefreshDialog = () => {
    setNeedRefresh(false);
  };

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  return (
    <>
      {/* Android / Desktop Install Prompt */}
      {installPrompt && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-card border-t border-border shadow-lg md:bottom-4 md:right-4 md:left-auto md:w-auto md:rounded-lg md:border">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Install App</h3>
              <p className="text-sm text-muted-foreground">Install Jashchar ERP for a better experience.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => setInstallPrompt(null)}>
                <X className="h-4 w-4" />
              </Button>
              <Button onClick={handleInstall} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Download className="mr-2 h-4 w-4" />
                Install
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Install Prompt */}
      {showIOSPrompt && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-card border-t border-border shadow-lg animate-in slide-in-from-bottom duration-500">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Install on iOS</h3>
              <p className="text-sm text-muted-foreground mb-2">
                To install this app on your iPhone/iPad:
              </p>
              <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                <li>Tap the <Share className="inline h-4 w-4 mx-1" /> <strong>Share</strong> button</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
              </ol>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowIOSPrompt(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Update Dialog */}
      <AlertDialog open={needRefresh} onOpenChange={closeRefreshDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Available!</AlertDialogTitle>
            <AlertDialogDescription>
              A new version of the app is available. Refresh to get the latest features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={closeRefreshDialog}>
              Not Now
            </Button>
            <AlertDialogAction onClick={handleUpdate}>
              Update Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default PwaUpdater;
