#!/usr/bin/env python3

from __future__ import annotations

from pathlib import Path
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "report_figures"

WHITE = "#ffffff"
BLACK = "#000000"
STROKE = 1.4
FONT = "Times New Roman, Times, serif"


def line(x1, y1, x2, y2, stroke=BLACK, width=STROKE, marker_end=False):
    marker = ' marker-end="url(#arrow)"' if marker_end else ""
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="{width}" fill="none"{marker} />'


def rect(x, y, w, h, stroke=BLACK, width=STROKE, fill=WHITE, rx=0, ry=0):
    return (
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" '
        f'rx="{rx}" ry="{ry}" stroke="{stroke}" stroke-width="{width}" fill="{fill}" />'
    )


def circle(cx, cy, r, stroke=BLACK, width=STROKE, fill=WHITE):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" stroke="{stroke}" stroke-width="{width}" fill="{fill}" />'


def ellipse(cx, cy, rx, ry, stroke=BLACK, width=STROKE, fill=WHITE):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" stroke="{stroke}" stroke-width="{width}" fill="{fill}" />'


def polygon(points, stroke=BLACK, width=STROKE, fill=WHITE):
    pts = " ".join(f"{x},{y}" for x, y in points)
    return f'<polygon points="{pts}" stroke="{stroke}" stroke-width="{width}" fill="{fill}" />'


def text(x, y, content, size=22, anchor="middle", weight="normal", italic=False):
    style = f'font-family:{FONT};font-size:{size}px;font-weight:{weight};font-style:{"italic" if italic else "normal"};fill:{BLACK};'
    lines = content.split("\n")
    if len(lines) == 1:
        return f'<text x="{x}" y="{y}" text-anchor="{anchor}" style="{style}">{escape(content)}</text>'
    parts = [f'<text x="{x}" y="{y}" text-anchor="{anchor}" style="{style}">']
    for i, line_text in enumerate(lines):
        dy = 0 if i == 0 else size * 1.15
        parts.append(f'<tspan x="{x}" dy="{dy}">{escape(line_text)}</tspan>')
    parts.append('</text>')
    return "".join(parts)


def title_block(title, subtitle, width):
    return "".join([
        text(width / 2, 48, title, size=27, weight="bold"),
        text(width / 2, 78, subtitle, size=16),
    ])


def svg_page(width, height, title, subtitle, body):
    return "\n".join([
        '<?xml version="1.0" encoding="UTF-8"?>',
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
        '<defs>',
        '<marker id="arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto" markerUnits="strokeWidth">',
        '<path d="M0,0 L10,4 L0,8 z" fill="#000000" />',
        '</marker>',
        '</defs>',
        rect(0, 0, width, height, fill=WHITE, width=0),
        title_block(title, subtitle, width),
        body,
        '</svg>',
    ])


def wrap_text_lines(content, max_chars):
    words = content.split()
    lines = []
    current = []
    for word in words:
        test = " ".join(current + [word])
        if len(test) <= max_chars or not current:
            current.append(word)
        else:
            lines.append(" ".join(current))
            current = [word]
    if current:
        lines.append(" ".join(current))
    return lines


def centered_multiline(x, y, content, size=18, max_chars=18, leading=1.2):
    lines = []
    for paragraph in content.split("\n"):
        if paragraph:
            lines.extend(wrap_text_lines(paragraph, max_chars))
        else:
            lines.append("")
    if not lines:
        return ""
    total = size * leading * (len(lines) - 1)
    start_y = y - total / 2
    parts = [f'<text x="{x}" y="{start_y}" text-anchor="middle" style="font-family:{FONT};font-size:{size}px;fill:{BLACK};">']
    for i, line_text in enumerate(lines):
        dy = 0 if i == 0 else size * leading
        parts.append(f'<tspan x="{x}" dy="{dy}">{escape(line_text)}</tspan>')
    parts.append('</text>')
    return "".join(parts)


def actor(x, y, label):
    parts = []
    parts.append(circle(x, y + 18, 11, width=1.2))
    parts.append(line(x, y + 29, x, y + 58, width=1.2))
    parts.append(line(x - 20, y + 40, x + 20, y + 40, width=1.2))
    parts.append(line(x, y + 58, x - 16, y + 80, width=1.2))
    parts.append(line(x, y + 58, x + 16, y + 80, width=1.2))
    parts.append(centered_multiline(x, y + 104, label, size=18, max_chars=14))
    return "".join(parts)


