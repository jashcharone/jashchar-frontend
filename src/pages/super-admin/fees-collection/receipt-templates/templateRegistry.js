/**
 * Template Registry
 * =================
 * Central registry mapping template_key → React component
 * All templates must be registered here to be available in the system
 */

import { lazy } from 'react';

// Lazy-load templates for code splitting
const templates = {
  // Professional (01-06)
  classic_blue: lazy(() => import('./Template01_ClassicBlue')),
  corporate_navy: lazy(() => import('./Template02_CorporateNavy')),
  executive_green: lazy(() => import('./Template03_ExecutiveGreen')),
  maroon_heritage: lazy(() => import('./Template04_MaroonHeritage')),
  royal_purple: lazy(() => import('./Template05_RoyalPurple')),
  slate_professional: lazy(() => import('./Template06_SlateProfessional')),
  // Modern (07-12)
  modern_minimal: lazy(() => import('./Template07_ModernMinimal')),
  gradient_sunset: lazy(() => import('./Template08_GradientSunset')),
  dark_elegance: lazy(() => import('./Template09_DarkElegance')),
  material_card: lazy(() => import('./Template10_MaterialCard')),
  glassmorphism: lazy(() => import('./Template11_Glassmorphism')),
  neo_brutalist: lazy(() => import('./Template12_NeoBrutalist')),
  // Classic (13-18)
  traditional_serif: lazy(() => import('./Template13_TraditionalSerif')),
  certificate_style: lazy(() => import('./Template14_CertificateStyle')),
  ledger_book: lazy(() => import('./Template15_LedgerBook')),
  vintage_typewriter: lazy(() => import('./Template16_VintageTypewriter')),
  stamp_paper: lazy(() => import('./Template17_StampPaper')),
  colonial_elegant: lazy(() => import('./Template18_ColonialElegant')),
  // Minimal (19-22)
  ultra_simple: lazy(() => import('./Template19_UltraSimple')),
  receipt_slip: lazy(() => import('./Template20_ReceiptSlip')),
  half_page_a4: lazy(() => import('./Template21_HalfPageA4')),
  postcard_mini: lazy(() => import('./Template22_PostcardMini')),
  // Creative (23-27)
  colorful_bands: lazy(() => import('./Template23_ColorfulBands')),
  school_crest: lazy(() => import('./Template24_SchoolCrest')),
  infographic: lazy(() => import('./Template25_Infographic')),
  bilingual_hindi: lazy(() => import('./Template26_BilingualHindi')),
  bilingual_kannada: lazy(() => import('./Template27_BilingualKannada')),
  // Formal (28-30)
  government_official: lazy(() => import('./Template28_GovernmentOfficial')),
  university_detailed: lazy(() => import('./Template29_UniversityDetailed')),
  digital_modern: lazy(() => import('./Template30_DigitalModern')),
};

