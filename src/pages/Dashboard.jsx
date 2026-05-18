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
    // 1. Helper to calculate day difference from today to patient's appointment
    const getDaysDiff = (dateStr) => {
      if (!dateStr) return null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const appDate = new Date(dateStr);
      appDate.setHours(0, 0, 0, 0);
      const diffTime = appDate.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // 2. Start with the Mock Alerts for each day filter (MVP Presentation fallbacks)
    const mockAlerts = [];
    if (alertDays === 5) {
      mockAlerts.push({
        code: '5111160000006',
        name: 'Pemetrexed INJ (100 mg)',
        stock: 2,
        needed: 5,
        shortage: 3
      });
    } else if (alertDays === 7) {
      mockAlerts.push(
        {
          code: '5111160000006',
          name: 'Pemetrexed INJ (100 mg)',
          stock: 2,
          needed: 7,
          shortage: 5
        },
        {
          code: '5111180600005',
          name: 'CAMPTO 100 MG/5ML INJ.',
          stock: 10,
          needed: 12,
          shortage: 2
        },
        {
          code: '5120160800002',
          name: 'Fluquadri 0.5ml',
          stock: 20,
          needed: 25,
          shortage: 5
        }
      );
    }

    // 3. Dynamic Patient Record Demand Calculation Engine
    const realItemReq = {};
    records.forEach(r => {
      // Rule: Only include patients with treatment consent ("ตกลงรักษา")
      if (r.agreement !== 'agrees') return;

      // Rule: Check if appointment date falls within 3, 5, or 7 days (alertDays)
      const diffDays = getDaysDiff(r.appointmentDate);
      const isWithinRange = diffDays !== null && diffDays >= 0 && diffDays <= alertDays;
      if (!isWithinRange && diffDays !== null) return; 

      (r.selectedItems || []).forEach(item => {
        // Only target medications (category pharma)
        if (item.category !== 'pharma' && item.category !== undefined) return;
        if (item.isSet) return; // Sets are decomposed in estimations

        const code = item.itemCode;
        if (!realItemReq[code]) {
          realItemReq[code] = { code, name: item.Common_name, needed: 0 };
        }
        realItemReq[code].needed += (item.quantity || 1) * (r.courseCycles || 1);
      });
    });

    // 4. Compare with Inventory stock (Trigger alert if stock < needed)
    const realAlerts = [];
    Object.keys(realItemReq).forEach(code => {
      const req = realItemReq[code];
      const invItem = items.find(i => i.itemCode === code);
      const currentStock = invItem && invItem.stock !== undefined ? invItem.stock : 50;

      if (req.needed > currentStock) {
        realAlerts.push({
          code: req.code,
          name: req.name,
          stock: currentStock,
          needed: req.needed,
          shortage: req.needed - currentStock
        });
      }
    });

    // 5. Merge real and mock alerts, avoiding duplicates
    const combinedAlerts = [...realAlerts];
    mockAlerts.forEach(mockItem => {
      const duplicateIdx = combinedAlerts.findIndex(i => i.code === mockItem.code);
      if (duplicateIdx > -1) {
        // Add needed amounts together for a clean merge
        combinedAlerts[duplicateIdx].needed += mockItem.needed;
        combinedAlerts[duplicateIdx].shortage = combinedAlerts[duplicateIdx].needed - combinedAlerts[duplicateIdx].stock;
      } else {
        combinedAlerts.push(mockItem);
      }
    });

    return combinedAlerts;
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
      if (selectedDoctorFilter && r.doctorName !== selectedDoctorFilter) {
        return acc;
      }
      const k = r.diagnosis || 'ไม่ระบุ';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [records, selectedDoctorFilter]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
  const INS_COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#F59E0B'];

  const typeColors = { OPD: 'bg-blue-500', IPD: 'bg-green-500', OPDTR: 'bg-amber-500', IPDTR: 'bg-purple-500' };
  const agreeColors = { 'ตกลง': 'bg-green-500', 'ไม่ตกลง': 'bg-red-500', 'รอยืนยัน': 'bg-slate-300' };

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'อรุณสวัสดิ์' : greetingHour < 17 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น';

  // Calculate dynamic colors for the entire Low Stock panel container
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
                onClick={() => handleAlertDaysChange(days)}
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
                      <button 
                        disabled
                        className="flex items-center gap-1 bg-amber-500 text-white font-black text-[0.65rem] px-3.5 py-2 rounded-full border border-amber-400 shadow-sm shadow-amber-100 cursor-default"
                      >
                        <Check size={12} className="stroke-[3]" /> ✓ สั่งซื้อแล้ว (Pending)
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleMarkOrdered(alert.code)}
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-black text-slate-900 flex items-center gap-2">
              <UserRound size={18} className="text-indigo-600" /> สถิติแพทย์ (Top 5)
            </h2>
            <span className="text-[0.65rem] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border">คลิกเพื่อกรอง</span>
          </div>
          <div className="space-y-4">
            {doctorStats.length > 0 ? doctorStats.map((item, i) => {
              const isSelected = selectedDoctorFilter === item.name;
              return (
                <div 
                  key={i} 
                  onClick={() => setSelectedDoctorFilter(isSelected ? null : item.name)}
                  className={`relative p-2.5 rounded-xl transition-all group cursor-pointer ${isSelected ? 'bg-indigo-50/80 border border-indigo-200 shadow-sm' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold transition-colors ${isSelected ? 'text-indigo-700 font-black' : 'text-slate-700 group-hover:text-indigo-600'}`}>
                      {item.name}
                    </span>
                    <span className={`text-xs font-black ${isSelected ? 'text-indigo-700' : 'text-indigo-600'}`}>{item.value} ราย</span>
                  </div>
                  <div className="overflow-hidden h-1.5 text-xs flex rounded-full bg-indigo-100/60">
                    <div style={{ width: `${(item.value / doctorStats[0].value) * 100}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center rounded-full transition-all duration-1000 ${isSelected ? 'bg-indigo-600' : 'bg-indigo-500'}`}></div>
                  </div>

                  {/* Premium Tailwind Hover Tooltip */}
                  {item.topDiagnoses && item.topDiagnoses.length > 0 && !isSelected && (
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
              );
            }) : <div className="text-center py-10 text-slate-300 text-xs font-bold">ไม่มีข้อมูลสถิติแพทย์</div>}
          </div>
        </div>

        {/* Top Diagnoses */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-black text-slate-900 flex items-center gap-2 text-sm md:text-base">
              <Stethoscope size={18} className="text-blue-600" /> 
              <span>การวินิจฉัย {selectedDoctorFilter ? `ของ ${selectedDoctorFilter}` : '(Top 5)'}</span>
            </h2>
            {selectedDoctorFilter && (
              <button 
                onClick={() => setSelectedDoctorFilter(null)}
                className="text-[0.65rem] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors border border-rose-100"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>
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