def use_case_oval(cx, cy, rx, ry, label):
    return ellipse(cx, cy, rx, ry, width=1.2) + centered_multiline(cx, cy + 4, label, size=17, max_chars=16)


def process_circle(cx, cy, r, label):
    return circle(cx, cy, r, width=1.2) + centered_multiline(cx, cy, label, size=15, max_chars=16)


def rounded_process(x, y, w, h, label):
    return rect(x, y, w, h, width=1.2, rx=16, ry=16) + centered_multiline(x + w / 2, y + h / 2 + 2, label, size=17, max_chars=20)


def data_store(x, y, w, h, label):
    parts = []
    parts.append(rect(x, y, w, h, width=1.2, fill=WHITE))
    parts.append(line(x + 16, y, x + 16, y + h, width=1.2))
    parts.append(centered_multiline(x + w / 2 + 8, y + h / 2 + 2, label, size=17, max_chars=18))
    return "".join(parts)


def ext_entity(x, y, w, h, label):
    return rect(x, y, w, h, width=1.2) + centered_multiline(x + w / 2, y + h / 2 + 2, label, size=17, max_chars=16)


def storage_capsule(x, y, w, h, label):
    parts = []
    parts.append(rect(x, y, w, h, width=1.2, rx=20, ry=20))
    parts.append(line(x + 22, y + 10, x + 22, y + h - 10, width=1.2))
    parts.append(centered_multiline(x + w / 2 + 8, y + h / 2 + 2, label, size=15, max_chars=18))
    return "".join(parts)


def output_figure(name, content):
    OUT_DIR.mkdir(exist_ok=True)
    (OUT_DIR / name).write_text(content, encoding="utf-8")


def figure_4_1():
    width, height = 1500, 980
    body = []
    body.append(rect(70, 170, 1360, 680, width=1.2))
    body.append(text(750, 205, "AI Smart Exam Proctoring System", size=22, weight="bold"))

    body.append(rect(120, 280, 300, 170, width=1.2, rx=10, ry=10))
    body.append(centered_multiline(270, 365, "Frontend\nReact Web App", size=21, max_chars=18))

    body.append(rect(460, 280, 300, 170, width=1.2, rx=10, ry=10))
    body.append(centered_multiline(610, 365, "Backend API\nNode.js / Express", size=21, max_chars=18))

    body.append(rect(800, 255, 340, 220, width=1.2, rx=10, ry=10))
    body.append(text(970, 285, "AI Processing Module", size=21, weight="bold"))
    body.append(line(840, 300, 1100, 300, width=1.0))
    body.append(centered_multiline(970, 345, "Face Detection\n(MediaPipe)", size=18, max_chars=16))
    body.append(centered_multiline(970, 395, "Gaze Tracking", size=18, max_chars=16))
    body.append(centered_multiline(970, 445, "YOLO Phone Detection", size=18, max_chars=16))

    body.append(rect(1170, 255, 220, 90, width=1.2, rx=10, ry=10))
    body.append(centered_multiline(1280, 305, "Cloud Storage\nCloudinary", size=19, max_chars=14))

    body.append(rect(1170, 365, 220, 90, width=1.2, rx=10, ry=10))
    body.append(centered_multiline(1280, 415, "Database\nMongoDB", size=19, max_chars=14))

    body.append(rect(520, 520, 460, 190, width=1.2, rx=10, ry=10))
    body.append(centered_multiline(750, 610, "Admin Dashboard\nMonitoring, alerts, review", size=21, max_chars=22))

    body.append(line(420, 365, 460, 365, marker_end=True))
    body.append(line(760, 365, 800, 365, marker_end=True))
    body.append(line(970, 475, 970, 520, marker_end=True))
    body.append(line(1120, 310, 1170, 310, marker_end=True))
    body.append(line(1120, 410, 1170, 410, marker_end=True))
    body.append(line(610, 450, 610, 520, marker_end=True))
    body.append(line(970, 475, 1280, 475, marker_end=True))
    body.append(line(270, 450, 270, 520, marker_end=True))
    body.append(line(270, 520, 520, 610, marker_end=True))
    body.append(line(1280, 475, 1280, 520, marker_end=True))
    body.append(line(1280, 520, 980, 610, marker_end=True))

    return svg_page(width, height, "Figure 4.1. Architectural Design", "High-level system architecture and data flow", "".join(body))


