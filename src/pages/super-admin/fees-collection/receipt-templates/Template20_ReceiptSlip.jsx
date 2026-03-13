/**
 * Template 20: Receipt Slip
 * Thermal printer style (80mm width) — compact, no colors
 * Paper: 80mm × variable | Category: Minimal
 */
import React from 'react';
import { format } from 'date-fns';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Template20_ReceiptSlip = ({ receiptData, copyType }) => {
  const {
    student, school, lineItems = [], feeStatement = [],
    totalPaid, totalDiscount, totalFine, grandTotal,
    overallBalance = 0,
    transactionId, receiptDate, paymentMode,
    isRefund, isOriginal, printSettings, sessionName, title = 'FEE RECEIPT'
  } = receiptData;

  const showConcession = totalDiscount > 0;
  const dashes = '- '.repeat(24);

  return (
    <div style={{ width: '80mm', minHeight: '140mm', boxSizing: 'border-box', pageBreakInside: 'avoid', position: 'relative', backgroundColor: '#fff', fontFamily: "'Courier New', monospace", color: '#000', overflow: 'hidden', padding: '6px 8px', fontSize: '9px' }}>
      
      {/* HEADER */}
      {printSettings?.header_image_url ? (
        <div style={{ textAlign: 'center', marginBottom: '4px' }}><img src={printSettings.header_image_url} alt='Header' style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }} /></div>
      ) : (
        <div style={{ textAlign: 'center', marginBottom: '4px' }}>
          {school?.logo_url && <img src={school.logo_url} alt='Logo' style={{ height: '28px', width: 'auto', marginBottom: '2px' }} />}
          <div style={{ fontSize: '11px', fontWeight: 'bold' }}>{school?.name || '-'}</div>
          {school?.address && <div style={{ fontSize: '7px', color: '#555' }}>{school.address}</div>}
        </div>
      )}

      <div style={{ textAlign: 'center', fontSize: '8px', letterSpacing: '1px' }}>{dashes}</div>
      <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '10px', margin: '2px 0' }}>{title}</div>
      <div style={{ textAlign: 'center', fontSize: '7px', color: '#888' }}>{copyType}{!isOriginal ? ' / DUPLICATE' : ''}</div>
      <div style={{ textAlign: 'center', fontSize: '8px', letterSpacing: '1px' }}>{dashes}</div>

      {/* STUDENT INFO */}
      <div style={{ margin: '4px 0', lineHeight: '1.6' }}>
        <div>Name  : {student?.full_name || '-'}</div>
        <div>Class : {student?.class?.name || '-'}{student?.section?.name ? ` (${student.section.name})` : ''}</div>
        <div>Adm#  : {student?.school_code || '-'}</div>
        <div>Rcpt# : {transactionId?.split('/').pop() || '-'}</div>
        <div>Date  : {receiptDate ? format(new Date(receiptDate), 'dd-MM-yyyy') : '-'}</div>
        <div>Mode  : {paymentMode || 'Cash'}</div>
      </div>

      <div style={{ fontSize: '8px', letterSpacing: '1px' }}>{dashes}</div>

      {/* ITEMS */}
      {lineItems.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{idx + 1}. {item.description}</span>
          <span style={{ marginLeft: '4px', fontWeight: 'bold' }}>{fmt(item.amount)}</span>
        </div>
      ))}

      <div style={{ fontSize: '8px', letterSpacing: '1px' }}>{dashes}</div>

      {/* TOTAL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11px', margin: '2px 0' }}>
        <span>{isRefund ? 'REFUND' : 'TOTAL'}</span>
        <span>Rs.{fmt(grandTotal)}</span>
      </div>
      {overallBalance > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#666' }}>
          <span>BALANCE</span>
          <span>Rs.{fmt(overallBalance)}</span>
        </div>
      )}

      <div style={{ fontSize: '8px', letterSpacing: '1px' }}>{dashes}</div>

      {/* FEE STATEMENT */}
      {feeStatement.length > 0 && (
        <div style={{ marginBottom: '3px' }}>
          <div style={{ fontSize: '8px', fontWeight: 'bold', marginBottom: '1px' }}>FEE SUMMARY:</div>
          {feeStatement.map((fee, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px' }}>
              <span>{fee.name}</span>
              <span>{fmt(fee.paid)}/{fmt(fee.amount)}</span>
            </div>
          ))}
          <div style={{ fontSize: '8px', letterSpacing: '1px' }}>{dashes}</div>
        </div>
      )}

      {/* FOOTER */}
      {printSettings?.footer_content ? (
        <div style={{ lineHeight: '1.4', fontSize: '8px' }} className="receipt-footer-content" dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} />
      ) : (
        <div style={{ textAlign: 'center', fontSize: '7px', color: '#888', marginTop: '4px' }}>
          <div>Thank you!</div>
          <div>Computer Generated Receipt</div>
          <div>{transactionId || '-'}</div>
        </div>
      )}

      {isRefund && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', opacity: 0.06, pointerEvents: 'none' }}>
          <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'red' }}>REFUND</span>
        </div>
      )}
    </div>
  );
};

Template20_ReceiptSlip.templateMeta = {
  key: 'receipt_slip',
  name: 'Receipt Slip (Thermal)',
  description: 'Thermal printer style — 80mm compact receipt slip',
  category: 'minimal',
  paperSize: '80mm',
  orientation: 'portrait',
  features: ['fee_statement', 'copy_type', 'thermal', 'compact'],
  colorScheme: { primary: '#000000', secondary: '#ffffff', accent: '#888888' }
};

export default Template20_ReceiptSlip;
