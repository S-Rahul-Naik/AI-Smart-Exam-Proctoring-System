import { useState, useMemo } from 'react';
import { mockExams } from '../../../../mocks/exams';
import { mockStudents } from '../../../../mocks/students';

interface Props {
  onClose: () => void;
  onSent: (count: number, examTitle: string) => void;
}

type Step = 'configure' | 'preview' | 'sending' | 'done';

function buildPreviewToken(examId: string) {
  return btoa(JSON.stringify({ examId, studentId: '[student_id]', ts: Date.now() })).substring(0, 32) + '...';
}

export default function BulkInvitationModal({ onClose, onSent }: Props) {
  const [step, setStep] = useState<Step>('configure');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProgram, setFilterProgram] = useState('all');
  const [sendProgress, setSendProgress] = useState(0);

  const selectedExam = mockExams.find(e => e.id === selectedExamId);

  const programs = useMemo(() => {
    const set = new Set(mockStudents.map(s => s.program));
    return Array.from(set);
  }, []);

  const filteredStudents = useMemo(() => {
    return mockStudents.filter(s => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProgram = filterProgram === 'all' || s.program === filterProgram;
      return matchesSearch && matchesProgram;
    });
  }, [searchQuery, filterProgram]);

  const selectedStudents = mockStudents.filter(s => selectedStudentIds.includes(s.id));

  const allFilteredSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every(s => selectedStudentIds.includes(s.id));

  const toggleStudent = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelectedStudentIds(prev => prev.filter(id => !filteredStudents.some(s => s.id === id)));
    } else {
      const toAdd = filteredStudents.map(s => s.id).filter(id => !selectedStudentIds.includes(id));
      setSelectedStudentIds(prev => [...prev, ...toAdd]);
    }
  };

  const canProceed = selectedExamId && selectedStudentIds.length > 0;

  const handleSend = () => {
    setStep('sending');
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        setSendProgress(100);
        clearInterval(interval);
        setTimeout(() => {
          setStep('done');
          onSent(selectedStudentIds.length, selectedExam?.title ?? '');
        }, 400);
      } else {
        setSendProgress(progress);
      }
    }, 120);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[#0f1117] border border-[#1e2330] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2330] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-teal-500/15">
              <i className="ri-mail-send-line text-teal-400 text-base" />
            </div>
            <div>
              <div className="text-white text-sm font-bold">Send Bulk Invitation</div>
              <div className="text-[#4b5563] text-xs">
                {step === 'configure' && 'Select exam and students'}
                {step === 'preview' && 'Preview before sending'}
                {step === 'sending' && 'Sending invitations...'}
                {step === 'done' && 'Invitations sent!'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#4b5563] hover:text-white hover:bg-[#1a1d24] transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-base" />
          </button>
        </div>

        {/* Step indicator */}
        {step !== 'sending' && step !== 'done' && (
          <div className="flex items-center gap-2 px-6 py-3 border-b border-[#1e2330] flex-shrink-0">
            {(['configure', 'preview'] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && <div className="w-8 h-px bg-[#1e2330]" />}
                <div className={`flex items-center gap-1.5 text-xs font-medium ${step === s ? 'text-teal-400' : (step === 'preview' && s === 'configure') ? 'text-[#9ca3af]' : 'text-[#4b5563]'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step === s ? 'bg-teal-500 text-white' : (step === 'preview' && s === 'configure') ? 'bg-[#1e2330] text-[#9ca3af]' : 'bg-[#1e2330] text-[#4b5563]'}`}>
                    {step === 'preview' && s === 'configure' ? <i className="ri-check-line" /> : i + 1}
                  </div>
                  {s === 'configure' ? 'Configure' : 'Preview & Send'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ---- STEP: CONFIGURE ---- */}
          {step === 'configure' && (
            <div className="p-6 space-y-5">
              {/* Exam selector */}
              <div>
                <label className="text-[#9ca3af] text-xs font-semibold uppercase tracking-wider mb-2 block">Select Exam</label>
                <div className="space-y-2">
                  {mockExams.filter(e => e.status !== 'completed').map(exam => (
                    <button
                      key={exam.id}
                      onClick={() => setSelectedExamId(exam.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all cursor-pointer ${selectedExamId === exam.id ? 'border-teal-500/50 bg-teal-500/8' : 'border-[#1e2330] bg-[#111318] hover:border-[#2d3139]'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedExamId === exam.id ? 'border-teal-400 bg-teal-400' : 'border-[#4b5563]'}`}>
                            {selectedExamId === exam.id && <div className="w-1.5 h-1.5 rounded-full bg-[#0f1117]" />}
                          </div>
                          <div>
                            <div className="text-white text-sm font-medium">{exam.title}</div>
                            <div className="text-[#4b5563] text-xs">{exam.courseCode} · {exam.date} at {exam.startTime}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${exam.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                            {exam.status}
                          </span>
                          <span className="text-[#4b5563] text-xs">{exam.totalStudents} students</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Student selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[#9ca3af] text-xs font-semibold uppercase tracking-wider">Select Students</label>
                  {selectedStudentIds.length > 0 && (
                    <span className="text-teal-400 text-xs font-medium">{selectedStudentIds.length} selected</span>
                  )}
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-3">
                  <div className="relative flex-1">
                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#4b5563] text-sm" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-[#111318] border border-[#1e2330] rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-teal-500/50"
                    />
                  </div>
                  <select
                    value={filterProgram}
                    onChange={e => setFilterProgram(e.target.value)}
                    className="bg-[#111318] border border-[#1e2330] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500/50 cursor-pointer"
                  >
                    <option value="all">All Programs</option>
                    {programs.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* Toggle all */}
                <div className="flex items-center gap-2 mb-2 px-1">
                  <button
                    onClick={toggleAll}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-all ${allFilteredSelected ? 'border-teal-400 bg-teal-400' : 'border-[#4b5563]'}`}
                  >
                    {allFilteredSelected && <i className="ri-check-line text-[#0f1117] text-xs" />}
                  </button>
                  <span className="text-[#6b7280] text-xs">Select all visible ({filteredStudents.length})</span>
                </div>

                {/* Student list */}
                <div className="border border-[#1e2330] rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                  {filteredStudents.map((student, i) => (
                    <button
                      key={student.id}
                      onClick={() => toggleStudent(student.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer ${i < filteredStudents.length - 1 ? 'border-b border-[#1e2330]' : ''} ${selectedStudentIds.includes(student.id) ? 'bg-teal-500/5' : 'hover:bg-[#1a1d24]'}`}
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${selectedStudentIds.includes(student.id) ? 'border-teal-400 bg-teal-400' : 'border-[#4b5563]'}`}>
                        {selectedStudentIds.includes(student.id) && <i className="ri-check-line text-[#0f1117] text-xs" />}
                      </div>
                      <img src={student.avatar} alt={student.name} className="w-7 h-7 rounded-full object-top flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{student.name}</div>
                        <div className="text-[#4b5563] text-xs truncate">{student.email}</div>
                      </div>
                      <div className="text-[#6b7280] text-xs flex-shrink-0">{student.program}</div>
                    </button>
                  ))}
                  {filteredStudents.length === 0 && (
                    <div className="py-8 text-center text-[#4b5563] text-sm">No students match your search</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ---- STEP: PREVIEW ---- */}
          {step === 'preview' && selectedExam && (
            <div className="p-6 space-y-5">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Exam', value: selectedExam.courseCode, icon: 'ri-book-open-line', color: 'text-teal-400' },
                  { label: 'Recipients', value: `${selectedStudentIds.length} students`, icon: 'ri-group-line', color: 'text-emerald-400' },
                  { label: 'Exam Date', value: selectedExam.date, icon: 'ri-calendar-line', color: 'text-amber-400' },
                ].map(item => (
                  <div key={item.label} className="bg-[#111318] border border-[#1e2330] rounded-xl p-3 text-center">
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a1d24] mx-auto mb-2">
                      <i className={`${item.icon} ${item.color} text-sm`} />
                    </div>
                    <div className="text-white text-sm font-bold">{item.value}</div>
                    <div className="text-[#4b5563] text-xs">{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Email preview */}
              <div>
                <div className="text-[#9ca3af] text-xs font-semibold uppercase tracking-wider mb-2">Email Preview</div>
                <div className="bg-[#111318] border border-[#1e2330] rounded-xl overflow-hidden">
                  <div className="bg-teal-500/10 border-b border-[#1e2330] px-4 py-3 flex items-center gap-2">
                    <i className="ri-mail-line text-teal-400 text-sm" />
                    <div className="text-white text-xs font-semibold">Exam Invitation: {selectedExam.title}</div>
                  </div>
                  <div className="p-4 font-mono text-xs text-[#9ca3af] leading-relaxed space-y-2">
                    <div><span className="text-[#4b5563]">To:</span> <span className="text-teal-400">[student_email]</span></div>
                    <div><span className="text-[#4b5563]">From:</span> proctortrack@uni.edu</div>
                    <div className="border-t border-[#1e2330] pt-2 mt-2">
                      <div className="text-[#9ca3af]">Dear <span className="text-white">[Student Name]</span>,</div>
                      <div className="mt-2 text-[#6b7280]">
                        You have been invited to take the following proctored exam:
                      </div>
                      <div className="mt-2 bg-[#0a0c10] rounded-lg p-3 border border-[#1e2330] space-y-1">
                        <div><span className="text-[#4b5563]">Exam:</span> <span className="text-white">{selectedExam.title}</span></div>
                        <div><span className="text-[#4b5563]">Course:</span> <span className="text-white">{selectedExam.courseCode}</span></div>
                        <div><span className="text-[#4b5563]">Date:</span> <span className="text-white">{selectedExam.date} at {selectedExam.startTime}</span></div>
                        <div><span className="text-[#4b5563]">Duration:</span> <span className="text-white">{selectedExam.duration} minutes</span></div>
                      </div>
                      <div className="mt-2 text-[#6b7280]">
                        Click your secure access link below to join:
                      </div>
                      <div className="mt-1 text-teal-400 underline text-xs break-all">
                        {window.location.origin}/exam/join?token={buildPreviewToken(selectedExam.id)}
                      </div>
                      <div className="mt-2 text-[#4b5563] text-xs">
                        This link is unique to you and expires after the exam date. Do not share it.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recipient list */}
              <div>
                <div className="text-[#9ca3af] text-xs font-semibold uppercase tracking-wider mb-2">Recipients ({selectedStudents.length})</div>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {selectedStudents.map(s => (
                    <div key={s.id} className="flex items-center gap-1.5 bg-[#111318] border border-[#1e2330] rounded-full px-3 py-1">
                      <img src={s.avatar} alt={s.name} className="w-5 h-5 rounded-full object-top flex-shrink-0" />
                      <span className="text-white text-xs">{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ---- STEP: SENDING ---- */}
          {step === 'sending' && (
            <div className="p-10 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-teal-500/15 animate-pulse">
                <i className="ri-mail-send-line text-teal-400 text-3xl" />
              </div>
              <div className="text-white text-base font-bold">Sending Invitations...</div>
              <div className="text-[#4b5563] text-sm">Generating secure tokens for {selectedStudentIds.length} students</div>
              <div className="w-full max-w-xs">
                <div className="h-2 bg-[#1e2330] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all duration-150"
                    style={{ width: `${sendProgress}%` }}
                  />
                </div>
                <div className="text-center text-[#4b5563] text-xs mt-1">{Math.round(sendProgress)}%</div>
              </div>
            </div>
          )}

          {/* ---- STEP: DONE ---- */}
          {step === 'done' && (
            <div className="p-10 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-emerald-500/15">
                <i className="ri-check-double-line text-emerald-400 text-3xl" />
              </div>
              <div className="text-white text-base font-bold">All Invitations Sent!</div>
              <div className="text-[#6b7280] text-sm text-center">
                <span className="text-emerald-400 font-semibold">{selectedStudentIds.length} students</span> have been invited to{' '}
                <span className="text-white font-medium">{selectedExam?.title}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full max-w-xs mt-2">
                <div className="bg-[#111318] border border-[#1e2330] rounded-xl p-3 text-center">
                  <div className="text-emerald-400 text-xl font-bold">{selectedStudentIds.length}</div>
                  <div className="text-[#4b5563] text-xs">Delivered</div>
                </div>
                <div className="bg-[#111318] border border-[#1e2330] rounded-xl p-3 text-center">
                  <div className="text-red-400 text-xl font-bold">0</div>
                  <div className="text-[#4b5563] text-xs">Failed</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#1e2330] flex-shrink-0">
          {step === 'configure' && (
            <>
              <button onClick={onClose} className="text-[#6b7280] hover:text-white text-sm cursor-pointer transition-colors whitespace-nowrap">Cancel</button>
              <button
                onClick={() => setStep('preview')}
                disabled={!canProceed}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${canProceed ? 'bg-teal-500 hover:bg-teal-400 text-white cursor-pointer' : 'bg-[#1e2330] text-[#4b5563] cursor-not-allowed'}`}
              >
                Preview Invitation <i className="ri-arrow-right-line" />
              </button>
            </>
          )}
          {step === 'preview' && (
            <>
              <button onClick={() => setStep('configure')} className="flex items-center gap-1.5 text-[#6b7280] hover:text-white text-sm cursor-pointer transition-colors whitespace-nowrap">
                <i className="ri-arrow-left-line" /> Back
              </button>
              <button
                onClick={handleSend}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-teal-500 hover:bg-teal-400 text-white cursor-pointer transition-all whitespace-nowrap"
              >
                <i className="ri-send-plane-fill" /> Send {selectedStudentIds.length} Invitations
              </button>
            </>
          )}
          {step === 'done' && (
            <button onClick={onClose} className="ml-auto flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-white cursor-pointer transition-all whitespace-nowrap">
              <i className="ri-check-line" /> Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
