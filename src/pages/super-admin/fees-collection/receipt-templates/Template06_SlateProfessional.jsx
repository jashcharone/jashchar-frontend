/**
 * Template 06: Slate Professional
 * Charcoal & teal, modern professional - clean & simple
 * Paper: A5 Landscape | Category: Professional
 */
import React from 'react';
import { format } from 'date-fns';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Template06_SlateProfessional = ({ receiptData, copyType }) => {
  const {
    student, school, lineItems = [],
    totalPaid, totalDiscount, totalFine, grandTotal,
    overallTotalAmount = 0, overallBalance = 0,
    transactionId, receiptDate, paymentMode,
    extraInfo, isRefund, isOriginal, printSettings,
    sessionName, title = 'FEE RECEIPT'
  } = receiptData;

  const showConcession = totalDiscount > 0;

  return (
    <div style={{ width: '200mm', height: '140mm', boxSizing: 'border-box', pageBreakInside: 'avoid', position: 'relative', backgroundColor: '#fff', color: '#000', fontFamily: 'Segoe UI, Arial, sans-serif', overflow: 'hidden' }}>
      
      {/* HEADER - Charcoal with teal accent */}
      {printSettings?.header_image_url ? (
        <div style={{ width: '100%' }}><img src={printSettings.header_image_url} alt='Header' style={{ width: '100%', height: 'auto', display: 'block' }} /></div>
      ) : (
        <div style={{ backgroundColor: '#2d3436', padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {school?.logo_url && <img src={school.logo_url} alt='Logo' style={{ height: '45px', width: 'auto' }} />}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '15px', fontWeight: '600', color: '#fff', margin: 0 }}>{school?.name || '-'}</h1>
            {school?.address && <p style={{ fontSize: '9px', color: '#b2bec3', margin: '2px 0 0' }}>{school.address}</p>}
          </div>
          <div style={{ textAlign: 'right', fontSize: '8px', color: '#b2bec3' }}>
            {!isOriginal && <div style={{ color: '#ff7675', fontWeight: 'bold' }}>REPRINT</div>}
            <div>{copyType}</div>
          </div>
        </div>
      )}

      {/* TITLE BAR - Teal */}
      <div style={{ backgroundColor: '#00b894', padding: '5px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', letterSpacing: '3px' }}>{title}</span>
        <div style={{ fontSize: '9px', color: '#fff' }}>
          <span style={{ marginRight: '15px' }}>Receipt: <strong>{transactionId?.split('/').pop() || '-'}</strong></span>
          <span>TXN: <strong>{transactionId || '-'}</strong></span>
        </div>
      </div>

      {/* STUDENT INFO - Horizontal flex with teal labels */}
      <div style={{ padding: '5px 15px', borderBottom: '1px solid #dfe6e9', fontSize: '9px', display: 'flex', flexWrap: 'wrap', gap: '4px 15px' }}>
        <span><span style={{ color: '#00b894', fontWeight: 'bold' }}>Student:</span> <strong>{student?.full_name || '-'}</strong></span>
        <span><span style={{ color: '#00b894', fontWeight: 'bold' }}>Father:</span> {student?.father_name || '-'}</span>
        <span><span style={{ color: '#00b894', fontWeight: 'bold' }}>Adm#:</span> {student?.school_code || student?.admission_no || '-'}</span>
        <span><span style={{ color: '#00b894', fontWeight: 'bold' }}>Class:</span> {student?.class?.name || '-'}{student?.section?.name ? `(${student.section.name})` : ''}</span>
        <span><span style={{ color: '#00b894', fontWeight: 'bold' }}>Date:</span> {receiptDate ? format(new Date(receiptDate), 'dd MMM yyyy') : '-'}</span>
        <span><span style={{ color: '#00b894', fontWeight: 'bold' }}>Mode:</span> {paymentMode || 'Cash'}</span>
        <span><span style={{ color: '#00b894', fontWeight: 'bold' }}>Session:</span> {sessionName || '-'}</span>
      </div>

      {/* FEE TABLE */}
      <div style={{ padding: '6px 15px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
          <thead>
            <tr style={{ backgroundColor: '#00b894', color: '#fff' }}>
              <th style={{ border: '1px solid #00a884', padding: '4px 5px', textAlign: 'center', width: '30px' }}>S.No</th>
              <th style={{ border: '1px solid #00a884', padding: '4px 5px', textAlign: 'left' }}>Particulars</th>
              <th style={{ border: '1px solid #00a884', padding: '4px 5px', textAlign: 'right', width: '75px' }}>Total</th>
              {showConcession && <th style={{ border: '1px solid #00a884', padding: '4px 5px', textAlign: 'right', width: '65px' }}>Concession</th>}
              <th style={{ border: '1px solid #00a884', padding: '4px 5px', textAlign: 'right', width: '65px' }}>Paid</th>
              <th style={{ border: '1px solid #00a884', padding: '4px 5px', textAlign: 'right', width: '60px' }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => (
              <tr key={idx}>
                <td style={{ border: '1px solid #dfe6e9', padding: '4px 5px', textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ border: '1px solid #dfe6e9', padding: '4px 5px', fontWeight: '500' }}>{item.description}</td>
                <td style={{ border: '1px solid #dfe6e9', padding: '4px 5px', textAlign: 'right' }}>{fmt(item.totalAmount)}</td>
                {showConcession && <td style={{ border: '1px solid #dfe6e9', padding: '4px 5px', textAlign: 'right' }}>{Number(item.discount || 0) > 0 ? fmt(item.discount) : ''}</td>}
                <td style={{ border: '1px solid #dfe6e9', padding: '4px 5px', textAlign: 'right' }}>{fmt(item.amount)}</td>
                <td style={{ border: '1px solid #dfe6e9', padding: '4px 5px', textAlign: 'right' }}>{fmt(item.balance)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 'bold', backgroundColor: '#2d3436', color: '#00b894' }}>
              <td style={{ border: '1px solid #636e72', padding: '5px' }}></td>
              <td style={{ border: '1px solid #636e72', padding: '5px', textAlign: 'right' }}>{isRefund ? 'Total Refund' : 'Total'}</td>
              <td style={{ border: '1px solid #636e72', padding: '5px', textAlign: 'right' }}>{fmt(overallTotalAmount)}</td>
              {showConcession && <td style={{ border: '1px solid #636e72', padding: '5px', textAlign: 'right' }}>{fmt(totalDiscount)}</td>}
              <td style={{ border: '1px solid #636e72', padding: '5px', textAlign: 'right', color: '#fff', fontSize: '10px' }}>₹{fmt(grandTotal)}</td>
              <td style={{ border: '1px solid #636e72', padding: '5px', textAlign: 'right' }}>{fmt(overallBalance)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* NO FEE STATEMENT - keeps ultra clean */}

      {/* FOOTER */}
      {printSettings?.footer_content ? (
        <div style={{ padding: '8px 15px', borderTop: '1px solid #dfe6e9', color: '#333', lineHeight: '1.4' }} className="receipt-footer-content" dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} />
      ) : (
        <div style={{ padding: '8px 15px', borderTop: '2px solid #2d3436', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'center', fontSize: '9px', color: '#2d3436' }}>
            <div style={{ borderTop: '1px solid #00b894', width: '120px', marginTop: '15px', paddingTop: '3px' }}>Authorized Signatory</div>
          </div>
        </div>
      )}

      {isRefund && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', opacity: 0.08, pointerEvents: 'none' }}>
          <span style={{ fontSize: '48px', fontWeight: 'bold', color: 'red' }}>REFUND</span>
        </div>
      )}
    </div>
  );
};

Template06_SlateProfessional.templateMeta = {
  key: 'slate_professional',
  name: 'Slate Professional',
  description: 'Charcoal & teal, ultra-clean modern professional with zero decoration',
  category: 'professional',
  paperSize: 'A5',
  orientation: 'landscape',
  features: ['copy_type', 'clean_design'],
  colorScheme: { primary: '#2d3436', secondary: '#00b894', accent: '#dfe6e9' }
};

export default Template06_SlateProfessional;
