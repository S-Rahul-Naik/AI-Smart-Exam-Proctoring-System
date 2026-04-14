import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/feature/AdminLayout';
import StatusBadge from '../../../components/base/StatusBadge';
import { getDemoToken } from '../../../utils/examToken';
import ExamEditor from './components/ExamEditor';
import { examAPI } from '../../../services/api';

// Static form fields configuration
const EXAM_FORM_FIELDS = [
  { id: 'title', label: 'Exam Title', placeholder: 'e.g., Advanced Algorithms Final', type: 'text' },
  { id: 'code', label: 'Course Code', placeholder: 'e.g., CS401', type: 'text' },
  { id: 'date', label: 'Exam Date', placeholder: '', type: 'date' },
  { id: 'duration', label: 'Duration (minutes)', placeholder: '120', type: 'number' },
  { id: 'start', label: 'Start Time', placeholder: '', type: 'time' },
  { id: 'end', label: 'End Time', placeholder: '', type: 'time' },
];

// Static exam details items
const EXAM_DETAIL_ITEMS = [
  { id: 'date', icon: 'ri-calendar-line', getVal: (exam) => exam.date },
  { id: 'time', icon: 'ri-time-line', getVal: (exam) => `${exam.startTime} – ${exam.endTime}` },
  { id: 'students', icon: 'ri-team-line', getVal: (exam) => `${exam.totalStudents} students` },
  { id: 'duration', icon: 'ri-timer-line', getVal: (exam) => `${exam.duration} min` },
];

