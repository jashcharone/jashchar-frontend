// Organization Switcher for Testing Multi-Tenant White-Label Themes
// ಪ್ರತಿ Organization ಗೆ different branding test ಮಾಡಲು
// ⚠️ DEVELOPMENT ONLY - Will NOT render in production

import React, { useState } from 'react';
import { useOrganization } from '../contexts/OrganizationContext';

const OrgSwitcher = () => {
  const { orgConfig, loading } = useOrganization();
  const [isOpen, setIsOpen] = useState(false);

  // 🔒 SECURITY: Only show in development (localhost)
  // Production URLs (jashcharerp.com or any other domain) will NOT show this button
  const isDevelopment = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname === '';
  
  // Hide in production completely
  if (!isDevelopment) {
    return null;
  }

  const testOrganizations = [
    { slug: 'demo', name: 'Demo School', color: '#1976d2' },
    { slug: 'abc', name: 'ABC School', color: '#4CAF50' },
    { slug: 'xyz', name: 'XYZ College', color: '#9C27B0' }
  ];

  const handleOrgSwitch = (slug) => {
    // Development mode: Use localStorage
    localStorage.setItem('dev-org-slug', slug);
    
    // Reload page to apply new organization
    window.location.reload();
  };

  if (loading) {
    return (
      <div style={{ padding: '10px', color: '#666' }}>
        Loading organization...
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          backgroundColor: orgConfig?.branding?.primaryColor || '#1976d2',
          color: '#fff',
          border: 'none',
          padding: '12px 20px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <span>🏫</span>
        <span>{orgConfig?.name || 'Select Organization'}</span>
        <span>{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* Organization List */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '60px',
          right: '0',
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          minWidth: '250px',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#f5f5f5',
            borderBottom: '1px solid #ddd',
            fontWeight: '600',
            fontSize: '14px',
            color: '#333'
          }}>
            Switch Organization (Dev Mode)
          </div>
          
          {testOrganizations.map((org) => (
            <button
              key={org.slug}
              onClick={() => handleOrgSwitch(org.slug)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                backgroundColor: orgConfig?.slug === org.slug ? '#f0f0f0' : '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'background-color 0.2s',
                borderBottom: '1px solid #f0f0f0'
              }}
              onMouseEnter={(e) => {
                if (orgConfig?.slug !== org.slug) {
                  e.currentTarget.style.backgroundColor = '#f9f9f9';
                }
              }}
              onMouseLeave={(e) => {
                if (orgConfig?.slug !== org.slug) {
                  e.currentTarget.style.backgroundColor = '#fff';
                }
              }}
            >
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: org.color
              }} />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#333'
                }}>
                  {org.name}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#666'
                }}>
                  {org.slug}.jashcharerp.com
                </div>
              </div>
              {orgConfig?.slug === org.slug && (
                <span style={{ color: org.color, fontSize: '16px' }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrgSwitcher;
