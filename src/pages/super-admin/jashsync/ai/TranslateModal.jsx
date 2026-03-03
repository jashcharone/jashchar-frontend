import React, { useState, useEffect } from 'react';
import { 
    Languages, ArrowLeftRight, Copy, Check, Volume2, Loader2,
    History, Star, StarOff, ChevronDown, Search, X, Sparkles,
    Globe, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from '@/components/ui/use-toast';
import api from "@/services/api";

/**
 * TranslateModal - Multi-language translation
 * Supports Indian regional languages and global languages
 */
const TranslateModal = ({ 
    open, 
    onOpenChange,
    initialText = '',
    onTranslated
}) => {
    const { toast } = useToast();
    const [sourceText, setSourceText] = useState(initialText);
    const [translatedText, setTranslatedText] = useState('');
    const [sourceLang, setSourceLang] = useState('auto');
    const [targetLang, setTargetLang] = useState('hi');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [detectedLang, setDetectedLang] = useState(null);
    const [sourceOpen, setSourceOpen] = useState(false);
    const [targetOpen, setTargetOpen] = useState(false);
    const [favorites, setFavorites] = useState(['hi', 'kn', 'ta', 'te']);
    const [history, setHistory] = useState([]);
    const [charCount, setCharCount] = useState(0);
    
    // Language options - Indian + Global
    const languages = [
        // Indian Languages
        { code: 'hi', name: 'Hindi', native: 'हिन्दी', region: 'india', flag: '🇮🇳' },
        { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', region: 'india', flag: '🇮🇳' },
        { code: 'ta', name: 'Tamil', native: 'தமிழ்', region: 'india', flag: '🇮🇳' },
        { code: 'te', name: 'Telugu', native: 'తెలుగు', region: 'india', flag: '🇮🇳' },
        { code: 'ml', name: 'Malayalam', native: 'മലയാളം', region: 'india', flag: '🇮🇳' },
        { code: 'mr', name: 'Marathi', native: 'मराठी', region: 'india', flag: '🇮🇳' },
        { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', region: 'india', flag: '🇮🇳' },
        { code: 'bn', name: 'Bengali', native: 'বাংলা', region: 'india', flag: '🇮🇳' },
        { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', region: 'india', flag: '🇮🇳' },
        { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', region: 'india', flag: '🇮🇳' },
        { code: 'as', name: 'Assamese', native: 'অসমীয়া', region: 'india', flag: '🇮🇳' },
        { code: 'ur', name: 'Urdu', native: 'اردو', region: 'india', flag: '🇮🇳' },
        
        // Global Languages
        { code: 'en', name: 'English', native: 'English', region: 'global', flag: '🇬🇧' },
        { code: 'es', name: 'Spanish', native: 'Español', region: 'global', flag: '🇪🇸' },
        { code: 'fr', name: 'French', native: 'Français', region: 'global', flag: '🇫🇷' },
        { code: 'de', name: 'German', native: 'Deutsch', region: 'global', flag: '🇩🇪' },
        { code: 'zh', name: 'Chinese', native: '中文', region: 'global', flag: '🇨🇳' },
        { code: 'ja', name: 'Japanese', native: '日本語', region: 'global', flag: '🇯🇵' },
        { code: 'ko', name: 'Korean', native: '한국어', region: 'global', flag: '🇰🇷' },
        { code: 'ar', name: 'Arabic', native: 'العربية', region: 'global', flag: '🇸🇦' },
        { code: 'pt', name: 'Portuguese', native: 'Português', region: 'global', flag: '🇵🇹' },
        { code: 'ru', name: 'Russian', native: 'Русский', region: 'global', flag: '🇷🇺' },
    ];
    
    const indianLanguages = languages.filter(l => l.region === 'india');
    const globalLanguages = languages.filter(l => l.region === 'global');
    
    // Get language info
    const getLanguage = (code) => languages.find(l => l.code === code);
    
    // Update text when initialText changes
    useEffect(() => {
        if (initialText) {
            setSourceText(initialText);
            setCharCount(initialText.length);
        }
    }, [initialText]);
    
    // Translate text
    const translateText = async () => {
        if (!sourceText.trim()) {
            toast({ title: "Error", description: 'Please enter text to translate', variant: "destructive" });
            return;
        }
        
        setLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Mock translation (in production, call actual translation API)
            const mockTranslations = {
                'hi': {
                    'Hello': 'नमस्ते',
                    'Thank you': 'धन्यवाद',
                    'Please': 'कृपया',
                    'Good morning': 'सुप्रभात',
                    'How are you?': 'आप कैसे हैं?',
                },
                'kn': {
                    'Hello': 'ನಮಸ್ಕಾರ',
                    'Thank you': 'ಧನ್ಯವಾದಗಳು',
                    'Please': 'ದಯವಿಟ್ಟು',
                    'Good morning': 'ಶುಭೋದಯ',
                    'How are you?': 'ನೀವು ಹೇಗಿದ್ದೀರಿ?',
                },
                'ta': {
                    'Hello': 'வணக்கம்',
                    'Thank you': 'நன்றி',
                    'Please': 'தயவுசெய்து',
                    'Good morning': 'காலை வணக்கம்',
                    'How are you?': 'நீங்கள் எப்படி இருக்கிறீர்கள்?',
                },
                'te': {
                    'Hello': 'నమస్కారం',
                    'Thank you': 'ధన్యవాదాలు',
                    'Please': 'దయచేసి',
                    'Good morning': 'శుభోదయం',
                    'How are you?': 'మీరు ఎలా ఉన్నారు?',
                }
            };
            
            // Get mock or generate placeholder translation
            let translated = mockTranslations[targetLang]?.[sourceText] || 
                `[${getLanguage(targetLang)?.native || targetLang}] ${sourceText}`;
            
            // If auto-detect, set detected language
            if (sourceLang === 'auto') {
                setDetectedLang('en');
            }
            
            setTranslatedText(translated);
            
            // Add to history
            setHistory(prev => [{
                id: Date.now(),
                source: sourceText,
                translated,
                from: sourceLang === 'auto' ? 'en' : sourceLang,
                to: targetLang,
                timestamp: new Date()
            }, ...prev.slice(0, 9)]);
            
        } catch (error) {
            console.error('Translation failed:', error);
            toast({ title: "Error", description: 'Translation failed. Please try again.', variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };
    
    // Swap languages
    const swapLanguages = () => {
        if (sourceLang === 'auto') return;
        const temp = sourceLang;
        setSourceLang(targetLang);
        setTargetLang(temp);
        setSourceText(translatedText);
        setTranslatedText(sourceText);
    };
    
    // Copy translated text
    const copyTranslation = () => {
        if (translatedText) {
            navigator.clipboard.writeText(translatedText);
            setCopied(true);
            toast({ title: "Copied", description: 'Translation copied to clipboard' });
            setTimeout(() => setCopied(false), 2000);
        }
    };
    
    // Use translation
    const useTranslation = () => {
        if (translatedText) {
            onTranslated?.(translatedText);
            onOpenChange(false);
        }
    };
    
    // Toggle favorite
    const toggleFavorite = (code) => {
        setFavorites(prev => 
            prev.includes(code) 
                ? prev.filter(c => c !== code)
                : [...prev, code]
        );
    };
    
    // Text-to-speech
    const speakText = (text, lang) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            speechSynthesis.speak(utterance);
        } else {
            toast({ title: "Error", description: 'Text-to-speech not supported', variant: "destructive" });
        }
    };
    
    // Language selector component
    const LanguageSelector = ({ value, onChange, open, setOpen, excludeAuto = false }) => {
        const selectedLang = value === 'auto' ? null : getLanguage(value);
        
        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                        {value === 'auto' ? (
                            <span className="flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                Auto Detect
                                {detectedLang && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                        {getLanguage(detectedLang)?.name}
                                    </Badge>
                                )}
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <span>{selectedLang?.flag}</span>
                                {selectedLang?.name}
                                <span className="text-gray-500 text-xs">({selectedLang?.native})</span>
                            </span>
                        )}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <Command className="bg-transparent">
                        <CommandInput placeholder="Search language..." className="border-gray-200 dark:border-gray-700" />
                        <CommandList>
                            <CommandEmpty>No language found.</CommandEmpty>
                            
                            {!excludeAuto && (
                                <CommandGroup heading="Auto">
                                    <CommandItem
                                        onSelect={() => {
                                            onChange('auto');
                                            setOpen(false);
                                        }}
                                        className="hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        <Globe className="w-4 h-4 mr-2" />
                                        Auto Detect
                                    </CommandItem>
                                </CommandGroup>
                            )}
                            
                            {favorites.length > 0 && (
                                <CommandGroup heading="Favorites">
                                    {favorites.map(code => {
                                        const lang = getLanguage(code);
                                        if (!lang) return null;
                                        return (
                                            <CommandItem
                                                key={`fav-${code}`}
                                                onSelect={() => {
                                                    onChange(code);
                                                    setOpen(false);
                                                }}
                                                className="hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                                <span className="mr-2">{lang.flag}</span>
                                                {lang.name}
                                                <span className="ml-auto text-gray-500 text-xs">{lang.native}</span>
                                                <Star className="w-3 h-3 ml-2 text-yellow-400 fill-yellow-400" />
                                            </CommandItem>
                                        );
                                    })}
                                </CommandGroup>
                            )}
                            
                            <CommandGroup heading="Indian Languages">
                                {indianLanguages.map(lang => (
                                    <CommandItem
                                        key={lang.code}
                                        onSelect={() => {
                                            onChange(lang.code);
                                            setOpen(false);
                                        }}
                                        className="hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        <span className="mr-2">{lang.flag}</span>
                                        {lang.name}
                                        <span className="ml-auto text-gray-500 text-xs">{lang.native}</span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 ml-2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFavorite(lang.code);
                                            }}
                                        >
                                            {favorites.includes(lang.code) ? (
                                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                            ) : (
                                                <StarOff className="w-3 h-3 text-gray-500" />
                                            )}
                                        </Button>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                            
                            <CommandGroup heading="Global Languages">
                                {globalLanguages.map(lang => (
                                    <CommandItem
                                        key={lang.code}
                                        onSelect={() => {
                                            onChange(lang.code);
                                            setOpen(false);
                                        }}
                                        className="hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        <span className="mr-2">{lang.flag}</span>
                                        {lang.name}
                                        <span className="ml-auto text-gray-500 text-xs">{lang.native}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        );
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 max-w-2xl p-0">
                {/* Header */}
                <DialogHeader className="p-4 pb-2 border-b border-gray-200 dark:border-gray-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <Languages className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-gray-900 dark:text-white">Translate Message</DialogTitle>
                            <DialogDescription>
                                Supports 22+ languages including Indian regional languages
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                
                <div className="p-4 space-y-4">
                    {/* Language Selection */}
                    <div className="flex items-center gap-2">
                        <div className="flex-1">
                            <Label className="text-xs text-gray-400 mb-1 block">From</Label>
                            <LanguageSelector 
                                value={sourceLang}
                                onChange={setSourceLang}
                                open={sourceOpen}
                                setOpen={setSourceOpen}
                            />
                        </div>
                        
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={swapLanguages}
                            disabled={sourceLang === 'auto'}
                            className="mt-5 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <ArrowLeftRight className="w-4 h-4" />
                        </Button>
                        
                        <div className="flex-1">
                            <Label className="text-xs text-gray-400 mb-1 block">To</Label>
                            <LanguageSelector 
                                value={targetLang}
                                onChange={setTargetLang}
                                open={targetOpen}
                                setOpen={setTargetOpen}
                                excludeAuto
                            />
                        </div>
                    </div>
                    
                    {/* Source Text */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <Label className="text-xs text-gray-400">Source Text</Label>
                            <span className="text-xs text-gray-500">{charCount}/5000</span>
                        </div>
                        <div className="relative">
                            <Textarea
                                value={sourceText}
                                onChange={(e) => {
                                    setSourceText(e.target.value);
                                    setCharCount(e.target.value.length);
                                }}
                                placeholder="Enter text to translate..."
                                className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 min-h-[120px] text-gray-900 dark:text-white pr-10"
                                maxLength={5000}
                            />
                            {sourceText && (
                                <div className="absolute bottom-2 right-2 flex gap-1">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => speakText(sourceText, sourceLang === 'auto' ? 'en' : sourceLang)}
                                        className="h-7 w-7 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    >
                                        <Volume2 className="w-3 h-3" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                            setSourceText('');
                                            setTranslatedText('');
                                            setCharCount(0);
                                        }}
                                        className="h-7 w-7 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Translate Button */}
                    <Button 
                        onClick={translateText}
                        disabled={loading || !sourceText.trim()}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Translating...
                            </>
                        ) : (
                            <>
                                <Languages className="w-4 h-4 mr-2" />
                                Translate
                            </>
                        )}
                    </Button>
                    
                    {/* Translated Text */}
                    {translatedText && (
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <Label className="text-xs text-gray-400">Translation</Label>
                                <div className="flex gap-1">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => speakText(translatedText, targetLang)}
                                        className="h-6 px-2 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    >
                                        <Volume2 className="w-3 h-3" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={copyTranslation}
                                        className="h-6 px-2 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    >
                                        {copied ? (
                                            <Check className="w-3 h-3 text-green-400" />
                                        ) : (
                                            <Copy className="w-3 h-3" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30">
                                <p className="text-white text-lg">{translatedText}</p>
                            </div>
                        </div>
                    )}
                    
                    {/* Quick Phrases */}
                    <div>
                        <Label className="text-xs text-gray-400 mb-2 block">Quick Phrases</Label>
                        <div className="flex flex-wrap gap-2">
                            {['Hello', 'Thank you', 'Please', 'Good morning', 'How are you?'].map((phrase) => (
                                <Button
                                    key={phrase}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSourceText(phrase);
                                        setCharCount(phrase.length);
                                    }}
                                    className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs"
                                >
                                    {phrase}
                                </Button>
                            ))}
                        </div>
                    </div>
                    
                    {/* History */}
                    {history.length > 0 && (
                        <div>
                            <Label className="text-xs text-gray-400 mb-2 block flex items-center gap-1">
                                <History className="w-3 h-3" />
                                Recent Translations
                            </Label>
                            <ScrollArea className="h-[100px]">
                                <div className="space-y-2">
                                    {history.slice(0, 5).map((item) => (
                                        <div 
                                            key={item.id}
                                            className="p-2 rounded bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 text-xs cursor-pointer hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                                            onClick={() => {
                                                setSourceText(item.source);
                                                setTranslatedText(item.translated);
                                                setSourceLang(item.from);
                                                setTargetLang(item.to);
                                                setCharCount(item.source.length);
                                            }}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="text-[10px]">
                                                    {getLanguage(item.from)?.name} → {getLanguage(item.to)?.name}
                                                </Badge>
                                            </div>
                                            <p className="text-gray-500 dark:text-gray-400 truncate">{item.source}</p>
                                            <p className="text-gray-700 dark:text-gray-200 truncate">{item.translated}</p>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </div>
                
                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700/50 flex justify-between">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-200 dark:border-gray-700">
                        Cancel
                    </Button>
                    <Button 
                        onClick={useTranslation}
                        disabled={!translatedText}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Use Translation
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default TranslateModal;
