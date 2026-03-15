/**
 * Examination API Service
 * Handles all API calls for examination module
 * @file jashchar-frontend/src/services/examinationService.js
 * @date 2026-03-09
 */

import apiClient from '@/lib/apiClient';

const BASE_URL = '/examinations';

// ============================================================================
// BOARD CONFIGURATION
// ============================================================================

export const boardConfigService = {
    /**
     * Get all board configurations
     * @param {Object} params - Query params { is_active }
     */
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/boards${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Get single board configuration
     * @param {string} id - Board config ID
     */
    getById: async (id) => {
        return apiClient.get(`${BASE_URL}/boards/${id}`);
    },

    /**
     * Create board configuration
     * @param {Object} data - Board config data
     */
    create: async (data) => {
        return apiClient.post(`${BASE_URL}/boards`, data);
    },

    /**
     * Update board configuration
     * @param {string} id - Board config ID
     * @param {Object} data - Updated data
     */
    update: async (id, data) => {
        return apiClient.put(`${BASE_URL}/boards/${id}`, data);
    },

    /**
     * Delete board configuration
     * @param {string} id - Board config ID
     */
    delete: async (id) => {
        return apiClient.delete(`${BASE_URL}/boards/${id}`);
    }
};

// ============================================================================
// TERM MANAGEMENT
// ============================================================================

export const termService = {
    /**
     * Get all terms
     * @param {Object} params - Query params { is_active }
     */
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/terms${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Get current active term
     */
    getCurrent: async () => {
        return apiClient.get(`${BASE_URL}/terms/current`);
    },

    /**
     * Get single term
     * @param {string} id - Term ID
     */
    getById: async (id) => {
        return apiClient.get(`${BASE_URL}/terms/${id}`);
    },

    /**
     * Create term
     * @param {Object} data - Term data
     */
    create: async (data) => {
        return apiClient.post(`${BASE_URL}/terms`, data);
    },

    /**
     * Update term
     * @param {string} id - Term ID
     * @param {Object} data - Updated data
     */
    update: async (id, data) => {
        return apiClient.put(`${BASE_URL}/terms/${id}`, data);
    },

    /**
     * Delete term
     * @param {string} id - Term ID
     */
    delete: async (id) => {
        return apiClient.delete(`${BASE_URL}/terms/${id}`);
    }
};

// ============================================================================
// EXAM TYPES
// ============================================================================

export const examTypeService = {
    /**
     * Get all exam types
     * @param {Object} params - Query params { is_active, category }
     */
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/exam-types${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Get single exam type
     * @param {string} id - Exam type ID
     */
    getById: async (id) => {
        return apiClient.get(`${BASE_URL}/exam-types/${id}`);
    },

    /**
     * Create exam type
     * @param {Object} data - Exam type data
     */
    create: async (data) => {
        return apiClient.post(`${BASE_URL}/exam-types`, data);
    },

    /**
     * Update exam type
     * @param {string} id - Exam type ID
     * @param {Object} data - Updated data
     */
    update: async (id, data) => {
        return apiClient.put(`${BASE_URL}/exam-types/${id}`, data);
    },

    /**
     * Delete exam type
     * @param {string} id - Exam type ID
     */
    delete: async (id) => {
        return apiClient.delete(`${BASE_URL}/exam-types/${id}`);
    },

    /**
     * Seed default exam types
     */
    seedDefaults: async () => {
        return apiClient.post(`${BASE_URL}/exam-types/seed-defaults`);
    }
};

// ============================================================================
// GRADE SCALES
// ============================================================================

export const gradeScaleService = {
    /**
     * Get all grade scales
     * @param {Object} params - Query params { is_active, include_details }
     */
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/grade-scales${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Get grade scale presets
     */
    getPresets: async () => {
        return apiClient.get(`${BASE_URL}/grade-scales/presets`);
    },

    /**
     * Get single grade scale with details
     * @param {string} id - Grade scale ID
     */
    getById: async (id) => {
        return apiClient.get(`${BASE_URL}/grade-scales/${id}`);
    },

    /**
     * Create grade scale with details
     * @param {Object} data - Grade scale data with details array
     */
    create: async (data) => {
        return apiClient.post(`${BASE_URL}/grade-scales`, data);
    },

    /**
     * Update grade scale with details
     * @param {string} id - Grade scale ID
     * @param {Object} data - Updated data with details array
     */
    update: async (id, data) => {
        return apiClient.put(`${BASE_URL}/grade-scales/${id}`, data);
    },

    /**
     * Delete grade scale
     * @param {string} id - Grade scale ID
     */
    delete: async (id) => {
        return apiClient.delete(`${BASE_URL}/grade-scales/${id}`);
    },

    /**
     * Duplicate grade scale
     * @param {string} id - Grade scale ID to duplicate
     * @param {string} newName - Name for the new scale
     */
    duplicate: async (id, newName) => {
        return apiClient.post(`${BASE_URL}/grade-scales/${id}/duplicate`, { new_scale_name: newName });
    }
};

// ============================================================================
// Exam Group Service
// ============================================================================
export const examGroupService = {
    /**
     * Get all exam groups
     * @param {Object} params - Filter parameters
     */
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/exam-groups${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Get single exam group with subjects
     * @param {string} id - Exam group ID
     */
    getById: async (id) => {
        return apiClient.get(`${BASE_URL}/exam-groups/${id}`);
    },

    /**
     * Create exam group
     * @param {Object} data - Exam group data
     */
    create: async (data) => {
        return apiClient.post(`${BASE_URL}/exam-groups`, data);
    },

    /**
     * Update exam group
     * @param {string} id - Exam group ID
     * @param {Object} data - Update data
     */
    update: async (id, data) => {
        return apiClient.put(`${BASE_URL}/exam-groups/${id}`, data);
    },

    /**
     * Delete exam group
     * @param {string} id - Exam group ID
     */
    delete: async (id) => {
        return apiClient.delete(`${BASE_URL}/exam-groups/${id}`);
    },

    /**
     * Publish exam group
     * @param {string} id - Exam group ID
     */
    publish: async (id) => {
        return apiClient.post(`${BASE_URL}/exam-groups/${id}/publish`);
    },

    /**
     * Get subjects for exam group
     * @param {string} id - Exam group ID
     */
    getSubjects: async (id) => {
        return apiClient.get(`${BASE_URL}/exam-groups/${id}/subjects`);
    },

    /**
     * Add subject to exam group
     * @param {string} id - Exam group ID
     * @param {Object} subjectData - Subject configuration
     */
    addSubject: async (id, subjectData) => {
        return apiClient.post(`${BASE_URL}/exam-groups/${id}/subjects`, subjectData);
    },

    /**
     * Update exam group subject
     * @param {string} groupId - Exam group ID
     * @param {string} subjectId - Subject record ID
     * @param {Object} data - Update data
     */
    updateSubject: async (groupId, subjectId, data) => {
        return apiClient.put(`${BASE_URL}/exam-groups/${groupId}/subjects/${subjectId}`, data);
    },

    /**
     * Remove subject from exam group
     * @param {string} groupId - Exam group ID
     * @param {string} subjectId - Subject record ID
     */
    deleteSubject: async (groupId, subjectId) => {
        return apiClient.delete(`${BASE_URL}/exam-groups/${groupId}/subjects/${subjectId}`);
    }
};

// ============================================================================
// INDIVIDUAL EXAMS SERVICE (Phase 2)
// ============================================================================

export const examService = {
    /**
     * Get all individual exams
     * @param {Object} params - Filter params { exam_group_id, subject_id, class_id, status }
     */
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/exams${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Get single exam with details
     * @param {string} id - Exam ID
     */
    getById: async (id) => {
        return apiClient.get(`${BASE_URL}/exams/${id}`);
    },

    /**
     * Create individual exam
     * @param {Object} data - Exam data
     */
    create: async (data) => {
        return apiClient.post(`${BASE_URL}/exams`, data);
    },

    /**
     * Update exam
     * @param {string} id - Exam ID
     * @param {Object} data - Updated data
     */
    update: async (id, data) => {
        return apiClient.put(`${BASE_URL}/exams/${id}`, data);
    },

    /**
     * Delete exam
     * @param {string} id - Exam ID
     */
    delete: async (id) => {
        return apiClient.delete(`${BASE_URL}/exams/${id}`);
    },

    /**
     * Publish exam (make visible to students)
     * @param {string} id - Exam ID
     */
    publish: async (id) => {
        return apiClient.post(`${BASE_URL}/exams/${id}/publish`);
    },

    /**
     * Bulk create exams for all subjects in an exam group
     * @param {Object} data - { exam_group_id, class_id, exams: [{subject_id, max_marks_total, ...}] }
     */
    bulkCreate: async (data) => {
        return apiClient.post(`${BASE_URL}/exams/bulk-create`, data);
    }
};

// ============================================================================
// EXAM STUDENT ASSIGNMENT SERVICE (Phase 2)
// ============================================================================

export const examStudentService = {
    /**
     * Get all students assigned to an exam
     * @param {string} examId - Exam ID
     * @param {Object} params - Filter params { status, eligibility_status }
     */
    getByExam: async (examId, params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/exams/${examId}/students${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Assign students to an exam (single or multiple)
     * @param {Object} data - { exam_id, student_ids: [] }
     */
    assign: async (data) => {
        return apiClient.post(`${BASE_URL}/exams/students/assign`, data);
    },

    /**
     * Bulk assign students by class/section
     * @param {Object} data - { exam_id, class_id, section_ids: [], filter_criteria }
     */
    bulkAssign: async (data) => {
        return apiClient.post(`${BASE_URL}/exams/students/bulk-assign`, data);
    },

    /**
     * Update exam student record (roll number, seating, status)
     * @param {string} id - Exam student record ID
     * @param {Object} data - Updated data
     */
    update: async (id, data) => {
        return apiClient.put(`${BASE_URL}/exam-students/${id}`, data);
    },

    /**
     * Remove student from exam
     * @param {string} id - Exam student record ID
     */
    remove: async (id) => {
        return apiClient.delete(`${BASE_URL}/exam-students/${id}`);
    },

    /**
     * Generate roll numbers for students in an exam
     * @param {string} examId - Exam ID
     * @param {Object} options - { pattern, start_number, prefix, suffix }
     */
    generateRollNumbers: async (examId, options = {}) => {
        return apiClient.post(`${BASE_URL}/exams/${examId}/generate-roll-numbers`, options);
    },

    /**
     * Update exam attendance for a student
     * @param {string} id - Exam student record ID  
     * @param {Object} data - { is_present }
     */
    updateAttendance: async (id, data) => {
        return apiClient.put(`${BASE_URL}/exam-students/${id}/attendance`, data);
    }
};

// ============================================================================
// PHASE 3: Room Management Service
// ============================================================================
export const roomService = {
    /**
     * Get all exam rooms
     * @param {Object} params - { is_active, is_available_for_exam, building, floor }
     */
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/rooms${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Get room by ID
     * @param {string} id - Room ID
     */
    getById: async (id) => {
        return apiClient.get(`${BASE_URL}/rooms/${id}`);
    },

    /**
     * Create exam room
     * @param {Object} data - Room data
     */
    create: async (data) => {
        return apiClient.post(`${BASE_URL}/rooms`, data);
    },

    /**
     * Update exam room
     * @param {string} id - Room ID
     * @param {Object} data - Updated data
     */
    update: async (id, data) => {
        return apiClient.put(`${BASE_URL}/rooms/${id}`, data);
    },

    /**
     * Delete exam room
     * @param {string} id - Room ID
     */
    delete: async (id) => {
        return apiClient.delete(`${BASE_URL}/rooms/${id}`);
    }
};

// ============================================================================
// PHASE 3: Invigilator Duty Service
// ============================================================================
export const invigilatorDutyService = {
    /**
     * Get invigilator duties
     * @param {Object} params - { exam_id, staff_id, duty_date, status }
     */
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/invigilator-duties${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Assign invigilator duty
     * @param {Object} data - Duty assignment data
     */
    assign: async (data) => {
        return apiClient.post(`${BASE_URL}/invigilator-duties`, data);
    },

    /**
     * Bulk assign invigilator duties
     * @param {Array} duties - Array of duty assignments
     */
    bulkAssign: async (duties) => {
        return apiClient.post(`${BASE_URL}/invigilator-duties/bulk`, { duties });
    },

    /**
     * Update invigilator duty
     * @param {string} id - Duty ID
     * @param {Object} data - Updated data
     */
    update: async (id, data) => {
        return apiClient.put(`${BASE_URL}/invigilator-duties/${id}`, data);
    },

    /**
     * Delete invigilator duty
     * @param {string} id - Duty ID
     */
    delete: async (id) => {
        return apiClient.delete(`${BASE_URL}/invigilator-duties/${id}`);
    },

    /**
     * Mark invigilator attendance
     * @param {string} id - Duty ID
     * @param {Object} data - { check_in_time, check_out_time, status }
     */
    markAttendance: async (id, data) => {
        return apiClient.put(`${BASE_URL}/invigilator-duties/${id}/attendance`, data);
    }
};

// ============================================================================
// PHASE 3: Seating Arrangement Service
// ============================================================================
export const seatingService = {
    /**
     * Get seating arrangements
     * @param {Object} params - { exam_id, room_id }
     */
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/seating-arrangements${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Generate seating arrangement automatically
     * @param {Object} data - { exam_id, room_ids, pattern }
     */
    generate: async (data) => {
        return apiClient.post(`${BASE_URL}/seating-arrangements/generate`, data);
    },

    /**
     * Update individual seat assignment
     * @param {string} id - Seat arrangement ID
     * @param {Object} data - { room_id, seat_number, row_number, column_number }
     */
    update: async (id, data) => {
        return apiClient.put(`${BASE_URL}/seating-arrangements/${id}`, data);
    },

    /**
     * Clear all seating arrangements for an exam
     * @param {string} examId - Exam ID
     */
    clear: async (examId) => {
        return apiClient.delete(`${BASE_URL}/seating-arrangements/exam/${examId}`);
    }
};

// ============================================================================
// PHASE 3: Exam Calendar Service
// ============================================================================
export const examCalendarService = {
    /**
     * Get exam calendar events
     * @param {Object} params - { start_date, end_date, exam_group_id, event_type }
     */
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/calendar${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Add calendar event
     * @param {Object} data - Calendar event data
     */
    add: async (data) => {
        return apiClient.post(`${BASE_URL}/calendar`, data);
    },

    /**
     * Update calendar event
     * @param {string} id - Event ID
     * @param {Object} data - Updated data
     */
    update: async (id, data) => {
        return apiClient.put(`${BASE_URL}/calendar/${id}`, data);
    },

    /**
     * Delete calendar event
     * @param {string} id - Event ID
     */
    delete: async (id) => {
        return apiClient.delete(`${BASE_URL}/calendar/${id}`);
    },

    /**
     * Sync exam schedule to calendar
     * @param {string} examGroupId - Exam group ID
     */
    syncFromExamGroup: async (examGroupId) => {
        return apiClient.post(`${BASE_URL}/calendar/sync`, { exam_group_id: examGroupId });
    }
};

// ============================================================================
// PHASE 4: Marks Entry Service
// ============================================================================
export const marksEntryService = {
    /**
     * Get marks for exam subject
     * @param {Object} params - { exam_id, exam_subject_id }
     */
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/marks${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Get students with marks for entry
     * @param {string} examId - Exam ID
     * @param {string} examSubjectId - Subject ID
     */
    getStudentsWithMarks: async (examId, examSubjectId) => {
        return apiClient.get(`${BASE_URL}/marks/students?exam_id=${examId}&exam_subject_id=${examSubjectId}`);
    },

    /**
     * Save marks (bulk)
     * @param {Object} data - { exam_id, exam_subject_id, marks_data, is_submit }
     */
    save: async (data) => {
        return apiClient.post(`${BASE_URL}/marks`, data);
    },

    /**
     * Save draft (auto-save)
     * @param {Object} data - { exam_id, exam_subject_id, marks_data }
     */
    saveDraft: async (data) => {
        return apiClient.post(`${BASE_URL}/marks/draft`, data);
    },

    /**
     * Get draft
     * @param {string} examId - Exam ID
     * @param {string} examSubjectId - Subject ID
     */
    getDraft: async (examId, examSubjectId) => {
        return apiClient.get(`${BASE_URL}/marks/draft?exam_id=${examId}&exam_subject_id=${examSubjectId}`);
    },

    /**
     * Submit marks
     * @param {Object} data - { exam_id, exam_subject_id }
     */
    submit: async (data) => {
        return apiClient.post(`${BASE_URL}/marks/submit`, data);
    },

    /**
     * Lock marks (final)
     * @param {Object} data - { exam_id, exam_subject_id }
     */
    lock: async (data) => {
        return apiClient.post(`${BASE_URL}/marks/lock`, data);
    },

    /**
     * Unlock marks (admin)
     * @param {Object} data - { exam_id, exam_subject_id }
     */
    unlock: async (data) => {
        return apiClient.post(`${BASE_URL}/marks/unlock`, data);
    }
};

// ============================================================================
// PHASE 4: Internal Assessment Service
// ============================================================================
export const internalAssessmentService = {
    /**
     * Get internal assessments
     * @param {Object} params - { exam_id, exam_subject_id }
     */
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/internal-assessments${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Save internal assessments
     * @param {Object} data - { exam_id, exam_subject_id, assessments_data, best_of_count }
     */
    save: async (data) => {
        return apiClient.post(`${BASE_URL}/internal-assessments`, data);
    }
};

// ============================================================================
// PHASE 4: Practical Marks Service
// ============================================================================
export const practicalMarksService = {
    /**
     * Get practical marks
     * @param {Object} params - { exam_id, exam_subject_id }
     */
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/practical-marks${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Save practical marks
     * @param {Object} data - { exam_id, exam_subject_id, practical_data, examiner_details }
     */
    save: async (data) => {
        return apiClient.post(`${BASE_URL}/practical-marks`, data);
    }
};

// ============================================================================
// PHASE 4: Bulk Upload Service
// ============================================================================
export const bulkUploadService = {
    /**
     * Get download template
     * @param {string} examId - Exam ID
     * @param {string} examSubjectId - Subject ID
     */
    getTemplate: async (examId, examSubjectId) => {
        return apiClient.get(`${BASE_URL}/marks/template?exam_id=${examId}&exam_subject_id=${examSubjectId}`);
    },

    /**
     * Upload marks from Excel/CSV
     * @param {Object} data - { exam_id, exam_subject_id, marks_data, file_name, file_type }
     */
    upload: async (data) => {
        return apiClient.post(`${BASE_URL}/marks/upload`, data);
    },

    /**
     * Get upload history
     * @param {string} examId - Exam ID (optional)
     */
    getHistory: async (examId) => {
        const query = examId ? `?exam_id=${examId}` : '';
        return apiClient.get(`${BASE_URL}/marks/upload-history${query}`);
    }
};

// ============================================================================
// PHASE 5: Grace Marks Service
// ============================================================================
export const graceMarksService = {
    /**
     * Get grace mark configurations
     * @param {Object} filters - { exam_group_id, grace_type, is_active }
     */
    getConfigs: async (filters = {}) => {
        const params = new URLSearchParams(
            Object.entries(filters).filter(([_, v]) => v !== undefined && v !== '')
        );
        return apiClient.get(`${BASE_URL}/grace-marks?${params}`);
    },

    /**
     * Create grace mark configuration
     * @param {Object} data - Grace mark config data
     */
    createConfig: async (data) => {
        return apiClient.post(`${BASE_URL}/grace-marks`, data);
    },

    /**
     * Update grace mark configuration
     * @param {string} id - Config ID
     * @param {Object} data - Updated data
     */
    updateConfig: async (id, data) => {
        return apiClient.put(`${BASE_URL}/grace-marks/${id}`, data);
    },

    /**
     * Delete grace mark configuration
     * @param {string} id - Config ID
     */
    deleteConfig: async (id) => {
        return apiClient.delete(`${BASE_URL}/grace-marks/${id}`);
    },

    /**
     * Apply grace marks to students
     * @param {Object} data - { grace_config_id, students: [{ student_id, subject_id, original_marks, reason }] }
     */
    apply: async (data) => {
        return apiClient.post(`${BASE_URL}/grace-marks/apply`, data);
    },

    /**
     * Get applied grace marks
     * @param {Object} filters - { exam_group_id, student_id, class_id }
     */
    getApplied: async (filters = {}) => {
        const params = new URLSearchParams(
            Object.entries(filters).filter(([_, v]) => v !== undefined && v !== '')
        );
        return apiClient.get(`${BASE_URL}/grace-marks/applied?${params}`);
    }
};

// ============================================================================
// PHASE 5: Moderation Service
// ============================================================================
export const moderationService = {
    /**
     * Get moderation rules
     * @param {Object} filters - { exam_group_id, moderation_type, is_active }
     */
    getRules: async (filters = {}) => {
        const params = new URLSearchParams(
            Object.entries(filters).filter(([_, v]) => v !== undefined && v !== '')
        );
        return apiClient.get(`${BASE_URL}/moderation/rules?${params}`);
    },

    /**
     * Create moderation rule
     * @param {Object} data - Moderation rule data
     */
    createRule: async (data) => {
        return apiClient.post(`${BASE_URL}/moderation/rules`, data);
    },

    /**
     * Update moderation rule
     * @param {string} id - Rule ID
     * @param {Object} data - Updated data
     */
    updateRule: async (id, data) => {
        return apiClient.put(`${BASE_URL}/moderation/rules/${id}`, data);
    },

    /**
     * Delete moderation rule
     * @param {string} id - Rule ID
     */
    deleteRule: async (id) => {
        return apiClient.delete(`${BASE_URL}/moderation/rules/${id}`);
    },

    /**
     * Apply moderation to marks
     * @param {Object} data - { rule_id, exam_group_id, subject_id, class_id }
     */
    apply: async (data) => {
        return apiClient.post(`${BASE_URL}/moderation/apply`, data);
    },

    /**
     * Get applied moderation
     * @param {Object} filters - { exam_group_id, student_id, subject_id }
     */
    getApplied: async (filters = {}) => {
        const params = new URLSearchParams(
            Object.entries(filters).filter(([_, v]) => v !== undefined && v !== '')
        );
        return apiClient.get(`${BASE_URL}/moderation/applied?${params}`);
    }
};

// ============================================================================
// PHASE 5: Results Service
// ============================================================================
export const resultsService = {
    /**
     * Calculate results for exam group
     * @param {Object} data - { exam_group_id, class_id, include_grace, include_moderation }
     */
    calculate: async (data) => {
        return apiClient.post(`${BASE_URL}/results/calculate`, data);
    },

    /**
     * Get results
     * @param {Object} filters - { exam_group_id, class_id, section_id, student_id, result_status }
     */
    getResults: async (filters = {}) => {
        const params = new URLSearchParams(
            Object.entries(filters).filter(([_, v]) => v !== undefined && v !== '')
        );
        return apiClient.get(`${BASE_URL}/results?${params}`);
    },

    /**
     * Publish results
     * @param {Object} data - { exam_group_id, class_id }
     */
    publish: async (data) => {
        return apiClient.post(`${BASE_URL}/results/publish`, data);
    },

    /**
     * Verify results
     * @param {Object} data - { result_ids, verification_notes }
     */
    verify: async (data) => {
        return apiClient.post(`${BASE_URL}/results/verify`, data);
    }
};

// ============================================================================
// PHASE 5: Ranking Service
// ============================================================================
export const rankingService = {
    /**
     * Get rank configurations
     * @param {Object} filters - { exam_group_id }
     */
    getConfigs: async (filters = {}) => {
        const params = new URLSearchParams(
            Object.entries(filters).filter(([_, v]) => v !== undefined && v !== '')
        );
        return apiClient.get(`${BASE_URL}/rank-configs?${params}`);
    },

    /**
     * Create rank configuration
     * @param {Object} data - Rank config data
     */
    createConfig: async (data) => {
        return apiClient.post(`${BASE_URL}/rank-configs`, data);
    },

    /**
     * Update rank configuration
     * @param {string} id - Config ID
     * @param {Object} data - Updated data
     */
    updateConfig: async (id, data) => {
        return apiClient.put(`${BASE_URL}/rank-configs/${id}`, data);
    },

    /**
     * Generate ranks
     * @param {Object} data - { exam_group_id, class_id, rank_scope, tiebreaker_rules }
     */
    generateRanks: async (data) => {
        return apiClient.post(`${BASE_URL}/ranks/generate`, data);
    },

    /**
     * Get subject toppers
     * @param {Object} filters - { exam_group_id, class_id, subject_id }
     */
    getSubjectToppers: async (filters = {}) => {
        const params = new URLSearchParams(
            Object.entries(filters).filter(([_, v]) => v !== undefined && v !== '')
        );
        return apiClient.get(`${BASE_URL}/subject-toppers?${params}`);
    },

    /**
     * Generate subject toppers
     * @param {Object} data - { exam_group_id, class_id, top_n }
     */
    generateSubjectToppers: async (data) => {
        return apiClient.post(`${BASE_URL}/subject-toppers/generate`, data);
    }
};

// ═══════════════════════════════════════════════════════════════
// PHASE 6: DOCUMENT TEMPLATES
// ═══════════════════════════════════════════════════════════════

/**
 * Admit Card Template Service
 */
export const admitCardTemplateService = {
    /**
     * Get all admit card templates
     */
    getTemplates: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/admit-card-templates?${queryParams}`);
    },

    /**
     * Get template by ID
     */
    getTemplateById: async (id) => {
        return apiClient.get(`${BASE_URL}/admit-card-templates/${id}`);
    },

    /**
     * Create admit card template
     */
    createTemplate: async (data) => {
        return apiClient.post(`${BASE_URL}/admit-card-templates`, data);
    },

    /**
     * Update admit card template
     */
    updateTemplate: async (id, data) => {
        return apiClient.put(`${BASE_URL}/admit-card-templates/${id}`, data);
    },

    /**
     * Delete admit card template
     */
    deleteTemplate: async (id) => {
        return apiClient.delete(`${BASE_URL}/admit-card-templates/${id}`);
    }
};

/**
 * Marksheet Template Service
 */
export const marksheetTemplateService = {
    /**
     * Get all marksheet templates
     */
    getTemplates: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/marksheet-templates?${queryParams}`);
    },

    /**
     * Get template by ID
     */
    getTemplateById: async (id) => {
        return apiClient.get(`${BASE_URL}/marksheet-templates/${id}`);
    },

    /**
     * Create marksheet template
     */
    createTemplate: async (data) => {
        return apiClient.post(`${BASE_URL}/marksheet-templates`, data);
    },

    /**
     * Update marksheet template
     */
    updateTemplate: async (id, data) => {
        return apiClient.put(`${BASE_URL}/marksheet-templates/${id}`, data);
    },

    /**
     * Delete marksheet template
     */
    deleteTemplate: async (id) => {
        return apiClient.delete(`${BASE_URL}/marksheet-templates/${id}`);
    }
};

/**
 * Report Card Template Service
 */
export const reportCardTemplateService = {
    /**
     * Get all report card templates
     */
    getTemplates: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/report-card-templates?${queryParams}`);
    },

    /**
     * Get template by ID
     */
    getTemplateById: async (id) => {
        return apiClient.get(`${BASE_URL}/report-card-templates/${id}`);
    },

    /**
     * Create report card template
     */
    createTemplate: async (data) => {
        return apiClient.post(`${BASE_URL}/report-card-templates`, data);
    },

    /**
     * Update report card template
     */
    updateTemplate: async (id, data) => {
        return apiClient.put(`${BASE_URL}/report-card-templates/${id}`, data);
    },

    /**
     * Delete report card template
     */
    deleteTemplate: async (id) => {
        return apiClient.delete(`${BASE_URL}/report-card-templates/${id}`);
    }
};

/**
 * Document Generation Service
 */
export const documentGenerationService = {
    /**
     * Generate documents (admit cards, marksheets, report cards)
     */
    generateDocuments: async (data) => {
        return apiClient.post(`${BASE_URL}/documents/generate`, data);
    },

    /**
     * Get generation history
     */
    getGenerationHistory: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/documents/history?${queryParams}`);
    },

    /**
     * Get student document data for preview/print
     */
    getStudentDocumentData: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/documents/student-data?${queryParams}`);
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 7: ANALYTICS & ONLINE EXAMINATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Analytics Service
 */
export const analyticsService = {
    /**
     * Get performance analytics
     */
    getPerformanceAnalytics: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/analytics/performance?${queryParams}`);
    },

    /**
     * Compute and save performance analytics
     */
    computeAnalytics: async (data) => {
        return apiClient.post(`${BASE_URL}/analytics/compute`, data);
    },

    /**
     * Get student performance
     */
    getStudentPerformance: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/analytics/student-performance?${queryParams}`);
    },

    /**
     * Get subject trends
     */
    getSubjectTrends: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/analytics/subject-trends?${queryParams}`);
    },

    /**
     * Get dashboard summary
     */
    getDashboardSummary: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/analytics/dashboard-summary?${queryParams}`);
    }
};

/**
 * Question Bank Service
 */
export const questionBankService = {
    // Categories
    getCategories: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/question-bank/categories?${queryParams}`);
    },

    createCategory: async (data) => {
        return apiClient.post(`${BASE_URL}/question-bank/categories`, data);
    },

    updateCategory: async (id, data) => {
        return apiClient.put(`${BASE_URL}/question-bank/categories/${id}`, data);
    },

    deleteCategory: async (id) => {
        return apiClient.delete(`${BASE_URL}/question-bank/categories/${id}`);
    },

    // Questions
    getQuestions: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/question-bank/questions?${queryParams}`);
    },

    getQuestionById: async (id) => {
        return apiClient.get(`${BASE_URL}/question-bank/questions/${id}`);
    },

    createQuestion: async (data) => {
        return apiClient.post(`${BASE_URL}/question-bank/questions`, data);
    },

    updateQuestion: async (id, data) => {
        return apiClient.put(`${BASE_URL}/question-bank/questions/${id}`, data);
    },

    deleteQuestion: async (id) => {
        return apiClient.delete(`${BASE_URL}/question-bank/questions/${id}`);
    },

    bulkImport: async (data) => {
        return apiClient.post(`${BASE_URL}/question-bank/bulk-import`, data);
    }
};

/**
 * Online Test Service
 */
export const onlineTestService = {
    // Test Management
    getTests: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/online-tests?${queryParams}`);
    },

    getTestById: async (id) => {
        return apiClient.get(`${BASE_URL}/online-tests/${id}`);
    },

    createTest: async (data) => {
        return apiClient.post(`${BASE_URL}/online-tests`, data);
    },

    updateTest: async (id, data) => {
        return apiClient.put(`${BASE_URL}/online-tests/${id}`, data);
    },

    deleteTest: async (id) => {
        return apiClient.delete(`${BASE_URL}/online-tests/${id}`);
    },

    publishTest: async (id, data) => {
        return apiClient.post(`${BASE_URL}/online-tests/${id}/publish`, data);
    },

    // Test Attempts (Student Side)
    startAttempt: async (data) => {
        return apiClient.post(`${BASE_URL}/online-tests/attempt/start`, data);
    },

    getAttempt: async (attemptId) => {
        return apiClient.get(`${BASE_URL}/online-tests/attempt/${attemptId}`);
    },

    saveAnswer: async (data) => {
        return apiClient.post(`${BASE_URL}/online-tests/attempt/save-answer`, data);
    },

    submitTest: async (data) => {
        return apiClient.post(`${BASE_URL}/online-tests/attempt/submit`, data);
    },

    // Results
    getResults: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/online-tests/results?${queryParams}`);
    },

    getDetailedResult: async (attemptId) => {
        return apiClient.get(`${BASE_URL}/online-tests/results/${attemptId}/detailed`);
    },

    // Proctoring
    logViolation: async (data) => {
        return apiClient.post(`${BASE_URL}/online-tests/proctoring/violation`, data);
    }
};

// ============================================================================
// DIVISION CONFIGURATION (Phase 8)
// ============================================================================

export const divisionService = {
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/divisions${queryString ? `?${queryString}` : ''}`);
    },
    getById: async (id) => apiClient.get(`${BASE_URL}/divisions/${id}`),
    create: async (data) => apiClient.post(`${BASE_URL}/divisions`, data),
    update: async (id, data) => apiClient.put(`${BASE_URL}/divisions/${id}`, data),
    delete: async (id) => apiClient.delete(`${BASE_URL}/divisions/${id}`),
};

// ============================================================================
// SUBJECT WEIGHTAGE (Phase 8)
// ============================================================================

export const subjectWeightageService = {
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/subject-weightage${queryString ? `?${queryString}` : ''}`);
    },
    getById: async (id) => apiClient.get(`${BASE_URL}/subject-weightage/${id}`),
    create: async (data) => apiClient.post(`${BASE_URL}/subject-weightage`, data),
    update: async (id, data) => apiClient.put(`${BASE_URL}/subject-weightage/${id}`, data),
    delete: async (id) => apiClient.delete(`${BASE_URL}/subject-weightage/${id}`),
};

// ============================================================================
// ASSESSMENT PATTERN (Phase 8)
// ============================================================================

export const assessmentPatternService = {
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/assessment-patterns${queryString ? `?${queryString}` : ''}`);
    },
    getById: async (id) => apiClient.get(`${BASE_URL}/assessment-patterns/${id}`),
    create: async (data) => apiClient.post(`${BASE_URL}/assessment-patterns`, data),
    update: async (id, data) => apiClient.put(`${BASE_URL}/assessment-patterns/${id}`, data),
    delete: async (id) => apiClient.delete(`${BASE_URL}/assessment-patterns/${id}`),
};

