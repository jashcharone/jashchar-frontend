// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - MOBILE HEADER
// Compact app-style header for mobile
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Menu, 
  Search, 
  MoreVertical,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { platformService } from '@/platform';

export function MobileHeader({
  title,
  subtitle,
  showBack = false,
  showMenu = false,
  showSearch = false,
  showNotifications = false,
  showMore = false,
  onBackClick,
  onMenuClick,
  onSearchClick,
  onNotificationClick,
  onMoreClick,
  leftContent,
  rightContent,
  notificationCount = 0,
  className,
  transparent = false
}) {
  const navigate = useNavigate();

  // Handle back with haptic
  const handleBack = async () => {
    if (platformService.isNative) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (e) {}
    }
    
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  // Generic haptic tap
  const hapticTap = async (callback) => {
    if (platformService.isNative) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (e) {}
    }
    callback?.();
  };

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        "safe-area-top", // For iPhone notch
        transparent 
          ? "bg-transparent" 
          : "bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800",
        className
      )}
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="flex items-center h-14 px-2">
        {/* Left Section */}
        <div className="flex items-center min-w-[48px]">
          {showBack && (
            <button
              onClick={handleBack}
              className={cn(
                "p-2 rounded-full",
                "active:bg-gray-100 dark:active:bg-gray-800",
                "transition-colors"
              )}
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          
          {showMenu && (
            <button
              onClick={() => hapticTap(onMenuClick)}
              className={cn(
                "p-2 rounded-full",
                "active:bg-gray-100 dark:active:bg-gray-800",
                "transition-colors"
              )}
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
          
          {leftContent}
        </div>

        {/* Center - Title */}
        <div className="flex-1 min-w-0 px-2">
          {title && (
            <div className="truncate">
              <h1 className={cn(
                "text-lg font-semibold truncate",
                "text-gray-900 dark:text-white"
              )}>
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 min-w-[48px] justify-end">
          {rightContent}
          
          {showSearch && (
            <button
              onClick={() => hapticTap(onSearchClick)}
              className={cn(
                "p-2 rounded-full",
                "active:bg-gray-100 dark:active:bg-gray-800",
                "transition-colors"
              )}
            >
              <Search className="w-5 h-5" />
            </button>
          )}
          
          {showNotifications && (
            <button
              onClick={() => hapticTap(onNotificationClick)}
              className={cn(
                "p-2 rounded-full relative",
                "active:bg-gray-100 dark:active:bg-gray-800",
                "transition-colors"
              )}
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className={cn(
                  "absolute top-1 right-1",
                  "min-w-[16px] h-[16px]",
                  "flex items-center justify-center",
                  "text-[9px] font-bold text-white",
                  "bg-red-500 rounded-full"
                )}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
          )}
          
          {showMore && (
            <button
              onClick={() => hapticTap(onMoreClick)}
              className={cn(
                "p-2 rounded-full",
                "active:bg-gray-100 dark:active:bg-gray-800",
                "transition-colors"
              )}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default MobileHeader;
