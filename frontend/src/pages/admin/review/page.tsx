import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/feature/AdminLayout';
import { adminAPI } from '../../../services/api';

/**
 * Comprehensive Session Review & Evidence Dashboard
 * Shows detailed malpractice evidence, analytics, and admin decision-making
 */

export default function SessionReviewPage() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionAnalysis, setSessionAnalysis] = useState(null);
  const [malpracticeReport, setMalpracticeReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [reviewDecision, setReviewDecision] = useState('pending');
  const [showDetailedView, setShowDetailedView] = useState(false);

  const sessionAPI = adminAPI;

  // Fetch sessions needing review
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const response = await sessionAPI.getSessionsNeedingReview();
        setSessions(response.data.sessions || []);
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch analysis when session is selected
  useEffect(() => {
    if (!selectedSession) return;

    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const [analysisRes, reportRes] = await Promise.all([
          sessionAPI.getSessionAnalysis(selectedSession._id),
          sessionAPI.getMalpracticeReport(selectedSession._id),
        ]);
        setSessionAnalysis(analysisRes.data.analysis);
        setMalpracticeReport(reportRes.data.report);
        setAdminNotes(selectedSession.adminReview?.notes || '');
        setReviewDecision(selectedSession.adminReview?.decision || 'pending');
      } catch (error) {
        console.error('Failed to fetch analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [selectedSession]);

  const handleSubmitReview = async () => {
    if (!selectedSession) return;

    try {
      await sessionAPI.reviewSession(selectedSession._id, {
        decision: reviewDecision,
        notes: adminNotes,
      });

      // Refresh sessions
      const response = await sessionAPI.getSessionsNeedingReview();
      setSessions(response.data.sessions || []);
      setSelectedSession(null);
      setSessionAnalysis(null);
      setMalpracticeReport(null);
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert('Failed to submit review');
    }
  };

  if (!showDetailedView) {
    // List view
    return (
      <AdminLayout
        title="Session Review Queue"
        subtitle={`${sessions.length} sessions awaiting review`}
        actions={
          <button
            onClick={() => {
              const interval = setInterval(async () => {
                const response = await sessionAPI.getSessionsNeedingReview();
                setSessions(response.data.sessions || []);
              }, 3000);
              return () => clearInterval(interval);
            }}
            className="text-white px-3 py-1.5 bg-[#111318] border border-[#2d3139] rounded-lg text-sm hover:border-[#4b5563] cursor-pointer transition-colors"
          >
            <i className="ri-refresh-line mr-1" />
            Refresh
          </button>
        }
      >
        <div className="grid gap-4">
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <i className="ri-check-double-line text-4xl text-emerald-500/30 mb-3 block" />
              <p className="text-[#6b7280]">All sessions reviewed!</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session._id}
                onClick={() => {
                  setSelectedSession(session);
                  setShowDetailedView(true);
                }}
                className="bg-[#111318] border border-[#1e2330] rounded-lg p-4 cursor-pointer hover:border-[#2d3139] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-white">
                      {session.student.firstName} {session.student.lastName}
                    </div>
                    <div className="text-sm text-[#6b7280]">{session.exam.title}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        session.riskScore >= 85
                          ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                          : session.riskScore >= 65
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                          : 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
                      }`}
                    >
                      {session.riskScore}/100
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </AdminLayout>
    );
  }

  // Detailed review view
  return (
    <AdminLayout
      title="Session Review"
      subtitle={`${selectedSession?.student.firstName} ${selectedSession?.student.lastName}`}
      actions={
        <button
          onClick={() => setShowDetailedView(false)}
          className="text-white px-3 py-1.5 bg-[#111318] border border-[#2d3139] rounded-lg text-sm hover:border-[#4b5563] cursor-pointer transition-colors"
        >
          <i className="ri-arrow-left-line mr-1" />
          Back
        </button>
      }
    >
      {loading ? (
        <div className="text-center py-12">
          <i className="ri-loader-4-line text-2xl text-[#4b5563] mb-3 block animate-spin" />
          <p className="text-[#6b7280]">Loading analysis...</p>
        </div>
      ) : sessionAnalysis ? (
        <div className="grid grid-cols-3 gap-6">
          {/* Main analysis */}
          <div className="col-span-2 space-y-6">
            {/* Risk Overview */}
            <div className="bg-[#111318] border border-[#1e2330] rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">Risk Assessment</h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <div className="text-4xl font-bold text-red-400">
                    {sessionAnalysis.riskAssessment.score}
                  </div>
                  <div className="text-sm text-[#6b7280] mt-1">Risk Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {sessionAnalysis.riskAssessment.level.toUpperCase()}
                  </div>
                  <div className="text-sm text-[#6b7280] mt-1">Risk Level</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-400">
                    {sessionAnalysis.eventSummary.total}
                  </div>
                  <div className="text-sm text-[#6b7280] mt-1">Total Events</div>
                </div>
              </div>

              {sessionAnalysis.riskAssessment.flagged && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <i className="ri-alert-line text-red-400 mt-1" />
                    <div>
                      <div className="font-semibold text-red-300">Auto-Flagged</div>
                      <div className="text-sm text-red-400/80">
                        {sessionAnalysis.riskAssessment.reason}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Malpractice Indicators */}
            {malpracticeReport?.malpracticeIndicators?.length > 0 && (
              <div className="bg-[#111318] border border-[#1e2330] rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4">
                  Malpractice Indicators ({malpracticeReport.malpracticeIndicators.length})
                </h3>
                <div className="space-y-3">
                  {malpracticeReport.malpracticeIndicators.map((indicator, idx) => (
                    <div
                      key={idx}
                      className={`border rounded-lg p-3 ${
                        indicator.severity === 'critical'
                          ? 'bg-red-500/10 border-red-500/20'
                          : indicator.severity === 'high'
                          ? 'bg-amber-500/10 border-amber-500/20'
                          : 'bg-orange-500/10 border-orange-500/20'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-white capitalize">
                            {indicator.type.replace(/_/g, ' ')}
                          </div>
                          <div className="text-sm text-[#6b7280] mt-1">
                            {indicator.evidence}
                          </div>
                        </div>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded uppercase ${
                            indicator.severity === 'critical'
                              ? 'bg-red-500/20 text-red-400'
                              : indicator.severity === 'high'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-orange-500/20 text-orange-400'
                          }`}
                        >
                          {indicator.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Event Timeline */}
            <div className="bg-[#111318] border border-[#1e2330] rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">Event Timeline</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {malpracticeReport?.eventLog?.slice(-20).reverse().map((event, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 text-sm pb-2 border-b border-[#1e2330] last:border-0"
                  >
                    <span className="text-[#4b5563] min-w-20">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        event.severity === 'critical'
                          ? 'bg-red-500/20 text-red-400'
                          : event.severity === 'high'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-orange-500/20 text-orange-400'
                      }`}
                    >
                      {event.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[#9ca3af]">{event.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidence */}
            {sessionAnalysis.evidence?.snapshots?.length > 0 && (
              <div className="bg-[#111318] border border-[#1e2330] rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4">
                  Evidence Snapshots ({sessionAnalysis.evidence.snapshots.length})
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {sessionAnalysis.evidence.snapshots.map((snap, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={snap.url}
                        alt={snap.eventType}
                        className="w-full h-32 object-cover rounded-lg border border-[#2d3139]"
                      />
                      <div className="absolute inset-0 bg-black/70 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-xs text-white font-semibold">
                            {snap.eventType}
                          </div>
                          <div className="text-xs text-[#9ca3af] mt-1">
                            {new Date(snap.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Decision Panel */}
          <div className="space-y-4">
            {/* Admin Notes */}
            <div className="bg-[#111318] border border-[#1e2330] rounded-xl p-6">
              <h3 className="text-white font-semibold mb-3">Review Decision</h3>

              <div className="mb-4">
                <label className="text-sm text-[#6b7280] block mb-2">Decision</label>
                <select
                  value={reviewDecision}
                  onChange={(e) => setReviewDecision(e.target.value)}
                  className="w-full bg-[#0a0c10] border border-[#2d3139] rounded-lg p-2 text-white text-sm focus:outline-none focus:border-[#4b5563]"
                >
                  <option value="pending">Pending Review</option>
                  <option value="approved">Approved - No Malpractice</option>
                  <option value="rejected">Rejected - Malpractice Detected</option>
                  <option value="needs_manual_review">Needs Manual Review</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="text-sm text-[#6b7280] block mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add your review notes..."
                  className="w-full bg-[#0a0c10] border border-[#2d3139] rounded-lg p-2 text-white text-sm focus:outline-none focus:border-[#4b5563] resize-none"
                  rows={6}
                />
              </div>

              <button
                onClick={handleSubmitReview}
                className="w-full bg-teal-500 hover:bg-teal-400 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                <i className="ri-check-line mr-2" />
                Submit Review
              </button>
            </div>

            {/* Performance Summary */}
            <div className="bg-[#111318] border border-[#1e2330] rounded-xl p-6">
              <h3 className="text-white font-semibold mb-3">Performance</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">Score:</span>
                  <span className="font-semibold text-white">
                    {sessionAnalysis.performance?.score || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">Duration:</span>
                  <span className="font-semibold text-white">
                    {Math.floor(
                      (sessionAnalysis.timeline?.duration || 0) / 60000
                    )}m
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-[#6b7280]">Failed to load session data</p>
        </div>
      )}
    </AdminLayout>
  );
}
