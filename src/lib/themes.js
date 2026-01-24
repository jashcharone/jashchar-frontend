export const calculateContrastRatio = (hex1, hex2) => {
    const getLuminance = (hex) => {
      const rgb = parseInt(hex.slice(1), 16); 
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >>  8) & 0xff;
      const b = (rgb >>  0) & 0xff;
      const [lr, lg, lb] = [r, g, b].map(c => {
          c /= 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
    };
  
    const l1 = getLuminance(hex1);
    const l2 = getLuminance(hex2);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    return ratio.toFixed(2);
  };
  
  export const checkAccessibility = (colors) => {
      const bgFg = calculateContrastRatio(colors.background, colors.foreground);
      const primaryFg = calculateContrastRatio(colors.primary, colors.primaryForeground || '#ffffff');
      const sidebarBgFg = calculateContrastRatio(colors.sidebarBackground, colors.sidebarForeground);
      
      let status = 'Good';
      let details = [];
      
      if (bgFg < 4.5) { status = 'Poor'; details.push('Low background contrast'); }
      if (primaryFg < 3) { details.push('Low primary contrast'); } 
      
      return { ratio: bgFg, status, details };
  };
  
  const createTheme = (name, category, mode, colors) => ({
      name,
      category,
      mode,
      colors: {
          ...colors,
          primaryForeground: colors.primaryForeground || '#ffffff',
          sidebarPrimaryForeground: colors.sidebarPrimaryForeground || '#ffffff',
          sidebarAccentForeground: colors.sidebarAccentForeground || colors.sidebarForeground,
      }
  });

export const premiumThemes = [
    // --- PROFESSIONAL ---
    createTheme('Enterprise Blue', 'Professional', 'light', {
        primary: '#2563eb', secondary: '#f1f5f9', background: '#ffffff', card: '#ffffff', foreground: '#0f172a',
        sidebarBackground: '#1e293b', sidebarHeader: '#0f172a', sidebarForeground: '#e2e8f0', sidebarPrimary: '#3b82f6', sidebarAccent: '#334155', sidebarBorder: '#334155', sidebarMutedForeground: '#94a3b8'
    }),
    createTheme('Corporate Slate', 'Professional', 'light', {
        primary: '#475569', secondary: '#f8fafc', background: '#f8fafc', card: '#ffffff', foreground: '#1e293b',
        sidebarBackground: '#ffffff', sidebarHeader: '#f1f5f9', sidebarForeground: '#475569', sidebarPrimary: '#1e293b', sidebarAccent: '#f1f5f9', sidebarBorder: '#e2e8f0', sidebarMutedForeground: '#94a3b8'
    }),
    createTheme('Executive Gray', 'Professional', 'dark', {
        primary: '#94a3b8', secondary: '#1e293b', background: '#0f172a', card: '#1e293b', foreground: '#f8fafc',
        sidebarBackground: '#020617', sidebarHeader: '#0f172a', sidebarForeground: '#cbd5e1', sidebarPrimary: '#94a3b8', sidebarAccent: '#1e293b', sidebarBorder: '#1e293b', sidebarMutedForeground: '#64748b'
    }),
    createTheme('Modern Teal', 'Professional', 'light', {
        primary: '#0d9488', secondary: '#f0fdfa', background: '#ffffff', card: '#ffffff', foreground: '#134e4a',
        sidebarBackground: '#115e59', sidebarHeader: '#0f766e', sidebarForeground: '#ccfbf1', sidebarPrimary: '#2dd4bf', sidebarAccent: '#134e4a', sidebarBorder: '#134e4a', sidebarMutedForeground: '#99f6e4'
    }),
    createTheme('Trust Navy', 'Professional', 'light', {
        primary: '#1e3a8a', secondary: '#eff6ff', background: '#f8fafc', card: '#ffffff', foreground: '#172554',
        sidebarBackground: '#172554', sidebarHeader: '#1e3a8a', sidebarForeground: '#bfdbfe', sidebarPrimary: '#60a5fa', sidebarAccent: '#1e3a8a', sidebarBorder: '#1e40af', sidebarMutedForeground: '#93c5fd'
    }),
    createTheme('Finance Green', 'Professional', 'light', {
        primary: '#15803d', secondary: '#f0fdfa', background: '#ffffff', card: '#ffffff', foreground: '#14532d',
        sidebarBackground: '#14532d', sidebarHeader: '#166534', sidebarForeground: '#dcfce7', sidebarPrimary: '#22c55e', sidebarAccent: '#166534', sidebarBorder: '#166534', sidebarMutedForeground: '#86efac'
    }),
    createTheme('Legal Crimson', 'Professional', 'light', {
        primary: '#9f1239', secondary: '#fff1f2', background: '#fff1f2', card: '#ffffff', foreground: '#881337',
        sidebarBackground: '#881337', sidebarHeader: '#9f1239', sidebarForeground: '#fecdd3', sidebarPrimary: '#fb7185', sidebarAccent: '#9f1239', sidebarBorder: '#9f1239', sidebarMutedForeground: '#fda4af'
    }),
    createTheme('Consultant Beige', 'Professional', 'light', {
        primary: '#a16207', secondary: '#fefce8', background: '#fffbeb', card: '#ffffff', foreground: '#713f12',
        sidebarBackground: '#451a03', sidebarHeader: '#78350f', sidebarForeground: '#fef3c7', sidebarPrimary: '#f59e0b', sidebarAccent: '#78350f', sidebarBorder: '#78350f', sidebarMutedForeground: '#fde68a'
    }),

    // --- GLASSMORPHISM ---
    createTheme('Frosty Sky', 'Glassmorphism', 'light', {
        primary: '#0ea5e9', secondary: 'rgba(224, 242, 254, 0.5)', background: '#f0f9ff', card: 'rgba(255, 255, 255, 0.7)', foreground: '#0c4a6e',
        sidebarBackground: 'rgba(255, 255, 255, 0.6)', sidebarHeader: 'rgba(255, 255, 255, 0.8)', sidebarForeground: '#0369a1', sidebarPrimary: '#0ea5e9', sidebarAccent: 'rgba(14, 165, 233, 0.1)', sidebarBorder: 'rgba(186, 230, 253, 0.5)', sidebarMutedForeground: '#7dd3fc'
    }),
    createTheme('Glassy Purple', 'Glassmorphism', 'dark', {
        primary: '#a855f7', secondary: 'rgba(88, 28, 135, 0.5)', background: '#2e1065', card: 'rgba(46, 16, 101, 0.6)', foreground: '#faf5ff',
        sidebarBackground: 'rgba(19, 7, 46, 0.6)', sidebarHeader: 'rgba(88, 28, 135, 0.4)', sidebarForeground: '#e9d5ff', sidebarPrimary: '#d8b4fe', sidebarAccent: 'rgba(168, 85, 247, 0.2)', sidebarBorder: 'rgba(168, 85, 247, 0.2)', sidebarMutedForeground: '#c084fc'
    }),
    createTheme('Crystal Teal', 'Glassmorphism', 'light', {
        primary: '#14b8a6', secondary: 'rgba(204, 251, 241, 0.5)', background: '#f0fdfa', card: 'rgba(255, 255, 255, 0.7)', foreground: '#115e59',
        sidebarBackground: 'rgba(255, 255, 255, 0.5)', sidebarHeader: 'rgba(255, 255, 255, 0.8)', sidebarForeground: '#0f766e', sidebarPrimary: '#14b8a6', sidebarAccent: 'rgba(20, 184, 166, 0.1)', sidebarBorder: 'rgba(153, 246, 228, 0.5)', sidebarMutedForeground: '#5eead4'
    }),
    createTheme('Blur Berry', 'Glassmorphism', 'dark', {
        primary: '#ec4899', secondary: 'rgba(131, 24, 67, 0.5)', background: '#500724', card: 'rgba(80, 7, 36, 0.6)', foreground: '#fdf2f8',
        sidebarBackground: 'rgba(80, 7, 36, 0.5)', sidebarHeader: 'rgba(131, 24, 67, 0.4)', sidebarForeground: '#fbcfe8', sidebarPrimary: '#f472b6', sidebarAccent: 'rgba(236, 72, 153, 0.2)', sidebarBorder: 'rgba(236, 72, 153, 0.2)', sidebarMutedForeground: '#f9a8d4'
    }),
    createTheme('Ice White', 'Glassmorphism', 'light', {
        primary: '#64748b', secondary: 'rgba(241, 245, 249, 0.5)', background: '#f8fafc', card: 'rgba(255, 255, 255, 0.8)', foreground: '#334155',
        sidebarBackground: 'rgba(255, 255, 255, 0.6)', sidebarHeader: 'rgba(255, 255, 255, 0.9)', sidebarForeground: '#475569', sidebarPrimary: '#64748b', sidebarAccent: 'rgba(100, 116, 139, 0.1)', sidebarBorder: 'rgba(203, 213, 225, 0.5)', sidebarMutedForeground: '#94a3b8'
    }),
    createTheme('Glacial Blue', 'Glassmorphism', 'dark', {
        primary: '#60a5fa', secondary: 'rgba(30, 58, 138, 0.5)', background: '#172554', card: 'rgba(23, 37, 84, 0.6)', foreground: '#eff6ff',
        sidebarBackground: 'rgba(23, 37, 84, 0.5)', sidebarHeader: 'rgba(30, 58, 138, 0.4)', sidebarForeground: '#bfdbfe', sidebarPrimary: '#93c5fd', sidebarAccent: 'rgba(96, 165, 250, 0.2)', sidebarBorder: 'rgba(96, 165, 250, 0.2)', sidebarMutedForeground: '#60a5fa'
    }),
    createTheme('Prism Pink', 'Glassmorphism', 'light', {
        primary: '#f43f5e', secondary: 'rgba(255, 228, 230, 0.5)', background: '#fff1f2', card: 'rgba(255, 255, 255, 0.7)', foreground: '#881337',
        sidebarBackground: 'rgba(255, 255, 255, 0.6)', sidebarHeader: 'rgba(255, 255, 255, 0.8)', sidebarForeground: '#be123c', sidebarPrimary: '#f43f5e', sidebarAccent: 'rgba(244, 63, 94, 0.1)', sidebarBorder: 'rgba(253, 164, 175, 0.5)', sidebarMutedForeground: '#fb7185'
    }),
    createTheme('Aero Glass', 'Glassmorphism', 'dark', {
        primary: '#22d3ee', secondary: 'rgba(22, 78, 99, 0.5)', background: '#083344', card: 'rgba(8, 51, 68, 0.6)', foreground: '#ecfeff',
        sidebarBackground: 'rgba(8, 51, 68, 0.5)', sidebarHeader: 'rgba(21, 94, 117, 0.4)', sidebarForeground: '#a5f3fc', sidebarPrimary: '#67e8f9', sidebarAccent: 'rgba(34, 211, 238, 0.2)', sidebarBorder: 'rgba(34, 211, 238, 0.2)', sidebarMutedForeground: '#22d3ee'
    }),

    // --- CLASSY ---
    createTheme('Royal Gold', 'Classy', 'dark', {
        primary: '#eab308', secondary: '#422006', background: '#291503', card: '#422006', foreground: '#fefce8',
        sidebarBackground: '#1c1917', sidebarHeader: '#292524', sidebarForeground: '#fde047', sidebarPrimary: '#eab308', sidebarAccent: '#44403c', sidebarBorder: '#44403c', sidebarMutedForeground: '#a8a29e'
    }),
    createTheme('Vintage Paper', 'Classy', 'light', {
        primary: '#854d0e', secondary: '#fefce8', background: '#fefce8', card: '#ffffff', foreground: '#422006',
        sidebarBackground: '#fef9c3', sidebarHeader: '#fef08a', sidebarForeground: '#854d0e', sidebarPrimary: '#a16207', sidebarAccent: '#fde047', sidebarBorder: '#fde047', sidebarMutedForeground: '#ca8a04'
    }),
    createTheme('Midnight Luxury', 'Classy', 'dark', {
        primary: '#c084fc', secondary: '#3b0764', background: '#0f0518', card: '#2e1065', foreground: '#faf5ff',
        sidebarBackground: '#020617', sidebarHeader: '#0f172a', sidebarForeground: '#e9d5ff', sidebarPrimary: '#d8b4fe', sidebarAccent: '#1e293b', sidebarBorder: '#1e293b', sidebarMutedForeground: '#94a3b8'
    }),
    createTheme('Velvet Red', 'Classy', 'dark', {
        primary: '#f87171', secondary: '#450a0a', background: '#280505', card: '#450a0a', foreground: '#fef2f2',
        sidebarBackground: '#450a0a', sidebarHeader: '#7f1d1d', sidebarForeground: '#fca5a5', sidebarPrimary: '#f87171', sidebarAccent: '#7f1d1d', sidebarBorder: '#7f1d1d', sidebarMutedForeground: '#fecaca'
    }),
    createTheme('Champagne', 'Classy', 'light', {
        primary: '#d97706', secondary: '#fffbeb', background: '#fffbeb', card: '#ffffff', foreground: '#78350f',
        sidebarBackground: '#fff7ed', sidebarHeader: '#ffedd5', sidebarForeground: '#9a3412', sidebarPrimary: '#f97316', sidebarAccent: '#ffedd5', sidebarBorder: '#fed7aa', sidebarMutedForeground: '#fdba74'
    }),
    createTheme('Marble White', 'Classy', 'light', {
        primary: '#475569', secondary: '#f8fafc', background: '#f8fafc', card: '#ffffff', foreground: '#0f172a',
        sidebarBackground: '#f1f5f9', sidebarHeader: '#e2e8f0', sidebarForeground: '#334155', sidebarPrimary: '#475569', sidebarAccent: '#e2e8f0', sidebarBorder: '#cbd5e1', sidebarMutedForeground: '#64748b'
    }),
    createTheme('Oxford Blue', 'Classy', 'dark', {
        primary: '#60a5fa', secondary: '#172554', background: '#0f172a', card: '#1e293b', foreground: '#f8fafc',
        sidebarBackground: '#172554', sidebarHeader: '#1e3a8a', sidebarForeground: '#bfdbfe', sidebarPrimary: '#60a5fa', sidebarAccent: '#1e3a8a', sidebarBorder: '#1e3a8a', sidebarMutedForeground: '#93c5fd'
    }),
    createTheme('Emerald City', 'Classy', 'dark', {
        primary: '#34d399', secondary: '#064e3b', background: '#022c22', card: '#064e3b', foreground: '#ecfdf5',
        sidebarBackground: '#064e3b', sidebarHeader: '#065f46', sidebarForeground: '#6ee7b7', sidebarPrimary: '#34d399', sidebarAccent: '#065f46', sidebarBorder: '#065f46', sidebarMutedForeground: '#a7f3d0'
    }),

    // --- VIBRANT ---
    createTheme('Electric Violet', 'Vibrant', 'dark', {
        primary: '#8b5cf6', secondary: '#2e1065', background: '#1e1b4b', card: '#2e1065', foreground: '#ede9fe',
        sidebarBackground: '#4c1d95', sidebarHeader: '#5b21b6', sidebarForeground: '#ddd6fe', sidebarPrimary: '#a78bfa', sidebarAccent: '#5b21b6', sidebarBorder: '#5b21b6', sidebarMutedForeground: '#c4b5fd'
    }),
    createTheme('Neon Cyber', 'Vibrant', 'dark', {
        primary: '#06b6d4', secondary: '#164e63', background: '#083344', card: '#164e63', foreground: '#ecfeff',
        sidebarBackground: '#082f49', sidebarHeader: '#0c4a6e', sidebarForeground: '#7dd3fc', sidebarPrimary: '#38bdf8', sidebarAccent: '#0c4a6e', sidebarBorder: '#0c4a6e', sidebarMutedForeground: '#bae6fd'
    }),
    createTheme('Sunset Orange', 'Vibrant', 'light', {
        primary: '#ea580c', secondary: '#fff7ed', background: '#fff7ed', card: '#ffffff', foreground: '#7c2d12',
        sidebarBackground: '#c2410c', sidebarHeader: '#ea580c', sidebarForeground: '#ffedd5', sidebarPrimary: '#fb923c', sidebarAccent: '#ea580c', sidebarBorder: '#ea580c', sidebarMutedForeground: '#fdba74'
    }),
    createTheme('Lime Punch', 'Vibrant', 'dark', {
        primary: '#a3e635', secondary: '#365314', background: '#1a2e05', card: '#365314', foreground: '#ecfccb',
        sidebarBackground: '#3f6212', sidebarHeader: '#4d7c0f', sidebarForeground: '#d9f99d', sidebarPrimary: '#bef264', sidebarAccent: '#4d7c0f', sidebarBorder: '#4d7c0f', sidebarMutedForeground: '#ecfccb'
    }),
    createTheme('Hot Pink', 'Vibrant', 'light', {
        primary: '#db2777', secondary: '#fdf2f8', background: '#fdf2f8', card: '#ffffff', foreground: '#831843',
        sidebarBackground: '#be185d', sidebarHeader: '#db2777', sidebarForeground: '#fce7f3', sidebarPrimary: '#f472b6', sidebarAccent: '#db2777', sidebarBorder: '#db2777', sidebarMutedForeground: '#fbcfe8'
    }),
    createTheme('Aqua Marine', 'Vibrant', 'light', {
        primary: '#0891b2', secondary: '#ecfeff', background: '#ecfeff', card: '#ffffff', foreground: '#164e63',
        sidebarBackground: '#0e7490', sidebarHeader: '#155e75', sidebarForeground: '#cffafe', sidebarPrimary: '#22d3ee', sidebarAccent: '#155e75', sidebarBorder: '#155e75', sidebarMutedForeground: '#a5f3fc'
    }),
    createTheme('Solar Yellow', 'Vibrant', 'light', {
        primary: '#ca8a04', secondary: '#fefce8', background: '#fefce8', card: '#ffffff', foreground: '#713f12',
        sidebarBackground: '#a16207', sidebarHeader: '#854d0e', sidebarForeground: '#fef9c3', sidebarPrimary: '#facc15', sidebarAccent: '#854d0e', sidebarBorder: '#854d0e', sidebarMutedForeground: '#fde047'
    }),
    createTheme('Berry Blast', 'Vibrant', 'dark', {
        primary: '#e11d48', secondary: '#881337', background: '#4c0519', card: '#881337', foreground: '#ffe4e6',
        sidebarBackground: '#9f1239', sidebarHeader: '#be123c', sidebarForeground: '#fecdd3', sidebarPrimary: '#fb7185', sidebarAccent: '#be123c', sidebarBorder: '#be123c', sidebarMutedForeground: '#fda4af'
    }),

    // --- DARK ---
    createTheme('Deep Space', 'Dark', 'dark', {
        primary: '#6366f1', secondary: '#1e1b4b', background: '#020617', card: '#1e1b4b', foreground: '#e0e7ff',
        sidebarBackground: '#0f172a', sidebarHeader: '#1e293b', sidebarForeground: '#94a3b8', sidebarPrimary: '#6366f1', sidebarAccent: '#1e293b', sidebarBorder: '#1e293b', sidebarMutedForeground: '#64748b'
    }),
    createTheme('Night Owl', 'Dark', 'dark', {
        primary: '#82aaff', secondary: '#011627', background: '#011627', card: '#0b2942', foreground: '#d6deeb',
        sidebarBackground: '#011627', sidebarHeader: '#0b2942', sidebarForeground: '#5f7e97', sidebarPrimary: '#82aaff', sidebarAccent: '#0b2942', sidebarBorder: '#0b2942', sidebarMutedForeground: '#7e57c2'
    }),
    createTheme('Dracula Inspired', 'Dark', 'dark', {
        primary: '#ff79c6', secondary: '#282a36', background: '#282a36', card: '#44475a', foreground: '#f8f8f2',
        sidebarBackground: '#282a36', sidebarHeader: '#44475a', sidebarForeground: '#6272a4', sidebarPrimary: '#bd93f9', sidebarAccent: '#44475a', sidebarBorder: '#44475a', sidebarMutedForeground: '#f1fa8c'
    }),
    createTheme('Monokai Vivid', 'Dark', 'dark', {
        primary: '#a6e22e', secondary: '#272822', background: '#272822', card: '#3e3d32', foreground: '#f8f8f2',
        sidebarBackground: '#272822', sidebarHeader: '#3e3d32', sidebarForeground: '#75715e', sidebarPrimary: '#f92672', sidebarAccent: '#3e3d32', sidebarBorder: '#3e3d32', sidebarMutedForeground: '#66d9ef'
    }),
    createTheme('Abyss Blue', 'Dark', 'dark', {
        primary: '#38bdf8', secondary: '#0c4a6e', background: '#082f49', card: '#0c4a6e', foreground: '#f0f9ff',
        sidebarBackground: '#0c4a6e', sidebarHeader: '#075985', sidebarForeground: '#bae6fd', sidebarPrimary: '#38bdf8', sidebarAccent: '#075985', sidebarBorder: '#075985', sidebarMutedForeground: '#7dd3fc'
    }),
    createTheme('Charcoal', 'Dark', 'dark', {
        primary: '#9ca3af', secondary: '#374151', background: '#111827', card: '#1f2937', foreground: '#f3f4f6',
        sidebarBackground: '#1f2937', sidebarHeader: '#374151', sidebarForeground: '#9ca3af', sidebarPrimary: '#d1d5db', sidebarAccent: '#374151', sidebarBorder: '#374151', sidebarMutedForeground: '#6b7280'
    }),
    createTheme('Dark Matter', 'Dark', 'dark', {
        primary: '#f472b6', secondary: '#3730a3', background: '#312e81', card: '#3730a3', foreground: '#e0e7ff',
        sidebarBackground: '#1e1b4b', sidebarHeader: '#312e81', sidebarForeground: '#a5b4fc', sidebarPrimary: '#f472b6', sidebarAccent: '#312e81', sidebarBorder: '#312e81', sidebarMutedForeground: '#818cf8'
    }),
    createTheme('Midnight Purple', 'Dark', 'dark', {
        primary: '#c084fc', secondary: '#581c87', background: '#3b0764', card: '#581c87', foreground: '#f3e8ff',
        sidebarBackground: '#2e1065', sidebarHeader: '#581c87', sidebarForeground: '#d8b4fe', sidebarPrimary: '#c084fc', sidebarAccent: '#581c87', sidebarBorder: '#581c87', sidebarMutedForeground: '#a855f7'
    }),

    // --- LIGHT ---
    createTheme('Clean White', 'Light', 'light', {
        primary: '#0f172a', secondary: '#f1f5f9', background: '#ffffff', card: '#ffffff', foreground: '#0f172a',
        sidebarBackground: '#f8fafc', sidebarHeader: '#f1f5f9', sidebarForeground: '#475569', sidebarPrimary: '#0f172a', sidebarAccent: '#e2e8f0', sidebarBorder: '#e2e8f0', sidebarMutedForeground: '#94a3b8'
    }),
    createTheme('Soft Cloud', 'Light', 'light', {
        primary: '#64748b', secondary: '#f8fafc', background: '#f8fafc', card: '#ffffff', foreground: '#334155',
        sidebarBackground: '#ffffff', sidebarHeader: '#f1f5f9', sidebarForeground: '#64748b', sidebarPrimary: '#475569', sidebarAccent: '#f1f5f9', sidebarBorder: '#e2e8f0', sidebarMutedForeground: '#94a3b8'
    }),
    createTheme('Minimal Gray', 'Light', 'light', {
        primary: '#525252', secondary: '#f5f5f5', background: '#fafafa', card: '#ffffff', foreground: '#262626',
        sidebarBackground: '#f5f5f5', sidebarHeader: '#e5e5e5', sidebarForeground: '#525252', sidebarPrimary: '#171717', sidebarAccent: '#e5e5e5', sidebarBorder: '#d4d4d4', sidebarMutedForeground: '#737373'
    }),
    createTheme('Paper White', 'Light', 'light', {
        primary: '#44403c', secondary: '#fafaf9', background: '#fafaf9', card: '#ffffff', foreground: '#1c1917',
        sidebarBackground: '#ffffff', sidebarHeader: '#f5f5f4', sidebarForeground: '#57534e', sidebarPrimary: '#292524', sidebarAccent: '#f5f5f4', sidebarBorder: '#e7e5e4', sidebarMutedForeground: '#a8a29e'
    }),
    createTheme('Morning Mist', 'Light', 'light', {
        primary: '#059669', secondary: '#ecfdf5', background: '#f0fdfa', card: '#ffffff', foreground: '#064e3b',
        sidebarBackground: '#ffffff', sidebarHeader: '#f0fdfa', sidebarForeground: '#059669', sidebarPrimary: '#10b981', sidebarAccent: '#ecfdf5', sidebarBorder: '#ccfbf1', sidebarMutedForeground: '#34d399'
    }),
    createTheme('Lavender Light', 'Light', 'light', {
        primary: '#7c3aed', secondary: '#f5f3ff', background: '#f5f3ff', card: '#ffffff', foreground: '#4c1d95',
        sidebarBackground: '#ffffff', sidebarHeader: '#ede9fe', sidebarForeground: '#7c3aed', sidebarPrimary: '#8b5cf6', sidebarAccent: '#ede9fe', sidebarBorder: '#ddd6fe', sidebarMutedForeground: '#a78bfa'
    }),
    createTheme('Mint Fresh', 'Light', 'light', {
        primary: '#0d9488', secondary: '#f0fdfa', background: '#f0fdfa', card: '#ffffff', foreground: '#134e4a',
        sidebarBackground: '#ffffff', sidebarHeader: '#ccfbf1', sidebarForeground: '#0d9488', sidebarPrimary: '#14b8a6', sidebarAccent: '#ccfbf1', sidebarBorder: '#99f6e4', sidebarMutedForeground: '#5eead4'
    }),
    createTheme('Peach Soft', 'Light', 'light', {
        primary: '#f97316', secondary: '#fff7ed', background: '#fff7ed', card: '#ffffff', foreground: '#7c2d12',
        sidebarBackground: '#ffffff', sidebarHeader: '#ffedd5', sidebarForeground: '#f97316', sidebarPrimary: '#fb923c', sidebarAccent: '#ffedd5', sidebarBorder: '#fed7aa', sidebarMutedForeground: '#fdba74'
    }),
    createTheme('Sky Light', 'Light', 'light', {
        primary: '#0284c7', secondary: '#f0f9ff', background: '#f0f9ff', card: '#ffffff', foreground: '#0c4a6e',
        sidebarBackground: '#ffffff', sidebarHeader: '#e0f2fe', sidebarForeground: '#0284c7', sidebarPrimary: '#0ea5e9', sidebarAccent: '#e0f2fe', sidebarBorder: '#bae6fd', sidebarMutedForeground: '#7dd3fc'
    }),
    createTheme('Creamy Latte', 'Light', 'light', {
        primary: '#a16207', secondary: '#fefce8', background: '#fefce8', card: '#ffffff', foreground: '#422006',
        sidebarBackground: '#ffffff', sidebarHeader: '#fef9c3', sidebarForeground: '#a16207', sidebarPrimary: '#ca8a04', sidebarAccent: '#fef9c3', sidebarBorder: '#fde047', sidebarMutedForeground: '#eab308'
    })
];
