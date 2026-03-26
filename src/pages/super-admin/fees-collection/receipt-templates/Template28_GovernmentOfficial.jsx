/**
 * Template 28: Government Official
 * =================================
 * Full A4 portrait, government form style, multi-signature
 * Paper: A4 Portrait | Category: Formal
 */

import React from 'react';
import { format } from 'date-fns';

const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (num === 0) return 'Zero';
  if (num < 0) return 'Minus ' + numberToWords(-num);
  let words = '';
  if (Math.floor(num / 10000000) > 0) { words += numberToWords(Math.floor(num / 10000000)) + ' Crore '; num %= 10000000; }
  if (Math.floor(num / 100000) > 0) { words += numberToWords(Math.floor(num / 100000)) + ' Lakh '; num %= 100000; }
  if (Math.floor(num / 1000) > 0) { words += numberToWords(Math.floor(num / 1000)) + ' Thousand '; num %= 1000; }
  if (Math.floor(num / 100) > 0) { words += numberToWords(Math.floor(num / 100)) + ' Hundred '; num %= 100; }
  if (num > 0) { if (num < 20) words += ones[num]; else words += tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : ''); }
  return words.trim();
};

const fmt = (n) => (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Template28_GovernmentOfficial = ({ receiptData, copyType }) => {
  const {
    student, school, lineItems = [], feeStatement = [],
    totalPaid, totalDiscount, totalFine, grandTotal,
    overallTotalAmount, overallBalance,
    transactionId, receiptDate, paymentMode,
    extraInfo, isRefund, isOriginal, printSettings, sessionName, title
  } = receiptData;

  const formattedDate = receiptDate ? format(new Date(receiptDate), 'dd/MM/yyyy') : '';
  const showFeeStatement = printSettings?.showFeeStatement !== false && feeStatement.length > 0;
  const formNo = transactionId ? transactionId.slice(-6).toUpperCase() : '------';

  const cellStyle = { border: '1px solid #333', padding: '4px 8px', fontSize: '10px', fontFamily: 'Arial, sans-serif' };
  const labelCell = { ...cellStyle, backgroundColor: '#f0f0f0', fontWeight: 'bold', width: '140px' };
  const headerCell = { ...cellStyle, backgroundColor: '#2e3b4e', color: '#fff', fontWeight: 'bold', textAlign: 'center' };

  return (
    <div style={{ width: '210mm', minHeight: '297mm', padding: '12mm 15mm', fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#1a1a1a', position: 'relative', boxSizing: 'border-box' }}>

      {/* Watermark */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-35deg)', fontSize: '60px', color: 'rgba(0,0,0,0.04)', fontWeight: 'bold', whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 0 }}>
        {school?.name || 'OFFICIAL RECEIPT'}
      </div>

      {/* Refund Watermark */}
      {isRefund && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-25deg)', fontSize: '72px', color: 'rgba(220,0,0,0.12)', fontWeight: 'bold', zIndex: 1 }}>REFUND</div>
      )}

      {/* Form number & copy type */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', position: 'relative', zIndex: 2 }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold' }}>Form No. {formNo}</div>
        <div style={{ fontSize: '9px', padding: '2px 10px', backgroundColor: '#2e3b4e', color: '#fff', borderRadius: '2px' }}>
          {copyType || (isOriginal ? 'ORIGINAL' : 'DUPLICATE')}
        </div>
      </div>

      {/* Header */}
      <div style={{ border: '2px solid #333', padding: '10px', textAlign: 'center', marginBottom: '10px', position: 'relative', zIndex: 2 }}>
        {printSettings?.showCustomHeader && printSettings?.headerImage ? (
          <img src={printSettings.headerImage} alt="Header" style={{ maxWidth: '100%', maxHeight: '80px' }} />
        ) : (
          <>
            <div style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>{school?.name || 'SCHOOL NAME'}</div>
            {school?.address && <div style={{ fontSize: '10px', marginTop: '3px' }}>{school.address}</div>}
            {(school?.contact_number || school?.contact_email) && (
              <div style={{ fontSize: '9px', marginTop: '2px' }}>
                {school.contact_number && `Phone: ${school.contact_number}`}{school.contact_number && school.contact_email && ' | '}{school.contact_email && `Email: ${school.contact_email}`}
              </div>
            )}
          </>
        )}
        <div style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '6px', padding: '3px', backgroundColor: '#2e3b4e', color: '#fff', letterSpacing: '3px' }}>
          {title || 'FEE RECEIPT'}
        </div>
      </div>

      {/* Receipt Info Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', position: 'relative', zIndex: 2 }}>
        <div><strong>Receipt No:</strong> {transactionId || 'N/A'}</div>
        <div><strong>Date:</strong> {formattedDate}</div>
        <div><strong>Session:</strong> {sessionName || 'N/A'}</div>
      </div>

      {/* Student Info - Form Style Boxes */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', position: 'relative', zIndex: 2 }}>
        <tbody>
          <tr>
            <td style={labelCell}>Student Name</td>
            <td style={cellStyle}>{student?.full_name || 'N/A'}</td>
            <td style={labelCell}>Enroll ID.</td>
            <td style={cellStyle}>{student?.enrollment_id || student?.enrollment_id || 'N/A'}</td>
          </tr>
          <tr>
            <td style={labelCell}>Father's Name</td>
            <td style={cellStyle}>{student?.father_name || 'N/A'}</td>
            <td style={labelCell}>Class / Section</td>
            <td style={cellStyle}>{student?.class?.name || ''} {student?.section?.name ? `(${student.section.name})` : ''}</td>
          </tr>
          <tr>
            <td style={labelCell}>Payment Mode</td>
            <td style={cellStyle}>{paymentMode || 'N/A'}</td>
            <td style={labelCell}>Reference</td>
            <td style={cellStyle}>{extraInfo?.bankRefNo || extraInfo?.chequeNo || '—'}</td>
          </tr>
        </tbody>
      </table>

      {/* Fee Details Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', position: 'relative', zIndex: 2 }}>
        <thead>
          <tr>
            <th style={{ ...headerCell, width: '30px' }}>S.No.</th>
            <th style={headerCell}>Head of Account / Particulars</th>
            <th style={{ ...headerCell, width: '100px' }}>Demand Raised (₹)</th>
            <th style={{ ...headerCell, width: '100px' }}>Amount Deposited (₹)</th>
            <th style={{ ...headerCell, width: '100px' }}>Balance Outstanding (₹)</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item, i) => (
            <React.Fragment key={i}>
              <tr>
                <td style={{ ...cellStyle, textAlign: 'center' }}>{i + 1}</td>
                <td style={cellStyle}>{item.description}</td>
                <td style={{ ...cellStyle, textAlign: 'right' }}>{fmt(item.totalAmount)}</td>
                <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 'bold' }}>{fmt(item.amount)}</td>
                <td style={{ ...cellStyle, textAlign: 'right' }}>{fmt(item.balance)}</td>
              </tr>
              {Number(item.discount || 0) > 0 && (
                <tr>
                  <td style={cellStyle}></td>
                  <td style={{ ...cellStyle, fontStyle: 'italic', color: '#555', paddingLeft: '24px' }}>Less: Scholarship / Concession</td>
                  <td style={{ ...cellStyle, textAlign: 'right', color: '#2e7d32' }}>(-) {fmt(item.discount)}</td>
                  <td style={cellStyle}></td>
                  <td style={cellStyle}></td>
                </tr>
              )}
            </React.Fragment>
          ))}
          {totalFine > 0 && (
            <tr>
              <td style={cellStyle}></td>
              <td style={{ ...cellStyle, fontStyle: 'italic', color: '#c62828' }}>Add: Late Fee / Penalty Charges</td>
              <td style={{ ...cellStyle, textAlign: 'right', color: '#c62828' }}>(+) {fmt(totalFine)}</td>
              <td style={cellStyle}></td>
              <td style={cellStyle}></td>
            </tr>
          )}
          <tr style={{ backgroundColor: '#e8e8e8' }}>
            <td colSpan={2} style={{ ...cellStyle, textAlign: 'right', fontWeight: 'bold', fontSize: '11px' }}>GRAND TOTAL</td>
            <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 'bold' }}>{fmt(overallTotalAmount)}</td>
            <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 'bold', fontSize: '11px' }}>{fmt(grandTotal || totalPaid)}</td>
            <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 'bold', color: overallBalance > 0 ? '#c62828' : '#2e7d32' }}>{fmt(overallBalance)}</td>
          </tr>
        </tbody>
      </table>

      {/* Amount in Words */}
      <div style={{ border: '1px solid #333', padding: '6px 10px', marginBottom: '10px', backgroundColor: '#f8f8f8', position: 'relative', zIndex: 2 }}>
        <strong>Amount in Words:</strong> Rupees {numberToWords(Math.round(grandTotal || totalPaid))} Only
      </div>

      {/* Budget Statement */}
      {showFeeStatement && (
        <div style={{ marginBottom: '10px', position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', padding: '3px 8px', backgroundColor: '#2e3b4e', color: '#fff' }}>
            BUDGET STATEMENT — {sessionName || 'Academic Year'}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...headerCell, backgroundColor: '#4a5568' }}>Head of Account</th>
                <th style={{ ...headerCell, backgroundColor: '#4a5568', width: '85px' }}>Annual Assessment</th>
                <th style={{ ...headerCell, backgroundColor: '#4a5568', width: '85px' }}>Collected to Date</th>
                <th style={{ ...headerCell, backgroundColor: '#4a5568', width: '85px' }}>This Receipt</th>
                <th style={{ ...headerCell, backgroundColor: '#4a5568', width: '85px' }}>Remaining</th>
              </tr>
            </thead>
            <tbody>
              {feeStatement.map((f, i) => {
                const thisReceipt = lineItems.find(l => l.description === f.name);
                return (
                  <tr key={i}>
                    <td style={cellStyle}>{f.name}</td>
                    <td style={{ ...cellStyle, textAlign: 'right' }}>{fmt(f.amount)}</td>
                    <td style={{ ...cellStyle, textAlign: 'right' }}>{fmt(f.paid)}</td>
                    <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 'bold', color: '#2e3b4e' }}>{thisReceipt ? fmt(thisReceipt.amount) : '—'}</td>
                    <td style={{ ...cellStyle, textAlign: 'right', color: Number(f.balance || 0) > 0 ? '#c62828' : '#2e7d32', fontWeight: 'bold' }}>{fmt(f.balance)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Office Use Only */}
      <div style={{ border: '1px dashed #999', padding: '8px', marginBottom: '15px', position: 'relative', zIndex: 2 }}>
        <div style={{ fontSize: '9px', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase', color: '#666' }}>For Office Use Only</div>
        <div style={{ display: 'flex', gap: '30px', fontSize: '9px' }}>
          <div>Verified By: ______________________</div>
          <div>Date: _______________</div>
          <div>Stamp: </div>
        </div>
      </div>

      {/* Signatures */}
      {printSettings?.showCustomFooter && printSettings?.footerImage ? (
        <img src={printSettings.footerImage} alt="Footer" style={{ maxWidth: '100%', maxHeight: '60px' }} />
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', position: 'relative', zIndex: 2 }}>
          <div style={{ textAlign: 'center', width: '25%' }}>
            <div style={{ borderTop: '1px solid #333', paddingTop: '4px', fontSize: '9px', fontWeight: 'bold' }}>Cashier</div>
          </div>
          <div style={{ textAlign: 'center', width: '25%' }}>
            <div style={{ borderTop: '1px solid #333', paddingTop: '4px', fontSize: '9px', fontWeight: 'bold' }}>Accountant</div>
          </div>
          <div style={{ textAlign: 'center', width: '25%' }}>
            <div style={{ borderTop: '1px solid #333', paddingTop: '4px', fontSize: '9px', fontWeight: 'bold' }}>Principal / HM</div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ fontSize: '7px', color: '#888', textAlign: 'center', marginTop: '10px', borderTop: '1px solid #ddd', paddingTop: '4px', position: 'relative', zIndex: 2 }}>
        This is a computer-generated receipt. Subject to realization of cheque/DD. Fees once paid are non-refundable unless specified.
      </div>
    </div>
  );
};

Template28_GovernmentOfficial.templateMeta = {
  key: 'government_official',
  name: 'Government Official',
  description: 'Full A4 government form style with multi-signature and office use section',
  category: 'formal',
  paperSize: 'A4',
  orientation: 'portrait',
  thumbnail: null,
  features: ['fee_statement', 'amount_in_words', 'copy_type', 'custom_header', 'custom_footer', 'multi_signature', 'office_use'],
  colorScheme: { primary: '#2e3b4e', secondary: '#4a5568', accent: '#f0f0f0' }
};

export default Template28_GovernmentOfficial;
