import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEstimations } from '../api';
import {
  Calculator, Users, TrendingUp, FileText,
  ArrowRight, Clock, Activity, DollarSign, Pill, ShieldCheck, CheckCircle2
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);

  useEffect(() => { getEstimations().then(setRecords); }, []);

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

  // Patient type distribution
  const typeCounts = records.reduce((acc, r) => {
    acc[r.patientType] = (acc[r.patientType] || 0) + 1;
    return acc;
  }, {});

  // Insurance distribution
  const insuranceCounts = records.reduce((acc, r) => {
    const k = r.insuranceType || 'ไม่ระบุ';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  // Agreement distribution
  const agreeCounts = records.reduce((acc, r) => {
    const status = r.patientAgrees === true ? 'ตกลง' : r.patientAgrees === false ? 'ไม่ตกลง' : 'รอยืนยัน';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // Top medications
  const topMedications = useMemo(() => {
    const drugMap = {};
    records.forEach(r => {
      (r.selectedItems || []).forEach(item => {
        if (item.isPreparation) return;
        if (!drugMap[item.itemCode]) {
          drugMap[item.itemCode] = { name: item.Common_name, count: 0, totalQty: 0 };
        }
        drugMap[item.itemCode].count += 1;
        drugMap[item.itemCode].totalQty += item.quantity || 1;
      });
    });
    return Object.values(drugMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [records]);

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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Recent Estimations */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex justify-between items-center p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Activity size={18} className="text-blue-600" /> ประเมินราคาล่าสุด
            </h2>
            <button onClick={() => navigate('/patients')}
              className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:underline">
              ดูทั้งหมด <ArrowRight size={14} />
            </button>
          </div>
          {records.length === 0 ? (
            <div className="text-center py-14 text-slate-400">
              <FileText size={40} className="opacity-20 mx-auto mb-3" />
              <p className="text-sm">ยังไม่มีการประเมินราคา<br />กดปุ่มด้านบนเพื่อเริ่มต้นครับ</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {records.slice(0, 6).map(r => {
                const agreeColor = r.patientAgrees === true ? 'bg-green-100 text-green-700' : r.patientAgrees === false ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500';
                const agreeLabel = r.patientAgrees === true ? '✓ ตกลงรักษา' : r.patientAgrees === false ? '✗ ไม่ตกลง' : 'รอยืนยัน';
                return (
                  <div key={r.id} className="flex justify-between items-center px-5 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer"      
                    onClick={() => navigate('/patients')}>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                        {r.patientName || 'ไม่ระบุชื่อ'}
                        <span className={`text-[0.6rem] px-2 py-0.5 rounded-full font-semibold ${agreeColor}`}>{agreeLabel}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        HN: {r.hn || '-'} {r.vnan ? `· VN/AN: ${r.vnan}` : ''} &nbsp;·&nbsp; {r.diagnosis || 'ไม่ระบุ diagnosis'}
                      </div>
                      <div className="text-xs text-slate-400">{formatDate(r.savedAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">{formatCurrency(r.totalCourse)}</div>
                      <span className="text-[0.65rem] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-semibold">
                        {r.patientType} · {r.courseCycles} cycle
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="flex flex-col gap-4">

          {/* Agreement Status Chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-600" /> อัตราการตกลงรักษา
            </h2>
            {totalEstimations === 0 ? (
              <div className="text-center text-slate-400 text-sm py-3">ยังไม่มีข้อมูล</div>
            ) : (
              <div className="space-y-3">
                {['ตกลง', 'ไม่ตกลง', 'รอยืนยัน'].map(status => {
                  const count = agreeCounts[status] || 0;
                  const pct = totalEstimations > 0 ? Math.round((count / totalEstimations) * 100) : 0;
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-xs text-slate-600 mb-1">
                        <span className="font-semibold">{status}</span>
                        <span>{count} ราย ({pct}%)</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${agreeColors[status]} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />      
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Patient Type Distribution */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Users size={18} className="text-purple-600" /> สัดส่วนประเภทคนไข้
            </h2>
            {totalEstimations === 0 ? (
              <div className="text-center text-slate-400 text-sm py-3">ยังไม่มีข้อมูล</div>
            ) : (
              <div className="space-y-2.5">
                {['OPD', 'IPD', 'OPDTR', 'IPDTR'].map(type => {
                  const count = typeCounts[type] || 0;
                  const pct = totalEstimations > 0 ? Math.round((count / totalEstimations) * 100) : 0;
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-xs text-slate-600 mb-1">
                        <span className="font-semibold">{type}</span>
                        <span>{count} ราย ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${typeColors[type]} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />      
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Insurance Distribution */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-green-600" /> สัดส่วนสิทธิการรักษา
            </h2>
            {totalEstimations === 0 ? (
              <div className="text-center text-slate-400 text-sm py-3">ยังไม่มีข้อมูล</div>
            ) : (
              <div className="space-y-2">
                {Object.entries(insuranceCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => {
                    const pct = Math.round((count / totalEstimations) * 100);
                    return (
                      <div key={type} className="flex items-center gap-2">
                        <span className="text-xs text-slate-600 w-[100px] truncate font-medium">{type}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 w-[30px] text-right">{count}</span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Medications */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Pill size={18} className="text-rose-600" /> ยาที่ใช้บ่อยที่สุด (Top 5)
          </h2>
          <button onClick={() => navigate('/drug-prices')}
            className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:underline">
            ดูราคายาทั้งหมด <ArrowRight size={14} />
          </button>
        </div>
        {topMedications.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Pill size={36} className="opacity-20 mx-auto mb-2" />
            <p className="text-sm">ยังไม่มีข้อมูล — เริ่มประเมินราคาเพื่อดูสถิติ</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {topMedications.map((drug, idx) => {
              const maxCount = topMedications[0]?.count || 1;
              const pct = Math.round((drug.count / maxCount) * 100);
              return (
                <div key={idx} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0
                    ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-amber-700' : 'bg-slate-200 text-slate-500'}`}>     
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 text-sm truncate">{drug.name}</div>
                    <div className="h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full bg-rose-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-slate-700">{drug.count} ครั้ง</div>
                    <div className="text-xs text-slate-400">{drug.totalQty} units</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
