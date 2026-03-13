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
              <th style={{ padding: '4px', textAlign: 'left', color: '#e2b04a' }}>Description</th>
              <th style={{ padding: '4px', textAlign: 'right', color: '#e2b04a', width: '75px' }}>Annual Fee</th>
              <th style={{ padding: '4px', textAlign: 'right', color: '#e2b04a', width: '75px' }}>Paid</th>
              <th style={{ padding: '4px', textAlign: 'right', color: '#e2b04a', width: '75px' }}>Outstanding</th>
              <th style={{ padding: '4px', textAlign: 'center', color: '#e2b04a', width: '45px' }}>%</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => {
              const totalPaidForItem = Number(item.totalAmount || 0) - Number(item.balance || 0);
              const pct = Number(item.totalAmount || 0) > 0 ? Math.round((totalPaidForItem / Number(item.totalAmount || 0)) * 100) : 0;
              return (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#16213e' : '#0f3460' }}>
                  <td style={{ padding: '4px', color: '#fff' }}>
                    {item.description}
                    {Number(item.discount || 0) > 0 && <span style={{ fontSize: '7px', color: '#e2b04a', marginLeft: '4px' }}>(Conc: {`\u20b9`}{fmt(item.discount)})</span>}
                  </td>
                  <td style={{ padding: '4px', textAlign: 'right' }}>{fmt(item.totalAmount)}</td>
                  <td style={{ padding: '4px', textAlign: 'right', color: '#e2b04a' }}>{fmt(item.amount)}</td>
                  <td style={{ padding: '4px', textAlign: 'right' }}>{fmt(item.balance)}</td>
                  <td style={{ padding: '4px', textAlign: 'center', color: pct === 100 ? '#4caf50' : pct > 50 ? '#ff9800' : '#f44336', fontWeight: 'bold' }}>{pct}%</td>
                </tr>
              );
            })}
            {totalFine > 0 && (
              <tr style={{ backgroundColor: '#1a1a2e' }}>
                <td colSpan={2} style={{ padding: '4px', color: '#f44336' }}>Late Fine</td>
                <td style={{ padding: '4px', textAlign: 'right', color: '#f44336' }}>+{`\u20b9`}{fmt(totalFine)}</td>
                <td colSpan={2} style={{ padding: '4px' }}></td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid #e2b04a', fontWeight: 'bold', backgroundColor: '#e2b04a', color: '#1a1a2e' }}>
              <td style={{ padding: '5px' }}>{isRefund ? 'Refund' : 'Total'}</td>
              <td style={{ padding: '5px', textAlign: 'right' }}>{fmt(overallTotalAmount)}</td>
              <td style={{ padding: '5px', textAlign: 'right' }}>{`\u20b9`}{fmt(grandTotal)}</td>
              <td style={{ padding: '5px', textAlign: 'right' }}>{fmt(overallBalance)}</td>
              <td style={{ padding: '5px', textAlign: 'center' }}>{overallTotalAmount > 0 ? Math.round((grandTotal / overallTotalAmount) * 100) : 0}%</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* CONDENSED SUMMARY */}
      <div style={{ padding: '4px 15px', display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '8.5px', fontWeight: 'bold' }}>
        <span style={{ color: '#e2b04a' }}>Total: {`\u20b9`}{fmt(overallTotalAmount)}</span>
        <span style={{ color: '#4caf50' }}>Paid: {`\u20b9`}{fmt(grandTotal)}</span>
        {totalDiscount > 0 && <span style={{ color: '#ff9800' }}>Concession: {`\u20b9`}{fmt(totalDiscount)}</span>}
        <span style={{ color: overallBalance > 0 ? '#f44336' : '#4caf50' }}>Due: {`\u20b9`}{fmt(overallBalance)}</span>
      </div>

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
