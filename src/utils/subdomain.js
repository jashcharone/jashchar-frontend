export const getSubdomain = () => {
  const hostname = window.location.hostname;
  
  // Handle localhost (no subdomain)
  if (hostname === 'localhost') return null;
  
  // Handle Vercel preview/deployment domains (e.g., jashchar-frontend.vercel.app)
  if (hostname.endsWith('.vercel.app')) return null;
  
  // Handle Railway domains (e.g., web-production-xxxx.up.railway.app)
  if (hostname.endsWith('.railway.app')) return null;
  
  const parts = hostname.split('.');

  // Ignore infrastructure subdomains used for hosting/app/API
  // Ensures normal app mode on domains like devapi.jashcharerp.com
  const IGNORED_SUBDOMAINS = new Set(['devapi', 'api', 'app', 'admin']);
  if (parts.length >= 3 && IGNORED_SUBDOMAINS.has(parts[0])) {
      return null;
  }
  
  // Handle local development with subdomains (e.g., school1.localhost)
  // Note: You need to configure hosts file for this to work locally
  if (hostname.endsWith('localhost')) {
      if (parts.length === 2) return parts[0];
      return null;
  }
  
  // Handle IP addresses (no subdomain)
  const isIP = /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/.test(hostname);
  if (isIP) return null;

  // Handle Production (e.g., school1.jashcharerp.com)
  // Assuming 2-part TLDs like .co.uk might need more complex logic, 
  // but for .com it's simple.
  // If parts > 2, the first part is likely the subdomain.
  if (parts.length >= 3) {
      const subdomain = parts[0];
      if (subdomain === 'www') return null;
      return subdomain;
  }
  
  return null;
};
// Build: 2026-01-15 01:52:43
