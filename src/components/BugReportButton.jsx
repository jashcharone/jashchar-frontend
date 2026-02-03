/**
 * BugReportButton - Floating Pink Bug Report Button
 * ═══════════════════════════════════════════════════════════════════════════════
 * Professional bug reporting system for Jashchar ERP
 * - Floating pink icon on all dashboard pages
 * - Opens BugReportModal for detailed bug submission
 * - Submits to QueriesFinder system for tracking
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { Bug, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BugReportModal from './BugReportModal';
import { cn } from '@/lib/utils';

const BugReportButton = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    return (
        <>
            {/* Floating Button */}
            <motion.button
                className={cn(
                    "fixed bottom-6 right-6 z-50",
                    "w-14 h-14 rounded-full",
                    "bg-gradient-to-br from-pink-500 to-pink-600",
                    "text-white shadow-lg shadow-pink-500/40",
                    "flex items-center justify-center",
                    "hover:from-pink-600 hover:to-pink-700",
                    "hover:shadow-xl hover:shadow-pink-500/50",
                    "focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2",
                    "transition-all duration-200"
                )}
                onClick={() => setIsModalOpen(true)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                title="Report a Bug or Issue"
                aria-label="Report a Bug or Issue"
            >
                <Bug className="h-6 w-6" />
                
                {/* Pulse animation ring */}
                <span className="absolute inset-0 rounded-full bg-pink-400 animate-ping opacity-20" />
            </motion.button>

            {/* Tooltip on hover */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className={cn(
                            "fixed bottom-8 right-[5.5rem] z-50",
                            "px-3 py-2 rounded-lg",
                            "bg-gray-900 text-white text-sm font-medium",
                            "shadow-lg whitespace-nowrap"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-pink-400" />
                            Report Bug / Issue
                        </div>
                        {/* Arrow */}
                        <div className="absolute top-1/2 right-0 transform translate-x-1 -translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bug Report Modal */}
            <BugReportModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />
        </>
    );
};

export default BugReportButton;
