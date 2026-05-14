import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEstimations } from '../api';
import {
  Calculator, Users, TrendingUp, FileText,
  Clock, Activity, DollarSign, ShieldCheck, CheckCircle2, ChevronRight, AlertTriangle, Stethoscope, UserRound, Truck, Check
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [items, setItems] = useState([]);
  const [alertDays, setAlertDays] = useState(() => {
    return Number(localStorage.getItem('stock_alert_days') || 5);
  });
  const [orderedItems, setOrderedItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ordered_stock_items')) || {};
    } catch {
      return {};
    }
  });

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
    const itemReq = {};
    records.forEach(r => {
      (r.selectedItems || []).forEach(item => {
        const code = item.itemCode;
        if (!itemReq[code]) {
          itemReq[code] = { code, name: item.Common_name, needed: 0 };
        }
        itemReq[code].needed += (item.quantity || 1) * (r.courseCycles || 1);
      });
    });

    const alerts = [];
    items.forEach(invItem => {
      if (invItem.isSet) return;
      const baseNeeded = itemReq[invItem.itemCode]?.needed || (invItem.stock !== undefined && invItem.stock <= 5 ? invItem.stock + 4 : 0);
      const currentStock = invItem.stock !== undefined ? invItem.stock : 50;
      
      if (baseNeeded > 0) {
        const scaledNeeded = Math.round(baseNeeded * (alertDays / 5));
        if (scaledNeeded > currentStock) {
          alerts.push({
            code: invItem.itemCode,
            name: invItem.Common_name,
            stock: currentStock,
            needed: scaledNeeded,
            shortage: scaledNeeded - currentStock
          });
        }
      }
    });

    return alerts;
  }, [records, items, alertDays]);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val ?? 0);

  const formatDate = (iso) =>
    new Date(iso).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });

  const totalEstimations = records.length;
  const totalValue = records.reduce((s, r) => s + (r.totalCourse ?? 0), 0);
  const avgValue = totalEstimations > 0 ? totalValue / totalEstimations : 0;
  const todayCount = records.filter(r => {
    const d = new Date(r.savedAt);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const stats = [
    { label: 'ประเมินราคาทั้งหมด', value: totalEstimations, unit: 'รายการ', icon: <FileText size={22} />, color: 'bg-blue-100 text-blue-600', border: 'border-blue-200' },
    { label: 'ประเมินราคาวันนี้', value: todayCount, unit: 'รายการ', icon: <Clock size={22} />, color: 'bg-green-100 text-green-600', border: 'border-green-200' },
    { label: 'มูลค่ารวมทั้งหมด', value: formatCurrency(totalValue), unit: 'บาท', icon: <DollarSign size={22} />, color: 'bg-yellow-100 text-yellow-600', border: 'border-yellow-200' },
    { label: 'มูลค่าเฉลี่ยต่อราย', value: formatCurrency(avgValue), unit: 'บาท', icon: <TrendingUp size={22} />, color: 'bg-purple-100 text-purple-600', border: 'border-purple-200' },
  ];

  // 2. Patient Type Donut Data
  const patientTypeData = useMemo(() => {
    const counts = records.reduce((acc, r) => {
      acc[r.patientType] = (acc[r.patientType] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [records]);

  // 3. Insurance Donut Data
  const insuranceData = useMemo(() => {
    const counts = records.reduce((acc, r) => {
      const k = r.insurance || 'Self pay';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [records]);

  // 4. Success Rate Donut Data
  const agreementData = useMemo(() => {
    const counts = records.reduce((acc, r) => {
      const status = r.agreement === "agrees" ? 'ตกลงรักษา' : r.agreement === "declines" ? 'ไม่ตกลง' : 'รอยืนยัน';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    return [
      { name: 'ตกลงรักษา', value: counts['ตกลงรักษา'] || 0, color: '#10B981' },
      { name: 'ไม่ตกลง', value: counts['ไม่ตกลง'] || 0, color: '#EF4444' },
      { name: 'รอยืนยัน', value: counts['รอยืนยัน'] || 0, color: '#94A3B8' }
    ].filter(i => i.value > 0);
  }, [records]);

  // 5. Doctor Stats
  const doctorStats = useMemo(() => {
    const counts = {};
    const docDiags = {};

    records.forEach(r => {
      const k = r.doctorName || 'ไม่ระบุ';
      counts[k] = (counts[k] || 0) + 1;

      if (!docDiags[k]) docDiags[k] = {};
      const diag = r.diagnosis || 'ไม่ระบุ';
      docDiags[k][diag] = (docDiags[k][diag] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => {
        const topDiagnoses = Object.entries(docDiags[name] || {})
          .map(([dName, dCount]) => ({ name: dName, count: dCount }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);
        return { name, value, topDiagnoses };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [records]);

  // 6. Diagnosis Stats
  const diagnosisStats = useMemo(() => {
    const counts = records.reduce((acc, r) => {
      const k = r.diagnosis || 'ไม่ระบุ';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [records]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
  const INS_COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#F59E0B'];

  const typeColors = { OPD: 'bg-blue-500', IPD: 'bg-green-500', OPDTR: 'bg-amber-500', IPDTR: 'bg-purple-500' };
  const agreeColors = { 'ตกลง': 'bg-green-500', 'ไม่ตกลง': 'bg-red-500', 'รอยืนยัน': 'bg-slate-300' };

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
          <button onClick={() => navigate('/estimator')}
            className="flex items-center gap-2 bg-white text-[#0F294D] px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors">
            <Calculator size={16} /> ประเมินราคาใหม่
          </button>
          <button onClick={() => navigate('/patients')}
            className="flex items-center gap-2 bg-white/10 text-white border border-white/20 px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-white/20 transition-colors">
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

      {/* Low Stock & Order Alerts Panel */}
      <div className="bg-white border border-rose-200 rounded-3xl p-6 mb-6 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h2 className="font-black text-slate-900 flex items-center gap-2 text-base">
              <AlertTriangle size={18} className="text-rose-600 animate-pulse" /> ระบบแจ้งเตือนสต็อกยาและการสั่งซื้อ (Low Stock / Order Alerts)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              แสดงรายการยาที่ปริมาณความต้องการใช้สูงกว่าสต็อกคงเหลือ เพื่อวางแผนจัดซื้อล่วงหน้า
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 self-start md:self-auto">
            <span className="text-[0.65rem] font-bold text-slate-500 px-2 uppercase tracking-tighter">เตือนล่วงหน้า:</span>
            {[3, 5, 7].map(days => (
              <button
                key={days}
                onClick={() => handleAlertDaysChange(days)}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${alertDays === days ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                {days} วัน
              </button>
            ))}
          </div>
        </div>

        {stockAlerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stockAlerts.map(alert => (
              <div key={alert.code} className="bg-rose-50/40 border border-rose-100 rounded-2xl p-4 flex justify-between items-center hover:bg-rose-50/80 transition-colors">
                <div className="flex-1 pr-3">
                  <div className="font-bold text-slate-900 text-xs line-clamp-1">{alert.name}</div>
                  <div className="text-[0.6rem] text-slate-400 font-mono mt-0.5">{alert.code}</div>
                  <div className="flex gap-3 mt-2 text-[0.65rem]">
                    <span className="text-slate-600">สต็อกคงเหลือ: <strong className="text-slate-900">{alert.stock}</strong></span>
                    <span className="text-slate-600">ต้องใช้: <strong className="text-rose-600">{alert.needed}</strong></span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end justify-center">
                  {orderedItems[alert.code] ? (
                    <button 
                      disabled
                      className="flex items-center gap-1.5 bg-amber-100 text-amber-800 font-black text-[0.65rem] px-3 py-1.5 rounded-full border border-amber-200 cursor-not-allowed shadow-none"
                    >
                      <Check size={12} className="text-amber-700 stroke-[3]" /> สั่งซื้อแล้ว (Pending)
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleMarkOrdered(alert.code)}
                      className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-[0.65rem] px-3 py-1.5 rounded-full shadow-sm transition-all duration-150"
                    >
                      <Truck size={12} /> สั่งเพิ่ม +{alert.shortage}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <span className="text-xs font-bold text-slate-400">✅ สต็อกยาเพียงพอสำหรับการใช้งานในช่วง {alertDays} วันข้างหน้า</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Proportions Section */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient Type Donut */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm h-[200px] flex flex-col justify-between">
            <h2 className="text-[0.7rem] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Users size={14} /> สัดส่วนประเภทคนไข้
            </h2>
            <div className="flex-1 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={patientTypeData} 
                    innerRadius={45} 
                    outerRadius={60} 
                    paddingAngle={5} 
                    dataKey="value"
                    animationDuration={1200}
                    animationEasing="ease-out"
                  >
                    {patientTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-black text-slate-800">{totalEstimations}</span>
                <span className="text-[0.5rem] font-bold text-slate-400 uppercase">Total</span>
              </div>
            </div>
          </div>

          {/* Success Rate Donut */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm h-[200px] flex flex-col justify-between">
            <h2 className="text-[0.7rem] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 size={14} /> อัตราการตกลงรักษา
            </h2>
            <div className="flex-1 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={agreementData} 
                    innerRadius={45} 
                    outerRadius={60} 
                    paddingAngle={5} 
                    dataKey="value"
                    animationDuration={1500}
                    animationEasing="ease-out"
                  >
                    {agreementData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Doctors */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h2 className="font-black text-slate-900 mb-6 flex items-center gap-2">
            <UserRound size={18} className="text-indigo-600" /> สถิติแพทย์ (Top 5)
          </h2>
          <div className="space-y-4">
            {doctorStats.length > 0 ? doctorStats.map((item, i) => (
              <div key={i} className="relative pt-1 group cursor-pointer">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-700 border-b border-dashed border-slate-300 group-hover:text-indigo-600 transition-colors">
                    {item.name}
                  </span>
                  <span className="text-xs font-black text-indigo-600">{item.value} ราย</span>
                </div>
                <div className="overflow-hidden h-1.5 text-xs flex rounded-full bg-indigo-50">
                  <div style={{ width: `${(item.value / doctorStats[0].value) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 rounded-full transition-all duration-1000"></div>
                </div>

                {/* Premium Tailwind Hover Tooltip */}
                {item.topDiagnoses && item.topDiagnoses.length > 0 && (
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-max max-w-xs bg-[#0F294D] text-white text-[0.65rem] rounded-xl p-3 shadow-xl z-50 animate-in fade-in duration-150 border border-white/10">
                    <div className="font-black text-indigo-300 mb-1.5 pb-1 border-b border-white/10">การวินิจฉัยหลักของแพทย์ท่านนี้:</div>
                    <div className="space-y-1 text-slate-200">
                      {item.topDiagnoses.map((d, di) => (
                        <div key={di} className="flex justify-between gap-6">
                          <span className="truncate max-w-[160px]">{d.name}</span>
                          <span className="font-bold text-white font-mono">{d.count} ครั้ง</span>
                        </div>
                      ))}
                    </div>
                    {/* Arrow */}
                    <div className="absolute left-4 top-full w-2 h-2 bg-[#0F294D] rotate-45 -mt-1 border-r border-b border-white/10"></div>
                  </div>
                )}
              </div>
            )) : <div className="text-center py-10 text-slate-300 text-xs font-bold">ไม่มีข้อมูลสถิติแพทย์</div>}
          </div>
        </div>

        {/* Top Diagnoses */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h2 className="font-black text-slate-900 mb-6 flex items-center gap-2">
            <Stethoscope size={18} className="text-blue-600" /> การวินิจฉัย (Top 5)
          </h2>
          <div className="space-y-4">
            {diagnosisStats.length > 0 ? diagnosisStats.map((item, i) => (
              <div key={i} className="relative pt-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-700">{item.name}</span>
                  <span className="text-xs font-black text-blue-600">{item.value} ราย</span>
                </div>
                <div className="overflow-hidden h-1.5 text-xs flex rounded-full bg-blue-50">
                  <div style={{ width: `${(item.value / diagnosisStats[0].value) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 rounded-full transition-all duration-1000"></div>
                </div>
              </div>
            )) : <div className="text-center py-10 text-slate-300 text-xs font-bold">ไม่มีข้อมูลสถิติการวินิจฉัย</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Insurance Proportions */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden">
          <h2 className="font-black text-slate-900 mb-6 flex items-center gap-2">
            <ShieldCheck size={18} className="text-blue-600" /> สิทธิการรักษา
          </h2>
          <div className="h-[230px] w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={insuranceData} 
                  innerRadius={50} 
                  outerRadius={70} 
                  paddingAngle={5} 
                  dataKey="value"
                  animationDuration={1500}
                  animationEasing="ease-out"
                >
                  {insuranceData.map((entry, index) => <Cell key={`cell-${index}`} fill={INS_COLORS[index % INS_COLORS.length]} />)}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center mb-6">
              <span className="text-lg font-black text-slate-800">{insuranceData.length}</span>
              <span className="text-[0.45rem] font-bold text-slate-400 uppercase">Rights</span>
            </div>
          </div>
        </div>

        {/* Recent Estimations List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-slate-100">
            <h2 className="font-black text-slate-900 flex items-center gap-2">
              <Activity size={18} className="text-blue-600" /> รายการล่าสุด
            </h2>
            <button onClick={() => navigate('/patients')} className="p-2 hover:bg-slate-50 rounded-full text-slate-400"><ChevronRight size={20}/></button>
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
