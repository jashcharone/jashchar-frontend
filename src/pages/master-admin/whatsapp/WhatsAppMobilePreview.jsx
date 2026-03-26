import React from 'react';
import { Smartphone } from "lucide-react";

const WhatsAppMobilePreview = ({ header, body, footer, buttons }) => {
    return (
        <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-900 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
            <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
            <div className="h-[32px] w-[3px] bg-gray-800 absolute -start-[17px] top-[72px] rounded-s-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
            <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
            <div className="rounded-[2rem] overflow-hidden w-full h-full bg-[#e5ddd5] relative flex flex-col">
                {/* WhatsApp Header */}
                <div className="bg-[#075e54] h-16 flex items-center px-4 pt-4 shrink-0">
                    <div className="flex items-center gap-2 text-white">
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold">
                            Logo
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold">Jashchar ERP</span>
                            <span className="text-[10px] opacity-80">Business Account</span>
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 p-4 overflow-y-auto bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
                    <div className="bg-white rounded-lg p-2 shadow-sm max-w-[85%] ml-auto relative">
                        {/* Message Header */}
                        {header && (
                            <div className="font-bold text-sm mb-1 text-gray-800">
                                {header}
                            </div>
                        )}
                        
                        {/* Message Body */}
                        <div className="text-sm text-gray-800 whitespace-pre-wrap">
                            {body || "Select a template to preview..."}
                        </div>

                        {/* Message Footer */}
                        {footer && (
                            <div className="text-xs text-gray-500 mt-1">
                                {footer}
                            </div>
                        )}

                        {/* Timestamp */}
                        <div className="text-[10px] text-gray-400 text-right mt-1">
                            12:00 PM
                        </div>
                    </div>

                    {/* Buttons */}
                    {buttons && buttons.length > 0 && (
                        <div className="mt-2 max-w-[85%] ml-auto flex flex-col gap-2">
                            {buttons.map((btn, idx) => (
                                <div key={idx} className="bg-white rounded-lg p-2 shadow-sm text-center text-[#00a884] font-medium text-sm cursor-pointer hover:bg-gray-50 transition-colors">
                                    {btn.text || btn}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Input Area (Mock) */}
                <div className="bg-[#f0f0f0] p-2 flex items-center gap-2 shrink-0">
                    <div className="w-6 h-6 rounded-full bg-gray-400 opacity-50"></div>
                    <div className="flex-1 h-8 bg-white rounded-full"></div>
                    <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-white">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M1.101 21.757 23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path></svg>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppMobilePreview;
