/**
 * Template 29: University Detailed
 * =================================
 * A4 portrait challan with 3 copies (Student / Office / Bank)
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

/* One challan copy section */
const ChallanCopy = ({ copyLabel, student, school, lineItems, totalPaid, totalDiscount, totalFine, grandTotal, transactionId, receiptDate, paymentMode, extraInfo, sessionName, title, printSettings, isRefund }) => {
  const formattedDate = receiptDate ? format(new Date(receiptDate), 'dd/MM/yyyy') : '';
  const cell = { border: '1px solid #555', padding: '3px 6px', fontSize: '8.5px', fontFamily: 'Arial, sans-serif' };
  const hdrCell = { ...cell, backgroundColor: '#1b3a5c', color: '#fff', fontWeight: 'bold', textAlign: 'center', fontSize: '8px' };

  return (
    <div style={{ border: '2px solid #1b3a5c', padding: '6px 8px', position: 'relative' }}>
      {/* Copy Label Badge */}
      <div style={{ position: 'absolute', top: '4px', right: '6px', backgroundColor: '#1b3a5c', color: '#fff', fontSize: '7px', padding: '1px 8px', fontWeight: 'bold', borderRadius: '2px' }}>
        {copyLabel}
      </div>

      {/* Refund */}
      {isRefund && (
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%) rotate(-20deg)', color: 'rgba(200,0,0,0.1)', fontSize: '28px', fontWeight: 'bold' }}>REFUND</div>
      )}

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '4px' }}>
        {printSettings?.showCustomHeader && printSettings?.headerImage ? (
          <img src={printSettings.headerImage} alt="" style={{ maxHeight: '30px' }} />
        ) : (
          <>
            <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>{school?.name || 'INSTITUTION NAME'}</div>
            {school?.address && <div style={{ fontSize: '7.5px' }}>{school.address}</div>}
          </>
        )}
        <div style={{ fontSize: '9px', fontWeight: 'bold', marginTop: '2px', backgroundColor: '#1b3a5c', color: '#fff', padding: '1px 0', letterSpacing: '2px' }}>
          {title || 'FEE CHALLAN'}
        </div>
      </div>

      {/* Info Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', marginBottom: '3px' }}>
        <span><strong>Receipt:</strong> {transactionId || 'N/A'}</span>
        <span><strong>Date:</strong> {formattedDate}</span>
        <span><strong>Session:</strong> {sessionName || ''}</span>
      </div>

      {/* Student Info - Row */}
      <div style={{ display: 'flex', gap: '8px', fontSize: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
        <span><strong>Name:</strong> {student?.full_name || ''}</span>
        <span><strong>S/o:</strong> {student?.father_name || ''}</span>
        <span><strong>Class:</strong> {student?.class?.name || ''} {student?.section?.name ? `(${student.section.name})` : ''}</span>
        <span><strong>Adm No:</strong> {student?.school_code || student?.admission_no || ''}</span>
      </div>

      {/* Fee Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3px' }}>
        <thead>
          <tr>
            <th style={hdrCell}>Particulars of Fee</th>
            <th style={{ ...hdrCell, width: '75px' }}>Demand (₹)</th>
            <th style={{ ...hdrCell, width: '75px' }}>Deposited (₹)</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item, i) => (
            <tr key={i}>
              <td style={cell}>
                {item.description}
                {Number(item.discount || 0) > 0 && <span style={{ fontSize: '7px', color: '#555' }}> (Exemption: ₹{fmt(item.discount)})</span>}
              </td>
              <td style={{ ...cell, textAlign: 'right' }}>{fmt(item.totalAmount)}</td>
              <td style={{ ...cell, textAlign: 'right', fontWeight: 'bold' }}>{fmt(item.amount)}</td>
            </tr>
          ))}
          {totalFine > 0 && (
            <tr>
              <td style={{ ...cell, fontStyle: 'italic' }}>Late Fee Surcharge</td>
              <td style={cell}></td>
              <td style={{ ...cell, textAlign: 'right', color: '#c00' }}>+{fmt(totalFine)}</td>
            </tr>
          )}
          <tr style={{ backgroundColor: '#e0e0e0' }}>
            <td style={{ ...cell, textAlign: 'right', fontWeight: 'bold' }}>TOTAL DEPOSITED</td>
            <td style={cell}></td>
            <td style={{ ...cell, textAlign: 'right', fontWeight: 'bold', fontSize: '9px' }}>{fmt(grandTotal || totalPaid)}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ fontSize: '7.5px', marginBottom: '3px' }}>
        <strong>In Words:</strong> Rs. {numberToWords(Math.round(grandTotal || totalPaid))} Only &nbsp;|&nbsp;
        <strong>Mode:</strong> {paymentMode || 'N/A'}
        {extraInfo?.bankRefNo && <> &nbsp;|&nbsp; <strong>Ref:</strong> {extraInfo.bankRefNo}</>}
      </div>

      {/* Signature */}
      {printSettings?.showCustomFooter && printSettings?.footerImage ? (
        <img src={printSettings.footerImage} alt="" style={{ maxHeight: '25px' }} />
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.5px', marginTop: '6px' }}>
          <div style={{ borderTop: '1px solid #555', width: '28%', textAlign: 'center', paddingTop: '2px' }}>Student Signature</div>
          <div style={{ borderTop: '1px solid #555', width: '28%', textAlign: 'center', paddingTop: '2px' }}>Cashier</div>
          <div style={{ borderTop: '1px solid #555', width: '28%', textAlign: 'center', paddingTop: '2px' }}>Authorized Signatory</div>
        </div>
      )}
    </div>
  );
};

const Template29_UniversityDetailed = ({ receiptData, copyType }) => {
  const {
    student, school, lineItems = [], feeStatement = [],
    totalPaid, totalDiscount, totalFine, grandTotal,
    overallTotalAmount, overallBalance,
    transactionId, receiptDate, paymentMode,
    extraInfo, isRefund, isOriginal, printSettings, sessionName, title
  } = receiptData;

  const commonProps = { student, school, lineItems, totalPaid, totalDiscount, totalFine, grandTotal, transactionId, receiptDate, paymentMode, extraInfo, sessionName, title, printSettings, isRefund };

  const copies = ['STUDENT COPY', 'OFFICE COPY', 'BANK COPY'];

  return (
    <div style={{ width: '210mm', minHeight: '297mm', padding: '8mm 12mm', fontFamily: 'Arial, sans-serif', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {copies.map((label, idx) => (
        <React.Fragment key={idx}>
          <ChallanCopy copyLabel={label} {...commonProps} />
          {idx < copies.length - 1 && (
            <div style={{ borderTop: '2px dashed #999', margin: '2px 0', position: 'relative' }}>
              <span style={{ position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#fff', padding: '0 8px', fontSize: '7px', color: '#999' }}>✂ CUT HERE</span>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

Template29_UniversityDetailed.templateMeta = {
  key: 'university_detailed',
  name: 'University Detailed',
  description: 'A4 challan format with 3 copies on one page — Student, Office, Bank',
  category: 'formal',
  paperSize: 'A4',
  orientation: 'portrait',
  thumbnail: null,
  features: ['amount_in_words', 'copy_type', 'custom_header', 'custom_footer', 'three_copy_challan'],
  colorScheme: { primary: '#1b3a5c', secondary: '#e0e0e0', accent: '#333333' }
};

export default Template29_UniversityDetailed;
