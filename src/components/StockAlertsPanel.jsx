import { useState, useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Truck, Check, Pill } from 'lucide-react';

const getElapsedDays = (orderedAt) => {
  if (!orderedAt) return 0;
  const now = new Date();
  const orderedDate = new Date(orderedAt);
  const diffTime = now.getTime() - orderedDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Unified Inventory Panel
 * — Drug Demand Summary: pharma items needed by agreed patients (compared to stock)
 * — Low Stock Alert: items whose stock is below threshold (merged)
 */
export default function StockAlertsPanel({
  stockAlerts,      // [{ code, name, needed }] — demand from agreed records
  alertDays,
  orderedItems,
  onAlertDaysChange,
  onMarkOrdered,
  userRole,
  medications = [], // full medication list with .stock field
  stockThreshold,
  onStockThresholdChange,
}) {
  const [activeOrderCode, setActiveOrderCode] = useState(null);
  const [rescheduleCode, setRescheduleCode] = useState(null);
  const canOrder = userRole === 'pharma' || userRole === 'admin';

  // --- Build stock lookup map ---
  const stockMap = useMemo(() => {
    const map = {};
    medications.forEach(m => { if (m.itemCode) map[m.itemCode] = m.stock; });
    return map;
  }, [medications]);

  // --- Enrich demand alerts with stock info ---
  const enrichedAlerts = useMemo(() => {
    return stockAlerts
      .map(alert => {
        const stock = stockMap[alert.code] ?? null;
        const shortage = stock !== null ? alert.needed - stock : null;
        const isCritical = stock !== null && stock < alert.needed;
        return { ...alert, stock, shortage, isCritical };
      })
      .filter(alert => alert.stock !== null && (alert.isCritical || orderedItems[alert.code]));
  }, [stockAlerts, stockMap, orderedItems]);

  const hasOverdue = useMemo(() => {
    return enrichedAlerts.some(a => {
      const isOrdered = orderedItems[a.code];
      const limitDays = isOrdered && typeof isOrdered === 'object' ? (isOrdered.days || 5) : 5;
      const elapsedDays = isOrdered && typeof isOrdered === 'object' ? getElapsedDays(isOrdered.orderedAt) : 0;
      return isOrdered && elapsedDays >= limitDays;
    });
  }, [enrichedAlerts, orderedItems]);

  const criticalCount = enrichedAlerts.filter(a => a.isCritical && !orderedItems[a.code]).length;
  const hasActiveAlerts = enrichedAlerts.some(a => !orderedItems[a.code]);
  const hasPendingAlerts = enrichedAlerts.length > 0 && enrichedAlerts.every(a => orderedItems[a.code]);
  const isEmpty = enrichedAlerts.length === 0;

  // Panel color
  let panelBorderClass = 'border-emerald-200';
  let panelAccentClass = 'bg-emerald-500';
  if (criticalCount > 0 || hasOverdue) {
    panelBorderClass = 'border-rose-300';
    panelAccentClass = 'bg-rose-500';
  } else if (hasActiveAlerts) {
    panelBorderClass = 'border-blue-200';
    panelAccentClass = 'bg-blue-500';
  } else if (hasPendingAlerts) {
    panelBorderClass = 'border-amber-200';
    panelAccentClass = 'bg-amber-500';
  }

  return (
    <div className={`bg-white border ${panelBorderClass} rounded-3xl p-6 mb-6 shadow-sm overflow-hidden relative transition-all duration-300`}>
      <div className={`absolute top-0 left-0 w-1.5 h-full ${panelAccentClass} transition-all duration-300`} />

      {/* --- Header --- */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
        <div>
          <h2 className="font-black text-slate-900 flex items-center gap-2 text-base">
            {isEmpty ? (
              <CheckCircle2 size={18} className="text-emerald-600 animate-pulse" />
            ) : criticalCount > 0 ? (
              <AlertTriangle size={18} className="text-rose-500 animate-pulse" />
            ) : hasPendingAlerts ? (
              <Clock size={18} className="text-amber-500 animate-pulse" />
            ) : (
              <Pill size={18} className="text-blue-600 animate-pulse" />
            )}
            สรุปความต้องการยา &amp; คลัง
            {criticalCount > 0 && (
              <span className="bg-rose-500 text-white text-[0.6rem] font-black px-2 py-0.5 rounded-full ml-1 animate-pulse">
                {criticalCount} รายการขาดแคลน
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            เปรียบเทียบสต็อกคลังกับความต้องการจากผู้ป่วยที่ &ldquo;ตกลงรักษา&rdquo; — ช่วง {alertDays} วัน
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-end gap-2 self-start">
          {/* Alert days filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5">
            <span className="text-[0.65rem] font-bold text-slate-500 px-2 uppercase tracking-tighter">เตือนล่วงหน้า:</span>
            {[3, 5, 7].map(days => (
              <button
                key={days}
                onClick={() => onAlertDaysChange(days)}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                  alertDays === days ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {days} วัน
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* --- Section: Demand Alerts (agreed patients) --- */}
      {enrichedAlerts.length > 0 && (
        <div className="mb-5">
          <div className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
            <Pill size={12} /> ยาที่ต้องเตรียมตามคำสั่งรักษา
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {enrichedAlerts.map(alert => {
              const isOrdered = orderedItems[alert.code];
              const stockUnknown = alert.stock === null;
              const limitDays = isOrdered && typeof isOrdered === 'object' ? (isOrdered.days || 5) : 5;
              const elapsedDays = isOrdered && typeof isOrdered === 'object' ? getElapsedDays(isOrdered.orderedAt) : 0;
              const isOverdue = isOrdered && elapsedDays >= limitDays;

              // Card color
              let cardClass = 'bg-blue-50/30 border-blue-100 hover:bg-blue-50/60';
              if (isOrdered) {
                if (isOverdue) {
                  cardClass = 'bg-rose-50/50 border-rose-200 hover:bg-rose-100 shadow-sm shadow-rose-100 animate-pulse';
                } else {
                  cardClass = 'bg-amber-50/30 border-amber-100 hover:bg-amber-50/50';
                }
              }
              else if (alert.isCritical) cardClass = 'bg-rose-50/40 border-rose-300 hover:bg-rose-50/60';
              else if (stockUnknown) cardClass = 'bg-slate-50 border-slate-200';

              return (
                <div
                  key={alert.code}
                  className={`border rounded-2xl p-4 transition-all duration-300 ${cardClass}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    {/* Left: drug info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {alert.isCritical && !isOrdered && (
                          <AlertTriangle size={13} className="text-rose-500 flex-shrink-0" />
                        )}
                        {isOverdue && (
                          <AlertTriangle size={13} className="text-rose-600 flex-shrink-0 animate-bounce" />
                        )}
                        <span className="font-bold text-slate-900 text-xs line-clamp-1">{alert.name}</span>
                        {alert.isCritical && !isOrdered && (
                          <span className="text-[0.55rem] font-black bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded border border-rose-200 whitespace-nowrap">
                            สต็อกไม่พอ
                          </span>
                        )}
                        {isOverdue && (
                          <span className="text-[0.55rem] font-black bg-rose-600 text-white px-1.5 py-0.5 rounded border border-rose-500 whitespace-nowrap animate-pulse">
                            ล่าช้า ⚠️
                          </span>
                        )}
                      </div>
                      <div className="text-[0.6rem] text-slate-400 font-mono mt-0.5 truncate">{alert.code}</div>

                      {/* Stock vs Demand bar */}
                      <div className="flex items-center gap-4 mt-2.5 text-[0.65rem] font-bold flex-wrap">
                        <span className="text-slate-500">
                          ต้องการ:{' '}
                          <strong className={`font-mono text-sm ${isOrdered ? (isOverdue ? 'text-rose-700' : 'text-amber-600') : alert.isCritical ? 'text-rose-600' : 'text-blue-600'}`}>
                            {alert.needed}
                          </strong>
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="text-slate-500">
                          คลัง:{' '}
                          {stockUnknown ? (
                            <strong className="text-slate-400 font-mono text-sm">N/A</strong>
                          ) : (
                            <strong className={`font-mono text-sm ${alert.isCritical ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {alert.stock}
                            </strong>
                          )}
                        </span>
                        {alert.isCritical && !isOrdered && (
                          <>
                            <span className="text-slate-300">|</span>
                            <span className="text-rose-500">
                              ขาด: <strong className="font-mono text-sm">{alert.shortage}</strong>
                            </span>
                          </>
                        )}
                      </div>

                      {/* Mini progress bar */}
                      {!stockUnknown && !isOrdered && (
                        <div className="mt-2 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${alert.isCritical ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, (alert.stock / alert.needed) * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Right: order button */}
                    <div className="flex flex-col items-end justify-center flex-shrink-0 ml-2">
                      {isOrdered ? (
                        rescheduleCode === alert.code ? (
                          <div className="flex flex-col items-end gap-1.5 animate-in slide-in-from-right-4 duration-200">
                            <span className="text-[0.55rem] font-bold text-slate-400">กำหนดวันรับใหม่:</span>
                            <div className="flex gap-1">
                              {[3, 5, 7].map(days => (
                                <button
                                  key={days}
                                  onClick={() => {
                                    onMarkOrdered(alert.code, days, alert.stock);
                                    setRescheduleCode(null);
                                  }}
                                  className="bg-amber-100 hover:bg-amber-600 hover:text-white text-amber-700 font-bold text-[0.65rem] px-2 py-1.5 rounded-md transition-colors"
                                >
                                  {days}ว
                                </button>
                              ))}
                              <button
                                onClick={() => setRescheduleCode(null)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[0.65rem] px-2 py-1.5 rounded-md transition-colors"
                              >
                                ปิด
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end">
                            <button
                              disabled
                              className={`flex items-center gap-1 font-black text-[0.65rem] px-3.5 py-2 rounded-full border shadow-sm cursor-default transition-all duration-300 ${
                                isOverdue
                                  ? 'bg-rose-600 text-white border-rose-500 shadow-rose-200'
                                  : 'bg-amber-500 text-white border-amber-400 shadow-amber-100'
                              }`}
                            >
                              {isOverdue ? (
                                <>
                                  <AlertTriangle size={12} className="stroke-[3]" /> สั่งแล้ว (ล่าช้า ⚠️)
                                </>
                              ) : (
                                <>
                                  <Check size={12} className="stroke-[3]" /> สั่งแล้ว
                                </>
                              )}
                            </button>
                            <div className="flex items-center gap-1.5 mt-1 text-[0.6rem] font-bold text-slate-400">
                              <span>{elapsedDays === 0 ? 'สั่งวันนี้' : `สั่งแล้วเมื่อ ${elapsedDays} วันก่อน`}</span>
                              {canOrder && (
                                <>
                                  <span>•</span>
                                  <button
                                    onClick={() => setRescheduleCode(alert.code)}
                                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                  >
                                    เลื่อนส่ง
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      ) : canOrder ? (
                        activeOrderCode === alert.code ? (
                          <div className="flex gap-1 animate-in slide-in-from-right-4 duration-200">
                            {[3, 5, 7].map(days => (
                              <button
                                key={days}
                                onClick={() => { onMarkOrdered(alert.code, days, alert.stock); setActiveOrderCode(null); }}
                                className="bg-blue-100 hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-[0.65rem] px-2 py-1.5 rounded-md transition-colors"
                              >
                                {days}ว
                              </button>
                            ))}
                          </div>
                        ) : (
                          <button
                            onClick={() => setActiveOrderCode(alert.code)}
                            className={`flex items-center gap-1.5 font-black text-[0.65rem] px-3.5 py-2 rounded-full shadow-md transition-all duration-150 active:scale-95 text-white ${
                              alert.isCritical
                                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200 hover:shadow-lg'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 hover:shadow-lg'
                            }`}
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
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- Empty state --- */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-10 bg-emerald-50/40 border border-emerald-100 rounded-3xl text-center shadow-inner animate-in fade-in duration-300">
          <div className="w-14 h-14 bg-emerald-100/80 rounded-full flex items-center justify-center text-emerald-600 mb-3 shadow-sm">
            <CheckCircle2 size={32} className="stroke-[2.5]" />
          </div>
          <h3 className="text-xs font-black text-emerald-800 uppercase tracking-wider">สต็อกเพียงพอทุกรายการ</h3>
          <p className="text-[0.7rem] text-emerald-600 mt-1 max-w-md mx-auto">
            ไม่พบรายการยาจากผู้ป่วยกลุ่ม <strong>&ldquo;ตกลงรักษา&rdquo;</strong> ในช่วง <strong>{alertDays} วันที่ผ่านมา</strong>
          </p>
        </div>
      )}
    </div>
  );
}