// ============================================================================
// EXAM LINKING (Phase 8)
// ============================================================================

export const examLinkingService = {
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/exam-links${queryString ? `?${queryString}` : ''}`);
    },
    getById: async (id) => apiClient.get(`${BASE_URL}/exam-links/${id}`),
    create: async (data) => apiClient.post(`${BASE_URL}/exam-links`, data),
    update: async (id, data) => apiClient.put(`${BASE_URL}/exam-links/${id}`, data),
    delete: async (id) => apiClient.delete(`${BASE_URL}/exam-links/${id}`),
};

// ============================================================================
// QUESTION BLUEPRINT (Phase 8)
// ============================================================================

export const questionBlueprintService = {
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/question-blueprints${queryString ? `?${queryString}` : ''}`);
    },
    getById: async (id) => apiClient.get(`${BASE_URL}/question-blueprints/${id}`),
    create: async (data) => apiClient.post(`${BASE_URL}/question-blueprints`, data),
    update: async (id, data) => apiClient.put(`${BASE_URL}/question-blueprints/${id}`, data),
    delete: async (id) => apiClient.delete(`${BASE_URL}/question-blueprints/${id}`),
};

// ============================================================================
// VERIFICATION (Phase 8)
// ============================================================================

export const verificationService = {
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/verifications${queryString ? `?${queryString}` : ''}`);
    },
    approve: async (id, data) => apiClient.post(`${BASE_URL}/verifications/${id}/approve`, data),
    reject: async (id, data) => apiClient.post(`${BASE_URL}/verifications/${id}/reject`, data),
};

// ============================================================================
// REVALUATION (Phase 8)
// ============================================================================

export const revaluationService = {
    getRequests: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/revaluations${queryString ? `?${queryString}` : ''}`);
    },
    createRequest: async (data) => apiClient.post(`${BASE_URL}/revaluations`, data),
    processRequest: async (id, data) => apiClient.put(`${BASE_URL}/revaluations/${id}/process`, data),
};

