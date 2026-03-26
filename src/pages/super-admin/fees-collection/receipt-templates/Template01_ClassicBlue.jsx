/**
 * Template 01: Classic Blue
 * ========================
 * Current default template with blue header bar
 * Paper: A5 Landscape | Category: Professional
 * 
 * This is a PURE rendering component - receives receiptData and copyType as props
 * NO database calls, NO hooks, NO state - just JSX
 */

import React from 'react';
import { format } from 'date-fns';

// Number to words converter (Indian format)
const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  if (num < 0) return 'Minus ' + numberToWords(-num);
  
  let words = '';
  
  if (Math.floor(num / 10000000) > 0) {
    words += numberToWords(Math.floor(num / 10000000)) + ' Crore ';
    num %= 10000000;
  }
  if (Math.floor(num / 100000) > 0) {
    words += numberToWords(Math.floor(num / 100000)) + ' Lakh ';
    num %= 100000;
  }
  if (Math.floor(num / 1000) > 0) {
    words += numberToWords(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }
  if (Math.floor(num / 100) > 0) {
    words += numberToWords(Math.floor(num / 100)) + ' Hundred ';
    num %= 100;
  }
  if (num > 0) {
    if (num < 20) words += ones[num];
    else words += tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
  }
  
  return words.trim();
};

