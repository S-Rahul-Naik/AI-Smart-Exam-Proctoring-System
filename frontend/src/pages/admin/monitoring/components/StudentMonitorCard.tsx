import RiskBadge, { RiskMeter } from '../../../../components/base/RiskBadge';

interface Student {
  id: string;
  name: string;
  studentId: string;
  avatar: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface StudentMonitorCardProps {
  student: Student;
  riskScore: number;
  isSelected: boolean;
  onClick: () => void;
}

const webcamImages: Record<string, string> = {
  s001: 'https://readdy.ai/api/search-image?query=student%20at%20desk%20using%20laptop%20in%20dark%20room%20webcam%20view%20top%20angle%20realistic%20monitoring%20capture%20studying&width=320&height=200&seq=wc001&orientation=landscape',
  s002: 'https://readdy.ai/api/search-image?query=young%20man%20at%20desk%20using%20computer%20in%20dark%20room%20webcam%20view%20front%20angle%20realistic%20monitoring%20capture%20studying%20focused&width=320&height=200&seq=wc002&orientation=landscape',
  s003: 'https://readdy.ai/api/search-image?query=young%20woman%20at%20desk%20using%20laptop%20in%20dark%20room%20webcam%20view%20front%20angle%20realistic%20monitoring%20capture%20studying&width=320&height=200&seq=wc003&orientation=landscape',
  s004: 'https://readdy.ai/api/search-image?query=young%20man%20at%20desk%20using%20computer%20in%20slightly%20lit%20room%20webcam%20view%20monitoring%20capture%20studying&width=320&height=200&seq=wc004&orientation=landscape',
  s005: 'https://readdy.ai/api/search-image?query=woman%20at%20desk%20with%20phone%20visible%20in%20dark%20room%20webcam%20view%20monitoring%20capture%20studying%20suspicious&width=320&height=200&seq=wc005&orientation=landscape',
  s006: 'https://readdy.ai/api/search-image?query=young%20student%20at%20desk%20with%20books%20computer%20in%20dark%20room%20webcam%20view%20monitoring%20capture%20studying&width=320&height=200&seq=wc006&orientation=landscape',
  s007: 'https://readdy.ai/api/search-image?query=asian%20woman%20at%20desk%20using%20laptop%20in%20dark%20room%20webcam%20view%20monitoring%20capture%20studying%20focused&width=320&height=200&seq=wc007&orientation=landscape',
  s008: 'https://readdy.ai/api/search-image?query=young%20man%20at%20desk%20using%20computer%20in%20dark%20room%20webcam%20view%20monitoring%20capture%20studying%20side%20angle&width=320&height=200&seq=wc008&orientation=landscape',
};

export default function StudentMonitorCard({ student, riskScore, isSelected, onClick }: StudentMonitorCardProps) {
  const level: 'low' | 'medium' | 'high' = riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low';
  const borderColor = level === 'high' ? 'border-red-500/50' : level === 'medium' ? 'border-amber-500/30' : 'border-[#1e2330]';
  const glowColor = level === 'high' ? 'shadow-red-500/10' : '';

  return (
    <div
      onClick={onClick}
      className={`bg-[#111318] border ${borderColor} rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.01] ${isSelected ? 'ring-2 ring-teal-500/50' : ''} shadow-lg ${glowColor}`}
    >
      {/* Webcam feed */}
      <div className="relative w-full h-40">
        <img
          src={webcamImages[student.id] || webcamImages['s001']}
          alt={`${student.name} webcam`}
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111318]/80 via-transparent to-transparent" />
        {/* Live indicator */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 rounded-full px-2 py-1 backdrop-blur-sm">
          <span className={`w-1.5 h-1.5 rounded-full ${level === 'high' ? 'bg-red-400 animate-pulse' : 'bg-teal-400'} flex-shrink-0`} />
          <span className="text-white text-xs font-bold">LIVE</span>
        </div>
        {/* Risk badge top right */}
        <div className="absolute top-2 right-2">
          <RiskBadge score={riskScore} level={level} />
        </div>
        {/* Detection icons bottom */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
          {[
            { icon: 'ri-user-face-line', active: true, activeColor: 'text-emerald-400', tooltip: 'Face detected' },
            { icon: 'ri-eye-line', active: level !== 'high', activeColor: 'text-emerald-400', tooltip: 'Gaze OK' },
            { icon: 'ri-smartphone-line', active: level === 'high' && student.id === 's005', activeColor: 'text-red-400', tooltip: 'Phone detected' },
          ].map((det, i) => (
            <div key={i} className={`w-6 h-6 flex items-center justify-center rounded-md bg-black/60 backdrop-blur-sm ${det.active ? det.activeColor : 'text-[#4b5563]'}`}>
              <i className={`${det.icon} text-xs`} />
            </div>
          ))}
        </div>
      </div>

      {/* Card info */}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <img src={student.avatar} alt={student.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate">{student.name}</div>
            <div className="text-[#4b5563] text-xs">{student.studentId}</div>
          </div>
        </div>
        <RiskMeter score={riskScore} />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[#4b5563] text-xs">Risk Score</span>
          <span className={`text-xs font-bold ${level === 'high' ? 'text-red-400' : level === 'medium' ? 'text-amber-400' : 'text-emerald-400'}`}>{riskScore}/100</span>
        </div>
      </div>
    </div>
  );
}
