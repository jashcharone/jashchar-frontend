import React, { useState, useEffect, useCallback } from 'react';
import { formatDate } from '@/utils/dateUtils';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2 } from 'lucide-react';

const MarksheetPDF = React.forwardRef(({ studentId, templateId, branchId }, ref) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    const fetchData = useCallback(async () => {
        if (!studentId || !templateId || !branchId) return;
        setLoading(true);

        try {
            const [templateRes, studentRes, marksRes, rankRes] = await Promise.all([
                supabase.from('cbse_marksheet_templates').select('*').eq('id', templateId).single(),
                supabase.from('profiles').select('*, classes(name), sections(name)').eq('id', studentId).single(),
                supabase.rpc('get_student_marks_for_template', { p_student_id: studentId, p_template_id: templateId }),
                supabase.from('cbse_template_ranks').select('*').eq('template_id', templateId).eq('student_id', studentId).single(),
            ]);

            if (templateRes.error) throw new Error(`Template: ${templateRes.error.message}`);
            if (studentRes.error) throw new Error(`Student: ${studentRes.error.message}`);
            if (marksRes.error) throw new Error(`Marks: ${marksRes.error.message}`);

            setData({
                template: templateRes.data,
                student: studentRes.data,
                marks: marksRes.data,
                rank: rankRes.data,
            });

        } catch (error) {
            console.error("Error fetching marksheet data:", error);
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [studentId, templateId, branchId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    if (loading) {
        return (
            <div ref={ref} className="p-8 flex justify-center items-center h-screen">
                <Loader2 className="animate-spin h-12 w-12" />
            </div>
        );
    }

    if (!data || !data.template || !data.student) {
        return <div ref={ref} className="p-8">Error: Could not load marksheet data.</div>;
    }

    const { template, student, marks, rank } = data;

    const renderField = (show, label, value) => {
        if (!show || !value) return null;
        return <p><strong>{label}:</strong> {value}</p>;
    };

    return (
        <div ref={ref} className="p-8 bg-white" style={{ 
            width: template.marksheet_type === 'landscape' ? '297mm' : '210mm', 
            minHeight: template.marksheet_type === 'landscape' ? '210mm' : '297mm',
            backgroundImage: `url(${template.background_image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
        }}>
            <div className="bg-white/80 backdrop-blur-sm p-8">
                {template.header_image_url && <img-replace src={template.header_image_url} alt="Header" className="mx-auto mb-4 h-20 object-contain" />}
                {template.school_name && <h2 className="text-center text-2xl font-bold">{template.school_name}</h2>}
                {template.show_academic_session && <p className="text-center font-semibold">ACADEMIC SESSION: {student.session?.name || '2024-2025'}</p>}
                <p className="text-center font-bold text-lg my-2">REPORT CARD</p>
                {template.exam_center && <p className="text-center text-sm">Exam Center: {template.exam_center}</p>}
                
                <div className="flex justify-between items-start mt-4 text-sm">
                    <div className="space-y-1">
                        {renderField(true, 'Student Name', student.full_name)}
                        {renderField(template.show_roll_no, 'Roll No', student.roll_number)}
                        {renderField(template.show_admission_no, 'Admission No', student.school_code)}
                        {renderField(template.show_father_name, "Father's Name", student.father_name)}
                        {renderField(template.show_mother_name, "Mother's Name", student.mother_name)}
                    </div>
                     <div className="space-y-1 text-right">
                        {renderField(template.show_class, 'Class', student.classes?.name)}
                        {renderField(template.show_section, 'Section', student.sections?.name)}
                        {renderField(template.show_dob, 'Date of Birth', student.dob)}
                    </div>
                    {template.show_student_photo && (
                        student.photo_url ? 
                        <img-replace src={student.photo_url} alt="Student" className="w-24 h-28 border-2 object-cover" /> :
                        <div className="w-24 h-28 border-2 flex items-center justify-center bg-gray-100"><p className="text-xs text-center">Photo</p></div>
                    )}
                </div>

                <div className="mt-6">
                    <table className="w-full border-collapse border border-black text-sm">
                        <thead>
                           <tr className="bg-gray-200">
                               <th className="border border-black p-2">Subject</th>
                               <th className="border border-black p-2">Total Marks</th>
                               <th className="border border-black p-2">Marks Obtained</th>
                               <th className="border border-black p-2">Grade</th>
                           </tr>
                        </thead>
                        <tbody>
                            {marks?.map(mark => (
                                <tr key={mark.subject_id}>
                                    <td className="border border-black p-2">{mark.subject_name}</td>
                                    <td className="border border-black p-2 text-center">{mark.max_marks}</td>
                                    <td className="border border-black p-2 text-center">{mark.marks_obtained}</td>
                                    <td className="border border-black p-2 text-center">{mark.grade}</td>
                                </tr>
                            ))}
                            <tr className="font-bold bg-gray-100">
                               <td className="border border-black p-2" colSpan="1">Grand Total</td>
                               <td className="border border-black p-2 text-center">{rank?.grand_total}</td>
                               <td className="border border-black p-2" colSpan="2"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                   {rank?.percentage && <div className="border p-2"><strong>Percentage:</strong> {rank.percentage}%</div>}
                   {rank?.grade && <div className="border p-2"><strong>Overall Grade:</strong> {rank.grade}</div>}
                   {rank?.rank && <div className="border p-2"><strong>Rank:</strong> {rank.rank}</div>}
                </div>

                <div className="flex justify-between mt-20 pt-4">
                    {template.left_sign_url ? <img-replace src={template.left_sign_url} alt="Left Sign" className="h-12"/> : <div className="text-center w-1/3 pt-4"><hr className="border-black"/><p>Class Teacher</p></div>}
                    {template.middle_sign_url ? <img-replace src={template.middle_sign_url} alt="Middle Sign" className="h-12"/> : <div className="text-center w-1/3 pt-4"><hr className="border-black"/><p>Principal</p></div>}
                    {template.right_sign_url ? <img-replace src={template.right_sign_url} alt="Right Sign" className="h-12"/> : <div className="text-center w-1/3 pt-4"><hr className="border-black"/><p>Parent's Signature</p></div>}
                </div>

                {template.footer_content && <div className="mt-4 text-center text-xs" dangerouslySetInnerHTML={{ __html: template.footer_content }} />}
                 {template.printing_date && <p className="text-xs text-right mt-2">Printed on: {formatDate(template.printing_date)}</p>}
            </div>
        </div>
    );
});

export default MarksheetPDF;
