import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEstimations, getAllMedications } from '../api';
import {
  Calculator, Users, TrendingUp, FileText,
  Clock, Activity, DollarSign, ShieldCheck, CheckCircle2, ChevronRight, ArrowUpRight
} from 'lucide-react';

// --- Extracted Components ---
import StockAlertsPanel from '../components/StockAlertsPanel';
import DoctorDiagnosisStats from '../components/DoctorDiagnosisStats';

// ── Premium SVG Donut Chart with Hover Tooltip ──────────────────────────────
function DonutChart({ data, size = 160, stroke = 28, centerLabel, centerSub, emptyText = 'ไม่มีข้อมูล' }) {
  const [hovered, setHovered] = useState(null); // index of hovered segment
  const [tooltip, setTooltip] = useState({ x: 0, y: 0 });

  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.value, 0);

  if (!total) return (
    <div className="flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
      </svg>
      <span className="text-[0.6rem] text-slate-300 font-bold -mt-16">{emptyText}</span>
    </div>
  );

  let offset = 0;
  const segments = data.map((d, i) => {
    const pct = d.value / total;
    const dash = pct * circ;
    const seg = { ...d, dash, offset, pct };
    offset += dash + 2;
    return seg;
  });

  const hoveredSeg = hovered !== null ? segments[hovered] : null;

  // Display in center: show hovered segment info, otherwise default
  const displayLabel = hoveredSeg ? hoveredSeg.value : centerLabel;
  const displaySub = hoveredSeg ? hoveredSeg.name : centerSub;
  const displayColor = hoveredSeg ? hoveredSeg.color : null;

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg
        width={size} height={size}
        style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}
      >
        {/* Track */}
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />

        {segments.map((seg, i) => {
          const isHov = hovered === i;
          const isDim = hovered !== null && !isHov;
          return (
            <circle
              key={i}
              cx={size/2} cy={size/2} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={isHov ? stroke + 6 : stroke}
              strokeDasharray={`${seg.dash - 2} ${circ - seg.dash + 2}`}
              strokeDashoffset={-seg.offset}
              strokeLinecap="round"
              opacity={isDim ? 0.3 : 1}
              style={{
                transition: 'stroke-width 0.15s ease, opacity 0.15s ease',
                cursor: 'pointer',
                filter: isHov ? `drop-shadow(0 0 6px ${seg.color}88)` : 'none',
              }}
              onMouseEnter={e => {
                setHovered(i);
                const rect = e.currentTarget.closest('svg').parentElement.getBoundingClientRect();
                setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top });
              }}
              onMouseMove={e => {
                const rect = e.currentTarget.closest('svg').parentElement.getBoundingClientRect();
                setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top });
              }}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
      </svg>

      {/* Center label */}
      <div className="absolute flex flex-col items-center pointer-events-none transition-all duration-150">
        <span
          className="text-2xl font-black leading-none transition-colors duration-150"
          style={{ color: displayColor || '#1e293b' }}
        >
          {displayLabel}
        </span>
        <span
          className="text-[0.55rem] font-bold uppercase tracking-widest mt-1 text-center max-w-[70px] truncate transition-colors duration-150"
          style={{ color: displayColor ? displayColor + 'cc' : '#94a3b8' }}
        >
          {displaySub}
        </span>
        {hoveredSeg && (
          <span className="text-[0.6rem] font-black mt-0.5" style={{ color: hoveredSeg.color }}>
            {Math.round(hoveredSeg.pct * 100)}%
          </span>
        )}
      </div>

      {/* Floating Tooltip */}
      {hoveredSeg && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
        >
          <div
            className="flex items-center gap-2 text-white text-[0.65rem] font-bold px-3 py-2 rounded-xl shadow-xl whitespace-nowrap"
            style={{ background: hoveredSeg.color }}
          >
            <span>{hoveredSeg.name}</span>
            <span className="opacity-80">·</span>
            <span>{hoveredSeg.value} ราย</span>
            <span className="opacity-80">·</span>
            <span>{Math.round(hoveredSeg.pct * 100)}%</span>
          </div>
          {/* Arrow */}
          <div
            className="w-2 h-2 rotate-45 ml-3 -mt-1"
            style={{ background: hoveredSeg.color }}
          />
        </div>
      )}
    </div>
  );
}

