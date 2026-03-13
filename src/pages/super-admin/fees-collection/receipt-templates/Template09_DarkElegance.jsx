/**
 * Template 09: Dark Elegance
 * Dark theme, premium feel — for international schools
 * Paper: A5 Landscape | Category: Modern
 * Note: Inverts to light for print via @media print
 */
import React from 'react';
import { format } from 'date-fns';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Template09_DarkElegance = ({ receiptData, copyType }) => {
  const {
    student, school, lineItems = [], feeStatement = [],
    totalPaid, totalDiscount, totalFine, grandTotal,
    overallTotalAmount = 0, overallBalance = 0,
    transactionId, receiptDate, paymentMode,
    isRefund, isOriginal, printSettings, sessionName, title = 'FEE RECEIPT'
  } = receiptData;

  const showConcession = totalDiscount > 0;

  return (
    <div className="dark-elegance-receipt" style={{ width: '200mm', height: '140mm', boxSizing: 'border-box', pageBreakInside: 'avoid', position: 'relative', backgroundColor: '#1a1a2e', color: '#e0e0e0', fontFamily: "'Segoe UI', sans-serif", overflow: 'hidden' }}>
      
      {/* HEADER */}
      {printSettings?.header_image_url ? (
        <div style={{ width: '100%' }}><img src={printSettings.header_image_url} alt='Header' style={{ width: '100%', height: 'auto', display: 'block' }} /></div>
      ) : (
        <div style={{ padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #e2b04a' }}>
          {school?.logo_url && <img src={school.logo_url} alt='Logo' style={{ height: '50px', width: 'auto', borderRadius: '50%', border: '2px solid #e2b04a' }} />}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 style={{ fontSize: '16px', fontWeight: 'bold', color: '#e2b04a', margin: 0, letterSpacing: '2px' }}>{school?.name || '-'}</h1>
            {school?.address && <p style={{ fontSize: '9px', color: '#888', margin: '2px 0 0' }}>{school.address}</p>}
          </div>
        </div>
      )}

      {/* TITLE */}
      <div style={{ padding: '5px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
        <span style={{ fontSize: '9px', color: '#e2b04a' }}>Receipt: {transactionId || '-'}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#e2b04a', letterSpacing: '3px', border: '1px solid #e2b04a', padding: '2px 15px' }}>{title}</span>
          {!isOriginal && <span style={{ fontSize: '8px', color: '#fff', backgroundColor: '#c62828', padding: '2px 6px', borderRadius: '3px' }}>REPRINT</span>}
          <span style={{ fontSize: '8px', color: '#e2b04a', border: '1px solid #e2b04a', padding: '2px 8px', borderRadius: '3px' }}>{copyType}</span>
        </div>
        <span style={{ fontSize: '9px', color: '#888' }}>{receiptDate ? format(new Date(receiptDate), 'dd MMM yyyy') : '-'}</span>
      </div>

      {/* STUDENT INFO - Dark cards */}
      <div style={{ display: 'flex', padding: '5px 15px', gap: '8px', fontSize: '9px' }}>
        <div style={{ flex: 1, backgroundColor: '#16213e', padding: '5px 8px', borderRadius: '4px', borderLeft: '3px solid #e2b04a' }}>
          <div style={{ marginBottom: '2px' }}>Student: <strong style={{ color: '#fff' }}>{student?.full_name || '-'}</strong></div>
          <div style={{ marginBottom: '2px' }}>Father: {student?.father_name || '-'}</div>
          <div>Adm#: {student?.school_code || '-'}</div>
        </div>
        <div style={{ flex: 1, backgroundColor: '#16213e', padding: '5px 8px', borderRadius: '4px', borderLeft: '3px solid #e2b04a' }}>
          <div style={{ marginBottom: '2px' }}>Class: {student?.class?.name || '-'}{student?.section?.name ? ` (${student.section.name})` : ''}</div>
          <div style={{ marginBottom: '2px' }}>Mode: {paymentMode || 'Cash'}</div>
          <div>Session: {sessionName || '-'}</div>
        </div>
      </div>

      {/* FEE TABLE */}
      <div style={{ padding: '4px 15px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2b04a' }}>
              <th style={{ padding: '4px', textAlign: 'center', color: '#e2b04a', width: '28px' }}>S.No</th>
              <th style={{ padding: '4px', textAlign: 'left', color: '#e2b04a' }}>Particulars</th>
              <th style={{ padding: '4px', textAlign: 'right', color: '#e2b04a', width: '72px' }}>Total</th>
              {showConcession && <th style={{ padding: '4px', textAlign: 'right', color: '#e2b04a', width: '62px' }}>Concession</th>}
              <th style={{ padding: '4px', textAlign: 'right', color: '#e2b04a', width: '62px' }}>Paid</th>
              <th style={{ padding: '4px', textAlign: 'right', color: '#e2b04a', width: '55px' }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => (
              <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#16213e' : '#0f3460' }}>
                <td style={{ padding: '4px', textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ padding: '4px', color: '#fff' }}>{item.description}</td>
                <td style={{ padding: '4px', textAlign: 'right' }}>{fmt(item.totalAmount)}</td>
                {showConcession && <td style={{ padding: '4px', textAlign: 'right' }}>{Number(item.discount || 0) > 0 ? fmt(item.discount) : ''}</td>}
                <td style={{ padding: '4px', textAlign: 'right', color: '#e2b04a' }}>{fmt(item.amount)}</td>
                <td style={{ padding: '4px', textAlign: 'right' }}>{fmt(item.balance)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid #e2b04a', fontWeight: 'bold', backgroundColor: '#e2b04a', color: '#1a1a2e' }}>
              <td style={{ padding: '5px' }}></td>
              <td style={{ padding: '5px', textAlign: 'right' }}>{isRefund ? 'Total Refund' : 'Total'}</td>
              <td style={{ padding: '5px', textAlign: 'right' }}>{fmt(overallTotalAmount)}</td>
              {showConcession && <td style={{ padding: '5px', textAlign: 'right' }}>{fmt(totalDiscount)}</td>}
              <td style={{ padding: '5px', textAlign: 'right', fontSize: '10px' }}>₹{fmt(grandTotal)}</td>
              <td style={{ padding: '5px', textAlign: 'right' }}>{fmt(overallBalance)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* FEE STATEMENT */}
      {feeStatement.length > 0 && (
        <div style={{ padding: '3px 15px' }}>
          <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#e2b04a', marginBottom: '2px' }}>FEE STATEMENT</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.5px' }}>
            <thead><tr style={{ borderBottom: '1px solid #e2b04a' }}><th style={{ padding: '2px 4px', textAlign: 'left', color: '#e2b04a' }}>Fee</th><th style={{ padding: '2px 4px', textAlign: 'right', color: '#e2b04a', width: '65px' }}>Amount</th><th style={{ padding: '2px 4px', textAlign: 'right', color: '#e2b04a', width: '65px' }}>Paid</th><th style={{ padding: '2px 4px', textAlign: 'right', color: '#e2b04a', width: '65px' }}>Balance</th><th style={{ padding: '2px 4px', textAlign: 'center', color: '#e2b04a', width: '50px' }}>Status</th></tr></thead>
            <tbody>
              {feeStatement.map((fee, i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#16213e' : '#0f3460' }}><td style={{ padding: '2px 4px' }}>{fee.name}</td><td style={{ padding: '2px 4px', textAlign: 'right' }}>{fmt(fee.amount)}</td><td style={{ padding: '2px 4px', textAlign: 'right' }}>{fmt(fee.paid)}</td><td style={{ padding: '2px 4px', textAlign: 'right' }}>{fmt(fee.balance)}</td><td style={{ padding: '2px 4px', textAlign: 'center', fontSize: '7px', fontWeight: 'bold', color: fee.status?.toLowerCase() === 'paid' ? '#4caf50' : fee.status?.toLowerCase() === 'partial' ? '#ff9800' : '#f44336' }}>{fee.status}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* FOOTER */}
      {printSettings?.footer_content ? (
        <div style={{ padding: '6px 15px', borderTop: '1px solid #333', color: '#aaa', lineHeight: '1.4' }} className="receipt-footer-content" dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} />
      ) : (
        <div style={{ padding: '4px 15px', borderTop: '1px solid #e2b04a', display: 'flex', justifyContent: 'flex-end', fontSize: '9px', color: '#e2b04a' }}>
          <div style={{ textAlign: 'center' }}><div style={{ borderTop: '1px solid #e2b04a', width: '120px', marginTop: '10px', paddingTop: '2px' }}>Authorized</div></div>
        </div>
      )}

      {isRefund && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', opacity: 0.08, pointerEvents: 'none' }}>
          <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#f44336' }}>REFUND</span>
        </div>
      )}

      {/* Print override — invert to light */}
      <style>{`@media print { .dark-elegance-receipt { background-color: #fff !important; color: #000 !important; } .dark-elegance-receipt div, .dark-elegance-receipt td, .dark-elegance-receipt th { color: #000 !important; background-color: transparent !important; } .dark-elegance-receipt tr:nth-child(even) { background-color: #f5f5f5 !important; } }`}</style>
    </div>
  );
};

Template09_DarkElegance.templateMeta = {
  key: 'dark_elegance',
  name: 'Dark Elegance',
  description: 'Dark theme with gold accents — premium feel for international schools',
  category: 'modern',
  paperSize: 'A5',
  orientation: 'landscape',
  features: ['fee_statement', 'copy_type', 'dark_theme', 'print_invert'],
  colorScheme: { primary: '#1a1a2e', secondary: '#e2b04a', accent: '#16213e' }
};

export default Template09_DarkElegance;
