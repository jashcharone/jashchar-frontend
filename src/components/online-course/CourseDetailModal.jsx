import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, HelpCircle, Edit, Trash2, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import AddEditSectionModal from './AddEditSectionModal';
import AddEditLessonModal from './AddEditLessonModal';
import AddEditQuizModal from './AddEditQuizModal';
import QuizQuestionsModal from './QuizQuestionsModal';
import OrderSectionModal from './OrderSectionModal';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const CourseDetailModal = ({ isOpen, onClose, course, branchId, onUpdate }) => {
  const { toast } = useToast();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Modal states
  const [sectionModal, setSectionModal] = useState({ open: false, data: null });
  const [lessonModal, setLessonModal] = useState({ open: false, data: null, sectionId: null });
  const [quizModal, setQuizModal] = useState({ open: false, data: null, sectionId: null });
  const [questionsModal, setQuestionsModal] = useState({ open: false, quizId: null });
  const [orderModal, setOrderModal] = useState(false);

  useEffect(() => {
    if (isOpen && course) {
      fetchCourseContent();
    }
  }, [isOpen, course]);

  const fetchCourseContent = async () => {
    setLoading(true);
    // Fetch sections, then lessons and quizzes
    const { data: sectionData } = await supabase.from('course_sections').select('*').eq('course_id', course.id).order('order_index');
    
    if (sectionData) {
      const sectionsWithContent = await Promise.all(sectionData.map(async (section) => {
        const [lessons, quizzes] = await Promise.all([
          supabase.from('course_lessons').select('*').eq('section_id', section.id).order('order_index'),
          supabase.from('course_quizzes').select('*').eq('section_id', section.id).order('order_index')
        ]);
        return { ...section, lessons: lessons.data || [], quizzes: quizzes.data || [] };
      }));
      setSections(sectionsWithContent);
    }
    setLoading(false);
  };

  const togglePublish = async () => {
    setPublishing(true);
    const newStatus = !course.is_published;
    const { error } = await supabase.from('online_courses').update({ is_published: newStatus }).eq('id', course.id);
    if (error) toast({ variant: 'destructive', title: 'Error' });
    else {
      toast({ title: newStatus ? 'Course Published' : 'Course Unpublished' });
      onUpdate(); 
    }
    setPublishing(false);
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Delete this ${type}?`)) return;
    const table = type === 'section' ? 'course_sections' : type === 'lesson' ? 'course_lessons' : 'course_quizzes';
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) toast({ variant: 'destructive', title: 'Error' });
    else {
      toast({ title: 'Deleted successfully' });
      fetchCourseContent();
    }
  };

  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0">
        <div className="p-6 border-b flex justify-between items-center">
          <DialogTitle className="text-xl">Course Detail: {course.title}</DialogTitle>
          <div className="flex gap-2">
            <Button onClick={() => setSectionModal({ open: true, data: null })}><Plus className="mr-2 h-4 w-4" /> Add Section</Button>
            <Button variant="outline" onClick={() => setOrderModal(true)}><GripVertical className="mr-2 h-4 w-4" /> Order Section</Button>
            <Button variant={course.is_published ? "destructive" : "default"} onClick={togglePublish} disabled={publishing}>
              {publishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {course.is_published ? 'Unpublish Course' : 'Publish Course'}
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Side: Details */}
          <ScrollArea className="w-1/3 border-r p-6 bg-slate-50">
            <div className="space-y-4">
              {course.preview_image && <img src={course.preview_image} alt="Preview" className="w-full h-48 object-cover rounded-md border" />}
              <div><h3 className="font-semibold text-sm text-gray-500">Title</h3><p>{course.title}</p></div>
              <div><h3 className="font-semibold text-sm text-gray-500">Description</h3><div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: course.description }} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><h3 className="font-semibold text-sm text-gray-500">Class</h3><p>{course.class?.name || '-'}</p></div>
                <div><h3 className="font-semibold text-sm text-gray-500">Price</h3><p>${course.price} {course.is_free && '(Free)'}</p></div>
                <div><h3 className="font-semibold text-sm text-gray-500">Created By</h3><p>Super Admin</p></div>
                <div><h3 className="font-semibold text-sm text-gray-500">Status</h3><p className={course.is_published ? 'text-green-600' : 'text-yellow-600'}>{course.is_published ? 'Published' : 'Unpublished'}</p></div>
              </div>
              <div><h3 className="font-semibold text-sm text-gray-500">Outcomes</h3><p>{course.outcomes}</p></div>
            </div>
          </ScrollArea>

          {/* Right Side: Content */}
          <ScrollArea className="w-2/3 p-6">
            {loading ? <div className="flex justify-center"><Loader2 className="animate-spin" /></div> : (
              <div className="space-y-4">
                {sections.length === 0 ? <p className="text-center text-muted-foreground">No sections added yet.</p> : 
                  sections.map(section => (
                    <Collapsible key={section.id} defaultOpen className="border rounded-md">
                      <div className="flex items-center justify-between p-3 bg-gray-100 rounded-t-md">
                        <CollapsibleTrigger className="flex items-center font-medium hover:underline">
                          <ChevronRight className="h-4 w-4 mr-2 transition-transform ui-expanded:rotate-90" /> 
                          {section.title}
                        </CollapsibleTrigger>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setLessonModal({ open: true, data: null, sectionId: section.id })} title="Add Lesson"><Plus className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setQuizModal({ open: true, data: null, sectionId: section.id })} title="Add Quiz"><HelpCircle className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setSectionModal({ open: true, data: section })}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete('section', section.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                      <CollapsibleContent className="p-3 space-y-2">
                        {[...section.lessons, ...section.quizzes].sort((a, b) => a.order_index - b.order_index).map(item => (
                          <div key={item.id} className="flex items-center justify-between p-2 bg-white border rounded shadow-sm">
                            <div className="flex items-center gap-2">
                              {item.question ? <HelpCircle className="h-4 w-4 text-orange-500" /> : <div className="h-4 w-4 rounded-full bg-blue-500" />} {/* Simple icon logic */}
                              <span className="text-sm">{item.title}</span>
                              {item.duration && <span className="text-xs text-gray-400 ml-2">({item.duration})</span>}
                            </div>
                            <div className="flex gap-1">
                              {/* Edit Button Logic based on type */}
                              {item.question ? ( // It's a quiz (hacky check, strictly should use type field if merged or separate lists)
                                <>
                                  <Button variant="ghost" size="icon" onClick={() => setQuestionsModal({ open: true, quizId: item.id })} title="Manage Questions"><Plus className="h-3 w-3" /></Button>
                                  <Button variant="ghost" size="icon" onClick={() => setQuizModal({ open: true, data: item, sectionId: section.id })}><Edit className="h-3 w-3" /></Button>
                                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete('quiz', item.id)}><Trash2 className="h-3 w-3" /></Button>
                                </>
                              ) : (
                                <>
                                  <Button variant="ghost" size="icon" onClick={() => setLessonModal({ open: true, data: item, sectionId: section.id })}><Edit className="h-3 w-3" /></Button>
                                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete('lesson', item.id)}><Trash2 className="h-3 w-3" /></Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                        {section.lessons.length === 0 && section.quizzes.length === 0 && <p className="text-xs text-gray-400 ml-6">No content</p>}
                      </CollapsibleContent>
                    </Collapsible>
                  ))
                }
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>

      {/* Sub Modals */}
      <AddEditSectionModal 
        isOpen={sectionModal.open} 
        onClose={() => setSectionModal({ open: false, data: null })} 
        courseId={course.id} branchId={branchId} editData={sectionModal.data}
        onSave={fetchCourseContent}
      />
      <AddEditLessonModal 
        isOpen={lessonModal.open} 
        onClose={() => setLessonModal({ open: false, data: null, sectionId: null })}
        sectionId={lessonModal.sectionId} courseId={course.id} branchId={branchId} editData={lessonModal.data}
        onSave={fetchCourseContent}
      />
      <AddEditQuizModal 
        isOpen={quizModal.open} 
        onClose={() => setQuizModal({ open: false, data: null, sectionId: null })}
        sectionId={quizModal.sectionId} courseId={course.id} branchId={branchId} editData={quizModal.data}
        onSave={fetchCourseContent}
      />
      <QuizQuestionsModal 
        isOpen={questionsModal.open}
        onClose={() => setQuestionsModal({ open: false, quizId: null })}
        quizId={questionsModal.quizId} branchId={branchId}
      />
      <OrderSectionModal 
        isOpen={orderModal}
        onClose={() => setOrderModal(false)}
        sections={sections}
        onSave={fetchCourseContent}
      />
    </Dialog>
  );
};

export default CourseDetailModal;
