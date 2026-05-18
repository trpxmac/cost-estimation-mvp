import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEstimations, deleteEstimation } from '../api';
import mockData from '../mockData.json';
import { useToast } from '../components/Toast';
import {
  Search, Calculator, ClipboardList, Trash2,
  FileText, Phone, User, Pencil, Pill, Stethoscope, ClipboardCheck, X
} from 'lucide-react';

const mockPatients = mockData.patients;

export default function PatientRecords() {
  const navigate = useNavigate();
  const toast = useToast();
  const [savedRecords, setSavedRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('patients');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    getEstimations()
      .then(setSavedRecords)
      .catch(() => toast.error('โหลดข้อมูลไม่สำเร็จ'));
  }, []);

  const filteredPatients = mockPatients.filter(p => {
    const q = searchTerm.toLowerCase();
    return (
      p.patient_id.toLowerCase().includes(q) ||
      p.name_en.toLowerCase().includes(q) ||
      p.name_th.includes(searchTerm) ||
      p.phone?.toLowerCase().includes(q)
    );
  });

  const filteredHistory = savedRecords.filter(r => {
    const q = searchTerm.toLowerCase();
    return (
      r.hn?.toLowerCase().includes(q) ||
      r.patientName?.toLowerCase().includes(q) ||
      r.doctorName?.toLowerCase().includes(q)
    );
  });

  const deleteRecord = async (id) => {
    const record = savedRecords.find(r => r.id === id);
    if (!confirm(`ลบบันทึกของ "${record?.patientName || 'ไม่ระบุชื่อ'}"?`)) return;
    try {
      await deleteEstimation(id);
      setSavedRecords(prev => prev.filter(r => r.id !== id));
      if (selectedRecord?.id === id) setSelectedRecord(null);
      toast.success('ลบสำเร็จ');
    } catch (e) {
      toast.error('ลบไม่สำเร็จ');
    }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val ?? 0);

  const formatDate = (iso) =>
    new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });

  const handleEdit = (record) => {
    navigate('/estimator', { state: { editRecord: record } });
  };

  const handleEstimateFromPatient = (patient) => {
    // Determine billingRight based on nationality
    let billingRight = patient.type || 'OPD';
    if (patient.nationality === 'INTERNATIONAL') {
      billingRight += 'TR'; // Becomes OPDTR or IPDTR
    }

    navigate('/estimator', {
      state: {
        hn: patient.patient_id,
        patientName: patient.name_th || patient.name_en,
        doctorName: patient.doctor || '',
        insuranceType: patient.insurance || 'self pay',
        patientType: patient.type || 'OPD',
        billingRight: billingRight
      }
    });
  };

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
        <div className="relative mb-4">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text"
            className="w-full bg-white border border-slate-200 rounded-lg py-3 px-4 pl-10 text-sm focus:outline-none focus:border-blue-500"
            placeholder="ค้นหาด้วย HN, ชื่อคนไข้, หรือเบอร์โทร..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>

        <div className="flex gap-2">
          <button onClick={() => setActiveTab('patients')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'patients' ? 'bg-[#0F294D] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            <User size={15} /> รายชื่อผู้ป่วย (iMed)
          </button>
          <button onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'history' ? 'bg-[#0F294D] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            <ClipboardList size={15} /> ประวัติการประเมิน
          </button>
        </div>
      </div>

      {activeTab === 'patients' ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-left font-bold text-slate-500">HN</th>
                  <th className="p-4 text-left font-bold text-slate-500">ชื่อ-นามสกุล</th>
                  <th className="p-4 text-left font-bold text-slate-500">สัญชาติ</th>
                  <th className="p-4 text-left font-bold text-slate-500">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map(p => (
                  <tr key={p.patient_id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-slate-500">{p.patient_id}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{p.name_th || p.name_en}</div>
                      <div className="text-xs text-slate-400">{p.gender}, {p.age} ปี</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[0.7rem] font-black uppercase ${p.nationality === 'THAI' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'}`}>
                        {p.nationality === 'THAI' ? 'ไทย' : 'ต่างชาติ'}
                      </span>
                    </td>
                    <td className="p-4">
                      <button onClick={() => handleEstimateFromPatient(p)}
                        className="flex items-center gap-1.5 bg-[#0F294D] text-white py-1.5 px-4 rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors">
                        <Calculator size={13} /> ประเมินราคา
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-y-auto max-h-[600px]">
            {filteredHistory.map(r => (
              <div key={r.id} onClick={() => setSelectedRecord(r)}
                className={`p-4 cursor-pointer border-b border-slate-100 hover:bg-blue-50 transition-colors ${selectedRecord?.id === r.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{r.patientName || 'ไม่ระบุชื่อ'}</div>
                    <div className="text-xs text-slate-500 mt-0.5">HN: {r.hn || '-'} | {r.doctorName || '-'}</div>
                    {r.appointmentDate && (
                      <div className="text-[0.65rem] font-bold text-indigo-600 bg-indigo-50/70 border border-indigo-100 rounded px-1.5 py-0.5 mt-1 inline-block">
                        📅 นัดหมาย: {new Date(r.appointmentDate).toLocaleDateString('th-TH')}
                      </div>
                    )}
                    <div className="text-[0.65rem] text-slate-400 mt-1">{formatDate(r.savedAt)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-[#0F294D]">{formatCurrency(r.totalCourse)}</div>
                    <div className="flex flex-col items-end gap-1 mt-1">
                      <span className={`text-[0.55rem] px-2 py-0.5 rounded-full font-black uppercase border ${
                        r.status === "สมบูรณ์" ? "bg-green-100 text-green-700 border-green-200" :
                        r.status === "รอพยาบาล" ? "bg-blue-100 text-blue-700 border-blue-200" :
                        r.status === "รอเภสัช" ? "bg-indigo-100 text-indigo-700 border-indigo-200" :
                        "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        {r.status || "รอตรวจสอบ"}
                      </span>
                      <span className="text-[0.55rem] text-slate-400 font-bold uppercase">ประวัติการประเมิน</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-3">
            {selectedRecord ? (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-start mb-6 pb-4 border-b">
                  <div>
                    <h3 className="font-black text-lg text-[#0F294D]">{selectedRecord.patientName}</h3>
                    <div className="text-sm text-slate-500">HN: {selectedRecord.hn} • แพทย์: {selectedRecord.doctorName}</div>
                    {selectedRecord.appointmentDate && (
                      <div className="text-xs text-indigo-600 font-bold mt-1 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded inline-block">
                        📅 นัดหมาย: {new Date(selectedRecord.appointmentDate).toLocaleDateString('th-TH')}
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">

                      <span className={`text-[0.65rem] px-2.5 py-1 rounded font-black uppercase border ${
                        selectedRecord.status === "สมบูรณ์" ? "bg-green-100 text-green-700 border-green-200" :
                        selectedRecord.status === "รอพยาบาล" ? "bg-blue-100 text-blue-700 border-blue-200" :
                        selectedRecord.status === "รอเภสัช" ? "bg-indigo-100 text-indigo-700 border-indigo-200" :
                        "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        {selectedRecord.status || "รอตรวจสอบ"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(selectedRecord)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-100"><Pencil size={18}/></button>
                    <button onClick={() => deleteRecord(selectedRecord.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg border border-red-100"><Trash2 size={18}/></button>
                  </div>
                </div>
                
                {/* Grouped Summary Section */}
                <div className="space-y-4 mb-8">
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm"><Pill size={20} /></div>
                      <div>
                        <div className="text-[0.6rem] font-black text-blue-400 uppercase tracking-tighter">ส่วนงานเภสัชกรรม</div>
                        <div className="text-xs font-bold text-slate-700">{selectedRecord.selectedItems?.filter(i => i.category === "pharma" || !i.category).length || 0} รายการ</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-blue-700">{formatCurrency(selectedRecord.pharmaTotal)}</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm"><Stethoscope size={20} /></div>
                      <div>
                        <div className="text-[0.6rem] font-black text-indigo-400 uppercase tracking-tighter">ส่วนงานพยาบาลและบริการ</div>
                        <div className="text-xs font-bold text-slate-700">{selectedRecord.selectedItems?.filter(i => i.category === "nurse").length || 0} รายการ</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-indigo-700">{formatCurrency(selectedRecord.nurseTotal)}</div>
                    </div>
                  </div>

                  {selectedRecord.prepFeeTotal > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between opacity-80">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-500 shadow-sm"><ClipboardCheck size={20} /></div>
                        <div>
                          <div className="text-[0.6rem] font-black text-slate-400 uppercase tracking-tighter">ค่าเวชภัณฑ์และค่าเตรียมยา</div>
                          <div className="text-xs font-bold text-slate-700">{selectedRecord.prepFeeQty} ครั้ง</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-slate-700">{formatCurrency(selectedRecord.prepFeeTotal)}</div>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => setShowModal(true)}
                    className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-xs font-black hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
                  >
                    <Search size={14} /> ดูรายละเอียดรายการทั้งหมด
                  </button>
                </div>

                <div className="bg-[#FFD700] p-4 rounded-xl flex justify-between items-center font-black">
                  <span>ยอดรวมทั้งสิ้น</span>
                  <span className="text-xl">{formatCurrency(selectedRecord.totalCourse)}</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl h-full flex flex-col items-center justify-center text-slate-400 p-12">
                <FileText size={48} className="opacity-20 mb-3" />
                <p className="font-bold">เลือกรายการเพื่อดูรายละเอียด</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal for Detailed Item List */}
      {showModal && selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-black text-xl text-[#0F294D]">รายละเอียดรายการ</h3>
                <p className="text-xs text-slate-400 font-bold uppercase mt-1">HN: {selectedRecord.hn} • {selectedRecord.patientName}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Pharma Section */}
              <section>
                <h4 className="text-[0.65rem] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Pill size={14} /> รายการยาและเวชภัณฑ์
                </h4>
                <div className="divide-y border rounded-2xl overflow-hidden">
                  {selectedRecord.selectedItems?.filter(i => i.category === "pharma" || !i.category).map(item => (
                    <div key={item.id} className="p-3 flex justify-between items-center bg-white">
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{item.Common_name}</div>
                        <div className="text-[0.65rem] text-slate-400 font-bold">{item.quantity} units {item.dose ? `• ${item.dose}` : ''}</div>
                      </div>
                      <div className="text-right font-mono text-sm font-black text-slate-700">
                        {formatCurrency((item[selectedRecord.billingRight] || item["OPD"]) * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Nurse Section */}
              <section>
                <h4 className="text-[0.65rem] font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Stethoscope size={14} /> รายการพยาบาลและค่าบริการ
                </h4>
                <div className="divide-y border rounded-2xl overflow-hidden">
                  {selectedRecord.selectedItems?.filter(i => i.category === "nurse").map(item => (
                    <div key={item.id} className="p-3 flex justify-between items-center bg-white">
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{item.Common_name}</div>
                        <div className="text-[0.65rem] text-slate-400 font-bold">{item.quantity} units</div>
                      </div>
                      <div className="text-right font-mono text-sm font-black text-slate-700">
                        {formatCurrency((item[selectedRecord.billingRight] || item["OPD"]) * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="p-6 bg-slate-50 border-t flex justify-between items-center">
              <div>
                <div className="text-[0.65rem] font-black text-slate-400 uppercase">Grand Total</div>
                <div className="text-2xl font-black text-[#0F294D]">{formatCurrency(selectedRecord.totalCourse)}</div>
              </div>
              <button onClick={() => setShowModal(false)} className="bg-[#0F294D] text-white px-8 py-3 rounded-xl font-black text-sm hover:bg-slate-800 transition-all shadow-lg">ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