def figure_4_2():
    width, height = 1400, 900
    body = []
    body.append(circle(700, 430, 150, width=1.2))
    body.append(centered_multiline(700, 430, "AI Proctoring\nSystem", size=24, max_chars=14))
    body.append(ext_entity(110, 300, 180, 90, "Student"))
    body.append(ext_entity(1110, 300, 180, 90, "Admin"))
    body.append(line(290, 345, 550, 390, marker_end=True))
    body.append(text(420, 322, "Video stream\nExam input", size=17))
    body.append(line(550, 470, 290, 430, marker_end=True))
    body.append(text(385, 470, "Alerts\nResults", size=17))
    body.append(line(850, 390, 1110, 345, marker_end=True))
    body.append(text(980, 318, "Monitoring data", size=17))
    body.append(line(850, 470, 1110, 430, marker_end=True))
    body.append(text(980, 468, "Reports / alerts", size=17))
    return svg_page(width, height, "Figure 4.2. Data Flow Diagram - Level 0 (Context Diagram)", "External entities and single system process", "".join(body))


def figure_4_3():
    width, height = 1500, 980
    body = []
    body.append(ext_entity(80, 410, 170, 90, "Student"))
    body.append(ext_entity(1250, 330, 170, 90, "Admin"))
    body.append(process_circle(360, 250, 65, "1.0\nVideo Capture"))
    body.append(process_circle(600, 250, 70, "2.0\nFace & Gaze\nDetection"))
    body.append(process_circle(860, 250, 70, "3.0\nObject\nDetection"))
    body.append(process_circle(600, 560, 75, "4.0\nEvent\nProcessing"))
    body.append(process_circle(860, 560, 75, "5.0\nRisk Analysis"))
    body.append(process_circle(1120, 560, 70, "6.0\nAlert\nGeneration"))
    body.append(rounded_process(680, 780, 240, 70, "7.0 Data Storage"))
    body.append(data_store(100, 760, 220, 80, "D1 Logs"))
    body.append(data_store(420, 760, 220, 80, "D2 Session DB"))
    body.append(data_store(740, 760, 220, 80, "D3 Evidence"))

    body.append(line(250, 455, 295, 315, marker_end=True))
    body.append(text(235, 375, "Video stream", size=16, anchor="end"))
    body.append(line(425, 250, 530, 250, marker_end=True))
    body.append(text(480, 226, "Frames", size=16))
    body.append(line(670, 250, 790, 250, marker_end=True))
    body.append(text(730, 226, "Face landmarks", size=16))
    body.append(line(930, 250, 990, 250, marker_end=True))
    body.append(text(960, 226, "Phone detections", size=16))
    body.append(line(600, 320, 600, 485, marker_end=True))
    body.append(text(620, 395, "Events", size=16, anchor="start"))
    body.append(line(860, 320, 860, 485, marker_end=True))
    body.append(text(880, 395, "Risk signals", size=16, anchor="start"))
    body.append(line(935, 560, 1050, 560, marker_end=True))
    body.append(text(995, 536, "Alerts", size=16))
    body.append(line(1190, 560, 1250, 385, marker_end=True))
    body.append(text(1240, 500, "Monitoring feed", size=16, anchor="start"))
    body.append(line(1120, 635, 860, 780, marker_end=True))
    body.append(text(1000, 710, "Persist results", size=16))
    body.append(line(600, 635, 210, 760, marker_end=True))
    body.append(text(430, 700, "Log events", size=16))
    body.append(line(860, 635, 850, 780, marker_end=True))
    body.append(text(870, 735, "Store evidence", size=16, anchor="start"))
    body.append(line(1250, 355, 1190, 560, marker_end=True))
    body.append(text(1240, 470, "Review alerts", size=16, anchor="start"))
    body.append(line(850, 560, 640, 560, marker_end=True))
    body.append(text(745, 535, "Event summary", size=16))
    return svg_page(width, height, "Figure 4.3. Data Flow Diagram - Level 1", "Major functional decomposition with data stores", "".join(body))


