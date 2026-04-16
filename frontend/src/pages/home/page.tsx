import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const features = [
  { icon: 'ri-eye-line', title: 'Real-Time Monitoring', desc: 'Process webcam frames at 1–2 FPS with low latency AI inference. Monitor hundreds of candidates simultaneously.' },
  { icon: 'ri-brain-line', title: 'Multi-Modal Detection', desc: 'Detect face absence, multiple faces, gaze direction (center/left/right/down), and mobile phone presence.' },
  { icon: 'ri-timeline-line', title: 'Temporal Pattern Analysis', desc: '30-second sliding window tracks behavioral frequency, absence duration, and repeated suspicious patterns.' },
  { icon: 'ri-radar-line', title: 'Dynamic Risk Scoring', desc: 'Weighted scoring: phone (30), face missing (20), gaze deviation (8). Includes time-based decay across 30-sec window.' },
  { icon: 'ri-shield-check-line', title: 'Explainable Alerts', desc: 'Every alert includes reason, timestamp, contributing signals, and human-readable explanation.' },
  { icon: 'ri-dashboard-3-line', title: 'Admin Console', desc: 'Live student grid, event timeline, risk trend graphs, evidence snapshots, and prioritized alert queue.' },
];

const stats = [
  { value: '99.2%', label: 'Detection Accuracy' },
  { value: '<150ms', label: 'Alert Latency' },
  { value: '500+', label: 'Concurrent Students' },
  { value: '6', label: 'AI Modules' },
];

const steps = [
  { num: '01', title: 'Face Verification Login', desc: 'Students authenticate with credentials and verify identity via webcam face check before accessing any exam.' },
  { num: '02', title: 'Pre-Exam System Check', desc: 'Camera validation, lighting quality assessment, face positioning feedback, and multiple-face detection.' },
  { num: '03', title: 'Rules & Consent', desc: 'Display exam rules, monitoring disclosure, and require explicit agreement before the exam begins.' },
  { num: '04', title: 'Focus Mode Exam', desc: 'Minimal UI with live webcam widget, status indicator, and real-time behavioral feedback toasts.' },
  { num: '05', title: 'AI Analysis & Risk Scoring', desc: 'Continuous temporal behavior analysis generates dynamic risk scores with explainable event logs.' },
  { num: '06', title: 'Admin Review & Decision', desc: 'Session review with evidence snapshots, event timeline, and manual approve/flag/reject decision.' },
];

const navSections = [
  { label: 'Features', id: 'features' },
  { label: 'How It Works', id: 'how-it-works' },
  { label: 'Technology', id: 'technology' },
  { label: 'Get Started', id: 'pricing' },
];

