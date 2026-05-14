import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEstimations, deleteEstimation } from '../api';
import mockData from '../mockData.json';
import { useToast } from '../components/Toast';
import {
  Search, Calculator, ClipboardList, Trash2,
  FileText, Phone, User, Pencil
} from 'lucide-react';

const mockPatients = mockData.patients;

export default function PatientRecords() {
  const navigate = useNavigate();
  const toast = useToast();
  const [savedRecords, setSavedRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('patients');
  const [selectedRecord, setSelectedRecord] = useState(null);

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
                  <th className="p-4 text-left font-bold text-slate-500">ประเภท</th>
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
                        {p.type} • {p.nationality === 'THAI' ? 'ไทย' : 'ต่างชาติ'}
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
                    <div className="text-[0.65rem] text-slate-400 mt-1">{formatDate(r.savedAt)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-[#0F294D]">{formatCurrency(r.totalCourse)}</div>
                    <span className="text-[0.6rem] px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-bold uppercase">{r.patientType} • {r.billingRight}</span>
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
                    <div className="flex gap-2 mt-3">
                      <span className="text-[0.65rem] px-2.5 py-1 bg-blue-100 text-blue-800 rounded font-black uppercase">{selectedRecord.patientType}</span>
                      <span className="text-[0.65rem] px-2.5 py-1 bg-purple-100 text-purple-800 rounded font-black uppercase">{selectedRecord.billingRight}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(selectedRecord)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-100"><Pencil size={18}/></button>
                    <button onClick={() => deleteRecord(selectedRecord.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg border border-red-100"><Trash2 size={18}/></button>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                   {selectedRecord.selectedItems?.map(item => (
                     <div key={item.id} className="flex justify-between text-sm">
                        <div className="flex-1">
                          <div className="font-bold">{item.Common_name}</div>
                          <div className="text-xs text-slate-400">{item.quantity} units {item.dose ? `(${item.dose})` : ''}</div>
                        </div>
                        <div className="font-mono">{formatCurrency((item[selectedRecord.billingRight] || item["OPD"]) * item.quantity)}</div>
                     </div>
                   ))}
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
    </div>
  );
}
