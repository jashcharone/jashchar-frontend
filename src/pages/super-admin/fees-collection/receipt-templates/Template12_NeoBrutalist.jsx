/**
 * Template 12: Neo Brutalist
 * Bold, chunky borders, yellow accent, offset shadows, ALL CAPS headers
 * Paper: A5 Landscape | Category: Modern
 */
import React from 'react';
import { format } from 'date-fns';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Template12_NeoBrutalist = ({ receiptData, copyType }) => {
  const {
    student, school, lineItems = [], feeStatement = [],
    totalPaid, totalDiscount, totalFine, grandTotal,
    overallTotalAmount = 0, overallBalance = 0,
    transactionId, receiptDate, paymentMode,
    isRefund, isOriginal, printSettings, sessionName, title = 'FEE RECEIPT'
  } = receiptData;

  const showConcession = totalDiscount > 0;
  const brutBorder = '3px solid #000';
  const shadowBox = { border: brutBorder, boxShadow: '4px 4px 0 #000' };
  const yellowBox = { ...shadowBox, backgroundColor: '#ffe066' };
  const whiteBox = { ...shadowBox, backgroundColor: '#fff' };

  return (
    <div style={{ width: '200mm', height: '140mm', boxSizing: 'border-box', pageBreakInside: 'avoid', position: 'relative', backgroundColor: '#f0f0f0', fontFamily: "'Courier New', monospace", color: '#000', overflow: 'hidden', padding: '8px 12px' }}>
      
      {/* HEADER */}
      {printSettings?.header_image_url ? (
        <div style={{ marginBottom: '6px' }}><img src={printSettings.header_image_url} alt='Header' style={{ width: '100%', height: 'auto', display: 'block', border: brutBorder }} /></div>
      ) : (
        <div style={{ ...yellowBox, padding: '8px 12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {school?.logo_url && (
            <div style={{ border: brutBorder, padding: '3px', backgroundColor: '#fff' }}>
              <img src={school.logo_url} alt='Logo' style={{ height: '36px', width: 'auto', display: 'block' }} />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '16px', fontWeight: '900', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>{school?.name || '-'}</h1>
            {school?.address && <p style={{ fontSize: '8px', margin: '2px 0 0', fontWeight: '700' }}>{school.address}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', fontWeight: '900', textTransform: 'uppercase' }}>{title}</div>
            <div style={{ fontSize: '8px', fontWeight: '700' }}>#{transactionId?.split('/').pop() || '-'}</div>
          </div>
        </div>
      )}

      {/* COPY + REPRINT */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '5px' }}>
        <span style={{ ...shadowBox, backgroundColor: copyType === 'OFFICE COPY' ? '#ff6b6b' : '#ffe066', padding: '2px 10px', fontSize: '8px', fontWeight: '900', textTransform: 'uppercase' }}>{copyType}</span>
        {!isOriginal && <span style={{ ...shadowBox, backgroundColor: '#ff6b6b', color: '#fff', padding: '2px 10px', fontSize: '8px', fontWeight: '900' }}>REPRINT</span>}
        <span style={{ ...whiteBox, padding: '2px 10px', fontSize: '8px', fontWeight: '700' }}>{receiptDate ? format(new Date(receiptDate), 'dd MMM yyyy') : '-'}</span>
        <span style={{ ...whiteBox, padding: '2px 10px', fontSize: '8px', fontWeight: '700' }}>{paymentMode || 'CASH'}</span>
      </div>

      {/* STUDENT - BLOCKY */}
      <div style={{ ...whiteBox, padding: '5px 8px', marginBottom: '5px' }}>
        <table style={{ width: '100%', fontSize: '8.5px', fontWeight: '700' }}>
          <tbody>
            <tr>
              <td style={{ width: '25%' }}>NAME: {student?.full_name || '-'}</td>
              <td style={{ width: '25%' }}>FATHER: {student?.father_name || '-'}</td>
              <td style={{ width: '25%' }}>CLASS: {student?.class?.name || '-'}{student?.section?.name ? ` (${student.section.name})` : ''}</td>
              <td style={{ width: '25%' }}>ADM#: {student?.school_code || '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* FEE TABLE - BRUTAL */}
      <div style={{ ...shadowBox, marginBottom: '5px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px', fontWeight: '700' }}>
          <thead>
            <tr style={{ backgroundColor: '#000', color: '#ffe066' }}>
              <th style={{ padding: '4px 5px', textAlign: 'left', borderRight: '2px solid #ffe066', textTransform: 'uppercase' }}>WHAT</th>
              <th style={{ padding: '4px 5px', textAlign: 'right', width: '120px' }}>HOW MUCH</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '2px solid #000', backgroundColor: idx % 2 === 0 ? '#fff' : '#ffe066' }}>
                <td style={{ padding: '3px 5px', borderRight: '2px solid #000', textTransform: 'uppercase', fontWeight: '700' }}>{item.description}</td>
                <td style={{ padding: '3px 5px', textAlign: 'right', fontWeight: '900' }}>{`\u20b9`}{fmt(item.amount)}</td>
              </tr>
            ))}
            {totalDiscount > 0 && (
              <tr style={{ borderBottom: '2px solid #000', backgroundColor: '#dff0d8' }}>
                <td style={{ padding: '3px 5px', borderRight: '2px solid #000', textTransform: 'uppercase', fontWeight: '700' }}>CONCESSION</td>
                <td style={{ padding: '3px 5px', textAlign: 'right', fontWeight: '900', color: '#27ae60' }}>-{`\u20b9`}{fmt(totalDiscount)}</td>
              </tr>
            )}
            {totalFine > 0 && (
              <tr style={{ borderBottom: '2px solid #000', backgroundColor: '#fcecec' }}>
                <td style={{ padding: '3px 5px', borderRight: '2px solid #000', textTransform: 'uppercase', fontWeight: '700' }}>LATE FINE</td>
                <td style={{ padding: '3px 5px', textAlign: 'right', fontWeight: '900', color: '#cc0000' }}>+{`\u20b9`}{fmt(totalFine)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FEE CHECKLIST + TOTAL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <div>
          {feeStatement.length > 0 && (
            <div style={{ fontSize: '7.5px', fontWeight: '700' }}>
              {feeStatement.map((fee, i) => (
                <div key={i} style={{ marginBottom: '1px' }}>
                  <span style={{ color: fee.status?.toLowerCase() === 'paid' ? '#27ae60' : '#cc0000', fontSize: '9px' }}>
                    {fee.status?.toLowerCase() === 'paid' ? '\u2713' : '\u2717'}
                  </span>{' '}
                  {fee.name.toUpperCase()}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ ...yellowBox, padding: '6px 18px' }}>
          <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>{isRefund ? 'REFUND' : 'TOTAL PAID'}: </span>
          <span style={{ fontSize: '16px', fontWeight: '900' }}>{`\u20b9`}{fmt(grandTotal)}</span>
          {overallBalance > 0 && <span style={{ fontSize: '9px', fontWeight: '900', color: '#cc0000', marginLeft: '8px' }}>BAL: {`\u20b9`}{fmt(overallBalance)}</span>}
        </div>
      </div>

      {/* FOOTER */}
      {printSettings?.footer_content ? (
        <div style={{ padding: '4px 0' }} className="receipt-footer-content" dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} />
      ) : (
        <div style={{ fontSize: '7.5px', fontWeight: '700', textAlign: 'center', textTransform: 'uppercase' }}>
          TXN: {transactionId || '-'} // SESSION: {sessionName || '-'} // COMPUTER GENERATED
        </div>
      )}

      {isRefund && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', opacity: 0.08, pointerEvents: 'none' }}>
          <span style={{ fontSize: '52px', fontWeight: '900', color: 'red', textTransform: 'uppercase' }}>REFUND</span>
        </div>
      )}
    </div>
  );
};

Template12_NeoBrutalist.templateMeta = {
  key: 'neo_brutalist',
  name: 'Neo Brutalist',
  description: 'Bold chunky borders, yellow accents, ALL CAPS, offset shadows',
  category: 'modern',
  paperSize: 'A5',
  orientation: 'landscape',
  features: ['fee_statement', 'copy_type', 'bold_borders', 'brutalist'],
  colorScheme: { primary: '#000000', secondary: '#ffe066', accent: '#ff6b6b' }
};

export default Template12_NeoBrutalist;