export default function AdminExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [editingExamMetadata, setEditingExamMetadata] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  // Fetch exams from API
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        const response = await examAPI.getExams();
        setExams(response.data.exams || []);
      } catch (error) {
        console.error('Failed to fetch exams:', error);
        setExams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  const filtered = exams.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) || e.courseCode.toLowerCase().includes(search.toLowerCase())
  );

  function copyInviteLink(examId: string) {
    const token = getDemoToken(examId);
    const url = `${window.location.origin}/exam/join?token=${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(examId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  const handleReloadExams = async () => {
    try {
      const response = await examAPI.getExams();
      setExams(response.data.exams || []);
    } catch (error) {
      console.error('Failed to reload exams:', error);
    }
  };

  const handleEditExamMetadata = (exam: any) => {
    setEditingExamMetadata(exam);
    setEditFormData({
      title: exam.title || '',
      courseCode: exam.courseCode || '',
      date: exam.date || '',
      startTime: exam.startTime || '',
      endTime: exam.endTime || '',
      duration: exam.duration || 60,
      description: exam.description || '',
    });
  };

  const handleSaveExamMetadata = async () => {
    if (!editFormData.title || !editFormData.title.trim()) {
      alert('Please enter exam title');
      return;
    }
    if (!editFormData.courseCode || !editFormData.courseCode.trim()) {
      alert('Please enter course code');
      return;
    }
    if (!editFormData.duration || editFormData.duration < 1) {
      alert('Please enter valid duration');
      return;
    }

    try {
      await examAPI.updateExam(editingExamMetadata._id, editFormData);
      alert('Exam updated successfully');
      setEditingExamMetadata(null);
      handleReloadExams();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to update exam';
      alert(`Error: ${errorMsg}`);
    }
  };

  return (
    <AdminLayout title="Exam Management" subtitle="Create, schedule, and manage all proctored exams">
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#4b5563] text-sm" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search exams..."
            className="w-full bg-[#111318] border border-[#1e2330] rounded-lg pl-9 pr-4 py-2.5 text-white text-sm placeholder-[#4b5563] focus:outline-none focus:border-teal-500/50"
          />
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-teal-500 hover:bg-teal-400 text-white font-semibold px-4 py-2.5 rounded-lg text-sm cursor-pointer whitespace-nowrap flex items-center gap-2 transition-colors"
        >
          <i className="ri-add-line" /> Create Exam
        </button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <p className="text-[#6b7280]">Loading exams...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <p className="text-[#6b7280]">{search ? 'No exams found' : 'No exams yet. Create one to get started!'}</p>
          </div>
        ) : (
          filtered.map(exam => (
          <div key={exam.id} className="bg-[#111318] border border-[#1e2330] rounded-xl p-5 hover:border-teal-500/20 transition-all">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-sm mb-0.5 leading-tight">{exam.title}</h3>
                <div className="text-[#4b5563] text-xs font-mono">{exam.courseCode}</div>
              </div>
              <StatusBadge status={exam.status} size="sm" />
            </div>
            <p className="text-[#6b7280] text-xs mb-4 leading-relaxed line-clamp-2">{exam.description}</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {EXAM_DETAIL_ITEMS.map((item) => (
                <div key={item.id} className="flex items-center gap-1.5 text-xs text-[#9ca3af]">
                  <i className={`${item.icon} text-[#4b5563] flex-shrink-0`} />
                  <span className="truncate">{item.getVal(exam)}</span>
                </div>
              ))}
            </div>
            {exam.status === 'active' && (
              <div className="mb-3 p-2 bg-red-500/5 border border-red-500/15 rounded-lg">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-red-400 font-semibold">Live · {exam.activeStudents} active</span>
                  <span className="text-red-400">{exam.highRiskCount} high risk</span>
                </div>
                <div className="h-1 bg-[#1e2330] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full" style={{ width: '60%' }} />
                </div>
              </div>
            )}
            {/* Invite link row */}
            <button
              onClick={() => copyInviteLink(exam._id)}
              className={`w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-lg border cursor-pointer whitespace-nowrap transition-all mb-2 ${
                copiedId === exam._id
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-teal-500/5 border-teal-500/20 text-teal-400 hover:bg-teal-500/10'
              }`}
            >
              <i className={copiedId === exam._id ? 'ri-checkbox-circle-line' : 'ri-links-line'} />
              {copiedId === exam._id ? 'Link Copied!' : 'Copy Student Invite Link'}
            </button>
            <div className="flex items-center gap-2">
              {exam.status === 'active' && (
                <button className="flex-1 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold py-1.5 rounded-lg cursor-pointer whitespace-nowrap hover:bg-teal-500/20 transition-colors">
                  <i className="ri-live-line mr-1" />Monitor
                </button>
              )}
              <button
                onClick={() => setEditingExamId(exam._id)}
                className="flex-1 bg-amber-500/5 border border-amber-500/20 text-amber-400 text-xs font-semibold py-1.5 rounded-lg cursor-pointer whitespace-nowrap hover:bg-amber-500/15 transition-colors"
              >
                <i className="ri-list-check-3 mr-1" />Questions
              </button>
              <button 
                onClick={() => handleEditExamMetadata(exam)}
                className="w-8 h-8 flex items-center justify-center bg-[#1a1d24] border border-[#2d3139] rounded-lg text-[#4b5563] hover:text-white cursor-pointer transition-colors"
              >
                <i className="ri-edit-line text-xs" />
              </button>
            </div>
          </div>
        ))
        )}
      </div>

      {/* Question Editor Modal */}
      {editingExamId && (
        <ExamEditor
          examId={editingExamId}
          onClose={() => setEditingExamId(null)}
          onSave={handleReloadExams}
        />
      )}

      {/* Edit Exam Metadata Modal */}
      {editingExamMetadata && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#111318] border border-[#1e2330] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#1e2330]">
              <h2 className="text-white font-bold text-lg">Edit Exam Details</h2>
              <button onClick={() => setEditingExamMetadata(null)} className="text-[#4b5563] hover:text-white cursor-pointer">
                <i className="ri-close-line text-xl" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">Exam Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Advanced Algorithms Final"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full bg-[#0a0c10] border border-[#2d3139] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#4b5563] focus:outline-none focus:border-teal-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">Course Code</label>
                  <input
                    type="text"
                    placeholder="e.g., CS401"
                    value={editFormData.courseCode}
                    onChange={(e) => setEditFormData({ ...editFormData, courseCode: e.target.value })}
                    className="w-full bg-[#0a0c10] border border-[#2d3139] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#4b5563] focus:outline-none focus:border-teal-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">Exam Date</label>
                  <input
                    type="date"
                    value={editFormData.date}
                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                    className="w-full bg-[#0a0c10] border border-[#2d3139] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#4b5563] focus:outline-none focus:border-teal-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">Duration (minutes)</label>
                  <input
                    type="number"
                    placeholder="120"
                    value={editFormData.duration}
                    min="1"
                    onChange={(e) => setEditFormData({ ...editFormData, duration: parseInt(e.target.value) || 60 })}
                    className="w-full bg-[#0a0c10] border border-[#2d3139] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#4b5563] focus:outline-none focus:border-teal-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">Start Time</label>
                  <input
                    type="time"
                    value={editFormData.startTime}
                    onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                    className="w-full bg-[#0a0c10] border border-[#2d3139] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#4b5563] focus:outline-none focus:border-teal-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">End Time</label>
                  <input
                    type="time"
                    value={editFormData.endTime}
                    onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                    className="w-full bg-[#0a0c10] border border-[#2d3139] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#4b5563] focus:outline-none focus:border-teal-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">Description</label>
                <textarea
                  rows={3}
                  placeholder="Exam description..."
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  maxLength={500}
                  className="w-full bg-[#0a0c10] border border-[#2d3139] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#4b5563] focus:outline-none focus:border-teal-500/50 resize-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 border-t border-[#1e2330]">
              <button onClick={() => setEditingExamMetadata(null)} className="text-[#6b7280] hover:text-white text-sm cursor-pointer whitespace-nowrap">Cancel</button>
              <button
                onClick={handleSaveExamMetadata}
                className="ml-auto bg-teal-500 hover:bg-teal-400 text-white font-semibold px-5 py-2.5 rounded-lg text-sm cursor-pointer whitespace-nowrap transition-colors"
              >
                <i className="ri-check-line mr-1.5" />Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Exam Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#111318] border border-[#1e2330] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#1e2330]">
              <h2 className="text-white font-bold text-lg">Create New Exam</h2>
              <button onClick={() => setShowCreate(false)} className="text-[#4b5563] hover:text-white cursor-pointer">
                <i className="ri-close-line text-xl" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                {EXAM_FORM_FIELDS.map(field => (
                  <div key={field.id}>
                    <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">{field.label}</label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      className="w-full bg-[#0a0c10] border border-[#2d3139] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#4b5563] focus:outline-none focus:border-teal-500/50"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">Description</label>
                <textarea
                  rows={3}
                  placeholder="Exam description..."
                  maxLength={500}
                  className="w-full bg-[#0a0c10] border border-[#2d3139] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#4b5563] focus:outline-none focus:border-teal-500/50 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">Assign Students</label>
                <div className="bg-[#0a0c10] border border-[#2d3139] rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-[#6b7280]">
                    <i className="ri-team-line" />
                    <span>10 students available · Click to assign</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-teal-500/5 border border-teal-500/15 rounded-lg">
                <div className="w-10 h-5 bg-teal-500 rounded-full cursor-pointer relative flex-shrink-0">
                  <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full" />
                </div>
                <span className="text-sm text-[#9ca3af]">Send email invitations with secure exam links</span>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 border-t border-[#1e2330]">
              <button onClick={() => setShowCreate(false)} className="text-[#6b7280] hover:text-white text-sm cursor-pointer whitespace-nowrap">Cancel</button>
              <button
                onClick={() => setShowCreate(false)}
                className="ml-auto bg-teal-500 hover:bg-teal-400 text-white font-semibold px-5 py-2.5 rounded-lg text-sm cursor-pointer whitespace-nowrap transition-colors"
              >
                <i className="ri-mail-send-line mr-1.5" />Create &amp; Send Invitations
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
