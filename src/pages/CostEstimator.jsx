import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { searchMedications, saveEstimation, updateEstimation, getEstimationById, getDoctors, getDiagnoses, getAssessors } from "../api";
import { useToast } from "../components/Toast";
import { User, Trash2, Search, FileText, Activity, Plus, Minus, Save, Printer, Pencil, Pill, CreditCard, Stethoscope, ClipboardCheck, ChevronRight, Calculator, UserRound, Users, X } from "lucide-react";

export default function CostEstimator() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  // --- Form State ---
  const [hn, setHn] = useState("");
  const [vnan, setVnan] = useState("");
  const [patientName, setPatientName] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [assessor, setAssessor] = useState("");
  const [bsa, setBsa] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [patientType, setPatientType] = useState("OPD");
  const [billingRight, setBillingRight] = useState("OPD");
  const [courseCycles, setCourseCycles] = useState(1);

  // --- New Features State ---
  const [insurance, setInsurance] = useState("Self pay");
  const [agreement, setAgreement] = useState("agrees"); // "agrees" | "declines"

  // --- Role & Totals ---
  const [currentRole, setCurrentRole] = useState(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return (user.role === 'nurse' ? 'nurse' : 'pharma');
  });
  const isAdmin = JSON.parse(localStorage.getItem('user') || '{}').role === 'admin'; // "pharma" | "nurse"

  // Search & Items
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role;

  const handleRoleSwitch = (newRole) => {
    if (isAdmin || newRole === userRole) {
      setCurrentRole(newRole);
    } else {
      toast.warning("เข้าถึงไม่ได้", `คุณลงชื่อเข้าใช้ในฐานะ${userRole === 'nurse' ? 'พยาบาล' : 'เภสัชกร'} จึงไม่สามารถสลับไปส่วนงานอื่นได้ครับ`);
    }
  };

  // Master Data
  const [doctors, setDoctors] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  const [assessors, setAssessors] = useState([]);

  useEffect(() => {
    getDoctors().then(setDoctors);
    getDiagnoses().then(setDiagnoses);
    getAssessors().then(setAssessors);
  }, []);

  useEffect(() => {
    const s = location.state;
    if (!s) return;

    if (s.editRecord) {
      const r = s.editRecord;
      setHn(r.hn || ""); setVnan(r.vnan || ""); setPatientName(r.patientName || "");
      setDoctorName(r.doctorName || ""); setDiagnosis(r.diagnosis || "");
      setAssessor(r.assessor || ""); setBsa(r.bsa || "");
      setPatientType(r.patientType || "OPD");
      setBillingRight(r.billingRight || r.patientType || "OPD");
      setCourseCycles(r.courseCycles || 1);
      setInsurance(r.insurance || "Self pay");
      setAgreement(r.agreement || "agrees");
      setSelectedItems(r.selectedItems || []);
      setEditingId(r.id);
    } else {
      if (s.hn) setHn(s.hn);
      if (s.patientName) setPatientName(s.patientName);
      if (s.patientType) setPatientType(s.patientType);
      if (s.billingRight) setBillingRight(s.billingRight);
      else if (s.patientType) setBillingRight(s.billingRight);
      if (s.preSelectedItem) handleAddItem(s.preSelectedItem);
    }
  }, [location.state]);

  useEffect(() => {
    searchMedications(searchQuery).then(results => {
      // Filter results based on role, but ALWAYS include Item Sets
      setSearchResults(results.filter(i => {
        if (i.isSet) return true;
        if (currentRole === "pharma") return i.category === "pharma";
        return i.category === "nurse" || i.isPreparation;
      }));
    });
  }, [searchQuery, currentRole]);

  const getPrice = (item) => {
    if (item.isSet && item.items) {
      return item.items.reduce((s, i) => s + (i[billingRight] || i["OPD"] || 0), 0);
    }
    return item[billingRight] || item["OPD"] || 0;
  };

  // --- Main Calculation Engine ---
  const drugItemsOnly = selectedItems.filter(i => (i.category === 'pharma' || !i.category) && !i.isPreparation);
  const nurseItemsOnly = selectedItems.filter(i => i.category === 'nurse' && !i.isPreparation);
  const prepItemsOnly = selectedItems.filter(i => i.isPreparation);

  const drugTotal = drugItemsOnly.reduce((s, i) => s + getPrice(i) * i.quantity, 0);
  const nurseTotal = nurseItemsOnly.reduce((s, i) => s + getPrice(i) * i.quantity, 0);
  const prepTotal = prepItemsOnly.reduce((s, i) => s + getPrice(i) * i.quantity, 0);

  const pharmaTotal = drugTotal; // Medications are pharma
  const grandTotal = drugTotal + nurseTotal + prepTotal;
  const totalCourse = grandTotal * courseCycles;

  const pharmaItems = selectedItems.filter(i => i.category === "pharma" || !i.category);
  const nurseItems = selectedItems.filter(i => i.category === "nurse");

  const fmt = (v) => new Intl.NumberFormat("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(v);

  const handleAddItem = (item) => {
    if (item.isSet && item.items) {
      const instanceId = Date.now().toString() + Math.random();
      const exploded = item.items.map(subItem => ({
        ...subItem,
        id: Date.now().toString() + Math.random(),
        quantity: subItem.quantity || 1,
        dose: "",
        setInstanceId: instanceId,
        parentSetName: item.Common_name
      }));
      setSelectedItems(prev => [...prev, ...exploded]);
      toast.success(`เพิ่มชุดรายการ ${item.itemCode} แล้ว (${item.items.length} รายการ)`);
    } else {
      setSelectedItems(prev => [...prev, { ...item, id: Date.now().toString() + Math.random(), quantity: 1, dose: "" }]);
    }
    setSearchQuery("");
  };

  const updateQuantity = (id, d) => setSelectedItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + d) } : i));
  const updateGroupQuantity = (gid, d) => {
    setSelectedItems(prev => prev.map(i => i.setInstanceId === gid ? { ...i, quantity: Math.max(1, i.quantity + d) } : i));
  };
  const updateDose = (id, dose) => setSelectedItems(prev => prev.map(i => i.id === id ? { ...i, dose } : i));
  const removeItem = (id) => setSelectedItems(prev => prev.filter(i => i.id !== id));
  const removeGroup = (gid) => setSelectedItems(prev => prev.filter(i => i.setInstanceId !== gid));

  const renderTable = (items, t) => {
    // Sort items so sets stay together
    const sortedItems = [...items].sort((a, b) => {
      if (a.setInstanceId && b.setInstanceId) return a.setInstanceId.localeCompare(b.setInstanceId);
      if (a.setInstanceId) return -1;
      if (b.setInstanceId) return 1;
      return 0;
    });

    const groups = [];
    let currentGid = null;
    sortedItems.forEach(item => {
      if (item.setInstanceId) {
        if (item.setInstanceId !== currentGid) {
          groups.push({ isGroupHeader: true, gid: item.setInstanceId, name: item.parentSetName, qty: item.quantity });
          currentGid = item.setInstanceId;
        }
      } else {
        currentGid = null;
      }
      groups.push(item);
    });

    return (
      <table className="w-full text-[0.7rem] border-collapse mb-2">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="py-2 text-left text-[0.6rem] font-bold text-slate-400 uppercase">รายการ</th>
            <th className="py-2 text-center text-[0.6rem] font-bold text-slate-400 uppercase w-[60px]">Dose</th>
            <th className="py-2 text-center text-[0.6rem] font-bold text-slate-400 uppercase w-[80px]">QTY</th>
            <th className="py-2 text-right text-[0.6rem] font-bold text-slate-400 uppercase w-[100px]">รวม</th>
            <th className="py-2 text-center text-[0.6rem] font-bold text-slate-400 uppercase w-[40px] no-print"></th>
          </tr>
        </thead>
        <tbody>
          {groups.map((i, idx) => {
            if (i.isGroupHeader) {
              return (
                <tr key={i.gid} className="bg-slate-50/50 group/set">
                  <td colSpan="2" className="py-2 px-2">
                    <div className="flex items-center">
                      <span className="bg-indigo-600 text-white text-[0.55rem] font-black px-1.5 py-0.5 rounded mr-2 uppercase shadow-sm">Set</span>
                      <span className="font-bold text-indigo-900">{i.name}</span>
                    </div>
                  </td>
                  <td className="py-2 text-center">
                    <div className="flex items-center justify-center gap-1 no-print">
                      <button onClick={() => updateGroupQuantity(i.gid, -1)} className="bg-white border border-slate-200 rounded p-0.5 text-indigo-400 hover:bg-indigo-50"><Minus size={10} /></button>
                      <span className="w-6 text-center font-black text-indigo-700">{i.qty}</span>
                      <button onClick={() => updateGroupQuantity(i.gid, 1)} className="bg-white border border-slate-200 rounded p-0.5 text-indigo-400 hover:bg-indigo-50"><Plus size={10} /></button>
                    </div>
                    <span className="hidden print:block text-center font-bold text-indigo-900">{i.qty} ชุด</span>
                  </td>
                  <td className="py-2 text-right font-black text-indigo-900 px-2"></td>
                  <td className="py-2 text-center no-print">
                    <button onClick={() => removeGroup(i.gid)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            }
            return (
              <tr key={i.id} className={`border-b border-slate-50 hover:bg-slate-50/30 transition-colors ${i.setInstanceId ? 'bg-indigo-50/10' : ''}`}>
                <td className={`py-2 ${i.setInstanceId ? 'pl-8' : 'px-2'}`}>
                  <div className="font-bold text-slate-800 text-[0.7rem]">{i.Common_name}</div>
                  <div className="text-[0.55rem] text-slate-400 font-mono no-print">{i.itemCode}</div>
                </td>
                <td className="py-2 text-center">
                  <input 
                    type="text" 
                    value={i.dose || ""} 
                    onChange={(e) => updateDose(i.id, e.target.value)}
                    placeholder="-"
                    className="w-full text-center bg-transparent border-b border-transparent focus:border-blue-300 focus:outline-none text-[0.7rem] font-bold text-blue-600 no-print"
                  />
                  <span className="hidden print:inline font-bold">{i.dose || "-"}</span>
                </td>
                <td className="py-2">
                  <div className="flex items-center justify-center gap-1 no-print">
                    {!i.setInstanceId && <button onClick={() => updateQuantity(i.id, -1)} className="text-slate-300 hover:text-slate-500"><Minus size={12} /></button>}
                    <span className="w-4 text-center font-bold text-slate-700">{i.quantity}</span>
                    {!i.setInstanceId && <button onClick={() => updateQuantity(i.id, 1)} className="text-slate-300 hover:text-slate-500"><Plus size={12} /></button>}
                  </div>
                  <span className="hidden print:block text-center font-bold">{i.quantity}</span>
                </td>
                <td className="py-2 text-right pr-2">
                  <div className="font-black text-slate-900">{fmt(getPrice(i) * i.quantity)}</div>
                  <div className="text-[0.55rem] text-slate-400 no-print">@{fmt(getPrice(i))}</div>
                </td>
                <td className="py-2 text-center no-print">
                  {!i.setInstanceId && (
                    <button onClick={() => removeItem(i.id)} className="text-slate-200 hover:text-red-400 transition-colors">
                      <X size={14} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  const handleSave = async (isSilent = false) => {
    if (grandTotal === 0 && selectedItems.length === 0) { toast.warning("กรุณาเพิ่มรายการ"); return null; }
    try {
      let finalItems = [...selectedItems];
      const recordId = editingId || Date.now().toString();
      
      // --- Concurrency Merge Logic ---
      if (editingId) {
        const latest = await getEstimationById(editingId);
        if (latest) {
          // Merge items from the OTHER role to prevent overwriting
          if (currentRole === "pharma") {
            // I am pharma: Take my pharma items, keep nurse items from DB
            const latestNurse = latest.selectedItems.filter(i => i.category === "nurse");
            const myPharma = selectedItems.filter(i => i.category === "pharma" || !i.category);
            finalItems = [...myPharma, ...latestNurse];
          } else {
            // I am nurse: Take my nurse items, keep pharma items from DB
            const latestPharma = latest.selectedItems.filter(i => i.category === "pharma" || !i.category);
            const myNurse = selectedItems.filter(i => i.category === "nurse");
            finalItems = [...latestPharma, ...myNurse];
          }
        }
      }

      // --- Smart Status Logic ---
      const hasPharma = finalItems.some(i => i.category === "pharma" || !i.category);
      const hasNurse = finalItems.some(i => i.category === "nurse");
      const status = (hasPharma && hasNurse) ? "สมบูรณ์" : (hasPharma ? "รอพยาบาล" : "รอเภสัช");

      // Recalculate totals based on merged items (Strictly by category)
      const pTotal = finalItems.filter(i => (i.category === "pharma" || !i.category) && !i.isPreparation).reduce((s, i) => s + getPrice(i) * i.quantity, 0);
      const nTotal = finalItems.filter(i => i.category === "nurse" && !i.isPreparation).reduce((s, i) => s + getPrice(i) * i.quantity, 0);
      const prpTotal = finalItems.filter(i => i.isPreparation).reduce((s, i) => s + getPrice(i) * i.quantity, 0);
      const gTotal = pTotal + nTotal + prpTotal;

      const record = {
        id: recordId,
        savedAt: new Date().toISOString(),
        hn, vnan, patientName, doctorName, diagnosis, assessor, bsa,
        patientType, billingRight, insurance, agreement, 
        prepFeeTotal: prpTotal, 
        courseCycles, 
        selectedItems: finalItems,
        pharmaTotal: pTotal, nurseTotal: nTotal, grandTotal: gTotal, totalCourse: gTotal * courseCycles,
        status,
        lastUpdatedBy: currentRole
      };

      if (editingId) await updateEstimation(editingId, record);
      else await saveEstimation(record);

      toast.success(status === "สมบูรณ์" ? "บันทึกข้อมูลสมบูรณ์" : `บันทึกแล้ว (${status})`);
      
      if (!isSilent) {
        if (!editingId) navigate("/patients");
        else setSelectedItems(finalItems);
      } else {
        if (!editingId) setEditingId(recordId); // Set ID so subsequent prints update the same record
        setSelectedItems(finalItems);
      }
      return recordId;
    } catch (e) { 
      toast.error("เกิดข้อผิดพลาด"); 
      return null;
    }
  };

  const handleSaveAndPrint = async () => {
    const savedId = await handleSave(true);
    if (savedId) {
      setTimeout(() => window.print(), 800);
    }
  };

  const lblCls = "block text-[0.65rem] font-black text-slate-400 mb-1 uppercase tracking-wider";
  const inputCls = "w-full border border-slate-200 rounded-lg py-2 px-3 text-slate-900 text-sm focus:outline-none focus:border-blue-500";

  return (
    <>
      <style>{`@media print{@page{size:A4;margin:10mm;}body *{visibility:hidden!important;}#print-area,#print-area *{visibility:visible!important;}#print-area{position:fixed;top:0;left:0;width:100%;}.no-print{display:none!important;}}`}</style>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1400px] mx-auto pb-10">

        {/* Left Side */}
        <div className="lg:col-span-5 flex flex-col gap-5 no-print">

          {/* Role Switcher */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-1 rounded-2xl shadow-lg">
            <div className="flex bg-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
              <button 
                onClick={() => handleRoleSwitch("pharma")} 
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-black transition-all ${currentRole === "pharma" ? "bg-white text-blue-700 shadow-xl" : "text-white/60 hover:bg-white/5"} ${(!isAdmin && userRole === 'nurse') ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Pill size={18} /> เภสัชกร
              </button>
              <button 
                onClick={() => handleRoleSwitch("nurse")} 
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-black transition-all ${currentRole === "nurse" ? "bg-white text-indigo-700 shadow-xl" : "text-white/60 hover:bg-white/5"} ${(!isAdmin && userRole === 'pharma') ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Stethoscope size={18} /> พยาบาล
              </button>
            </div>
          </div>

          {/* Setup Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-[0.65rem] font-black mb-4 flex items-center gap-2 text-slate-400 uppercase tracking-[0.2em]">
              <UserRound size={14} /> ข้อมูลเบื้องต้น
            </h2>

            <div className="space-y-4">

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-50">
                <div><label className={lblCls}>HN</label><input className={inputCls} value={hn} onChange={e => setHn(e.target.value)} /></div>
                <div><label className={lblCls}>VN / AN</label><input className={inputCls} value={vnan} onChange={e => setVnan(e.target.value)} /></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-1"><label className={lblCls}>ชื่อผู้ป่วย</label><input className={inputCls} value={patientName} onChange={e => setPatientName(e.target.value)} /></div>
                <div>
                  <label className={lblCls}>ประเภทผู้ป่วย</label>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
                    {["OPD", "IPD"].map(t => (
                      <button key={t} onClick={() => setPatientType(t)} className={`py-1 rounded text-[0.6rem] font-black transition-all ${patientType === t ? "bg-white text-blue-700 shadow-sm" : "text-slate-400"}`}>{t}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ปรับแก้ 1: เพิ่มสิทธิที่ใช้ (Insurance) ตรงนี้ */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lblCls}>ประเภทราคา (Pricing Right)</label>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
                    {["OPD", "IPD", "OPDTR", "IPDTR"].map(r => (
                      <button key={r} onClick={() => setBillingRight(r)} className={`py-1 rounded text-[0.6rem] font-black transition-all ${billingRight === r ? "bg-white text-blue-700 shadow-sm" : "text-slate-400"}`}>{r}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={lblCls}>สิทธิที่ใช้ (Insurance)</label>
                  <select className={inputCls} value={insurance} onChange={e => setInsurance(e.target.value)}>
                    <option value="Self pay">Self pay</option>
                    <option value="ประกันไทย">ประกันไทย</option>
                    <option value="ประกันต่างชาติ">ประกันต่างชาติ</option>
                    <option value="ประกันสังคม">ประกันสังคม</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div><label className={lblCls}>ผู้ประเมิน</label><select className={inputCls} value={assessor} onChange={e => setAssessor(e.target.value)}><option value="">-- เลือก --</option>{assessors.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
                <div><label className={lblCls}>แพทย์</label><select className={inputCls} value={doctorName} onChange={e => setDoctorName(e.target.value)}><option value="">-- เลือก --</option>{doctors.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className={lblCls}>Diagnosis</label>
                    <button 
                      onClick={async () => {
                        const name = window.prompt("ระบุชื่อโรค/Diagnosis ใหม่:");
                        if (name) {
                          await addNewDiagnosis(name);
                          getDiagnoses().then(setDiagnoses);
                          setDiagnosis(name);
                          toast.success("เพิ่มโรคใหม่เรียบร้อย");
                        }
                      }}
                      className="text-[0.6rem] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                    >
                      <Plus size={10} /> เพิ่มใหม่
                    </button>
                  </div>
                  <select className={inputCls} value={diagnosis} onChange={e => setDiagnosis(e.target.value)}>
                    <option value="">-- เลือก --</option>
                    {diagnoses.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* ปรับแก้ 2: เพิ่มการตกลงรักษา */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lblCls}>BSA (m²)</label>
                  <input type="number" className={inputCls} value={bsa} onChange={e => setBsa(e.target.value)} />
                </div>
                <div>
                  <label className={lblCls}>ผป. ตกลงรักษาไหม?</label>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                      <input type="radio" value="agrees" checked={agreement === "agrees"} onChange={e => setAgreement(e.target.value)} className="w-3.5 h-3.5 text-blue-600" />
                      ตกลง
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                      <input type="radio" value="declines" checked={agreement === "declines"} onChange={e => setAgreement(e.target.value)} className="w-3.5 h-3.5 text-blue-600" />
                      ไม่ตกลง
                    </label>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Search Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Search size={14} /> ค้นหารายการละเอียด ({currentRole === "pharma" ? "ยา" : "ค่าบริการ"})
              </h2>
              <button 
                onClick={() => navigate('/add-item', { state: { fromEstimator: true } })}
                className="text-[0.6rem] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-md hover:bg-rose-100 flex items-center gap-1 transition-colors"
              >
                <Plus size={10} /> เพิ่มยา/รายการใหม่
              </button>
            </div>
            <div className="relative">
              <input type="text" className="w-full border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500" placeholder="ค้นหา..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl mt-2 max-h-[250px] overflow-y-auto z-50 shadow-2xl divide-y">
                  {searchResults.map(item => (
                    <div key={item.itemCode} className="p-3 cursor-pointer flex justify-between items-center hover:bg-blue-50" onClick={() => handleAddItem(item)}>
                      <div className="flex-1 pr-4">
                        <div className="font-bold text-slate-800 text-xs">
                          {item.Common_name}
                          {item.isSet && <span className="ml-2 px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded text-[0.5rem] font-black uppercase tracking-tighter">ITEM SET</span>}
                        </div>
                        <div className="text-[0.55rem] text-slate-400 font-mono">{item.itemCode}</div>
                      </div>
                      <div className="text-right font-black text-blue-600 text-xs">{fmt(getPrice(item))}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Preview Panel */}
        <div id="print-area" className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm min-h-[700px] flex flex-col relative overflow-hidden">

            {/* Header */}
            <div className="flex justify-between items-start mb-6 border-b-2 border-slate-100 pb-5">
              <div className="flex items-center gap-4">
                <img src="/logo.png" alt="Logo" className="h-12 w-auto" />
                <div>
                  <h1 className="text-xl font-black text-[#0F294D]">ใบประมาณการค่าใช้จ่าย</h1>
                  <p className="text-[0.6rem] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Collaborative Cost Estimation</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[0.6rem] text-slate-400 font-bold mt-2 font-mono">{billingRight} | {new Date().toLocaleDateString("th-TH")}</div>
              </div>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-x-12 gap-y-2 mb-6 text-[0.8rem]">
              <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-400">HN:</span><span className="font-black">{hn || "-"}</span></div>
              <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-400">VN/AN:</span><span className="font-black">{vnan || "-"}</span></div>
              <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-400">ชื่อผู้ป่วย:</span><span className="font-black">{patientName || "-"}</span></div>
              <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-400">ประเภทผู้ป่วย:</span><span className="font-black">{patientType || "-"}</span></div>
              <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-400">ผู้ประเมิน:</span><span className="font-black">{assessor || "-"}</span></div>
              <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-400">แพทย์:</span><span className="font-black">{doctorName || "-"}</span></div>
              <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-400">Diagnosis:</span><span className="font-black">{diagnosis || "-"}</span></div>
              <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-400">สิทธิที่ใช้:</span><span className="font-black">{insurance}</span></div>
              <div className="flex justify-between border-b border-slate-50 pb-1">
                <span className="text-slate-400">การตกลงรักษา:</span>
                <span className={`font-black ${agreement === "agrees" ? "text-green-600" : "text-red-500"}`}>{agreement === "agrees" ? "ตกลงรักษา" : "ไม่ตกลง"}</span>
              </div>
            </div>

            {/* Summary Sections */}
            <div className="flex-1 space-y-5">
              {/* Pharma Part */}
              <div className={`rounded-2xl border transition-all bg-white border-blue-200`}>
                <div className="flex justify-between items-center px-4 py-2 border-b border-inherit bg-blue-50/50 rounded-t-2xl">
                  <span className="text-[0.65rem] font-black text-blue-700 uppercase flex items-center gap-2"><Pill size={14} /> ส่วนงานเภสัชกรรม</span>
                  <span className="text-xs font-black text-blue-900">{fmt(pharmaTotal)}</span>
                </div>
                <div className="p-4">
                  {pharmaItems.length > 0 ? renderTable(pharmaItems, billingRight, "") : <div className="text-center py-4 text-[0.65rem] font-bold text-slate-300">ไม่มีรายการยา</div>}
                </div>
              </div>

              {/* Nurse Part */}
              <div className={`rounded-2xl border transition-all bg-white border-indigo-200`}>
                <div className="flex justify-between items-center px-4 py-2 border-b border-inherit bg-indigo-50/50 rounded-t-2xl">
                  <span className="text-[0.65rem] font-black text-indigo-700 uppercase flex items-center gap-2"><Stethoscope size={14} /> ส่วนงานพยาบาลและบริการ</span>
                  <span className="text-xs font-black text-indigo-900">{fmt(nurseTotal)}</span>
                </div>
                <div className="p-4">
                  {nurseItems.length > 0 ? renderTable(nurseItems, billingRight, "") : <div className="text-center py-4 text-[0.65rem] font-bold text-slate-300">ไม่มีรายการบริการ</div>}
                </div>
              </div>
            </div>

            {/* Sum Section */}
            {grandTotal > 0 && (
              <div className="mt-8 pt-6 border-t-2 border-slate-100">

                {/* Sub-summaries matching Excel structure */}
                <div className="space-y-2 mb-6 px-1 border-b border-slate-100 pb-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">รวมราคายา / cycle</span>
                    <span className="font-bold text-slate-700">{fmt(drugTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">ค่าตู้ + เวชภัณฑ์ + ค่าเตรียมยา</span>
                    <span className="font-bold text-slate-700">{fmt(prepTotal)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-5 px-1">
                  <div className="flex flex-col">
                    <span className="text-[0.65rem] font-black text-slate-400 uppercase">Estimated Total</span>
                    <span className="text-xs font-bold text-slate-700">ประมาณการยอดรวมทั้งสิ้นต่อรอบ</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[0.6rem] font-bold text-slate-400 uppercase">{courseCycles} Cycles ×</span>
                    <span className="text-4xl font-black text-[#0F294D] font-mono tracking-tighter">{fmt(grandTotal)}</span>
                    <span className="text-xs font-bold text-slate-400">THB</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 no-print">
                  <button onClick={() => handleSave()} className="bg-white text-slate-900 py-3 rounded-xl font-black text-xs uppercase hover:bg-slate-50 border-2 border-slate-100 shadow-sm active:scale-95">
                    {editingId ? "อัปเดตข้อมูล" : (currentRole === "pharma" ? "บันทึกและส่งต่อพยาบาล" : "บันทึกและส่งต่อเภสัช")}
                  </button>
                  <button onClick={handleSaveAndPrint} className="bg-[#0F294D] text-white py-3 rounded-xl font-black text-xs uppercase hover:bg-slate-800 transition-all shadow-lg active:scale-95">บันทึกและพิมพ์ใบประเมินราคา</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
