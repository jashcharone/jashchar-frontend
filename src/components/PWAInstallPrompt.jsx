/**
 * PWA INSTALL PROMPT COMPONENT
 * ═══════════════════════════════════════════════════════════════
 * Prompts users to install the PWA on their device
 * - Detects "Add to Home Screen" capability
 * - Shows custom install UI
 * - Handles installation process
 * 
 * Features:
 * - Auto-dismiss if user declines multiple times
 * - Remembers user preference
 * - Shows organization-specific branding
 * 
 * Created: February 10, 2026
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * Check if app is already installed
 */
const isAppInstalled = () => {
    // Check if running in standalone mode (installed PWA)
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone ||
           document.referrer.includes('android-app://');
};

/**
 * Get decline count from localStorage
 */
const getDeclineCount = () => {
    const count = localStorage.getItem('pwa-install-decline-count');
    return count ? parseInt(count, 10) : 0;
};

/**
 * Install Prompt Component
 */
function InstallPrompt() {
    const { orgConfig, logo, organizationName } = useOrganization();
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);
    
    useEffect(() => {
        // Don't show if already installed
        if (isAppInstalled()) {
            return;
        }
        
        // Don't show if user declined too many times
        const declineCount = getDeclineCount();
        if (declineCount >= 3) {
            return;
        }
        
        // Check if user dismissed recently (within 7 days)
        const lastDismissed = localStorage.getItem('pwa-install-last-dismissed');
        if (lastDismissed) {
            const daysSinceDismiss = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
            if (daysSinceDismiss < 7) {
                return;
            }
        }
        
        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e) => {
            console.log('[PWA Install] beforeinstallprompt event fired');
            
            // Prevent default browser install prompt
            e.preventDefault();
            
            // Save the event for later use
            setDeferredPrompt(e);
            
            // Show our custom prompt after a delay
            setTimeout(() => {
                setShowPrompt(true);
            }, 3000); // Wait 3 seconds after page load
        };
        
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        
        // Cleanup
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);
    
    /**
     * Handle install button click
     */
    const handleInstall = async () => {
        if (!deferredPrompt) {
            console.log('[PWA Install] No deferred prompt available');
            return;
        }
        
        try {
            setIsInstalling(true);
            
            // Show browser's install prompt
            deferredPrompt.prompt();
            
            // Wait for user's response
            const { outcome } = await deferredPrompt.userChoice;
            
            console.log('[PWA Install] User choice:', outcome);
            
            if (outcome === 'accepted') {
                console.log('[PWA Install] User accepted installation');
                
                // Reset decline count
                localStorage.removeItem('pwa-install-decline-count');
                localStorage.removeItem('pwa-install-last-dismissed');
                
                // Hide prompt
                setShowPrompt(false);
            } else {
                console.log('[PWA Install] User declined installation');
                handleDismiss(true);
            }
            
            // Clear the deferred prompt
            setDeferredPrompt(null);
            
        } catch (error) {
            console.error('[PWA Install] Error during installation:', error);
        } finally {
            setIsInstalling(false);
        }
    };
    
    /**
     * Handle dismiss button click
     */
    const handleDismiss = (userDeclined = false) => {
        setShowPrompt(false);
        
        // Track dismissal
        localStorage.setItem('pwa-install-last-dismissed', Date.now().toString());
        
        // Increment decline count if user explicitly declined
        if (userDeclined) {
            const count = getDeclineCount();
            localStorage.setItem('pwa-install-decline-count', (count + 1).toString());
        }
    };
    
    // Don't render if prompt should not be shown
    if (!showPrompt || !deferredPrompt) {
        return null;
    }
    
    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5">
            <Card className="p-4 shadow-lg border-2 border-primary/20">
                {/* Close button */}
                <button
                    onClick={() => handleDismiss(false)}
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
                    aria-label="Close"
                >
                    <X className="h-4 w-4" />
                </button>
                
                {/* Content */}
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                        {logo ? (
                            <img
                                src={logo}
                                alt={organizationName}
                                className="h-12 w-12 rounded-lg object-contain"
                            />
                        ) : (
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Smartphone className="h-6 w-6 text-primary" />
                            </div>
                        )}
                    </div>
                    
                    {/* Text */}
                    <div className="flex-1 pt-1">
                        <h3 className="font-semibold text-sm mb-1">
                            Install {organizationName || 'App'}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-3">
                            Install our app for quick access and offline availability. 
                            Works just like a native app!
                        </p>
                        
                        {/* Buttons */}
                        <div className="flex gap-2">
                            <Button
                                onClick={handleInstall}
                                disabled={isInstalling}
                                size="sm"
                                className="flex-1"
                            >
                                <Download className="h-3.5 w-3.5 mr-1.5" />
                                {isInstalling ? 'Installing...' : 'Install'}
                            </Button>
                            <Button
                                onClick={() => handleDismiss(true)}
                                variant="outline"
                                size="sm"
                            >
                                Later
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default InstallPrompt;