// ============================================================================
// ARCHIVE (Phase 8)
// ============================================================================

export const archiveService = {
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/archives${queryString ? `?${queryString}` : ''}`);
    },
    archiveExam: async (examId) => apiClient.post(`${BASE_URL}/archives`, { exam_id: examId }),
    restoreExam: async (id) => apiClient.post(`${BASE_URL}/archives/${id}/restore`),
    download: async (id) => apiClient.get(`${BASE_URL}/archives/${id}/download`),
};

// ============================================================================
// COMPLIANCE (Phase 8)
// ============================================================================

export const complianceService = {
    getReports: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/compliance/reports${queryString ? `?${queryString}` : ''}`);
    },
    generateReport: async (data) => apiClient.post(`${BASE_URL}/compliance/reports`, data),
    downloadReport: async (id) => apiClient.get(`${BASE_URL}/compliance/reports/${id}/download`),
    getAuditTrail: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/compliance/audit-trail${queryString ? `?${queryString}` : ''}`);
    },
};

export default {
    boardConfigService,
    termService,
    examTypeService,
    gradeScaleService,
    examGroupService,
    examService,
    examStudentService,
    // Phase 3
    roomService,
    invigilatorDutyService,
    seatingService,
    examCalendarService,
    // Phase 4
    marksEntryService,
    internalAssessmentService,
    practicalMarksService,
    bulkUploadService,
    // Phase 5
    graceMarksService,
    moderationService,
    resultsService,
    rankingService,
    // Phase 6
    admitCardTemplateService,
    marksheetTemplateService,
    reportCardTemplateService,
    documentGenerationService,
    // Phase 7
    analyticsService,
    questionBankService,
    onlineTestService,
    // Phase 8
    divisionService,
    subjectWeightageService,
    assessmentPatternService,
    examLinkingService,
    questionBlueprintService,
    verificationService,
    revaluationService,
    archiveService,
    complianceService
};
