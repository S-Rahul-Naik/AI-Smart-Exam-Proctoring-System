import { useState } from 'react';
import AdminLayout from '../../../components/feature/AdminLayout';
import RiskBadge from '../../../components/base/RiskBadge';
import StatusBadge from '../../../components/base/StatusBadge';
import { mockStudents } from '../../../mocks/students';

export default function AdminStudentsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filtered = mockStudents.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.studentId.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || s.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <AdminLayout title="Student Management" subtitle={`${mockStudents.length} registered students`}>
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

      <div className="bg-[#111318] border border-[#1e2330] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1e2330]">
              {['Student', 'Student ID', 'Program', 'Year', 'Risk Score', 'Status', 'Actions'].map(col => (
                <th key={col} className="text-left px-5 py-3.5 text-xs font-semibold text-[#4b5563] uppercase tracking-wide">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((student, i) => (
              <tr key={student.id} className={`border-b border-[#1e2330] hover:bg-[#1a1d24] transition-colors ${i % 2 === 0 ? '' : 'bg-[#111318]/50'}`}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <img src={student.avatar} alt={student.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                    <div>
                      <div className="text-white text-sm font-semibold">{student.name}</div>
                      <div className="text-[#4b5563] text-xs">{student.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-[#9ca3af] text-sm font-mono">{student.studentId}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-[#9ca3af] text-sm">{student.program}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-[#9ca3af] text-sm">Year {student.year}</span>
                </td>
                <td className="px-5 py-4">
                  {student.status === 'active' ? (
                    <RiskBadge score={student.riskScore} level={student.riskLevel as 'low' | 'medium' | 'high'} />
                  ) : (
                    <span className="text-[#4b5563] text-xs">—</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={student.status} size="sm" />
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a1d24] text-[#6b7280] hover:text-teal-400 transition-colors cursor-pointer">
                      <i className="ri-eye-line text-sm" />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a1d24] text-[#6b7280] hover:text-white transition-colors cursor-pointer">
                      <i className="ri-edit-line text-sm" />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a1d24] text-[#6b7280] hover:text-red-400 transition-colors cursor-pointer">
                      <i className="ri-delete-bin-line text-sm" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-xs text-[#6b7280]">
        <span>Showing {filtered.length} of {mockStudents.length} students</span>
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
