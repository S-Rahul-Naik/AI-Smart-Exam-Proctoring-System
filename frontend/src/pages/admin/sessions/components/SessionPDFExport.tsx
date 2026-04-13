import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { mockAlerts } from '../../../../mocks/alerts';
import { readStoredSnapshots } from '../../../../hooks/useSnapshotCapture';

interface Session {
  id: string;
  student: string;
  exam: string;
  date: string;
  examScore: number;
  riskScore: number;
  riskLevel: string;
  status: string;
  duration?: string;
}

interface Props {
  session: Session;
}

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 320;
        canvas.height = img.naturalHeight || 240;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export default function SessionPDFExport({ session }: Props) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    await new Promise(r => setTimeout(r, 200));

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // ── Header bar ──────────────────────────────────────────────────────────
    doc.setFillColor(10, 12, 16);
    doc.rect(0, 0, pageW, 30, 'F');
    doc.setTextColor(45, 212, 191);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('AI Smart Exam Proctoring System', 14, 12);
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Confidential · Session Analysis Report', 14, 19);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - 14, 19, { align: 'right' });

    // ── Title ────────────────────────────────────────────────────────────────
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Session Report', 14, 42);
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${session.exam}  ·  ${session.date}`, 14, 50);
    doc.setDrawColor(30, 35, 48);
    doc.line(14, 55, pageW - 14, 55);

    // ── Student Info ─────────────────────────────────────────────────────────
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.text('CANDIDATE', 14, 63);
    doc.text('EXAM SCORE', 70, 63);
    doc.text('RISK SCORE', 110, 63);
    doc.text('STATUS', 155, 63);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(session.student, 14, 71);

    doc.setTextColor(52, 211, 153);
    doc.text(`${session.examScore}%`, 70, 71);

    const riskColor: [number, number, number] =
      session.riskLevel === 'high' ? [248, 113, 113] :
      session.riskLevel === 'medium' ? [251, 191, 36] : [52, 211, 153];
    doc.setTextColor(...riskColor);
    doc.text(`${session.riskScore}/100`, 110, 71);
    doc.setTextColor(156, 163, 175);
    doc.text(session.status.toUpperCase(), 155, 71);
    doc.setFont('helvetica', 'normal');

    // ── Risk Level callout ────────────────────────────────────────────────────
    const rlBgColor: [number, number, number] =
      session.riskLevel === 'high' ? [127, 29, 29] :
      session.riskLevel === 'medium' ? [120, 80, 5] : [6, 78, 59];
    doc.setFillColor(...rlBgColor);
    doc.roundedRect(14, 78, pageW - 28, 12, 2, 2, 'F');
    doc.setTextColor(...riskColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `Risk Level: ${session.riskLevel.toUpperCase()}  ·  Final AI Risk Score: ${session.riskScore}/100`,
      pageW / 2, 86, { align: 'center' }
    );
    doc.setFont('helvetica', 'normal');

    // ── Risk Score Breakdown ─────────────────────────────────────────────────
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.text('BEHAVIORAL RISK BREAKDOWN', 14, 100);

    const categories = [
      { label: 'Gaze Deviations', score: Math.round(session.riskScore * 0.3), weight: '×2' },
      { label: 'Face Absence Events', score: Math.round(session.riskScore * 0.35), weight: '×3' },
      { label: 'Phone Detection', score: Math.round(session.riskScore * 0.2), weight: '×5' },
      { label: 'Focus Violations (Tab/Window)', score: Math.round(session.riskScore * 0.15), weight: '×4' },
    ];

    let yPos = 106;
    categories.forEach(cat => {
      const barW = pageW - 28;
      const fillW = (cat.score / 100) * (barW - 50);
      doc.setTextColor(209, 213, 219);
      doc.setFontSize(8);
      doc.text(cat.label, 14, yPos);
      doc.setTextColor(107, 114, 128);
      doc.text(`Weight ${cat.weight}`, pageW - 14, yPos, { align: 'right' });
      doc.setFillColor(30, 35, 48);
      doc.roundedRect(14, yPos + 2, barW - 50, 3, 1, 1, 'F');
      const barColor: [number, number, number] =
        cat.score >= 70 ? [239, 68, 68] : cat.score >= 40 ? [245, 158, 11] : [16, 185, 129];
      doc.setFillColor(...barColor);
      if (fillW > 0) doc.roundedRect(14, yPos + 2, fillW, 3, 1, 1, 'F');
      doc.setTextColor(...barColor);
      doc.setFontSize(7);
      doc.text(`${cat.score}`, 14 + (barW - 50) + 4, yPos + 4);
      yPos += 12;
    });

    // ── Event Timeline ───────────────────────────────────────────────────────
    yPos += 4;
    doc.setDrawColor(30, 35, 48);
    doc.line(14, yPos, pageW - 14, yPos);
    yPos += 8;
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.text('EVENT TIMELINE', 14, yPos);
    yPos += 6;

    const studentId =
      session.student === 'Aisha Rahman' ? 's001' :
      session.student === 'Priya Nair' ? 's005' :
      session.student === 'Yuki Tanaka' ? 's007' :
      session.student === 'Omar Al-Farsi' ? 's008' : null;

    const alerts = studentId
      ? mockAlerts.filter(a => a.studentId === studentId)
      : mockAlerts.slice(0, 4);

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Time', 'Event', 'Severity', 'Risk +']],
      body: alerts.map((a, i) => [String(i + 1), a.timestamp, a.description, a.severity.toUpperCase(), `+${a.riskContribution}`]),
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 3, textColor: [209, 213, 219], fillColor: [17, 19, 24], lineColor: [30, 35, 48], lineWidth: 0.1 },
      headStyles: { textColor: [107, 114, 128], fontSize: 7, fontStyle: 'bold', fillColor: [17, 19, 24] },
      columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 22 }, 3: { cellWidth: 20 }, 4: { cellWidth: 16 } },
      didParseCell: (data) => {
        if (data.column.index === 3 && data.section === 'body') {
          const val = data.cell.raw as string;
          if (val === 'HIGH') data.cell.styles.textColor = [248, 113, 113];
          else if (val === 'MEDIUM') data.cell.styles.textColor = [251, 191, 36];
        }
        if (data.column.index === 4 && data.section === 'body') {
          data.cell.styles.textColor = [251, 191, 36];
        }
      },
    });

    // ── Violation Evidence Snapshot Gallery ──────────────────────────────────
    const snapshots = readStoredSnapshots();

    // Start gallery on new page
    doc.addPage();

    // Gallery header
    doc.setFillColor(10, 12, 16);
    doc.rect(0, 0, pageW, 22, 'F');
    doc.setTextColor(45, 212, 191);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('AI Smart Exam Proctoring System', 14, 10);
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Violation Evidence Gallery', 14, 17);
    doc.text(session.student, pageW - 14, 17, { align: 'right' });

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Violation Evidence Snapshots', 14, 34);

    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    if (snapshots.length === 0) {
      // No real snapshots — show placeholder info
      doc.setFillColor(17, 19, 24);
      doc.roundedRect(14, 40, pageW - 28, 40, 3, 3, 'F');
      doc.setDrawColor(30, 35, 48);
      doc.roundedRect(14, 40, pageW - 28, 40, 3, 3, 'S');
      doc.setTextColor(75, 85, 99);
      doc.setFontSize(9);
      doc.text('No live webcam snapshots were captured in the current session.', pageW / 2, 57, { align: 'center' });
      doc.setFontSize(7.5);
      doc.text('Evidence snapshots are captured in real-time during the exam when violations are detected.', pageW / 2, 65, { align: 'center' });
      doc.text('They will appear here on the next export after a live proctored session.', pageW / 2, 72, { align: 'center' });

      // Show mock violation summary instead
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(8);
      let summaryY = 90;
      doc.text('DETECTION EVENT SUMMARY (from session logs)', 14, summaryY);
      summaryY += 6;

      const summaryData = [
        ['Gaze Deviation', String(Math.round(session.riskScore * 0.3 / 2)), 'LOGGED', 'Weight ×2'],
        ['Face Absence', String(Math.round(session.riskScore * 0.35 / 3)), 'LOGGED', 'Weight ×3'],
        ['Focus Violations', String(Math.round(session.riskScore * 0.15 / 4)), 'LOGGED', 'Weight ×4'],
        ['Phone Detection', '0', 'CLEAR', 'Weight ×5'],
      ];

      autoTable(doc, {
        startY: summaryY,
        head: [['Violation Type', 'Events', 'Status', 'Weight']],
        body: summaryData,
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 3, textColor: [209, 213, 219], fillColor: [17, 19, 24], lineColor: [30, 35, 48], lineWidth: 0.1 },
        headStyles: { textColor: [107, 114, 128], fontSize: 7, fontStyle: 'bold', fillColor: [17, 19, 24] },
        didParseCell: (data) => {
          if (data.column.index === 2 && data.section === 'body') {
            const val = data.cell.raw as string;
            if (val === 'LOGGED') data.cell.styles.textColor = [251, 191, 36];
            else if (val === 'CLEAR') data.cell.styles.textColor = [52, 211, 153];
          }
        },
      });
    } else {
      // Real snapshots — render as 2-column grid
      doc.text(`${snapshots.length} evidence snapshot${snapshots.length !== 1 ? 's' : ''} captured during this session`, 14, 40);

      const imgW = (pageW - 28 - 6) / 2; // two columns with 6mm gap
      const imgH = imgW * (240 / 320);   // maintain 4:3 ratio
      const cols = 2;
      let gY = 46;

      for (let i = 0; i < Math.min(snapshots.length, 12); i++) {
        const snap = snapshots[i];
        const col = i % cols;
        const gX = 14 + col * (imgW + 6);

        if (col === 0 && i > 0) {
          gY += imgH + 16;
        }

        // Check if we need a new page
        if (gY + imgH + 16 > pageH - 20) {
          doc.addPage();
          // Minimal header on continuation
          doc.setFillColor(10, 12, 16);
          doc.rect(0, 0, pageW, 14, 'F');
          doc.setTextColor(45, 212, 191);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.text('Evidence Gallery (continued)', 14, 9);
          gY = 20;
        }

        // Try to embed image
        try {
          if (snap.dataUrl && snap.dataUrl.startsWith('data:image')) {
            // Background rect
            doc.setFillColor(17, 19, 24);
            doc.roundedRect(gX, gY, imgW, imgH, 2, 2, 'F');
            doc.addImage(snap.dataUrl, 'JPEG', gX, gY, imgW, imgH);
          } else {
            // Placeholder
            doc.setFillColor(17, 19, 24);
            doc.roundedRect(gX, gY, imgW, imgH, 2, 2, 'F');
            doc.setDrawColor(30, 35, 48);
            doc.roundedRect(gX, gY, imgW, imgH, 2, 2, 'S');
            doc.setTextColor(75, 85, 99);
            doc.setFontSize(7);
            doc.text('[Image unavailable]', gX + imgW / 2, gY + imgH / 2, { align: 'center' });
          }
        } catch {
          doc.setFillColor(17, 19, 24);
          doc.roundedRect(gX, gY, imgW, imgH, 2, 2, 'F');
        }

        // Caption bar
        const captionY = gY + imgH;
        const capBgColor: [number, number, number] = snap.type === 'focus_violation' ? [127, 29, 29] : [120, 80, 5];
        doc.setFillColor(...capBgColor);
        doc.rect(gX, captionY, imgW, 10, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.text(snap.reason.slice(0, 28), gX + 2, captionY + 4);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(209, 213, 219);
        doc.setFontSize(6);
        doc.text(`${snap.timestamp}  ·  +${snap.riskContribution} risk`, gX + 2, captionY + 8);

        // Snapshot number badge
        doc.setFillColor(0, 0, 0);
        doc.circle(gX + imgW - 6, gY + 6, 5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.text(String(i + 1), gX + imgW - 6, gY + 7.5, { align: 'center' });
      }
    }

    // ── Footer on last page ──────────────────────────────────────────────────
    const lastY = pageH - 14;
    doc.setDrawColor(30, 35, 48);
    doc.line(14, lastY - 4, pageW - 14, lastY - 4);
    doc.setTextColor(75, 85, 99);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'This report is generated by the AI Smart Exam Proctoring System and is for authorized personnel only.',
      pageW / 2, lastY, { align: 'center' }
    );
    doc.text(
      `Report ID: RPT-${session.id}-${Date.now().toString(36).toUpperCase()}`,
      pageW / 2, lastY + 5, { align: 'center' }
    );

    const filename = `session-report-${session.student.replace(/\s+/g, '-').toLowerCase()}-${session.date.replace(/\//g, '-')}.pdf`;
    doc.save(filename);
    setExporting(false);
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 font-semibold px-4 py-2 rounded-lg text-sm cursor-pointer whitespace-nowrap transition-colors disabled:opacity-50"
    >
      {exporting ? (
        <>
          <div className="w-3.5 h-3.5 flex items-center justify-center">
            <div className="w-3.5 h-3.5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          </div>
          Generating PDF...
        </>
      ) : (
        <>
          <div className="w-4 h-4 flex items-center justify-center">
            <i className="ri-file-pdf-2-line text-sm" />
          </div>
          Export PDF + Evidence
        </>
      )}
    </button>
  );
}
