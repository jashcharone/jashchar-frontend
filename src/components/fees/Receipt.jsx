import React from 'react';
import { format } from 'date-fns';

const Receipt = React.forwardRef(({ data, settings, currentDate }, ref) => {
    if (!data) {
        return <div ref={ref}>Loading receipt...</div>;
    }

    const { school, student, payments, transaction_id } = data;

    const totalAmountPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalDiscount = payments.reduce((sum, p) => sum + (Number(p.discount_amount) || 0), 0);
    const totalFine = payments.reduce((sum, p) => sum + (Number(p.fine_paid) || 0), 0);
    const grandTotal = totalAmountPaid + totalFine;
    
    // Calculate new total balance for the student
    // This is a simplified calculation and should be replaced with a proper query if available
    const totalFees = 0; // Replace with actual total fees query
    const totalPaidPreviously = 0; // Replace with actual total paid query
    const totalDiscountPreviously = 0; // Replace with actual total discount query
    // ? FIXED: Balance cannot be negative (cap at 0)
    const newBalance = Math.max(0, totalFees - (totalPaidPreviously + totalAmountPaid) - (totalDiscountPreviously + totalDiscount));


    const numberToWords = (num) => {
        // Simplified number to words converter
        const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
        const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

        const inWords = (n) => {
            if (n < 20) return a[n];
            let digit = n % 10;
            return b[Math.floor(n / 10)] + (digit ? '-' + a[digit] : '');
        };
        
        if (num === 0) return 'zero';
        let words = '';
        if (num >= 10000000) { words += inWords(Math.floor(num / 10000000)) + ' crore '; num %= 10000000; }
        if (num >= 100000) { words += inWords(Math.floor(num / 100000)) + ' lakh '; num %= 100000; }
        if (num >= 1000) { words += inWords(Math.floor(num / 1000)) + ' thousand '; num %= 1000; }
        if (num >= 100) { words += inWords(Math.floor(num / 100)) + ' hundred '; num %= 100; }
        if (num > 0) { words += (words ? 'and ' : '') + inWords(num); }

        return words.trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const payment = payments[0] || {}; // Use the first payment for general details

    return (
        <div ref={ref} className="w-[210mm] h-[297mm] p-8 bg-white font-sans text-sm">
            <div className="border-2 border-gray-800 p-6 h-full flex flex-col">
                {/* Header */}
                <header className="text-center mb-6">
                    <h1 className="text-3xl font-bold uppercase">{school.name}</h1>
                    <p className="text-xs">{school.address}, {school.city} - {school.pincode}</p>
                    <p className="text-xs">Phone: {school.contact_number}, Email: {school.contact_email}</p>
                    <div className="inline-block border-2 border-black px-4 py-1 mt-2 text-lg font-semibold">
                        FEE RECEIPT
                    </div>
                </header>

                {/* Receipt Info */}
                <div className="flex justify-between mb-4 text-xs">
                    <p><strong>Receipt No:</strong> {transaction_id}</p>
                    <p><strong>Receipt Date:</strong> {format(new Date(payment.payment_date), 'dd-MMM-yyyy')}</p>
                </div>
                <hr className="border-gray-400 border-dashed" />

                {/* Student Details */}
                <section className="my-4 text-xs">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                        <div><strong>Student Name:</strong> {student.full_name}</div>
                        <div><strong>Enroll ID:</strong> {student.enrollment_id || student.enrollment_id}</div>
                        <div><strong>Father's Name:</strong> {student.father_name}</div>
                        <div><strong>Class:</strong> {student.class?.name || 'N/A'} ({student.section?.name || 'N/A'})</div>
                    </div>
                </section>
                <hr className="border-gray-400 border-dashed" />

                {/* Fees Breakdown Table */}
                <section className="my-4 flex-grow">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b-2 border-gray-800">
                                <th className="py-1">Sr. No.</th>
                                <th className="py-1">Particulars</th>
                                <th className="py-1 text-right">Amount (?)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((p, index) => (
                                <tr key={p.id} className="border-b border-dashed">
                                    <td className="py-1">{index + 1}</td>
                                    <td className="py-1">{p.fee_master.fee_group.name} - {p.fee_master.fee_type.name}</td>
                                    <td className="py-1 text-right">{Number(p.amount).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {/* Totals Section */}
                <section className="mt-auto">
                    <div className="grid grid-cols-2 text-xs">
                        <div>
                             <p className="mb-2"><strong>Payment Method:</strong> {payment.payment_mode}</p>
                             {payment.note && <p><strong>Note:</strong> {payment.note}</p>}
                        </div>
                        <div className="text-right">
                            <p><strong>Amount Paid:</strong> ₹{totalAmountPaid.toFixed(2)}</p>
                            <p><strong>Discount Given:</strong> ₹{totalDiscount.toFixed(2)}</p>
                            <p><strong>Fine Paid:</strong> ₹{totalFine.toFixed(2)}</p>
                            <hr className="my-1 border-gray-800" />
                            <p className="font-bold text-sm"><strong>Grand Total:</strong> ₹{grandTotal.toFixed(2)}</p>
                        </div>
                    </div>
                    
                    <div className="font-semibold text-xs mt-2 p-2 border-t border-b border-dashed">
                        Amount in words: {numberToWords(Math.floor(grandTotal))} Rupees Only
                    </div>

                </section>
                
                {/* Footer */}
                <footer className="mt-8 text-xs flex justify-between items-end">
                    <div>
                        <p>This is a computer-generated receipt.</p>
                        <p>Printed on: {currentDate}</p>
                    </div>
                    <div className="text-center">
                        <div className="h-10"></div>
                        <hr className="border-gray-800" />
                        <p className="font-semibold">Authorised Signatory</p>
                    </div>
                </footer>
            </div>
        </div>
    );
});

Receipt.displayName = 'Receipt';
export default Receipt;

