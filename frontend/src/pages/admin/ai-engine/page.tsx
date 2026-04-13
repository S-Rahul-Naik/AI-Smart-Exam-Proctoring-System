import { useState } from 'react';
import AdminLayout from '../../../components/feature/AdminLayout';

const modules = [
  {
    id: 'face',
    name: 'Face Detection Module',
    icon: 'ri-user-face-line',
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    enabled: true,
    model: 'MediaPipe Face Detection v2',
    confidence: 0.85,
    fps: 1.5,
    weight: 3,
    description: 'Detects face presence and absence. Triggers alert when face is absent for >3 seconds.',
    metrics: { accuracy: 99.1, latency: 48, events: 84 },
  },
  {
    id: 'gaze',
    name: 'Gaze Direction Module',
    icon: 'ri-eye-line',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    enabled: true,
    model: 'MediaPipe Face Mesh + Head Pose',
    confidence: 0.80,
    fps: 1.0,
    weight: 2,
    description: 'Classifies gaze as center, left, right, or down using facial landmark analysis.',
    metrics: { accuracy: 94.7, latency: 82, events: 156 },
  },
  {
    id: 'object',
    name: 'Phone Detection Module',
    icon: 'ri-smartphone-line',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    enabled: true,
    model: 'YOLOv8n (phone class only)',
    confidence: 0.75,
    fps: 0.5,
    weight: 5,
    description: 'Detects mobile phone objects in the webcam frame. Highest risk weight (×5).',
    metrics: { accuracy: 97.3, latency: 134, events: 18 },
  },
  {
    id: 'multiface',
    name: 'Multiple Face Detection',
    icon: 'ri-group-line',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    enabled: true,
    model: 'MediaPipe Multi-Face Detection',
    confidence: 0.90,
    fps: 1.0,
    weight: 4,
    description: 'Detects when more than one person is visible in the camera frame.',
    metrics: { accuracy: 98.5, latency: 55, events: 31 },
  },
];

