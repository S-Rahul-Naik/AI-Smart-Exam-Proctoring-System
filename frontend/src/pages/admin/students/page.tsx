import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/feature/AdminLayout';
import RiskBadge from '../../../components/base/RiskBadge';
import StatusBadge from '../../../components/base/StatusBadge';
import { adminAPI } from '../../../services/api';

interface StudentRecord {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: 'active' | 'inactive' | 'suspended';
  enrollmentId?: string;
  riskScore?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  program?: string;
  year?: number;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminAPI.getStudents();
        setStudents(response?.data?.students || []);
      } catch (fetchError: any) {
        console.error('Failed to fetch students:', fetchError);
        setError(fetchError?.response?.data?.error || 'Failed to load students');
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const filtered = useMemo(() => {
    return students.filter((student) => {
      const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim().toLowerCase();
      const studentId = (student.enrollmentId || student._id || '').toLowerCase();
      const email = (student.email || '').toLowerCase();

      const searchTerm = search.toLowerCase();
      const matchesSearch =
        fullName.includes(searchTerm) ||
        studentId.includes(searchTerm) ||
        email.includes(searchTerm);

      const normalizedStatus = student.status === 'suspended' ? 'inactive' : student.status;
      const matchesFilter = filter === 'all' || normalizedStatus === filter;

      return matchesSearch && matchesFilter;
    });
  }, [students, search, filter]);

  const getRiskLevel = (score?: number): 'low' | 'medium' | 'high' | 'critical' => {
    const numericScore = Number(score || 0);
    if (numericScore >= 85) return 'critical';
    if (numericScore >= 70) return 'high';
    if (numericScore >= 40) return 'medium';
    return 'low';
  };

  const getDisplayStatus = (status: StudentRecord['status']): 'active' | 'inactive' => {
    return status === 'active' ? 'active' : 'inactive';
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return `${first}${last}` || 'S';
  };

  const handleEditAcademic = async (student: StudentRecord) => {
    const nextProgram = window.prompt(
      `Update program for ${student.firstName} ${student.lastName}`,
      student.program || ''
    );

    if (nextProgram === null) {
      return;
    }

    const nextYearRaw = window.prompt(
      `Update year (1-8) for ${student.firstName} ${student.lastName}`,
      student.year ? String(student.year) : ''
    );

    if (nextYearRaw === null) {
      return;
    }

    const trimmedYear = nextYearRaw.trim();
    let yearValue: number | null = null;

    if (trimmedYear) {
      const parsed = Number(trimmedYear);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 8) {
        setActionMessage('Year must be a whole number between 1 and 8.');
        return;
      }
      yearValue = parsed;
    }

    try {
      setActionMessage(null);
      const response = await adminAPI.updateStudentAcademic(student._id, {
        program: nextProgram.trim() || null,
        year: yearValue,
      });

      const updated = response?.data?.student;
      setStudents((prev) => prev.map((item) => (
        item._id === student._id
          ? { ...item, program: updated?.program ?? null, year: updated?.year ?? null }
          : item
      )));

      setActionMessage(`Updated ${student.firstName} ${student.lastName}.`);
    } catch (updateError: any) {
      setActionMessage(updateError?.response?.data?.error || 'Failed to update student details.');
    }
  };

  return (
    <AdminLayout title="Student Management" subtitle={`${students.length} registered students`}>
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#4b5563] text-sm" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search students..."
            className="w-full bg-[#111318] border border-[#1e2330] rounded-lg pl-9 pr-4 py-2.5 text-white text-sm placeholder-[#4b5563] focus:outline-none focus:border-teal-500/50"
          />
        </div>
        <div className="flex bg-[#111318] border border-[#1e2330] rounded-lg p-1">
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${filter === f ? 'bg-teal-500 text-white' : 'text-[#6b7280] hover:text-white'}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button className="bg-teal-500 hover:bg-teal-400 text-white font-semibold px-4 py-2.5 rounded-lg text-sm cursor-pointer whitespace-nowrap flex items-center gap-2 transition-colors">
          <i className="ri-user-add-line" /> Add Student
        </button>
      </div>

      {actionMessage && (
        <div className="mb-4 rounded-lg border border-[#1e2330] bg-[#111318] px-4 py-2.5 text-sm text-[#9ca3af]">
          {actionMessage}
        </div>
      )}

      <div className="bg-[#111318] border border-[#1e2330] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1e2330]">
              {['Student', 'Student ID', 'Program', 'Year', 'Risk Score', 'Status'].map(col => (
                <th key={col} className="text-left px-5 py-3.5 text-xs font-semibold text-[#4b5563] uppercase tracking-wide">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-[#6b7280] text-sm">Loading students...</td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-red-400 text-sm">{error}</td>
              </tr>
            )}

            {!loading && !error && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-[#6b7280] text-sm">No students found</td>
              </tr>
            )}

            {!loading && !error && filtered.map((student, i) => (
              <tr key={student._id} className={`border-b border-[#1e2330] hover:bg-[#1a1d24] transition-colors ${i % 2 === 0 ? '' : 'bg-[#111318]/50'}`}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-teal-500/15 border border-teal-500/30 flex items-center justify-center flex-shrink-0 text-teal-400 text-xs font-bold">
                      {getInitials(student.firstName, student.lastName)}
                    </div>
                    <div>
                      <div className="text-white text-sm font-semibold">{`${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student'}</div>
                      <div className="text-[#4b5563] text-xs">{student.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-[#9ca3af] text-sm font-mono">{student.enrollmentId || student._id}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-[#9ca3af] text-sm">{student.program || 'N/A'}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-[#9ca3af] text-sm">{student.year ? `Year ${student.year}` : 'N/A'}</span>
                </td>
                <td className="px-5 py-4">
                  {getDisplayStatus(student.status) === 'active' ? (
                    <RiskBadge score={Number(student.riskScore || 0)} level={student.riskLevel || getRiskLevel(student.riskScore)} />
                  ) : (
                    <span className="text-[#4b5563] text-xs">—</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={getDisplayStatus(student.status)} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-xs text-[#6b7280]">
        <span>Showing {filtered.length} of {students.length} students</span>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#111318] border border-[#1e2330] text-[#6b7280] cursor-pointer hover:text-white">
            <i className="ri-arrow-left-s-line" />
          </button>
          <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-teal-500 text-white">1</span>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#111318] border border-[#1e2330] text-[#6b7280] cursor-pointer hover:text-white">
            <i className="ri-arrow-right-s-line" />
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
