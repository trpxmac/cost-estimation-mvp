import { AlertTriangle, CheckCircle2, Clock, Truck, Check } from 'lucide-react';

/**
 * Inventory stock-alert panel with dynamic coloring and "mark ordered" action.
 */
export default function StockAlertsPanel({ stockAlerts, alertDays, orderedItems, onAlertDaysChange, onMarkOrdered }) {
  const hasActiveAlerts = stockAlerts.some(alert => !orderedItems[alert.code]);
  const hasPendingAlerts = stockAlerts.length > 0 && stockAlerts.every(alert => orderedItems[alert.code]);
  const isSufficient = stockAlerts.length === 0;

  let panelBorderClass = "border-emerald-200 bg-emerald-50/10";
  let panelAccentClass = "bg-emerald-500";
  if (hasActiveAlerts) {
    panelBorderClass = "border-rose-200 bg-rose-50/10";
    panelAccentClass = "bg-rose-500";
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
            {isSufficient ? (
              <CheckCircle2 size={18} className="text-emerald-600 animate-pulse" />
            ) : hasPendingAlerts ? (
              <Clock size={18} className="text-amber-500 animate-pulse" />
            ) : (
              <AlertTriangle size={18} className="text-rose-600 animate-pulse" />
            )}
            ระบบแจ้งเตือนสต็อกยาและการสั่งซื้อ (Inventory Alerts)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            แสดงปริมาณความต้องการของคนไข้ที่ "ตกลงรักษา" เปรียบเทียบสต็อกคงเหลือ เพื่อป้องกันปัญหาของขาดล่วงหน้า
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 self-start md:self-auto">
          <span className="text-[0.65rem] font-bold text-slate-500 px-2 uppercase tracking-tighter">เตือนล่วงหน้า:</span>
          {[3, 5, 7].map(days => (
            <button
              key={days}
              onClick={() => onAlertDaysChange(days)}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                alertDays === days
                  ? alertDays === 3
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : alertDays === 5
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-rose-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              {days} วัน
            </button>
          ))}
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
                    : 'bg-rose-50/30 border-rose-100 hover:bg-rose-50/60'
                }`}
              >
                <div className="flex-1 pr-3">
                  <div className="font-bold text-slate-900 text-xs line-clamp-1">{alert.name}</div>
                  <div className="text-[0.6rem] text-slate-400 font-mono mt-0.5">{alert.code}</div>
                  <div className="flex gap-4 mt-2 text-[0.65rem] font-bold">
                    <span className="text-slate-500">
                      สต็อก (Supply): <strong className="text-slate-800 font-mono text-sm">{alert.stock}</strong>
                    </span>
                    <span className="text-slate-500">
                      ความต้องการ (Demand): <strong className={`${isOrdered ? 'text-amber-600' : 'text-rose-600'} font-mono text-sm`}>{alert.needed}</strong>
                    </span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end justify-center">
                  {isOrdered ? (
                    <button disabled className="flex items-center gap-1 bg-amber-500 text-white font-black text-[0.65rem] px-3.5 py-2 rounded-full border border-amber-400 shadow-sm shadow-amber-100 cursor-default">
                      <Check size={12} className="stroke-[3]" /> ✓ สั่งซื้อแล้ว (Pending)
                    </button>
                  ) : (
                    <button
                      onClick={() => onMarkOrdered(alert.code)}
                      className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-[0.65rem] px-3.5 py-2 rounded-full shadow-md shadow-rose-200 hover:shadow-lg transition-all duration-150 active:scale-95"
                    >
                      <Truck size={12} /> สั่งเพิ่ม +{alert.shortage}
                    </button>
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
          <h3 className="text-xs font-black text-emerald-800 uppercase tracking-wider">สต็อกยาเพียงพอ (Empty State)</h3>
          <p className="text-[0.7rem] text-emerald-600 mt-1 max-w-md mx-auto">
            ตรวจสอบแล้ว ยาและเวชภัณฑ์ทั้งหมดมีปริมาณเพียงพอสำหรับผู้ป่วยกลุ่ม <strong>"ตกลงรักษา"</strong> ในช่วง <strong>{alertDays} วันข้างหน้า</strong>
          </p>
          <div className="mt-3 flex gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.55rem] font-bold bg-emerald-600 text-white shadow-sm gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
              คลังยา iMed/HIS ปกติ
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
