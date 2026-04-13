import { useState } from 'react';

export type BulkDecision = 'approve' | 'reject' | 'flag';

interface Props {
  selectedIds: string[];
  total: number;
  onSelectAll: () => void;
  onClearAll: () => void;
  onBulkDecision: (decision: BulkDecision, note: string) => void;
}

export default function BatchReviewPanel({ selectedIds, total, onSelectAll, onClearAll, onBulkDecision }: Props) {
  const [showConfirm, setShowConfirm] = useState<BulkDecision | null>(null);
  const [note, setNote] = useState('');

  const count = selectedIds.length;

  function handleConfirm() {
    if (!showConfirm) return;
    onBulkDecision(showConfirm, note);
    setShowConfirm(null);
    setNote('');
  }

  if (count === 0) {
    return (
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onSelectAll}
            className="flex items-center gap-2 text-xs text-[#6b7280] hover:text-teal-400 cursor-pointer whitespace-nowrap transition-colors border border-[#2d3139] hover:border-teal-500/30 rounded-lg px-3 py-1.5"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-checkbox-blank-line text-sm" />
            </div>
            Select All ({total})
          </button>
          <span className="text-[#374151] text-xs">Select sessions for bulk review</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 bg-teal-500/10 border border-teal-500/30 rounded-xl p-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 flex items-center justify-center rounded bg-teal-500">
            <i className="ri-checkbox-line text-white text-xs" />
          </div>
          <span className="text-teal-300 text-sm font-bold">{count} selected</span>
        </div>

        <button
          onClick={onSelectAll}
          className="text-xs text-teal-400 hover:text-teal-300 cursor-pointer whitespace-nowrap underline underline-offset-2"
        >
          {count < total ? `Select all ${total}` : 'Selected all'}
        </button>
        <button
          onClick={onClearAll}
          className="text-xs text-[#6b7280] hover:text-[#9ca3af] cursor-pointer whitespace-nowrap underline underline-offset-2"
        >
          Clear
        </button>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <button
            onClick={() => setShowConfirm('approve')}
            className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap transition-colors"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-checkbox-circle-line text-sm" />
            </div>
            Approve {count}
          </button>
          <button
            onClick={() => setShowConfirm('flag')}
            className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap transition-colors"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-flag-line text-sm" />
            </div>
            Flag {count}
          </button>
          <button
            onClick={() => setShowConfirm('reject')}
            className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap transition-colors"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-close-circle-line text-sm" />
            </div>
            Reject {count}
          </button>
        </div>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#111318] border border-[#1e2330] rounded-2xl w-full max-w-md">
            <div className="p-6">
              <div className={`w-12 h-12 flex items-center justify-center rounded-xl mx-auto mb-4 ${
                showConfirm === 'approve' ? 'bg-emerald-500/15' :
                showConfirm === 'flag' ? 'bg-amber-500/15' : 'bg-red-500/15'
              }`}>
                <i className={`text-2xl ${
                  showConfirm === 'approve' ? 'ri-checkbox-circle-line text-emerald-400' :
                  showConfirm === 'flag' ? 'ri-flag-line text-amber-400' :
                  'ri-close-circle-line text-red-400'
                }`} />
              </div>
              <h3 className="text-white font-bold text-base text-center mb-1">
                {showConfirm === 'approve' ? 'Approve' : showConfirm === 'flag' ? 'Flag for Review' : 'Reject'} {count} Sessions
              </h3>
              <p className="text-[#6b7280] text-sm text-center mb-5">
                This action will be applied to all {count} selected sessions simultaneously.
              </p>
              <div className="mb-5">
                <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">
                  Admin Note <span className="text-[#4b5563]">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder={
                    showConfirm === 'approve' ? 'e.g., Reviewed and cleared after evidence check...' :
                    showConfirm === 'flag' ? 'e.g., Requires secondary review due to multiple gaze violations...' :
                    'e.g., Multiple high-risk violations confirmed...'
                  }
                  maxLength={500}
                  className="w-full bg-[#0a0c10] border border-[#2d3139] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#4b5563] focus:outline-none focus:border-teal-500/50 resize-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setShowConfirm(null); setNote(''); }}
                  className="flex-1 text-[#6b7280] hover:text-white text-sm font-medium cursor-pointer whitespace-nowrap border border-[#2d3139] rounded-lg py-2.5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 text-white font-semibold py-2.5 rounded-lg text-sm cursor-pointer whitespace-nowrap transition-colors ${
                    showConfirm === 'approve' ? 'bg-emerald-500 hover:bg-emerald-400' :
                    showConfirm === 'flag' ? 'bg-amber-500 hover:bg-amber-400' :
                    'bg-red-500 hover:bg-red-400'
                  }`}
                >
                  Confirm {showConfirm === 'approve' ? 'Approval' : showConfirm === 'flag' ? 'Flagging' : 'Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
