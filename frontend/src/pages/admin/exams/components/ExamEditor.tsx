import React, { useState, useEffect } from 'react';
import { examAPI } from '../../../../services/api';

interface Question {
  _id?: string;
  number: number;
  question: string;
  type: 'mcq' | 'true-false';
  marks: number;
  options?: Array<{ id: string; text: string; isCorrect: boolean }>;
  correctAnswer?: string;
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadExamData();
  }, [examId, refreshTrigger]);

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

      await examAPI.createQuestion(examId, questionData);
      await loadExamData();
      setIsAddingQuestion(false);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to create question';
      alert(`Error: ${errorMsg}`);
      console.error('Error creating question:', error);
      throw error;
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

      await examAPI.updateQuestion(examId, updatedQuestion._id!, questionData);
      await loadExamData();
      setSelectedQuestion(null);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to update question';
      alert(`Error: ${errorMsg}`);
      console.error('Error updating question:', error);
      throw error;
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      try {
        await examAPI.deleteQuestion(examId, questionId);
        await loadExamData();
      } catch (error) {
        console.error('Error deleting question:', error);
      }
    }
  };

  const getSelectedAnswerText = (question: Question) => {
    if (question.options?.length) {
      const correctOption = question.options.find((option) => option.isCorrect);
      if (correctOption?.text) {
        return correctOption.text;
      }
    }

    if (question.correctAnswer) {
      return question.correctAnswer;
    }

    return 'Not set';
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
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#0a0c10] border border-[#1e2330] rounded-lg p-4">
              <div className="text-[#6b7280] text-xs font-semibold uppercase">Questions</div>
              <div className="text-2xl font-bold text-teal-400">{questions.length}</div>
            </div>
            <div className="bg-[#0a0c10] border border-[#1e2330] rounded-lg p-4">
              <div className="text-[#6b7280] text-xs font-semibold uppercase">Total Marks</div>
              <div className="text-2xl font-bold text-orange-400">{totalMarks}</div>
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
                      <p className="text-xs mt-2 text-[#9ca3af]">
                        Selected Answer:{' '}
                        <span className="text-teal-400 font-semibold">{getSelectedAnswerText(q)}</span>
                      </p>
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
  onSave: (question: Question) => void | Promise<void>;
  onCancel: () => void;
}

