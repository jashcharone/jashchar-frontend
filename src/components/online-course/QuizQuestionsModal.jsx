import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Trash2 } from 'lucide-react';

const QuizQuestionsModal = ({ isOpen, onClose, quizId, branchId }) => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    question: '',
    option_a: '', option_b: '', option_c: '', option_d: '', option_e: '',
    correct_answers: []
  });

  useEffect(() => {
    if (isOpen && quizId) {
      fetchQuestions();
    }
  }, [isOpen, quizId]);

  const fetchQuestions = async () => {
    setLoading(true);
    const { data } = await supabase.from('quiz_questions').select('*').eq('quiz_id', quizId).order('created_at');
    setQuestions(data || []);
    setLoading(false);
  };

  const handleCheckboxChange = (option) => {
    setFormData(prev => {
      const newAnswers = prev.correct_answers.includes(option)
        ? prev.correct_answers.filter(a => a !== option)
        : [...prev.correct_answers, option];
      return { ...prev, correct_answers: newAnswers };
    });
  };

  const handleAddQuestion = async () => {
    if (!formData.question || !formData.option_a || !formData.option_b) {
      return toast({ variant: 'destructive', title: 'Question and first 2 options required' });
    }
    if (formData.correct_answers.length === 0) {
      return toast({ variant: 'destructive', title: 'Select at least one correct answer' });
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('quiz_questions').insert({
        ...formData,
        quiz_id: quizId,
        branch_id: branchId
      });
      if (error) throw error;
      
      toast({ title: 'Question added' });
      setFormData({ question: '', option_a: '', option_b: '', option_c: '', option_d: '', option_e: '', correct_answers: [] });
      fetchQuestions();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('quiz_questions').delete().eq('id', id);
    if (!error) fetchQuestions();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader><DialogTitle>Manage Quiz Questions</DialogTitle></DialogHeader>
        <div className="flex flex-1 gap-6 overflow-hidden">
          {/* Add Question Form */}
          <div className="w-1/2 overflow-y-auto pr-2 border-r">
            <h3 className="font-semibold mb-4">Add Question</h3>
            <div className="space-y-3">
              <div className="space-y-1"><Label>Question *</Label><Input value={formData.question} onChange={e => setFormData({...formData, question: e.target.value})} /></div>
              {['a', 'b', 'c', 'd', 'e'].map(opt => (
                <div key={opt} className="flex items-center gap-2">
                  <Checkbox 
                    id={`opt-${opt}`} 
                    checked={formData.correct_answers.includes(`option_${opt}`)}
                    onCheckedChange={() => handleCheckboxChange(`option_${opt}`)}
                  />
                  <div className="flex-1 space-y-1">
                    <Label htmlFor={`opt-${opt}`}>Option {opt.toUpperCase()} {['a','b'].includes(opt) && '*'}</Label>
                    <Input value={formData[`option_${opt}`]} onChange={e => setFormData({...formData, [`option_${opt}`]: e.target.value})} />
                  </div>
                </div>
              ))}
              <Button onClick={handleAddQuestion} className="w-full mt-4" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add Question</Button>
            </div>
          </div>

          {/* Question List */}
          <div className="w-1/2 pl-2">
            <h3 className="font-semibold mb-4">Question List</h3>
            <ScrollArea className="h-full">
              {loading ? <Loader2 className="mx-auto animate-spin" /> : questions.length === 0 ? <p className="text-muted-foreground text-center">No questions yet</p> : (
                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="p-3 border rounded bg-slate-50 relative">
                      <Button variant="ghost" size="icon" className="absolute top-1 right-1 text-red-500 h-6 w-6" onClick={() => handleDelete(q.id)}><Trash2 className="h-3 w-3" /></Button>
                      <p className="font-medium pr-6">Q{idx+1}: {q.question}</p>
                      <ul className="mt-2 text-sm space-y-1">
                        {['a','b','c','d','e'].map(opt => q[`option_${opt}`] && (
                          <li key={opt} className={q.correct_answers?.includes(`option_${opt}`) ? 'text-green-600 font-semibold' : ''}>
                            {opt.toUpperCase()}: {q[`option_${opt}`]}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuizQuestionsModal;