// Template metadata (static, no lazy loading needed)
const templateMeta = {
  classic_blue: {
    key: 'classic_blue', name: 'Classic Blue',
    description: 'Default template with blue header bar, yellow highlights, and fee statement',
    category: 'professional', paperSize: 'A5', orientation: 'landscape', thumbnail: null,
    features: ['fee_statement', 'amount_in_words', 'copy_type', 'custom_header', 'custom_footer'],
    colorScheme: { primary: '#1a237e', secondary: '#4caf50', accent: '#ffeb3b' }
  },
  corporate_navy: {
    key: 'corporate_navy', name: 'Corporate Navy',
    description: 'Navy gradient with silver title bar and serif font',
    category: 'professional', paperSize: 'A5', orientation: 'landscape', thumbnail: null,
    features: ['fee_statement', 'amount_in_words', 'copy_type', 'custom_header', 'custom_footer'],
    colorScheme: { primary: '#0d1b2a', secondary: '#1b2838', accent: '#c0c0c0' }
  },
  executive_green: {
    key: 'executive_green', name: 'Executive Green',
    description: 'Forest green with gold accents and dual signature lines',
    category: 'professional', paperSize: 'A5', orientation: 'landscape', thumbnail: null,
    features: ['fee_statement', 'amount_in_words', 'copy_type', 'custom_header', 'custom_footer'],
    colorScheme: { primary: '#1b5e20', secondary: '#2e7d32', accent: '#c5a528' }
  },
  maroon_heritage: {
    key: 'maroon_heritage', name: 'Maroon Heritage',
    description: 'Maroon and cream with double border and corner ornaments',
    category: 'professional', paperSize: 'A5', orientation: 'landscape', thumbnail: null,
    features: ['fee_statement', 'amount_in_words', 'copy_type', 'custom_header', 'custom_footer'],
    colorScheme: { primary: '#5a0000', secondary: '#800000', accent: '#fdf5e6' }
  },
  royal_purple: {
    key: 'royal_purple', name: 'Royal Purple',
    description: 'Purple gradient with silver accents and pill badges',
    category: 'professional', paperSize: 'A5', orientation: 'landscape', thumbnail: null,
    features: ['fee_statement', 'amount_in_words', 'copy_type', 'custom_header', 'custom_footer'],
    colorScheme: { primary: '#4a148c', secondary: '#6a1b9a', accent: '#c0c0c0' }
  },
  slate_professional: {
    key: 'slate_professional', name: 'Slate Professional',
    description: 'Charcoal and teal clean design without fee statement',
    category: 'professional', paperSize: 'A5', orientation: 'landscape', thumbnail: null,
    features: ['amount_in_words', 'copy_type', 'custom_header', 'custom_footer'],
    colorScheme: { primary: '#37474f', secondary: '#546e7a', accent: '#00897b' }
  },
  modern_minimal: {
    key: 'modern_minimal', name: 'Modern Minimal',
    description: 'Black and white Stripe-style invoice with borderless rows',
    category: 'modern', paperSize: 'A5', orientation: 'landscape', thumbnail: null,
    features: ['fee_statement', 'amount_in_words', 'copy_type', 'custom_header', 'custom_footer'],
    colorScheme: { primary: '#000000', secondary: '#333333', accent: '#ffffff' }
  },
  gradient_sunset: {
    key: 'gradient_sunset', name: 'Gradient Sunset',
    description: 'Warm gradient with rounded corners and vibrant colors',
    category: 'modern', paperSize: 'A5', orientation: 'landscape', thumbnail: null,
    features: ['fee_statement', 'amount_in_words', 'copy_type', 'custom_header', 'custom_footer'],
    colorScheme: { primary: '#ff6b6b', secondary: '#ffa726', accent: '#ffffff' }
  },
  dark_elegance: {
    key: 'dark_elegance', name: 'Dark Elegance',
    description: 'Dark background with gold accents and print-safe invert',
    category: 'modern', paperSize: 'A5', orientation: 'landscape', thumbnail: null,
    features: ['fee_statement', 'amount_in_words', 'copy_type', 'custom_header', 'custom_footer'],
    colorScheme: { primary: '#1a1a2e', secondary: '#16213e', accent: '#d4af37' }
  },
  material_card: {
    key: 'material_card', name: 'Material Card',
    description: 'Google Material Design 3 with chips, cards, and shadows',
    category: 'modern', paperSize: 'A5', orientation: 'landscape', thumbnail: null,
    features: ['fee_statement', 'amount_in_words', 'copy_type', 'custom_header', 'custom_footer'],
    colorScheme: { primary: '#1976d2', secondary: '#1565c0', accent: '#e3f2fd' }
  },
  glassmorphism: {
    key: 'glassmorphism', name: 'Glassmorphism',
    description: 'Frosted glass effect with gradient background and print fallback',
    category: 'modern', paperSize: 'A5', orientation: 'landscape', thumbnail: null,
    features: ['fee_statement', 'amount_in_words', 'copy_type', 'custom_header', 'custom_footer'],
    colorScheme: { primary: '#667eea', secondary: '#764ba2', accent: 'rgba(255,255,255,0.25)' }
  },
  neo_brutalist: {
    key: 'neo_brutalist', name: 'Neo Brutalist',
    description: 'Bold borders, yellow highlights, offset shadows, ALL CAPS monospace',
    category: 'modern', paperSize: 'A5', orientation: 'landscape', thumbnail: null,
    features: ['fee_statement', 'amount_in_words', 'copy_type', 'custom_header', 'custom_footer'],
    colorScheme: { primary: '#000000', secondary: '#ffe066', accent: '#ff6b6b' }
  },
  traditional_serif: {
    key: 'traditional_serif', name: 'Traditional Serif',
    description: 'Newspaper-style serif fonts with warm brown tones',
    category: 'classic', paperSize: 'A5', orientation: 'landscape', thumbnail: null,
    features: ['fee_statement', 'amount_in_words', 'copy_type', 'custom_header', 'custom_footer'],
    colorScheme: { primary: '#5c2d0e', secondary: '#8d6e4c', accent: '#faf3e0' }
  },
  certificate_style: {
    key: 'certificate_style', name: 'Certificate Style',
    description: 'Ornamental border with gold accents and corner decorations',
    category: 'classic', paperSize: 'A5', orientation: 'landscape', thumbnail: null,
    features: ['fee_statement', 'amount_in_words', 'copy_type', 'custom_header', 'custom_footer'],
    colorScheme: { primary: '#1a1a1a', secondary: '#daa520', accent: '#f5f0e1' }
  },
  ledger_book: {
    key: 'ledger_book', name: 'Ledger Book',
    description: 'Accounting ledger style with ruled lines and DR/CR columns',
    category: 'classic', paperSize: 'A5', orientation: 'landscape', thumbnail: null,
    features: ['fee_statement', 'amount_in_words', 'copy_type', 'custom_header', 'custom_footer'],
    colorScheme: { primary: '#1a3c34', secondary: '#2e7d32', accent: '#f5f0e1' }
  },
  vintage_typewriter: {
    key: 'vintage_typewriter', name: 'Vintage Typewriter',
    description: 'Courier font with dotted lines and retro paper texture',
    category: 'classic', paperSize: 'A5', orientation: 'landscape', thumbnail: null,
    features: ['fee_statement', 'amount_in_words', 'copy_type', 'custom_header', 'custom_footer'],
    colorScheme: { primary: '#2c2c2c', secondary: '#555555', accent: '#f4eed7' }
  },
  stamp_paper: {
    key: 'stamp_paper', name: 'Stamp Paper',
    description: 'Green tint official stamp paper look with watermark text',
    category: 'classic', paperSize: 'A5', orientation: 'landscape', thumbnail: null,
    features: ['fee_statement', 'amount_in_words', 'copy_type', 'custom_header', 'custom_footer'],
    colorScheme: { primary: '#2e5930', secondary: '#4a7c4f', accent: '#e8f0e0' }
  },
  colonial_elegant: {
    key: 'colonial_elegant', name: 'Colonial Elegant',
    description: 'Victorian burgundy with gold filigree and Palatino serif',
    category: 'classic', paperSize: 'A5', orientation: 'landscape', thumbnail: null,
    features: ['fee_statement', 'amount_in_words', 'copy_type', 'custom_header', 'custom_footer'],
    colorScheme: { primary: '#4a0020', secondary: '#6b0030', accent: '#c5a55a' }
  },
  ultra_simple: {
    key: 'ultra_simple', name: 'Ultra Simple',
    description: 'Bare minimum design with no borders or colors, pure readability',
    category: 'minimal', paperSize: 'A5', orientation: 'landscape', thumbnail: null,
    features: ['fee_statement', 'amount_in_words', 'copy_type'],
    colorScheme: { primary: '#000000', secondary: '#666666', accent: '#ffffff' }
  },
  receipt_slip: {
    key: 'receipt_slip', name: 'Receipt Slip',
    description: 'Thermal 80mm width with Courier monospace and dashed separators',
    category: 'minimal', paperSize: '80mm', orientation: 'portrait', thumbnail: null,
    features: ['amount_in_words', 'copy_type'],
    colorScheme: { primary: '#000000', secondary: '#333333', accent: '#ffffff' }
  },
  half_page_a4: {
    key: 'half_page_a4', name: 'Half Page A4',
    description: 'A4 half page standard school format with grid layout',
    category: 'minimal', paperSize: 'A4-half', orientation: 'landscape', thumbnail: null,
    features: ['fee_statement', 'amount_in_words', 'copy_type', 'custom_header', 'custom_footer'],
    colorScheme: { primary: '#1a237e', secondary: '#283593', accent: '#e8eaf6' }
  },
  postcard_mini: {
    key: 'postcard_mini', name: 'Postcard Mini',
    description: 'A6 compact minimal postcard style receipt',
    category: 'minimal', paperSize: 'A6', orientation: 'landscape', thumbnail: null,
    features: ['amount_in_words', 'copy_type'],
    colorScheme: { primary: '#37474f', secondary: '#607d8b', accent: '#eceff1' }
  },
  colorful_bands: {
    key: 'colorful_bands', name: 'Colorful Bands',
    description: 'Rainbow 6-color bands with playful school design',
    category: 'creative', paperSize: 'A5', orientation: 'landscape', thumbnail: null,
    features: ['fee_statement', 'amount_in_words', 'copy_type', 'custom_header', 'custom_footer'],
    colorScheme: { primary: '#e53935', secondary: '#1e88e5', accent: '#43a047' }
  },
  school_crest: {
    key: 'school_crest', name: 'School Crest',
    description: 'Centered circular crest with navy and gold academic feel',
    category: 'creative', paperSize: 'A5', orientation: 'landscape', thumbnail: null,
    features: ['fee_statement', 'amount_in_words', 'copy_type', 'custom_header', 'custom_footer'],
    colorScheme: { primary: '#0d1b2a', secondary: '#1b2838', accent: '#d4a437' }
  },
  infographic: {
    key: 'infographic', name: 'Infographic',
    description: 'Progress bars, stat cards with emojis, and status badges',
    category: 'creative', paperSize: 'A5', orientation: 'landscape', thumbnail: null,
    features: ['fee_statement', 'amount_in_words', 'copy_type', 'custom_header', 'custom_footer'],
    colorScheme: { primary: '#6366f1', secondary: '#8b5cf6', accent: '#f0fdf4' }
  },
  bilingual_hindi: {
    key: 'bilingual_hindi', name: 'Bilingual Hindi',
    description: 'Hindi+English with tricolor bands (saffron/white/green)',
    category: 'creative', paperSize: 'A5', orientation: 'landscape', thumbnail: null,
    features: ['fee_statement', 'amount_in_words', 'copy_type', 'custom_header', 'custom_footer', 'bilingual'],
    colorScheme: { primary: '#1a237e', secondary: '#ff6f00', accent: '#138808' }
  },
  bilingual_kannada: {
    key: 'bilingual_kannada', name: 'Bilingual Kannada',
    description: 'Kannada+English with crimson and gold gradient bands',
    category: 'creative', paperSize: 'A5', orientation: 'landscape', thumbnail: null,
    features: ['fee_statement', 'amount_in_words', 'copy_type', 'custom_header', 'custom_footer', 'bilingual'],
    colorScheme: { primary: '#b71c1c', secondary: '#c17900', accent: '#fff8e1' }
  },
  government_official: {
    key: 'government_official', name: 'Government Official',
    description: 'Full A4 government form style with multi-signature and office use section',
    category: 'formal', paperSize: 'A4', orientation: 'portrait', thumbnail: null,
    features: ['fee_statement', 'amount_in_words', 'copy_type', 'custom_header', 'custom_footer', 'multi_signature', 'office_use'],
    colorScheme: { primary: '#2e3b4e', secondary: '#4a5568', accent: '#f0f0f0' }
  },
  university_detailed: {
    key: 'university_detailed', name: 'University Detailed',
    description: 'A4 challan format with 3 copies on one page — Student, Office, Bank',
    category: 'formal', paperSize: 'A4', orientation: 'portrait', thumbnail: null,
    features: ['amount_in_words', 'copy_type', 'custom_header', 'custom_footer', 'three_copy_challan'],
    colorScheme: { primary: '#1b3a5c', secondary: '#e0e0e0', accent: '#333333' }
  },
  digital_modern: {
    key: 'digital_modern', name: 'Digital Modern',
    description: 'Digital-first receipt with QR placeholder and verification code',
    category: 'formal', paperSize: 'A5', orientation: 'landscape', thumbnail: null,
    features: ['fee_statement', 'amount_in_words', 'copy_type', 'custom_header', 'custom_footer', 'qr_code', 'verification_code', 'digital_seal'],
    colorScheme: { primary: '#0ea5e9', secondary: '#0f172a', accent: '#f8fafc' }
  },
};