def figure_4_4():
    width, height = 1550, 1000
    body = []
    body.append(ext_entity(50, 430, 150, 90, "Student"))
    body.append(process_circle(290, 250, 68, "1.0\nVideo\nCapture"))
    body.append(process_circle(520, 250, 72, "2.0\nFace & Gaze\nDetection"))
    body.append(process_circle(760, 250, 72, "3.0\nPhone\nDetection"))
    body.append(process_circle(1000, 250, 72, "4.0\nEvent\nProcessing"))
    body.append(process_circle(1240, 250, 72, "5.0\nRisk\nEngine"))
    body.append(process_circle(1000, 610, 74, "6.0\nAlert\nGeneration"))
    body.append(rounded_process(1220, 560, 220, 80, "7.0 Admin Feed System"))
    body.append(storage_capsule(180, 780, 250, 78, "POST /events"))
    body.append(data_store(520, 770, 220, 82, "Event Log DB"))
    body.append(storage_capsule(820, 780, 250, 78, "Snapshot Storage"))
    body.append(data_store(1130, 770, 230, 82, "Admin Alerts DB"))
    body.append(ext_entity(1390, 560, 120, 90, "Admin"))

    body.append(line(200, 475, 220, 390, marker_end=True))
    body.append(text(210, 380, "Frames", size=16))
    body.append(line(358, 250, 448, 250, marker_end=True))
    body.append(text(405, 224, "Face landmarks", size=16))
    body.append(line(592, 250, 688, 250, marker_end=True))
    body.append(text(640, 224, "Gaze data", size=16))
    body.append(line(832, 250, 928, 250, marker_end=True))
    body.append(text(880, 224, "Phone events", size=16))
    body.append(line(1072, 250, 1168, 250, marker_end=True))
    body.append(text(1120, 224, "Aggregated events", size=16))
    body.append(line(1240, 322, 1240, 535, marker_end=True))
    body.append(text(1260, 430, "Threshold analysis", size=16, anchor="start"))
    body.append(line(1240, 322, 1240, 560, marker_end=True))
    body.append(text(1260, 490, "Alert trigger", size=16, anchor="start"))
    body.append(line(1120, 610, 1220, 610, marker_end=True))
    body.append(text(1170, 586, "API call", size=16))
    body.append(line(1330, 610, 1390, 610, marker_end=True))
    body.append(text(1360, 586, "Monitor view", size=16))
    body.append(line(1000, 684, 1000, 770, marker_end=True))
    body.append(text(1020, 735, "Save snapshots", size=16, anchor="start"))
    body.append(line(1240, 684, 1240, 770, marker_end=True))
    body.append(text(1260, 735, "Persist alerts", size=16, anchor="start"))
    body.append(line(300, 684, 300, 780, marker_end=True))
    body.append(text(320, 738, "POST /events", size=16, anchor="start"))
    body.append(line(400, 820, 520, 810, marker_end=True))
    body.append(text(460, 792, "Store", size=16))
    body.append(line(760, 820, 820, 820, marker_end=True))
    body.append(text(790, 796, "Snapshot upload", size=16))
    body.append(line(1070, 820, 1130, 820, marker_end=True))
    body.append(text(1100, 796, "Alert records", size=16))
    return svg_page(width, height, "Figure 4.4. Data Flow Diagram - Level 2 (Detailed)", "Detailed event processing, storage, and admin feed flows", "".join(body))


def sequence_frame(x, y, label):
    return rect(x - 70, y, 140, 54, width=1.2) + centered_multiline(x, y + 30, label, size=18, max_chars=14)


def sequence_lifeline(x, top, bottom):
    return line(x, top, x, bottom, width=1.0)


def activation(x, y, h):
    return rect(x - 8, y, 16, h, width=1.0, fill=WHITE)


