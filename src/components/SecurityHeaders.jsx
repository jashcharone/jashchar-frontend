import React from 'react';
import { Helmet } from 'react-helmet';

const SecurityHeaders = () => {
  return (
    <Helmet>
      {/* 
        Content Security Policy (CSP) 
        - Restricts sources for scripts, styles, images, etc.
        - 'unsafe-inline' and 'unsafe-eval' are often needed for React/Vite dev mode.
      */}
      <meta
        http-equiv="Content-Security-Policy"
        content="
          default-src 'self'; 
          script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
          style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
          font-src 'self' https://fonts.gstatic.com data:; 
          img-src 'self' data: blob: https: http:; 
          connect-src 'self' http://localhost:* https://*.supabase.co wss://*.supabase.co https://fexjccrkgaeafyimpobv.supabase.co https://*.jashchar.in https://*.edunexttechnologies.com https://api.jashcharerp.com https://devapi.jashcharerp.com https://*.up.railway.app https://api.postalpincode.in ws: wss:; 
          frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com; 
          worker-src 'self' blob:; 
          child-src 'self' blob:; 
          media-src 'self' blob: https: http:;
        "
      />

      {/* X-Frame-Options: Prevent Clickjacking (allow from same origin for iframes) */}
      {/* <meta http-equiv="X-Frame-Options" content="SAMEORIGIN" /> */}

      {/* X-Content-Type-Options: Prevent MIME type sniffing */}
      <meta http-equiv="X-Content-Type-Options" content="nosniff" />

      {/* Referrer Policy: Control how much referrer info is sent */}
      <meta name="referrer" content="strict-origin-when-cross-origin" />

      {/* Permissions Policy: Restrict browser features */}
      <meta 
        http-equiv="Permissions-Policy" 
        content="camera=(), microphone=(), geolocation=(), payment=()" 
      />
    </Helmet>
  );
};

export default SecurityHeaders;