// ── Legend Row (interactive — hover highlights matching segment) ──────────────
function ChartLegend({ data, total, hoveredIndex, onHover }) {
  return (
    <div className="space-y-2 w-full">
      {data.map((d, i) => {
        const isHov = hoveredIndex === i;
        const isDim = hoveredIndex !== null && !isHov;
        return (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg px-1.5 py-1 cursor-pointer transition-all duration-150"
            style={{
              background: isHov ? d.color + '18' : 'transparent',
              opacity: isDim ? 0.4 : 1,
            }}
            onMouseEnter={() => onHover?.(i)}
            onMouseLeave={() => onHover?.(null)}
          >
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform duration-150"
              style={{ background: d.color, transform: isHov ? 'scale(1.4)' : 'scale(1)' }}
            />
            <span className="text-[0.7rem] text-slate-600 font-medium flex-1 truncate">{d.name}</span>
            <span className="text-[0.7rem] font-black text-slate-800 font-mono">{d.value}</span>
            <span
              className="text-[0.6rem] font-bold w-8 text-right"
              style={{ color: isHov ? d.color : '#94a3b8' }}
            >
              {total ? Math.round(d.value / total * 100) : 0}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Donut Card (wires DonutChart + ChartLegend hover state together) ─────────
function DonutCard({ icon, iconGradient, title, subtitle, data, total, size = 140, stroke = 24, centerLabel, centerSub }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 mb-5">
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${iconGradient} flex items-center justify-center shadow-sm`}>
          {icon}
        </div>
        <div>
          <h2 className="font-black text-slate-900 text-sm leading-none">{title}</h2>
          <p className="text-[0.6rem] text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <DonutChart
          data={data}
          size={size} stroke={stroke}
          centerLabel={hovered !== null ? data[hovered]?.value : centerLabel}
          centerSub={hovered !== null ? data[hovered]?.name : centerSub}
          externalHover={hovered}
          onSegmentHover={setHovered}
        />
        <div className="flex-1 min-w-0">
          <ChartLegend data={data} total={total} hoveredIndex={hovered} onHover={setHovered} />
        </div>
      </div>
    </div>
  );
}



export default function Dashboard() {
  const navigate = useNavigate();
  const [allRecords, setAllRecords] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [medications, setMedications] = useState([]);
  const [stockThreshold, setStockThreshold] = useState(10);

  const [alertDays, setAlertDays] = useState(() => Number(localStorage.getItem('stock_alert_days') || 5));
  const [orderedItems, setOrderedItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ordered_stock_items')) || {}; }
    catch { return {}; }
  });
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    getEstimations().then(setAllRecords);
    getAllMedications().then(meds => {
      setMedications(meds.filter(m => m.category !== 'nurse'));
    });
  }, []);

  const records = useMemo(() => {
    if (!selectedMonth) return allRecords;
    return allRecords.filter(r => r.savedAt && r.savedAt.startsWith(selectedMonth));
  }, [allRecords, selectedMonth]);

  const handleAlertDaysChange = (days) => {
    setAlertDays(days);
    localStorage.setItem('stock_alert_days', days);
  };

  const handleStockThresholdChange = (t) => {
    setStockThreshold(t);
    localStorage.setItem('stock_threshold', t);
  };

  const handleMarkOrdered = (code, days, currentStock) => {
    setOrderedItems(prev => {
      const next = {
        ...prev,
        [code]: {
          days,
          stockAtOrder: currentStock,
          orderedAt: new Date().toISOString()
        }
      };
      localStorage.setItem('ordered_stock_items', JSON.stringify(next));
      return next;
    });
  };

  // Unfiltered demand map (all-time agreed patients demand)
  const demandMapAll = useMemo(() => {
    const map = {};
    records.forEach(r => {
      if (r.agreement !== 'agrees') return;
      (r.selectedItems || []).forEach(item => {
        if (item.category !== 'pharma' && item.category !== undefined) return;
        if (item.isSet) return;
        const code = item.itemCode;
        if (!map[code]) {
          map[code] = { code, name: item.Common_name, needed: 0 };
        }
        map[code].needed += (item.quantity || 1) * (r.courseCycles || 1);
      });
    });
    return map;
  }, [records]);

  const stockAlerts = useMemo(() => {
    const getDaysDiff = (dateStr) => {
      if (!dateStr) return null;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const savedDate = new Date(dateStr); savedDate.setHours(0, 0, 0, 0);
      return Math.ceil((today.getTime() - savedDate.getTime()) / (1000 * 60 * 60 * 24));
    };

    // 1. Calculate filtered demand
    const filteredReq = {};
    records.forEach(r => {
      if (r.agreement !== 'agrees') return;
      const diffDays = getDaysDiff(r.savedAt);
      if (diffDays !== null && !(diffDays >= 0 && diffDays <= alertDays)) return;

      (r.selectedItems || []).forEach(item => {
        if (item.category !== 'pharma' && item.category !== undefined) return;
        if (item.isSet) return;
        const code = item.itemCode;
        if (!filteredReq[code]) filteredReq[code] = { code, name: item.Common_name, needed: 0 };
        filteredReq[code].needed += (item.quantity || 1) * (r.courseCycles || 1);
      });
    });

    // 2. Ensure any item in orderedItems is included
    Object.keys(orderedItems).forEach(code => {
      if (!filteredReq[code]) {
        const allDemand = demandMapAll[code];
        const med = medications.find(m => m.itemCode === code);
        const name = allDemand?.name || med?.name || code;
        const needed = allDemand?.needed || 0;
        filteredReq[code] = { code, name, needed };
      }
    });

    return Object.values(filteredReq).sort((a, b) => b.needed - a.needed);
  }, [records, alertDays, orderedItems, demandMapAll, medications]);

  useEffect(() => {
    let changed = false;
    const next = { ...orderedItems };
    
    // Build current stock lookup
    const stockMap = {};
    medications.forEach(m => { if (m.itemCode) stockMap[m.itemCode] = m.stock; });

    // Build current demand lookup based on all agreed records
    const demandMap = {};
    Object.entries(demandMapAll).forEach(([code, value]) => {
      demandMap[code] = value.needed;
    });

    Object.entries(orderedItems).forEach(([code, value]) => {
      const currentStock = stockMap[code] ?? null;
      const stockAtOrder = (value && typeof value === 'object') ? value.stockAtOrder : null;
      const currentDemand = demandMap[code] ?? 0;

      // Clear if stock has increased OR if stock is now sufficient for demand
      const stockIncreased = currentStock !== null && stockAtOrder !== null && currentStock > stockAtOrder;
      const stockIsSufficient = currentStock !== null && currentStock >= currentDemand;

      if (stockIncreased || stockIsSufficient) {
        delete next[code];
        changed = true;
      }
    });

    if (changed) {
      setOrderedItems(next);
      localStorage.setItem('ordered_stock_items', JSON.stringify(next));
    }
  }, [medications, orderedItems, demandMapAll]);

  // --- Utility ---
  const formatCurrency = (val) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val ?? 0);
  const formatDate = (iso) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });

  // --- Summary KPIs ---
  const totalEstimations = records.length;
  const totalValue = records.reduce((s, r) => s + (r.totalCourse ?? 0), 0);
  const avgValue = totalEstimations > 0 ? totalValue / totalEstimations : 0;
  const todayCount = records.filter(r => {
    const d = new Date(r.savedAt); const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const stats = [
    { label: 'ประเมินราคาทั้งหมด', value: totalEstimations, unit: 'รายการ', icon: <FileText size={22} />, color: 'bg-blue-100 text-blue-600', border: 'border-blue-200' },
    { label: 'ประเมินราคาวันนี้', value: todayCount, unit: 'รายการ', icon: <Clock size={22} />, color: 'bg-green-100 text-green-600', border: 'border-green-200' },
    { label: 'มูลค่ารวมทั้งหมด', value: formatCurrency(totalValue), unit: 'บาท', icon: <DollarSign size={22} />, color: 'bg-yellow-100 text-yellow-600', border: 'border-yellow-200' },
    { label: 'มูลค่าเฉลี่ยต่อราย', value: formatCurrency(avgValue), unit: 'บาท', icon: <TrendingUp size={22} />, color: 'bg-purple-100 text-purple-600', border: 'border-purple-200' },
  ];

  // --- Chart Data ---
  // High-contrast palette — each color is visually distinct (hue steps ~60°)
  const PT_COLORS = ['#6366F1', '#F59E0B', '#10B981', '#F43F5E', '#0EA5E9', '#A855F7'];
  const patientTypeData = useMemo(() => {
    const counts = records.reduce((acc, r) => { acc[r.patientType] = (acc[r.patientType] || 0) + 1; return acc; }, {});
    return Object.entries(counts).map(([name, value], i) => ({ name, value, color: PT_COLORS[i % PT_COLORS.length] }));
  }, [records]);

  const INS_COLORS = ['#0EA5E9', '#F59E0B', '#10B981', '#F43F5E', '#A855F7', '#6366F1'];
  const insuranceData = useMemo(() => {
    const counts = records.reduce((acc, r) => { const k = r.insurance || 'Self pay'; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
    return Object.entries(counts).map(([name, value], i) => ({ name, value, color: INS_COLORS[i % INS_COLORS.length] }));
  }, [records]);

  const agreementData = useMemo(() => {
    const counts = records.reduce((acc, r) => {
      const status = r.agreement === "agrees" ? 'ตกลงรักษา' : r.agreement === "declines" ? 'ไม่ตกลง' : 'รอยืนยัน';
      acc[status] = (acc[status] || 0) + 1; return acc;
    }, {});
    return [
      { name: 'ตกลงรักษา', value: counts['ตกลงรักษา'] || 0, color: '#10B981' },
      { name: 'ไม่ตกลง', value: counts['ไม่ตกลง'] || 0, color: '#F43F5E' },
      { name: 'รอยืนยัน', value: counts['รอยืนยัน'] || 0, color: '#94A3B8' }
    ].filter(i => i.value > 0);
  }, [records]);

  // --- Doctor / Diagnosis Stats ---
  const doctorStats = useMemo(() => {
    const counts = {}; const docDiags = {};
    records.forEach(r => {
      const k = r.doctorName || 'ไม่ระบุ';
      counts[k] = (counts[k] || 0) + 1;
      if (!docDiags[k]) docDiags[k] = {};
      const diag = r.diagnosis || 'ไม่ระบุ';
      docDiags[k][diag] = (docDiags[k][diag] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name, value,
      topDiagnoses: Object.entries(docDiags[name] || {}).map(([dName, dCount]) => ({ name: dName, count: dCount })).sort((a, b) => b.count - a.count).slice(0, 3)
    })).sort((a, b) => b.value - a.value);
  }, [records]);

  const diagnosisStats = useMemo(() => {
    const counts = records.reduce((acc, r) => {
      if (selectedDoctorFilter && r.doctorName !== selectedDoctorFilter) return acc;
      const k = r.diagnosis || 'ไม่ระบุ';
      acc[k] = (acc[k] || 0) + 1; return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [records, selectedDoctorFilter]);

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'อรุณสวัสดิ์' : greetingHour < 17 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น';

  const agreementRate = records.length > 0 ? Math.round((records.filter(r => r.agreement === 'agrees').length / records.length) * 100) : 0;

  return (
    <div className="max-w-[1200px] mx-auto">

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0F294D] to-[#1a4a8a] text-white rounded-2xl p-6 mb-6 flex justify-between items-center shadow-md">
        <div>
          <h1 className="text-xl font-bold mb-1">{greeting}, Admin User 👋</h1>
          <p className="text-blue-200 text-sm">
            {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-white/20 text-white placeholder-white/50 border border-white/20 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:bg-white focus:text-slate-900 transition-all cursor-pointer"
            title="กรองตามเดือน"
          />
          <button onClick={() => navigate('/estimator')} className="flex items-center gap-2 bg-white text-[#0F294D] px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors">
            <Calculator size={16} /> ประเมินราคาใหม่
          </button>
          <button onClick={() => navigate('/patients')} className="flex items-center gap-2 bg-white/10 text-white border border-white/20 px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-white/20 transition-colors">
            <Users size={16} /> ดูคนไข้
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <div key={i} className={`bg-white border ${s.border} rounded-xl p-5 shadow-sm`}>
            <div className={`inline-flex p-2.5 rounded-lg ${s.color} mb-3`}>{s.icon}</div>
            <div className="text-2xl font-bold text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.unit}</div>
            <div className="text-xs font-semibold text-slate-600 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Unified Stock + Demand Panel */}
      <StockAlertsPanel
        stockAlerts={stockAlerts}
        alertDays={alertDays}
        orderedItems={orderedItems}
        onAlertDaysChange={handleAlertDaysChange}
        onMarkOrdered={handleMarkOrdered}
        userRole={user.role}
        medications={medications}
        stockThreshold={stockThreshold}
        onStockThresholdChange={handleStockThresholdChange}
      />



      {/* ── Premium Donut Charts ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        <DonutCard
          icon={<Users size={15} className="text-white" />}
          iconGradient="from-indigo-500 to-blue-600"
          title="ประเภทคนไข้"
          subtitle="สัดส่วนจากการประเมินทั้งหมด"
          data={patientTypeData}
          total={totalEstimations}
          centerLabel={totalEstimations}
          centerSub="รายการ"
        />

        <DonutCard
          icon={<CheckCircle2 size={15} className="text-white" />}
          iconGradient="from-emerald-500 to-teal-600"
          title="อัตราการตกลงรักษา"
          subtitle="สถานะการยืนยันจากคนไข้"
          data={agreementData}
          total={records.length}
          centerLabel={`${agreementRate}%`}
          centerSub="ตกลงรักษา"
        />

      </div>

      {/* Doctor + Diagnosis Stats */}
      <DoctorDiagnosisStats
        doctorStats={doctorStats}
        diagnosisStats={diagnosisStats}
        selectedDoctorFilter={selectedDoctorFilter}
        onSelectDoctor={setSelectedDoctorFilter}
      />

      {/* ── Insurance + Recent ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Insurance Donut */}
        <DonutCard
          icon={<ShieldCheck size={15} className="text-white" />}
          iconGradient="from-blue-500 to-indigo-600"
          title="สิทธิการรักษา"
          subtitle="สัดส่วนตามประเภทสิทธิ"
          data={insuranceData}
          total={records.length}
          size={150} stroke={26}
          centerLabel={insuranceData.length}
          centerSub="สิทธิ"
        />

        {/* Recent Estimations */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-sm">
                <Activity size={15} className="text-white" />
              </div>
              <div>
                <h2 className="font-black text-slate-900 text-sm leading-none">รายการล่าสุด</h2>
                <p className="text-[0.6rem] text-slate-400 mt-0.5">การประเมินราคาล่าสุด {records.length} รายการ</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/patients')}
              className="flex items-center gap-1 text-[0.65rem] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors border border-blue-100"
            >
              ดูทั้งหมด <ArrowUpRight size={11} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50/80">
            {records.slice(0, 5).map(r => {
              const isPendingMe = (user.role === 'nurse' && r.status === 'รอพยาบาล') || (user.role === 'pharma' && r.status === 'รอเภสัช') || (user.role === 'admin' && r.status !== 'สมบูรณ์');
              return (
              <div
                key={r.id}
                className="px-5 py-3.5 flex justify-between items-center hover:bg-slate-50/80 transition-colors cursor-pointer group"
                onClick={() => navigate('/estimator', { state: { editRecord: r } })}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-[0.6rem] font-black text-slate-500 flex-shrink-0">
                    {(r.patientName || 'N')?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      {r.patientName || 'ไม่ระบุชื่อ'}
                      {isPendingMe && <span className="bg-amber-100 text-amber-700 text-[0.55rem] px-1.5 py-0.5 rounded-full font-black animate-pulse">รอดำเนินการ</span>}
                    </div>
                    <div className="text-[0.6rem] text-slate-400 font-medium mt-0.5">{r.hn} · {r.status}</div>
                  </div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div>
                    <div className="font-black text-slate-900 text-xs">{formatCurrency(r.totalCourse)} <span className="text-slate-400 font-medium text-[0.55rem]">บาท</span></div>
                    <div className="text-[0.55rem] text-slate-400 font-bold uppercase text-right">{r.patientType}</div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                </div>
              </div>
            )})}
          </div>
        </div>

      </div>
    </div>
  );
}