def arrow_msg(x1, y1, x2, y2, label, dashed=False):
    dash = ' stroke-dasharray="7 6"' if dashed else ""
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{BLACK}" stroke-width="1.2" fill="none" marker-end="url(#arrow)"{dash} />' + text((x1 + x2) / 2, y1 - 8, label, size=15)


def figure_4_5():
    width, height = 1600, 1000
    xs = [150, 420, 720, 1040, 1360]
    labels = ["Student", "Frontend", "Backend", "AI Modules", "Database"]
    body = []
    for x, label in zip(xs, labels):
        body.append(sequence_frame(x, 155, label))
        body.append(sequence_lifeline(x, 209, 885))

    body.append(arrow_msg(220, 230, 350, 230, "Login"))
    body.append(activation(420, 228, 70))
    body.append(arrow_msg(490, 320, 650, 320, "Authenticate user"))
    body.append(activation(720, 318, 80))
    body.append(arrow_msg(790, 420, 980, 420, "Start exam"))
    body.append(activation(1040, 418, 95))
    body.append(arrow_msg(1120, 525, 1265, 525, "Store session"))
    body.append(activation(1360, 520, 80))
    body.append(arrow_msg(350, 590, 650, 590, "Start Webcam Stream"))
    body.append(arrow_msg(650, 670, 980, 670, "Frame processing"))
    body.append(activation(1040, 665, 110))
    body.append(arrow_msg(980, 760, 1265, 760, "Log event"))
    body.append(arrow_msg(1265, 840, 980, 840, "Risk score"))
    body.append(arrow_msg(980, 900, 650, 900, "Alert trigger"))
    body.append(text(560, 930, "Continuous monitoring", size=16))

    body.append(arrow_msg(650, 430, 980, 430, "Send frame", dashed=True))
    body.append(arrow_msg(980, 460, 650, 460, "Detection result", dashed=True))
    body.append(arrow_msg(650, 500, 980, 500, "Record event", dashed=True))
    body.append(arrow_msg(980, 610, 1265, 610, "Save risk metrics", dashed=True))

    return svg_page(width, height, "Figure 4.5. Sequence Diagram - Exam Proctoring Process", "Lifelines and activation bars from login to alert generation", "".join(body))


def figure_4_6():
    width, height = 1500, 940
    xs = [160, 420, 680, 940, 1200]
    labels = ["Frame\nCapture", "Face\nDetection", "Gaze\nTracking", "Phone\nDetection", "Aggregation\n& Risk"]
    body = []
    for x, label in zip(xs, labels):
        body.append(sequence_frame(x, 130, label))
        body.append(sequence_lifeline(x, 184, 820))

    y = 235
    body.append(arrow_msg(240, y, 360, y, "Frame"))
    body.append(activation(420, y - 2, 70))
    body.append(arrow_msg(420, y + 80, 620, y + 80, "Face landmarks"))
    body.append(activation(680, y + 78, 70))
    body.append(arrow_msg(680, y + 160, 900, y + 160, "Gaze vector"))
    body.append(activation(940, y + 158, 70))
    body.append(arrow_msg(940, y + 240, 1180, y + 240, "Detection result"))
    body.append(activation(1200, y + 238, 70))
    body.append(arrow_msg(1200, y + 320, 940, y + 320, "Aggregate event"))
    body.append(arrow_msg(940, y + 400, 1200, y + 400, "Risk update"))
    body.append(arrow_msg(1200, y + 480, 940, y + 480, "Continue monitoring"))
    body.append(text(880, 860, "Continuous loop: capture -> detect -> aggregate -> score -> repeat", size=16))
    return svg_page(width, height, "Figure 4.6. Sequence Diagram - User Monitoring & Detection", "Continuous frame processing loop for monitoring", "".join(body))


def figure_4_7():
    width, height = 1500, 920
    body = []
    body.append(rect(250, 170, 1000, 610, width=1.2))

    body.append(actor(120, 245, "Student"))
    body.append(actor(1380, 245, "Admin"))

    student_cases = [
        (380, 300, "Login"),
        (690, 300, "Start Exam"),
        (380, 430, "Attend Exam"),
        (690, 430, "Get Alerts"),
        (535, 560, "Submit Exam"),
    ]
    admin_cases = [
        (980, 300, "Monitor Students"),
        (1160, 300, "View Alerts"),
        (980, 430, "Review Violations"),
        (1160, 430, "Generate Reports"),
    ]
    for x, y, label in student_cases + admin_cases:
        body.append(use_case_oval(x, y, 90, 30, label))

    body.append(line(160, 300, 290, 300, marker_end=True))
    body.append(line(160, 300, 290, 430, marker_end=True))
    body.append(line(160, 300, 445, 560, marker_end=True))
    body.append(line(1320, 300, 1070, 300, marker_end=True))
    body.append(line(1320, 300, 1250, 430, marker_end=True))
    body.append(line(1320, 300, 1070, 430, marker_end=True))
    body.append(line(1320, 300, 1250, 300, marker_end=True))
    body.append(line(1320, 300, 970, 430, marker_end=True))

    body.append(line(470, 300, 620, 300, marker_end=True))
    body.append(line(780, 300, 920, 300, marker_end=True))
    body.append(line(470, 430, 620, 430, marker_end=True))
    body.append(line(780, 430, 920, 430, marker_end=True))

    return svg_page(width, height, "Figure 4.7. Use Case Diagram", "System boundary with student and admin use cases", "".join(body))


def figure_4_8():
    width, height = 1400, 1240
    body = []

    def node_circle(cx, cy, r=22):
        return circle(cx, cy, r, width=1.2)

    def decision(cx, cy, label):
        return polygon([(cx, cy - 42), (cx + 56, cy), (cx, cy + 42), (cx - 56, cy)], width=1.2) + centered_multiline(cx, cy + 3, label, size=16, max_chars=16)

    def step(x, y, w, h, label):
        return rect(x, y, w, h, width=1.2, rx=18, ry=18) + centered_multiline(x + w / 2, y + h / 2 + 2, label, size=18, max_chars=20)

    x = 700
    body.append(node_circle(x, 120))
    body.append(line(x, 142, x, 175, marker_end=True))
    body.append(step(560, 175, 280, 62, "Login"))
    body.append(line(x, 237, x, 275, marker_end=True))
    body.append(step(480, 275, 440, 70, "Identity Verification"))
    body.append(line(x, 345, x, 385, marker_end=True))
    body.append(step(540, 385, 320, 62, "Start Exam"))
    body.append(line(x, 447, x, 485, marker_end=True))
    body.append(step(410, 485, 580, 78, "Continuous Monitoring\nFace check   Gaze tracking   Phone detection"))
    body.append(line(x, 563, x, 620, marker_end=True))
    body.append(decision(x, 690, "Suspicious\nactivity?"))
    body.append(line(x + 56, 690, 980, 690, marker_end=True))
    body.append(text(865, 670, "YES", size=16))
    body.append(step(1020, 648, 240, 64, "Generate Alert"))
    body.append(line(980, 690, 1020, 690, marker_end=True))
    body.append(line(700, 732, 700, 790, marker_end=True))
    body.append(text(720, 770, "NO", size=16, anchor="start"))
    body.append(step(530, 790, 340, 62, "Continue Monitoring"))
    body.append(line(700, 852, 700, 920, marker_end=True))
    body.append(step(560, 920, 280, 62, "End Exam"))
    body.append(line(700, 982, 700, 1010, marker_end=True))
    body.append(step(540, 1010, 320, 62, "Store Results"))
    body.append(line(700, 1072, 700, 1100, marker_end=True))
    body.append(node_circle(x, 1138))
    body.append(text(930, 720, "Decision loop", size=16, anchor="start"))

    return svg_page(width, height, "Figure 4.8. Activity Diagram - Proctoring Workflow", "Operational workflow from login to result storage", "".join(body))


def main():
    figures = [
        ("figure-4-1-architectural-design.svg", figure_4_1()),
        ("figure-4-2-dfd-level-0.svg", figure_4_2()),
        ("figure-4-3-dfd-level-1.svg", figure_4_3()),
        ("figure-4-4-dfd-level-2.svg", figure_4_4()),
        ("figure-4-5-sequence-exam-proctoring-process.svg", figure_4_5()),
        ("figure-4-6-sequence-monitoring-detection.svg", figure_4_6()),
        ("figure-4-7-use-case-diagram.svg", figure_4_7()),
        ("figure-4-8-activity-proctoring-workflow.svg", figure_4_8()),
    ]

    OUT_DIR.mkdir(exist_ok=True)
    for filename, content in figures:
        output_figure(filename, content)

    index = [
        "# Academic Figures for AI Smart Exam Proctoring System",
        "",
        "All diagrams are exported as black-and-white SVG files in this folder.",
        "",
    ]
    for i, (filename, _) in enumerate(figures, start=1):
        index.append(f"- Figure 4.{i}: {filename}")
    (OUT_DIR / "README.md").write_text("\n".join(index) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()