function QuestionForm({ question, examMarks, onSave, onCancel }: QuestionFormProps) {
  const [formData, setFormData] = useState<Question>(question || {
    number: 0,
    question: '',
    type: 'mcq',
    marks: 1,
    difficulty: 'medium',
    options: [
      { id: '1', text: '', isCorrect: false },
      { id: '2', text: '', isCorrect: false },
    ],
  });

  const [numOptions, setNumOptions] = useState(
    question?.options?.length || 2
  );
  const [isSaving, setIsSaving] = useState(false);

  // Update number of options for MCQ
  const updateNumOptions = (newNum: number) => {
    if (newNum < 2) newNum = 2;
    if (newNum > 10) newNum = 10;
    
    setNumOptions(newNum);
    
    const currentOptions = formData.options || [];
    let updatedOptions = [...currentOptions];
    
    if (newNum > updatedOptions.length) {
      // Add new options
      for (let i = updatedOptions.length; i < newNum; i++) {
        updatedOptions.push({ id: String(i + 1), text: '', isCorrect: false });
      }
    } else if (newNum < updatedOptions.length) {
      // Remove options
      updatedOptions = updatedOptions.slice(0, newNum);
    }
    
    setFormData({ ...formData, options: updatedOptions });
  };

  // Update option text
  const updateOptionText = (index: number, text: string) => {
    const updatedOptions = [...(formData.options || [])];
    updatedOptions[index].text = text;
    setFormData({ ...formData, options: updatedOptions });
  };

  // Set correct answer
  const setCorrectAnswer = (index: number) => {
    const updatedOptions = (formData.options || []).map((opt, idx) => ({
      ...opt,
      isCorrect: idx === index,
    }));
    setFormData({ ...formData, options: updatedOptions });
  };

  const handleSubmit = async () => {
    if (isSaving) return;

    if (!formData.question || !formData.question.trim()) {
      alert('Please enter question text');
      return;
    }
    if (!formData.marks || formData.marks < 1) {
      alert('Please enter marks (minimum 1)');
      return;
    }

    // Validate MCQ
    if (formData.type === 'mcq') {
      const filledOptions = (formData.options || []).filter(opt => opt.text.trim());
      if (filledOptions.length < 2) {
        alert('MCQ must have at least 2 options');
        return;
      }
      const correctCount = filledOptions.filter(opt => opt.isCorrect).length;
      if (correctCount !== 1) {
        alert('MCQ must have exactly 1 correct option');
        return;
      }
    }

    // Validate True/False
    if (formData.type === 'true-false') {
      const correctCount = (formData.options || []).filter(opt => opt.isCorrect).length;
      if (correctCount !== 1) {
        alert('True/False question must have exactly 1 correct answer. Please select either True or False as the correct answer.');
        return;
      }
    }

    // Ensure marks is a number
    const submittedData = {
      ...formData,
      marks: parseInt(String(formData.marks), 10),
      question: formData.question.trim(),
      options: formData.type === 'mcq' 
        ? (formData.options || []).filter(opt => opt.text.trim())
        : formData.options,
      correctAnswer:
        formData.type === 'true-false'
          ? String((formData.options || []).find(opt => opt.isCorrect)?.text || '').toLowerCase()
          : undefined,
    };

    setIsSaving(true);
    try {
      await onSave(submittedData);
      setFormData({
        question: '',
        type: 'mcq',
        marks: 1,
        difficulty: 'medium',
        options: [
          { id: '1', text: '', isCorrect: false },
          { id: '2', text: '', isCorrect: false },
        ],
      });
      setNumOptions(2);
    } finally {
      setIsSaving(false);
    }
  };

  const isMCQ = formData.type === 'mcq';

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
            onChange={(e) => {
              const newType = e.target.value;
              setFormData({ ...formData, type: newType });
              if (newType === 'true-false') {
                setFormData({
                  ...formData,
                  type: newType,
                  options: [
                    { id: '1', text: 'True', isCorrect: true },
                    { id: '2', text: 'False', isCorrect: false },
                  ],
                });
                setNumOptions(2);
              }
            }}
            className="bg-[#1e2330] border border-[#2d3340] text-white px-3 py-2 rounded-lg focus:outline-none focus:border-teal-500"
          >
            <option value="mcq">MCQ (Multiple Choice)</option>
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

        {/* MCQ Options Section */}
        {isMCQ && (
          <div className="bg-[#111318] border border-[#2d3340] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-[#9ca3af]">Number of Options</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateNumOptions(numOptions - 1)}
                  className="px-2 py-1 bg-[#1e2330] text-white rounded hover:bg-[#2d3340]"
                >
                  −
                </button>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={numOptions}
                  onChange={(e) => updateNumOptions(parseInt(e.target.value) || 2)}
                  className="w-12 bg-[#1e2330] border border-[#2d3340] text-white px-2 py-1 rounded text-center focus:outline-none focus:border-teal-500"
                />
                <button
                  onClick={() => updateNumOptions(numOptions + 1)}
                  className="px-2 py-1 bg-[#1e2330] text-white rounded hover:bg-[#2d3340]"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {(formData.options || []).map((option, index) => (
                <div key={option.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct-answer"
                    checked={option.isCorrect}
                    onChange={() => setCorrectAnswer(index)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <input
                    type="text"
                    placeholder={`Option ${index + 1}`}
                    value={option.text}
                    onChange={(e) => updateOptionText(index, e.target.value)}
                    className="flex-1 bg-[#1e2330] border border-[#2d3340] text-white px-3 py-2 rounded-lg focus:outline-none focus:border-teal-500 text-sm"
                  />
                  {option.isCorrect && (
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                      ✓ Correct
                    </span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-[#6b7280] mt-2">Select the radio button to mark the correct answer</p>
          </div>
        )}

        {/* True/False Section */}
        {!isMCQ && formData.type === 'true-false' && (
          <div className="bg-[#111318] border border-[#2d3340] rounded-lg p-4 space-y-3">
            <label className="text-sm font-semibold text-[#9ca3af]">Select Correct Answer</label>
            <div className="space-y-2">
              {(formData.options || []).map((option, index) => (
                <div key={option.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="true-false-answer"
                    checked={option.isCorrect}
                    onChange={() => setCorrectAnswer(index)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <label className="flex-1 text-white cursor-pointer font-medium">
                    {option.text}
                  </label>
                  {option.isCorrect && (
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                      ✓ Correct
                    </span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-[#6b7280] mt-2">Select True or False as the correct answer</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-[#4b5563] text-white rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Question'}
          </button>
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-2 border border-[#1e2330] text-[#6b7280] hover:text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
  onSave: (question: Question) => void | Promise<void>;
  onClose: () => void;
}

function QuestionEditorModal({ question, onSave, onClose }: QuestionEditorModalProps) {
  const [formData, setFormData] = useState<Question>(question);
  const [numOptions, setNumOptions] = useState(
    question?.options?.length || 2
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (question?.type === 'true-false' && question.options?.length) {
      const hasCorrectAnswer = question.options.some(option => option.isCorrect);
      if (!hasCorrectAnswer) {
        setFormData({
          ...question,
          options: question.options.map((option, index) => ({
            ...option,
            isCorrect: index === 0,
          })),
        });
      }
    }
  }, [question]);

  // Update number of options for MCQ
  const updateNumOptions = (newNum: number) => {
    if (newNum < 2) newNum = 2;
    if (newNum > 10) newNum = 10;
    
    setNumOptions(newNum);
    
    const currentOptions = formData.options || [];
    let updatedOptions = [...currentOptions];
    
    if (newNum > updatedOptions.length) {
      // Add new options
      for (let i = updatedOptions.length; i < newNum; i++) {
        updatedOptions.push({ id: String(i + 1), text: '', isCorrect: false });
      }
    } else if (newNum < updatedOptions.length) {
      // Remove options
      updatedOptions = updatedOptions.slice(0, newNum);
    }
    
    setFormData({ ...formData, options: updatedOptions });
  };

  // Update option text
  const updateOptionText = (index: number, text: string) => {
    const updatedOptions = [...(formData.options || [])];
    updatedOptions[index].text = text;
    setFormData({ ...formData, options: updatedOptions });
  };

  // Set correct answer
  const setCorrectAnswer = (index: number) => {
    const updatedOptions = (formData.options || []).map((opt, idx) => ({
      ...opt,
      isCorrect: idx === index,
    }));
    setFormData({ ...formData, options: updatedOptions });
  };

  const isMCQ = formData.type === 'mcq';

  const handleSave = async () => {
    if (isSaving) return;

    if (!formData.question || !formData.question.trim()) {
      alert('Please enter question text');
      return;
    }
    if (!formData.marks || formData.marks < 1) {
      alert('Please enter marks (minimum 1)');
      return;
    }

    // Validate MCQ
    if (isMCQ) {
      const filledOptions = (formData.options || []).filter(opt => opt.text.trim());
      if (filledOptions.length < 2) {
        alert('MCQ must have at least 2 options');
        return;
      }
      const correctCount = filledOptions.filter(opt => opt.isCorrect).length;
      if (correctCount !== 1) {
        alert('MCQ must have exactly 1 correct option');
        return;
      }
    }

    const submittedData = {
      ...formData,
      marks: parseInt(String(formData.marks), 10),
      question: formData.question.trim(),
      options: isMCQ
        ? (formData.options || []).filter(opt => opt.text.trim())
        : formData.options,
      correctAnswer:
        formData.type === 'true-false'
          ? String((formData.options || []).find(opt => opt.isCorrect)?.text || '').toLowerCase()
          : undefined,
    };

    setIsSaving(true);
    try {
      await onSave(submittedData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
      <div className="bg-[#111318] border border-[#1e2330] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
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
              min="1"
              onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) || 1 })}
              className="bg-[#0a0c10] border border-[#2d3340] text-white px-3 py-2 rounded-lg"
            />
            <select
              value={formData.type || 'mcq'}
              onChange={(e) => {
                const newType = e.target.value;
                setFormData({ ...formData, type: newType });
                if (newType === 'true-false') {
                  setFormData({
                    ...formData,
                    type: newType,
                    options: [
                      { id: '1', text: 'True', isCorrect: false },
                      { id: '2', text: 'False', isCorrect: false },
                    ],
                  });
                  setNumOptions(2);
                }
              }}
              className="bg-[#0a0c10] border border-[#2d3340] text-white px-3 py-2 rounded-lg"
            >
              <option value="mcq">MCQ</option>
              <option value="short-answer">Short Answer</option>
              <option value="essay">Essay</option>
              <option value="true-false">True/False</option>
            </select>
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

          {/* MCQ Options Section */}
          {isMCQ && (
            <div className="bg-[#0a0c10] border border-[#2d3340] rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-[#9ca3af]">Number of Options</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateNumOptions(numOptions - 1)}
                    className="px-2 py-1 bg-[#1e2330] text-white rounded hover:bg-[#2d3340]"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={numOptions}
                    onChange={(e) => updateNumOptions(parseInt(e.target.value) || 2)}
                    className="w-12 bg-[#1e2330] border border-[#2d3340] text-white px-2 py-1 rounded text-center focus:outline-none focus:border-teal-500"
                  />
                  <button
                    onClick={() => updateNumOptions(numOptions + 1)}
                    className="px-2 py-1 bg-[#1e2330] text-white rounded hover:bg-[#2d3340]"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {(formData.options || []).map((option, index) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct-answer"
                      checked={option.isCorrect}
                      onChange={() => setCorrectAnswer(index)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <input
                      type="text"
                      placeholder={`Option ${index + 1}`}
                      value={option.text}
                      onChange={(e) => updateOptionText(index, e.target.value)}
                      className="flex-1 bg-[#1e2330] border border-[#2d3340] text-white px-3 py-2 rounded-lg focus:outline-none focus:border-teal-500 text-sm"
                    />
                    {option.isCorrect && (
                      <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                        ✓ Correct
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#6b7280] mt-2">Select the radio button to mark the correct answer</p>
            </div>
          )}

          <textarea
            placeholder="Explanation (optional)"
            value={formData.explanation || ''}
            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
            className="w-full bg-[#0a0c10] border border-[#2d3340] text-white px-3 py-2 rounded-lg focus:outline-none focus:border-teal-500 min-h-20"
          />
        </div>
        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSave}
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
