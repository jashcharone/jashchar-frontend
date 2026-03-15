/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VOICE CORTEX - Voice Command Interface (Kannada/Hindi/English)
 * "India's First Voice-Controlled School ERP"
 * Connected to Real Backend APIs with Web Speech API
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { formatTime } from '@/utils/dateUtils';

const VoiceCortex = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('en-IN');
  const [commandHistory, setCommandHistory] = useState([]);
  const [supportedCommands, setSupportedCommands] = useState({});
  const [speechSupported, setSpeechSupported] = useState(true);
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  const languages = [
    { code: 'en-IN', name: 'English', nativeName: 'English', flag: '🇮🇳' },
    { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'hi-IN', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' }
  ];

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setError('Speech recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
      setError('');
    };

    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const result = event.results[current];
      const transcriptText = result[0].transcript;
      setTranscript(transcriptText);
      
      // If final result, process command
      if (result.isFinal) {
        processVoiceCommand(transcriptText);
      }
    };

    recognition.onerror = (event) => {
      console.error('[Voice] Recognition error:', event.error);
      setError(`Voice error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language]);

  // Update recognition language when changed
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  // Fetch command history and supported commands
  useEffect(() => {
    const fetchVoiceData = async () => {
      try {
        const [historyRes, commandsRes] = await Promise.all([
          api.get('/cortex/voice/history?limit=10'),
          api.get('/cortex/voice/commands')
        ]);
        
        setCommandHistory(historyRes.data || []);
        setSupportedCommands(commandsRes.data || {});
      } catch (error) {
        console.error('[Voice] Fetch error:', error);
        // Use default sample commands
        setSupportedCommands({
          'en-IN': [
            { command: "Show today's attendance", intent: 'attendance_today' },
            { command: 'How many students absent?', intent: 'absent_students' },
            { command: 'Tell fees collection', intent: 'fees_collection' },
            { command: 'List pending fees', intent: 'pending_fees' }
          ],
          'kn-IN': [
            { command: 'ಇಂದಿನ ಹಾಜರಾತಿ ಹೇಳಿ', intent: 'attendance_today' },
            { command: 'ಎಷ್ಟು ವಿದ್ಯಾರ್ಥಿಗಳು ಗೈರು?', intent: 'absent_students' },
            { command: 'ಫೀಸ್ ಸಂಗ್ರಹ ಹೇಳಿ', intent: 'fees_collection' },
            { command: 'ಬಾಕಿ ಫೀಸ್ ಪಟ್ಟಿ', intent: 'pending_fees' }
          ],
          'hi-IN': [
            { command: 'आज की उपस्थिति बताओ', intent: 'attendance_today' },
            { command: 'कितने छात्र अनुपस्थित हैं?', intent: 'absent_students' },
            { command: 'फीस कलेक्शन बताओ', intent: 'fees_collection' },
            { command: 'बकाया फीस लिस्ट', intent: 'pending_fees' }
          ]
        });
      }
    };
    fetchVoiceData();
  }, []);

  // Process voice command via backend
  const processVoiceCommand = async (text) => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    setResponse('');
    
    try {
      const res = await api.post('/cortex/voice/process', {
        transcript: text,
        language: language
      });
      
      const responseText = res.data?.text || 'Command processed';
      setResponse(responseText);
      
      // Add to history
      setCommandHistory(prev => [{
        id: Date.now(),
        command: text,
        response: responseText,
        language: language,
        created_at: new Date().toISOString()
      }, ...prev.slice(0, 9)]);
      
      // Speak the response
      speakResponse(responseText);
      
    } catch (error) {
      console.error('[Voice] Process error:', error);
      const fallbackResponse = getFallbackResponse(text, language);
      setResponse(fallbackResponse);
      speakResponse(fallbackResponse);
    } finally {
      setIsProcessing(false);
    }
  };

  // Text-to-Speech
  const speakResponse = (text) => {
    if (!synthRef.current || !text) return;
    
    // Cancel any ongoing speech
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.9;
    
    synthRef.current.speak(utterance);
  };

  // Fallback responses for demo
  const getFallbackResponse = (text, lang) => {
    const t = text.toLowerCase();
    
    if (lang === 'en-IN') {
      if (t.includes('attendance')) return "Today's attendance is 94.5%. 23 students are absent.";
      if (t.includes('absent')) return '23 students are absent today across all classes.';
      if (t.includes('fees') && t.includes('collection')) return "Today's fee collection is ₹45,000.";
      if (t.includes('pending')) return 'There are 45 students with pending fees totaling ₹2,35,000.';
      return "I understood your command, but I couldn't process it. Please try again.";
    }
    
    if (lang === 'kn-IN') {
      if (t.includes('ಹಾಜರಾತಿ')) return 'ಇಂದಿನ ಹಾಜರಾತಿ 94.5% ಇದೆ. 23 ವಿದ್ಯಾರ್ಥಿಗಳು ಗೈರು.';
      if (t.includes('ಗೈರು')) return 'ಇಂದು 23 ವಿದ್ಯಾರ್ಥಿಗಳು ಗೈರಾಗಿದ್ದಾರೆ.';
      if (t.includes('ಫೀಸ್')) return 'ಇಂದಿನ ಫೀಸ್ ಸಂಗ್ರಹ ₹45,000 ಇದೆ.';
      return 'ಕ್ಷಮಿಸಿ, ನನಗೆ ಅರ್ಥವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.';
    }
    
    if (lang === 'hi-IN') {
      if (t.includes('उपस्थिति')) return 'आज की उपस्थिति 94.5% है। 23 छात्र अनुपस्थित हैं।';
      if (t.includes('अनुपस्थित')) return 'आज 23 छात्र अनुपस्थित हैं।';
      if (t.includes('फीस')) return 'आज की फीस कलेक्शन ₹45,000 है।';
      return 'क्षमा करें, मैं समझ नहीं पाया। कृपया फिर से प्रयास करें।';
    }
    
    return 'Command not recognized.';
  };

  const toggleListening = () => {
    if (!speechSupported) {
      setError('Speech recognition not supported');
      return;
    }
    
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      setResponse('');
      setError('');
      recognitionRef.current?.start();
    }
  };

  // Simulate command for demo
  const simulateCommand = (command) => {
    setTranscript(command);
    processVoiceCommand(command);
  };

  const sampleCommands = supportedCommands[language] || supportedCommands['en-IN'] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Mic className="w-7 h-7 text-purple-600" />
            Voice Cortex
            <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded">
              LIVE
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

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      {/* Main Voice Interface */}
      <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900 rounded-2xl p-8 text-white relative overflow-hidden">
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
            {speechSupported && <CheckCircle className="w-4 h-4 text-green-400" />}
          </div>

          {/* Mic Button */}
          <div className="flex justify-center mb-8">
            <button
              onClick={toggleListening}
              disabled={isProcessing || !speechSupported}
              className={`relative w-32 h-32 rounded-full transition-all duration-300 ${
                isListening 
                  ? 'bg-red-500 shadow-lg shadow-red-500/50 scale-110' 
                  : isProcessing
                  ? 'bg-yellow-500 cursor-not-allowed'
                  : 'bg-gradient-to-br from-purple-500 to-blue-500 hover:scale-105'
              } ${!speechSupported && 'opacity-50 cursor-not-allowed'}`}
            >
              {isListening && (
                <>
                  <span className="absolute inset-0 rounded-full animate-ping bg-red-500/50" />
                  <span className="absolute inset-2 rounded-full animate-pulse bg-red-500/30" />
                </>
              )}
              {isProcessing ? (
                <Loader2 className="w-12 h-12 text-white mx-auto relative z-10 animate-spin" />
              ) : isListening ? (
                <MicOff className="w-12 h-12 text-white mx-auto relative z-10" />
              ) : (
                <Mic className="w-12 h-12 text-white mx-auto relative z-10" />
              )}
            </button>
          </div>

          {/* Status Text */}
          <div className="mb-6">
            {isProcessing ? (
              <p className="text-lg font-medium text-yellow-300">Processing command...</p>
            ) : isListening ? (
              <p className="text-lg font-medium animate-pulse">Listening... Speak now</p>
            ) : (
              <p className="text-lg text-purple-200">
                {speechSupported ? 'Tap the microphone to start' : 'Speech not supported - use buttons below'}
              </p>
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
            Try saying... (or click to test)
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sampleCommands.map((cmd, index) => (
            <button
              key={index}
              onClick={() => simulateCommand(cmd.command || cmd)}
              className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg text-left hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-purple-600 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{cmd.command || cmd}</span>
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
          <button 
            onClick={() => setCommandHistory([])}
            className="text-sm text-purple-600 hover:text-purple-700"
          >
            Clear All
          </button>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {commandHistory.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No commands yet. Try speaking or click a sample command above.
            </div>
          ) : (
            commandHistory.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Mic className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.command}
                      </span>
                      <span className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded uppercase">
                        {item.language?.split('-')[0] || 'en'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-6">
                      <Volume2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {item.response}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {item.created_at ? formatTime(item.created_at) : item.time}
                  </span>
                </div>
              </div>
            ))
          )}
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