export default function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, userRole } = useAuth();

  const scrollToSection = (sectionId: string, updateHash: boolean = true) => {
    const target = document.getElementById(sectionId);
    if (!target) return;

    const headerOffset = 80;
    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top, behavior: 'smooth' });

    if (updateHash) {
      window.history.replaceState(null, '', `${location.pathname}#${sectionId}`);
    }
  };

  useEffect(() => {
    const sectionId = location.hash.replace('#', '');
    if (!sectionId) return;

    // Delay ensures layout is painted before measuring target position.
    const t = setTimeout(() => scrollToSection(sectionId, false), 60);
    return () => clearTimeout(t);
  }, [location.hash]);

  const goToAdminConsole = () => {
    if (isAuthenticated && userRole === 'admin') {
      navigate('/admin/dashboard');
      return;
    }
    navigate('/login?role=admin');
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white font-['Inter',sans-serif]">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-md bg-[#0a0c10]/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-8">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 text-left cursor-pointer"
          >
            <img src="https://public.readdy.ai/ai/img_res/bf8ee180-749c-43bb-8a55-d2dd1e2b7747.png" alt="ProctorAI" className="w-8 h-8 object-contain" />
            <span className="font-bold text-lg tracking-tight">ProctorAI</span>
          </button>
          <div className="hidden md:flex items-center gap-6 flex-1">
            {navSections.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className="text-[#9ca3af] hover:text-white text-sm transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="text-[#9ca3af] hover:text-white text-sm transition-colors cursor-pointer whitespace-nowrap">Sign In</button>
            <button onClick={goToAdminConsole} className="bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap">Admin Console</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0">
          <img
            src="https://readdy.ai/api/search-image?query=abstract%20dark%20technology%20neural%20network%20digital%20visualization%20with%20glowing%20green%20teal%20nodes%20and%20connections%20on%20very%20dark%20black%20background%20futuristic%20minimal%20aesthetic&width=1440&height=900&seq=hero001&orientation=landscape"
            alt="hero background"
            className="w-full h-full object-cover object-top opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0c10]/60 via-[#0a0c10]/40 to-[#0a0c10]" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full text-center">
          <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse flex-shrink-0" />
            <span className="text-teal-400 text-xs font-medium">Multi-Modal Temporal AI</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-none">
            <span className="text-white">AI Smart Exam</span>
            <br />
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">Proctoring System</span>
          </h1>
          <p className="text-[#9ca3af] text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed">
            Continuous real-time behavioral monitoring with multi-modal AI detection and temporal risk analysis.
            Detect suspicious behavior, score risk dynamically, and take action with intelligent alerts.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/login')} className="bg-teal-500 hover:bg-teal-400 text-white font-bold px-8 py-4 rounded-xl text-base transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 shadow-lg shadow-teal-500/25">
              <i className="ri-play-circle-line" /> Start as Student
            </button>
            <button onClick={goToAdminConsole} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-8 py-4 rounded-xl text-base transition-all cursor-pointer whitespace-nowrap flex items-center gap-2">
              <i className="ri-dashboard-3-line" /> Admin Console
            </button>
          </div>
          {/* Stats bar */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/8 rounded-2xl p-5 backdrop-blur-sm">
                <div className="text-3xl font-black text-white mb-1">{s.value}</div>
                <div className="text-[#6b7280] text-xs font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="text-teal-400 text-sm font-semibold uppercase tracking-widest mb-3">Core Capabilities</div>
          <h2 className="text-4xl font-black text-white mb-4">Everything you need for secure exams</h2>
          <p className="text-[#6b7280] text-lg max-w-2xl mx-auto">Powered by temporal AI analysis, not just single-frame snapshots.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="bg-[#111318] border border-[#1e2330] rounded-2xl p-6 hover:border-teal-500/30 transition-all group">
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-teal-500/10 mb-4 group-hover:bg-teal-500/20 transition-colors">
                <i className={`${f.icon} text-teal-400 text-xl`} />
              </div>
              <h3 className="text-white font-bold text-base mb-2">{f.title}</h3>
              <p className="text-[#6b7280] text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Risk scoring visual */}
      <section id="technology" className="py-20 bg-[#0d0f14] border-y border-[#1e2330]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-teal-400 text-sm font-semibold uppercase tracking-widest mb-3">Temporal Risk Engine</div>
              <h2 className="text-4xl font-black text-white mb-6">Dynamic scoring that evolves over time</h2>
              <p className="text-[#6b7280] text-base mb-8 leading-relaxed">Unlike static frame analysis, ProctorAI maintains a 30-second behavioral sliding window. Risk accumulates with violations and decays when behavior stabilizes — modeling true suspicious intent.</p>
              <div className="space-y-4">
                {[
                  { label: 'Phone Detected', weight: '30', color: 'bg-red-500', w: '100%' },
                  { label: 'Face Missing', weight: '20', color: 'bg-orange-500', w: '67%' },
                  { label: 'Gaze Deviation', weight: '8', color: 'bg-amber-500', w: '27%' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4">
                    <div className="w-36 text-sm text-[#9ca3af]">{item.label}</div>
                    <div className="flex-1 h-2 bg-[#1e2330] rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: item.w }} />
                    </div>
                    <div className="w-8 text-xs font-bold text-white">{item.weight}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#111318] border border-[#1e2330] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <span className="text-white font-semibold text-sm">Live Risk Trend — Priya Nair</span>
                <span className="text-red-400 text-xs font-bold bg-red-500/10 px-2 py-1 rounded-full">HIGH RISK</span>
              </div>
              <div className="flex items-end gap-2 h-32 mb-3">
                {[5, 12, 22, 38, 55, 70, 78, 85, 91].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end">
                    <div
                      className={`w-full rounded-t transition-all ${h >= 70 ? 'bg-red-500' : h >= 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ height: `${h}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-[#4b5563]">
                {[0, 5, 10, 15, 20, 25, 30, 35, 40].map(t => <span key={t}>{t}m</span>)}
              </div>
              <div className="mt-5 space-y-2">
                {[
                  { type: 'phone', msg: 'Phone detected — +25 risk', time: '09:15', color: 'text-red-400' },
                  { type: 'face', msg: 'Face absent 12s — +20 risk', time: '09:08', color: 'text-orange-400' },
                  { type: 'gaze', msg: 'Gaze deviation ×6 — +12 risk', time: '09:12', color: 'text-amber-400' },
                ].map((e, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span className="text-[#4b5563]">{e.time}</span>
                    <span className={e.color}>{e.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="text-teal-400 text-sm font-semibold uppercase tracking-widest mb-3">Exam Lifecycle</div>
          <h2 className="text-4xl font-black text-white mb-4">Complete end-to-end workflow</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {steps.map((s) => (
            <div key={s.num} className="bg-[#111318] border border-[#1e2330] rounded-2xl p-6 relative overflow-hidden">
              <div className="text-6xl font-black text-[#1e2330] absolute -top-2 -right-2 leading-none">{s.num}</div>
              <div className="relative">
                <div className="text-teal-400 text-3xl font-black mb-3">{s.num}</div>
                <h3 className="text-white font-bold text-base mb-2">{s.title}</h3>
                <p className="text-[#6b7280] text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="py-20 bg-gradient-to-r from-teal-900/40 to-emerald-900/20 border-t border-[#1e2330]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-white mb-4">Ready to monitor smarter?</h2>
          <p className="text-[#9ca3af] text-lg mb-10">Set up your first proctored exam in minutes.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={goToAdminConsole} className="bg-teal-500 hover:bg-teal-400 text-white font-bold px-8 py-4 rounded-xl text-base transition-all cursor-pointer whitespace-nowrap">Launch Admin Console</button>
            <button onClick={() => navigate('/login')} className="border border-[#2d3139] text-white font-semibold px-8 py-4 rounded-xl text-base transition-all hover:border-teal-500/40 cursor-pointer whitespace-nowrap">Start as Student</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d0f14] border-t border-[#1e2330] py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <img src="https://public.readdy.ai/ai/img_res/bf8ee180-749c-43bb-8a55-d2dd1e2b7747.png" alt="ProctorAI" className="w-7 h-7 object-contain" />
              <span className="font-bold text-white">ProctorAI</span>
              <span className="text-[#4b5563] text-sm">· AI Smart Exam Proctoring System</span>
            </div>
            <div className="text-[#4b5563] text-sm">© 2026 ProctorAI · Multi-Modal Temporal Risk Analysis</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
