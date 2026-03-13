/**
 * Template Engine
 * ===============
 * Renders the correct receipt template based on template key
 * Used by PrintReceipt.jsx to dynamically render receipts
 */

import React, { Suspense } from 'react';
import { getTemplate, DEFAULT_TEMPLATE_KEY } from './templateRegistry';

const TemplateEngine = ({ templateKey, receiptData, copyType }) => {
  const key = templateKey || DEFAULT_TEMPLATE_KEY;
  const TemplateComponent = getTemplate(key);

  if (!TemplateComponent) {
    return (
      <div style={{ width: '200mm', height: '140mm', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ccc' }}>
        <p style={{ color: '#c00' }}>Template "{key}" not found. Using default.</p>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div style={{ width: '200mm', height: '140mm', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #ccc' }}>
        <p style={{ color: '#999' }}>Loading template...</p>
      </div>
    }>
      <TemplateComponent receiptData={receiptData} copyType={copyType} />
    </Suspense>
  );
};

export default TemplateEngine;
