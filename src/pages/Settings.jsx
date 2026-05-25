import React, { useState, useEffect } from 'react';
import { 
  Users, Database, FileDown, Settings as SettingsIcon, 
  Trash2, Plus, Save, Download 
} from 'lucide-react';
import { 
  getDoctors, getDiagnoses, getAssessors, 
  addNewDoctor, addNewDiagnosis, addNewAssessor,
  deleteMasterData, getUsers, createUser, updateUser, deleteUser,
  getEstimations
} from '../api';
import { useToast } from '../components/Toast';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('master-data');
  const toast = useToast();

  // --- Master Data State ---
  const [doctors, setDoctors] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  const [assessors, setAssessors] = useState([]);
  
  const [newDoctor, setNewDoctor] = useState('');
  const [newDiagnosis, setNewDiagnosis] = useState('');
  const [newAssessor, setNewAssessor] = useState('');

  // --- Export State ---
  const [exportMonth, setExportMonth] = useState('');

  // --- Confirm Dialog State ---
  const [confirmDialog, setConfirmDialog] = useState(null);

  // --- Users State ---
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ id: '', name: '', password: '', role: 'pharma', avatar: '' });

  // --- Init ---
  useEffect(() => {
    loadMasterData();
    loadUsers();
  }, []);

  const loadMasterData = async () => {
    try {
      const docs = await getDoctors();
      const diags = await getDiagnoses();
      const asss = await getAssessors();
      setDoctors(docs);
      setDiagnoses(diags);
      setAssessors(asss);
    } catch (err) {
      toast.error('Failed to load master data');
    }
  };

  const loadUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res);
    } catch (err) {
      toast.error('Failed to load users');
    }
  };

  // --- Master Data Handlers ---
  const handleAddMasterData = async (type, val, setVal) => {
    if (!val.trim()) return;
    try {
      if (type === 'doctor') await addNewDoctor(val);
      if (type === 'diagnosis') await addNewDiagnosis(val);
      if (type === 'assessor') await addNewAssessor(val);
      setVal('');
      loadMasterData();
      toast.success('เพิ่มข้อมูลสำเร็จ');
    } catch {
      toast.error('ไม่สามารถเพิ่มข้อมูลได้');
    }
  };

  const handleDeleteMasterData = (type, val) => {
    setConfirmDialog({
      isOpen: true,
      title: 'ยืนยันการลบข้อมูล',
      message: `คุณต้องการลบ "${val}" ใช่หรือไม่?`,
      onConfirm: async () => {
        try {
          await deleteMasterData(type, val);
          loadMasterData();
          toast.success('ลบข้อมูลสำเร็จ');
        } catch {
          toast.error('ไม่สามารถลบข้อมูลได้');
        }
        setConfirmDialog(null);
      }
    });
  };

  // --- Users Handlers ---
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.id || !newUser.name || !newUser.password) {
      toast.warning('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    try {
      await createUser(newUser);
      setNewUser({ id: '', name: '', password: '', role: 'pharma', avatar: '' });
      loadUsers();
      toast.success('สร้างผู้ใช้สำเร็จ');
    } catch {
      toast.error('รหัสผู้ใช้อาจซ้ำกัน กรุณาลองใหม่');
    }
  };

  const handleDeleteUser = (id) => {
    if (id === 'admin') {
      toast.warning('ไม่สามารถลบผู้ดูแลระบบหลักได้');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'ยืนยันการลบผู้ใช้งาน',
      message: `คุณต้องการลบผู้ใช้ "${id}" ใช่หรือไม่?`,
      onConfirm: async () => {
        try {
          await deleteUser(id);
          loadUsers();
          toast.success('ลบผู้ใช้สำเร็จ');
        } catch {
          toast.error('ไม่สามารถลบผู้ใช้ได้');
        }
        setConfirmDialog(null);
      }
    });
  };

  const handleUpdateUserRole = async (id, newRole) => {
    if (id === 'admin') {
      toast.warning('ไม่สามารถเปลี่ยนสิทธิ์ผู้ดูแลระบบหลักได้');
      return;
    }
    try {
      const userToUpdate = users.find(u => u.id === id);
      await updateUser(id, { ...userToUpdate, role: newRole });
      loadUsers();
      toast.success('อัปเดตสิทธิ์สำเร็จ');
    } catch {
      toast.error('ไม่สามารถอัปเดตสิทธิ์ได้');
    }
  };

  // --- Export Handler ---
  const handleExportCSV = async () => {
    try {
      let records = await getEstimations();
      
      if (exportMonth) {
        records = records.filter(r => r.savedAt && r.savedAt.startsWith(exportMonth));
      }

      if (records.length === 0) {
        toast.warning('ไม่มีข้อมูลสำหรับ Export');
        return;
      }
      
      const headers = ['ID', 'HN', 'Name', 'Doctor', 'Status', 'Grand Total', 'Date'];
      const rows = records.map(r => [
        r.id, r.hn, r.patientName, r.doctorName, r.status, r.grandTotal, new Date(r.savedAt).toLocaleDateString()
      ]);
      
      let csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
        + headers.join(",") + "\n"
        + rows.map(e => e.join(",")).join("\n");
        
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `estimations_export_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Export สำเร็จ');
    } catch (err) {
      toast.error('Export ล้มเหลว');
    }
  };

  // --- Render Helpers ---
  const renderMasterDataList = (title, items, type, newVal, setNewVal) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
      <h3 className="font-black text-[#0F294D] mb-4">{title}</h3>
      <div className="flex gap-2 mb-4">
        <input 
          type="text" 
          value={newVal} 
          onChange={e => setNewVal(e.target.value)}
          placeholder={`เพิ่ม ${title}...`}
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
        <button 
          onClick={() => handleAddMasterData(type, newVal, setNewVal)}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} />
        </button>
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {items.map(item => (
          <div key={item} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg group">
            <span className="text-sm font-medium text-slate-700">{item}</span>
            <button 
              onClick={() => handleDeleteMasterData(type, item)}
              className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-2">
      
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 mb-6 pb-2">
        <button onClick={() => setActiveTab('master-data')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'master-data' ? 'bg-[#0F294D] text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>
          <Database size={16} /> จัดการ Master Data
        </button>
        <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-[#0F294D] text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>
          <Users size={16} /> จัดการสิทธิ์ผู้ใช้งาน
        </button>
        <button onClick={() => setActiveTab('export')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'export' ? 'bg-[#0F294D] text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>
          <FileDown size={16} /> ระบบส่งออกรายงาน
        </button>
        <button onClick={() => setActiveTab('config')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'config' ? 'bg-[#0F294D] text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>
          <SettingsIcon size={16} /> ตั้งค่าระบบ
        </button>
      </div>

      {/* Tab Content: Master Data */}
      {activeTab === 'master-data' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderMasterDataList('รายชื่อแพทย์ (Doctors)', doctors, 'doctor', newDoctor, setNewDoctor)}
          {renderMasterDataList('การวินิจฉัย (Diagnoses)', diagnoses, 'diagnosis', newDiagnosis, setNewDiagnosis)}
          {renderMasterDataList('ผู้ประเมิน (Assessors)', assessors, 'assessor', newAssessor, setNewAssessor)}
        </div>
      )}

      {/* Tab Content: Users */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="p-4 font-bold">Username</th>
                  <th className="p-4 font-bold">Name</th>
                  <th className="p-4 font-bold">Role</th>
                  <th className="p-4 font-bold text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="p-4 font-mono font-bold text-slate-700">{u.id}</td>
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">{u.avatar || u.id.charAt(0).toUpperCase()}</div>
                      <span className="font-medium">{u.name}</span>
                    </td>
                    <td className="p-4">
                      {u.id === 'admin' ? (
                        <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold uppercase tracking-wider">{u.role}</span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                          className="px-2 py-1 bg-slate-100 rounded text-xs font-bold uppercase tracking-wider border border-slate-200 outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="pharma">PHARMA</option>
                          <option value="nurse">NURSE</option>
                          <option value="admin">ADMIN</option>
                        </select>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDeleteUser(u.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h3 className="font-black text-[#0F294D] mb-4">เพิ่มผู้ใช้งานใหม่</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Username (ID)</label>
                <input type="text" required value={newUser.id} onChange={e => setNewUser({...newUser, id: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                <input type="text" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Password</label>
                <input type="text" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Role</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                  <option value="pharma">เภสัชกร (Pharmacist)</option>
                  <option value="nurse">พยาบาล (Nurse)</option>
                  <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-[#0F294D] text-white py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 mt-2 hover:bg-slate-800 transition-colors">
                <Save size={16} /> บันทึก
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab Content: Export */}
      {activeTab === 'export' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 max-w-2xl text-center mx-auto">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileDown size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">ส่งออกข้อมูลประเมินราคา (CSV)</h2>
          <p className="text-slate-500 text-sm mb-6">คุณสามารถดาวน์โหลดรายการประเมินราคาที่ถูกบันทึกทั้งหมด หรือเลือกเฉพาะเดือนที่ต้องการ เพื่อนำไปเปิดในโปรแกรม Excel หรือทำสรุปรายงานได้</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-2">
            <input
              type="month"
              value={exportMonth}
              onChange={e => setExportMonth(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-green-500 cursor-pointer min-w-[200px]"
              title="เลือกเดือนที่ต้องการส่งออก (เว้นว่างเพื่อส่งออกทั้งหมด)"
            />
            <button onClick={handleExportCSV} className="bg-green-600 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-green-600/30 hover:bg-green-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
              <Download size={20} /> ดาวน์โหลดไฟล์ CSV
            </button>
          </div>
          {exportMonth && <p className="text-xs text-slate-400 mt-2">กำลังเลือกข้อมูลของเดือน: {exportMonth}</p>}
        </div>
      )}

      {/* Tab Content: Config */}
      {activeTab === 'config' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 max-w-2xl mx-auto opacity-70 pointer-events-none">
          <h3 className="font-black text-lg text-slate-800 mb-4 flex items-center gap-2">
            <SettingsIcon size={20} /> การตั้งค่าระบบ (Coming Soon)
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">HIS API Endpoint URL</label>
              <input type="text" value="https://his-internal.siriroj.com/api/v1" disabled className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">HIS API Token / Secret</label>
              <input type="password" value="************************" disabled className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50" />
            </div>
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-500 mb-1">Default Markup Percentage (%)</label>
              <input type="number" value="10" disabled className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50" />
            </div>
          </div>
          <p className="text-xs text-amber-600 font-bold mt-4 bg-amber-50 p-3 rounded-lg text-center">
            หน้านี้สงวนไว้สำหรับการพัฒนาระบบเชื่อมต่อ HIS ในเฟสถัดไป
          </p>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmDialog?.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">{confirmDialog.title}</h3>
            <p className="text-sm text-slate-500 font-bold mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setConfirmDialog(null)} className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-black text-sm hover:bg-slate-200 transition-colors">
                ยกเลิก
              </button>
              <button onClick={confirmDialog.onConfirm} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-black text-sm hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30">
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
