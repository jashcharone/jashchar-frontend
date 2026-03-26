/**
 * Template 16: Vintage Typewriter
 * Typewriter aesthetic, slightly imperfect, retro feel
 * Paper: A5 Landscape | Category: Classic
 */
import React from 'react';
import { format } from 'date-fns';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Template16_VintageTypewriter = ({ receiptData, copyType }) => {
  const {
    student, school, lineItems = [], feeStatement = [],
    totalPaid, totalDiscount, totalFine, grandTotal,
    overallBalance = 0,
    transactionId, receiptDate, paymentMode,
    isRefund, isOriginal, printSettings, sessionName, title = 'FEE RECEIPT'
  } = receiptData;

  const showConcession = totalDiscount > 0;

  return (
    <div style={{ width: '200mm', height: '140mm', boxSizing: 'border-box', pageBreakInside: 'avoid', position: 'relative', backgroundColor: '#f5f0e8', fontFamily: "'Courier New', 'Courier', monospace", color: '#2c2c2c', overflow: 'hidden', padding: '12px 18px' }}>
      
      {/* Paper texture effect */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse at center, transparent 50%, rgba(139,119,101,0.1) 100%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* HEADER */}
        {printSettings?.header_image_url ? (
          <div style={{ marginBottom: '6px' }}><img src={printSettings.header_image_url} alt='Header' style={{ width: '100%', height: 'auto', display: 'block' }} /></div>
        ) : (
          <div style={{ textAlign: 'center', marginBottom: '6px' }}>
            {school?.logo_url && <img src={school.logo_url} alt='Logo' style={{ height: '32px', width: 'auto', marginBottom: '3px', filter: 'grayscale(50%)' }} />}
            <h1 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, letterSpacing: '3px', textTransform: 'uppercase' }}>{school?.name || '-'}</h1>
            {school?.address && <p style={{ fontSize: '8px', margin: '2px 0 0', color: '#777' }}>{school.address}</p>}
            <div style={{ margin: '3px auto', width: '60%', borderBottom: '1px dashed #999' }} />
          </div>
        )}

        {/* TITLE */}
        <div style={{ textAlign: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', letterSpacing: '6px', textTransform: 'uppercase', fontWeight: 'bold' }}>~ {title} ~</span>
          <div style={{ fontSize: '7px', color: '#888', marginTop: '1px' }}>[{copyType}]{!isOriginal ? ' -- DUPLICATE --' : ''}</div>
        </div>

        {/* STUDENT INFO - Typewriter line style */}
        <div style={{ fontSize: '8.5px', marginBottom: '5px', lineHeight: '1.7' }}>
          <div>Name ........... : <strong>{student?.full_name || '-'}</strong>    Father&apos;s Name .. : {student?.father_name || '-'}</div>
          <div>Class .......... : {student?.class?.name || '-'}{student?.section?.name ? ` (${student.section.name})` : ''}    Enroll ID ......... : {student?.enrollment_id || '-'}    Date : {receiptDate ? format(new Date(receiptDate), 'dd-MM-yyyy') : '-'}</div>
          <div>Receipt No ..... : {transactionId?.split('/').pop() || '-'}    Mode ........... : {paymentMode || 'Cash'}    Session : {sessionName || '-'}</div>
        </div>

        <div style={{ borderTop: '1px solid #999', borderBottom: '1px solid #999', marginBottom: '4px', fontFamily: "'Courier New', monospace" }}>
          {lineItems.map((item, idx) => (
            <div key={idx} style={{ fontSize: '9px', padding: '2px 0', display: 'flex' }}>
              <span style={{ whiteSpace: 'nowrap' }}>{String(idx + 1).padStart(2, '0')}. {item.description}</span>
              <span style={{ flex: 1, borderBottom: '1px dotted #aaa', margin: '0 4px 3px' }}></span>
              <span style={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>Rs.{fmt(item.amount)}</span>
            </div>
          ))}
          {totalDiscount > 0 && (
            <div style={{ fontSize: '8px', padding: '2px 0', display: 'flex', color: '#2e7d32' }}>
              <span style={{ whiteSpace: 'nowrap' }}>    Less: Concession</span>
              <span style={{ flex: 1, borderBottom: '1px dotted #aaa', margin: '0 4px 3px' }}></span>
              <span style={{ whiteSpace: 'nowrap' }}>(-){fmt(totalDiscount)}</span>
            </div>
          )}
          {totalFine > 0 && (
            <div style={{ fontSize: '8px', padding: '2px 0', display: 'flex', color: '#b00' }}>
              <span style={{ whiteSpace: 'nowrap' }}>    Add: Late Fine</span>
              <span style={{ flex: 1, borderBottom: '1px dotted #aaa', margin: '0 4px 3px' }}></span>
              <span style={{ whiteSpace: 'nowrap' }}>(+){fmt(totalFine)}</span>
            </div>
          )}
          <div style={{ borderTop: '1px dashed #aaa', fontSize: '9px', fontWeight: 'bold', padding: '3px 0', display: 'flex' }}>
            <span style={{ whiteSpace: 'nowrap' }}>{isRefund ? 'TOTAL REFUND' : 'TOTAL RECEIVED'}</span>
            <span style={{ flex: 1, borderBottom: '1px dotted #aaa', margin: '0 4px 3px' }}></span>
            <span style={{ whiteSpace: 'nowrap', fontSize: '10px' }}>Rs.{fmt(grandTotal)}</span>
          </div>
          {overallBalance > 0 && (
            <div style={{ fontSize: '8px', padding: '2px 0', display: 'flex', color: '#b00' }}>
              <span style={{ whiteSpace: 'nowrap' }}>    Balance Remaining</span>
              <span style={{ flex: 1, borderBottom: '1px dotted #aaa', margin: '0 4px 3px' }}></span>
              <span style={{ whiteSpace: 'nowrap' }}>Rs.{fmt(overallBalance)}</span>
            </div>
          )}
        </div>

        {/* TYPEWRITER NOTE */}
        <div style={{ fontSize: '8px', marginBottom: '4px', fontFamily: "'Courier New', monospace", fontStyle: 'italic' }}>
          ** This receipt is valid for Rs.{fmt(grandTotal)} only **
        </div>

        {/* FOOTER */}
        {printSettings?.footer_content ? (
          <div style={{ lineHeight: '1.4' }} className="receipt-footer-content" dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.5px', color: '#888', marginTop: '5px' }}>
            <span>-- Computer generated receipt --</span>
            <span>_ _ _ _ _ _ _ _ _ _ _ _ _</span>
          </div>
        )}
      </div>

      {isRefund && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', opacity: 0.07, pointerEvents: 'none' }}>
          <span style={{ fontSize: '48px', fontWeight: 'bold', color: 'red' }}>REFUND</span>
        </div>
      )}
    </div>
  );
};

Template16_VintageTypewriter.templateMeta = {
  key: 'vintage_typewriter',
  name: 'Vintage Typewriter',
  description: 'Retro typewriter aesthetic with monospace font and dotted lines',
  category: 'classic',
  paperSize: 'A5',
  orientation: 'landscape',
  features: ['fee_statement', 'copy_type', 'typewriter_font', 'dotted_lines'],
  colorScheme: { primary: '#2c2c2c', secondary: '#f5f0e8', accent: '#999999' }
};

export default Template16_VintageTypewriter;
