/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VOICE CORTEX - Voice Command Interface (Kannada/Hindi/English)
 * "India's First Voice-Controlled School ERP"
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  History, 
  Settings, 
  Globe,
  Sparkles,
  MessageSquare,
  HelpCircle,
  CheckCircle
} from 'lucide-react';

const VoiceCortex = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [language, setLanguage] = useState('en-IN');
  const [commandHistory, setCommandHistory] = useState([
    { command: 'ಇಂದಿನ ಹಾಜರಾತಿ ಹೇಳಿ', response: 'ಇಂದಿನ ಹಾಜರಾತಿ 94.5% ಇದೆ', time: '10:30 AM', lang: 'kn' },
    { command: 'How many students absent today?', response: '23 students are absent today', time: '10:15 AM', lang: 'en' },
    { command: 'आज की फीस कलेक्शन बताओ', response: 'आज ₹45,000 फीस कलेक्ट हुई है', time: '09:45 AM', lang: 'hi' }
  ]);

  const languages = [
    { code: 'en-IN', name: 'English', nativeName: 'English', flag: '🇮🇳' },
    { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'hi-IN', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' }
  ];

  const sampleCommands = {
    'en-IN': [
      'Show today\'s attendance',
      'How many students absent?',
      'Tell fees collection',
      'List pending fees',
      'Show class 10 results'
    ],
    'kn-IN': [
      'ಇಂದಿನ ಹಾಜರಾತಿ ಹೇಳಿ',
      'ಎಷ್ಟು ವಿದ್ಯಾರ್ಥಿಗಳು ಗೈರು?',
      'ಫೀಸ್ ಸಂಗ್ರಹ ಹೇಳಿ',
      'ಬಾಕಿ ಫೀಸ್ ಪಟ್ಟಿ',
      '10ನೇ ತರಗತಿ ಫಲಿತಾಂಶ'
    ],
    'hi-IN': [
      'आज की उपस्थिति बताओ',
      'कितने छात्र अनुपस्थित हैं?',
      'फीस कलेक्शन बताओ',
      'बकाया फीस लिस्ट',
      'कक्षा 10 के परिणाम दिखाओ'
    ]
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      // Start listening - mock implementation
      setTranscript('');
      setResponse('');
      // In real implementation, use Web Speech API here
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Mic className="w-7 h-7 text-purple-600" />
            Voice Cortex
            <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded">
              NEW
            </span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Talk to your ERP in Kannada, Hindi, or English
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.nativeName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Voice Interface */}
      <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900 rounded-2xl p-8 text-white relative overflow-hidden">
        {/* Background Effect */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
        </div>

        <div className="relative text-center">
          {/* Language Indicator */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-8">
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">
              {languages.find(l => l.code === language)?.nativeName} Mode
            </span>
          </div>

          {/* Mic Button */}
          <div className="flex justify-center mb-8">
            <button
              onClick={toggleListening}
              className={`relative w-32 h-32 rounded-full transition-all duration-300 ${
                isListening 
                  ? 'bg-red-500 shadow-lg shadow-red-500/50 scale-110' 
                  : 'bg-gradient-to-br from-purple-500 to-blue-500 hover:scale-105'
              }`}
            >
              {/* Pulse Animation */}
              {isListening && (
                <>
                  <span className="absolute inset-0 rounded-full animate-ping bg-red-500/50" />
                  <span className="absolute inset-2 rounded-full animate-pulse bg-red-500/30" />
                </>
              )}
              {isListening ? (
                <MicOff className="w-12 h-12 text-white mx-auto relative z-10" />
              ) : (
                <Mic className="w-12 h-12 text-white mx-auto relative z-10" />
              )}
            </button>
          </div>

          {/* Status Text */}
          <div className="mb-6">
            {isListening ? (
              <p className="text-lg font-medium animate-pulse">Listening... Speak now</p>
            ) : (
              <p className="text-lg text-purple-200">Tap the microphone to start</p>
            )}
          </div>

          {/* Transcript Display */}
          {transcript && (
            <div className="bg-white/10 rounded-xl p-4 mb-4 text-left">
              <p className="text-sm text-purple-300 mb-1">You said:</p>
              <p className="text-lg font-medium">{transcript}</p>
            </div>
          )}

          {/* Response Display */}
          {response && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 text-left">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="w-4 h-4 text-green-400" />
                <p className="text-sm text-green-300">Cortex AI Response:</p>
              </div>
              <p className="text-lg font-medium">{response}</p>
            </div>
          )}
        </div>
      </div>

      {/* Sample Commands */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Try saying...
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(sampleCommands[language] || sampleCommands['en-IN']).map((command, index) => (
            <button
              key={index}
              className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg text-left hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-purple-600 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{command}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Command History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Command History
            </h2>
          </div>
          <button className="text-sm text-purple-600 hover:text-purple-700">
            Clear All
          </button>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {commandHistory.map((item, index) => (
            <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Mic className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.command}
                    </span>
                    <span className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded uppercase">
                      {item.lang}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 ml-6">
                    <Volume2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {item.response}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Badge */}
      <div className="text-center">
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full text-sm font-medium">
          <Sparkles className="w-4 h-4" />
          India's First Multilingual Voice ERP
        </span>
      </div>
    </div>
  );
};

export default VoiceCortex;