const Template01_ClassicBlue = ({ receiptData, copyType }) => {
  const {
    student, school, lineItems = [], feeStatement = [],
    totalPaid, totalDiscount, totalFine, grandTotal,
    overallTotalAmount = 0, overallBalance = 0,
    transactionId, receiptDate, paymentMode,
    extraInfo, isRefund, isOriginal, printSettings,
    sessionName, title = 'FEE RECEIPT'
  } = receiptData;

  const amountInWords = numberToWords(Math.floor(grandTotal)) + ' Rupees Only';
  const showConcession = totalDiscount > 0;
  const showPaidTillDate = lineItems.some(item => {
    const c = Number(item.discount || 0);
    const net = Number(item.totalAmount || 0) - c;
    return Math.max(0, net - Number(item.amount || 0) - Number(item.balance || 0)) > 0;
  });
  const receiptNo = transactionId?.substring(0, 8).toUpperCase() || '-';

  return (
    <div style={{ 
      width: '200mm', 
      height: '140mm',
      padding: '0',
      boxSizing: 'border-box',
      pageBreakInside: 'avoid',
      position: 'relative',
      backgroundColor: '#fff',
      color: '#000',
      fontFamily: 'Arial, Helvetica, sans-serif',
      border: '1px solid #333',
      borderRadius: '3px',
      overflow: 'hidden'
    }}>

      {/* ===== HEADER ===== */}
      {printSettings?.header_image_url ? (
        <div style={{ width: '100%' }}>
          <img src={printSettings.header_image_url} alt='Header' style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>
      ) : (
        <div style={{ borderBottom: '2px solid #000', padding: '8px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            {/* Logo */}
            <div style={{ width: '60px', flexShrink: 0 }}>
              {school?.logo_url && <img src={school.logo_url} alt='Logo' style={{ height: '50px', width: 'auto' }} />}
            </div>
            {/* School Name + Address */}
            <div style={{ flex: 1, textAlign: 'center', padding: '0 8px' }}>
              <h1 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', margin: '0', letterSpacing: '1px', lineHeight: '1.2' }}>
                {school?.name || '-'}
              </h1>
              {school?.address && (
                <p style={{ fontSize: '9px', color: '#333', margin: '3px 0 0', lineHeight: '1.3' }}>{school.address}</p>
              )}
              {(school?.contact_number || school?.contact_email) && (
                <p style={{ fontSize: '8px', color: '#555', margin: '2px 0 0' }}>
                  {school?.contact_number && `Ph: ${school.contact_number}`}
                  {school?.contact_number && school?.contact_email && ' | '}
                  {school?.contact_email && `Email: ${school.contact_email}`}
                </p>
              )}
            </div>
            {/* Right space */}
            <div style={{ width: '140px', textAlign: 'right', flexShrink: 0, fontSize: '8px', color: '#333' }}>
            </div>
          </div>
        </div>
      )}

      {/* ===== FEE RECEIPT TITLE ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderBottom: '1px solid #999', backgroundColor: '#1a237e', color: '#fff' }}>
        <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#fff', backgroundColor: '#4caf50', padding: '3px 10px', borderRadius: '3px' }}>Receipt No: {transactionId?.split('/').pop() || receiptNo}</span>
        <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '4px', textTransform: 'uppercase', color: '#fff' }}>{title}</span>
          {!isOriginal && <span style={{ fontSize: '9px', color: '#ffeb3b', fontWeight: 'bold', backgroundColor: '#c62828', padding: '3px 8px', borderRadius: '3px' }}>REPRINT</span>}
          <span style={{ 
            fontSize: '9px', 
            fontWeight: 'bold', 
            color: '#fff', 
            backgroundColor: copyType === 'OFFICE COPY' ? '#d32f2f' : copyType === 'STUDENT COPY' ? '#2196f3' : '#388e3c',
            padding: '3px 8px',
            borderRadius: '3px',
            textTransform: 'uppercase'
          }}>{copyType}</span>
        </div>
        <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#1a237e', backgroundColor: '#ffeb3b', padding: '3px 10px', borderRadius: '3px' }}>Transaction ID: {transactionId || '-'}</span>
      </div>

      {/* ===== STUDENT INFO ===== */}
      <div style={{ display: 'flex', padding: '5px 10px', borderBottom: '1px solid #ccc', fontSize: '9px', gap: '6px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', marginBottom: '2px', backgroundColor: '#fffde7', padding: '3px 4px', borderRadius: '3px', alignItems: 'center' }}>
            <span style={{ width: '85px', fontWeight: 'bold', color: '#444', fontSize: '12px' }}>Student Name</span>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>: <strong style={{ textTransform: 'uppercase', fontSize: '12px', color: '#1a237e', backgroundColor: '#e3f2fd', padding: '3px 10px', borderRadius: '3px' }}>{student?.full_name || '-'}</strong></span>
          </div>
          <div style={{ display: 'flex', marginBottom: '2px' }}>
            <span style={{ width: '85px', fontWeight: '600', color: '#444' }}>Father's Name</span>
            <span>: {student?.father_name || '-'}</span>
          </div>
          <div style={{ display: 'flex', marginBottom: '2px' }}>
            <span style={{ width: '85px', fontWeight: '600', color: '#444' }}>Enroll ID</span>
            <span>: {student?.enrollment_id || student?.enrollment_id || '-'}</span>
          </div>
          {extraInfo?.type === 'hostel' && (
            <div style={{ display: 'flex', marginBottom: '2px' }}>
              <span style={{ width: '85px', fontWeight: '600', color: '#444' }}>Room/Bed</span>
              <span>: {extraInfo.roomNo} / {extraInfo.bedNo}</span>
            </div>
          )}
          {extraInfo?.type === 'transport' && (
            <>
              <div style={{ display: 'flex', marginBottom: '2px' }}>
                <span style={{ width: '85px', fontWeight: '600', color: '#444' }}>Route</span>
                <span>: {extraInfo.route}</span>
              </div>
              <div style={{ display: 'flex', marginBottom: '2px' }}>
                <span style={{ width: '85px', fontWeight: '600', color: '#444' }}>Pickup Point</span>
                <span>: {extraInfo.pickupPoint}</span>
              </div>
            </>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', marginBottom: '2px' }}>
            <span style={{ width: '85px', fontWeight: '600', color: '#444' }}>Date & Time</span>
            <span>: {receiptDate ? format(new Date(receiptDate), 'dd MMM yyyy hh:mm a') : '-'}</span>
          </div>
          <div style={{ display: 'flex', marginBottom: '2px' }}>
            <span style={{ width: '85px', fontWeight: '600', color: '#444' }}>Payment Mode</span>
            <span>: <strong>{paymentMode || 'Cash'}</strong></span>
          </div>
          <div style={{ display: 'flex', marginBottom: '2px' }}>
            <span style={{ width: '85px', fontWeight: '600', color: '#444' }}>Academic Year</span>
            <span>: {sessionName || '-'}</span>
          </div>
          <div style={{ display: 'flex', marginBottom: '2px' }}>
            <span style={{ width: '85px', fontWeight: '600', color: '#444' }}>Class</span>
            <span>: {student?.class?.name || '-'}{student?.section?.name ? ` (${student.section.name})` : ''}</span>
          </div>
        </div>
      </div>

      {/* ===== FEE TABLE ===== */}
      <div style={{ padding: '4px 10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'center', width: '28px' }}>S.no</th>
              <th style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'left' }}>Particulars</th>
              <th style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right', width: '72px' }}>Total Amount</th>
              {showConcession && <th style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right', width: '72px' }}>Concession<br/>Amount</th>}
              <th style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right', width: '72px' }}>Net Payable<br/>Amount</th>
              {showPaidTillDate && <th style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right', width: '62px' }}>Paid till<br/>Date</th>}
              <th style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right', width: '62px' }}>Paid Amount</th>
              <th style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right', width: '55px' }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => {
              const concession = Number(item.discount || 0);
              const netPayable = Number(item.totalAmount || 0) - concession;
              const paidTillDate = Math.max(0, netPayable - Number(item.amount || 0) - Number(item.balance || 0));
              return (
                <tr key={idx}>
                  <td style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #888', padding: '3px 4px' }}>{item.description}</td>
                  <td style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right' }}>{Number(item.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  {showConcession && <td style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right' }}>{concession > 0 ? concession.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>}
                  <td style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right' }}>{netPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  {showPaidTillDate && <td style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right' }}>{paidTillDate > 0 ? paidTillDate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>}
                  <td style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right', fontWeight: 'bold' }}>{Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right' }}>{Number(item.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              );
            })}
            {totalFine > 0 && (
              <tr>
                <td style={{ border: '1px solid #888', padding: '3px 4px' }}></td>
                <td style={{ border: '1px solid #888', padding: '3px 4px', color: '#cc0000' }}>Late Fine</td>
                <td colSpan={1 + (showConcession ? 1 : 0) + (showPaidTillDate ? 1 : 0)} style={{ border: '1px solid #888', padding: '3px 4px' }}></td>
                <td style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right', color: '#cc0000' }}>+{totalFine.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style={{ border: '1px solid #888', padding: '3px 4px' }}></td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
              <td colSpan={2} style={{ border: '1px solid #888', padding: '4px', textAlign: 'right' }}>{isRefund ? 'Total Refund' : 'Total'}</td>
              <td style={{ border: '1px solid #888', padding: '4px', textAlign: 'right' }}>{overallTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              {showConcession && <td style={{ border: '1px solid #888', padding: '4px', textAlign: 'right' }}>{totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>}
              <td style={{ border: '1px solid #888', padding: '4px', textAlign: 'right' }}>{(overallTotalAmount - totalDiscount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              {showPaidTillDate && <td style={{ border: '1px solid #888', padding: '4px', textAlign: 'right' }}>{(() => {
                const totalPaidTillDate = lineItems.reduce((sum, item) => {
                  const c = Number(item.discount || 0);
                  const net = Number(item.totalAmount || 0) - c;
                  return sum + Math.max(0, net - Number(item.amount || 0) - Number(item.balance || 0));
                }, 0);
                return totalPaidTillDate > 0 ? totalPaidTillDate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';
              })()}</td>}
              <td style={{ border: '1px solid #888', padding: '4px', textAlign: 'right' }}>{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td style={{ border: '1px solid #888', padding: '4px', textAlign: 'right' }}>{overallBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Custom footer */}
      {printSettings?.footer_content && (
        <div 
          style={{ padding: '8px 10px', borderTop: '1px solid #ccc', color: '#333', lineHeight: '1.4' }} 
          className="receipt-footer-content"
          dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} 
        />
      )}
      <style>{`
        .receipt-footer-content h1 { font-size: 14px; margin: 0; }
        .receipt-footer-content h2 { font-size: 12px; margin: 0; }
        .receipt-footer-content h3 { font-size: 11px; margin: 0; }
        .receipt-footer-content p { font-size: 8px; margin: 2px 0; }
        .receipt-footer-content { font-size: 8px; }
        .receipt-footer-content * { box-sizing: border-box; }
        .receipt-footer-content .ql-align-center { text-align: center; }
        .receipt-footer-content .ql-align-right { text-align: right; }
        .receipt-footer-content .ql-align-justify { text-align: justify; }
        .receipt-footer-content .ql-indent-1 { padding-left: 3em; }
        .receipt-footer-content .ql-indent-2 { padding-left: 6em; }
      `}</style>

      {/* REFUND WATERMARK */}
      {isRefund && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', opacity: 0.08, pointerEvents: 'none' }}>
          <span style={{ fontSize: '48px', fontWeight: 'bold', color: 'red' }}>REFUND</span>
        </div>
      )}
    </div>
  );
};

// Template metadata for registry
Template01_ClassicBlue.templateMeta = {
  key: 'classic_blue',
  name: 'Classic Blue',
  description: 'Current default template with blue header bar, yellow highlights, and fee statement',
  category: 'professional',
  paperSize: 'A5',
  orientation: 'landscape',
  features: ['fee_statement', 'amount_in_words', 'copy_type', 'custom_header', 'custom_footer'],
  colorScheme: { primary: '#1a237e', secondary: '#4caf50', accent: '#ffeb3b' }
};

export default Template01_ClassicBlue;