// Categories for filtering
export const TEMPLATE_CATEGORIES = [
  { key: 'all', label: 'All Templates', icon: '📋' },
  { key: 'professional', label: 'Professional', icon: '💼' },
  { key: 'modern', label: 'Modern', icon: '✨' },
  { key: 'classic', label: 'Classic', icon: '🏛️' },
  { key: 'minimal', label: 'Minimal', icon: '◻️' },
  { key: 'creative', label: 'Creative', icon: '🎨' },
  { key: 'formal', label: 'Formal', icon: '📜' }
];

/**
 * Get template component by key
 * @param {string} key - Template key (e.g., 'classic_blue')
 * @returns {React.LazyExoticComponent|null}
 */
export const getTemplate = (key) => {
  return templates[key] || templates['classic_blue'];
};

/**
 * Get template metadata by key
 * @param {string} key - Template key
 * @returns {object|null}
 */
export const getTemplateMeta = (key) => {
  return templateMeta[key] || null;
};

/**
 * Get all registered template metadata
 * @returns {object[]}
 */
export const getAllTemplates = () => {
  return Object.values(templateMeta);
};

/**
 * Get templates filtered by category
 * @param {string} category - Category key (e.g., 'professional')
 * @returns {object[]}
 */
export const getTemplatesByCategory = (category) => {
  if (category === 'all') return getAllTemplates();
  return Object.values(templateMeta).filter(t => t.category === category);
};

/**
 * Check if a template key is valid
 * @param {string} key
 * @returns {boolean}
 */
export const isValidTemplate = (key) => {
  return key in templates;
};

/**
 * Default template key
 */
export const DEFAULT_TEMPLATE_KEY = 'classic_blue';

export default templates;
