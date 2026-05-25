import { X, Pill, Stethoscope } from 'lucide-react';
import { getItemPrice } from '../hooks/useEstimationCalculator';

/**
 * Full-screen modal showing detailed item list of a saved record.
 */
export default function RecordDetailModal({ record, onClose }) {
  if (!record) return null;

  const formatCurrency = (val) =>
    new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val ?? 0);

  const pharmaItems = record.selectedItems?.filter(i => i.category === "pharma" || !i.category) ?? [];
  const nurseItems = record.selectedItems?.filter(i => i.category === "nurse") ?? [];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-black text-xl text-[#0F294D]">รายละเอียดรายการ</h3>
            <p className="text-xs text-slate-400 font-bold uppercase mt-1">HN: {record.hn} • {record.patientName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Pharma Section */}
          <section>
            <h4 className="text-[0.65rem] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Pill size={14} /> รายการยาและเวชภัณฑ์
            </h4>
            <div className="divide-y border rounded-2xl overflow-hidden">
              {pharmaItems.map(item => (
                <div key={item.id} className="p-3 flex justify-between items-center bg-white">
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{item.Common_name}</div>
                    <div className="text-[0.65rem] text-slate-400 font-bold">{item.quantity} units {item.dose ? `• ${item.dose}` : ''}</div>
                  </div>
                  <div className="text-right font-mono text-sm font-black text-slate-700">
                    {formatCurrency(getItemPrice(item, record.billingRight) * item.quantity)}
                  </div>
                </div>
              ))}
              {pharmaItems.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-300 italic">ไม่มีรายการยา</div>
              )}
            </div>
          </section>

          {/* Nurse Section */}
          <section>
            <h4 className="text-[0.65rem] font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Stethoscope size={14} /> รายการพยาบาลและค่าบริการ
            </h4>
            <div className="divide-y border rounded-2xl overflow-hidden">
              {nurseItems.map(item => (
                <div key={item.id} className="p-3 flex justify-between items-center bg-white">
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{item.Common_name}</div>
                    <div className="text-[0.65rem] text-slate-400 font-bold">{item.quantity} units</div>
                  </div>
                  <div className="text-right font-mono text-sm font-black text-slate-700">
                    {formatCurrency(getItemPrice(item, record.billingRight) * item.quantity)}
                  </div>
                </div>
              ))}
              {nurseItems.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-300 italic">ไม่มีรายการบริการ</div>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t flex justify-between items-center">
          <div>
            <div className="text-[0.65rem] font-black text-slate-400 uppercase">Grand Total</div>
            <div className="text-2xl font-black text-[#0F294D]">{formatCurrency(record.totalCourse)}</div>
          </div>
          <button onClick={onClose} className="bg-[#0F294D] text-white px-8 py-3 rounded-xl font-black text-sm hover:bg-slate-800 transition-all shadow-lg">
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
