import React, { useState, useEffect } from 'react';
import { examAPI } from '../../../../services/api';

interface Question {
  _id?: string;
  number: number;
  question: string;
  type: 'mcq' | 'short-answer' | 'essay' | 'true-false';
  marks: number;
  options?: Array<{ id: string; text: string; isCorrect: boolean }>;
  difficulty?: 'easy' | 'medium' | 'hard';
  explanation?: string;
}

interface ExamEditorProps {
  examId: string;
  onClose: () => void;
  onSave: () => void;
}

export default function ExamEditor({ examId, onClose, onSave }: ExamEditorProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exam, setExam] = useState<any>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalMarks, setTotalMarks] = useState(0);

  useEffect(() => {
    loadExamData();
  }, [examId]);

  const loadExamData = async () => {
    try {
      setLoading(true);
      const examRes = await examAPI.getExamById(examId);
      setExam(examRes.data.exam);

      const questionsRes = await examAPI.getExamQuestions(examId);
      setQuestions(questionsRes.data.questions || []);
      
      const total = (questionsRes.data.questions || []).reduce((sum, q) => sum + q.marks, 0);
      setTotalMarks(total);
    } catch (error) {
      console.error('Error loading exam data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (newQuestion: Question) => {
    try {
      // Validate required fields
      if (!newQuestion.question || newQuestion.question.trim() === '') {
        alert('Please enter question text');
        return;
      }
      if (!newQuestion.marks || newQuestion.marks < 1) {
        alert('Please enter valid marks');
        return;
      }

      // Ensure marks is a number
      const questionData = {
        ...newQuestion,
        marks: parseInt(String(newQuestion.marks), 10)
      };

      const response = await examAPI.createQuestion(examId, questionData);
      setQuestions([...questions, response.data.question]);
      setTotalMarks(totalMarks + questionData.marks);
      setIsAddingQuestion(false);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to create question';
      alert(`Error: ${errorMsg}`);
      console.error('Error creating question:', error);
    }
  };

  const handleUpdateQuestion = async (updatedQuestion: Question) => {
    try {
      if (!updatedQuestion.question || updatedQuestion.question.trim() === '') {
        alert('Please enter question text');
        return;
      }
      if (!updatedQuestion.marks || updatedQuestion.marks < 1) {
        alert('Please enter valid marks');
        return;
      }

      const questionData = {
        ...updatedQuestion,
        marks: parseInt(String(updatedQuestion.marks), 10)
      };

      const response = await examAPI.updateQuestion(examId, updatedQuestion._id!, questionData);
      setQuestions(questions.map(q => q._id === updatedQuestion._id ? response.data.question : q));
      setSelectedQuestion(null);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to update question';
      alert(`Error: ${errorMsg}`);
      console.error('Error updating question:', error);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      try {
        await examAPI.deleteQuestion(examId, questionId);
        const deletedQ = questions.find(q => q._id === questionId);
        setQuestions(questions.filter(q => q._id !== questionId));
        if (deletedQ) setTotalMarks(totalMarks - deletedQ.marks);
      } catch (error) {
        console.error('Error deleting question:', error);
      }
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#111318] border border-[#1e2330] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0a0c10] border-b border-[#1e2330] p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{exam?.title}</h2>
            <p className="text-sm text-[#6b7280]">{exam?.code}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#4b5563] hover:text-white"
          >
            <i className="ri-close-line text-2xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-[#0a0c10] border border-[#1e2330] rounded-lg p-4">
              <div className="text-[#6b7280] text-xs font-semibold uppercase">Questions</div>
              <div className="text-2xl font-bold text-teal-400">{questions.length}</div>
            </div>
            <div className="bg-[#0a0c10] border border-[#1e2330] rounded-lg p-4">
              <div className="text-[#6b7280] text-xs font-semibold uppercase">Total Marks</div>
              <div className="text-2xl font-bold text-orange-400">{totalMarks}</div>
            </div>
            <div className="bg-[#0a0c10] border border-[#1e2330] rounded-lg p-4">
              <div className="text-[#6b7280] text-xs font-semibold uppercase">Exam Marks</div>
              <div className="text-2xl font-bold text-blue-400">{exam?.totalMarks}</div>
            </div>
            <div className="bg-[#0a0c10] border border-[#1e2330] rounded-lg p-4">
              <div className="text-[#6b7280] text-xs font-semibold uppercase">Status</div>
              <div className={`text-lg font-bold ${exam?.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                {exam?.status}
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Questions</h3>
              <button
                onClick={() => setIsAddingQuestion(true)}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                <i className="ri-add-line mr-1" />
                Add Question
              </button>
            </div>

            {isAddingQuestion && (
              <QuestionForm
                question={null}
                examMarks={exam?.totalMarks}
                onSave={handleAddQuestion}
                onCancel={() => setIsAddingQuestion(false)}
              />
            )}

            <div className="space-y-3">
              {questions.map((q) => (
                <div
                  key={q._id}
                  className="bg-[#0a0c10] border border-[#1e2330] rounded-lg p-4 hover:border-[#2d3340] transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-teal-500/20 rounded-lg px-3 py-2 min-w-12 text-center">
                      <div className="font-bold text-teal-400">{q.number}</div>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold truncate">{q.question}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs bg-[#1e2330] text-[#6b7280] px-2 py-1 rounded">
                          {q.type}
                        </span>
                        <span className="text-xs bg-orange-500/15 text-orange-400 px-2 py-1 rounded">
                          {q.marks} marks
                        </span>
                        {q.difficulty && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            q.difficulty === 'easy' ? 'bg-green-500/15 text-green-400' :
                            q.difficulty === 'medium' ? 'bg-yellow-500/15 text-yellow-400' :
                            'bg-red-500/15 text-red-400'
                          }`}>
                            {q.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedQuestion(q)}
                        className="p-2 hover:bg-[#1e2330] rounded-lg transition-colors text-blue-400"
                        title="Edit"
                      >
                        <i className="ri-edit-line text-lg" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q._id!)}
                        className="p-2 hover:bg-red-500/15 rounded-lg transition-colors text-red-400"
                        title="Delete"
                      >
                        <i className="ri-delete-bin-line text-lg" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {questions.length === 0 && !isAddingQuestion && (
              <div className="text-center py-12 text-[#6b7280]">
                <i className="ri-file-missing-line text-3xl mb-2 block" />
                <p>No questions yet. Add your first question to get started!</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-[#1e2330] bg-[#0a0c10] p-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#1e2330] text-[#6b7280] hover:text-white rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onSave();
              onClose();
            }}
            className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>

      {/* Question Editor Modal */}
      {selectedQuestion && (
        <QuestionEditorModal
          question={selectedQuestion}
          onSave={handleUpdateQuestion}
          onClose={() => setSelectedQuestion(null)}
        />
      )}
    </div>
  );
}

interface QuestionFormProps {
  question?: Question;
  examMarks?: number;
  onSave: (question: Question) => void;
  onCancel: () => void;
}

function QuestionForm({ question, examMarks, onSave, onCancel }: QuestionFormProps) {
  const [formData, setFormData] = useState<Question>(question || {
    number: 0,
    question: '',
    type: 'mcq',
    marks: 1,
    difficulty: 'medium',
    options: [{ id: '1', text: '', isCorrect: false }],
  });

  const handleSubmit = () => {
    if (!formData.question || !formData.question.trim()) {
      alert('Please enter question text');
      return;
    }
    if (!formData.marks || formData.marks < 1) {
      alert('Please enter marks (minimum 1)');
      return;
    }

    // Ensure marks is a number
    const submittedData = {
      ...formData,
      marks: parseInt(String(formData.marks), 10),
      question: formData.question.trim()
    };

    onSave(submittedData);
    setFormData({
      question: '',
      type: 'mcq',
      marks: 1,
      difficulty: 'medium',
      options: [{ id: '1', text: '', isCorrect: false }],
    });
  };

  return (
    <div className="bg-[#0a0c10] border border-teal-500/30 rounded-lg p-4 mb-4">
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Question text"
          value={formData.question}
          onChange={(e) => setFormData({ ...formData, question: e.target.value })}
          className="w-full bg-[#1e2330] border border-[#2d3340] text-white px-3 py-2 rounded-lg focus:outline-none focus:border-teal-500"
        />
        <div className="grid grid-cols-3 gap-3">
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="bg-[#1e2330] border border-[#2d3340] text-white px-3 py-2 rounded-lg focus:outline-none focus:border-teal-500"
          >
            <option value="mcq">MCQ</option>
            <option value="short-answer">Short Answer</option>
            <option value="essay">Essay</option>
            <option value="true-false">True/False</option>
          </select>
          <input
            type="number"
            placeholder="Marks"
            value={formData.marks || 1}
            min="1"
            onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) || 1 })}
            className="bg-[#1e2330] border border-[#2d3340] text-white px-3 py-2 rounded-lg focus:outline-none focus:border-teal-500"
          />
          <select
            value={formData.difficulty}
            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
            className="bg-[#1e2330] border border-[#2d3340] text-white px-3 py-2 rounded-lg focus:outline-none focus:border-teal-500"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition-colors"
          >
            Save Question
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-[#1e2330] text-[#6b7280] hover:text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

interface QuestionEditorModalProps {
  question: Question;
  onSave: (question: Question) => void;
  onClose: () => void;
}

function QuestionEditorModal({ question, onSave, onClose }: QuestionEditorModalProps) {
  const [formData, setFormData] = useState<Question>(question);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
      <div className="bg-[#111318] border border-[#1e2330] rounded-xl w-full max-w-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Edit Question</h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Question text"
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            className="w-full bg-[#0a0c10] border border-[#2d3340] text-white px-3 py-2 rounded-lg focus:outline-none focus:border-teal-500"
          />
          <div className="grid grid-cols-3 gap-3">
            <input
              type="number"
              placeholder="Marks"
              value={formData.marks || 1}
              onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) || 1 })}
              className="bg-[#0a0c10] border border-[#2d3340] text-white px-3 py-2 rounded-lg"
            />
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              className="bg-[#0a0c10] border border-[#2d3340] text-white px-3 py-2 rounded-lg"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <textarea
            placeholder="Explanation (optional)"
            value={formData.explanation || ''}
            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
            className="w-full bg-[#0a0c10] border border-[#2d3340] text-white px-3 py-2 rounded-lg focus:outline-none focus:border-teal-500 min-h-24"
          />
        </div>
        <div className="flex gap-2 mt-6">
          <button
            onClick={() => {
              onSave(formData);
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#1e2330] text-[#6b7280] hover:text-white rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