export default function AdminAIEnginePage() {
  const [configs, setConfigs] = useState(modules.map(m => ({ ...m })));
  const [activeModule, setActiveModule] = useState(modules[0].id);

  const current = configs.find(m => m.id === activeModule)!;

  const updateConfig = (id: string, key: string, value: number | boolean) => {
    setConfigs(prev => prev.map(m => m.id === id ? { ...m, [key]: value } : m));
  };

  return (
    <AdminLayout title="AI Monitoring Engine" subtitle="Configure and monitor AI detection modules">
      {/* Status banner */}
      <div className="bg-teal-500/5 border border-teal-500/20 rounded-xl p-4 mb-6 flex items-center gap-4">
        <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-teal-500/15 flex-shrink-0">
          <i className="ri-cpu-line text-teal-400 text-lg" />
        </div>
        <div className="flex-1">
          <div className="text-white text-sm font-semibold">AI Engine Status: <span className="text-teal-400">Operational</span></div>
          <div className="text-[#6b7280] text-xs">4/4 modules active · Processing at 1.5 FPS · Avg latency 79ms</div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse flex-shrink-0" />
          <span className="text-teal-400 font-semibold">LIVE</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Module list */}
        <div className="space-y-3">
          {configs.map(module => (
            <div
              key={module.id}
              onClick={() => setActiveModule(module.id)}
              className={`p-4 bg-[#111318] border rounded-xl cursor-pointer transition-all ${activeModule === module.id ? 'border-teal-500/50 bg-teal-500/5' : 'border-[#1e2330] hover:border-[#2d3139]'}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-9 h-9 flex items-center justify-center rounded-lg ${module.bg} flex-shrink-0`}>
                  <i className={`${module.icon} ${module.color} text-base`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-semibold truncate">{module.name}</div>
                  <div className="text-[#4b5563] text-xs font-mono">{module.model.split(' ')[0]}</div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); updateConfig(module.id, 'enabled', !module.enabled); }}
                  className={`w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${module.enabled ? 'bg-teal-500' : 'bg-[#2d3139]'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full mx-0.5 transition-transform ${module.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6b7280]">{module.metrics.events} events · {module.metrics.accuracy}% acc</span>
                <span className="text-[#4b5563]">{module.metrics.latency}ms</span>
              </div>
            </div>
          ))}
        </div>

        {/* Module detail */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-[#111318] border border-[#1e2330] rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${current.bg}`}>
                <i className={`${current.icon} ${current.color} text-2xl`} />
              </div>
              <div>
                <h2 className="text-white font-bold text-base">{current.name}</h2>
                <div className="text-[#6b7280] text-xs">{current.model}</div>
              </div>
            </div>
            <p className="text-[#9ca3af] text-sm mb-5 leading-relaxed">{current.description}</p>

            {/* Performance metrics */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              {[
                { label: 'Accuracy', val: `${current.metrics.accuracy}%`, color: 'text-emerald-400' },
                { label: 'Avg Latency', val: `${current.metrics.latency}ms`, color: 'text-teal-400' },
                { label: 'Total Events', val: current.metrics.events, color: 'text-amber-400' },
              ].map(m => (
                <div key={m.label} className="bg-[#0a0c10] border border-[#1e2330] rounded-lg p-3 text-center">
                  <div className={`text-xl font-black ${m.color}`}>{m.val}</div>
                  <div className="text-[#4b5563] text-xs">{m.label}</div>
                </div>
              ))}
            </div>

            {/* Configuration sliders */}
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[#9ca3af] text-xs font-medium">Confidence Threshold</label>
                  <span className="text-teal-400 text-xs font-bold">{(current.confidence * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="99"
                  value={current.confidence * 100}
                  onChange={e => updateConfig(current.id, 'confidence', Number(e.target.value) / 100)}
                  className="w-full h-1.5 rounded-full bg-[#1e2330] appearance-none cursor-pointer accent-teal-500"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[#9ca3af] text-xs font-medium">Processing Rate (FPS)</label>
                  <span className="text-teal-400 text-xs font-bold">{current.fps} FPS</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.5"
                  value={current.fps}
                  onChange={e => updateConfig(current.id, 'fps', Number(e.target.value))}
                  className="w-full h-1.5 rounded-full bg-[#1e2330] appearance-none cursor-pointer accent-teal-500"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[#9ca3af] text-xs font-medium">Risk Weight Multiplier</label>
                  <span className="text-red-400 text-xs font-bold">×{current.weight}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={current.weight}
                  onChange={e => updateConfig(current.id, 'weight', Number(e.target.value))}
                  className="w-full h-1.5 rounded-full bg-[#1e2330] appearance-none cursor-pointer accent-red-500"
                />
              </div>
            </div>

            <button className="mt-5 w-full bg-teal-500 hover:bg-teal-400 text-white font-semibold py-2.5 rounded-xl text-sm cursor-pointer whitespace-nowrap transition-colors">
              Save Configuration
            </button>
          </div>

          {/* Temporal Analysis Config */}
          <div className="bg-[#111318] border border-[#1e2330] rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4">Temporal Analysis Engine</h3>
            <div className="grid md:grid-cols-2 gap-5">
              {[
                { label: 'Sliding Window Duration', val: '30 seconds', icon: 'ri-time-line', color: 'text-teal-400' },
                { label: 'Risk Decay Rate', val: '5% per 10s', icon: 'ri-arrow-down-line', color: 'text-emerald-400' },
                { label: 'High-Risk Threshold', val: '70 / 100', icon: 'ri-alert-line', color: 'text-red-400' },
                { label: 'Alert Cooldown Period', val: '15 seconds', icon: 'ri-notification-off-line', color: 'text-amber-400' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 p-3 bg-[#0a0c10] border border-[#1e2330] rounded-lg">
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a1d24] flex-shrink-0">
                    <i className={`${item.icon} ${item.color} text-sm`} />
                  </div>
                  <div>
                    <div className="text-[#6b7280] text-xs">{item.label}</div>
                    <div className="text-white text-sm font-semibold">{item.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
