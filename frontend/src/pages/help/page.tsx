import AdminLayout from '../../components/feature/AdminLayout';

const faqs = [
  { q: 'How does the AI risk scoring work?', a: 'The system maintains a 30-second sliding window. Each violation adds weighted risk (phone ×5, face missing ×3, gaze deviation ×2). Risk decays over time when behavior stabilizes.' },
  { q: 'What happens when a student gets a high risk score?', a: 'An alert is sent to the admin dashboard. The session is flagged for review. The admin manually decides to approve, flag, or reject the result.' },
  { q: 'How do I create and schedule an exam?', a: 'Go to Exam Management → Create Exam. Fill in the details, assign students, and enable email invitations. Students receive a secure time-limited link.' },
  { q: 'Can students retake the system check?', a: 'Yes. Students can re-run the pre-exam system check before starting. The exam only begins after all checks pass and the student agrees to the consent form.' },
  { q: 'How are results released to students?', a: 'Results are only released after admin approval in the Results & Evaluation panel. Upon approval, an automated email is sent to the student.' },
];

export default function HelpPage() {
  return (
    <AdminLayout title="Help & Documentation" subtitle="Guides, FAQs, and support resources">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#111318] border border-[#1e2330] rounded-xl p-5">
            <h3 className="text-white font-bold text-sm mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="border-b border-[#1e2330] last:border-0 pb-4 last:pb-0">
                  <div className="text-white text-sm font-semibold mb-1.5">{faq.q}</div>
                  <p className="text-[#6b7280] text-xs leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {[
            { title: 'Quick Start Guide', icon: 'ri-rocket-line', color: 'text-teal-400', desc: 'Set up your first exam in 5 minutes' },
            { title: 'AI Engine Docs', icon: 'ri-cpu-line', color: 'text-amber-400', desc: 'Understanding temporal risk analysis' },
            { title: 'Admin Reference', icon: 'ri-dashboard-3-line', color: 'text-emerald-400', desc: 'Full admin console documentation' },
            { title: 'Contact Support', icon: 'ri-customer-service-2-line', color: 'text-red-400', desc: 'Reach the ProctorAI support team' },
          ].map(item => (
            <div key={item.title} className="bg-[#111318] border border-[#1e2330] rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-teal-500/20 transition-all">
              <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#1a1d24] flex-shrink-0">
                <i className={`${item.icon} ${item.color} text-base`} />
              </div>
              <div>
                <div className="text-white text-sm font-semibold">{item.title}</div>
                <div className="text-[#4b5563] text-xs">{item.desc}</div>
              </div>
              <i className="ri-arrow-right-s-line text-[#4b5563] ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
