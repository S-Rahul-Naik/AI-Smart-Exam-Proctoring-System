import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import AdminLayout from '../../../components/feature/AdminLayout';
import RiskBadge from '../../../components/base/RiskBadge';
import { adminAPI, examAPI } from '../../../services/api';

interface ResultSession {
  id: string;
  student: string;
  usn: string;
  exam: string;
  courseCode: string;
  date: string | null;
  examScore: number;
  marksObtained: number;
  totalMarks: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  status?: 'approved' | 'pending' | 'flagged' | 'rejected';
}

interface Summary {
  totalSessions: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
}

export default function AdminResultsPage() {
  const [sessions, setSessions] = useState<ResultSession[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalSessions: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [courseCode, setCourseCode] = useState('all');
  const [riskLevel, setRiskLevel] = useState('all');
  const [examCodes, setExamCodes] = useState<string[]>([]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminAPI.getResultSessions();
        setSessions(response?.data?.sessions || []);
        setSummary(response?.data?.summary || { totalSessions: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0 });
      } catch (fetchError: any) {
        setError(fetchError?.response?.data?.error || 'Failed to load result sessions');
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  useEffect(() => {
    const fetchExamCodes = async () => {
      try {
        const response = await examAPI.getExams();
        const codes = (response?.data?.exams || [])
          .map((exam: any) => String(exam?.courseCode || exam?.code || '').trim().toUpperCase())
          .filter(Boolean);

        setExamCodes(Array.from(new Set(codes)).sort());
      } catch {
        setExamCodes([]);
      }
    };

    fetchExamCodes();
  }, []);

  const rows = useMemo(() => sessions, [sessions]);

  const courseCodes = useMemo(() => {
    const values = [...examCodes, ...rows.map((session) => session.courseCode).filter(Boolean)];
    return ['all', ...Array.from(new Set(values)).sort()];
  }, [rows, examCodes]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rows.filter((session) => {
      const matchesSearch =
        !normalizedSearch ||
        session.student.toLowerCase().includes(normalizedSearch) ||
        session.usn.toLowerCase().includes(normalizedSearch) ||
        session.courseCode.toLowerCase().includes(normalizedSearch);

      const matchesCourseCode = courseCode === 'all' || session.courseCode === courseCode;
      const matchesRisk = riskLevel === 'all' || session.riskLevel === riskLevel;

      return matchesSearch && matchesCourseCode && matchesRisk;
    });
  }, [rows, search, courseCode, riskLevel]);

  const liveSummary = useMemo(() => ({
    totalSessions: filteredRows.length,
    highRisk: filteredRows.filter((r) => r.riskLevel === 'high' || r.riskLevel === 'critical').length,
    mediumRisk: filteredRows.filter((r) => r.riskLevel === 'medium').length,
    lowRisk: filteredRows.filter((r) => r.riskLevel === 'low').length,
  }), [filteredRows]);

  const formatDate = (value: string | null) => {
    if (!value) return 'N/A';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toISOString().slice(0, 10);
  };

  const formatDecisionLabel = (status?: ResultSession['status']) => {
    if (status === 'approved') return 'Approved';
    if (status === 'flagged') return 'Flagged';
    if (status === 'rejected') return 'Rejected';
    return 'Pending';
  };

  const exportToExcel = () => {
    const exportRows = filteredRows.map((session) => ({
      Student: session.student,
      USN: session.usn || 'N/A',
      'Course Code': session.courseCode || 'N/A',
      'Marks Obtained': session.marksObtained,
      'Total Marks': session.totalMarks,
      'Exam Score (%)': session.examScore,
      'Risk Score': session.riskScore,
      'Risk Level': session.riskLevel === 'low'
        ? session.riskLevel
        : `${session.riskLevel} (${formatDecisionLabel(session.status)})`,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
    const filename = `exam-results-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  return (
    <AdminLayout title="Results & Risk-Based Evaluation" subtitle="Approve, flag, or reject results based on exam score and risk analysis">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Sessions', val: liveSummary.totalSessions, color: 'text-white', bg: 'bg-[#1a1d24]', icon: 'ri-file-list-line' },
          { label: 'High Risk', val: liveSummary.highRisk, color: 'text-red-400', bg: 'bg-red-500/10', icon: 'ri-alert-line' },
          { label: 'Medium Risk', val: liveSummary.mediumRisk, color: 'text-amber-400', bg: 'bg-amber-500/10', icon: 'ri-time-line' },
          { label: 'Low Risk', val: liveSummary.lowRisk, color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: 'ri-shield-check-line' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border border-[#1e2330] rounded-xl p-4 flex items-center gap-3`}>
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#111318] flex-shrink-0">
              <i className={`${s.icon} ${s.color} text-lg`} />
            </div>
            <div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
              <div className="text-[#6b7280] text-xs">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#111318] border border-[#1e2330] rounded-xl p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#6b7280] mb-1.5">Search Student</label>
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#4b5563] text-sm" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by student, USN, or course code"
                className="w-full bg-[#0a0c10] border border-[#1e2330] rounded-lg pl-9 pr-4 py-2.5 text-white text-sm placeholder-[#4b5563] focus:outline-none focus:border-teal-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6b7280] mb-1.5">Course Code</label>
            <select
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              className="w-full bg-[#0a0c10] border border-[#1e2330] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-teal-500/50"
            >
              {courseCodes.map((code) => (
                <option key={code} value={code}>
                  {code === 'all' ? 'All Courses' : code}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6b7280] mb-1.5">Risk Level</label>
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              className="w-full bg-[#0a0c10] border border-[#1e2330] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-teal-500/50"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <div className="text-xs text-[#6b7280]">
            Showing {filteredRows.length} of {sessions.length} sessions
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSearch('');
                setCourseCode('all');
                setRiskLevel('all');
              }}
              className="px-3 py-2 rounded-lg text-xs font-semibold border border-[#1e2330] text-[#9ca3af] hover:text-white hover:border-[#2d3139] transition-colors"
            >
              Clear Filters
            </button>
            <button
              onClick={exportToExcel}
              disabled={filteredRows.length === 0}
              className="bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer whitespace-nowrap hover:bg-teal-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="ri-file-excel-2-line mr-1" />Download Excel
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#111318] border border-[#1e2330] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1e2330] flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">Session Results</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e2330]">
                {['Student', 'USN', 'Course Code', 'Marks Obtained', 'Total Marks', 'Exam Score', 'Risk Score', 'Risk Level'].map(col => (
                  <th key={col} className="text-left px-5 py-3 text-xs font-semibold text-[#4b5563] uppercase tracking-wide whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-[#6b7280] text-sm">Loading result sessions...</td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-red-400 text-sm">{error}</td>
                </tr>
              )}

              {!loading && !error && filteredRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-[#6b7280] text-sm">No result sessions found</td>
                </tr>
              )}

              {!loading && !error && filteredRows.map(session => {
                return (
                  <tr key={session.id} className="border-b border-[#1e2330] hover:bg-[#1a1d24] transition-colors">
                    <td className="px-5 py-4 text-white text-sm font-medium whitespace-nowrap">{session.student}</td>
                    <td className="px-5 py-4 text-[#9ca3af] text-sm whitespace-nowrap">{session.usn || 'N/A'}</td>
                    <td className="px-5 py-4">
                      <span className="text-[#9ca3af] text-sm whitespace-nowrap">{session.courseCode || 'N/A'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[#9ca3af] text-sm whitespace-nowrap">{session.marksObtained}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[#9ca3af] text-sm whitespace-nowrap">{session.totalMarks}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-bold ${session.examScore >= 80 ? 'text-emerald-400' : session.examScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{session.examScore}%</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-bold ${session.riskScore >= 70 ? 'text-red-400' : session.riskScore >= 40 ? 'text-amber-400' : 'text-emerald-400'}`}>{session.riskScore}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <RiskBadge score={session.riskScore} level={session.riskLevel} showScore={false} />
                        {session.riskLevel !== 'low' && (
                          <span className="text-xs text-[#9ca3af] whitespace-nowrap">({formatDecisionLabel(session.status)})</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
