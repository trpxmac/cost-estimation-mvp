import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEstimations } from '../api';
import {
  Calculator, Users, TrendingUp, FileText,
  Clock, Activity, DollarSign, ShieldCheck, CheckCircle2, ChevronRight
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

// --- Extracted Components ---
import StockAlertsPanel from '../components/StockAlertsPanel';
import DoctorDiagnosisStats from '../components/DoctorDiagnosisStats';

export default function Dashboard() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [items, setItems] = useState([]);
  const [alertDays, setAlertDays] = useState(() => Number(localStorage.getItem('stock_alert_days') || 5));
  const [orderedItems, setOrderedItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ordered_stock_items')) || {}; }
    catch { return {}; }
  });
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState(null);

  useEffect(() => {
    getEstimations().then(setRecords);
    import('../data').then(m => setItems(m.getAllItems()));
  }, []);

  const handleAlertDaysChange = (days) => {
    setAlertDays(days);
    localStorage.setItem('stock_alert_days', days);
  };

  const handleMarkOrdered = (code) => {
    setOrderedItems(prev => {
      const next = { ...prev, [code]: true };
      localStorage.setItem('ordered_stock_items', JSON.stringify(next));
      return next;
    });
  };

  const stockAlerts = useMemo(() => {
    const getDaysDiff = (dateStr) => {
      if (!dateStr) return null;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const appDate = new Date(dateStr); appDate.setHours(0, 0, 0, 0);
      return Math.ceil((appDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    // Mock alerts (MVP presentation fallbacks)
    const mockAlerts = [];
    if (alertDays === 5) {
      mockAlerts.push({ code: '5111160000006', name: 'Pemetrexed INJ (100 mg)', stock: 2, needed: 5, shortage: 3 });
    } else if (alertDays === 7) {
      mockAlerts.push(
        { code: '5111160000006', name: 'Pemetrexed INJ (100 mg)', stock: 2, needed: 7, shortage: 5 },
        { code: '5111180600005', name: 'CAMPTO 100 MG/5ML INJ.', stock: 10, needed: 12, shortage: 2 },
        { code: '5120160800002', name: 'Fluquadri 0.5ml', stock: 20, needed: 25, shortage: 5 }
      );
    }

    // Dynamic demand calculation
    const realItemReq = {};
    records.forEach(r => {
      if (r.agreement !== 'agrees') return;
      const diffDays = getDaysDiff(r.appointmentDate);
      if (diffDays !== null && !(diffDays >= 0 && diffDays <= alertDays)) return;

      (r.selectedItems || []).forEach(item => {
        if (item.category !== 'pharma' && item.category !== undefined) return;
        if (item.isSet) return;
        const code = item.itemCode;
        if (!realItemReq[code]) realItemReq[code] = { code, name: item.Common_name, needed: 0 };
        realItemReq[code].needed += (item.quantity || 1) * (r.courseCycles || 1);
      });
    });

    const realAlerts = Object.keys(realItemReq).reduce((acc, code) => {
      const req = realItemReq[code];
      const invItem = items.find(i => i.itemCode === code);
      const currentStock = invItem?.stock ?? 50;
      if (req.needed > currentStock) {
        acc.push({ code: req.code, name: req.name, stock: currentStock, needed: req.needed, shortage: req.needed - currentStock });
      }
      return acc;
    }, []);

    // Merge real + mock, avoid duplicates
    const combined = [...realAlerts];
    mockAlerts.forEach(m => {
      const dupIdx = combined.findIndex(i => i.code === m.code);
      if (dupIdx > -1) {
        combined[dupIdx].needed += m.needed;
        combined[dupIdx].shortage = combined[dupIdx].needed - combined[dupIdx].stock;
      } else combined.push(m);
    });

    return combined;
  }, [records, items, alertDays]);

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
  const patientTypeData = useMemo(() => {
    const counts = records.reduce((acc, r) => { acc[r.patientType] = (acc[r.patientType] || 0) + 1; return acc; }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [records]);

  const insuranceData = useMemo(() => {
    const counts = records.reduce((acc, r) => { const k = r.insurance || 'Self pay'; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [records]);

  const agreementData = useMemo(() => {
    const counts = records.reduce((acc, r) => {
      const status = r.agreement === "agrees" ? 'ตกลงรักษา' : r.agreement === "declines" ? 'ไม่ตกลง' : 'รอยืนยัน';
      acc[status] = (acc[status] || 0) + 1; return acc;
    }, {});
    return [
      { name: 'ตกลงรักษา', value: counts['ตกลงรักษา'] || 0, color: '#10B981' },
      { name: 'ไม่ตกลง', value: counts['ไม่ตกลง'] || 0, color: '#EF4444' },
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
    })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [records]);

  const diagnosisStats = useMemo(() => {
    const counts = records.reduce((acc, r) => {
      if (selectedDoctorFilter && r.doctorName !== selectedDoctorFilter) return acc;
      const k = r.diagnosis || 'ไม่ระบุ';
      acc[k] = (acc[k] || 0) + 1; return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [records, selectedDoctorFilter]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
  const INS_COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#F59E0B'];

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'อรุณสวัสดิ์' : greetingHour < 17 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น';

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
        <div className="flex gap-3">
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

      {/* Stock Alerts Panel */}
      <StockAlertsPanel
        stockAlerts={stockAlerts}
        alertDays={alertDays}
        orderedItems={orderedItems}
        onAlertDaysChange={handleAlertDaysChange}
        onMarkOrdered={handleMarkOrdered}
      />

      {/* Donut Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient Type Donut */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm h-[200px] flex flex-col justify-between">
            <h2 className="text-[0.7rem] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Users size={14} /> สัดส่วนประเภทคนไข้
            </h2>
            <div className="flex-1 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={patientTypeData} innerRadius={45} outerRadius={60} paddingAngle={5} dataKey="value" animationDuration={1200} animationEasing="ease-out">
                    {patientTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-black text-slate-800">{totalEstimations}</span>
                <span className="text-[0.5rem] font-bold text-slate-400 uppercase">Total</span>
              </div>
            </div>
          </div>

          {/* Agreement Rate Donut */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm h-[200px] flex flex-col justify-between">
            <h2 className="text-[0.7rem] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 size={14} /> อัตราการตกลงรักษา
            </h2>
            <div className="flex-1 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={agreementData} innerRadius={45} outerRadius={60} paddingAngle={5} dataKey="value" animationDuration={1500} animationEasing="ease-out">
                    {agreementData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-black text-green-600">
                  {records.length > 0 ? Math.round((records.filter(r => r.agreement === "agrees").length / records.length) * 100) : 0}%
                </span>
                <span className="text-[0.5rem] font-bold text-slate-400 uppercase">Success</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Doctor + Diagnosis Stats */}
      <DoctorDiagnosisStats
        doctorStats={doctorStats}
        diagnosisStats={diagnosisStats}
        selectedDoctorFilter={selectedDoctorFilter}
        onSelectDoctor={setSelectedDoctorFilter}
      />

      {/* Insurance + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Insurance Donut */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden">
          <h2 className="font-black text-slate-900 mb-6 flex items-center gap-2">
            <ShieldCheck size={18} className="text-blue-600" /> สิทธิการรักษา
          </h2>
          <div className="h-[230px] w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={insuranceData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" animationDuration={1500} animationEasing="ease-out">
                  {insuranceData.map((entry, index) => <Cell key={`cell-${index}`} fill={INS_COLORS[index % INS_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center mb-6">
              <span className="text-lg font-black text-slate-800">{insuranceData.length}</span>
              <span className="text-[0.45rem] font-bold text-slate-400 uppercase">Rights</span>
            </div>
          </div>
        </div>

        {/* Recent Estimations */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-slate-100">
            <h2 className="font-black text-slate-900 flex items-center gap-2">
              <Activity size={18} className="text-blue-600" /> รายการล่าสุด
            </h2>
            <button onClick={() => navigate('/patients')} className="p-2 hover:bg-slate-50 rounded-full text-slate-400"><ChevronRight size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {records.slice(0, 4).map(r => (
              <div key={r.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate('/patients')}>
                <div>
                  <div className="font-bold text-slate-800 text-sm">{r.patientName || "ไม่ระบุชื่อ"}</div>
                  <div className="text-[0.65rem] text-slate-400 font-bold">{r.hn} • {r.status}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-[#0F294D] text-sm">{formatCurrency(r.totalCourse)}</div>
                  <div className="text-[0.6rem] text-slate-400 font-bold uppercase">{r.patientType}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
