export type AlertType = 'gaze_deviation' | 'face_missing' | 'multiple_faces' | 'phone_detected';

export interface AlertEvent {
  id: string;
  studentId: string;
  type: AlertType;
  timestamp: string;
  relativeTime: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
  riskContribution: number;
  snapshot?: string;
}

export const mockAlerts: AlertEvent[] = [
  { id: 'a001', studentId: 's001', type: 'gaze_deviation', timestamp: '2026-03-24 09:12:34', relativeTime: 754, description: 'Repeated gaze deviation to the right — 6 times in 30 seconds', severity: 'high', riskContribution: 18, snapshot: 'https://readdy.ai/api/search-image?query=blurry%20webcam%20screenshot%20student%20at%20desk%20looking%20away%20from%20screen%20dark%20environment%20monitoring%20capture&width=320&height=180&seq=snap001&orientation=landscape' },
  { id: 'a002', studentId: 's001', type: 'phone_detected', timestamp: '2026-03-24 09:15:02', relativeTime: 902, description: 'Mobile phone detected in video frame', severity: 'high', riskContribution: 25, snapshot: 'https://readdy.ai/api/search-image?query=blurry%20webcam%20screenshot%20student%20at%20desk%20with%20phone%20visible%20dark%20environment%20monitoring%20capture&width=320&height=180&seq=snap002&orientation=landscape' },
  { id: 'a003', studentId: 's005', type: 'face_missing', timestamp: '2026-03-24 09:08:21', relativeTime: 501, description: 'Face absent from frame for 12 consecutive seconds', severity: 'high', riskContribution: 20, snapshot: 'https://readdy.ai/api/search-image?query=blurry%20webcam%20screenshot%20empty%20chair%20dark%20environment%20monitoring%20capture%20no%20person&width=320&height=180&seq=snap003&orientation=landscape' },
  { id: 'a004', studentId: 's005', type: 'multiple_faces', timestamp: '2026-03-24 09:19:45', relativeTime: 1185, description: 'Multiple faces detected (2 persons visible)', severity: 'high', riskContribution: 22, snapshot: 'https://readdy.ai/api/search-image?query=blurry%20webcam%20screenshot%20two%20people%20at%20desk%20dark%20environment%20monitoring%20capture&width=320&height=180&seq=snap004&orientation=landscape' },
  { id: 'a005', studentId: 's003', type: 'gaze_deviation', timestamp: '2026-03-24 09:10:15', relativeTime: 615, description: 'Gaze consistently directed downward — possible note consultation', severity: 'medium', riskContribution: 12, snapshot: 'https://readdy.ai/api/search-image?query=blurry%20webcam%20screenshot%20student%20looking%20down%20at%20desk%20dark%20environment%20monitoring%20capture&width=320&height=180&seq=snap005&orientation=landscape' },
  { id: 'a006', studentId: 's007', type: 'gaze_deviation', timestamp: '2026-03-24 09:14:33', relativeTime: 873, description: 'Gaze deviation left — 4 occurrences in last 30 seconds', severity: 'medium', riskContribution: 10, snapshot: 'https://readdy.ai/api/search-image?query=blurry%20webcam%20screenshot%20student%20looking%20left%20dark%20environment%20monitoring%20capture&width=320&height=180&seq=snap006&orientation=landscape' },
  { id: 'a007', studentId: 's008', type: 'face_missing', timestamp: '2026-03-24 09:11:08', relativeTime: 668, description: 'Face absent from frame for 8 seconds', severity: 'medium', riskContribution: 14, snapshot: 'https://readdy.ai/api/search-image?query=blurry%20webcam%20screenshot%20empty%20desk%20background%20dark%20environment%20monitoring%20capture&width=320&height=180&seq=snap007&orientation=landscape' },
  { id: 'a008', studentId: 's002', type: 'gaze_deviation', timestamp: '2026-03-24 09:07:44', relativeTime: 464, description: 'Brief gaze deviation right — single occurrence', severity: 'low', riskContribution: 4, snapshot: 'https://readdy.ai/api/search-image?query=blurry%20webcam%20screenshot%20student%20at%20desk%20slightly%20looking%20away%20dark%20environment%20monitoring%20capture&width=320&height=180&seq=snap008&orientation=landscape' },
];

export const mockRiskHistory = [
  { time: 0, s001: 5, s002: 3, s003: 4, s005: 6, s007: 5, s008: 4 },
  { time: 5, s001: 12, s002: 5, s003: 8, s005: 18, s007: 7, s008: 9 },
  { time: 10, s001: 22, s002: 6, s003: 15, s005: 31, s007: 12, s008: 18 },
  { time: 15, s001: 38, s002: 8, s003: 22, s005: 45, s007: 24, s008: 29 },
  { time: 20, s001: 55, s002: 12, s003: 35, s005: 62, s007: 38, s008: 42 },
  { time: 25, s001: 70, s002: 18, s003: 42, s005: 78, s007: 51, s008: 55 },
  { time: 30, s001: 78, s002: 24, s003: 45, s005: 91, s007: 58, s008: 67 },
];
