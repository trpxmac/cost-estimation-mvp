import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Truck, Check, Pill } from 'lucide-react';

/**
 * Inventory demand panel — shows pharma items needed by agreed patients.
 * Stock data is NOT available from iMed, so we only show demand quantities.
 */
export default function StockAlertsPanel({ stockAlerts, alertDays, orderedItems, onAlertDaysChange, onMarkOrdered, userRole }) {
  const [activeOrderCode, setActiveOrderCode] = useState(null);
  const canOrder = userRole === 'pharma' || userRole === 'admin';
  const hasActiveAlerts = stockAlerts.some(alert => !orderedItems[alert.code]);
  const hasPendingAlerts = stockAlerts.length > 0 && stockAlerts.every(alert => orderedItems[alert.code]);
  const isEmpty = stockAlerts.length === 0;

  let panelBorderClass = "border-emerald-200 bg-emerald-50/10";
  let panelAccentClass = "bg-emerald-500";
  if (hasActiveAlerts) {
    panelBorderClass = "border-blue-200 bg-blue-50/10";
    panelAccentClass = "bg-blue-500";
  } else if (hasPendingAlerts) {
    panelBorderClass = "border-amber-200 bg-amber-50/10";
    panelAccentClass = "bg-amber-500";
  }

  return (
    <div className={`bg-white border ${panelBorderClass} rounded-3xl p-6 mb-6 shadow-sm overflow-hidden relative transition-all duration-300`}>
      <div className={`absolute top-0 left-0 w-1.5 h-full ${panelAccentClass} transition-all duration-300`}></div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h2 className="font-black text-slate-900 flex items-center gap-2 text-base">
            {isEmpty ? (
              <CheckCircle2 size={18} className="text-emerald-600 animate-pulse" />
            ) : hasPendingAlerts ? (
              <Clock size={18} className="text-amber-500 animate-pulse" />
            ) : (
              <Pill size={18} className="text-blue-600 animate-pulse" />
            )}
            สรุปความต้องการยา (Drug Demand Summary)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            แสดงปริมาณยาที่ต้องใช้จากรายการประเมินราคาของคนไข้ที่ "ตกลงรักษา" — กรุณาตรวจสอบสต็อกใน iMed/HIS ก่อนสั่งยา
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 self-start md:self-auto">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5">
            <span className="text-[0.65rem] font-bold text-slate-500 px-2 uppercase tracking-tighter">เตือนล่วงหน้า:</span>
            {[3, 5, 7].map(days => (
              <button
                key={days}
                onClick={() => onAlertDaysChange(days)}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                  alertDays === days
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {days} วัน
              </button>
            ))}
          </div>
          <span className="text-[0.55rem] text-slate-400 font-bold">แจ้งเตือนเตรียมยาล่วงหน้า {alertDays} วัน</span>
        </div>
      </div>

      {stockAlerts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stockAlerts.map(alert => {
            const isOrdered = orderedItems[alert.code];
            return (
              <div
                key={alert.code}
                className={`border rounded-2xl p-4 flex justify-between items-center transition-all duration-300 ${
                  isOrdered
                    ? 'bg-amber-50/30 border-amber-100 hover:bg-amber-50/50'
                    : 'bg-blue-50/30 border-blue-100 hover:bg-blue-50/60'
                }`}
              >
                <div className="flex-1 pr-3">
                  <div className="font-bold text-slate-900 text-xs line-clamp-1">{alert.name}</div>
                  <div className="text-[0.6rem] text-slate-400 font-mono mt-0.5">{alert.code}</div>
                  <div className="flex gap-4 mt-2 text-[0.65rem] font-bold">
                    <span className="text-slate-500">
                      ความต้องการ (Demand): <strong className={`${isOrdered ? 'text-amber-600' : 'text-blue-600'} font-mono text-sm`}>{alert.needed}</strong>
                    </span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end justify-center">
                  {isOrdered ? (
                    <button disabled className="flex items-center gap-1 bg-amber-500 text-white font-black text-[0.65rem] px-3.5 py-2 rounded-full border border-amber-400 shadow-sm shadow-amber-100 cursor-default">
                      <Check size={12} className="stroke-[3]" /> สั่งยาแล้ว ({orderedItems[alert.code]} วัน)
                    </button>
                  ) : canOrder ? (
                    activeOrderCode === alert.code ? (
                      <div className="flex gap-1 animate-in slide-in-from-right-4 duration-200">
                        {[3, 5, 7].map(days => (
                          <button
                            key={days}
                            onClick={() => { onMarkOrdered(alert.code, days); setActiveOrderCode(null); }}
                            className="bg-blue-100 hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-[0.65rem] px-2 py-1.5 rounded-md transition-colors"
                          >
                            {days} วัน
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveOrderCode(alert.code)}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[0.65rem] px-3.5 py-2 rounded-full shadow-md shadow-blue-200 hover:shadow-lg transition-all duration-150 active:scale-95"
                      >
                        <Truck size={12} /> สั่งยา
                      </button>
                    )
                  ) : (
                    <span className="text-[0.65rem] font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                      รอเภสัชกรสั่งยา
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 bg-emerald-50/40 border border-emerald-100 rounded-3xl text-center shadow-inner animate-in fade-in duration-300">
          <div className="w-14 h-14 bg-emerald-100/80 rounded-full flex items-center justify-center text-emerald-600 mb-3 shadow-sm">
            <CheckCircle2 size={32} className="stroke-[2.5]" />
          </div>
          <h3 className="text-xs font-black text-emerald-800 uppercase tracking-wider">ไม่มีรายการยาที่ต้องสั่ง</h3>
          <p className="text-[0.7rem] text-emerald-600 mt-1 max-w-md mx-auto">
            ไม่พบรายการยาจากผู้ป่วยกลุ่ม <strong>"ตกลงรักษา"</strong> ในช่วง <strong>{alertDays} วันที่ผ่านมา</strong>
          </p>
        </div>
      )}
    </div>
  );
}
